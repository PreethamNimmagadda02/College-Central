import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGrades } from '../contexts/GradesContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { TIMETABLE_DATA } from '../data/courseData';
import { TimeTableCourse, Grade, Semester } from '../types';

const gradeOptions = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
const gradePoints: { [key: string]: number } = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };

const getGradeColor = (grade: string) => {
    switch(grade) {
        case 'A+':
        case 'A': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        case 'B+':
        case 'B': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
        case 'C+':
        case 'C': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'D': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
        case 'F': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
        default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
};

const getCGPAStatus = (cgpa: number) => {
    if (cgpa >= 9) return { text: 'Outstanding', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
    if (cgpa >= 8) return { text: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
    if (cgpa >= 7) return { text: 'Good', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20' };
    if (cgpa >= 6) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { text: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' };
};

const CGPAForecaster: React.FC = () => {
    const { gradesData } = useGrades();
    const { scheduleData } = useSchedule();
    const isInitialMount = useRef(true);
    const [targetCGPA, setTargetCGPA] = useState(8.0);
    const [semestersRemaining, setSemestersRemaining] = useState(1);

    const currentCourses = useMemo(() => {
        if (!scheduleData) return [];
        const uniqueCourseCodes = [...new Set(scheduleData.map(slot => slot.courseCode))];
        return TIMETABLE_DATA
            .filter(course => uniqueCourseCodes.includes(course.courseCode))
            .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    }, [scheduleData]);

    const [projectedGrades, setProjectedGrades] = useState<{ [courseCode: string]: string }>({});

    useEffect(() => {
        const initialGrades = currentCourses.reduce((acc, course) => {
            acc[course.courseCode] = 'A+';
            return acc;
        }, {} as { [courseCode: string]: string });
        setProjectedGrades(initialGrades);
    }, [currentCourses]);
    
    const handleGradeChange = (courseCode: string, grade: string) => {
        setProjectedGrades(prev => ({...prev, [courseCode]: grade}));
    };

    const calculations = useMemo(() => {
        if (!gradesData || currentCourses.length === 0) {
            return { 
                projectedSgpa: 0, 
                projectedCgpa: gradesData?.cgpa || 0, 
                currentSemCredits: 0,
                requiredSGPA: 0,
                isTargetAchievable: false
            };
        }
        
        let totalPoints = 0;
        const currentSemCredits = currentCourses.reduce((sum, course) => sum + course.credits, 0);

        currentCourses.forEach(course => {
            const grade = projectedGrades[course.courseCode];
            const points = gradePoints[grade] || 0;
            totalPoints += course.credits * points;
        });

        if (currentSemCredits === 0) {
             return { 
                projectedSgpa: 0, 
                projectedCgpa: gradesData.cgpa, 
                currentSemCredits: 0,
                requiredSGPA: 0,
                isTargetAchievable: false
            };
        }
        
        const sgpa = totalPoints / currentSemCredits;
        const creditsTillLastSem = gradesData.totalCredits;
        const currentCgpa = gradesData.cgpa;
        const totalCreditsAfterThisSem = creditsTillLastSem + currentSemCredits;
        const newCgpa = ((currentCgpa * creditsTillLastSem) + (sgpa * currentSemCredits)) / totalCreditsAfterThisSem;

        // Calculate required SGPA for target
        const avgCreditsPerSem = currentSemCredits;
        const projectedTotalCredits = creditsTillLastSem + (avgCreditsPerSem * semestersRemaining);
        const requiredTotalPoints = targetCGPA * projectedTotalCredits;
        const currentTotalPoints = currentCgpa * creditsTillLastSem;
        const requiredNewPoints = requiredTotalPoints - currentTotalPoints;
        const requiredSGPA = requiredNewPoints / (avgCreditsPerSem * semestersRemaining);

        return { 
            projectedSgpa: sgpa, 
            projectedCgpa: newCgpa, 
            currentSemCredits,
            requiredSGPA: requiredSGPA,
            isTargetAchievable: requiredSGPA <= 10 && requiredSGPA >= 0
        };
    }, [projectedGrades, currentCourses, gradesData, targetCGPA, semestersRemaining]);

    if (currentCourses.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No current semester courses found</p>
                <a href="/#/schedule" className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Courses
                </a>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Performance Projections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-blue-100 text-sm font-medium">Current CGPA</h4>
                            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold group-hover:scale-110 transition-transform origin-left">{gradesData?.cgpa.toFixed(2)}</p>
                        <p className="text-blue-100 text-xs mt-1">After {gradesData?.totalCredits} credits</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-green-100 text-sm font-medium">Projected SGPA</h4>
                            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold group-hover:scale-110 transition-transform origin-left">{calculations.projectedSgpa.toFixed(2)}</p>
                        <p className="text-green-100 text-xs mt-1">This semester</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-purple-100 text-sm font-medium">New CGPA</h4>
                            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <p className="text-3xl font-bold group-hover:scale-110 transition-transform origin-left">{calculations.projectedCgpa.toFixed(2)}</p>
                        <div className="flex items-center gap-1 mt-1">
                            {calculations.projectedCgpa > (gradesData?.cgpa || 0) ? (
                                <>
                                    <svg className="w-3 h-3 text-green-300 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-purple-100 text-xs">+{(calculations.projectedCgpa - (gradesData?.cgpa || 0)).toFixed(2)}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3 text-red-300 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-purple-100 text-xs">{(calculations.projectedCgpa - (gradesData?.cgpa || 0)).toFixed(2)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Target CGPA Calculator */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6">
                <h4 className="font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    CGPA Target Calculator
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Target CGPA
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={targetCGPA}
                            onChange={(e) => setTargetCGPA(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Semesters Remaining
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="8"
                            value={semestersRemaining}
                            onChange={(e) => setSemestersRemaining(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700"
                        />
                    </div>
                    <div className="flex items-end">
                        <div className={`w-full p-3 rounded-lg text-center ${
                            calculations.isTargetAchievable 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                            {calculations.isTargetAchievable ? (
                                <div>
                                    <p className="text-xs font-medium mb-1">Required SGPA</p>
                                    <p className="text-xl font-bold">{calculations.requiredSGPA.toFixed(2)}</p>
                                </div>
                            ) : (
                                <p className="font-medium">Target not achievable</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grade Adjustment */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Adjust Expected Grades
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {currentCourses.map(course => (
                            <div key={course.courseCode} className="group relative overflow-hidden flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex-grow">
                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {course.courseCode}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {course.courseName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full group-hover:bg-primary/20 transition-colors">
                                            {course.credits} Credits
                                        </span>
                                        <span className="text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                            Points: {(gradePoints[projectedGrades[course.courseCode]] * course.credits).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative z-10 flex items-center gap-3">
                                    <select
                                        value={projectedGrades[course.courseCode] || 'A'}
                                        onChange={(e) => handleGradeChange(course.courseCode, e.target.value)}
                                        className={`px-4 py-2 font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all hover:scale-105 ${getGradeColor(projectedGrades[course.courseCode])}`}
                                    >
                                        {gradeOptions.map(grade => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PerformanceAnalytics: React.FC<{ gradesData: any }> = ({ gradesData }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

    // Calculate performance trends
    const performanceTrend = useMemo(() => {
        return gradesData.semesters.map((sem: Semester) => ({
            semester: `Sem ${sem.semester}`,
            sgpa: sem.sgpa,
            credits: sem.grades.reduce((total: number, grade: Grade) => total + (grade.credits || 0), 0)
        }));
    }, [gradesData]);

    // Calculate grade distribution with courses
    const gradeDistribution = useMemo(() => {
        const distribution: { [key: string]: { count: number, courses: any[] } } = {};
        gradesData.semesters.forEach((sem: Semester) => {
            sem.grades.forEach((grade: Grade) => {
                if (!distribution[grade.grade]) {
                    distribution[grade.grade] = { count: 0, courses: [] };
                }
                distribution[grade.grade].count += 1;
                distribution[grade.grade].courses.push({
                    ...grade,
                    semester: sem.semester
                });
            });
        });
        return distribution;
    }, [gradesData]);

    const getGradeCourses = (grade: string) => {
        return gradeDistribution[grade]?.courses || [];
    };

    // Calculate subject performance with courses
    const subjectPerformance = useMemo(() => {
        const subjects: { [key: string]: { total: number, count: number, courses: any[] } } = {};
        gradesData.semesters.forEach((sem: Semester) => {
            sem.grades.forEach((grade: Grade) => {
                const category = grade.subjectCode.substring(0, 2);
                if (!subjects[category]) {
                    subjects[category] = { total: 0, count: 0, courses: [] };
                }
                subjects[category].total += gradePoints[grade.grade] || 0;
                subjects[category].count += 1;
                subjects[category].courses.push({
                    ...grade,
                    semester: sem.semester
                });
            });
        });

        return Object.entries(subjects).map(([category, data]) => ({
            category,
            average: (data.total / data.count).toFixed(2),
            courses: data.courses
        }));
    }, [gradesData]);

    const getCategoryCourses = (category: string) => {
        const categoryData = subjectPerformance.find(s => s.category === category);
        return categoryData?.courses || [];
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Analytics
            </h3>

            {/* SGPA Trend */}
            <div className="group bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-medium mb-4">SGPA Trend</h4>
                <div className="space-y-3">
                    {performanceTrend.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300">
                            <span className="text-sm font-medium w-16">{item.semester}</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 relative overflow-hidden group/bar">
                                <div
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-secondary flex items-center justify-end pr-3 transition-all duration-500 group-hover/bar:shadow-lg"
                                    style={{ width: `${(item.sgpa / 10) * 100}%` }}
                                >
                                    <span className="text-white text-sm font-semibold group-hover/bar:scale-110 transition-transform">{item.sgpa.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-medium mb-4">Grade Distribution</h4>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(gradeDistribution).map(([grade, data]) => (
                            <div
                                key={grade}
                                onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
                                className={`group text-center p-3 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-lg ${getGradeColor(grade)}`}
                            >
                                <p className="text-2xl font-bold group-hover:scale-110 transition-transform">
                                    {typeof data === 'object' && data !== null && 'count' in data ? data.count : 0}
                                </p>
                                <p className="text-sm font-medium">{grade}</p>
                            </div>
                        ))}
                    </div>

                    {selectedGrade && (
                        <div className="mt-4 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h5 className="font-semibold text-slate-700 dark:text-slate-300">
                                    Courses with grade {selectedGrade}
                                </h5>
                                <button
                                    onClick={() => setSelectedGrade(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {getGradeCourses(selectedGrade).map((course: any, courseIndex: number) => (
                                <div
                                    key={courseIndex}
                                    className="group relative overflow-hidden flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{course.subjectCode}</span>
                                            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                                                Sem {course.semester}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{course.subjectName}</p>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-3">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{course.credits} credits</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(course.grade)}`}>
                                            {course.grade}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Subject Category Performance */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <h4 className="font-medium mb-4">Subject Category Performance</h4>
                <div className="space-y-2">
                    {subjectPerformance.map((subject, index) => (
                        <div key={index}>
                            <div
                                onClick={() => setSelectedCategory(selectedCategory === subject.category ? null : subject.category)}
                                className="group relative overflow-hidden flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex items-center gap-2">
                                    <span className="font-medium group-hover:text-primary transition-colors">{subject.category} Courses</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">({subject.courses.length})</span>
                                </div>
                                <div className="relative z-10 flex items-center gap-2">
                                    <span className="text-lg font-semibold text-primary group-hover:scale-110 transition-transform">{subject.average}</span>
                                    <svg
                                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${selectedCategory === subject.category ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {selectedCategory === subject.category && (
                                <div className="mt-2 ml-4 space-y-2 animate-fadeIn">
                                    {getCategoryCourses(subject.category).map((course: any, courseIndex: number) => (
                                        <div
                                            key={courseIndex}
                                            className="group relative overflow-hidden flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative z-10 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{course.subjectCode}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-600 rounded-full">
                                                        Sem {course.semester}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{course.subjectName}</p>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-3">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{course.credits} credits</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(course.grade)}`}>
                                                    {course.grade}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Grades: React.FC = () => {
    const {
        gradesData,
        loading: gradesLoading,
        isProcessing,
        error,
        selectedFile,
        imagePreview,
        selectFile,
        processGrades,
        resetGradesState,
    } = useGrades();

    const [showForecaster, setShowForecaster] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

    const sortedGradesData = useMemo(() => {
        if (!gradesData) return null;
        const sortedSemesters = [...gradesData.semesters].sort((a, b) => a.semester - b.semester);
        return { ...gradesData, semesters: sortedSemesters };
    }, [gradesData]);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        selectFile(file || null);
    };

    const cgpaStatus = useMemo(() => {
        if (!sortedGradesData) return null;
        return getCGPAStatus(sortedGradesData.cgpa);
    }, [sortedGradesData]);
    
    if (gradesLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="text-slate-600 dark:text-slate-400 animate-pulse">Loading your grades...</p>
            </div>
        );
    }

    if (!sortedGradesData) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 p-4 lg:p-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                        Academic Performance
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Upload your grade sheet to track and analyze your academic progress
                    </p>
                </div>
                
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl p-8">
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl">📊</div>
                            <div>
                                <p className="font-medium text-sm">CGPA Tracking</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Monitor your overall performance</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl">🎯</div>
                            <div>
                                <p className="font-medium text-sm">Grade Forecaster</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Predict future performance</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-2xl">📈</div>
                            <div>
                                <p className="font-medium text-sm">Analytics</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Deep performance insights</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                        {!selectedFile && !imagePreview ? (
                            <div className="space-y-4">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <div>
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <span className="text-primary font-semibold hover:text-primary-dark">Upload grade sheet</span>
                                        <span className="text-slate-600 dark:text-slate-400"> or drag and drop</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1">PNG, JPG or PDF up to 10MB</p>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {imagePreview && (
                                    <img 
                                        src={imagePreview} 
                                        alt="Grade sheet preview" 
                                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                                    />
                                )}
                                <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>{selectedFile?.name}</span>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={processGrades}
                                        disabled={isProcessing}
                                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Process Grade Sheet
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={resetGradesState}
                                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-200">Error processing grade sheet</p>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const latestSemester = sortedGradesData.semesters.length > 0
        ? sortedGradesData.semesters[sortedGradesData.semesters.length - 1]
        : null;

    const selectedSemesterData = selectedSemester !== null 
        ? sortedGradesData.semesters.find(sem => sem.semester === selectedSemester)
        : null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Academic Performance
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Track and analyze your academic journey
                    </p>
                </div>
                <button
                    onClick={resetGradesState}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload New Grade Sheet
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-blue-100 text-sm font-semibold">CGPA</h3>
                            <svg className="w-7 h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-4xl md:text-5xl font-black mb-2 group-hover:scale-110 transition-transform origin-left">{sortedGradesData.cgpa.toFixed(2)}</p>
                        {cgpaStatus && (
                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${cgpaStatus.bg} shadow-md`}>
                                {cgpaStatus.text}
                            </span>
                        )}
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-5 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-green-100 text-sm font-semibold">Total Credits</h3>
                            <svg className="w-7 h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <p className="text-4xl md:text-5xl font-black group-hover:scale-110 transition-transform origin-left">{sortedGradesData.totalCredits}</p>
                        <p className="text-green-100 text-sm font-semibold mt-1">Completed</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-purple-100 text-sm font-semibold">Semesters</h3>
                            <svg className="w-7 h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-4xl md:text-5xl font-black group-hover:scale-110 transition-transform origin-left">{sortedGradesData.semesters.length}</p>
                        <p className="text-purple-100 text-sm font-semibold mt-1">Completed</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-orange-100 text-sm font-semibold">Latest SGPA</h3>
                            <svg className="w-7 h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-4xl md:text-5xl font-black group-hover:scale-110 transition-transform origin-left">
                            {latestSemester?.sgpa.toFixed(2)}
                        </p>
                        <p className="text-orange-100 text-sm font-semibold mt-1">
                            Semester {latestSemester?.semester}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => {
                        setShowForecaster(!showForecaster);
                        if (showAnalytics) setShowAnalytics(false);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        showForecaster
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white dark:bg-dark-card hover:shadow-md'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {showForecaster ? 'Hide' : 'Show'} CGPA Forecaster
                </button>
                
                <button
                    onClick={() => {
                        setShowAnalytics(!showAnalytics);
                        if (showForecaster) setShowForecaster(false);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        showAnalytics
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white dark:bg-dark-card hover:shadow-md'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {showAnalytics ? 'Hide' : 'Show'} Analytics
                </button>
            </div>

            {/* Conditional Sections */}
            {showForecaster && <CGPAForecaster />}
            {showAnalytics && <PerformanceAnalytics gradesData={sortedGradesData} />}

            {/* Semester-wise Performance */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Semester-wise Performance
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedGradesData.semesters.map((semester: Semester) => {
                            const semesterCredits = semester.grades.reduce((total: number, grade: Grade) => total + (grade.credits || 0), 0);
                            return (
                                <div
                                    key={semester.semester}
                                    className="group relative overflow-hidden p-5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => setSelectedSemester(selectedSemester === semester.semester ? null : semester.semester)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">Semester {semester.semester}</h4>
                                            <svg
                                                className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                                                    selectedSemester === semester.semester ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">SGPA</span>
                                                <span className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform origin-right">{semester.sgpa.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Credits</span>
                                                <span className="font-medium group-hover:text-primary transition-colors">{semesterCredits}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Courses</span>
                                                <span className="font-medium group-hover:text-primary transition-colors">{semester.grades.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Semester Details */}
                    {selectedSemesterData && (
                        <div className="mt-6 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                            <h4 className="font-semibold text-lg mb-4 flex items-center">
                                <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-3 text-sm">
                                    {selectedSemesterData.semester}
                                </span>
                                Semester {selectedSemesterData.semester} - Detailed Grades
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedSemesterData.grades.map((grade: Grade, index: number) => (
                                    <div
                                        key={index}
                                        className="group relative overflow-hidden flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative z-10 flex-grow">
                                            <p className="font-semibold group-hover:text-primary transition-colors">{grade.subjectCode}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{grade.subjectName}</p>
                                            <p className="text-xs text-slate-500 mt-1">{grade.credits} Credits</p>
                                        </div>
                                        <div className={`relative z-10 px-4 py-2 rounded-lg font-bold text-lg transition-transform group-hover:scale-110 ${getGradeColor(grade.grade)}`}>
                                            {grade.grade}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Grades;