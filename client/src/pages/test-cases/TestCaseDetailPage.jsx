import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Hash,
  Layers,
  Pencil,
  Play,
  Target,
  X,
} from "lucide-react";
import {
  getTestCaseById,
  getTestCaseRuns,
  getTestCaseScripts,
  updateTestCase,
} from "@/features/test-cases/api/testCasesApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { STATUS_STYLE } from "@/features/test-cases/constants/styles.jsx";
import RunRow from "@/features/test-cases/components/RunRow";
import RunReplaySection from "@/features/test-cases/components/RunReplaySection";
import RefineSection from "@/features/test-cases/components/RefineSection";

export default function TestCaseDetailPage() {
  const { projectId, testCaseId } = useParams();
  const navigate = useNavigate();

  const [tc, setTc] = useState(null);
  const [runs, setRuns] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const goalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setScriptsLoading(true);
    setScriptsError("");
    try {
      const [caseData, runsData] = await Promise.all([
        getTestCaseById(testCaseId),
        getTestCaseRuns(testCaseId),
      ]);
      setTc(caseData);
      setRuns(runsData);
      try {
        const scriptsData = await getTestCaseScripts(testCaseId);
        setScripts(Array.isArray(scriptsData) ? scriptsData : []);
      } catch (scriptErr) {
        setScripts([]);
        setScriptsError(scriptErr?.message || "Failed to load test case scripts.");
      }
    } catch (e) {
      setError(e?.message || "Failed to load test case.");
    } finally {
      setLoading(false);
      setScriptsLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => { load(); }, [load]);

  async function handleRunCreated(newRunId) {
    await load();
    if (newRunId) navigate(`/projects/${projectId}/test-runs/${newRunId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test case…" />
      </div>
    );
  }

  if (error || !tc) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error || "Test case not found."}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  function startEditTitle() {
    setDraftTitle(tc.title ?? "");
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  }

  function startEditGoal() {
    setDraftGoal(tc.goal ?? "");
    setEditingGoal(true);
    setTimeout(() => goalRef.current?.focus(), 0);
  }

  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === tc.title) { setEditingTitle(false); return; }
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: draftTitle.trim(), goal: tc.goal, status: tc.status });
      setTc((prev) => ({ ...prev, title: draftTitle.trim() }));
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveGoal() {
    if (draftGoal === (tc.goal ?? "")) { setEditingGoal(false); return; }
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: draftGoal.trim(), status: tc.status });
      setTc((prev) => ({ ...prev, goal: draftGoal.trim() }));
    } finally {
      setSaving(false);
      setEditingGoal(false);
    }
  }

  async function saveStatus(newStatus) {
    if (newStatus === tc.status) return;
    setSaving(true);
    try {
      await updateTestCase(tc.id, { title: tc.title, goal: tc.goal, status: newStatus });
      setTc((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setSaving(false);
    }
  }

  const passCount = runs.filter((r) => r.verdict === "pass").length;
  const failCount = runs.filter((r) => r.verdict === "fail").length;
  const passRate = runs.length > 0 ? Math.round((passCount / runs.length) * 100) : null;

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate(`/projects/${projectId}/test-cases`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Test Cases
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Select value={tc.status} onValueChange={saveStatus} disabled={saving}>
                  <SelectTrigger className="h-7 w-28 text-xs px-2 border-0 shadow-none bg-transparent p-0 focus:ring-0">
                    <Badge className={`capitalize text-xs border-0 cursor-pointer ${STATUS_STYLE[tc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {tc.status}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {tc.steps?.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Layers className="size-3" /> {tc.steps.length} steps
                  </span>
                )}
              </div>

              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={titleRef}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                    onBlur={saveTitle}
                    disabled={saving}
                    className="text-xl font-bold tracking-tight border-b-2 border-indigo-500 bg-transparent outline-none w-full min-w-0"
                  />
                  <button onClick={saveTitle} className="shrink-0 text-indigo-600 hover:text-indigo-800"><Check className="size-4" /></button>
                  <button onClick={() => setEditingTitle(false)} className="shrink-0 text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-2 cursor-pointer" onClick={startEditTitle}>
                  <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-snug">{tc.title}</h1>
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              {editingGoal ? (
                <div className="flex items-start gap-2">
                  <Target className="mt-2 size-3.5 shrink-0 text-slate-400" />
                  <textarea
                    ref={goalRef}
                    value={draftGoal}
                    onChange={(e) => setDraftGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingGoal(false); }}
                    onBlur={saveGoal}
                    disabled={saving}
                    rows={3}
                    className="flex-1 text-sm text-slate-600 border-b border-indigo-400 bg-transparent outline-none resize-none leading-relaxed"
                  />
                  <button onClick={saveGoal} className="shrink-0 mt-1 text-indigo-600 hover:text-indigo-800"><Check className="size-3.5" /></button>
                  <button onClick={() => setEditingGoal(false)} className="shrink-0 mt-1 text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button>
                </div>
              ) : (
                <div className="group flex items-start gap-1.5 cursor-pointer" onClick={startEditGoal}>
                  <Target className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {tc.goal || <span className="italic text-slate-300">Add a goal…</span>}
                  </p>
                  <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400 mt-1">
              <Hash className="size-3" /> {tc.id}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Total Runs</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{runs.length}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Passed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{passCount}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-400">Pass Rate</p>
            {passRate !== null ? (
              <>
                <p className="mt-1 text-2xl font-bold text-slate-800">{passRate}%</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${passRate}%` }} />
                </div>
              </>
            ) : (
              <p className="mt-1 text-2xl font-bold text-slate-400">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Test steps */}
      {tc.steps?.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Test Steps ({tc.steps.length})
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
            {tc.steps.map((step, i) => (
              <div key={step.id ?? i} className="flex items-start gap-4 px-5 py-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-500">
                  {step.order ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {step.description || step.text || `Step ${i + 1}`}
                  </p>
                  {step.expectedResult && (
                    <p className="mt-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-500">Expected: </span>
                      {step.expectedResult}
                    </p>
                  )}
                </div>
                {step.action && step.action !== "custom" && (
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {step.action}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <RunReplaySection
        tc={tc}
        scripts={scripts}
        scriptsLoading={scriptsLoading}
        scriptsError={scriptsError}
        onRunCreated={handleRunCreated}
      />

      <RefineSection tc={tc} onApplied={load} />

      {/* Run history */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Run History ({runs.length})
          </h2>
          {runs.length > 0 && failCount > 0 && (
            <span className="text-xs text-slate-400">{failCount} failed</span>
          )}
        </div>
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16">
            <Play className="size-8 text-slate-300" />
            <p className="font-medium text-slate-500">No runs yet</p>
            <p className="text-sm text-slate-400">Run this test case to see results here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run, i) => (
              <RunRow key={run.id} run={run} projectId={projectId} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
