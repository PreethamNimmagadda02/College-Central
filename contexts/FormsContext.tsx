import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import 'firebase/firestore';
import { logActivity } from '../services/activityService';
import { allForms } from '../data/formsData';
import { Form, UserFormsData } from '../types';

interface FormsContextType {
    userFormsData: UserFormsData | null;
    loading: boolean;
    toggleFavorite: (formNumber: string) => Promise<void>;
    addRecentDownload: (form: Form) => Promise<void>;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

export const FormsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [userFormsData, setUserFormsData] = useState<UserFormsData | null>({ favorites: [], recentDownloads: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setUserFormsData({ favorites: [], recentDownloads: [] });
            setLoading(false);
            return;
        }

        const userDocRef = db.collection('userForms').doc(currentUser.uid);
        const unsubscribe = userDocRef.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                setUserFormsData(docSnap.data() as UserFormsData);
            } else {
                // Initialize if doesn't exist
                const initialData: UserFormsData = { favorites: [], recentDownloads: [] };
                userDocRef.set(initialData);
                setUserFormsData(initialData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user forms data:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const toggleFavorite = async (formNumber: string) => {
        if (!currentUser || !userFormsData) return;

        const isFavoriting = !userFormsData.favorites.includes(formNumber);
        const newFavorites = isFavoriting
            ? [...userFormsData.favorites, formNumber]
            : userFormsData.favorites.filter(f => f !== formNumber);

        const form = allForms.find(f => f.formNumber === formNumber);
        if (form) {
            await logActivity(currentUser.uid, {
                type: 'form',
                title: isFavoriting ? 'Form Favorited' : 'Form Unfavorited',
                description: `Form "${form.title}" was ${isFavoriting ? 'added to' : 'removed from'} favorites.`,
                icon: isFavoriting ? '⭐' : '🗑️',
                link: '/college-forms'
            });
        }
        
        const userDocRef = db.collection('userForms').doc(currentUser.uid);
        await userDocRef.update({ favorites: newFavorites });
    };

    const addRecentDownload = async (form: Form) => {
        if (!currentUser || !userFormsData) return;

        await logActivity(currentUser.uid, {
            type: 'form',
            title: 'Form Downloaded',
            description: `Downloaded: ${form.title}`,
            icon: '📄',
            link: '/college-forms'
        });

        const newDownload = {
            formNumber: form.formNumber,
            title: form.title,
            timestamp: Date.now()
        };

        const updatedDownloads = [newDownload, ...userFormsData.recentDownloads.filter(d => d.formNumber !== form.formNumber).slice(0, 9)];

        const userDocRef = db.collection('userForms').doc(currentUser.uid);
        await userDocRef.update({ recentDownloads: updatedDownloads });
    };

    return (
        <FormsContext.Provider value={{ userFormsData, loading, toggleFavorite, addRecentDownload }}>
            {children}
        </FormsContext.Provider>
    );
};

export const useForms = () => {
    const context = useContext(FormsContext);
    if (context === undefined) {
        throw new Error('useForms must be used within a FormsProvider');
    }
    return context;
};
