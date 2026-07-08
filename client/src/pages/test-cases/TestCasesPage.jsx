import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { useOutletContext, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import {
  createCollection as createTestCollection,
} from "@/features/test-collection/api/testCollectionApi";
import ErrorPopup from "@/shared/components/common/ErrorPopup";
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

function CreateCollectionDialog({ open, onClose, onCreated, projectId }) {
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

      await createTestCollection({
        projectId: Number(projectId),
        name: name.trim(),
        description: description.trim(),
        parentId: null,
      });

      await onCreated?.();
      reset();
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to create test collection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Test Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Login, Checkout Flow, Smoke Tests"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="collection-desc">Description (optional)</Label>
            <Input
              id="collection-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What test cases should this folder contain?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create Collection"}
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
    onCollectionsUpdated,
  } = useOutletContext();

  const { refetch: refetchCases } = useTestCases(projectId);

  const [runError, setRunError] = useState("");
  const [suiteDialog, setSuiteDialog] = useState(null);
  const [createCollection, setCreateCollection] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [candidatesTarget, setCandidatesTarget] = useState(null);

  async function handleCollectionCreated() {
    await onCollectionsUpdated?.();
  }

  async function handleAISaved() {
    await Promise.all([
      refetchCases?.(),
      onTestCasesUpdated?.(),
    ]);
  }

  return (
    <>
      <div className="rounded-xl bg-card">
        {/* Page header */}
        <div className="border-b border-border px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <h1 className="text-[24px] font-bold leading-[30px] tracking-[0.5px] text-foreground sm:text-[26px]">
              Test Cases
            </h1>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0 lg:pt-1">
              <ScanWebsiteButton
                projectId={projectId}
                className="w-full sm:w-auto"
                controlsClassName="w-full flex-col items-stretch sm:w-auto sm:flex-row sm:items-center"
                statusClassName="w-full justify-center sm:w-auto"
                buttonClassName="w-full sm:w-auto"
                stopButtonClassName="w-full sm:w-auto"
              />
              <Button
                variant="outline"
                onClick={() => setCreateCollection(true)}
                className="w-full sm:w-auto"
              >
                <FolderPlus className="size-4" />
                New Collection
              </Button>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-[14px] leading-5 tracking-[0.5px] text-muted-foreground">
            Organize test cases by collections and generate automated test cases
          </p>
        </div>

      </div>

      {/* AI Workbench — animated border card */}
      <div className="relative mt-6 overflow-hidden rounded-xl bg-border/70 p-[1.5px]">
        <div
          className={`${aiGenerating ? "ai-border-active" : "ai-border-idle"} absolute inset-0 rounded-xl`}
          style={{ filter: "blur(6px)", opacity: aiGenerating ? 0.38 : 0.18 }}
          aria-hidden="true"
        />
        <div
          className={`${aiGenerating ? "ai-border-active" : "ai-border-idle"} absolute inset-0 rounded-xl`}
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-xl bg-card">
          <AIWorkbenchDrawer
            inline
            open={true}
            onClose={() => {}}
            projectId={projectId}
            onSaved={handleAISaved}
            onGeneratingChange={setAiGenerating}
            candidatesTarget={candidatesTarget}
          />
        </div>
      </div>

      {/* Portal target — candidates section renders here, outside the animated border */}
      <div ref={setCandidatesTarget} />

      <ErrorPopup open={!!runError} onClose={() => setRunError("")} />

      <AddToSuiteDialog
        open={!!suiteDialog}
        onClose={() => setSuiteDialog(null)}
        testCaseId={suiteDialog?.id}
        testCaseTitle={suiteDialog?.title}
        projectId={projectId}
      />

      <CreateCollectionDialog
        open={createCollection}
        onClose={() => setCreateCollection(false)}
        onCreated={handleCollectionCreated}
        projectId={projectId}
      />
    </>
  );
}
