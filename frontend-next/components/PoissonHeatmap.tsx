"use client";

import { memo, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface Props {
  matrix: number[][];
}

export default memo(function PoissonHeatmap({ matrix }: Props) {
  const size = 6;

  const { slice, maxVal } = useMemo(() => {
    const s = matrix.slice(0, size).map((row) => row.slice(0, size));
    const m = Math.max(...s.flat());
    return { slice: s, maxVal: m };
  }, [matrix]);

  // Color interpolation using chart tokens
  const getCellColor = (intensity: number) => {
    if (intensity < 0.3) {
      return `rgba(145, 197, 255, ${intensity * 1.5 + 0.08})`;
    }
    if (intensity < 0.6) {
      const t = (intensity - 0.3) / 0.3;
      const r = Math.round(145 - t * 108);
      const g = Math.round(197 - t * 98);
      const b = Math.round(255 - t * 16);
      return `rgba(${r}, ${g}, ${b}, ${intensity + 0.2})`;
    }
    const t = (intensity - 0.6) / 0.4;
    const r = Math.round(37 - t * 6);
    const g = Math.round(99 - t * 36);
    const b = Math.round(239 - t * 66);
    return `rgba(${r}, ${g}, ${b}, ${Math.min(intensity + 0.3, 1)})`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Scoreline Probabilities
      </h3>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-1.5 min-w-[300px] max-w-[380px] mx-auto"
          style={{ gridTemplateColumns: `36px repeat(${size}, 1fr)` }}
        >
          {/* Column headers */}
          <div className="flex items-end justify-center pb-1">
            <span className="text-[0.55rem] font-bold text-muted-foreground/60 uppercase">H\A</span>
          </div>
          {Array.from({ length: size }, (_, i) => (
            <div key={`ah-${i}`} className="text-center text-[0.7rem] font-bold text-muted-foreground/80 pb-1">
              {i}
            </div>
          ))}

          {/* Rows */}
          {slice.map((row, h) => (
            <div key={`row-${h}`} className="contents">
              {/* Row header */}
              <div className="flex items-center justify-center text-[0.7rem] font-bold text-muted-foreground/80 pr-1">
                {h}
              </div>
              {row.map((val, a) => {
                const intensity = maxVal > 0 ? val / maxVal : 0;
                const pct = (val * 100).toFixed(1);
                return (
                  <TooltipProvider key={`${h}-${a}`} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: (h * size + a) * 0.02 + 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          whileHover={{ scale: 1.2, zIndex: 20 }}
                          className="aspect-square flex items-center justify-center rounded-lg text-[0.6rem] font-bold cursor-default transition-shadow hover:shadow-lg"
                          style={{
                            backgroundColor: getCellColor(intensity),
                            color: intensity > 0.35 ? "#fff" : "var(--foreground)",
                          }}
                        >
                          {(val * 100).toFixed(0)}%
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover border-border">
                        <p className="font-mono text-xs">
                          <span className="text-chart-1 font-bold">Home {h}</span>
                          {" - "}
                          <span className="text-chart-2 font-bold">{a} Away</span>
                        </p>
                        <p className="font-black text-sm mt-0.5">{pct}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        <span className="text-[0.55rem] text-muted-foreground/60 uppercase tracking-wider">Low</span>
        <div className="flex gap-0.5">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
            <div
              key={v}
              className="w-4 h-2.5 rounded-sm"
              style={{ backgroundColor: getCellColor(v) }}
            />
          ))}
        </div>
        <span className="text-[0.55rem] text-muted-foreground/60 uppercase tracking-wider">High</span>
      </div>

      <div className="mt-2 text-center text-[0.55rem] text-muted-foreground/50 uppercase tracking-[0.15em]">
        Rows: Home Goals · Cols: Away Goals
      </div>
    </motion.div>
  );
});
