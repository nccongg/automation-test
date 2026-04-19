import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const TEST_CASE_TYPES = ["functional", "edge", "negative", "ui", "performance", "security"];

export default function EditTestCaseDialog({ editForm, setEditForm, onClose, onSave }) {
  return (
    <Dialog open={editForm !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Test Case</DialogTitle>
        </DialogHeader>

        {editForm && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <input
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              >
                {TEST_CASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Steps <span className="text-muted-foreground font-normal">(one per line)</span></Label>
              <textarea
                className="w-full min-h-[120px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={editForm.stepsText}
                onChange={(e) => setEditForm({ ...editForm, stepsText: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Expected Result</Label>
              <textarea
                className="w-full min-h-[72px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={editForm.expectedResult}
                onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={onSave}
            disabled={!editForm?.title?.trim()}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
