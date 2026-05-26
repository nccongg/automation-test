import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { FormLabel, FormInput, FormTextarea, FormError } from "@/shared/components/ui/FormField";
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
    <div className="flex gap-6">
      <div className="flex flex-col gap-1.5 w-36 shrink-0">
        <FormLabel>Type</FormLabel>
        <CustomSelect
          value={row.type}
          onValueChange={(val) => onChange(index, "type", val)}
          options={SELECTOR_OPTIONS}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <FormLabel>Value</FormLabel>
        <div className="flex gap-2">
          <FormInput
            value={row.value}
            onChange={(e) => onChange(index, "value", e.target.value)}
            placeholder={SELECTOR_TYPES.find((t) => t.value === row.type)?.hint || ""}
            className="font-mono text-sm flex-1"
          />
          <button
            type="button"
            onClick={() => onDelete(index)}
            disabled={isOnly}
            className="h-9 w-9 flex items-center justify-center rounded border border-border text-muted-foreground/40 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ObjectEditPanel({ object, onSave, onCancel }) {
  const isNew = !object?.id;

  const [name, setName]                     = useState("");
  const [pageKey, setPageKey]               = useState("");
  const [description, setDescription]       = useState("");
  const [selectorMethod, setSelectorMethod] = useState("css");
  const [rows, setRows]                     = useState([{ type: "css", value: "" }]);
  const [showProps, setShowProps]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");

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
    if (!name.trim()) return setError("Object name is required");
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
    <div className="rounded-lg bg-card shadow-[0_0_14px_rgba(0,0,0,0.1)] dark:shadow-[0_0_14px_rgba(0,0,0,0.35)]">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 p-6">

          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isNew ? "New Object" : "Edit Object"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isNew
                ? "Define element locators for automated replay"
                : "Changes apply on the next test replay"}
            </p>
          </div>

          {/* Row: Name + Page */}
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel>
                Object Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. btn_Login"
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <FormLabel>Page / Group</FormLabel>
              <FormInput
                value={pageKey}
                onChange={(e) => setPageKey(e.target.value)}
                placeholder="e.g. Page_Login"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <FormLabel>Description</FormLabel>
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note about this element"
              rows={2}
            />
          </div>

          {/* Default Selector */}
          <div className="flex flex-col gap-1.5">
            <FormLabel>Default Selector</FormLabel>
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
            <p className="text-xs text-muted-foreground">
              Used first during replay. Others tried as fallback.
            </p>
          </div>

          {/* Selector Collection */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <FormLabel>
                Selector Collection <span className="text-destructive">*</span>
              </FormLabel>
              <span className="text-xs text-muted-foreground">
                {rows.length} locator{rows.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-3 rounded border border-border bg-muted/20 p-3">
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
                className="flex h-10 items-center justify-center gap-2 rounded border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-500 dark:hover:bg-brand-900/20"
              >
                <Plus className="size-4" />
                Add fallback locator
              </button>
            </div>
          </div>

          {/* DOM properties snapshot */}
          {object?.elementProperties && Object.keys(object.elementProperties).length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowProps((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {showProps
                  ? <ChevronDown className="size-4" />
                  : <ChevronRight className="size-4" />}
                DOM properties snapshot
              </button>
              {showProps && (
                <div className="divide-y divide-border rounded border border-border">
                  {Object.entries(object.elementProperties).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-4 px-4 py-2">
                      <span className="w-28 shrink-0 font-mono text-xs text-muted-foreground">{k}</span>
                      <span className="truncate text-xs text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <FormError>{error}</FormError>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            {saving ? "Saving…" : isNew ? "Create Object" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
