import { useRef } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
  style?: React.CSSProperties;
}

const containerVariants = (stagger: number, delay: number, reduceMotion: boolean): Variants =>
  reduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { duration: 0 } },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      };

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'none' },
  visible: {
    opacity: 1,
    y: 0,
        transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  stagger = 0.05,
  delay = 0,
  once = true,
  amount = 0.12,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : isInView ? 'visible' : 'hidden'}
      variants={containerVariants(stagger, delay, Boolean(reduceMotion))}
    >
      {children}
    </motion.div>
  );
};
