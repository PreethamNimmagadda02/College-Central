/**
 * A confetti burst for finishing something worth marking. canvas-confetti is loaded only
 * when it fires, and skips itself for users who prefer reduced motion.
 */
export async function celebrate() {
  const { default: confetti } = await import('canvas-confetti');
  await confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  });
}
