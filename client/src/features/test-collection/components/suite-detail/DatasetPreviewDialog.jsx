import { Table } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDatasetFields, getDatasetPreviewRows } from "./utils";

export default function DatasetPreviewDialog({ open, onClose, dataset }) {
  const fields = getDatasetFields(dataset);
  const rows = getDatasetPreviewRows(dataset);
  const previewRows = rows.slice(0, 10);

  const compatibilityStatus = dataset?.compatibility?.status;
  const compatibilityMessage = dataset?.compatibility?.message;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="size-4 shrink-0 text-muted-foreground" />
            Dataset Preview
          </DialogTitle>
        </DialogHeader>

        {!dataset ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-foreground">No dataset selected</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Please choose a dataset first to preview its data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dataset summary */}
            <div className="rounded-xl border bg-card px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {dataset.name}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {dataset.rowCount ? `${dataset.rowCount} row(s)` : "Row count not available"}
                    {fields.length > 0 ? ` · ${fields.length} field(s)` : ""}
                  </p>
                </div>
                {compatibilityStatus && (
                  <Badge variant="outline" className="shrink-0 capitalize text-muted-foreground">
                    {compatibilityStatus}
                  </Badge>
                )}
              </div>
              {compatibilityMessage && (
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {compatibilityMessage}
                </p>
              )}
            </div>

            {/* Fields */}
            {fields.length > 0 && (
              <div>
                <p className="mb-2 text-[13px] font-semibold text-foreground">Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {fields.map((field) => (
                    <Badge key={field} variant="outline" className="text-muted-foreground">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preview rows */}
            {previewRows.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
                <p className="text-[14px] font-medium text-foreground">No preview rows available</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  The backend should return previewRows, sampleRows, or rows for each dataset.
                </p>
              </div>
            ) : (
              <section className="rounded-xl border bg-card">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold text-foreground">Preview rows</h2>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    Showing {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-muted/40">
                      <tr className="border-b border-border">
                        {fields.map((field) => (
                          <th
                            key={field}
                            className="whitespace-nowrap px-4 py-2.5 text-left text-[13px] font-bold text-foreground"
                          >
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={`transition-colors hover:bg-muted/50 ${rowIndex % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                        >
                          {fields.map((field) => (
                            <td
                              key={field}
                              className="max-w-[220px] truncate px-4 py-2 text-[13px] text-muted-foreground"
                              title={String(row?.[field] ?? "")}
                            >
                              {row?.[field] === null || row?.[field] === undefined || row?.[field] === ""
                                ? "—"
                                : String(row[field])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
