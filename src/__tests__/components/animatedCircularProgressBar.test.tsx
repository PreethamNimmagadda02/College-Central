import { AnimatedCircularProgressBar } from '@components/ui/AnimatedCircularProgressBar';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/** The arc's fill as a percentage of the ring, read from the primary circle */
const fill = () =>
  document
    .querySelector<SVGCircleElement>('[data-gauge="primary"]')
    ?.style.getPropertyValue('--stroke-percent');

describe('AnimatedCircularProgressBar', () => {
  it('starts empty and fills to the value after mounting, so the arc animates in', async () => {
    render(
      <AnimatedCircularProgressBar
        value={72}
        gaugePrimaryColor="white"
        gaugeSecondaryColor="gray"
      />
    );

    expect(fill()).toBe('0');
    await waitFor(() => expect(fill()).toBe('72'));
  });

  it('clamps a value past max to a full ring', async () => {
    render(
      <AnimatedCircularProgressBar
        value={150}
        gaugePrimaryColor="white"
        gaugeSecondaryColor="gray"
      />
    );

    await waitFor(() => expect(fill()).toBe('100'));
  });

  it('shows its children in the centre', () => {
    render(
      <AnimatedCircularProgressBar value={40} gaugePrimaryColor="white" gaugeSecondaryColor="gray">
        🎓
      </AnimatedCircularProgressBar>
    );

    expect(screen.getByText('🎓')).toBeInTheDocument();
  });
});
