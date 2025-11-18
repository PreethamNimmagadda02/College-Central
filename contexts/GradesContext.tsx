import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { Semester } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { logActivity } from '../services/activityService';
import { getGoogleGenAI, getOpenAI } from '../utils/lazyImports';

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
  totalCredits: number;
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
    reader.onerror = error => reject(error);
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
      unsubscribe = userDocRef.onSnapshot(
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

  const setGradesData = useCallback(async (data: GradesData | null) => {
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
  }, [currentUser]);

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
      setError("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        const storage = firebase.storage();

        // Delete old grade sheet from storage if it exists
        if (gradesData?.gradeSheetUrl) {
            console.log('[DEBUG] Attempting to delete old grade sheet:', gradesData.gradeSheetUrl);
            try {
                const oldFileRef = storage.refFromURL(gradesData.gradeSheetUrl);
                console.log('[DEBUG] Got storage reference, calling delete...');
                await oldFileRef.delete();
                console.log('[DEBUG] Old grade sheet deleted successfully!');
            } catch (deleteError) {
                console.error('[DEBUG] Failed to delete old grade sheet:', deleteError);
                // Continue even if deletion fails (file might already be deleted)
            }
        } else {
            console.log('[DEBUG] No existing grade sheet URL found, skipping deletion');
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
        let aiModel = 'Gemini';

        // Try Gemini first
        try {
            // Lazy load Google GenAI
            const { GoogleGenAI, Type } = await getGoogleGenAI();
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            const schema = {
              type: Type.OBJECT,
              properties: {
                cgpa: { type: Type.NUMBER, description: 'The overall CGPA as shown on the grade sheet.' },
                totalCredits: { type: Type.NUMBER, description: 'The total number of credits (will be recalculated based on latest passed courses).' },
                semesters: {
                  type: Type.ARRAY,
                  description: 'An array of semesters, from latest to oldest.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      semester: { type: Type.NUMBER, description: 'The semester number (e.g., 4).' },
                      sessionYear: { type: Type.STRING, description: 'The academic session year for the semester (e.g., "2023-2024").' },
                      sessionType: { type: Type.STRING, description: 'The type of the semester session (e.g., "Monsoon", "Winter", "Summer").' },
                      sgpa: { type: Type.NUMBER, description: 'The SGPA for this semester.' },
                      grades: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            subjectCode: { type: Type.STRING, description: 'The course code (e.g., CSL201).' },
                            subjectName: { type: Type.STRING, description: 'The full name of the course.' },
                            credits: { type: Type.NUMBER, description: 'The number of credits for the course.' },
                            grade: { type: Type.STRING, description: 'The letter grade received (e.g., A, B, EX).' },
                          },
                          required: ['subjectCode', 'subjectName', 'credits', 'grade'],
                        },
                      },
                    },
                    required: ['semester', 'sessionYear', 'sessionType', 'sgpa', 'grades'],
                  },
                },
              },
              required: ['cgpa', 'totalCredits', 'semesters'],
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { text: "Please analyze this document (image or PDF) of a student's grade sheet. Extract the academic performance data and format it according to the provided JSON schema. The data should include the overall CGPA as shown on the grade sheet, and a list of all semesters, starting from the most recent one. For each semester, provide the semester number, the academic session year (e.g., '2023-2024'), the session type (Monsoon, Winter, or Summer), the SGPA, and a list of all subjects with their code, name, credits, and the grade obtained. IMPORTANT: Include ALL course instances, including retakes - if a student took the same course multiple times, include each instance in its respective semester. Ensure all fields in the schema are populated accurately." },
                        { inlineData: { mimeType: selectedFile.type, data: base64Data } }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });

            interface AIResponse {
                text?: string | (() => string);
            }
            const rawText = (response as AIResponse)?.text;
            const text = typeof rawText === 'string' ? rawText : (typeof rawText === 'function' ? rawText() : '');
            if (!text) {
                throw new Error('AI response was empty or invalid.');
            }
            result = JSON.parse(text.trim());

        } catch (geminiError) {
            // Check if OpenAI can handle this file type
            const isPDF = selectedFile.type === 'application/pdf';
            if (isPDF) {
                throw new Error('Gemini API is currently unavailable and OpenAI does not support PDF files. Please try again with an image file (PNG, JPG) or wait a few minutes for Gemini to become available.');
            }

            // Fallback to OpenAI (images only)
            if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') {
                throw new Error('OpenAI remove aigured. Please add VITE_OPENAI_API_KEY to your .env file.');
            }

            aiModel = 'ChatGPT';
            const OpenAI = await getOpenAI();
            const openai = new OpenAI({
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                dangerouslyAllowBrowser: true // Required for client-side usage
            });

            const systemPrompt = `You are an expert at analyzing academic grade sheets. Extract data from the provided image and return ONLY valid JSON matching this exact structure:
{
  "cgpa": number (overall CGPA as shown on grade sheet),
  "totalCredits": number (total credits, will be recalculated),
  "semesters": [
    {
      "semester": number (e.g., 4),
      "sessionYear": string (e.g., "2023-2024"),
      "sessionType": string ("Monsoon", "Winter", or "Summer"),
      "sgpa": number,
      "grades": [
        {
          "subjectCode": string (e.g., "CSL201"),
          "subjectName": string,
          "credits": number,
          "grade": string (letter grade like "A", "B", "EX")
        }
      ]
    }
  ]
}

IMPORTANT: Include ALL course instances including retakes. If a student took the same course multiple times, include each instance in its respective semester. Return ONLY the JSON, no markdown or additional text.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o', // gpt-4o has vision capabilities
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Please analyze this grade sheet image and extract the data according to the JSON schema provided.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${selectedFile.type};base64,${base64Data}`
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 4096
            });

            const responseText = response.choices[0]?.message?.content;
            if (!responseText) {
                throw new Error('OpenAI response was empty or invalid.');
            }
            result = JSON.parse(responseText.trim());
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
                        semester: sem.semester
                    };
                }
            });
        });

        // Recalculate totalCredits using only latest grades
        // Credits for F grades should only be counted when the student clears them
        let totalPassedCredits = 0;

        Object.values(courseMap).forEach((courseData) => {
            const grade = courseData.grade;
            // Only add credits if grade is not 'F'
            if (grade.grade !== 'F') {
                totalPassedCredits += grade.credits || 0;
            }
        });

        result.totalCredits = totalPassedCredits;
        // Keep the CGPA as extracted from the grade sheet (don't recalculate)

        // Add grade sheet URL and filename to result
        const finalResult: GradesData = {
            ...result,
            gradeSheetUrl,
            gradeSheetFileName: selectedFile.name
        };

        await setGradesData(finalResult);
        await logActivity(currentUser.uid, {
            type: 'grades',
            title: 'Grades Processed',
            description: `Successfully processed and updated your grade sheet using ${aiModel}.`,
            icon: '📊',
            link: '/grades'
        });
        selectFile(null); // Clear file selection on success

    } catch (e) {
        console.error("Error processing grade sheet:", e);
        setError("Failed to process the grade sheet. The file might be unclear or in an unsupported format. Please try again.");
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
            link: '/grades'
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
      resetGradesState
    }),
    [gradesData, loading, isProcessing, error, selectedFile, imagePreview, setGradesData, selectFile, processGrades, resetGradesState]
  );

  return (
    <GradesContext.Provider value={contextValue}>
      {children}
    </GradesContext.Provider>
  );
};

export const useGrades = () => {
  const context = useContext(GradesContext);
  if (context === undefined) {
    throw new Error('useGrades must be used within a GradesProvider');
  }
  return context;
};
