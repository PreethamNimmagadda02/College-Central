// Adapted from Magic UI's Blur Fade (MIT): https://magicui.design/docs/components/blur-fade
import { motion, useInView, type UseInViewOptions, type Variants } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  /** Seconds */
  duration?: number;
  /** Seconds before the fade starts */
  delay?: number;
  /** How far, in px, the content travels while fading in */
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Wait until the content scrolls into view before fading in */
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  blur?: string;
}

/**
 * Fades content in from a blur, and back out when it leaves an AnimatePresence. Unlike Magic
 * UI's version it has no AnimatePresence of its own: that one never unmounts, and it kept an
 * outer AnimatePresence from playing the exit when a keyed BlurFade is swapped.
 */
export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = 'down',
  inView = false,
  inViewMargin = '-50px',
  blur = '6px',
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isVisible = !inView || inViewResult;
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const variants: Variants = {
    hidden: {
      [axis]: direction === 'right' || direction === 'down' ? -offset : offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: { [axis]: 0, opacity: 1, filter: 'blur(0px)' },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      exit="hidden"
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
