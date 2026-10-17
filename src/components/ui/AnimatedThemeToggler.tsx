// Adapted from Magic UI's Animated Theme Toggler (MIT), circle reveal only:
// https://magicui.design/docs/components/animated-theme-toggler
import { cn } from '@lib/utils/cn';
import { useReducedMotionConfig } from 'framer-motion';
import { useRef, type ComponentPropsWithoutRef } from 'react';
import { flushSync } from 'react-dom';

interface AnimatedThemeTogglerProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> {
  /**
   * Switches the theme. The DOM must reflect the new theme by the time React commits (apply
   * the dark class in a layout effect, not a passive one), since the browser snapshots it then.
   */
  onToggle: () => void;
  /** Milliseconds the reveal takes */
  duration?: number;
}

/** A theme switch that reveals the new theme in a circle growing out of the button */
export function AnimatedThemeToggler({
  onToggle,
  duration = 400,
  className,
  children,
  ...props
}: AnimatedThemeTogglerProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const transitioning = useRef(false);
  const reduceMotion = useReducedMotionConfig();

  const toggle = () => {
    const button = ref.current;
    if (!button || reduceMotion || typeof document.startViewTransition !== 'function') {
      onToggle();
      return;
    }
    if (transitioning.current) return;

    const { innerWidth: width, innerHeight: height } = window;
    const box = button.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    // Percentages, not px: Chrome misplaces px clip-paths on the snapshot at fractional
    // display scales. circle() percentage radii resolve against hypot(w, h) / √2.
    const at = `at ${(x / width) * 100}% ${(y / height) * 100}%`;
    const from = `circle(0% ${at})`;
    const clipPath = [
      from,
      `circle(${(radius / (Math.hypot(width, height) / Math.SQRT2)) * 100}% ${at})`,
    ];

    const root = document.documentElement;
    // index.css starts the new snapshot at this clip, so Firefox cannot flash it unclipped
    root.style.setProperty('--theme-reveal-from', from);
    transitioning.current = true;

    const transition = document.startViewTransition(() => flushSync(onToggle));
    transition.ready
      .then(() =>
        root.animate(
          { clipPath },
          {
            duration,
            easing: 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-new(root)',
          }
        )
      )
      .catch(() => {});
    transition.finished
      .finally(() => {
        transitioning.current = false;
        root.style.removeProperty('--theme-reveal-from');
      })
      .catch(() => {});
  };

  return (
    <button type="button" ref={ref} onClick={toggle} className={cn(className)} {...props}>
      {children}
    </button>
  );
}
