import { lazy, Suspense } from "react";
import { usePrediction } from "./hooks/usePrediction";

import Navbar from "./components/Navbar";
import HeroHeader from "./components/HeroHeader";
import TeamSelector from "./components/TeamSelector";
import Footer from "./components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy-load analytics components
const Scoreboard = lazy(() => import("./components/Scoreboard"));
const ProbabilityBar = lazy(() => import("./components/ProbabilityBar"));
const PoissonHeatmap = lazy(() => import("./components/PoissonHeatmap"));
const InsightBanner = lazy(() => import("./components/InsightBanner"));
const WinProbabilityDonut = lazy(() => import("./components/WinProbabilityDonut"));
const XgComparisonBar = lazy(() => import("./components/XgComparisonBar"));
const GoalDistributionChart = lazy(() => import("./components/GoalDistributionChart"));
const RecentForm = lazy(() => import("./components/RecentForm"));

function ResultSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function App() {
  const {
    teams,
    teamsLoading,
    homeTeam,
    setHomeTeam,
    awayTeam,
    setAwayTeam,
    result,
    loading,
    error,
    predict,
  } = usePrediction();

  return (
    <div className="min-h-screen bg-background font-sans antialiased grid-bg">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <HeroHeader />

        {/* Match Setup Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-5 sm:p-6">
            <h2 className="text-center text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-5">
              Match Setup
            </h2>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
              <TeamSelector
                label="Home Team"
                teams={teams}
                selected={homeTeam}
                onChange={setHomeTeam}
                isLoading={teamsLoading}
                side="home"
              />

              <div className="flex items-center justify-center py-2 md:py-6">
                <span className="text-lg font-bold text-muted-foreground/40">VS</span>
              </div>

              <TeamSelector
                label="Away Team"
                teams={teams}
                selected={awayTeam}
                onChange={setAwayTeam}
                isLoading={teamsLoading}
                side="away"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={predict}
                disabled={loading || teamsLoading || !homeTeam || !awayTeam}
                className="w-full sm:w-auto px-8 sm:px-14 py-5 text-sm sm:text-base tracking-[0.12em] uppercase font-bold shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all bg-primary text-primary-foreground border-none cursor-pointer rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    Predict Result
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Dashboard */}
        {result && (
          <Suspense fallback={
            <div className="mt-8">
              <ResultSkeleton />
            </div>
          }>
            <div className="mt-8 space-y-4 pb-8">
              {/* Section divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">
                  Analytics
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
              </motion.div>

              {/* Scoreboard */}
              <Scoreboard
                result={result}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />

              {/* Row 2: Donut + xG Bars */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <WinProbabilityDonut
                  result={result}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
                <XgComparisonBar
                  result={result}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </div>

              {/* Row 3: Probability Bar + Insight */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <ProbabilityBar result={result} />
                <InsightBanner
                  homeWinProb={result.home_win_prob}
                  awayWinProb={result.away_win_prob}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </div>

              {/* Row 4: Recent Form */}
              <RecentForm
                result={result}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />

              {/* Row 4: Heatmap + Goal Distribution */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <PoissonHeatmap matrix={result.poisson_matrix} />
                <GoalDistributionChart
                  matrix={result.poisson_matrix}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              </div>
            </div>
          </Suspense>
        )}
      </main>

      <Footer />
    </div>
  );
}
