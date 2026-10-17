// Adapted from Magic UI's Dot Pattern (MIT): https://magicui.design/docs/components/dot-pattern
import { cn } from '@lib/utils/cn';
import { useId } from 'react';

interface DotPatternProps {
  /** Horizontal spacing between dots, in px */
  width?: number;
  /** Vertical spacing between dots, in px */
  height?: number;
  /** Dot radius, in px */
  radius?: number;
  /** Dot colour comes from the text colour, e.g. text-white/15 */
  className?: string;
}

/**
 * A static dot grid that fills its positioned parent. It is one SVG pattern tile the browser
 * repeats: Magic UI's current version renders a separate animated circle per dot, which on a
 * tall page runs to thousands of elements.
 */
export function DotPattern({ width = 16, height = 16, radius = 1, className }: DotPatternProps) {
  // useId's punctuation (: or «») is not safe in every browser's url(#...) references
  const id = `dots-${useId().replace(/[^\w-]/g, '')}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full fill-current text-neutral-400/80',
        className
      )}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
