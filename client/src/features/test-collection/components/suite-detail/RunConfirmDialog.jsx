import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RunConfirmDialog({ open, onClose, onConfirm, missingCount, running }) {
  const plural = missingCount !== 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 shrink-0 text-yellow-500" />
            Skip dataset selection?
          </DialogTitle>
        </DialogHeader>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {missingCount} test case{plural ? "s have" : " has"} no dataset selected.
          You can run {plural ? "them" : "it"} with the default data instead.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={running}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={running} className="gap-2">
            {running ? "Starting..." : "Run with default data"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
