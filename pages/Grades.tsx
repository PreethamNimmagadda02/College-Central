import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGrades, GradesData } from '../contexts/GradesContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useUser } from '../contexts/UserContext';
import { TIMETABLE_DATA } from '../data/courseData';
import { NEP_TIMETABLE_DATA } from '../data/nepCourseData';
import { Grade, Semester } from '../types';
import { calculateCreditsFromLTP } from '../utils/creditCalculator';

// Animated Counter Component - counts up smoothly when value changes
const AnimatedCounter: React.FC<{ value: number; decimals?: number; duration?: number; className?: string }> = ({
    value,
    decimals = 2,
    duration = 1.5,
    className = ''
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: false, margin: "-50px" });
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) => current.toFixed(decimals));
    const [displayValue, setDisplayValue] = useState(value.toFixed(decimals));

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [value, isInView, spring]);

    useEffect(() => {
        const unsubscribe = display.on("change", (latest) => {
            setDisplayValue(latest);
        });
        return unsubscribe;
    }, [display]);

    return <span ref={ref} className={className}>{displayValue}</span>;
};

// Animated Integer Counter - for whole numbers
const AnimatedInteger: React.FC<{ value: number; duration?: number; className?: string }> = ({
    value,
    duration = 1.5,
    className = ''
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: false, margin: "-50px" });
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) => Math.round(current).toString());
    const [displayValue, setDisplayValue] = useState(value.toString());

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [value, isInView, spring]);

    useEffect(() => {
        const unsubscribe = display.on("change", (latest) => {
            setDisplayValue(latest);
        });
        return unsubscribe;
    }, [display]);

    return <span ref={ref} className={className}>{displayValue}</span>;
};

// Pulsing indicator for live/active data
const PulseIndicator: React.FC<{ color?: string }> = ({ color = 'bg-green-500' }) => (
    <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
    </span>
);

// Progress ring component for circular metrics
const ProgressRing: React.FC<{
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    className?: string;
}> = ({ progress, size = 60, strokeWidth = 6, color = 'stroke-primary', className = '' }) => {
    const ref = useRef<SVGSVGElement>(null);
    const isInView = useInView(ref, { once: false, margin: "-20px" });
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const spring = useSpring(0, { duration: 1500, bounce: 0 });
    const strokeDashoffset = useTransform(spring, (val) => circumference - (val / 100) * circumference);
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        if (isInView) {
            spring.set(Math.min(progress, 100));
        }
    }, [progress, isInView, spring]);

    useEffect(() => {
        const unsubscribe = strokeDashoffset.on("change", (latest) => {
            setOffset(latest);
        });
        return unsubscribe;
    }, [strokeDashoffset]);

    return (
        <svg ref={ref} width={size} height={size} className={`transform -rotate-90 ${className}`}>
            <circle
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                className="text-slate-200 dark:text-slate-700"
            />
            <circle
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                className={`${color} transition-all duration-300`}
            />
        </svg>
    );
};

const gradeOptions = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
const gradePoints: { [key: string]: number } = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };

const getGradeColor = (grade: string) => {
    switch(grade) {
        case 'A+': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        case 'A': return 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200';
        case 'B+': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
        case 'B': return 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300';
        case 'C+': return 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300';
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
    const { user } = useUser();
    const courseOption = user?.courseOption || 'CBCS';
    const timetableData = courseOption === 'NEP' ? NEP_TIMETABLE_DATA : TIMETABLE_DATA;
    const [targetCGPA, setTargetCGPA] = useState('7.0');

    const currentCourses = useMemo(() => {
        if (!scheduleData) return [];
        const uniqueCourseCodes = [...new Set(scheduleData.map(slot => slot.courseCode))];
        return timetableData
            .filter(course => uniqueCourseCodes.includes(course.courseCode))
            .map(course => ({
                ...course,
                credits: calculateCreditsFromLTP(course.ltp, courseOption)
            }))
            .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    }, [scheduleData, courseOption, timetableData]);

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
            const points = grade ? (gradePoints[grade] || 0) : 0;
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

        // Calculate required SGPA for target (for current semester only)
        const targetCGPANum = parseFloat(targetCGPA) || 0;
        const requiredTotalPoints = targetCGPANum * totalCreditsAfterThisSem;
        const currentTotalPoints = currentCgpa * creditsTillLastSem;
        const requiredNewPoints = requiredTotalPoints - currentTotalPoints;
        const requiredSGPA = requiredNewPoints / currentSemCredits;

        return {
            projectedSgpa: sgpa,
            projectedCgpa: newCgpa,
            currentSemCredits,
            requiredSGPA: requiredSGPA,
            isTargetAchievable: requiredSGPA <= 10 && requiredSGPA >= 0
        };
    }, [projectedGrades, currentCourses, gradesData, targetCGPA]);

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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 sm:space-y-6"
        >
            {/* Target CGPA Calculator - Separate Section */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        CGPA Target Calculator
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Calculate the SGPA needed this semester to achieve your target CGPA</p>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
                                    Target CGPA
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={targetCGPA}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow empty, numbers, and decimal points
                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                            // Limit to 10.0
                                            const numValue = parseFloat(value);
                                            if (value === '' || isNaN(numValue) || numValue <= 10) {
                                                setTargetCGPA(value);
                                            }
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // Clean up on blur
                                        const numValue = parseFloat(e.target.value);
                                        if (isNaN(numValue) || numValue < 0) {
                                            setTargetCGPA('0.0');
                                        } else if (numValue > 10) {
                                            setTargetCGPA('10.0');
                                        } else {
                                            setTargetCGPA(numValue.toFixed(1));
                                        }
                                    }}
                                    placeholder="e.g., 8.5"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-base sm:text-lg font-semibold"
                                />
                            </div>
                            <div className="flex items-end">
                                <div className={`w-full p-3 sm:p-4 rounded-lg text-center transition-all ${
                                    calculations.isTargetAchievable
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                    {calculations.isTargetAchievable ? (
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wide">Required SGPA</p>
                                            <p className="text-2xl sm:text-3xl font-bold">{calculations.requiredSGPA.toFixed(2)}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-semibold mb-1 text-sm sm:text-base"> Target Not Achievable</p>
                                            <p className="text-[10px] sm:text-xs">This semester alone cannot reach your target CGPA</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

            {/* Grade Adjustment */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Adjust Expected Grades
                    </h3>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        {currentCourses.map(course => (
                            <div key={course.courseCode} className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] gap-3 sm:gap-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative z-10 flex-grow min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-sm sm:text-base truncate">
                                        {course.courseCode}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                                        {course.courseName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full group-hover:bg-primary/20 transition-colors">
                                            {course.credits} Credits
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                            Points: {(((gradePoints[projectedGrades[course.courseCode] ?? 'F'] ?? 0) * course.credits)).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                                    <select
                                        value={projectedGrades[course.courseCode] || 'A'}
                                        onChange={(e) => handleGradeChange(course.courseCode, e.target.value)}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all hover:scale-105 text-sm sm:text-base ${getGradeColor(projectedGrades[course.courseCode] || 'A')}`}
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
        </motion.div>
    );
};

