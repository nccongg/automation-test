import { useState, useEffect } from "react";
import { Plus, Check, ListTodo, ChevronRight } from "lucide-react";
import {
  getTestSheets,
  createTestSheet,
  addSheetItems,
} from "@/features/test-collection/api/testSheetApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AddToSuiteDialog({
  open,
  onClose,
  testCaseId,
  testCaseTitle,
  projectId,
}) {
  const [suites, setSuites] = useState([]);
  const [loadingSuites, setLoadingSuites] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setCreating(false);
    setNewName("");
    setErr("");
    setSuccess(false);
    setLoadingSuites(true);
    getTestSheets(projectId)
      .then(setSuites)
      .catch(() => setErr("Failed to load suites."))
      .finally(() => setLoadingSuites(false));
  }, [open, projectId]);

  async function handleConfirm() {
    if (!creating && !selectedId) return;
    if (creating && !newName.trim()) return;
    try {
      setSaving(true);
      setErr("");
      let sheetId = selectedId;
      if (creating) {
        const sheet = await createTestSheet({
          projectId: Number(projectId),
          name: newName.trim(),
        });
        sheetId = sheet?.id;
      }
      await addSheetItems(sheetId, [testCaseId]);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 900);
    } catch (e) {
      setErr(e?.message || "Failed to add to suite.");
    } finally {
      setSaving(false);
    }
  }

  const canConfirm = creating ? newName.trim().length > 0 : selectedId !== null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ListTodo className="size-4 text-indigo-600" />
            Add to Test Suite
          </DialogTitle>
          {testCaseTitle && (
            <DialogDescription className="truncate text-xs">
              &ldquo;{testCaseTitle}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>

        {err && <p className="text-sm text-red-500">{err}</p>}

        {success ? (
          <div className="flex flex-col items-center gap-2 py-8 text-emerald-600">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-5" />
            </div>
            <p className="text-sm font-medium">Added to suite!</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {/* Suite list */}
            {loadingSuites ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading suites…
              </p>
            ) : suites.length === 0 && !creating ? (
              <p className="py-2 text-sm text-muted-foreground">
                No suites yet — create one below.
              </p>
            ) : suites.length > 0 ? (
              <div className="max-h-56 overflow-y-auto divide-y rounded-lg border">
                {suites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(s.id);
                      setCreating(false);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 ${
                      selectedId === s.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    {/* Radio dot */}
                    <div
                      className={`size-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedId === s.id
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedId === s.id && (
                        <div className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {s.description}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {s.itemCount ?? 0} case{s.itemCount !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Create new toggle */}
            {!creating ? (
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setSelectedId(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-indigo-400 hover:text-indigo-600"
              >
                <Plus className="size-4" />
                Create new suite
              </button>
            ) : (
              <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
                <Label className="text-xs font-semibold text-indigo-700">
                  New Suite Name
                </Label>
                <Input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                  placeholder="e.g. Smoke Tests, Regression Suite"
                  className="h-8 text-sm"
                />
                {suites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setNewName("");
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="size-3 rotate-180" />
                    Pick existing instead
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!canConfirm || saving}
                onClick={handleConfirm}
              >
                {saving ? "Adding…" : "Add to Suite"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
