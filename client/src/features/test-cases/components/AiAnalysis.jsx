import { useState } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import { analyzeTestRun } from "@/features/test-results/api/testResultsApi";

export default function AiAnalysis({ runId, isLive }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setAnalyzing(true);
    setErr("");
    try {
      setAnalysis(await analyzeTestRun(runId));
    } catch (e) {
      setErr(e?.message || "Failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Sparkles className="size-3.5 text-violet-400" /> AI Analysis
        </div>
        {!analysis && (
          <button
            onClick={run}
            disabled={analyzing || isLive}
            className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <>
                <span className="size-2.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-3" />
                {isLive ? "Run first" : "Generate"}
              </>
            )}
          </button>
        )}
        {analysis && (
          <button
            onClick={() => { setAnalysis(null); setErr(""); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Regenerate
          </button>
        )}
      </div>
      <div className="px-4 py-3">
        {!analysis && !analyzing && !err && (
          <p className="text-xs text-slate-400">
            {isLive ? "Available once run completes." : "Get AI-powered insights for this run."}
          </p>
        )}
        {err && <p className="text-xs text-red-500">{err}</p>}
        {analysis && (
          <div className="space-y-3">
            <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-1">
                Conclusion
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">{analysis.conclusion}</p>
            </div>
            {analysis.suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Lightbulb className="size-3 text-amber-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Suggestions
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="mt-0.5 shrink-0 size-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[9px] font-bold text-amber-600">
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
