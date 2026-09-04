"use client";

import { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Home, Plane } from "lucide-react";
import { getTeamLogo } from "@/lib/teamLogos";

interface Props {
  label: string;
  teams: string[];
  selected: string;
  onChange: (team: string) => void;
  isLoading: boolean;
  side: "home" | "away";
}

export default memo(function TeamSelector({
  label,
  teams,
  selected,
  onChange,
  isLoading,
  side,
}: Props) {
  const isHome = side === "home";
  const logoSrc = selected ? getTeamLogo(selected) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: isHome ? -15 : 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="space-y-3 w-full"
    >
      {/* Selected team logo preview */}
      <div className="h-20 flex items-center justify-center">
        {selected && logoSrc ? (
          <motion.div
            key={selected}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative group flex items-center justify-center"
          >
            <div className={`absolute inset-0 rounded-full blur-lg opacity-40 transition-opacity ${isHome ? "bg-chart-1/30" : "bg-chart-2/30"}`} />
            <img
              src={logoSrc}
              alt={`${selected} logo`}
              className="h-16 w-16 object-contain drop-shadow-md relative z-10"
            />
          </motion.div>
        ) : selected ? (
          <motion.div
            key={selected}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`h-16 w-16 rounded-full border-2 border-dashed flex items-center justify-center font-black text-lg ${
              isHome ? "border-chart-1/40 text-chart-1" : "border-chart-2/40 text-chart-2"
            }`}
          >
            {selected.substring(0, 2).toUpperCase()}
          </motion.div>
        ) : (
          <div className="h-16 w-16 rounded-full border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground/40 font-medium">
            Select
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </Label>
        <span
          className={`inline-flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
            isHome
              ? "bg-chart-1/10 text-chart-3 border-chart-1/20"
              : "bg-chart-2/10 text-chart-2 border-chart-2/20"
          }`}
        >
          {isHome ? <Home className="h-2.5 w-2.5" /> : <Plane className="h-2.5 w-2.5" />}
          {isHome ? "Host" : "Away"}
        </span>
      </div>

      <Select value={selected} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger
          className={`w-full h-11 text-sm bg-background/60 backdrop-blur-sm border transition-all hover:border-primary/40 focus:ring-2 ring-primary/20 rounded-xl ${
            selected
              ? isHome ? "border-chart-1/40" : "border-chart-2/40"
              : ""
          }`}
        >
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-xl">
          {teams.map((t) => {
            const itemLogo = getTeamLogo(t);
            return (
              <SelectItem
                key={t}
                value={t}
                className="cursor-pointer text-sm py-2 focus:bg-primary/10 focus:text-foreground rounded-lg"
              >
                <div className="flex items-center gap-2.5">
                  {itemLogo ? (
                    <img src={itemLogo} alt="" className="h-5 w-5 object-contain shrink-0" />
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0 text-muted-foreground">
                      {t.charAt(0)}
                    </span>
                  )}
                  <span className="truncate font-medium">{t}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </motion.div>
  );
});

