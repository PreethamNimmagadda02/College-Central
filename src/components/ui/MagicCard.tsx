// Adapted from Magic UI's Magic Card (MIT), spotlight only: https://magicui.design/docs/components/magic-card
import { cn } from '@lib/utils/cn';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  type HTMLMotionProps,
  type MotionStyle,
} from 'framer-motion';
import type { ReactNode } from 'react';

interface MagicCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode;
  /** Diameter in px of the spotlight */
  gradientSize?: number;
  /** Any CSS colour at the spotlight's centre */
  gradientColor?: string;
}

/**
 * A card with a soft spotlight that follows the pointer while hovered. The position lives in
 * motion values written to CSS variables, so pointer moves never re-render the card's content.
 * Magic UI's version also lights the border by painting a solid surface, which would hide a
 * translucent card, so only the spotlight is kept.
 */
export function MagicCard({
  children,
  className,
  gradientSize = 256,
  gradientColor = 'rgba(168, 85, 247, 0.3)',
  style,
  ...props
}: MagicCardProps) {
  const x = useMotionValue(-gradientSize);
  const y = useMotionValue(-gradientSize);
  const spotX = useMotionTemplate`${x}px`;
  const spotY = useMotionTemplate`${y}px`;

  return (
    <motion.div
      {...props}
      className={cn('group relative', className)}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - box.left);
        y.set(e.clientY - box.top);
      }}
      onPointerLeave={() => {
        x.set(-gradientSize);
        y.set(-gradientSize);
      }}
      style={{ ...style, '--spot-x': spotX, '--spot-y': spotY } as MotionStyle}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at var(--spot-x) var(--spot-y), ${gradientColor}, transparent 70%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
