import { useState, useEffect, useRef } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import { analyzeTestRun } from "@/features/test-results/api/testResultsApi";

export default function AiAnalysis({ runId, isLive, initialAnalysis = null }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState("");

  // Seed the persisted analysis once it loads; don't clobber a fresh result.
  const seededRef = useRef(!!initialAnalysis);
  useEffect(() => {
    if (initialAnalysis && !seededRef.current && !analysis) {
      setAnalysis(initialAnalysis);
      seededRef.current = true;
    }
  }, [initialAnalysis, analysis]);

  async function run() {
    setAnalyzing(true);
    setErr("");
    try {
      setAnalysis(await analyzeTestRun(runId));
    } catch (e) {
      setErr(e?.message || "Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-brand-400" />
          <span className="text-xs font-semibold text-foreground">AI Analysis</span>
        </div>

        {!analysis && (
          <button
            onClick={run}
            disabled={analyzing || isLive}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500/8 px-2.5 py-1 text-xs font-medium text-brand-400 transition-colors hover:bg-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <span className="size-2.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                {isLive ? "Run must complete first" : "Generate Analysis"}
              </>
            )}
          </button>
        )}

        {analysis && (
          <button
            onClick={() => { seededRef.current = true; setAnalysis(null); setErr(""); }}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Regenerate
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {!analysis && !analyzing && !err && (
          <p className="text-xs text-muted-foreground">
            {isLive
              ? "Analysis will be available once the run completes."
              : "Get AI-powered insights for this run."}
          </p>
        )}

        {err && <p className="text-xs text-destructive">{err}</p>}

        {analysis && (
          <div className="space-y-3">
            <div className="rounded-lg border border-brand-500/15 bg-brand-500/8 px-3 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-400">
                Conclusion
              </p>
              <p className="text-xs leading-relaxed text-foreground">{analysis.conclusion}</p>
            </div>

            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1">
                  <Lightbulb className="size-3 text-amber-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggestions
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-[9px] font-bold text-amber-500">
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
    </div>
  );
}
