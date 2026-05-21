import { useMemo, useState } from "react";
import { addCollectionItems } from "@/features/test-collection/api/testCollectionApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AddToCollectionDialog({
  open,
  onClose,
  collection,
  testCases = [],
  onSaved,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const collectionName = collection?.name ?? "Collection";

  const availableTestCases = useMemo(() => {
    const existingIds = new Set(
      (collection?.items ?? []).map((item) =>
        Number(item.testCaseId ?? item.id),
      ),
    );

    return (testCases ?? []).filter((tc) => !existingIds.has(Number(tc.id)));
  }, [collection, testCases]);

  function reset() {
    setSelectedIds([]);
    setErr("");
  }

  function toggleTestCase(testCaseId) {
    const id = Number(testCaseId);

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (!collection?.id || selectedIds.length === 0) return;

    try {
      setSaving(true);
      setErr("");

      await addCollectionItems(collection.id, selectedIds);

      await onSaved?.();
      reset();
      onClose();
    } catch (e) {
      setErr(e?.message || "Failed to add test cases to collection.");
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
          <DialogTitle>Add test cases to {collectionName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {err && <p className="text-sm text-red-600">{err}</p>}

          {availableTestCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No available test cases to add.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-md border p-2">
              {availableTestCases.map((tc) => {
                const checked = selectedIds.includes(Number(tc.id));

                return (
                  <label
                    key={tc.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTestCase(tc.id)}
                      className="size-4"
                    />

                    <span className="min-w-0 flex-1 truncate text-sm">
                      {tc.title ?? tc.name ?? `Test case #${tc.id}`}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

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

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || selectedIds.length === 0}
            >
              {saving ? "Adding..." : "Add to Collection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}