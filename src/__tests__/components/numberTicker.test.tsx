import { NumberTicker } from '@components/ui/NumberTicker';
import { render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { afterEach, describe, expect, it } from 'vitest';

const SetupObserver = window.IntersectionObserver;

/** Reports every observed element as on screen, so in-view animations start */
class VisibleObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    const entry = { isIntersecting: true, target } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
}

describe('NumberTicker', () => {
  afterEach(() => {
    window.IntersectionObserver = SetupObserver;
  });

  it('shows the final value straight away when motion is reduced', () => {
    render(
      <MotionConfig reducedMotion="always">
        <NumberTicker value={8.893} decimalPlaces={2} data-testid="cgpa" />
      </MotionConfig>
    );
    expect(screen.getByTestId('cgpa')).toHaveTextContent('8.89');
  });

  it('starts from the formatted start value before it is on screen', () => {
    render(
      <MotionConfig reducedMotion="never">
        <NumberTicker value={8.89} decimalPlaces={2} data-testid="cgpa" />
      </MotionConfig>
    );
    expect(screen.getByTestId('cgpa')).toHaveTextContent('0.00');
  });

  // A strongly overdamped spring creeps through its last percent for seconds, leaving a
  // wrong CGPA on screen; the count must land on the exact value promptly
  it('counts up to the exact value within a couple of seconds once on screen', async () => {
    window.IntersectionObserver = VisibleObserver as unknown as typeof IntersectionObserver;
    render(
      <MotionConfig reducedMotion="never">
        <NumberTicker value={120} data-testid="credits" />
      </MotionConfig>
    );
    await waitFor(() => expect(screen.getByTestId('credits')).toHaveTextContent('120'), {
      timeout: 2500,
    });
  });
});
