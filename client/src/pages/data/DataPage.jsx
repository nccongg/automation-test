import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Database, Plus, Trash2, Pencil, Check, X, Table2, Sparkles, AlertTriangle, Link2 } from "lucide-react";
import DatasetTable from "@/features/datasets/components/DatasetTable";
import {
  listDatasets,
  getDataset,
  createDataset,
  updateDataset,
  deleteDataset,
  generateDatasetWithAI,
} from "@/features/datasets/api/datasetsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function NewDatasetDialog({ open, onClose, projectId, onCreated }) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [rowCount, setRowCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() { setName(""); setPrompt(""); setRowCount(5); setError(""); }

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true); setError("");
    try {
      let created;
      if (prompt.trim()) {
        const data = await generateDatasetWithAI({ projectId, prompt: prompt.trim(), rowCount });
        created = await createDataset({ projectId, name: name.trim() });
        created = await updateDataset({ id: created.id, projectId, name: name.trim(), rows: data.rows });
      } else {
        created = await createDataset({ projectId, name: name.trim() });
      }
      reset(); onClose(); onCreated(created);
    } catch (e) {
      setError(e?.message || "Failed to create dataset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !prompt.trim()) handleCreate(); }}
              placeholder="e.g. Login scenarios"
              disabled={busy}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Sparkles className="size-3 text-violet-500" />
              Generate with AI (optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the data to generate, e.g.\n"5 login scenarios: valid user, wrong password, empty fields..."`}
              rows={3}
              disabled={busy}
              className="w-full resize-none rounded-lg border border-violet-200 bg-violet-50/30 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            />
            {prompt.trim() && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 shrink-0">Rows</label>
                <input
                  type="number" min={1} max={50}
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 5)))}
                  disabled={busy}
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || busy}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {busy ? (
                <><span className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />{prompt.trim() ? "Generating…" : "Creating…"}</>
              ) : (
                prompt.trim() ? <><Sparkles className="size-3.5" />Generate & Create</> : "Create"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function parseSourceTestCase(description) {
  if (!description) return null;
  const match = description.match(/\(#(\d+)\)$/);
  if (!match) return null;
  return { id: match[1] };
}

export default function DataPage() {
  const { projectId } = useOutletContext();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // { id, name, rows }
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listDatasets(projectId)
      .then((data) => { if (!cancelled) setDatasets(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  async function selectDataset(id) {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetail(null);
    setEditingName(false);
    setDetailLoading(true);
    try {
      const d = await getDataset(id, projectId);
      setDetail(d);
      setDraftName(d.name);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDatasetCreated(created) {
    const data = await listDatasets(projectId);
    setDatasets(data);
    selectDataset(created.id);
  }

  async function handleSaveRows(rows) {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateDataset({ id: detail.id, projectId, rows });
      setDetail((prev) => ({ ...prev, rows: updated.rows }));
      setDatasets((prev) =>
        prev.map((d) => d.id === detail.id ? { ...d, rowCount: updated.rows.length } : d),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveName() {
    if (!detail || !draftName.trim() || draftName === detail.name) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDataset({ id: detail.id, projectId, name: draftName.trim(), rows: detail.rows });
      setDetail((prev) => ({ ...prev, name: updated.name }));
      setDatasets((prev) => prev.map((d) => d.id === detail.id ? { ...d, name: updated.name } : d));
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  }

  async function handleDelete(id) {
    await deleteDataset(id, projectId);
    if (selectedId === id) { setSelectedId(null); setDetail(null); }
    const data = await listDatasets(projectId);
    setDatasets(data);
  }

  return (
    <>
    <NewDatasetDialog
      open={showCreate}
      onClose={() => setShowCreate(false)}
      projectId={projectId}
      onCreated={handleDatasetCreated}
    />
    <div className="flex gap-6 h-full">
      {/* Left — dataset list */}
      <aside className="w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-700">Data</h1>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <Plus className="size-3" /> New
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
        ) : datasets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <Database className="size-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No datasets yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => selectDataset(ds.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                  selectedId === ds.id
                    ? "bg-violet-600 text-white"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ds.name}</p>
                  <p className={`text-[10px] ${selectedId === ds.id ? "text-violet-200" : "text-slate-400"}`}>
                    {ds.rowCount} {ds.rowCount === 1 ? "row" : "rows"}
                  </p>
                  {parseSourceTestCase(ds.description) && (
                    <p className={`mt-0.5 flex items-center gap-0.5 text-[10px] ${selectedId === ds.id ? "text-violet-300" : "text-slate-400"}`}>
                      <Link2 className="size-2.5 shrink-0" />
                      <span className="truncate">From test case #{parseSourceTestCase(ds.description).id}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(ds.id); }}
                  className={`shrink-0 rounded p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                    selectedId === ds.id ? "hover:bg-violet-500 text-violet-200" : "hover:bg-red-50 text-slate-400 hover:text-red-500"
                  }`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Right — table */}
      <main className="min-w-0 flex-1">
        {!selectedId ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
            <Table2 className="size-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-400">Select a dataset to view and edit</p>
            <p className="text-xs text-slate-300 mt-1">Or create a new one</p>
          </div>
        ) : detailLoading ? (
          <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Dataset header */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                      onBlur={handleSaveName}
                      disabled={saving}
                      className="text-lg font-bold text-slate-800 border-b-2 border-violet-400 bg-transparent outline-none"
                    />
                    <button onClick={handleSaveName} className="text-violet-600"><Check className="size-4" /></button>
                    <button onClick={() => setEditingName(false)} className="text-slate-400"><X className="size-4" /></button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setDraftName(detail.name); setEditingName(true); }}>
                    <h2 className="text-lg font-bold text-slate-800">{detail.name}</h2>
                    <Pencil className="size-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {saving && <LoadingSpinner size="sm" />}
              </div>

              {(() => {
                const source = parseSourceTestCase(detail.description);
                if (!source) return null;
                return (
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/test-cases/${source.id}`)}
                    className="flex items-center gap-1.5 w-fit rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <Link2 className="size-3 shrink-0" />
                    {detail.description.replace(/\s*\(#\d+\)$/, "")}
                    <span className="text-violet-400">→</span>
                  </button>
                );
              })()}
            </div>

            <DatasetTable
              rows={detail.rows}
              onChange={handleSaveRows}
            />
          </div>
        ) : null}
      </main>
    </div>
    </>
  );
}
