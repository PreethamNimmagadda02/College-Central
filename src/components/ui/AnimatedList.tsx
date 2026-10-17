// Adapted from Magic UI's Animated List (MIT): https://magicui.design/docs/components/animated-list
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import React, { type ReactElement, type ReactNode } from 'react';

const spring: Transition = { type: 'spring', stiffness: 350, damping: 40 };

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
  /** Seconds between items' entrances, capped after a few items */
  stagger?: number;
}

/**
 * A list whose items spring in, animate out when removed, and slide into place as others
 * change size. Magic UI's version reveals one item per second, newest first, which suits a
 * demo; here every item shows at once in the given order, with only a short entrance stagger.
 * Children need keys.
 */
export function AnimatedList({ children, className, stagger = 0.04 }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence initial>
        {React.Children.toArray(children).map((child, index) => (
          <motion.div
            key={(child as ReactElement).key}
            layout
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            // The stagger delays only the entrance, so later layout changes (an item expanding)
            // happen at once
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { ...spring, delay: Math.min(index, 8) * stagger },
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={spring}
            style={{ originY: 0 }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
