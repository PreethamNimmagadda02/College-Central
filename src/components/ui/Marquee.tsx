// Adapted from Magic UI's Marquee (MIT), horizontal only: https://magicui.design/docs/components/marquee
import { cn } from '@lib/utils/cn';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Copies of the content laid end to end, so the loop has no gap */
  repeat?: number;
}

/**
 * Scrolls its content sideways in an endless loop. Speed and spacing come from the --duration
 * and --gap CSS variables, e.g. className="[--duration:45s]". Only the first copy is exposed to
 * assistive technology, so screen readers do not read the content `repeat` times.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex flex-row gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
        className
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn('flex shrink-0 flex-row justify-around gap-(--gap) animate-marquee', {
            'group-hover:paused': pauseOnHover,
            'direction-[reverse]': reverse,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
