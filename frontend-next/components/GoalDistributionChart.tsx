"use client";

import { memo, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

interface Props {
  matrix: number[][];
  homeTeam: string;
  awayTeam: string;
}

export default memo(function GoalDistributionChart({ matrix, homeTeam, awayTeam }: Props) {
  const data = useMemo(() => {
    const size = Math.min(matrix.length, 7);
    return Array.from({ length: size }, (_, goals) => {
      const homeProb = matrix[goals]?.reduce((s, v) => s + v, 0) ?? 0;
      const awayProb = matrix.reduce((s, row) => s + (row[goals] ?? 0), 0);
      return {
        goals: `${goals}`,
        home: +(homeProb * 100).toFixed(1),
        away: +(awayProb * 100).toFixed(1),
      };
    });
  }, [matrix]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="h-full flex flex-col justify-center bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Goal Distribution
      </h3>

      <div className="h-[220px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="20%" margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
            <XAxis
              dataKey="goals"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Goals",
                position: "insideBottom",
                offset: -2,
                fill: "var(--muted-foreground)",
                fontSize: 10,
                style: { textTransform: "uppercase", letterSpacing: "0.1em" },
              }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={38}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 700 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`${value}%`, name === "home" ? homeTeam : awayTeam]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(label: any) => `${label} Goal${label === "1" ? "" : "s"}`}
            />
            <Bar dataKey="home" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={300}>
              {data.map((_, i) => (
                <Cell key={`h-${i}`} fill="#91c5ff" opacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="away" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={500}>
              {data.map((_, i) => (
                <Cell key={`a-${i}`} fill="#ffa3a3" opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />
          <span className="text-muted-foreground font-medium">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-2" />
          <span className="text-muted-foreground font-medium">{awayTeam}</span>
        </div>
      </div>
    </motion.div>
  );
});
