export const HOSTEL_OPTIONS: string[] = [
  "Amber Hostel",
  "Aquamarine Hostel",
  "Diamond Hostel",
  "Emerald Hostel",
  "International Hostel",
  "Jasper Hostel",
  "Opal Hostel",
  "Rosaline & Ruby Hostel",
  "Sapphire Hostel",
  "Topaz Hostel",
];

export const BRANCH_OPTIONS: string[] = [
  "Applied Geology",
  "Applied Geophysics",
  "Chemical Engineering",
  "Chemical Science",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Engineering Physics",
  "Environmental Engineering",
  "Mathematics and Computing",
  "Mechanical Engineering",
  "Mineral and Metallurgical Engineering",
  "Mining Engineering",
  "Mining Engineering and MBA in Logistic and Supply Chain Management (IIM Mumbai)",
  "Mining Machinery Engineering",
  "Petroleum Engineering",
  "Physical Science",
];

export const COURSE_OPTIONS: Array<{ value: 'CBCS' | 'NEP'; label: string; description: string }> = [
  {
    value: 'CBCS',
    label: 'CBCS (Choice Based Credit System)',
    description: 'Credits = 3×L + 2×T + 1×P'
  },
  {
    value: 'NEP',
    label: 'NEP (National Education Policy)',
    description: 'Credits = L + T + P'
  }
];
