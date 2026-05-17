import { useState } from "react";
import {
  Search,
  FolderPlus,
} from "lucide-react";
import { useOutletContext, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import {
  createTestSheet,
} from "@/features/test-collection/api/testSheetApi";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
import PageHeader from "@/shared/components/common/PageHeader";
import AddToSuiteDialog from "@/shared/components/common/AddToSuiteDialog";
import AIWorkbenchDrawer from "@/features/test-cases/components/AIWorkbenchDrawer";
import ScanWebsiteButton from "@/features/projects/components/ScanWebsiteButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function CreateSuiteDialog({ open, onClose, onCreated, projectId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function reset() {
    setName("");
    setDescription("");
    setErr("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setErr("");

      await createTestSheet({
        projectId: Number(projectId),
        name,
        description,
      });

      await onCreated?.();
      reset();
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create suite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
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
              placeholder="e.g. Login, Smoke Tests, Checkout Flow"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="suite-desc">Description (optional)</Label>
            <Input
              id="suite-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What test cases belong in this suite?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
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

export default function TestCasesPage() {
  const { projectId } = useParams();
  const {
    onTestCasesUpdated,
    onSuitesUpdated,
  } = useOutletContext();

  const { refetch: refetchCases } = useTestCases(projectId);

  const [searchTerm, setSearchTerm] = useState("");
  const [runError, setRunError] = useState("");
  const [suiteDialog, setSuiteDialog] = useState(null);

  const [createSuite, setCreateSuite] = useState(false);

  async function handleSuiteCreated() {
    await onSuitesUpdated?.();
  }

  async function handleAISaved() {
    await Promise.all([
      refetchCases?.(),
      onTestCasesUpdated?.(),
    ]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Cases"
        description="Organize and run your automated test cases"
        action={
          <div className="flex items-center gap-2">
            <ScanWebsiteButton projectId={projectId} />
            <Button
              variant="outline"
              onClick={() => setCreateSuite(true)}
              className="gap-2"
            >
              <FolderPlus className="size-4" />
              New Suite
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search test cases…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <AIWorkbenchDrawer
        inline
        open={true}
        onClose={() => {}}
        projectId={projectId}
        onSaved={handleAISaved}
      />

      <ErrorPopup open={!!runError} onClose={() => setRunError("")} />

      <AddToSuiteDialog
        open={!!suiteDialog}
        onClose={() => setSuiteDialog(null)}
        testCaseId={suiteDialog?.id}
        testCaseTitle={suiteDialog?.title}
        projectId={projectId}
      />

      <CreateSuiteDialog
        open={createSuite}
        onClose={() => setCreateSuite(false)}
        onCreated={handleSuiteCreated}
        projectId={projectId}
      />
    </div>
  );
}