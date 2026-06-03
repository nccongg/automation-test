import { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { Database, Plus, Trash2, Pencil, Check, X, Table2, Sparkles, AlertTriangle, Link2 } from "lucide-react";
import DatasetTable from "@/features/datasets/components/DatasetTable";
import {
  getDataset,
  createDataset,
  updateDataset,
  deleteDataset,
  generateDatasetWithAI,
} from "@/features/datasets/api/datasetsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import PageHeader from "@/shared/components/common/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="max-w-md" aiBorder aiBorderActive={busy}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand-400" />
            New Dataset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2">
              <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dataset-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dataset-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !prompt.trim()) handleCreate(); }}
              placeholder="e.g. Login scenarios"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataset-prompt" className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-brand-400" />
              Generate with AI (optional)
            </Label>
            <textarea
              id="dataset-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the data to generate, e.g.\n"5 login scenarios: valid user, wrong password, empty fields..."`}
              rows={3}
              disabled={busy}
              className="w-full resize-none rounded-md border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
            {prompt.trim() && (
              <div className="flex items-center gap-2">
                <Label htmlFor="dataset-rows" className="shrink-0">Rows</Label>
                <Input
                  id="dataset-rows"
                  type="number" min={1} max={50}
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 5)))}
                  disabled={busy}
                  className="w-16 text-center"
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onClose(); }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || busy}
              className="gap-1.5"
            >
              {busy ? (
                <><LoadingSpinner size="sm" />{prompt.trim() ? "Generating…" : "Creating…"}</>
              ) : (
                prompt.trim() ? <><Sparkles className="size-3.5" />Generate & Create</> : "Create"
              )}
            </Button>
          </DialogFooter>
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
  const { projectId, onDatasetsUpdated } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get("datasetId");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!selectedId) {
        setDetail(null);
        setEditingName(false);
        return;
      }

      setDetail(null);
      setEditingName(false);
      setDetailLoading(true);

      try {
        const d = await getDataset(selectedId, projectId);
        if (!cancelled) {
          setDetail(d);
          setDraftName(d.name);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    loadDetail();

    return () => { cancelled = true; };
  }, [selectedId, projectId]);

  async function handleDatasetCreated(created) {
    onDatasetsUpdated?.();
    setSearchParams({ datasetId: String(created.id) });
  }

  async function handleSaveRows(rows) {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateDataset({ id: detail.id, projectId, rows });
      setDetail((prev) => ({ ...prev, rows: updated.rows }));
      onDatasetsUpdated?.();
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
      onDatasetsUpdated?.();
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  }

  async function handleDeleteCurrent() {
    if (!detail) return;
    if (!window.confirm("Delete this dataset?")) return;

    await deleteDataset(detail.id, projectId);
    setDetail(null);
    setSearchParams({});
    onDatasetsUpdated?.();
  }

  return (
    <>
      <NewDatasetDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
        onCreated={handleDatasetCreated}
      />

      <div className="space-y-6">
        <PageHeader
          title="Data"
          description="Create and manage datasets for test case variables"
          action={
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              New Dataset
            </Button>
          }
        />

        {!selectedId ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
            <Table2 className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Select a dataset from the sidebar to view and edit</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Or create a new one</p>
          </div>
        ) : detailLoading ? (
          <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                        onBlur={handleSaveName}
                        disabled={saving}
                        className="text-lg font-bold text-foreground border-b-2 border-brand-400 bg-transparent outline-none"
                      />
                      <button onClick={handleSaveName} className="cursor-pointer text-brand-400"><Check className="size-4" /></button>
                      <button onClick={() => setEditingName(false)} className="cursor-pointer text-muted-foreground"><X className="size-4" /></button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setDraftName(detail.name); setEditingName(true); }}>
                      <h2 className="text-lg font-bold text-foreground truncate">{detail.name}</h2>
                      <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ds-outlined-destructive"
                  size="sm"
                  onClick={handleDeleteCurrent}
                  className="shrink-0 gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>

              {saving && <LoadingSpinner size="sm" />}

              {(() => {
                const source = parseSourceTestCase(detail.description);
                if (!source) return null;
                return (
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/test-cases/${source.id}`)}
                    className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-brand-500/20 bg-brand-500/8 px-2.5 py-1 text-xs font-medium text-brand-400 hover:bg-brand-500/15 transition-colors"
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
      </div>
    </>
  );
}