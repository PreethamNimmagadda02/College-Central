import { AnimatedThemeToggler } from '@components/ui/AnimatedThemeToggler';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { afterEach, describe, expect, it, vi } from 'vitest';

type StartViewTransition = (update: () => void) => {
  ready: Promise<void>;
  finished: Promise<void>;
};

/** Stand-in for the View Transitions API, which jsdom lacks */
const stubViewTransitions = () => {
  const start = vi.fn<StartViewTransition>((update) => {
    update();
    return { ready: Promise.resolve(), finished: Promise.resolve() };
  });
  const animate = vi.fn();
  Object.assign(document, { startViewTransition: start });
  Object.assign(document.documentElement, { animate });
  return { start, animate };
};

describe('AnimatedThemeToggler', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
    Reflect.deleteProperty(document.documentElement, 'animate');
  });

  it('switches the theme straight away where View Transitions are unsupported', () => {
    const onToggle = vi.fn();
    render(<AnimatedThemeToggler onToggle={onToggle} aria-label="Switch theme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch theme' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('switches inside a view transition and reveals the new theme in a growing circle', async () => {
    const { start, animate } = stubViewTransitions();
    const onToggle = vi.fn();
    render(
      <MotionConfig reducedMotion="never">
        <AnimatedThemeToggler onToggle={onToggle} aria-label="Switch theme" />
      </MotionConfig>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch theme' }));

    expect(start).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(animate).toHaveBeenCalled());
    const [keyframes, options] = animate.mock.lastCall ?? [];
    expect(keyframes?.clipPath[0]).toMatch(/^circle\(0% at /);
    expect(options?.pseudoElement).toBe('::view-transition-new(root)');
  });

  it('skips the reveal when motion is reduced', () => {
    const { start } = stubViewTransitions();
    const onToggle = vi.fn();
    render(
      <MotionConfig reducedMotion="always">
        <AnimatedThemeToggler onToggle={onToggle} aria-label="Switch theme" />
      </MotionConfig>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch theme' }));

    expect(start).not.toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
