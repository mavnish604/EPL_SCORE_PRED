"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { PredictionResult } from "@/types/prediction";
import AnimatedCounter from "./AnimatedCounter";

interface Props {
  result: PredictionResult;
  homeTeam: string;
  awayTeam: string;
}

export default memo(function Scoreboard({ result, homeTeam, awayTeam }: Props) {
  const winner =
    result.home_win_prob > result.away_win_prob
      ? "home"
      : result.away_win_prob > result.home_win_prob
        ? "away"
        : "draw";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm"
    >
      {/* Subtle background tints */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-chart-1/3 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-chart-2/3 to-transparent" />
      </div>

      <div className="relative z-10 p-5 sm:p-8">
        {/* AI Prediction badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3" />
            </span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-foreground">
              AI Prediction
            </span>
          </div>
        </motion.div>

        {/* Main scoreboard — stacked on mobile, side-by-side on sm+ */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
          {/* Home team */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full sm:flex-1 text-center space-y-1"
          >
            <div className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">Home</div>
            <div className="text-sm sm:text-xl font-black uppercase tracking-tight leading-tight break-words">
              {homeTeam}
            </div>
          </motion.div>

          {/* Score */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
              className={`text-5xl sm:text-6xl font-black tabular-nums ${winner === "home" ? "text-chart-1" : "text-foreground/80"}`}
            >
              <AnimatedCounter value={result.xg_home} decimals={2} duration={1500} />
            </motion.div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-6 sm:h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <span className="text-[0.6rem] font-bold tracking-widest text-muted-foreground/50 uppercase">xG</span>
              <div className="h-6 sm:h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
              className={`text-5xl sm:text-6xl font-black tabular-nums ${winner === "away" ? "text-chart-2" : "text-foreground/80"}`}
            >
              <AnimatedCounter value={result.xg_away} decimals={2} duration={1500} />
            </motion.div>
          </div>

          {/* Away team */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full sm:flex-1 text-center space-y-1"
          >
            <div className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground">Away</div>
            <div className="text-sm sm:text-xl font-black uppercase tracking-tight leading-tight break-words">
              {awayTeam}
            </div>
          </motion.div>
        </div>

        {/* Bottom separator & probability summary */}
        <div className="mt-6 sm:mt-8 pt-5 border-t border-border/40">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-chart-1 shrink-0" />
              <span className="text-muted-foreground">
                Home <span className="text-foreground">{result.home_win_prob}%</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Draw <span className="text-foreground">{result.draw_prob}%</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
              <span className="text-muted-foreground">
                Away <span className="text-foreground">{result.away_win_prob}%</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
