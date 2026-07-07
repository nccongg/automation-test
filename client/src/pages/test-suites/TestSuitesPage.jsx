import { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ChevronRight, FlaskConical, Plus } from "lucide-react";
import { useTestSheets } from "@/features/test-collection/hooks/useTestSheets";
import { createTestSheet } from "@/features/test-collection/api/testSheetApi";
import PageHeader from "@/shared/components/common/PageHeader";
import EmptyState from "@/shared/components/common/EmptyState";
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

function formatUpdatedAt(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

export default function TestSuitesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onSuitesUpdated } = useOutletContext();
  const { sheets, loading, error, refetch } = useTestSheets(projectId);
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated() {
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

      {sheets.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card">
          <EmptyState
            title="No test suites yet"
            description="Create a suite to group related test cases, control their order, and run them together as a batch."
            action={{
              label: "Create Suite",
              onClick: () => setShowCreate(true),
            }}
          />
        </div>
      )}

      {sheets.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Select a Test Suite
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a suite to view its test cases, run configuration, and recent suite runs.
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {sheets.length} suite{sheets.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
            {sheets.map((sheet) => {
              const itemCount = sheet.itemCount ?? 0;
              const updatedAt = formatUpdatedAt(sheet.updatedAt);

              return (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => navigate(`/projects/${projectId}/suites/${sheet.id}`)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground group-hover:text-foreground">
                    <FlaskConical className="size-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {sheet.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {sheet.description || "No description"}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70">
                      <span>
                        {itemCount} test case{itemCount !== 1 ? "s" : ""}
                      </span>
                      {updatedAt && <span>Updated {updatedAt}</span>}
                    </span>
                  </span>

                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <CreateSuiteDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        projectId={projectId}
      />
    </div>
  );
}
