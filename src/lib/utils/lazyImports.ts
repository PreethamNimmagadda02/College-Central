/**
 * Lazy import utilities for code splitting
 * Delays loading of heavy libraries until they're actually needed
 */

/**
 * Lazy load jsPDF only when needed
 */
export async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
}

/**
 * Lazy load image compression only when needed
 */
export async function getImageCompression() {
  const { default: imageCompression } = await import('browser-image-compression');
  return imageCompression;
}
