// utils/courseUtils.ts

/**
 * Determines the appropriate course structure (CBCS or NEP) based on admission number
 * 24JE onwards (24JE, 25JE, 26JE, etc.) use NEP
 * Earlier batches (23JE, 22JE, 21JE, 20JE, etc.) use CBCS
 */
export const getCourseOptionFromAdmissionNumber = (admissionNumber: string): 'CBCS' | 'NEP' => {
  // Extract year from admission number (first 2 digits)
  const yearMatch = admissionNumber.match(/^(\d{2})/);

  if (yearMatch) {
    const yearStr = yearMatch[1] ?? null;
    if (!yearStr) {
      return 'CBCS';
    }
    const year = parseInt(yearStr, 10);

    // 24 and onwards (2024, 2025, 2026, etc.) use NEP
    // 23 and earlier (2023, 2022, 2021, 2020, etc.) use CBCS
    return year >= 24 ? 'NEP' : 'CBCS';
  }

  // Default to CBCS if admission number format is invalid
  return 'CBCS';
};
