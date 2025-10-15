import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const DownloadIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const BookmarkIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const StarIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ClockIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const generalForms = [
    { title: 'Academic Overload / Underload', formNumber: 'A1', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a1.pdf', submitTo: 'Academic Section' },
    { title: 'Adding/Dropping of Course(s)', formNumber: 'A2', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a2.pdf', submitTo: 'Academic Section' },
    { title: 'Application for Summer Semester', formNumber: 'A3', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a3.pdf', submitTo: 'Academic Section' },
    { title: 'Application for Make-up Examination', formNumber: 'A4', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a4.pdf', submitTo: 'Academic Section' },
    { title: 'Reinstatement in Program', formNumber: 'A5', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a5_4_1.pdf', submitTo: 'Academic Section' },
    { title: 'Attendance Waiver Form', formNumber: 'A6', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a6.pdf', submitTo: 'Academic Section' },
    { title: 'Application for Foreign Visit – For Academic Purpose', formNumber: 'A7', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a7.pdf', submitTo: 'Academic Section' },
    { title: 'Migration Certificate', formNumber: 'A9', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a9.pdf', submitTo: 'Academic Section' },
    { title: 'Transcript', formNumber: 'A12', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a12.pdf', submitTo: 'Academic Section' },
    { title: 'Duplicate Certificates', formNumber: 'A13', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a13.pdf', submitTo: 'Academic Section' },
    { title: 'Verification of Degree/Grade Card/Other Documents', formNumber: 'A14', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a14.pdf', submitTo: 'Academic Section' },
    { title: 'Login Credential of Parent Portal, MIS, Institute Email', formNumber: 'A15', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a15.pdf', submitTo: 'Academic Section' },
    { title: 'Re-Issue of Identity Card', formNumber: 'A16', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a16.pdf', submitTo: 'Academic Section' },
    { title: 'Form for Offline Registration', formNumber: 'A17', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a17.pdf', submitTo: 'Academic Section' },
    { title: 'Form for Academic Helpdesk', formNumber: 'A20', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/a20.pdf', submitTo: 'Academic Section' }
];

const ugForms = [
    { title: 'Scholarship (Dual Degree / Int. M.Tech Program)', formNumber: 'UG1', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ug1.pdf', submitTo: 'Academic Section' },
    { title: 'Pursuing Internship / Academic Work', formNumber: 'UG2', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ug2.pdf', submitTo: 'HOD / Dean (IRAA) (As Applicable)' },
    { title: 'Application form for Semester Leave', formNumber: 'UG3', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ug3.pdf', submitTo: 'Convener (DUGC)' },
    { title: 'Mentor Mentee Interaction Details', formNumber: 'UG4', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/UG4.pdf', submitTo: 'HOD' },
    { title: 'Mentor Mentee Interaction Summary', formNumber: 'UG5', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/UG5.pdf', submitTo: 'ADUG' }
];

const pgForms = [
    { title: 'Claiming Arrear of Assistantship / Scholarship', formNumber: 'PG1', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg1.pdf', submitTo: 'HOD / Convener (DPGC)' },
    { title: 'Pursuing Research Internship / Academic Work', formNumber: 'PG2', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg2.pdf', submitTo: 'Supervisor (As Applicable)' },
    { title: 'Application for Changing Registration from PG to Integrated PG-Ph.D.', formNumber: 'PG3', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg3.pdf', submitTo: 'Convener (DPGC)' },
    { title: 'Application for PG Diploma', formNumber: 'PG4', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg4.pdf', submitTo: 'Convener (DPGC)' },
    { title: 'Receipt of Soft Copy of PG Thesis at Central Library', formNumber: 'PG5', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg5.pdf', submitTo: 'Convener (DPGC)' },
    { title: 'Inclusion of External Co-Supervisor', formNumber: 'PG6', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg6.pdf', submitTo: 'Supervisor' },
    { title: 'Application form for Semester Leave', formNumber: 'PG7', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg7.pdf', submitTo: 'Supervisor / Convener (DPGC) (As Applicable)' },
    { title: 'Intimation about the Industrial Internship', formNumber: 'PG8', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg8.pdf', submitTo: 'Supervisor' },
    { title: 'RESEARCH PROPOSAL SEMINAR REPORT', formNumber: 'PG9', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg9.pdf', submitTo: 'Convener, DPGC' },
    { title: 'Certificate for the Final Version of Dissertation', formNumber: 'PG10', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg10.pdf', submitTo: 'Supervisor' },
    { title: 'Declaration by the Student', formNumber: 'PG11', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg11.pdf', submitTo: 'Supervisor' },
    { title: 'Certificate for Classified Data', formNumber: 'PG12', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg12.pdf', submitTo: 'Supervisor' },
    { title: 'Certificate Regarding English Checking', formNumber: 'PG13', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg13.pdf', submitTo: 'Supervisor' },
    { title: 'Copyright and Consent Form', formNumber: 'PG14', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg14.pdf', submitTo: 'Supervisor' },
    { title: 'CONVERSION OF M.TECH PROGRAM FROM FULL TIME TO PART TIME', formNumber: 'PG15', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pg15.pdf', submitTo: 'Convener (DPGC)/HOD' }
];

const phdForms = [
    { title: 'Physical registration form for Part-time / External Ph.D Scholars', formNumber: 'PT1', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/pt1.pdf', submitTo: 'Supervisor' },
    { title: 'Academic Works Outside The Institute', formNumber: 'PH1', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph1.pdf', submitTo: 'Supervisor' },
    { title: 'Pre-Submission Thesis Assessment by Doctoral Scrutiny Committee', formNumber: 'PH6', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph6.pdf', submitTo: 'Supervisor' },
    { title: 'Particulars of candidate for Submission of Synopsis for Ph.D', formNumber: 'PH9', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph9.pdf', submitTo: 'Supervisor' },
    { title: 'Copyright and Consent Form', formNumber: 'PH10', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph10.pdf', submitTo: 'Supervisor' },
    { title: 'Certificate for Classified Data', formNumber: 'PH11', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph11.pdf', submitTo: 'Supervisor' },
    { title: 'Certificate regarding English Check', formNumber: 'PH12', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph12.pdf', submitTo: 'Supervisor' },
    { title: 'Statement of Corrections for Revision of Ph.D Thesis', formNumber: 'PH14', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph14.pdf', submitTo: 'Supervisor' },
    { title: 'Certificate For Final Version of Thesis', formNumber: 'PH16', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph16.pdf', submitTo: 'Supervisor' },
    { title: 'Compliance of UGC Regulations Certificate/Ph.D Course Work/Provisional Certificate', formNumber: 'PH19', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph19.pdf', submitTo: 'Academic Section' },
    { title: 'Inclusion Of Joint-Supervisor (Internal/External) After Approval Of Ph2', formNumber: 'PH21', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph21.pdf', submitTo: 'Supervisor' },
    { title: 'Change Of Supervisor/ Joint-Supervisor (Internal/External)', formNumber: 'PH22', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph22.pdf', submitTo: 'DSC Chairperson' },
    { title: 'NDC Format', formNumber: '', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ndc-format.pdf', submitTo: 'Supervisor' },
    { title: 'RECEIPT OF SOFT COPY OF THESIS AT CENTRAL LIBRARY', formNumber: 'PH17', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/ph17_Updated.pdf', submitTo: 'AR(PG)' },
    { title: 'FORM FOR CLAIMING HRA BY MARRIED PH.D. SCHOLARS', formNumber: 'PH23', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/PH23.pdf', submitTo: 'Academic Section' },
    { title: 'Request for the Clearance of Comprehensive Viva', formNumber: 'PH3A', downloadLink: 'https://people.iitism.ac.in/~academics/assets/acad_forms/PH3A.pdf', submitTo: 'Academic Section' },
];

interface Form {
    title: string;
    formNumber: string;
    downloadLink: string;
    submitTo: string;
}

interface UserFormsData {
    favorites: string[];
    recentDownloads: Array<{
        formNumber: string;
        title: string;
        timestamp: number;
    }>;
}

const FormCard: React.FC<{
    form: Form;
    isFavorite: boolean;
    onToggleFavorite: (formNumber: string) => void;
    onDownload: (form: Form) => void;
}> = ({ form, isFavorite, onToggleFavorite, onDownload }) => (
    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md flex flex-col h-full transition-all duration-300 hover:shadow-xl border-2 border-transparent hover:border-primary/20">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex-grow pr-2">{form.title}</h3>
            <div className="flex items-center gap-2">
                {form.formNumber && <span className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-full whitespace-nowrap">{form.formNumber}</span>}
                <button
                    onClick={() => onToggleFavorite(form.formNumber)}
                    className={`p-2 rounded-lg transition-all ${isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <BookmarkIcon filled={isFavorite} />
                </button>
            </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-grow">
           <strong>Submit to:</strong> {form.submitTo}
        </p>
        <button
            onClick={() => onDownload(form)}
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200 text-sm"
        >
            <DownloadIcon />
            Download PDF
        </button>
    </div>
);

const CollegeForms: React.FC = () => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [userFormsData, setUserFormsData] = useState<UserFormsData>({ favorites: [], recentDownloads: [] });
    const [loading, setLoading] = useState(true);
    const [showTips, setShowTips] = useState(true);

    const filters = ['All', 'Favorites', 'General', 'UG', 'PG', 'PhD'];

    // Load user's forms data from Firebase
    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'userForms', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    setUserFormsData(userDoc.data() as UserFormsData);
                } else {
                    // Initialize user document
                    const initialData: UserFormsData = { favorites: [], recentDownloads: [] };
                    await setDoc(userDocRef, initialData);
                    setUserFormsData(initialData);
                }
            } catch (error) {
                console.error('Error loading user forms data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [currentUser]);

    // Toggle favorite
    const toggleFavorite = async (formNumber: string) => {
        if (!currentUser) return;

        const newFavorites = userFormsData.favorites.includes(formNumber)
            ? userFormsData.favorites.filter(f => f !== formNumber)
            : [...userFormsData.favorites, formNumber];

        const updatedData = { ...userFormsData, favorites: newFavorites };
        setUserFormsData(updatedData);

        try {
            const userDocRef = doc(db, 'userForms', currentUser.uid);
            await updateDoc(userDocRef, { favorites: newFavorites });
        } catch (error) {
            console.error('Error updating favorites:', error);
        }
    };

    // Handle download
    const handleDownload = async (form: Form) => {
        window.open(form.downloadLink, '_blank');

        if (!currentUser) return;

        const download = {
            formNumber: form.formNumber,
            title: form.title,
            timestamp: Date.now()
        };

        const updatedDownloads = [download, ...userFormsData.recentDownloads.slice(0, 9)]; // Keep last 10
        const updatedData = { ...userFormsData, recentDownloads: updatedDownloads };
        setUserFormsData(updatedData);

        try {
            const userDocRef = doc(db, 'userForms', currentUser.uid);
            await updateDoc(userDocRef, { recentDownloads: updatedDownloads });
        } catch (error) {
            console.error('Error updating recent downloads:', error);
        }
    };

    const filterForms = (forms: Form[]) => {
        let filtered = forms;

        // Apply favorites filter
        if (activeFilter === 'Favorites') {
            filtered = filtered.filter(form => userFormsData.favorites.includes(form.formNumber));
        }

        // Apply search filter
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(form =>
                form.title.toLowerCase().includes(lowercasedTerm) ||
                form.formNumber.toLowerCase().includes(lowercasedTerm) ||
                form.submitTo.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered;
    };

    const allForms = [...generalForms, ...ugForms, ...pgForms, ...phdForms];
    const favoriteForms = useMemo(() =>
        allForms.filter(form => userFormsData.favorites.includes(form.formNumber)),
        [userFormsData.favorites]
    );

    const filteredGeneralForms = useMemo(() => filterForms(generalForms), [searchTerm, userFormsData.favorites, activeFilter]);
    const filteredUgForms = useMemo(() => filterForms(ugForms), [searchTerm, userFormsData.favorites, activeFilter]);
    const filteredPgForms = useMemo(() => filterForms(pgForms), [searchTerm, userFormsData.favorites, activeFilter]);
    const filteredPhdForms = useMemo(() => filterForms(phdForms), [searchTerm, userFormsData.favorites, activeFilter]);

    const getFilterLabel = (filter: string) => {
        switch (filter) {
            case 'UG': return 'Undergraduate (UG)';
            case 'PG': return 'Postgraduate (PG)';
            case 'PhD': return 'Doctoral (PhD)';
            default: return filter;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary to-secondary p-8 rounded-xl shadow-lg text-white">
                <h1 className="text-4xl font-bold mb-2">College Forms</h1>
                <p className="text-blue-100">
                    Find and download important academic and administrative forms
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Total Forms</p>
                            <p className="text-3xl font-bold text-primary mt-1">{allForms.length}</p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <DownloadIcon />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Your Favorites</p>
                            <p className="text-3xl font-bold text-yellow-500 mt-1">{userFormsData.favorites.length}</p>
                        </div>
                        <div className="bg-yellow-500/10 p-3 rounded-lg text-yellow-500">
                            <StarIcon />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Recent Downloads</p>
                            <p className="text-3xl font-bold text-secondary mt-1">{userFormsData.recentDownloads.length}</p>
                        </div>
                        <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                            <ClockIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Downloads Section */}
            {userFormsData.recentDownloads.length > 0 && (
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ClockIcon />
                        Recent Downloads
                    </h3>
                    <div className="space-y-2">
                        {userFormsData.recentDownloads.slice(0, 5).map((download, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{download.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(download.timestamp).toLocaleDateString()} at {new Date(download.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold bg-primary/10 text-primary py-1 px-2 rounded-full">
                                    {download.formNumber}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Helpful Tips */}
            {showTips && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-500 mt-1">
                                <InfoIcon />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Helpful Tips</h3>
                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                    <li>Use the search bar to quickly find forms by name, number, or submission office</li>
                                    <li>Click the bookmark icon to save frequently used forms to favorites</li>
                                    <li>All forms are official IIT ISM documents - ensure you submit to the correct office</li>
                                    <li>Check "Submit to" field carefully before downloading</li>
                                </ul>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowTips(false)}
                            className="text-blue-500 hover:text-blue-700 text-xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4 bg-white dark:bg-dark-card p-4 rounded-lg shadow-md">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by form name, number, or submission office..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                 <div className="flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeFilter === filter ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                        >
                            {getFilterLabel(filter)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Favorites Section */}
            {activeFilter === 'Favorites' && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                        <StarIcon />
                        Your Favorite Forms
                    </h2>
                    {favoriteForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {favoriteForms.map((form, index) => (
                                <FormCard
                                    key={`favorite-${index}`}
                                    form={form}
                                    isFavorite={true}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg">
                            <div className="text-slate-300 dark:text-slate-600 mb-4">
                                <StarIcon />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No favorite forms yet. Click the bookmark icon to save forms!</p>
                        </div>
                    )}
                </div>
            )}

            {/* General Forms */}
            {(activeFilter === 'All' || activeFilter === 'General') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">General Academic Forms</h2>
                     {filteredGeneralForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredGeneralForms.map((form, index) => (
                                <FormCard
                                    key={`general-${index}`}
                                    form={form}
                                    isFavorite={userFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No general forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* UG Forms */}
            {(activeFilter === 'All' || activeFilter === 'UG') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Undergraduate (UG) Forms</h2>
                     {filteredUgForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredUgForms.map((form, index) => (
                                <FormCard
                                    key={`ug-${index}`}
                                    form={form}
                                    isFavorite={userFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No UG forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PG Forms */}
            {(activeFilter === 'All' || activeFilter === 'PG') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Postgraduate (PG) Forms</h2>
                     {filteredPgForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPgForms.map((form: Form, index: number) => (
                                <FormCard
                                    key={`pg-${index}`}
                                    form={form}
                                    isFavorite={userFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No PG forms match your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* PhD Forms */}
            {(activeFilter === 'All' || activeFilter === 'PhD') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">Doctoral (PhD) Forms</h2>
                     {filteredPhdForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPhdForms.map((form: Form, index: number) => (
                                <FormCard
                                    key={`phd-${index}`}
                                    form={form}
                                    isFavorite={userFormsData.favorites.includes(form.formNumber)}
                                    onToggleFavorite={toggleFavorite}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 bg-white dark:bg-dark-card rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400">No PhD forms match your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollegeForms;