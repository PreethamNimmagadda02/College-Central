import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { Semester } from '@/types';

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
 */

export interface GradesData {
  semesters: Semester[];
  cgpa: number;
  totalCredits: number; // Sum of credits from all unique courses
  earnedCredits: number; // Sum of credits from unique passed courses (grade != 'F')
  gradeSheetUrl?: string; // Firebase Storage URL for the uploaded grade sheet
  gradeSheetFileName?: string; // Original filename
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

      let result: Omit<GradesData, 'gradeSheetUrl' | 'gradeSheetFileName'>;

      // Try Gemini first
      try {
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
              description:
                'The total number of credits (will be recalculated based on latest passed courses).',
            },
            semesters: {
              type: Type.ARRAY,
              description: 'An array of semesters, from latest to oldest.',
              items: {
                type: Type.OBJECT,
                properties: {
                  semester: { type: Type.NUMBER, description: 'The semester number (e.g., 4).' },
                  sessionYear: {
                    type: Type.STRING,
                    description: 'The academic session year for the semester (e.g., "2023-2024").',
                  },
                  sessionType: {
                    type: Type.STRING,
                    description:
                      'The type of the semester session (e.g., "Monsoon", "Winter", "Summer").',
                  },
                  sgpa: { type: Type.NUMBER, description: 'The SGPA for this semester.' },
                  cgpa: { type: Type.NUMBER, description: 'The cumulative CGPA up to and including this semester, as shown on the grade sheet.' },
                  grades: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        subjectCode: {
                          type: Type.STRING,
                          description: 'The course code (e.g., CSL201).',
                        },
                        subjectName: {
                          type: Type.STRING,
                          description: 'The full name of the course.',
                        },
                        credits: {
                          type: Type.NUMBER,
                          description: 'The number of credits for the course.',
                        },
                        grade: {
                          type: Type.STRING,
                          description: 'The letter grade received (e.g., A, B, EX).',
                        },
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

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                text: `Analyze this grade sheet document and extract academic data with maximum precision.

                        GRADE READING RULES (CRITICAL):
                        - Valid grades: ${gradeOptions.join(', ')}, EX, I, W, P
                        - 'A' has open triangular top, 'B' has two closed bumps on right
                        - '+' is a small superscript character (check carefully for C+ vs C, B+ vs B)
                        - 'D' has vertical left side, distinct from 'O' which is round
                        - Read from the GRADE column only, not credits or grade points column

                        VALIDATION:
                        - Verify each semester's grades produce the shown SGPA (grade points × credits / total credits)
                        - Grade points: ${Object.entries(adminGradePoints).map(([g, p]) => `${g}=${p}`).join(', ')}
                        - If calculated SGPA differs significantly from shown SGPA, re-check the grades

                        EXTRACT:
                        - Overall CGPA exactly as shown
                        - Each semester: number, session year (YYYY-YYYY), session type (Monsoon/Winter/Summer), SGPA
                        - Each course: subject code, full name, credits (integer), exact grade letter(s)

                        Include ALL instances including retakes. Double-check before finalizing.`,
              },
              { inlineData: { mimeType: selectedFile.type, data: base64Data } },
            ],
          },
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        interface AIResponse {
          text?: string | (() => string);
        }
        const rawText = (response as AIResponse)?.text;
        const text =
          typeof rawText === 'string' ? rawText : typeof rawText === 'function' ? rawText() : '';
        if (!text) {
          throw new Error('AI response was empty or invalid.');
        }
        result = JSON.parse(text.trim());

        // Post-processing: Normalize grades and validate using admin grading scale
        const gradePointMap: { [key: string]: number } = {
          ...adminGradePoints,
          'EX': -1, 'I': -1, 'W': -1, 'P': -1 // Special grades excluded from calculation
        };

        // Normalize and validate each semester
        result.semesters = result.semesters.map((sem: any) => {
          // Normalize grades (trim whitespace, uppercase)
          sem.grades = sem.grades.map((g: any) => ({
            ...g,
            grade: g.grade?.toString().trim().toUpperCase() || g.grade,
            credits: g.credits // Keep credits as extracted (may be decimal)
          }));

          // Validate SGPA if we have enough data
          const validGrades = sem.grades.filter((g: any) => {
            const points = gradePointMap[g.grade];
            return points !== undefined && points >= 0;
          });
          if (validGrades.length > 0) {
            const totalCredits = validGrades.reduce((sum: number, g: any) => sum + g.credits, 0);
            const totalPoints = validGrades.reduce((sum: number, g: any) => {
              const points = gradePointMap[g.grade] ?? 0;
              return sum + (points * g.credits);
            }, 0);
            const calculatedSGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

            // Log warning if significant mismatch (helps debugging)
            if (Math.abs(calculatedSGPA - sem.sgpa) > 0.5) {
              console.warn(`Semester ${sem.semester}: Extracted SGPA ${sem.sgpa}, calculated ${calculatedSGPA.toFixed(2)}`);
            }
          }

          return sem;
        });

      } catch (geminiError) {
        // Re-throw with a user-friendly message
        console.error('Gemini API error:', geminiError);
        throw new Error(
          'Failed to process grade sheet. Please ensure the Gemini API is configured correctly and try again.'
        );
      }

      // Get latest grades for each course (handles retakes)
      interface CourseData {
        grade: { subjectCode: string; credits: number; grade: string };
        semester: number;
      }
      const courseMap: { [subjectCode: string]: CourseData } = {};
      result.semesters.forEach((sem) => {
        sem.grades.forEach((grade) => {
          const existing = courseMap[grade.subjectCode];
          // If course doesn't exist or current semester is later, update it
          if (!existing || sem.semester > existing.semester) {
            courseMap[grade.subjectCode] = {
              grade: grade,
              semester: sem.semester,
            };
          }
        });
      });

      // Calculate totalCredits (all unique courses) and earnedCredits (passed courses only)
      let totalCredits = 0;
      let earnedCredits = 0;

      Object.values(courseMap).forEach((courseData) => {
        const grade = courseData.grade;
        const credits = grade.credits || 0;
        // Total credits includes all unique courses
        totalCredits += credits;
        // Earned credits only includes passed courses (grade != 'F')
        if (grade.grade !== 'F') {
          earnedCredits += credits;
        }
      });

      result.totalCredits = totalCredits;
      result.earnedCredits = earnedCredits;
      // Keep the CGPA as extracted from the grade sheet (don't recalculate)

      // Add grade sheet URL and filename to result
      const finalResult: GradesData = {
        ...result,
        gradeSheetUrl,
        gradeSheetFileName: selectedFile.name,
      };

      await setGradesData(finalResult);
      await logActivity(currentUser.uid, {
        type: 'grades',
        title: 'Grades Processed',
        description: 'Successfully processed and updated your grade sheet using Gemini AI.',
        icon: '📊',
        link: '/grades',
      });
      selectFile(null); // Clear file selection on success
    } catch (e) {
      console.error('Error processing grade sheet:', e);
      setError(
        'Failed to process the grade sheet. The file might be unclear or in an unsupported format. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, currentUser, gradesData, setGradesData, selectFile]);

  const resetGradesState = useCallback(async () => {
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
  }, [currentUser, setGradesData, selectFile]);

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
