import { memo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import type { PredictionResult } from "../types/prediction";
import { motion } from "framer-motion";

interface Props {
  result: PredictionResult;
  homeTeam: string;
  awayTeam: string;
}

const COLORS = ["#91c5ff", "#a1a1a1", "#ffa3a3"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--foreground)" className="text-sm font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={fill} className="text-lg font-black">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={1}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

export default memo(function WinProbabilityDonut({ result, homeTeam, awayTeam }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const data = [
    { name: homeTeam, value: result.home_win_prob },
    { name: "Draw", value: result.draw_prob },
    { name: awayTeam, value: result.away_win_prob },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Win Probability
      </h3>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const PieAny = Pie as any;
              return (
                <PieAny
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
                  animationBegin={200}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index]}
                      opacity={index === activeIndex ? 1 : 0.7}
                      style={{ filter: index === activeIndex ? `drop-shadow(0 0 6px ${COLORS[index]}80)` : "none" }}
                    />
                  ))}
                </PieAny>
              );
            })()}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {data.map((entry, i) => (
          <button
            key={entry.name}
            className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-100 transition-opacity"
            style={{ opacity: i === activeIndex ? 1 : 0.6 }}
            onClick={() => setActiveIndex(i)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i] }}
            />
            <span className="text-muted-foreground font-medium truncate max-w-[80px]">{entry.name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
});
