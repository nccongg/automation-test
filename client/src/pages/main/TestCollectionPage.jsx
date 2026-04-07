import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, FolderOpen, ChevronRight, Layers, Trash2 } from "lucide-react";
import { useTestSheets } from "@/features/test-collection/hooks/useTestSheets";
import { createTestSheet, deleteTestSheet } from "@/features/test-collection/api/testSheetApi";
import PageHeader from "@/shared/components/common/PageHeader";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import EmptyState from "@/shared/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CreateSheetDialog({ open, onClose, onCreated, projectId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      setErr("");
      const sheet = await createTestSheet({ projectId: Number(projectId), name, description });
      onCreated(sheet);
      setName("");
      setDescription("");
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create sheet.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Test Sheet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input
              id="sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smoke Tests"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sheet-desc">Description (optional)</Label>
            <Input
              id="sheet-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create Sheet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TestCollectionPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { sheets, loading, error, refetch } = useTestSheets(projectId);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(e, sheetId) {
    e.stopPropagation();
    if (!window.confirm("Delete this test sheet?")) return;
    try {
      setDeletingId(sheetId);
      await deleteTestSheet(sheetId);
      refetch();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test sheets..." />
      </div>
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={refetch} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Collections"
        description="Group test cases into sheets and run them together"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" />
            New Sheet
          </Button>
        }
      />

      {sheets.length === 0 ? (
        <EmptyState
          title="No Test Sheets"
          description="Create a sheet to group and run test cases together"
        />
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="group flex items-center justify-between gap-4 p-4 hover:bg-slate-50 cursor-pointer"
              onClick={() =>
                navigate(`/projects/${projectId}/collections/${sheet.id}`)
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FolderOpen className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{sheet.name}</p>
                  {sheet.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {sheet.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers className="size-3" />
                    <span>{sheet.itemCount ?? 0} test case{sheet.itemCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                  onClick={(e) => handleDelete(e, sheet.id)}
                  disabled={deletingId === sheet.id}
                  title="Delete sheet"
                >
                  <Trash2 className="size-4" />
                </button>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSheetDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetch}
        projectId={projectId}
      />
    </div>
  );
}
