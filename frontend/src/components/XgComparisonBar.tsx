import { memo } from "react";
import { motion } from "framer-motion";
import type { PredictionResult } from "../types/prediction";
import AnimatedCounter from "./AnimatedCounter";

interface Props {
  result: PredictionResult;
  homeTeam: string;
  awayTeam: string;
}

export default memo(function XgComparisonBar({ result, homeTeam, awayTeam }: Props) {
  const maxXg = Math.max(result.xg_home, result.xg_away, 0.01);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">
        Expected Goals (xG)
      </h3>

      <div className="space-y-5">
        {/* Home */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground truncate mr-2">{homeTeam}</span>
            <AnimatedCounter
              value={result.xg_home}
              decimals={2}
              className="text-2xl font-black text-chart-1"
            />
          </div>
          <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(result.xg_home / (maxXg * 1.3)) * 100}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
              className="h-full rounded-full bg-chart-1"
            />
          </div>
        </div>

        {/* Away */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground truncate mr-2">{awayTeam}</span>
            <AnimatedCounter
              value={result.xg_away}
              decimals={2}
              className="text-2xl font-black text-chart-2"
            />
          </div>
          <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(result.xg_away / (maxXg * 1.3)) * 100}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
              className="h-full rounded-full bg-chart-2"
            />
          </div>
        </div>
      </div>

      {/* xG Diff */}
      <div className="mt-5 pt-4 border-t border-border/40 text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">xG Difference</span>
        <div className="text-lg font-black mt-1">
          <AnimatedCounter
            value={Math.abs(result.xg_home - result.xg_away)}
            decimals={2}
            className={result.xg_home >= result.xg_away ? "text-chart-1" : "text-chart-2"}
          />
          <span className="text-xs text-muted-foreground ml-1.5">
            in favour of {result.xg_home >= result.xg_away ? homeTeam : awayTeam}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
