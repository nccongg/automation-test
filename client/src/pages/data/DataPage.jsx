import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Database, Plus, Trash2, Pencil, Check, X, Table2 } from "lucide-react";
import DatasetTable from "@/features/datasets/components/DatasetTable";
import {
  listDatasets,
  getDataset,
  createDataset,
  updateDataset,
  deleteDataset,
} from "@/features/datasets/api/datasetsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";

export default function DataPage() {
  const { projectId } = useOutletContext();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // { id, name, rows }
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [creatingName, setCreatingName] = useState("");
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

  async function handleCreate() {
    const name = creatingName.trim();
    if (!name) return;
    const created = await createDataset({ projectId, name });
    setCreatingName("");
    setShowCreate(false);
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

        {/* Create input */}
        {showCreate && (
          <div className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/50 px-3 py-2">
            <input
              autoFocus
              type="text"
              value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreate(false); }}
              placeholder="Dataset name…"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button type="button" onClick={handleCreate} className="text-violet-600 hover:text-violet-800"><Check className="size-3.5" /></button>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button>
          </div>
        )}

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

            <DatasetTable
              rows={detail.rows}
              onChange={handleSaveRows}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
