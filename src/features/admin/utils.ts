// Admission numbers (and the student emails built from them) start with the
// two-digit admission year: 23JE0653 → "2023".
export const admissionYear = (admNoOrEmail?: string): string | null => {
  const yy = admNoOrEmail?.match(/^(\d{2})/)?.[1];
  return yy ? `20${yy}` : null;
};