/**
 * PerformanceAnalytics displays grade analytics using only the latest grade for each course.
 * When a student retakes a course, only the most recent attempt is counted in analytics.
 */
const PerformanceAnalytics: React.FC<{ gradesData: GradesData }> = ({ gradesData }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'distribution' | 'insights'>('overview');

    // Helper function to get latest grade for each course (handles retakes)
    const getLatestGrades = useMemo(() => {
        const courseMap: { [subjectCode: string]: { grade: Grade, semester: number } } = {};

        // Iterate through semesters to track the latest occurrence of each course
        gradesData.semesters.forEach((sem: Semester) => {
            sem.grades.forEach((grade: Grade) => {
                const existing = courseMap[grade.subjectCode];
                // If course doesn't exist or current semester is later, update it
                if (!existing || sem.semester > existing.semester) {
                    courseMap[grade.subjectCode] = {
                        grade: { ...grade },
                        semester: sem.semester
                    };
                }
            });
        });

        // Return array of latest grades with semester info
        return Object.values(courseMap).map(item => ({
            ...item.grade,
            semester: item.semester
        }));
    }, [gradesData]);

    // Calculate performance trends with enhanced metrics
    const performanceTrend = useMemo(() => {
        const sortedSemesters = [...gradesData.semesters].sort((a, b) => a.semester - b.semester);
        return sortedSemesters.map((sem: Semester, index: number) => {
            const credits = sem.grades.reduce((total: number, grade: Grade) => total + (grade.credits || 0), 0);
            const prevSem = sortedSemesters[index - 1];
            const prevSgpa = index > 0 && prevSem ? prevSem.sgpa : sem.sgpa;
            const delta = sem.sgpa - prevSgpa;
            return {
                semester: `Semester ${sem.semester}`,
                semesterNum: sem.semester,
                sgpa: sem.sgpa,
                credits,
                delta: index > 0 ? delta : 0,
                courseCount: sem.grades.length
            };
        });
    }, [gradesData]);

    // Advanced Performance Metrics
    const advancedMetrics = useMemo(() => {
        const sortedSemesters = [...gradesData.semesters].sort((a, b) => a.semester - b.semester);

        // 1. Consistency Score (lower std deviation = more consistent)
        const sgpaValues = sortedSemesters.map(s => s.sgpa);
        const avgSgpa = sgpaValues.reduce((a, b) => a + b, 0) / sgpaValues.length;
        const variance = sgpaValues.reduce((sum, val) => sum + Math.pow(val - avgSgpa, 2), 0) / sgpaValues.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = Math.max(0, 100 - (stdDev * 20)); // Higher is better

        // 2. Performance Trajectory (linear regression slope)
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        const n = sortedSemesters.length;
        sortedSemesters.forEach((sem, i) => {
            sumX += i;
            sumY += sem.sgpa;
            sumXY += i * sem.sgpa;
            sumX2 += i * i;
        });
        const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
        const trajectoryStatus = slope > 0.1 ? 'Improving' : slope < -0.1 ? 'Declining' : 'Stable';

        // 3. Credit Efficiency (quality points per credit)
        const totalQualityPoints = getLatestGrades.reduce((sum, g) => sum + (gradePoints[g.grade] || 0) * g.credits, 0);
        const creditEfficiency = gradesData.totalCredits > 0 ? totalQualityPoints / gradesData.totalCredits : 0;

        // 4. High-Credit Performance (courses with 4+ credits)
        const highCreditCourses = getLatestGrades.filter(g => g.credits >= 4);
        const highCreditAvg = highCreditCourses.length > 0
            ? highCreditCourses.reduce((sum, g) => sum + (gradePoints[g.grade] || 0), 0) / highCreditCourses.length
            : 0;

        // 5. Failure/Risk Analysis
        const failedCourses = getLatestGrades.filter(g => g.grade === 'F');
        const atRiskCourses = getLatestGrades.filter(g => ['D', 'F'].includes(g.grade));

        // 6. Excellence Rate (A+ and A grades)
        const excellentGrades = getLatestGrades.filter(g => ['A+', 'A'].includes(g.grade));
        const excellenceRate = (excellentGrades.length / getLatestGrades.length) * 100;

        // 7. Academic Standing
        let academicStanding = 'Good Standing';
        if (gradesData.cgpa >= 9.0) academicStanding = "Dean's List";
        else if (gradesData.cgpa >= 8.5) academicStanding = 'Distinguished';
        else if (gradesData.cgpa >= 7.0) academicStanding = 'Good Standing';
        else if (gradesData.cgpa >= 5.0) academicStanding = 'Satisfactory';
        else academicStanding = 'Academic Probation';

        // 8. Best and Worst Semesters
        const firstSemester = sortedSemesters[0];
        const bestSemester = firstSemester
            ? sortedSemesters.reduce((best, sem) => sem.sgpa > best.sgpa ? sem : best, firstSemester)
            : { semester: 0, sgpa: 0, grades: [], sessionYear: '', sessionType: 'Monsoon' as const };
        const worstSemester = firstSemester
            ? sortedSemesters.reduce((worst, sem) => sem.sgpa < worst.sgpa ? sem : worst, firstSemester)
            : { semester: 0, sgpa: 0, grades: [], sessionYear: '', sessionType: 'Monsoon' as const };

        // 9. Improvement Potential
        const maxPossibleCGPA = 10.0;
        const improvementPotential = maxPossibleCGPA - gradesData.cgpa;

        // 10. Semester Workload Analysis
        const avgCreditsPerSem = sortedSemesters.length > 0 ? gradesData.totalCredits / sortedSemesters.length : 0;
        const maxCreditsInSem = sortedSemesters.length > 0
            ? Math.max(...sortedSemesters.map(s => s.grades.reduce((sum, g) => sum + g.credits, 0)))
            : 0;

        return {
            consistencyScore,
            stdDev,
            trajectoryStatus,
            slope,
            creditEfficiency,
            highCreditAvg,
            failedCourses,
            atRiskCourses,
            excellenceRate,
            academicStanding,
            bestSemester,
            worstSemester,
            improvementPotential,
            avgCreditsPerSem,
            maxCreditsInSem,
            avgSgpa
        };
    }, [gradesData, getLatestGrades]);

    // Performance Insights and Recommendations
    const insights = useMemo(() => {
        const recommendations: { type: 'success' | 'warning' | 'info' | 'danger', title: string, message: string }[] = [];

        // Consistency insights
        if (advancedMetrics.consistencyScore >= 90) {
            recommendations.push({
                type: 'success',
                title: 'Excellent Consistency',
                message: 'Your performance is remarkably consistent across semesters. This reflects strong time management and study habits.'
            });
        } else if (advancedMetrics.consistencyScore < 60) {
            recommendations.push({
                type: 'warning',
                title: 'Inconsistent Performance',
                message: 'Your SGPA varies significantly between semesters. Consider establishing consistent study routines and time management strategies.'
            });
        }

        // Trajectory insights
        if (advancedMetrics.trajectoryStatus === 'Improving') {
            recommendations.push({
                type: 'success',
                title: 'Upward Trajectory',
                message: `Great progress! Your SGPA is improving by approximately ${(advancedMetrics.slope * 100).toFixed(1)}% per semester.`
            });
        } else if (advancedMetrics.trajectoryStatus === 'Declining') {
            recommendations.push({
                type: 'danger',
                title: 'Performance Decline',
                message: 'Your recent semesters show declining performance. Consider seeking academic support or adjusting your course load.'
            });
        }

        // High-credit performance
        if (advancedMetrics.highCreditAvg < gradesData.cgpa - 0.5) {
            recommendations.push({
                type: 'warning',
                title: 'High-Credit Course Concern',
                message: 'You perform lower in high-credit courses. These heavily impact your CGPA - consider focusing more attention on them.'
            });
        }

        // At-risk courses
        if (advancedMetrics.atRiskCourses.length > 0) {
            recommendations.push({
                type: 'danger',
                title: `${advancedMetrics.atRiskCourses.length} At-Risk Course(s)`,
                message: `You have ${advancedMetrics.failedCourses.length} failed and ${advancedMetrics.atRiskCourses.length - advancedMetrics.failedCourses.length} D-grade courses. Consider retaking these to improve your CGPA.`
            });
        }

        // Excellence rate
        if (advancedMetrics.excellenceRate >= 50) {
            recommendations.push({
                type: 'success',
                title: 'High Excellence Rate',
                message: `${advancedMetrics.excellenceRate.toFixed(0)}% of your courses have A or A+ grades. You're performing at an exceptional level!`
            });
        }

        // Credit efficiency
        if (advancedMetrics.creditEfficiency >= 8.5) {
            recommendations.push({
                type: 'success',
                title: 'Excellent Credit Efficiency',
                message: `Your credit efficiency of ${advancedMetrics.creditEfficiency.toFixed(2)} is outstanding, meaning you're maximizing quality points per credit earned.`
            });
        }

        return recommendations;
    }, [advancedMetrics, gradesData]);

    // Calculate grade distribution with courses (using latest grades only)
    const gradeDistribution = useMemo(() => {
        const distribution: { [key: string]: { count: number, courses: any[], totalCredits: number } } = {};

        getLatestGrades.forEach((gradeWithSem: any) => {
            const gradeValue = gradeWithSem.grade;
            if (!distribution[gradeValue]) {
                distribution[gradeValue] = { count: 0, courses: [], totalCredits: 0 };
            }
            const gradeEntry = distribution[gradeValue];
            if (gradeEntry) {
                gradeEntry.count += 1;
                gradeEntry.courses.push(gradeWithSem);
                gradeEntry.totalCredits += gradeWithSem.credits || 0;
            }
        });

        return distribution;
    }, [getLatestGrades]);

    const getGradeCourses = (grade: string) => {
        return gradeDistribution[grade]?.courses || [];
    };

    // Calculate subject performance with courses (using latest grades only)
    const subjectPerformance = useMemo(() => {
        const subjects: { [key: string]: { total: number, count: number, courses: any[], totalCredits: number } } = {};

        getLatestGrades.forEach((gradeWithSem: any) => {
            const category = gradeWithSem.subjectCode.substring(0, 2);
            if (!subjects[category]) {
                subjects[category] = { total: 0, count: 0, courses: [], totalCredits: 0 };
            }
            subjects[category].total += gradePoints[gradeWithSem.grade] || 0;
            subjects[category].count += 1;
            subjects[category].courses.push(gradeWithSem);
            subjects[category].totalCredits += gradeWithSem.credits || 0;
        });

        return Object.entries(subjects)
            .map(([category, data]) => ({
                category,
                average: (data.total / data.count).toFixed(2),
                courses: data.courses,
                totalCredits: data.totalCredits
            }))
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
    }, [getLatestGrades]);

    const getCategoryCourses = (category: string) => {
        const categoryData = subjectPerformance.find(s => s.category === category);
        return categoryData?.courses || [];
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Performance Analytics
                </h3>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-lg">
                {[
                    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: '📊' },
                    { id: 'trends', label: 'Performance Trends', shortLabel: 'Trends', icon: '📈' },
                    { id: 'distribution', label: 'Grade Distribution', shortLabel: 'Distribution', icon: '🎯' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 py-2.5 sm:px-4 sm:py-2 rounded-md font-medium transition-all text-sm sm:text-base transform hover:scale-105 hover:shadow-lg ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-dark-card shadow text-primary'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span className="mr-1.5 sm:mr-2">{tab.icon}</span>
                        <span className="hidden lg:inline">{tab.label}</span>
                        <span className="lg:hidden">{tab.shortLabel}</span>
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                                    {/* Key Performance Indicators */}
                                    <motion.div 
                                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.1
                                                }
                                            }
                                        }}
                                        initial="hidden"
                                        animate="show"
                                    >
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20, scale: 0.9 },
                                                show: { opacity: 1, y: 0, scale: 1 }
                                            }}
                                            whileHover={{ y: -8, scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="group relative overflow-hidden bg-white dark:bg-dark-card p-3 sm:p-5 rounded-xl shadow-xl border-l-4 border-blue-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Academic Standing</h4>
                                                    <motion.span
                                                        className="text-base sm:text-lg"
                                                        whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        🎓
                                                    </motion.span>
                                                </div>
                                                <motion.p
                                                    className="text-base sm:text-xl font-bold text-blue-600 truncate"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    {advancedMetrics.academicStanding}
                                                </motion.p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] sm:text-xs text-slate-500">CGPA</p>
                                                    <AnimatedCounter
                                                        value={gradesData.cgpa}
                                                        decimals={2}
                                                        className="text-[10px] sm:text-xs font-semibold text-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20, scale: 0.9 },
                                                show: { opacity: 1, y: 0, scale: 1 }
                                            }}
                                            whileHover={{ y: -8, scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="group relative overflow-hidden bg-white dark:bg-dark-card p-3 sm:p-5 rounded-xl shadow-xl border-l-4 border-green-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Consistency Score</h4>
                                                    <motion.span
                                                        className="text-base sm:text-lg"
                                                        whileHover={{ scale: 1.3, rotate: 360 }}
                                                        transition={{ duration: 0.6 }}
                                                    >
                                                        🎯
                                                    </motion.span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <AnimatedCounter
                                                        value={advancedMetrics.consistencyScore}
                                                        decimals={0}
                                                        className="text-base sm:text-xl font-bold text-green-600"
                                                    />
                                                    <span className="text-base sm:text-xl font-bold text-green-600">%</span>
                                                    <ProgressRing
                                                        progress={advancedMetrics.consistencyScore}
                                                        size={24}
                                                        strokeWidth={3}
                                                        color="stroke-green-500"
                                                        className="hidden xs:block"
                                                    />
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">σ = {advancedMetrics.stdDev.toFixed(3)}</p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20, scale: 0.9 },
                                                show: { opacity: 1, y: 0, scale: 1 }
                                            }}
                                            whileHover={{ y: -8, scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="group relative overflow-hidden bg-white dark:bg-dark-card p-3 sm:p-5 rounded-xl shadow-xl border-l-4 border-purple-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Credit Efficiency</h4>
                                                    <motion.span
                                                        className="text-base sm:text-lg"
                                                        animate={{ scale: [1, 1.1, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                    >
                                                        ⚡
                                                    </motion.span>
                                                </div>
                                                <AnimatedCounter
                                                    value={advancedMetrics.creditEfficiency}
                                                    decimals={2}
                                                    className="text-base sm:text-xl font-bold text-purple-600 block"
                                                />
                                                <div className="flex items-center gap-1 mt-1">
                                                    <p className="text-[10px] sm:text-xs text-slate-500">points/credit</p>
                                                    {advancedMetrics.creditEfficiency >= 8.5 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="text-[8px] px-1 bg-purple-100 text-purple-700 rounded"
                                                        >
                                                            Excellent
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20, scale: 0.9 },
                                                show: { opacity: 1, y: 0, scale: 1 }
                                            }}
                                            whileHover={{ y: -8, scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="group relative overflow-hidden bg-white dark:bg-dark-card p-3 sm:p-5 rounded-xl shadow-xl border-l-4 border-orange-500 hover:shadow-2xl active:scale-[0.98] cursor-pointer"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Performance Trend</h4>
                                                    <motion.span
                                                        className="text-base sm:text-lg"
                                                        animate={advancedMetrics.trajectoryStatus === 'Improving'
                                                            ? { y: [0, -5, 0] }
                                                            : advancedMetrics.trajectoryStatus === 'Declining'
                                                                ? { y: [0, 5, 0] }
                                                                : { x: [0, 5, 0] }
                                                        }
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                    >
                                                        {advancedMetrics.trajectoryStatus === 'Improving' ? '📈' : advancedMetrics.trajectoryStatus === 'Declining' ? '📉' : '➡️'}
                                                    </motion.span>
                                                </div>
                                                <motion.p
                                                    className={`text-base sm:text-xl font-bold truncate ${
                                                        advancedMetrics.trajectoryStatus === 'Improving' ? 'text-green-600' :
                                                        advancedMetrics.trajectoryStatus === 'Declining' ? 'text-red-600' : 'text-orange-600'
                                                    }`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {advancedMetrics.trajectoryStatus}
                                                </motion.p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                                                    <span className={advancedMetrics.slope > 0 ? 'text-green-600' : advancedMetrics.slope < 0 ? 'text-red-600' : 'text-slate-500'}>
                                                        {advancedMetrics.slope > 0 ? '+' : ''}{(advancedMetrics.slope * 100).toFixed(1)}%
                                                    </span>
                                                    /sem
                                                </p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                
                                    {/* Performance Summary Cards */}
                                    <motion.div 
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            show: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.1
                                                }
                                            }
                                        }}
                                        initial="hidden"
                                        animate="show"
                                    >
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            whileHover={{ y: -4, scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className="group bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                                        >
                                            <h4 className="font-semibold mb-2 sm:mb-3 text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">Excellence Metrics</h4>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Excellence Rate</span>
                                                    <AnimatedCounter value={advancedMetrics.excellenceRate} decimals={1} className="font-semibold text-sm sm:text-base text-emerald-700 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Best Semester</span>
                                                    <span className="font-semibold text-sm sm:text-base">Sem {advancedMetrics.bestSemester.semester} (<AnimatedCounter value={advancedMetrics.bestSemester.sgpa} decimals={2} className="inline" />)</span>
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">High-Credit Avg</span>
                                                    <AnimatedCounter value={advancedMetrics.highCreditAvg} decimals={2} className="font-semibold text-sm sm:text-base" />
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            whileHover={{ y: -4, scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                                        >
                                            <h4 className="font-semibold mb-2 sm:mb-3 text-blue-700 dark:text-blue-400 text-sm sm:text-base">Workload Analysis</h4>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Avg Credits/Sem</span>
                                                    <AnimatedCounter value={advancedMetrics.avgCreditsPerSem} decimals={1} className="font-semibold text-sm sm:text-base text-blue-700 dark:text-blue-400" />
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Max Credits</span>
                                                    <AnimatedInteger value={advancedMetrics.maxCreditsInSem} className="font-semibold text-sm sm:text-base" />
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Total Courses</span>
                                                    <AnimatedInteger value={getLatestGrades.length} className="font-semibold text-sm sm:text-base" />
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            whileHover={{ y: -4, scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className="group bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 sm:p-5 rounded-xl sm:col-span-2 lg:col-span-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                                        >
                                            <h4 className="font-semibold mb-2 sm:mb-3 text-amber-700 dark:text-amber-400 text-sm sm:text-base">Risk Assessment</h4>
                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Failed Courses</span>
                                                    <AnimatedInteger
                                                        value={advancedMetrics.failedCourses.length}
                                                        className={`font-semibold text-sm sm:text-base ${advancedMetrics.failedCourses.length > 0 ? 'text-red-600' : 'text-green-600'}`}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">At-Risk (D/F)</span>
                                                    <AnimatedInteger
                                                        value={advancedMetrics.atRiskCourses.length}
                                                        className={`font-semibold text-sm sm:text-base ${advancedMetrics.atRiskCourses.length > 0 ? 'text-orange-600' : 'text-green-600'}`}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center p-1.5 rounded hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors">
                                                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Improvement</span>
                                                    <span className="font-semibold text-sm sm:text-base"><AnimatedCounter value={advancedMetrics.improvementPotential} decimals={2} className="inline" /> pts</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                
                                    {/* Subject Category Performance */}
                                    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base hover:text-primary transition-colors cursor-default inline-block">Subject Category Performance (Ranked)</h4>
                                        <motion.div 
                                            className="space-y-2 sm:space-y-3"
                                            variants={{
                                                hidden: { opacity: 0 },
                                                show: {
                                                    opacity: 1,
                                                    transition: {
                                                        staggerChildren: 0.1
                                                    }
                                                }
                                            }}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            {subjectPerformance.map((subject, index) => (
                                                <motion.div
                                                    key={index}
                                                    variants={{
                                                        hidden: { opacity: 0, y: 20 },
                                                        show: { opacity: 1, y: 0 }
                                                    }}
                                                >
                                                    <div
                                                        onClick={() => setSelectedCategory(selectedCategory === subject.category ? null : subject.category)}
                                                        className="group relative overflow-hidden flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-0.5"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                index === 1 ? 'bg-slate-100 text-slate-700' :
                                                                index === 2 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-50 text-slate-600'
                                                            }`}>
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <span className="font-medium">{subject.category} Courses</span>
                                                                <p className="text-xs text-slate-500">{subject.courses.length} courses • {subject.totalCredits} credits</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <span className="text-lg font-semibold text-primary">{subject.average}</span>
                                                                <p className="text-xs text-slate-500">avg grade points</p>
                                                            </div>
                                                            <svg
                                                                className={`w-5 h-5 text-slate-400 transition-transform transform ${selectedCategory === subject.category ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                
                                                    {selectedCategory === subject.category && (
                                                        <motion.div 
                                                            className="mt-2 ml-4 space-y-2"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            {getCategoryCourses(subject.category).map((course: any, courseIndex: number) => (
                                                                <div
                                                                    key={courseIndex}
                                                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-sm">{course.subjectCode}</span>
                                                                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-600 rounded-full">
                                                                                Semester {course.semester}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{course.subjectName}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs text-slate-500">{course.credits} credits</span>
                                                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(course.grade)}`}>
                                                                            {course.grade}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </div>
                                </div>
                            )}
            {/* Trends Tab */}
            {activeTab === 'trends' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* SGPA Trend with Delta */}
                    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base hover:text-primary transition-colors cursor-default inline-block">Semester Grade Point Average Trend</h4>
                        <motion.div 
                            className="space-y-3 sm:space-y-4"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {performanceTrend.map((item, index: number) => (
                                <motion.div
                                    key={index}
                                    className="space-y-1.5 sm:space-y-2"
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        show: { opacity: 1, x: 0 }
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="text-xs sm:text-sm font-medium w-14 sm:w-16">{item.semester}</span>
                                            {item.delta !== 0 && (
                                                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold ${
                                                    item.delta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.delta > 0 ? '↑' : '↓'} {Math.abs(item.delta).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] sm:text-sm text-slate-500">{item.credits} credits • {item.courseCount} courses</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="group flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 sm:h-10 relative overflow-hidden hover:shadow-inner transition-shadow cursor-pointer">
                                            <motion.div
                                                className={`absolute left-0 top-0 h-full flex items-center justify-end pr-2 sm:pr-3 group-hover:brightness-110 transition-all ${
                                                    item.sgpa >= advancedMetrics.avgSgpa
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                }`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.sgpa / 10) * 100}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.15 }}
                                                whileHover={{ scaleY: 1.1 }}
                                            >
                                                <span className="text-white text-xs sm:text-sm font-bold group-hover:scale-110 transition-transform">{item.sgpa.toFixed(2)}</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">Average SGPA:</span> {advancedMetrics.avgSgpa.toFixed(2)} •
                                <span className="font-semibold ml-2">Trend:</span> {advancedMetrics.trajectoryStatus} ({advancedMetrics.slope > 0 ? '+' : ''}{(advancedMetrics.slope * 100).toFixed(2)}% per semester)
                            </p>
                        </div>
                    </div>

                    {/* Cumulative Performance */}
                    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base hover:text-primary transition-colors cursor-default inline-block">Cumulative Credit Progression</h4>
                        <motion.div 
                            className="space-y-3"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {performanceTrend.reduce((acc: any[], item) => {
                                const cumulativeCredits = acc.length > 0 ? acc[acc.length - 1].cumulative + item.credits : item.credits;
                                acc.push({ ...item, cumulative: cumulativeCredits });
                                return acc;
                            }, []).map((item: any, index: number) => (
                                <motion.div 
                                    key={index} 
                                    className="flex items-center gap-3"
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        show: { opacity: 1, x: 0 }
                                    }}
                                >
                                    <span className="text-sm font-medium w-16">{item.semester}</span>
                                    <div className="group flex-1 cursor-pointer">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>+{item.credits} credits</span>
                                            <span className="group-hover:text-primary transition-colors">Total: {item.cumulative} credits</span>
                                        </div>
                                        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative overflow-hidden group-hover:shadow-inner transition-shadow">
                                            <motion.div
                                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:brightness-110 transition-all"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.cumulative / gradesData.totalCredits) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                whileHover={{ scaleY: 1.2 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Distribution Tab */}
            {activeTab === 'distribution' && (
                <div className="space-y-4 sm:space-y-6">
                    {/* Grade Distribution with Credit Weighting */}
                    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base hover:text-primary transition-colors cursor-default inline-block">Grade Distribution (Credit-Weighted)</h4>
                        <motion.div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {Object.entries(gradeDistribution)
                                .sort(([a], [b]) => (gradePoints[b] || 0) - (gradePoints[a] || 0))
                                .map(([grade, data]) => (
                                <motion.div
                                    key={grade}
                                    onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
                                    className={`group relative overflow-hidden text-center p-3 sm:p-4 rounded-xl shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-110 active:scale-95 ${
                                        selectedGrade === grade ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''
                                    } ${getGradeColor(grade)}`}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.8, y: 20 },
                                        show: { opacity: 1, scale: 1, y: 0 }
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10">
                                        <p className="text-2xl sm:text-3xl font-bold group-hover:scale-125 transition-transform duration-300">{data.count}</p>
                                        <p className="text-base sm:text-lg font-semibold group-hover:font-black transition-all">{grade}</p>
                                        <p className="text-[10px] sm:text-xs mt-1 opacity-75 group-hover:opacity-100 transition-opacity">{data.totalCredits} credits</p>
                                        <p className="text-[10px] sm:text-xs opacity-60 group-hover:opacity-100 group-hover:font-semibold transition-all">{((data.totalCredits / gradesData.totalCredits) * 100).toFixed(1)}%</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {selectedGrade && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between mb-3 px-2">
                                    <h5 className="font-semibold">Courses with grade {selectedGrade}</h5>
                                    <button
                                        onClick={() => setSelectedGrade(null)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {getGradeCourses(selectedGrade).map((course: any, courseIndex: number) => (
                                    <div
                                        key={courseIndex}
                                        className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 gap-2 sm:gap-0"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative z-10 flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                <span className="font-medium text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{course.subjectCode}</span>
                                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full whitespace-nowrap group-hover:bg-primary/20 transition-colors">
                                                    Sem {course.semester}
                                                </span>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">{course.subjectName}</p>
                                        </div>
                                        <div className="relative z-10 flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                                            <span className="text-[10px] sm:text-xs text-slate-500">{course.credits} credits</span>
                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold group-hover:scale-110 transition-transform ${getGradeColor(course.grade)}`}>
                                                {course.grade}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Performance Tiers */}
                    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base hover:text-primary transition-colors cursor-default inline-block">Performance Tier Breakdown</h4>
                        <motion.div 
                            className="space-y-3 sm:space-y-4"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                        >
                            {[
                                { tier: 'Excellent', grades: ['A+', 'A'], color: 'green' },
                                { tier: 'Good', grades: ['B+', 'B'], color: 'blue' },
                                { tier: 'Average', grades: ['C+', 'C'], color: 'yellow' },
                                { tier: 'Below Average', grades: ['D', 'F'], color: 'red' }
                            ].map(tierInfo => {
                                const tierCourses = getLatestGrades.filter(g => tierInfo.grades.includes(g.grade));
                                const tierCredits = tierCourses.reduce((sum, g) => sum + g.credits, 0);
                                const percentage = (tierCourses.length / getLatestGrades.length) * 100;

                                return (
                                    <motion.div 
                                        key={tierInfo.tier}
                                        variants={{
                                            hidden: { opacity: 0, x: -20 },
                                            show: { opacity: 1, x: 0 }
                                        }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1.5 sm:mb-2 gap-0.5 sm:gap-0">
                                            <div>
                                                <span className="font-medium text-sm sm:text-base hover:text-primary transition-colors cursor-default">{tierInfo.tier}</span>
                                                <span className="text-[10px] sm:text-xs text-slate-500 ml-1.5 sm:ml-2">({tierInfo.grades.join(', ')})</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-semibold">{tierCourses.length} courses • {tierCredits} credits</span>
                                        </div>
                                        <div className="group bg-slate-200 dark:bg-slate-700 rounded-full h-5 sm:h-6 relative overflow-hidden cursor-pointer hover:shadow-inner transition-shadow">
                                            <motion.div
                                                className={`absolute left-0 top-0 h-full flex items-center px-2 sm:px-3 bg-${tierInfo.color}-500 group-hover:brightness-110 transition-all`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                whileHover={{ scaleY: 1.15 }}
                                            >
                                                {percentage > 10 && (
                                                    <span className="text-white text-[10px] sm:text-xs font-semibold group-hover:scale-110 transition-transform">{percentage.toFixed(1)}%</span>
                                                )}
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
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

    const { user } = useUser();
    const courseOption = user?.courseOption || 'CBCS';

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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 space-y-4"
            >
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                    <motion.div
                        className="absolute inset-0 border-4 border-transparent border-t-secondary rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
                <motion.p
                    className="text-slate-600 dark:text-slate-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Loading your grades...
                </motion.p>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </motion.div>
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
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                </label>
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
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Academic Performance
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1">
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                            Track and analyze your academic journey
                        </p>
                        <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 w-fit">
                            {courseOption === 'NEP' ? '📚 NEP' : '📖 CBCS'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {sortedGradesData.gradeSheetUrl && (
                        <a
                            href={sortedGradesData.gradeSheetUrl}
                            download={sortedGradesData.gradeSheetFileName || 'grade-sheet'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 sm:px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">Download Grade Sheet</span>
                            <span className="sm:hidden">Download</span>
                        </a>
                    )}
                    <button
                        onClick={resetGradesState}
                        className="px-3 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="hidden sm:inline">Upload New Grade Sheet</span>
                        <span className="sm:hidden">Upload</span>
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-blue-100 text-xs sm:text-sm font-semibold">CGPA</h3>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform origin-left">{sortedGradesData.cgpa.toFixed(2)}</p>
                        {cgpaStatus && (
                            <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full ${cgpaStatus.bg} shadow-md`}>
                                {cgpaStatus.text}
                            </span>
                        )}
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-green-100 text-xs sm:text-sm font-semibold">Total Credits</h3>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black group-hover:scale-110 transition-transform origin-left">{sortedGradesData.totalCredits}</p>
                        <p className="text-green-100 text-[10px] sm:text-sm font-semibold mt-1">Completed</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-purple-100 text-xs sm:text-sm font-semibold">Semesters</h3>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black group-hover:scale-110 transition-transform origin-left">{sortedGradesData.semesters.length}</p>
                        <p className="text-purple-100 text-[10px] sm:text-sm font-semibold mt-1">Completed</p>
                    </div>
                </div>

                <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-orange-100 text-xs sm:text-sm font-semibold">Latest SGPA</h3>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-70 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black group-hover:scale-110 transition-transform origin-left">
                            {latestSemester?.sgpa.toFixed(2)}
                        </p>
                        <p className="text-orange-100 text-[10px] sm:text-sm font-semibold mt-1">
                            Semester {latestSemester?.semester}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                    onClick={() => {
                        setShowForecaster(!showForecaster);
                        if (showAnalytics) setShowAnalytics(false);
                    }}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                        showForecaster
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white dark:bg-dark-card hover:shadow-md'
                    }`}
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">{showForecaster ? 'Hide' : 'Show'} CGPA Forecaster</span>
                    <span className="sm:hidden">{showForecaster ? 'Hide' : ''} Forecaster</span>
                </button>

                <button
                    onClick={() => {
                        setShowAnalytics(!showAnalytics);
                        if (showForecaster) setShowForecaster(false);
                    }}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                        showAnalytics
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-white dark:bg-dark-card hover:shadow-md'
                    }`}
                >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">{showAnalytics ? 'Hide' : 'Show'} Analytics</span>
                    <span className="sm:hidden">{showAnalytics ? 'Hide' : ''} Analytics</span>
                </button>
            </div>

            {/* Conditional Sections */}
            {showForecaster && <CGPAForecaster />}
            {showAnalytics && <PerformanceAnalytics gradesData={sortedGradesData} />}

            {/* Semester-wise Performance */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Semester-wise Performance
                    </h3>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {sortedGradesData.semesters.map((semester: Semester) => {
                            const semesterCredits = semester.grades.reduce((total: number, grade: Grade) => total + (grade.credits || 0), 0);
                            return (
                                <div
                                    key={semester.semester}
                                    className="group relative overflow-hidden p-4 sm:p-5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => setSelectedSemester(selectedSemester === semester.semester ? null : semester.semester)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <h4 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">Semester {semester.semester}</h4>
                                            <svg
                                                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 group-hover:scale-110 ${
                                                    selectedSemester === semester.semester ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">SGPA</span>
                                                <span className="text-xl sm:text-2xl font-bold text-primary group-hover:scale-110 transition-transform origin-right">{semester.sgpa.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Credits</span>
                                                <span className="font-medium group-hover:text-primary transition-colors">{semesterCredits}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Courses</span>
                                                <span className="font-medium group-hover:text-primary transition-colors">{semester.grades.length}</span>
                                            </div>
                                            {/* Mini progress bar for SGPA */}
                                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        semester.sgpa >= 8.5 ? 'bg-green-500' :
                                                        semester.sgpa >= 7 ? 'bg-blue-500' :
                                                        semester.sgpa >= 5 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(semester.sgpa / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Semester Details */}
                    {selectedSemesterData && (
                        <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                            <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm">
                                    {selectedSemesterData.semester}
                                </span>
                                <span className="hidden sm:inline">Semester {selectedSemesterData.semester} - Detailed Grades</span>
                                <span className="sm:hidden">Semester {selectedSemesterData.semester} Details</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {selectedSemesterData.grades.map((grade: Grade, index: number) => (
                                    <div
                                        key={index}
                                        className="group relative overflow-hidden flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-dark-card rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="relative z-10 flex-grow min-w-0">
                                            <p className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base truncate">{grade.subjectCode}</p>
                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{grade.subjectName}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{grade.credits} Credits</p>
                                        </div>
                                        <div className={`relative z-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-base sm:text-lg transition-transform group-hover:scale-110 ${getGradeColor(grade.grade)}`}>
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

export default React.memo(Grades);