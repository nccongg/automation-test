import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const SELECTOR_TYPES = [
  { value: "css",          label: "CSS",          hint: "button[data-testid='login']" },
  { value: "xpath",        label: "XPath",        hint: "//button[text()='Login']" },
  { value: "nameAttr",     label: "name=",        hint: "username" },
  { value: "placeholder",  label: "placeholder",  hint: "Enter email" },
  { value: "title",        label: "title=",       hint: "Submit" },
  { value: "axName",       label: "aria-name",    hint: "Login button" },
  { value: "smartLocator", label: "role=",        hint: "role=button[name='Login']" },
  { value: "text",         label: "text",         hint: "Login" },
  { value: "id",           label: "id=",          hint: "login-btn" },
  { value: "testId",       label: "data-testid",  hint: "login-button" },
];

export const TYPE_COLORS = {};

// Convert selectorCollection dict → editable rows array
function dictToRows(collection) {
  if (!collection || typeof collection !== "object") return [{ type: "css", value: "" }];
  const entries = Object.entries(collection).filter(([, v]) => v);
  if (!entries.length) return [{ type: "css", value: "" }];
  return entries.map(([type, value]) => ({ type, value: String(value) }));
}

// Convert rows array → selectorCollection dict
function rowsToDict(rows) {
  const dict = {};
  for (const r of rows) {
    if (r.type && r.value.trim()) dict[r.type] = r.value.trim();
  }
  return dict;
}

function SelectorRow({ row, index, onChange, onDelete, isOnly }) {
  return (
    <div className="flex items-center gap-2 group">
      <GripVertical className="size-4 text-slate-300 shrink-0" />

      <select
        value={row.type}
        onChange={(e) => onChange(index, "type", e.target.value)}
        className="w-28 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {SELECTOR_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

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

export default function ObjectFormDrawer({ open, object, onClose, onSave }) {
  const isEdit = Boolean(object?.id);
  const isAuto = object?.status === "auto";

  const [name, setName] = useState("");
  const [pageKey, setPageKey] = useState("");
  const [description, setDescription] = useState("");
  const [selectorMethod, setSelectorMethod] = useState("css");
  const [rows, setRows] = useState([{ type: "css", value: "" }]);
  const [showProps, setShowProps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(object?.name || "");
      setPageKey(object?.pageKey || "");
      setDescription(object?.description || "");
      setSelectorMethod(object?.selectorMethod || "css");
      setRows(dictToRows(object?.selectorCollection));
      setError("");
      setShowProps(false);
    }
  }, [open, object]);

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
        selectorMethod: selectorMethod || Object.keys(collection)[0],
        selectorCollection: collection,
        elementProperties: object?.elementProperties || {},
        selectedProperties: object?.selectedProperties || [],
        status: "confirmed",
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const primaryType = rows.find((r) => r.type === selectorMethod) ? selectorMethod : (rows[0]?.type || "css");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <aside className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {isEdit ? "Edit Object" : "New Test Object"}
              </h2>
              {isAuto && (
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  Auto
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? `Editing: ${object.name}` : "Define element locators for replay"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Object Name <span className="text-red-400">*</span>
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. button_Login" className="font-mono text-sm" autoFocus />
              <p className="text-[11px] text-slate-400">Reference in test steps: <code className="bg-slate-100 px-1 rounded">click(findObject('{name || "button_Login"}'))</code></p>
            </div>

            {/* Page / Group */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Page / Group</Label>
              <Input value={pageKey} onChange={(e) => setPageKey(e.target.value)} placeholder="e.g. Page_Login" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>

            {/* Primary selector method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Default Selector</Label>
              <select
                value={primaryType}
                onChange={(e) => setSelectorMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {rows.filter((r) => r.value.trim()).map((r) => (
                  <option key={r.type} value={r.type}>
                    {SELECTOR_TYPES.find((t) => t.value === r.type)?.label ?? r.type}
                    {" — "}{r.value.slice(0, 40)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">Used first during replay. Others are tried as fallback (self-healing).</p>
            </div>

            {/* Selector collection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Selector Collection <span className="text-red-400">*</span>
                </Label>
                <Badge variant="outline" className="text-[10px] text-slate-500">{rows.length} locator{rows.length !== 1 ? "s" : ""}</Badge>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                {rows.map((row, i) => (
                  <SelectorRow key={i} row={row} index={i} onChange={changeRow} onDelete={deleteRow} isOnly={rows.length === 1} />
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

            {/* Element Properties */}
            {object?.elementProperties && Object.keys(object.elementProperties).length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowProps((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  {showProps ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                  DOM properties snapshot
                </button>
                {showProps && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 space-y-1">
                    {Object.entries(object.elementProperties).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-3 text-xs">
                        <span className="shrink-0 w-28 font-medium text-slate-500 font-mono">{k}</span>
                        <span className="text-slate-700 break-all">{String(v)}</span>
                        {(object.selectedProperties || []).includes(k) && (
                          <Badge className="shrink-0 text-[9px] bg-brand-50 text-brand-600 border-brand-200">used</Badge>
                        )}
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
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 bg-white">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Object"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
