import { useEffect, useState } from "react";
import { getTestCases } from "@/features/test-cases/api/testCasesApi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AddCasesDialog({ open, onClose, onAdded, projectId, existingIds }) {
  const [allCases, setAllCases] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    getTestCases(projectId).then(setAllCases).catch(() => {});
    setSelected(new Set());
  }, [open, projectId]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      setSaving(true);
      await onAdded(ids);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const available = allCases.filter((tc) => !existingIds.has(tc.id ?? tc.testCaseId));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Test Cases</DialogTitle>
        </DialogHeader>

        <div className="mt-2 max-h-80 overflow-y-auto divide-y divide-border rounded-lg border bg-card">
          {available.length === 0 ? (
            <p className="p-4 text-center text-[13px] text-muted-foreground">
              All test cases are already in this suite
            </p>
          ) : (
            available.map((tc) => {
              const id = tc.id ?? tc.testCaseId;
              return (
                <div
                  key={id}
                  onClick={() => toggle(id)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selected.has(id)}
                    onCheckedChange={() => toggle(id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-foreground">{tc.title}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{tc.goal}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={selected.size === 0 || saving} onClick={handleAdd}>
            {saving
              ? "Adding..."
              : `Add ${selected.size > 0 ? selected.size : ""} Case${selected.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
