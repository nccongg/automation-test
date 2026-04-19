import { useState, useEffect } from "react";
import { Play, RotateCcw, Database, FileCode2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import { createTestRun, replayTestRun } from "@/features/test-results/api/testResultsApi";
import {
  getCurrentVersionId,
  getRuntimeConfigId,
  toNullablePositiveInt,
  toNullableNonNegativeInt,
  trimOrNull,
  parseJsonObject,
} from "../utils/testCaseUtils";

export default function RunReplaySection({ tc, scripts, scriptsLoading, scriptsError, onRunCreated }) {
  const [datasetId, setDatasetId] = useState("");
  const [datasetAlias, setDatasetAlias] = useState("");
  const [rowIndex, setRowIndex] = useState("");
  const [rowKey, setRowKey] = useState("");
  const [paramsOverrideText, setParamsOverrideText] = useState("{}");
  const [replayParamsText, setReplayParamsText] = useState("{}");
  const [selectedScriptId, setSelectedScriptId] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!selectedScriptId && scripts?.length > 0) {
      setSelectedScriptId(String(scripts[0].id));
    }
  }, [scripts, selectedScriptId]);

  async function handleCreateRun() {
    setBusyAction("run");
    setActionError("");
    setActionSuccess("");
    try {
      const result = await createTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        datasetId: toNullablePositiveInt(datasetId),
        datasetAlias: trimOrNull(datasetAlias),
        rowIndex: toNullableNonNegativeInt(rowIndex),
        rowKey: trimOrNull(rowKey),
        paramsOverride: parseJsonObject(paramsOverrideText, "Run paramsOverride"),
      });
      setActionSuccess("Run started successfully.");
      await onRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setActionError(e?.message || "Failed to start test run.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleReplayRun() {
    setBusyAction("replay");
    setActionError("");
    setActionSuccess("");
    try {
      const executionScriptId = toNullablePositiveInt(selectedScriptId);
      if (!executionScriptId) throw new Error("Please select an execution script before replay.");
      const result = await replayTestRun({
        testCaseId: tc.id,
        testCaseVersionId: getCurrentVersionId(tc),
        runtimeConfigId: getRuntimeConfigId(tc),
        executionScriptId,
        datasetId: toNullablePositiveInt(datasetId),
        datasetAlias: trimOrNull(datasetAlias),
        rowIndex: toNullableNonNegativeInt(rowIndex),
        rowKey: trimOrNull(rowKey),
        params: parseJsonObject(replayParamsText, "Replay params"),
      });
      setActionSuccess("Replay started successfully.");
      await onRunCreated(result?.testRunId || result?.id || null);
    } catch (e) {
      setActionError(e?.message || "Failed to replay execution script.");
    } finally {
      setBusyAction("");
    }
  }

  const defaultRuntimeConfigId = getRuntimeConfigId(tc);

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/40 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-sky-100">
        <PlayCircle className="size-4 text-sky-600" />
        <h2 className="text-sm font-semibold text-sky-800">Run / Replay</h2>
        <span className="ml-auto text-xs text-sky-500">
          Start a new run or replay an existing recorded script with different input data
        </span>
      </div>

      <div className="px-5 py-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-sky-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database className="size-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-700">Dataset Input</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Dataset ID", value: datasetId, onChange: setDatasetId, placeholder: "e.g. 1" },
                { label: "Dataset Alias", value: datasetAlias, onChange: setDatasetAlias, placeholder: "e.g. credentials" },
                { label: "Row Index", value: rowIndex, onChange: setRowIndex, placeholder: "e.g. 0" },
                { label: "Row Key", value: rowKey, onChange: setRowKey, placeholder: "e.g. nguyenhung" },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                  <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Leave these blank if the backend should use the default dataset binding.
            </div>
          </div>

          <div className="rounded-xl border border-sky-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileCode2 className="size-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-slate-700">Replay Script</h3>
            </div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Execution Script</label>
            <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue
                  placeholder={
                    scriptsLoading ? "Loading scripts..." : scripts.length > 0 ? "Select a script" : "No scripts available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {scripts.map((script) => (
                  <SelectItem key={script.id} value={String(script.id)}>
                    #{script.id} · {script.script_type || script.scriptType || "script"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scriptsError ? (
              <p className="mt-2 text-xs text-red-500">{scriptsError}</p>
            ) : scripts.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">No replay script found for this test case yet.</p>
            ) : null}
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Replay uses the same script with a different dataset row or different params JSON.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                Runtime config: {defaultRuntimeConfigId ?? "default from version"}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                Version: {getCurrentVersionId(tc) ?? "current"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Play className="size-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-700">Run paramsOverride</h3>
            </div>
            <textarea
              value={paramsOverrideText}
              onChange={(e) => setParamsOverrideText(e.target.value)}
              rows={7}
              placeholder='{"username":"nguyenhung","password":"aaa"}'
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <p className="mt-2 text-xs text-slate-400">
              Used for normal run: backend will merge dataset row + paramsOverride.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <RotateCcw className="size-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-700">Replay params</h3>
            </div>
            <textarea
              value={replayParamsText}
              onChange={(e) => setReplayParamsText(e.target.value)}
              rows={7}
              placeholder='{"username":"nguyenhung2","password":"abab"}'
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-violet-300"
            />
            <p className="mt-2 text-xs text-slate-400">
              Used for replay: backend will resolve dataset row first, then merge with this params JSON.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionSuccess}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleCreateRun}
            disabled={busyAction === "run" || busyAction === "replay"}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {busyAction === "run" ? (
              <><LoadingSpinner size="sm" /><span className="ml-2">Starting Run...</span></>
            ) : (
              <><Play className="mr-2 size-4" />Start Run</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReplayRun}
            disabled={busyAction === "run" || busyAction === "replay" || scriptsLoading || scripts.length === 0}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            {busyAction === "replay" ? (
              <><LoadingSpinner size="sm" /><span className="ml-2">Starting Replay...</span></>
            ) : (
              <><RotateCcw className="mr-2 size-4" />Replay Script</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
