"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Gem, AlertTriangle, TrendingUp } from "lucide-react";

interface Props {
  homeWinProb: number;
  awayWinProb: number;
  homeTeam: string;
  awayTeam: string;
}

export default memo(function InsightBanner({
  homeWinProb,
  awayWinProb,
  homeTeam,
  awayTeam,
}: Props) {
  let icon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
  let title = "Balanced Fixture";
  let text = "Probability mass is spread evenly — this looks like a close contest.";
  let accentClass = "border-amber-500/20 bg-amber-500/5";

  if (homeWinProb > 60) {
    icon = <Gem className="h-5 w-5 text-chart-1" />;
    title = "Strong Home Advantage";
    text = `The model shows a dominant tilt towards ${homeTeam} with ${homeWinProb}% win probability.`;
    accentClass = "border-chart-1/20 bg-chart-1/5";
  } else if (awayWinProb > 60) {
    icon = <TrendingUp className="h-5 w-5 text-chart-2" />;
    title = "Away Favourite";
    text = `The model favours ${awayTeam} away from home at ${awayWinProb}% probability.`;
    accentClass = "border-chart-2/20 bg-chart-2/5";
  } else if (Math.abs(homeWinProb - awayWinProb) < 10) {
    text = `Tight margins — only ${Math.abs(homeWinProb - awayWinProb).toFixed(1)}% separates both teams.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={`bg-card rounded-xl p-5 border shadow-sm flex flex-col items-center justify-center text-center gap-3 h-full ${accentClass}`}
    >
      <div className="rounded-xl p-2.5 bg-background/60">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-black uppercase tracking-wider">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </motion.div>
  );
});
