import React, { useState, useMemo } from 'react';

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

const FormCard: React.FC<{ form: Form }> = ({ form }) => (
    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md flex flex-col h-full transition-shadow duration-300 hover:shadow-xl">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex-grow pr-2">{form.title}</h3>
            {form.formNumber && <span className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-full whitespace-nowrap">{form.formNumber}</span>}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-grow">
           <strong>Submit to:</strong> {form.submitTo}
        </p>
        <a 
            href={form.downloadLink} 
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors duration-200 text-sm"
        >
            <DownloadIcon />
            Download PDF
        </a>
    </div>
);

const CollegeForms: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'General', 'UG', 'PG', 'PhD'];

    const filterForms = (forms: Form[]) => {
        if (!searchTerm) return forms;
        const lowercasedTerm = searchTerm.toLowerCase();
        return forms.filter(form =>
            form.title.toLowerCase().includes(lowercasedTerm) ||
            form.formNumber.toLowerCase().includes(lowercasedTerm) ||
            form.submitTo.toLowerCase().includes(lowercasedTerm)
        );
    };

    const filteredGeneralForms = useMemo(() => filterForms(generalForms), [searchTerm]);
    const filteredUgForms = useMemo(() => filterForms(ugForms), [searchTerm]);
    const filteredPgForms = useMemo(() => filterForms(pgForms), [searchTerm]);
    const filteredPhdForms = useMemo(() => filterForms(phdForms), [searchTerm]);

    const getFilterLabel = (filter: string) => {
        switch (filter) {
            case 'UG': return 'Undergraduate (UG)';
            case 'PG': return 'Postgraduate (PG)';
            case 'PhD': return 'Doctoral (PhD)';
            default: return filter;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">College Forms</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Find and download important academic and administrative forms.
                </p>
            </div>

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

            {/* General Forms */}
            {(activeFilter === 'All' || activeFilter === 'General') && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">General Academic Forms</h2>
                     {filteredGeneralForms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredGeneralForms.map((form, index) => (
                                <FormCard key={`general-${index}`} form={form} />
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
                                <FormCard key={`ug-${index}`} form={form} />
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
                            {filteredPgForms.map((form, index) => (
                                <FormCard key={`pg-${index}`} form={form} />
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
                            {filteredPhdForms.map((form, index) => (
                                <FormCard key={`phd-${index}`} form={form} />
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