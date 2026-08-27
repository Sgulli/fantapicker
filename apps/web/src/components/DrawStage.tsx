import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type DrawStageProps = {
  drawKey: string;
  children: ReactNode;
};

const easing = [0.16, 1, 0.3, 1] as const;

export function DrawStage({ drawKey, children }: DrawStageProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={drawKey}
        initial={
          reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }
        }
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
        transition={{
          duration: reduce ? 0.08 : 0.28,
          ease: easing,
        }}
        className="flex w-full max-w-sm justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
