import { useState, useEffect, useRef } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Full-page AI analysis section with animated border.
 *
 * Props:
 *   onAnalyze       — async function → { conclusion, suggestions }
 *   isLive          — boolean, disables button while run is in progress
 *   description     — optional placeholder text shown before generating
 *   initialAnalysis — previously-generated analysis loaded from the server
 */
export default function AiAnalysisSection({ onAnalyze, isLive, description, initialAnalysis = null }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Seed the persisted analysis once it arrives from an async load.
  // Won't clobber an in-session result or a user-triggered "Regenerate".
  const seededRef = useRef(!!initialAnalysis);
  useEffect(() => {
    if (initialAnalysis && !seededRef.current && !analysis) {
      setAnalysis(initialAnalysis);
      seededRef.current = true;
    }
  }, [initialAnalysis, analysis]);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      setAnalysis(await onAnalyze());
    } catch (e) {
      setError(e?.message || "Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  const placeholder = description ?? (
    isLive
      ? "Analysis will be available once the run completes."
      : "Click \"Generate Analysis\" to get an AI-powered conclusion and actionable suggestions."
  );

  const borderCls = analyzing ? "ai-border-active" : "ai-border-idle";

  return (
    <div className="relative rounded-xl p-[1.5px]">
      {/* glow layer — blurred copy behind for vibrant halo */}
      <div className={`${borderCls} absolute inset-0 rounded-xl`}
           style={{ filter: "blur(10px)", opacity: analyzing ? 0.75 : 0.45 }} />

      {/* sharp border layer */}
      <div className={`${borderCls} absolute inset-0 rounded-xl`} />

      {/* card content */}
      <section className="relative overflow-hidden rounded-xl bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`size-4 transition-colors duration-500 ${
              analyzing ? "text-violet-400" : "text-brand-400"
            }`} />
            <h2 className="text-sm font-semibold text-foreground">AI Analysis</h2>
          </div>

          {!analysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || isLive}
              className="gap-1.5"
            >
              {analyzing ? (
                <>
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="size-3" />
                  {isLive ? "Run must complete first" : "Generate Analysis"}
                </>
              )}
            </Button>
          )}

          {analysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { seededRef.current = true; setAnalysis(null); setError(""); }}
            >
              Regenerate
            </Button>
          )}
        </div>

        <div className="px-5 py-4">
          {!analysis && !analyzing && !error && (
            <p className="text-sm text-muted-foreground">{placeholder}</p>
          )}

          {analyzing && (
            <p className="text-sm text-muted-foreground">Generating AI insights…</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {analysis && (
            <div className="space-y-4">
              <div className="rounded-lg border border-brand-500/15 bg-brand-500/8 px-4 py-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand-400">
                  Conclusion
                </p>
                <p className="text-sm leading-relaxed text-foreground">{analysis.conclusion}</p>
              </div>

              {analysis.suggestions?.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Lightbulb className="size-3.5 text-amber-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Suggestions
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-500">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
