import { useRef, useState } from "react";
import { ArrowLeft, Check, Pencil, Play, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateTestSheet } from "@/features/test-collection/api/testSheetApi";
import { Button } from "@/components/ui/button";

export default function SuiteHeader({
  projectId,
  sheetId,
  sheet,
  items,
  running,
  onRun,
  onAddCases,
  onSheetUpdated,
}) {
  const navigate = useNavigate();

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  function startEditTitle() {
    setDraftTitle(sheet?.name ?? "");
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function startEditDesc() {
    setDraftDesc(sheet?.description ?? "");
    setEditingDesc(true);
    setTimeout(() => descInputRef.current?.focus(), 0);
  }

  async function saveTitle() {
    if (!draftTitle.trim() || draftTitle === sheet?.name) {
      setEditingTitle(false);
      return;
    }
    try {
      setSaving(true);
      await updateTestSheet(sheetId, { name: draftTitle.trim(), description: sheet?.description });
      onSheetUpdated({ name: draftTitle.trim() });
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveDesc() {
    if (draftDesc === (sheet?.description ?? "")) {
      setEditingDesc(false);
      return;
    }
    try {
      setSaving(true);
      await updateTestSheet(sheetId, { name: sheet?.name, description: draftDesc.trim() || null });
      onSheetUpdated({ description: draftDesc.trim() || null });
    } finally {
      setSaving(false);
      setEditingDesc(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate(`/projects/${projectId}/suites`)}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All Suites
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                onBlur={saveTitle}
                className="w-full min-w-0 border-b-2 border-brand-500 bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none"
                disabled={saving}
              />
              <button onClick={saveTitle} className="shrink-0 text-brand-600 hover:text-brand-800">
                <Check className="size-4" />
              </button>
              <button onClick={() => setEditingTitle(false)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="group flex cursor-pointer items-center gap-2" onClick={startEditTitle}>
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {sheet?.name ?? "Test Suite"}
              </h1>
              <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )}

          {editingDesc ? (
            <div className="flex items-center gap-2">
              <input
                ref={descInputRef}
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveDesc();
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                onBlur={saveDesc}
                placeholder="Add a description..."
                className="w-full min-w-0 border-b border-brand-400 bg-transparent text-[13px] text-muted-foreground outline-none"
                disabled={saving}
              />
              <button onClick={saveDesc} className="shrink-0 text-brand-600 hover:text-brand-800">
                <Check className="size-3.5" />
              </button>
              <button onClick={() => setEditingDesc(false)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex cursor-pointer items-center gap-1.5" onClick={startEditDesc}>
              <p className="truncate text-[13px] text-muted-foreground">
                {sheet?.description || `${items.length} test case${items.length !== 1 ? "s" : ""}`}
              </p>
              <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={onAddCases} className="gap-2">
            <Plus className="size-4" />
            Add Cases
          </Button>
          <Button onClick={onRun} disabled={running || items.length === 0} className="gap-2">
            <Play className="size-4" />
            {running ? "Starting..." : "Run Suite"}
          </Button>
        </div>
      </div>
    </div>
  );
}
