import { memo } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Github, Zap } from "lucide-react";

export default memo(function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/30 transition-all">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        {/* Left: Logo + Brand */}
        <a className="flex items-center gap-2.5 group" href="/">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-3 via-chart-4 to-chart-5 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 group-hover:rotate-1">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-tight text-foreground">
              EPL Predictor
            </span>
            <span className="hidden sm:inline text-[0.6rem] text-muted-foreground/60 font-semibold tracking-widest uppercase">
              AI
            </span>
          </div>
        </a>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors group/gh"
            title="View on GitHub"
          >
            <Github className="h-[0.9rem] w-[0.9rem] text-muted-foreground group-hover/gh:text-foreground transition-colors" />
          </a>
          <div className="w-px h-4 bg-border/50 mx-0.5" />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
});
