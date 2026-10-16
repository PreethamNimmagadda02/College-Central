// One colour per course, assigned in order of first appearance. The map is shared so a
// course looks the same on the Schedule page and the Dashboard.

// Original 16-color palette with order-based assignment
// Ordered for maximum visual distinction - alternating warm/cool, no similar colors adjacent
const COURSE_COLORS = [
  'bg-purple-500/25 border-2 border-purple-600 text-purple-800 dark:text-purple-200', // Purple
  'bg-emerald-500/25 border-2 border-emerald-600 text-emerald-800 dark:text-emerald-200', // Emerald (green-blue)
  'bg-rose-500/25 border-2 border-rose-600 text-rose-800 dark:text-rose-200', // Rose (pink-red)
  'bg-cyan-500/25 border-2 border-cyan-600 text-cyan-800 dark:text-cyan-200', // Cyan (blue-green)
  'bg-amber-500/25 border-2 border-amber-600 text-amber-800 dark:text-amber-200', // Amber (yellow-orange)
  'bg-indigo-500/25 border-2 border-indigo-600 text-indigo-800 dark:text-indigo-200', // Indigo (blue-purple)
  'bg-orange-500/25 border-2 border-orange-600 text-orange-800 dark:text-orange-200', // Orange
  'bg-sky-500/25 border-2 border-sky-600 text-sky-800 dark:text-sky-200', // Sky Blue
  'bg-fuchsia-500/25 border-2 border-fuchsia-600 text-fuchsia-800 dark:text-fuchsia-200', // Fuchsia (magenta)
  'bg-lime-500/25 border-2 border-lime-600 text-lime-800 dark:text-lime-200', // Lime (yellow-green)
  'bg-red-500/25 border-2 border-red-600 text-red-800 dark:text-red-200', // Red
  'bg-blue-500/25 border-2 border-blue-600 text-blue-800 dark:text-blue-200', // Blue
  'bg-yellow-500/25 border-2 border-yellow-600 text-yellow-800 dark:text-yellow-200', // Yellow
  'bg-violet-500/25 border-2 border-violet-600 text-violet-800 dark:text-violet-200', // Violet
  'bg-green-500/25 border-2 border-green-600 text-green-800 dark:text-green-200', // Green
  'bg-pink-500/25 border-2 border-pink-600 text-pink-800 dark:text-pink-200', // Pink
];

// Map to track color assignments per course code
const courseColorMap = new Map<string, number>();
let nextColorIndex = 0;

export const getClassColor = (courseCode: string, isCustomTask?: boolean) => {
  // Custom tasks get a distinctive teal/cyan color scheme
  if (isCustomTask) {
    return 'bg-teal-500/25 border-2 border-teal-600 text-teal-800 dark:text-teal-200';
  }

  // Check if this course already has a color assigned
  if (!courseColorMap.has(courseCode)) {
    // Assign the next color in sequence
    courseColorMap.set(courseCode, nextColorIndex);
    nextColorIndex = (nextColorIndex + 1) % COURSE_COLORS.length;
  }

  const colorIndex = courseColorMap.get(courseCode)!;
  return COURSE_COLORS[colorIndex];
};
