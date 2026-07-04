import { useMemo, useRef, useState } from "react";
import { GripVertical, Plus, Search, X } from "lucide-react";
import { addCollectionItems } from "@/features/test-collection/api/testCollectionApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Drag state: { from: "available" | "selected", id }
  const dragRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropIndex, setDropIndex] = useState(null);

  const collectionName = collection?.name ?? "Collection";

  const casesById = useMemo(() => {
    const map = new Map();
    (testCases ?? []).forEach((tc) => map.set(Number(tc.id), tc));
    return map;
  }, [testCases]);

  const availableTestCases = useMemo(() => {
    const existingIds = new Set(
      (collection?.items ?? []).map((item) =>
        Number(item.testCaseId ?? item.id),
      ),
    );

    const q = query.trim().toLowerCase();

    return (testCases ?? [])
      .filter((tc) => !existingIds.has(Number(tc.id)))
      .filter((tc) => !selectedIds.includes(Number(tc.id)))
      .filter(
        (tc) =>
          !q ||
          tc.title?.toLowerCase().includes(q) ||
          tc.goal?.toLowerCase().includes(q),
      );
  }, [collection, testCases, selectedIds, query]);

  function reset() {
    setSelectedIds([]);
    setQuery("");
    setErr("");
    dragRef.current = null;
    setIsDraggingOver(false);
    setDropIndex(null);
  }

  function addTestCase(testCaseId, index = null) {
    const id = Number(testCaseId);

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev;
      if (index === null || index >= prev.length) return [...prev, id];
      return [...prev.slice(0, index), id, ...prev.slice(index)];
    });
  }

  function removeTestCase(testCaseId) {
    const id = Number(testCaseId);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }

  function moveSelected(id, toIndex) {
    setSelectedIds((prev) => {
      const fromIndex = prev.indexOf(id);
      if (fromIndex === -1) return prev;

      const next = prev.filter((item) => item !== id);
      const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      next.splice(Math.max(0, Math.min(insertAt, next.length)), 0, id);
      return next;
    });
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  function handleDragStart(e, from, id) {
    dragRef.current = { from, id: Number(id) };
    e.dataTransfer.effectAllowed = from === "available" ? "copy" : "move";
    e.dataTransfer.setData("text/plain", String(id));
  }

  function handleDragEnd() {
    dragRef.current = null;
    setIsDraggingOver(false);
    setDropIndex(null);
  }

  function handleSelectedItemDragOver(e, index) {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;

    setIsDraggingOver(true);
    setDropIndex(before ? index : index + 1);
  }

  function handleDropZoneDragOver(e) {
    if (!dragRef.current) return;
    e.preventDefault();

    setIsDraggingOver(true);
    setDropIndex((prev) => prev ?? selectedIds.length);
  }

  function handleDrop(e) {
    e.preventDefault();
    const drag = dragRef.current;
    const index = dropIndex ?? selectedIds.length;

    if (drag) {
      if (drag.from === "available") {
        addTestCase(drag.id, index);
      } else {
        moveSelected(drag.id, index);
      }
    }

    handleDragEnd();
  }

  // ── Submit ────────────────────────────────────────────────────────────────

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

  const dropIndicator = (
    <div className="mx-2 h-0.5 rounded-full bg-brand-500" />
  );

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
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="truncate pr-8">
            Add test cases to {collectionName}
          </DialogTitle>
          <DialogDescription>
            Drag test cases into the list on the right, or click to add. Drag
            within the list to reorder.
          </DialogDescription>
        </DialogHeader>

        {err && <p className="shrink-0 text-sm text-red-600">{err}</p>}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Available test cases */}
          <div className="flex h-[300px] min-w-0 flex-col rounded-lg border sm:h-[380px]">
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search test cases…"
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {availableTestCases.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  {query.trim()
                    ? "No test cases match your search."
                    : "No available test cases to add."}
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {availableTestCases.map((tc) => (
                    <div
                      key={tc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, "available", tc.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => addTestCase(tc.id)}
                      className="group flex cursor-grab items-center gap-2 px-2 py-2 transition-colors hover:bg-muted/60 active:cursor-grabbing"
                    >
                      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {tc.title ?? tc.name ?? `Test case #${tc.id}`}
                        </p>
                        {tc.goal && (
                          <p className="truncate text-xs text-muted-foreground">
                            {tc.goal}
                          </p>
                        )}
                      </div>

                      <Plus className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected — drop zone */}
          <div
            onDragOver={handleDropZoneDragOver}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsDraggingOver(false);
                setDropIndex(null);
              }
            }}
            onDrop={handleDrop}
            className={`flex h-[300px] min-w-0 flex-col rounded-lg border transition-colors sm:h-[380px] ${
              isDraggingOver
                ? "border-brand-400 bg-brand-50/40 dark:bg-brand-900/20"
                : "border-dashed"
            }`}
          >
            <div className="shrink-0 border-b px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                To add ({selectedIds.length})
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {selectedIds.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Drag test cases here
                    <br />
                    or click one on the left to add it.
                  </p>
                </div>
              ) : (
                <div>
                  {selectedIds.map((id, index) => {
                    const tc = casesById.get(id);

                    return (
                      <div key={id}>
                        {isDraggingOver && dropIndex === index && dropIndicator}

                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, "selected", id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleSelectedItemDragOver(e, index)}
                          className="group flex cursor-grab items-center gap-2 px-2 py-2 transition-colors hover:bg-muted/60 active:cursor-grabbing"
                        >
                          <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />

                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                            {index + 1}
                          </span>

                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                            {tc?.title ?? tc?.name ?? `Test case #${id}`}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeTestCase(id)}
                            title="Remove"
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {isDraggingOver && dropIndex >= selectedIds.length && dropIndicator}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2">
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
            {saving
              ? "Adding..."
              : `Add ${selectedIds.length > 0 ? selectedIds.length : ""} to Collection`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
