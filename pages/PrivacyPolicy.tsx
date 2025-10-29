import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
                    <p className="text-slate-600 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 space-y-8">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Introduction</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            College Central ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application designed for students of IIT (ISM) Dhanbad.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Information We Collect</h2>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Personal Information</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            We collect information that you voluntarily provide when using College Central:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Name and email address (via Google OAuth authentication)</li>
                            <li>Student information (admission number, branch, hostel, phone number)</li>
                            <li>Academic records (grades, CGPA, semester information) when you upload your grade sheet</li>
                            <li>Class schedules and timetable information</li>
                            <li>Profile picture (optional)</li>
                            <li>Academic calendar events and reminders</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Usage Data</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            We automatically collect certain information when you use our application:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Activity logs (page visits, feature usage)</li>
                            <li>Device information and browser type</li>
                            <li>Performance metrics for improving app functionality</li>
                        </ul>
                    </section>

                    {/* How We Use Your Information */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">How We Use Your Information</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            We use the collected information for the following purposes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>To provide and maintain the College Central service</li>
                            <li>To authenticate and verify your identity</li>
                            <li>To display your academic information (grades, schedules, calendar)</li>
                            <li>To provide personalized features like CGPA forecasting and weather recommendations</li>
                            <li>To send you reminders for academic events (if enabled)</li>
                            <li>To improve and optimize our application</li>
                            <li>To analyze usage patterns and enhance user experience</li>
                        </ul>
                    </section>

                    {/* Data Storage and Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data Storage and Security</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            Your data is stored securely using Firebase services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li><strong>Firebase Authentication:</strong> Handles secure user authentication via Google OAuth</li>
                            <li><strong>Cloud Firestore:</strong> Stores user profiles, grades, schedules, and calendar data with encryption at rest and in transit</li>
                            <li><strong>Firebase Storage:</strong> Securely stores profile pictures</li>
                            <li>All data transmission is encrypted using HTTPS/TLS protocols</li>
                            <li>We implement industry-standard security measures to protect your information</li>
                        </ul>
                    </section>

                    {/* AI and Third-Party Services */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI and Third-Party Services</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            College Central uses third-party services to enhance functionality:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li><strong>Google Gemini AI:</strong> Used for grade sheet extraction and weather-based recommendations. Your data is processed according to Google's privacy policies.</li>
                            <li><strong>Open-Meteo API:</strong> Provides weather information. No personal data is shared with this service.</li>
                            <li>We do not sell your personal information to third parties</li>
                        </ul>
                    </section>

                    {/* Data Retention */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data Retention</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            We retain your personal information for as long as your account is active or as needed to provide you services. You can delete your account and associated data at any time through the profile settings. Upon account deletion, we will remove your personal information within 30 days, except where we are legally required to retain certain data.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Rights</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            You have the following rights regarding your personal data:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li><strong>Access:</strong> View and download your data through your profile</li>
                            <li><strong>Correction:</strong> Update or correct your information at any time</li>
                            <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
                            <li><strong>Withdrawal of Consent:</strong> Opt-out of optional features at any time</li>
                        </ul>
                    </section>

                    {/* Cookies and Local Storage */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Cookies and Local Storage</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            College Central uses browser local storage and session storage to enhance your experience. This includes storing authentication tokens, user preferences (like theme settings), and cached data for offline functionality. We use service workers to enable offline access to the application.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Children's Privacy</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            College Central is intended for college students and does not knowingly collect information from individuals under 18 years of age. If you believe we have collected information from someone under 18, please contact us.
                        </p>
                    </section>

                    {/* Changes to Privacy Policy */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Changes to This Privacy Policy</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            If you have any questions about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-700 dark:text-slate-300">
                                Email: <a href="mailto:support@collegecentral.live" className="text-primary hover:text-primary-dark">collegecentral01@gmail.com</a>
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 mt-2">
                                For IIT (ISM) Dhanbad students
                            </p>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong>Disclaimer:</strong> College Central is an independent student project and is not officially affiliated with or endorsed by IIT (ISM) Dhanbad. This application is created by students, for students, to enhance campus life.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
