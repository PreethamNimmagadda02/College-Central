import { BlurFade } from '@components/ui/BlurFade';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { describe, expect, it } from 'vitest';

const Quote = ({ text }: { text: string }) => (
  <MotionConfig reducedMotion="never">
    <AnimatePresence mode="wait">
      <BlurFade key={text}>{text}</BlurFade>
    </AnimatePresence>
  </MotionConfig>
);

describe('BlurFade', () => {
  it('fades the old content out before the new content replaces it', async () => {
    const { rerender } = render(<Quote text="Stay curious" />);

    rerender(<Quote text="Keep going" />);

    // Still mounted while its exit plays
    expect(screen.getByText('Stay curious')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Keep going')).toBeInTheDocument());
    expect(screen.queryByText('Stay curious')).not.toBeInTheDocument();
  });
});
