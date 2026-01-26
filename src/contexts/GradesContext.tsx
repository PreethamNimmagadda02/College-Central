import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { Semester, ExtractionConfidence } from '@/types';

import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { getGoogleGenAI } from '@lib/utils/lazyImports';
import { logActivity } from '@services/activityService';
import useGradingScale from '@hooks/useGradingScale';

/**
 * GradesContext handles academic grade data with intelligent retake logic:
 *
 * - Stores ALL grade instances including retakes in their respective semesters
 * - Displays the CGPA exactly as shown on the grade sheet (no recalculation)
 * - Recalculates totalCredits using only the latest grade for each course
 * - Only counts credits from passed courses (grade != 'F') in totalCredits
 * - Analytics and displays use only the most recent grade for each course
 * - Multi-pass extraction with consensus voting for maximum accuracy
 */

export interface GradesData {
  semesters: Semester[];
  cgpa: number;
  totalCredits: number; // Sum of credits from all unique courses
  earnedCredits: number; // Sum of credits from unique passed courses (grade != 'F')
  gradeSheetUrl?: string; // Firebase Storage URL for the uploaded grade sheet
  gradeSheetFileName?: string; // Original filename
  extractionConfidence?: ExtractionConfidence; // Confidence metadata from extraction
}

// Helper function to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const commaIndex = result.indexOf(',');
        if (commaIndex !== -1) {
          resolve(result.substring(commaIndex + 1));
        } else {
          reject(new Error('Invalid data URL format while reading file.'));
        }
      } else {
        reject(new Error('Unexpected FileReader result type.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

interface GradesContextType {
  gradesData: GradesData | null;
  setGradesData: (data: GradesData | null) => Promise<void>;
  loading: boolean;
  isProcessing: boolean;
  error: string | null;
  selectedFile: File | null;
  imagePreview: string | null;
  selectFile: (file: File | null) => void;
  processGrades: () => Promise<void>;
  resetGradesState: () => Promise<void>;
}

const GradesContext = createContext<GradesContextType | undefined>(undefined);

export const GradesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { gradePoints: adminGradePoints, gradeOptions } = useGradingScale();
  const [gradesData, setGradesDataState] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);

  // State for the extraction process
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFileState] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    if (currentUser) {
      setLoading(true);
      const userDocRef = db.collection('users').doc(currentUser.uid);

      // OPTIMIZATION: First load from Firestore cache for instant UI
      userDocRef
        .get({ source: 'cache' })
        .then((docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data?.gradesData) {
              setGradesDataState(data.gradesData as GradesData);
              setLoading(false); // Show cached data immediately
            }
          }
        })
        .catch(() => {
          // Cache miss expected on first load
        });

      // Then subscribe for real-time updates
      unsubscribe = userDocRef.onSnapshot(
        { includeMetadataChanges: false },
        (docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data && data.gradesData) {
              setGradesDataState(data.gradesData as GradesData);
            } else {
              setGradesDataState(null);
            }
          } else {
            setGradesDataState(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error loading grades data:', error);
          setError('Failed to load grades data. Please try again.');
          setGradesDataState(null);
          setLoading(false);
        }
      );
    } else {
      setGradesDataState(null);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const setGradesData = useCallback(
    async (data: GradesData | null) => {
      if (currentUser) {
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({ gradesData: data });
        } catch (error) {
          console.error('Error updating grades data:', error);
          setError('Failed to save grades data. Please try again.');
          throw error;
        }
      }
    },
    [currentUser]
  );

  const selectFile = useCallback((file: File | null) => {
    if (file) {
      setSelectedFileState(file);
      setError(null);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setSelectedFileState(null);
      setImagePreview(null);
    }
  }, []);

  const processGrades = useCallback(async () => {
    if (!selectedFile || !currentUser) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const storage = firebase.storage();

      // Delete old grade sheet from storage if it exists
      if (gradesData?.gradeSheetUrl) {
        try {
          const oldFileRef = storage.refFromURL(gradesData.gradeSheetUrl);
          await oldFileRef.delete();
        } catch (deleteError) {
          // Continue even if deletion fails (file might already be deleted)
        }
      }

      // Upload new file to Firebase Storage
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const storagePath = `gradeSheets/${currentUser.uid}/${timestamp}.${fileExtension}`;
      const storageRef = storage.ref(storagePath);

      await storageRef.put(selectedFile);
      const gradeSheetUrl = await storageRef.getDownloadURL();

      const base64Data = await fileToBase64(selectedFile);

      // Lazy load Google GenAI
      const { GoogleGenAI, Type } = await getGoogleGenAI();
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const schema = {
        type: Type.OBJECT,
        properties: {
          cgpa: {
            type: Type.NUMBER,
            description: 'The overall CGPA as shown on the grade sheet.',
          },
          totalCredits: {
            type: Type.NUMBER,
            description: 'The total number of credits.',
          },
          semesters: {
            type: Type.ARRAY,
            description: 'An array of semesters, from latest to oldest.',
            items: {
              type: Type.OBJECT,
              properties: {
                semester: { type: Type.NUMBER, description: 'The semester number.' },
                sessionYear: { type: Type.STRING, description: 'Academic session year (YYYY-YYYY).' },
                sessionType: { type: Type.STRING, description: 'Monsoon, Winter, or Summer.' },
                sgpa: { type: Type.NUMBER, description: 'The SGPA for this semester.' },
                cgpa: { type: Type.NUMBER, description: 'Cumulative CGPA up to this semester.' },
                grades: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subjectCode: { type: Type.STRING, description: 'Course code.' },
                      subjectName: { type: Type.STRING, description: 'Full course name.' },
                      credits: { type: Type.NUMBER, description: 'Course credits.' },
                      grade: { type: Type.STRING, description: 'Letter grade (e.g., A, B+, EX).' },
                    },
                    required: ['subjectCode', 'subjectName', 'credits', 'grade'],
                  },
                },
              },
              required: ['semester', 'sessionYear', 'sessionType', 'sgpa', 'cgpa', 'grades'],
            },
          },
        },
        required: ['cgpa', 'totalCredits', 'semesters'],
      };

      const gradePointMap: { [key: string]: number } = {
        ...adminGradePoints,
        'EX': -1, 'I': -1, 'W': -1, 'P': -1 // Special grades excluded from calculation
      };

      // Common OCR error corrections
      const ocrCorrections: { [key: string]: string } = {
        '0': 'O', 'o': 'O', // Zero to O (though O is typically not valid)
        '8': 'B', // 8 misread as B
        '4': 'A', // 4 misread as A
        'AT': 'A+', 'A T': 'A+', 'A1': 'A+',
        'BT': 'B+', 'B T': 'B+', 'B1': 'B+',
        'CT': 'C+', 'C T': 'C+', 'C1': 'C+',
      };

      // Function to normalize a grade string
      const normalizeGrade = (grade: string): string => {
        let normalized = grade?.toString().trim().toUpperCase() || '';
        // Apply OCR corrections
        const correction = ocrCorrections[normalized];
        if (correction) {
          normalized = correction;
        }
        // Handle common patterns
        normalized = normalized.replace(/\s+/g, ''); // Remove spaces
        normalized = normalized.replace(/\+$/, '+'); // Ensure + is at end
        return normalized;
      };

      // Function to calculate SGPA for a set of grades
      const calculateSGPA = (grades: { grade: string; credits: number }[]): number => {
        const validGrades = grades.filter(g => {
          const points = gradePointMap[g.grade];
          return points !== undefined && points >= 0;
        });
        if (validGrades.length === 0) return 0;
        const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);
        const totalPoints = validGrades.reduce((sum, g) => sum + (gradePointMap[g.grade] ?? 0) * g.credits, 0);
        return totalCredits > 0 ? totalPoints / totalCredits : 0;
      };

      // Function to perform a single extraction pass
      const performExtraction = async (passNumber: number): Promise<any> => {
        const promptVariations = [
          `Analyze this grade sheet and extract academic data with maximum precision.

GRADE READING RULES (CRITICAL):
- Valid grades: ${gradeOptions.join(', ')}, EX, I, W, P
- 'A' has open triangular top, 'B' has two closed bumps on right
- '+' is a small superscript character (check carefully for C+ vs C, B+ vs B)
- 'D' has vertical left side, distinct from 'O' which is round
- Read from the GRADE column only, not credits or grade points column

VALIDATION:
- Verify each semester's grades produce the shown SGPA (grade points × credits / total credits)
- Grade points: ${Object.entries(adminGradePoints).map(([g, p]) => `${g}=${p}`).join(', ')}
- If calculated SGPA differs from shown SGPA, re-check the grades

EXTRACT:
- Overall CGPA exactly as shown
- Each semester: number, session year (YYYY-YYYY), session type (Monsoon/Winter/Summer), SGPA, CGPA
- Each course: subject code, full name, credits (integer), exact grade letter(s)

Include ALL instances including retakes. Double-check before finalizing.`,

          `Extract all academic data from this grade sheet image with high accuracy.

CRITICAL CHECKS:
- Valid letter grades: ${gradeOptions.join(', ')}, EX, I, W, P
- Distinguish carefully: A vs 4, B vs 8, O vs 0, D vs O
- Look for '+' suffix carefully (A+ B+ C+ are different from A B C)
- Read grades from the GRADE column, not from grade points column

SELF-VALIDATION:
- For each semester, verify: SGPA ≈ Σ(grade_points × credits) / Σ(credits)
- Grade point values: ${Object.entries(adminGradePoints).map(([g, p]) => `${g}=${p}`).join(', ')}
- If your calculation differs significantly from shown SGPA, re-examine the grades

Extract ALL semesters with semester number, year, type, SGPA, CGPA, and all courses.
Include retakes. Return exact values as shown on the document.`
        ];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              { text: promptVariations[passNumber % promptVariations.length] },
              { inlineData: { mimeType: selectedFile.type, data: base64Data } },
            ],
          },
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        interface AIResponse { text?: string | (() => string); }
        const rawText = (response as AIResponse)?.text;
        const text = typeof rawText === 'string' ? rawText : typeof rawText === 'function' ? rawText() : '';
        if (!text) throw new Error('AI response was empty');
        return JSON.parse(text.trim());
      };

      // ===== MULTI-PASS EXTRACTION WITH CONSENSUS =====
      const MAX_PASSES = 2;
      const MAX_RETRIES = 2;
      const SGPA_TOLERANCE = 0.15; // Stricter threshold

      let allPasses: any[] = [];
      let retryCount = 0;
      let bestResult: any = null;
      let consensusReached = false;
      const lowConfidenceGrades: { semester: number; subjectCode: string; extractedGrade: string; reason: string }[] = [];
      const semesterConfidences: { semester: number; confidence: number; sgpaMismatch?: number }[] = [];

      // Perform multiple extraction passes
      const passPromises = Array.from({ length: MAX_PASSES }, async (_, pass) => {
        try {
          //console.log(`[Extraction] Pass ${pass + 1}/${MAX_PASSES}`);
          return await performExtraction(pass);
        } catch (passError) {
          console.warn(`[Extraction] Pass ${pass + 1} failed:`, passError);
          return null;
        }
      });

      const results = await Promise.all(passPromises);
      const successfulPasses = results.filter((result) => result !== null);
      allPasses.push(...successfulPasses);

      if (allPasses.length === 0) {
        throw new Error('All extraction passes failed');
      }

      // Use first successful pass as base
      bestResult = allPasses[0];

      // ===== CONSENSUS VOTING FOR GRADES =====
      if (allPasses.length > 1) {
        bestResult.semesters = bestResult.semesters.map((sem: any, semIdx: number) => {
          const otherSem = allPasses[1]?.semesters?.[semIdx];

          sem.grades = sem.grades.map((grade: any, gradeIdx: number) => {
            const grade1 = normalizeGrade(grade.grade);
            const grade2 = otherSem?.grades?.[gradeIdx]?.grade
              ? normalizeGrade(otherSem.grades[gradeIdx].grade)
              : grade1;

            // Check if passes agree
            if (grade1 !== grade2) {
              // Grades don't match - flag as low confidence
              lowConfidenceGrades.push({
                semester: sem.semester,
                subjectCode: grade.subjectCode,
                extractedGrade: grade1,
                reason: `Passes disagree: "${grade1}" vs "${grade2}"`,
              });
              // Prefer the grade that's in the valid grade list
              if (gradePointMap[grade1] !== undefined) {
                return { ...grade, grade: grade1 };
              } else if (gradePointMap[grade2] !== undefined) {
                return { ...grade, grade: grade2 };
              }
            }
            return { ...grade, grade: grade1 };
          });
          return sem;
        });
        consensusReached = lowConfidenceGrades.length === 0;
      }

      // ===== STRICTER VALIDATION WITH AUTO-RETRY =====
      let needsRetry = false;

      bestResult.semesters = bestResult.semesters.map((sem: any) => {
        // Normalize all grades
        sem.grades = sem.grades.map((g: any) => ({
          ...g,
          grade: normalizeGrade(g.grade),
          credits: g.credits, // Keep credits as extracted
        }));

        // Validate against unknown grades
        sem.grades.forEach((g: any) => {
          if (gradePointMap[g.grade] === undefined && !['EX', 'I', 'W', 'P'].includes(g.grade)) {
            lowConfidenceGrades.push({
              semester: sem.semester,
              subjectCode: g.subjectCode,
              extractedGrade: g.grade,
              reason: `Unknown grade "${g.grade}" - not in grading scale`,
            });
          }
        });

        // Calculate SGPA and compare
        const calculatedSGPA = calculateSGPA(sem.grades);
        const sgpaMismatch = Math.abs(calculatedSGPA - sem.sgpa);

        semesterConfidences.push({
          semester: sem.semester,
          confidence: sgpaMismatch <= SGPA_TOLERANCE ? 1 : Math.max(0, 1 - sgpaMismatch),
          sgpaMismatch: parseFloat(sgpaMismatch.toFixed(3)),
        });

        if (sgpaMismatch > SGPA_TOLERANCE) {
          console.warn(`Semester ${sem.semester}: SGPA mismatch - extracted ${sem.sgpa}, calculated ${calculatedSGPA.toFixed(2)} (diff: ${sgpaMismatch.toFixed(2)})`);
          needsRetry = true;

          // Find which grades might be wrong by trying alternatives
          sem.grades.forEach((g: any) => {
            const currentPoints = gradePointMap[g.grade];
            if (currentPoints !== undefined && currentPoints >= 0) {
              // Check if changing this grade would help
              const similarGrades = Object.keys(gradePointMap).filter(
                grade => Math.abs((gradePointMap[grade] ?? 0) - currentPoints) === 1
              );
              if (similarGrades.length > 0) {
                lowConfidenceGrades.push({
                  semester: sem.semester,
                  subjectCode: g.subjectCode,
                  extractedGrade: g.grade,
                  reason: `SGPA mismatch (${sgpaMismatch.toFixed(2)}) - verify grade`,
                });
              }
            }
          });
        }

        return sem;
      });

      // ===== AUTO-RETRY ON SIGNIFICANT MISMATCH =====
      if (needsRetry && retryCount < MAX_RETRIES) {
        retryCount++;
        //console.log(`[Extraction] Retrying due to SGPA mismatch (attempt ${retryCount}/${MAX_RETRIES})`);
        try {
          const retryResult = await performExtraction(MAX_PASSES + retryCount);
          // Check if retry has better SGPA matches
          let retryBetter = true;
          retryResult.semesters.forEach((sem: any, idx: number) => {
            sem.grades = sem.grades.map((g: any) => ({
              ...g,
              grade: normalizeGrade(g.grade),
              credits: g.credits,
            }));
            const retrySGPA = calculateSGPA(sem.grades);
            const originalSGPA = calculateSGPA(bestResult.semesters[idx]?.grades || []);
            const retryMismatch = Math.abs(retrySGPA - sem.sgpa);
            const originalMismatch = Math.abs(originalSGPA - bestResult.semesters[idx]?.sgpa || 0);
            if (retryMismatch > originalMismatch) {
              retryBetter = false;
            }
          });
          if (retryBetter) {
            //console.log('[Extraction] Retry produced better results');
            bestResult = retryResult;
            // Recalculate confidences
            semesterConfidences.length = 0;
            bestResult.semesters.forEach((sem: any) => {
              const calculatedSGPA = calculateSGPA(sem.grades);
              const sgpaMismatch = Math.abs(calculatedSGPA - sem.sgpa);
              semesterConfidences.push({
                semester: sem.semester,
                confidence: sgpaMismatch <= SGPA_TOLERANCE ? 1 : Math.max(0, 1 - sgpaMismatch),
                sgpaMismatch: parseFloat(sgpaMismatch.toFixed(3)),
              });
            });
          }
        } catch (retryError) {
          console.warn('[Extraction] Retry failed:', retryError);
        }
      }

      // ===== CALCULATE OVERALL CONFIDENCE =====
      const overallConfidence = semesterConfidences.length > 0
        ? semesterConfidences.reduce((sum, s) => sum + s.confidence, 0) / semesterConfidences.length
        : 1;

      //console.log(`[Extraction] Complete - Overall confidence: ${(overallConfidence * 100).toFixed(1)}%`);
      //console.log(`[Extraction] Low confidence grades: ${lowConfidenceGrades.length}`);

      // ===== FINALIZE RESULT =====
      // Get latest grades for each course (handles retakes)
      interface CourseData {
        grade: { subjectCode: string; credits: number; grade: string };
        semester: number;
      }
      const courseMap: { [subjectCode: string]: CourseData } = {};
      bestResult.semesters.forEach((sem: any) => {
        sem.grades.forEach((grade: any) => {
          const existing = courseMap[grade.subjectCode];
          if (!existing || sem.semester > existing.semester) {
            courseMap[grade.subjectCode] = { grade, semester: sem.semester };
          }
        });
      });

      // Calculate credits
      let totalCredits = 0;
      let earnedCredits = 0;
      Object.values(courseMap).forEach((courseData) => {
        const grade = courseData.grade;
        const credits = grade.credits || 0;
        totalCredits += credits;
        if (grade.grade !== 'F') {
          earnedCredits += credits;
        }
      });

      bestResult.totalCredits = totalCredits;
      bestResult.earnedCredits = earnedCredits;

      // Add extraction metadata
      const finalResult: GradesData & { extractionConfidence?: any } = {
        ...bestResult,
        gradeSheetUrl,
        gradeSheetFileName: selectedFile.name,
        extractionConfidence: {
          overall: parseFloat(overallConfidence.toFixed(3)),
          perSemester: semesterConfidences,
          lowConfidenceGrades,
          passCount: allPasses.length,
          consensusReached,
        },
      };

      await setGradesData(finalResult);
      await logActivity(currentUser.uid, {
        type: 'grades',
        title: 'Grades Processed',
        description: `Grade sheet processed with ${(overallConfidence * 100).toFixed(0)}% confidence.`,
        icon: '📊',
        link: '/grades',
      });
      selectFile(null);
    } catch (e) {
      console.error('Error processing grade sheet:', e);
      setError(
        'Failed to process the grade sheet. The file might be unclear or in an unsupported format. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, currentUser, gradesData, setGradesData, selectFile, adminGradePoints, gradeOptions]);

  const resetGradesState = useCallback(async () => {
    // Delete grade sheet from storage if it exists
    if (gradesData?.gradeSheetUrl) {
      try {
        const storage = firebase.storage();
        const oldFileRef = storage.refFromURL(gradesData.gradeSheetUrl);
        await oldFileRef.delete();
      } catch (deleteError) {
        // Continue even if deletion fails (file might already be deleted)
        console.warn('Failed to delete old grade sheet from storage:', deleteError);
      }
    }

    if (currentUser) {
      await logActivity(currentUser.uid, {
        type: 'grades',
        title: 'Grades Data Cleared',
        description: 'Your academic performance data has been cleared.',
        icon: '🔄',
        link: '/grades',
      });
    }
    await setGradesData(null);
    selectFile(null);
    setError(null);
  }, [currentUser, gradesData, setGradesData, selectFile]);

  const contextValue = useMemo(
    () => ({
      gradesData,
      setGradesData,
      loading,
      isProcessing,
      error,
      selectedFile,
      imagePreview,
      selectFile,
      processGrades,
      resetGradesState,
    }),
    [
      gradesData,
      loading,
      isProcessing,
      error,
      selectedFile,
      imagePreview,
      setGradesData,
      selectFile,
      processGrades,
      resetGradesState,
    ]
  );

  return <GradesContext.Provider value={contextValue}>{children}</GradesContext.Provider>;
};

export const useGrades = () => {
  const context = useContext(GradesContext);
  if (context === undefined) {
    throw new Error('useGrades must be used within a GradesProvider');
  }
  return context;
};
