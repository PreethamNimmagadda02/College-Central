// Adapted from Magic UI's Animated Circular Progress Bar (MIT):
// https://magicui.design/docs/components/animated-circular-progress-bar
import { cn } from '@lib/utils/cn';
import React, { useEffect, useState, type ReactNode } from 'react';

interface AnimatedCircularProgressBarProps {
  value: number;
  min?: number;
  max?: number;
  /** Any CSS colour for the filled arc */
  gaugePrimaryColor: string;
  /** Any CSS colour for the unfilled arc */
  gaugeSecondaryColor: string;
  className?: string;
  /** Shown in the centre of the ring */
  children?: ReactNode;
}

/** A ring gauge that fills from empty to `value` when it mounts, and animates later changes */
export function AnimatedCircularProgressBar({
  value,
  min = 0,
  max = 100,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  children,
}: AnimatedCircularProgressBarProps) {
  // Render empty first, then move to the value two frames later (after the empty ring has
  // painted) so the CSS transition plays on mount too
  const [shown, setShown] = useState(min);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(value));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [value]);

  const circumference = 2 * Math.PI * 45;
  const percent = Math.min(100, Math.max(0, Math.round(((shown - min) / (max - min)) * 100)));

  return (
    <div
      className={cn('relative size-40 text-2xl font-semibold', className)}
      style={
        {
          '--circle-size': '100px',
          '--circumference': circumference,
          '--percent-to-px': `${circumference / 100}px`,
          '--gap-percent': '5',
          '--offset-factor': '0',
          '--transition-length': '1s',
          '--delay': '0s',
          '--percent-to-deg': '3.6deg',
          transform: 'translateZ(0)',
        } as React.CSSProperties
      }
    >
      <svg fill="none" className="size-full" strokeWidth="2" viewBox="0 0 100 100">
        {percent <= 90 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              {
                stroke: gaugeSecondaryColor,
                '--stroke-percent': 90 - percent,
                '--offset-factor-secondary': 'calc(1 - var(--offset-factor))',
                strokeDasharray:
                  'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
                transform:
                  'rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)',
                transition: 'all var(--transition-length) ease var(--delay)',
                transformOrigin: 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
              } as React.CSSProperties
            }
          />
        )}
        <circle
          data-gauge="primary"
          cx="50"
          cy="50"
          r="45"
          strokeWidth="10"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            {
              stroke: gaugePrimaryColor,
              '--stroke-percent': percent,
              strokeDasharray:
                'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
              transition:
                'var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)',
              transitionProperty: 'stroke-dasharray,transform',
              transform:
                'rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))',
              transformOrigin: 'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
            } as React.CSSProperties
          }
        />
      </svg>
      {children !== undefined && (
        <span className="absolute inset-0 m-auto flex size-fit items-center justify-center">
          {children}
        </span>
      )}
    </div>
  );
}
