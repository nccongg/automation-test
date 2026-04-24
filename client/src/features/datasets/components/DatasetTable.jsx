import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, CheckCircle2, Table2, X } from "lucide-react";

function detectDelimiter(headerLine) {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  // Chọn delimiter xuất hiện nhiều nhất trong header
  const max = Math.max(tabCount, commaCount, semicolonCount);
  if (max === 0) return ","; // fallback
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
      i += delimiter.length - 1; // skip extra chars if delimiter is multi-char
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Reusable dataset table component.
 *
 * Props:
 *   rows           - array of row objects
 *   onChange       - (rows) => void — called on any edit (omit for readOnly)
 *   readOnly       - disable all editing
 *   selectable     - show "Use" button per row for replay selection
 *   selectedRowIndex - currently selected row index
 *   onSelectRow    - (row | null, index | null) => void
 */
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
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 py-14 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-slate-100">
            <Table2 className="size-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No data yet</p>
          <p className="mt-1 text-xs text-slate-400">Add a row or import a CSV file to get started</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Upload className="size-3.5" /> Import CSV
            </button>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-100 hover:border-violet-300 transition-all"
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </span>
            <span className="text-slate-200">·</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {columns.length} {columns.length === 1 ? "col" : "cols"}
            </span>
            {selectable && selectedRowIndex !== null && rows[selectedRowIndex] && (
              <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">
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
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Upload className="size-3" /> Import CSV
            </button>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 shadow-sm hover:bg-violet-100 hover:border-violet-300 transition-all"
            >
              <Plus className="size-3" /> Add row
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {/* Row number gutter */}
              <th className="w-10 border-r border-slate-200 px-3 py-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">#</span>
              </th>

              {columns.map((col, colIdx) => (
                <th
                  key={col}
                  className={`px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                    colIdx < columns.length - 1 ? "border-r border-slate-200" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => deleteColumn(col)}
                        className="ml-auto rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {/* Add column */}
              {!readOnly && (
                <th className="w-36 border-l border-slate-200 px-3 py-2.5">
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
                        className="w-full rounded border border-violet-300 bg-white px-2 py-0.5 text-[11px] outline-none focus:ring-2 focus:ring-violet-200"
                      />
                      <button type="button" onClick={addColumn} className="shrink-0 text-violet-600 hover:text-violet-800">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingCol(true)}
                      className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hover:text-violet-600 transition-colors"
                    >
                      <Plus className="size-3" /> column
                    </button>
                  )}
                </th>
              )}

              {(selectable || !readOnly) && (
                <th className="w-20 border-l border-slate-200 px-3 py-2.5" />
              )}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="px-3 py-10 text-center text-sm text-slate-300"
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
                    className={`border-b border-slate-100 last:border-0 transition-colors ${
                      isSelected
                        ? "bg-violet-50 ring-1 ring-inset ring-violet-200"
                        : isEven
                        ? "bg-slate-50/60 hover:bg-slate-100/60"
                        : "bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Row number */}
                    <td className="w-10 border-r border-slate-100 px-3 py-2.5 text-center">
                      <span className={`text-[11px] font-bold tabular-nums ${
                        isSelected ? "text-violet-500" : "text-slate-300"
                      }`}>
                        {rowIdx + 1}
                      </span>
                    </td>

                    {columns.map((col, colIdx) => (
                      <td
                        key={col}
                        className={`py-1.5 px-2 ${
                          colIdx < columns.length - 1 ? "border-r border-slate-100" : ""
                        }`}
                      >
                        {readOnly ? (
                          <span className="block px-1.5 py-1 text-sm text-slate-700">
                            {row[col] ?? <span className="text-slate-300">—</span>}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={row[col] ?? ""}
                            onChange={(e) => setCell(rowIdx, col, e.target.value)}
                            className={`w-full min-w-[100px] rounded-md border px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 ${
                              isSelected
                                ? "border-violet-200 bg-white/80 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
                            }`}
                          />
                        )}
                      </td>
                    ))}

                    {/* Spacer for add-column header */}
                    {!readOnly && (
                      <td className="border-l border-slate-100 px-3 py-2" />
                    )}

                    {/* Actions */}
                    <td className="border-l border-slate-100 px-2.5 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {selectable && (
                          <button
                            type="button"
                            onClick={() => onSelectRow?.(isSelected ? null : row, isSelected ? null : rowIdx)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                              isSelected
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-700"
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
                            className="rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
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
