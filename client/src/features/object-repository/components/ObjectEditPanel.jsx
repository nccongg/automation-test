import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { SELECTOR_TYPES } from "./ObjectFormDrawer";

const SELECTOR_OPTIONS = SELECTOR_TYPES.map((t) => ({ value: t.value, label: t.label }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dictToRows(collection) {
  if (!collection || typeof collection !== "object") return [{ type: "css", value: "" }];
  const entries = Object.entries(collection).filter(([, v]) => v);
  return entries.length ? entries.map(([type, value]) => ({ type, value: String(value) })) : [{ type: "css", value: "" }];
}

function rowsToDict(rows) {
  const dict = {};
  for (const r of rows) {
    if (r.type && r.value.trim()) dict[r.type] = r.value.trim();
  }
  return dict;
}

// ─── Selector row ─────────────────────────────────────────────────────────────

function SelectorRow({ row, index, onChange, onDelete, isOnly }) {
  return (
    <div className="flex items-center gap-2">
      <GripVertical className="size-3.5 text-slate-300 shrink-0" />
      <CustomSelect
        value={row.type}
        onValueChange={(val) => onChange(index, "type", val)}
        options={SELECTOR_OPTIONS}
        className="w-28 shrink-0"
      />
      <Input
        value={row.value}
        onChange={(e) => onChange(index, "value", e.target.value)}
        placeholder={SELECTOR_TYPES.find((t) => t.value === row.type)?.hint || ""}
        className="flex-1 h-8 text-xs font-mono"
      />
      <button
        type="button"
        onClick={() => onDelete(index)}
        disabled={isOnly}
        className="shrink-0 rounded-md p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ObjectEditPanel({ object, onSave, onCancel }) {
  const isNew = !object?.id;

  const [name, setName]               = useState("");
  const [pageKey, setPageKey]         = useState("");
  const [description, setDescription] = useState("");
  const [selectorMethod, setSelectorMethod] = useState("css");
  const [rows, setRows]               = useState([{ type: "css", value: "" }]);
  const [showProps, setShowProps]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    setName(object?.name || "");
    setPageKey(object?.pageKey || "");
    setDescription(object?.description || "");
    setSelectorMethod(object?.selectorMethod || "css");
    setRows(dictToRows(object?.selectorCollection));
    setError("");
    setShowProps(false);
  }, [object]);

  function addRow() {
    setRows((prev) => [...prev, { type: "xpath", value: "" }]);
  }
  function changeRow(idx, field, val) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }
  function deleteRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Name is required");
    const collection = rowsToDict(rows);
    if (!Object.keys(collection).length) return setError("At least one selector with a value is required");

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        pageKey: pageKey.trim() || null,
        description: description.trim() || null,
        selectorMethod: rows.find((r) => r.type === selectorMethod && r.value.trim())
          ? selectorMethod
          : Object.keys(collection)[0],
        selectorCollection: collection,
        elementProperties: object?.elementProperties || {},
        selectedProperties: object?.selectedProperties || [],
        status: "confirmed",
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Save failed");
      setSaving(false);
    }
  }

  const primaryType = rows.find((r) => r.type === selectorMethod && r.value.trim())
    ? selectorMethod
    : rows[0]?.type || "css";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isNew ? "New Test Object" : `Edit: ${object.name}`}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isNew ? "Define element locators for replay" : "Changes apply immediately on next replay"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Object Name <span className="text-red-400">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. btn_Login"
              className="font-mono text-sm"
              autoFocus
            />
          </div>

          {/* Page */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Page / Group</Label>
            <Input value={pageKey} onChange={(e) => setPageKey(e.target.value)} placeholder="e.g. Page_Login" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          {/* Default selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Default Selector</Label>
            <CustomSelect
              value={primaryType}
              onValueChange={setSelectorMethod}
              options={rows.filter((r) => r.value.trim()).map((r) => ({
                value: r.type,
                label: SELECTOR_TYPES.find((t) => t.value === r.type)?.label ?? r.type,
                sublabel: r.value.slice(0, 40),
              }))}
              className="w-full"
            />
            <p className="text-[10px] text-slate-400">Used first during replay. Others tried as fallback.</p>
          </div>

          {/* Selector collection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Selector Collection <span className="text-red-400">*</span>
              </Label>
              <Badge variant="outline" className="text-[10px] text-slate-400">
                {rows.length} locator{rows.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              {rows.map((row, i) => (
                <SelectorRow
                  key={i}
                  row={row}
                  index={i}
                  onChange={changeRow}
                  onDelete={deleteRow}
                  isOnly={rows.length === 1}
                />
              ))}
              <button
                type="button"
                onClick={addRow}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <Plus className="size-3.5" /> Add fallback locator
              </button>
            </div>
          </div>

          {/* DOM properties (read-only, collapsible) */}
          {object?.elementProperties && Object.keys(object.elementProperties).length > 0 && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowProps((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
              >
                {showProps ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                DOM properties snapshot
              </button>
              {showProps && (
                <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {Object.entries(object.elementProperties).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="text-[10px] font-mono font-medium text-slate-400 w-24 shrink-0">{k}</span>
                      <span className="text-[11px] text-slate-600 truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-3 bg-white shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving} size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} size="sm" className="bg-brand-600 hover:bg-brand-700 text-white">
            {saving ? "Saving…" : isNew ? "Create Object" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
