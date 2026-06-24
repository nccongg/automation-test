import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTestSheets } from "@/features/test-collection/hooks/useTestSheets";
import { createTestSheet } from "@/features/test-collection/api/testSheetApi";
import PageHeader from "@/shared/components/common/PageHeader";
import { SkeletonListPage } from "@/shared/components/common/Skeleton";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CreateSuiteDialog({ open, onClose, onCreated, projectId }) {
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
      setErr(e?.message || "Failed to create suite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Test Suite</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="suite-name">Name</Label>
            <Input
              id="suite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smoke Tests"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suite-desc">Description (optional)</Label>
            <Input
              id="suite-desc"
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
              {saving ? "Creating..." : "Create Suite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TestSuitesPage() {
  const { projectId } = useParams();
  const { onSuitesUpdated } = useOutletContext();
  const { loading, error, refetch } = useTestSheets(projectId);
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(sheet) {
    refetch();
    onSuitesUpdated?.();
  }

  if (loading) {
    return (
      <SkeletonListPage rows={6} />
    );
  }

  if (error) {
    return <ErrorPopup open={true} onClose={refetch} onRetry={refetch} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Suites"
        description="Group test cases into ordered suites and run them as a batch"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="size-4" />
            New Suite
          </Button>
        }
      />

      <CreateSuiteDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        projectId={projectId}
      />
    </div>
  );
}