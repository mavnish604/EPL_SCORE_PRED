"use client";

import { memo } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Github } from "lucide-react";

export default memo(function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/30 transition-all">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        {/* Left: Logo + Brand */}
        <a className="flex items-center gap-2.5 group" href="/">
          <div className="relative">
            <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo1.png" alt="EPL Predictor" className="h-full w-full object-contain" />
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
            href="https://github.com/mavnish604/EPL_SCORE_PRED"
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
