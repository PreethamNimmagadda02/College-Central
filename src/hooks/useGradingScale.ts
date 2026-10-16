import { DEFAULT_GRADING_SCALE } from '@config/gradingScale';
import { useAppConfig } from '@contexts/AppConfigContext';
import { AdminGradeDefinition } from '@features/admin/types';
import { useMemo } from 'react';

export interface GradingScaleHelpers {
  gradingScale: AdminGradeDefinition[];
  gradeOptions: string[];
  gradePoints: { [key: string]: number };
  getGradeColor: (grade: string) => string;
  getGradeOutlineStyle: (grade: string) => string;
}

/**
 * Hook to access the configurable grading scale from app config.
 * Returns gradeOptions (array of grade letters), gradePoints (map of grade -> points),
 * and getGradeColor (function to get color for a grade).
 */
export const useGradingScale = (): GradingScaleHelpers => {
  const { config } = useAppConfig();

  return useMemo(() => {
    const gradingScale = config?.gradingScale?.length ? config.gradingScale : DEFAULT_GRADING_SCALE;

    // Array of grade letters in order
    const gradeOptions = gradingScale.map((g) => g.grade);

    // Map of grade letter to points
    const gradePoints: { [key: string]: number } = {};
    gradingScale.forEach((g) => {
      gradePoints[g.grade] = g.points;
    });

    // Function to get color for a grade
    const getGradeColor = (grade: string): string => {
      const gradeConfig = gradingScale.find((g) => g.grade === grade);
      return (
        gradeConfig?.color || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
      );
    };

    // Function to get outline styles for grade selection boxes (border and focus ring)
    const getGradeOutlineStyle = (grade: string): string => {
      const styleClass = getGradeColor(grade);
      // Extract color name and shade from "text-[color]-[shade]"
      const match = styleClass.match(/text-([a-z]+)-(\d+)/);
      if (match) {
        const [_, color] = match; // We only need the color name (e.g., 'green')
        // Return border and focus ring color matching the grade
        // Using -600 shade for borders/rings for visibility
        return `border-${color}-600 focus:ring-${color}-600`;
      }
      return 'border-slate-300 focus:ring-slate-400';
    };

    return {
      gradingScale,
      gradeOptions,
      gradePoints,
      getGradeColor,
      getGradeOutlineStyle,
    };
  }, [config?.gradingScale]);
};

// Safelist for Tailwind JIT to ensure dynamic classes derived from DEFAULT_GRADING_SCALE are generated.
// We need borders and focus rings for all grade colors.
//
// border-green-600 border-emerald-600 border-blue-600 border-sky-600 border-amber-600 border-yellow-600 border-orange-600 border-red-600
// focus:ring-green-600 focus:ring-emerald-600 focus:ring-blue-600 focus:ring-sky-600 focus:ring-amber-600 focus:ring-yellow-600 focus:ring-orange-600 focus:ring-red-600

export default useGradingScale;
