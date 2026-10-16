// Admission numbers (and the student emails built from them) start with the
// two-digit admission year: 23JE0653 → "2023". Same century rule as sendBroadcast.
export const admissionYear = (admNoOrEmail?: string): string | null => {
  const yy = admNoOrEmail?.match(/^(\d{2})/)?.[1];
  if (!yy) return null;
  const year = Number(yy);
  return String(year < 50 ? 2000 + year : 1900 + year);
};
