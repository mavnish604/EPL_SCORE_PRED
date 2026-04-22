"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { PredictionResult } from "@/types/prediction";
import { TrendingUp, Shield } from "lucide-react";

interface Props {
  result: PredictionResult;
  homeTeam: string;
  awayTeam: string;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-lg font-bold text-foreground leading-tight">{value}</div>
        <div className="text-[0.6rem] text-muted-foreground/70">{sub}</div>
      </div>
    </motion.div>
  );
}

export default memo(function RecentForm({ result, homeTeam, awayTeam }: Props) {
  const { home, away } = result.form;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Recent Form (Last 5)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Home team form */}
        <div className="space-y-2">
          <div className="text-[0.65rem] font-bold uppercase tracking-wider text-chart-1 text-center">
            {homeTeam}
          </div>
          <StatCard
            label="Avg Scored"
            value={home.scored.toFixed(2)}
            sub="goals per game"
            icon={<TrendingUp className="h-4 w-4 text-chart-1" />}
            delay={0.6}
          />
          <StatCard
            label="Avg Conceded"
            value={home.conceded.toFixed(2)}
            sub="goals per game"
            icon={<Shield className="h-4 w-4 text-chart-2" />}
            delay={0.7}
          />
        </div>

        {/* Away team form */}
        <div className="space-y-2">
          <div className="text-[0.65rem] font-bold uppercase tracking-wider text-chart-2 text-center">
            {awayTeam}
          </div>
          <StatCard
            label="Avg Scored"
            value={away.scored.toFixed(2)}
            sub="goals per game"
            icon={<TrendingUp className="h-4 w-4 text-chart-1" />}
            delay={0.8}
          />
          <StatCard
            label="Avg Conceded"
            value={away.conceded.toFixed(2)}
            sub="goals per game"
            icon={<Shield className="h-4 w-4 text-chart-2" />}
            delay={0.9}
          />
        </div>
      </div>

      {(home.is_fallback || away.is_fallback) && (
        <p className="text-center text-[0.55rem] text-muted-foreground/50 mt-3 uppercase tracking-wider">
          * Some form data uses season averages when recent matches are unavailable
        </p>
      )}
    </motion.div>
  );
});
