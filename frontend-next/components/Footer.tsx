"use client";

import { memo } from "react";

export default memo(function Footer() {
  return (
    <footer className="w-full mt-auto pt-8 pb-6">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Built as a{" "}
            <span className="font-semibold text-foreground">pre-match insight layer</span>
            , not a guarantee machine.
          </p>
          <p className="text-xs text-muted-foreground/50 max-w-md leading-relaxed">
            Always add context: injuries, rotations, travel, tactics &amp; schedule congestion.
          </p>
        </div>
      </div>
    </footer>
  );
});
