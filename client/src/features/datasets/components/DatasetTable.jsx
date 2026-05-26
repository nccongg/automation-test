import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, CheckCircle2, Table2, X } from "lucide-react";

function detectDelimiter(headerLine) {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const max = Math.max(tabCount, commaCount, semicolonCount);
  if (max === 0) return ",";
  if (tabCount === max) return "\t";
  if (semicolonCount === max) return ";";
  return ",";
}

function parseCSVLine(line, delimiter = ",") {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line.startsWith(delimiter, i) && !inQuotes) {
      result.push(current.trim());
      current = "";
      i += delimiter.length - 1;
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

export default function DatasetTable({
  rows = [],
  onChange,
  readOnly = false,
  selectable = false,
  selectedRowIndex = null,
  onSelectRow,
}) {
  const fileInputRef = useRef(null);
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);

  const columns = useMemo(() => {
    const seen = new Set();
    rows.forEach((row) => Object.keys(row).forEach((k) => seen.add(k)));
    return [...seen];
  }, [rows]);

  function addRow() {
    const newRow = {};
    columns.forEach((k) => { newRow[k] = ""; });
    onChange([...rows, newRow]);
  }

  function deleteRow(idx) {
    onChange(rows.filter((_, i) => i !== idx));
    if (idx === selectedRowIndex) onSelectRow?.(null, null);
  }

  function setCell(rowIdx, key, value) {
    const updated = rows.map((row, i) =>
      i === rowIdx ? { ...row, [key]: value } : row,
    );
    onChange(updated);
    if (rowIdx === selectedRowIndex) onSelectRow?.(updated[rowIdx], rowIdx);
  }

  function addColumn() {
    const name = newColName.trim();
    if (!name || columns.includes(name)) return;
    onChange(rows.map((row) => ({ ...row, [name]: "" })));
    setNewColName("");
    setAddingCol(false);
  }

  function deleteColumn(col) {
    onChange(
      rows.map((row) => {
        const next = { ...row };
        delete next[col];
        return next;
      }),
    );
  }

  function handleImportCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) return;
      const delimiter = detectDelimiter(lines[0]);
      const headers = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/^"|"$/g, "").trim());
      const newRows = lines.slice(1).map((line) => {
        const cells = parseCSVLine(line, delimiter).map((c) => c.replace(/^"|"$/g, "").trim());
        const row = {};
        headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
        return row;
      });
      onChange([...rows, ...newRows]);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  if (!readOnly && rows.length === 0 && columns.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 py-14 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
            <Table2 className="size-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">No data yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Add a row or import a CSV file to get started</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              <Upload className="size-3.5" /> Import CSV
            </button>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-brand-500/25 bg-brand-500/8 px-3.5 py-2 text-xs font-semibold text-brand-400 hover:bg-brand-500/15 transition-all"
            >
              <Plus className="size-3.5" /> Add row
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {columns.length} {columns.length === 1 ? "col" : "cols"}
            </span>
            {selectable && selectedRowIndex !== null && rows[selectedRowIndex] && (
              <span className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-400 ring-1 ring-brand-500/25">
                <CheckCircle2 className="size-2.5" />
                Row {selectedRowIndex + 1} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              <Upload className="size-3" /> Import CSV
            </button>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-brand-500/25 bg-brand-500/8 px-3 py-1.5 text-[11px] font-semibold text-brand-400 hover:bg-brand-500/15 transition-all"
            >
              <Plus className="size-3" /> Add row
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              {/* Row number gutter */}
              <th className="w-10 px-3 py-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">#</span>
              </th>

              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => deleteColumn(col)}
                        className="ml-auto rounded p-0.5 text-muted-foreground/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {/* Add column */}
              {!readOnly && (
                <th className="w-36 px-3 py-2.5">
                  {addingCol ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addColumn();
                          if (e.key === "Escape") { setAddingCol(false); setNewColName(""); }
                        }}
                        onBlur={() => { if (!newColName.trim()) setAddingCol(false); }}
                        placeholder="column name"
                        className="w-full rounded border border-brand-400/40 bg-card px-2 py-0.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-brand-500/15"
                      />
                      <button type="button" onClick={addColumn} className="shrink-0 text-brand-400 hover:text-brand-300">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingCol(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-brand-400 transition-colors"
                    >
                      <Plus className="size-3" /> column
                    </button>
                  )}
                </th>
              )}

              {(selectable || !readOnly) && (
                <th className="w-20 px-3 py-2.5" />
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="px-3 py-10 text-center text-sm text-muted-foreground/40"
                >
                  No rows yet
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => {
                const isSelected = selectable && rowIdx === selectedRowIndex;
                const isEven = rowIdx % 2 === 1;

                return (
                  <tr
                    key={rowIdx}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-brand-500/8 ring-1 ring-inset ring-brand-500/20"
                        : isEven
                        ? "bg-[#EDEEF2] hover:bg-[#e2e4ea]"
                        : "bg-white hover:bg-[#EDEEF2]"
                    }`}
                  >
                    {/* Row number */}
                    <td className="w-10 px-3 py-3 text-center">
                      <span className={`text-[11px] font-bold tabular-nums ${
                        isSelected ? "text-brand-400" : "text-muted-foreground/30"
                      }`}>
                        {rowIdx + 1}
                      </span>
                    </td>

                    {columns.map((col) => (
                      <td
                        key={col}
                        className="py-1.5 px-2"
                      >
                        {readOnly ? (
                          <span className="block px-1.5 py-1 text-sm text-foreground">
                            {row[col] ?? <span className="text-muted-foreground/30">—</span>}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={row[col] ?? ""}
                            onChange={(e) => setCell(rowIdx, col, e.target.value)}
                            className={`w-full min-w-[100px] rounded-md border px-2.5 py-1.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/30 ${
                              isSelected
                                ? "border-brand-500/20 bg-card focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10"
                                : "border-transparent bg-transparent hover:border-border hover:bg-card focus:border-brand-400 focus:bg-card focus:ring-2 focus:ring-brand-500/10"
                            }`}
                          />
                        )}
                      </td>
                    ))}

                    {!readOnly && (
                      <td className="px-3 py-2" />
                    )}

                    {/* Actions */}
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {selectable && (
                          <button
                            type="button"
                            onClick={() => onSelectRow?.(isSelected ? null : row, isSelected ? null : rowIdx)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                              isSelected
                                ? "bg-brand-500 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-brand-500/10 hover:text-brand-400"
                            }`}
                          >
                            {isSelected ? (
                              <><CheckCircle2 className="size-2.5" /> Active</>
                            ) : (
                              "Use"
                            )}
                          </button>
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => deleteRow(rowIdx)}
                            className="rounded-md p-1 text-muted-foreground/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
