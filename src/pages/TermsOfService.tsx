import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Terms of Service</h1>
                    <p className="text-slate-600 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8 space-y-8">
                    {/* Introduction */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Agreement to Terms</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            By accessing and using College Central ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with these Terms, please do not use the Service. College Central is a web application designed to help students of IIT (ISM) Dhanbad manage their academic life.
                        </p>
                    </section>

                    {/* Eligibility */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Eligibility</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            To use College Central, you must:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Be a current or former student of IIT (ISM) Dhanbad</li>
                            <li>Be at least 18 years of age</li>
                            <li>Have a valid Google account for authentication</li>
                            <li>Provide accurate and truthful information</li>
                            <li>Comply with all applicable laws and regulations</li>
                        </ul>
                    </section>

                    {/* User Account */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">User Account and Responsibilities</h2>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Account Security</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            You are responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Maintaining the security of your Google account used for authentication</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized access</li>
                            <li>Ensuring the accuracy of information you provide</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Prohibited Activities</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            You agree NOT to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Use the Service for any illegal or unauthorized purpose</li>
                            <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                            <li>Upload malicious code, viruses, or harmful content</li>
                            <li>Scrape, mine, or harvest data from the Service without permission</li>
                            <li>Interfere with or disrupt the Service's functionality</li>
                            <li>Impersonate another person or entity</li>
                            <li>Share false, misleading, or fraudulent information</li>
                            <li>Use automated systems (bots, scrapers) to access the Service</li>
                        </ul>
                    </section>

                    {/* Service Features */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Service Features and Usage</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            College Central provides the following features:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li><strong>Grade Management:</strong> Upload and track academic grades and CGPA</li>
                            <li><strong>Schedule Management:</strong> Create and manage class timetables</li>
                            <li><strong>Academic Calendar:</strong> View and set reminders for academic events</li>
                            <li><strong>Campus Map:</strong> Navigate campus locations</li>
                            <li><strong>College Forms:</strong> Access and download official forms</li>
                            <li><strong>Weather Updates:</strong> Get campus weather with AI-powered recommendations</li>
                            <li><strong>CGPA Forecasting:</strong> Project future academic performance</li>
                        </ul>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
                            We reserve the right to modify, suspend, or discontinue any feature at any time without prior notice.
                        </p>
                    </section>

                    {/* Data and Privacy */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Data and Privacy</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            By using College Central:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>You consent to the collection and use of your data as described in our <a href="/#/privacy" className="text-primary hover:text-primary-dark">Privacy Policy</a></li>
                            <li>You understand that uploaded grade sheets are processed using Google Gemini AI</li>
                            <li>You acknowledge that you are responsible for the accuracy of data you provide</li>
                            <li>You can delete your account and data at any time through profile settings</li>
                        </ul>
                    </section>

                    {/* Intellectual Property */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Intellectual Property</h2>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Our Content</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            All content, features, and functionality of College Central (including but not limited to text, graphics, logos, icons, images, audio clips, and software) are owned by College Central and are protected by copyright, trademark, and other intellectual property laws.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Your Content</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            You retain ownership of any content you upload to College Central (such as grade sheets, profile pictures, or custom schedules). By uploading content, you grant us a license to use, store, and process it solely for providing the Service to you.
                        </p>
                    </section>

                    {/* Third-Party Services */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Third-Party Services</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            College Central integrates with third-party services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li><strong>Google Firebase:</strong> Authentication and data storage</li>
                            <li><strong>Google Gemini AI:</strong> Grade sheet extraction and recommendations</li>
                            <li><strong>Open-Meteo:</strong> Weather data</li>
                        </ul>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
                            Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for third-party services or their content.
                        </p>
                    </section>

                    {/* Disclaimers */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Disclaimers and Limitations</h2>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Service Availability</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            College Central is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We do not guarantee that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                            <li>Results obtained from the Service will be accurate or reliable</li>
                            <li>The quality of the Service will meet your expectations</li>
                            <li>Any errors in the Service will be corrected</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">Academic Information</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            While we strive for accuracy, College Central is NOT an official academic system. Always verify critical academic information (grades, schedules, dates) with official IIT (ISM) Dhanbad sources. We are not liable for any academic or administrative consequences resulting from inaccurate information.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 mt-4">AI-Generated Content</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            AI-powered features (grade extraction, weather recommendations) may contain errors. Always verify AI-generated content before relying on it for important decisions.
                        </p>
                    </section>

                    {/* Limitation of Liability */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Limitation of Liability</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            To the maximum extent permitted by law, College Central and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mt-3">
                            <li>Your use or inability to use the Service</li>
                            <li>Unauthorized access to or alteration of your data</li>
                            <li>Any third-party content or conduct on the Service</li>
                            <li>Any errors or inaccuracies in academic information</li>
                        </ul>
                    </section>

                    {/* Termination */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Termination</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            We reserve the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                            <li>Suspend or terminate your access to the Service at any time for any reason</li>
                            <li>Remove any content that violates these Terms</li>
                            <li>Take appropriate legal action for violations</li>
                        </ul>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
                            You may terminate your account at any time by deleting it through your profile settings.
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Changes to Terms</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of material changes by updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    {/* Governing Law */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Governing Law</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or use of the Service shall be subject to the exclusive jurisdiction of the courts in Dhanbad, Jharkhand, India.
                        </p>
                    </section>

                    {/* Contact */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-700 dark:text-slate-300">
                                Email: <a href="mailto:collegecentral01@gmail.com" className="text-primary hover:text-primary-dark">collegecentral01@gmail.com</a>
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 mt-2">
                                For IIT (ISM) Dhanbad students
                            </p>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong>Important Notice:</strong> College Central is an independent student project and is NOT officially affiliated with, endorsed by, or sponsored by Indian Institute of Technology (Indian School of Mines) Dhanbad. This application is created by students, for students, to enhance campus life. For official academic information, always refer to the official IIT (ISM) Dhanbad website and administration.
                        </p>
                    </section>

                    {/* Acceptance */}
                    <section className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            By using College Central, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
