import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";

export default function AddToSheetDialog({
  open,
  onOpenChange,
  sheets,
  loadingSheets,
  sheetMode,
  setSheetMode,
  selectedSheetId,
  setSelectedSheetId,
  newSheetName,
  setNewSheetName,
  addingToSheet,
  onAdd,
  selectedCount,
  totalCount,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Test Sheet</DialogTitle>
        </DialogHeader>

        {loadingSheets ? (
          <div className="py-6 flex justify-center">
            <LoadingSpinner size="sm" label="Loading sheets..." />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setSheetMode("existing")}
                disabled={sheets.length === 0}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  sheetMode === "existing"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Existing Sheet
              </button>
              <button
                onClick={() => setSheetMode("new")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  sheetMode === "new"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Plus className="size-3.5" />
                  New Sheet
                </span>
              </button>
            </div>

            {sheetMode === "existing" ? (
              <div className="space-y-1.5">
                <Label>Select Sheet</Label>
                {sheets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sheets found. Create a new one.</p>
                ) : (
                  <select
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    value={selectedSheetId}
                    onChange={(e) => setSelectedSheetId(e.target.value)}
                  >
                    {sheets.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}{s.itemCount != null ? ` (${s.itemCount} cases)` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Sheet Name</Label>
                <input
                  autoFocus
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="e.g. Login flow"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newSheetName.trim()) onAdd(); }}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} selected test case(s) will be added.`
                : `All ${totalCount} test case(s) will be added.`}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addingToSheet}>
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={
              addingToSheet ||
              loadingSheets ||
              (sheetMode === "existing" && !selectedSheetId) ||
              (sheetMode === "new" && !newSheetName.trim())
            }
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
          >
            {addingToSheet ? <LoadingSpinner size="sm" label="Adding..." /> : "Add to Sheet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
