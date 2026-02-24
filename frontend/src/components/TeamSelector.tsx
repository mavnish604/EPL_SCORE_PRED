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
      className="space-y-2.5 w-full"
    >
      {/* Selected team logo */}
      {selected && logoSrc && (
        <div className="flex justify-center pb-1">
          <motion.img
            key={selected}
            src={logoSrc}
            alt={`${selected} logo`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="h-16 w-16 object-contain drop-shadow-md"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Label className="text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </Label>
        <span
          className={`inline-flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
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
          className={`w-full h-10 text-sm bg-background/50 border transition-all hover:border-primary/30 focus:ring-1 ring-ring/20 rounded-lg ${
            selected
              ? isHome ? "border-chart-1/25" : "border-chart-2/25"
              : ""
          }`}
        >
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t} value={t} className="cursor-pointer text-sm focus:bg-primary/10 focus:text-foreground">
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Fallback: text if no logo */}
      {selected && !logoSrc && (
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
            className={`h-2 w-2 rounded-full shrink-0 ${isHome ? "bg-chart-1" : "bg-chart-2"}`}
          />
          <span className="text-sm font-semibold text-foreground/90 truncate">
            {selected}
          </span>
        </div>
      )}
    </motion.div>
  );
});

