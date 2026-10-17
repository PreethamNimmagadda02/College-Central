// Adapted from Magic UI's Number Ticker (MIT): https://magicui.design/docs/components/number-ticker
import { cn } from '@lib/utils/cn';
import { useInView, useMotionValue, useReducedMotionConfig, useSpring } from 'framer-motion';
import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  /** Seconds to wait after the number scrolls into view */
  delay?: number;
  decimalPlaces?: number;
}

const format = (n: number, decimalPlaces: number) =>
  Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(n);

/** Counts from `startValue` up to `value` the first time it scrolls into view */
export function NumberTicker({
  value,
  startValue = 0,
  delay = 0,
  decimalPlaces = 0,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotionConfig();
  const motionValue = useMotionValue(startValue);
  // Duration-based, not Magic UI's damping 60 / stiffness 100: that spring is so overdamped it
  // spends seconds crawling through the last percent, showing a slightly wrong number
  const springValue = useSpring(motionValue, { duration: 1500, bounce: 0 });
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (reduceMotion || !isInView) return;
    const timer = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, reduceMotion]);

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current) ref.current.textContent = format(latest, decimalPlaces);
      }),
    [springValue, decimalPlaces]
  );

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)} {...props}>
      {format(reduceMotion ? value : startValue, decimalPlaces)}
    </span>
  );
}
