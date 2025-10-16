import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Semester } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { logActivity } from '../services/activityService';

export interface GradesData {
  semesters: Semester[];
  cgpa: number;
  totalCredits: number;
}

// Helper function to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
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
    let unsubscribe = () => {};
    if (currentUser) {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        // FIX: Safely access 'gradesData' property from document snapshot data.
        if (docSnap.exists()) {
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
      });
    } else {
      setGradesDataState(null);
      setLoading(false);
    }
    return () => unsubscribe();
  }, [currentUser]);

  const setGradesData = async (data: GradesData | null) => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { gradesData: data });
    }
  };

  const selectFile = (file: File | null) => {
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
  };

  const processGrades = async () => {
    if (!selectedFile || !currentUser) {
      setError("Please select a file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        const base64Data = await fileToBase64(selectedFile);
        // FIX: Obtain API key from process.env.API_KEY as per guidelines.
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        
        const schema = {
          type: Type.OBJECT,
          properties: {
            cgpa: { type: Type.NUMBER, description: 'The overall CGPA.' },
            totalCredits: { type: Type.NUMBER, description: 'The total number of credits earned across all semesters.' },
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
                    { text: "Please analyze this document (image or PDF) of a student's grade sheet. Extract the academic performance data and format it according to the provided JSON schema. The data should include the overall CGPA, the total credits earned across all semesters, and a list of all semesters, starting from the most recent one. For each semester, provide the semester number, the academic session year (e.g., '2023-2024'), the session type (Monsoon, Winter, or Summer), the SGPA, and a list of all subjects with their code, name, credits, and the grade obtained. Ensure all fields in the schema are populated accurately." },
                    { inlineData: { mimeType: selectedFile.type, data: base64Data } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const result = JSON.parse(response.text.trim());
        await setGradesData(result);
        await logActivity(currentUser.uid, {
            type: 'grades',
            title: 'Grades Processed',
            description: 'Successfully processed and updated your grade sheet.',
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
  };

  const resetGradesState = async () => {
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
  };

  return (
    <GradesContext.Provider value={{ gradesData, setGradesData, loading, isProcessing, error, selectedFile, imagePreview, selectFile, processGrades, resetGradesState }}>
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