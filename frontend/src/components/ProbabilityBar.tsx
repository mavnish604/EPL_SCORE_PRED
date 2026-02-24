import { memo } from "react";
import { motion } from "framer-motion";
import type { PredictionResult } from "../types/prediction";
import AnimatedCounter from "./AnimatedCounter";

interface Props {
  result: PredictionResult;
}

export default memo(function ProbabilityBar({ result }: Props) {
  const { home_win_prob, draw_prob, away_win_prob } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5">
        Outcome Probability
      </h3>

      {/* Labels above bar */}
      <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
        <span className="text-chart-1">
          <AnimatedCounter value={home_win_prob} decimals={1} suffix="%" />
        </span>
        <span className="text-muted-foreground">
          <AnimatedCounter value={draw_prob} decimals={1} suffix="%" />
        </span>
        <span className="text-chart-2">
          <AnimatedCounter value={away_win_prob} decimals={1} suffix="%" />
        </span>
      </div>

      {/* Animated bar */}
      <div className="relative flex h-5 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${home_win_prob}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          className="h-full bg-chart-1"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${draw_prob}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
          className="h-full bg-muted-foreground/40"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${away_win_prob}%` }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
          className="h-full bg-chart-2"
        />
      </div>

      {/* Bottom labels */}
      <div className="flex justify-between mt-3 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground/80">
        <span>Home Win</span>
        <span>Draw</span>
        <span>Away Win</span>
      </div>
    </motion.div>
  );
});
