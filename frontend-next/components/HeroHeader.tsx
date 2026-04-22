"use client";

import { memo } from "react";
import { motion } from "framer-motion";

export default memo(function HeroHeader() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full py-16 sm:py-24 text-center overflow-hidden"
    >
      {/* Grid pattern is now on body — hero inherits it */}

      <div className="relative z-10 max-w-3xl mx-auto px-4 space-y-5">
        {/* Title — tweakcn inspired */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
            Predict Your{" "}
            <span className="italic font-light text-muted-foreground">Perfect</span>
            <br />
            EPL{" "}
            <span className="italic font-light text-muted-foreground">Match</span>{" "}
            Outcome
          </h1>
        </motion.div>

        {/* Subtitle — catchy, no tech jargon */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed"
        >
          Pick two teams. Get instant AI-powered scoreline predictions,
          win probabilities, and deep statistical insights.
        </motion.p>
      </div>
    </motion.section>
  );
});
