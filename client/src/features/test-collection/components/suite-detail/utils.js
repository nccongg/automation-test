export const STATUS_CLS = {
  pass:      "border-success/40 bg-success/10 text-success",
  fail:      "border-destructive/40 bg-destructive/10 text-destructive",
  error:     "border-orange-500/40 bg-orange-500/10 text-orange-500",
  completed: "border-blue-400/40 bg-blue-500/10 text-blue-500",
  running:   "border-yellow-400/40 bg-yellow-500/10 text-yellow-600",
  queued:    "border-border bg-muted text-muted-foreground",
};

export function getVerifyStatus(row, datasetId) {
  if (!datasetId) {
    return {
      label: "Not configured",
      className: "border-border bg-muted text-muted-foreground",
      isConfigured: false,
      isCompatible: true,
      message: "",
    };
  }

  const dataset = row.availableDatasets?.find(
    (d) => String(d.id) === String(datasetId)
  );

  if (!dataset) {
    return {
      label: "Needs review",
      className: "border-yellow-200 bg-yellow-50 text-yellow-700",
      isConfigured: false,
      isCompatible: false,
      message: "Selected dataset was not found in run options.",
    };
  }

  const status = dataset.compatibility?.status;
  const message = dataset.compatibility?.message;

  if (status === "incompatible") {
    return {
      label: "Not compatible",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      isConfigured: true,
      isCompatible: false,
      message,
    };
  }

  if (status === "default") {
    return {
      label: "Default data",
      className: "border-success/30 bg-success/10 text-success",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  if (status === "linked") {
    return {
      label: "Linked data",
      className: "border-blue-400/30 bg-blue-500/10 text-blue-600",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  if (status === "compatible") {
    return {
      label: "Compatible",
      className: "border-success/30 bg-success/10 text-success",
      isConfigured: true,
      isCompatible: true,
      message,
    };
  }

  return {
    label: "Needs review",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    isConfigured: true,
    isCompatible: true,
    message: message || "Compatibility could not be fully verified.",
  };
}

export function getSelectedDataset(row, selectedByCase) {
  const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
  return row.availableDatasets?.find(
    (dataset) => String(dataset.id) === String(selectedDatasetId)
  );
}

export function getScriptLabel(script, index) {
  return (
    script.name ||
    script.title ||
    script.scriptName ||
    script.label ||
    `Replay Script #${script.id ?? index + 1}`
  );
}

export function getDatasetPreviewRows(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset.previewRows)) return dataset.previewRows;
  if (Array.isArray(dataset.sampleRows)) return dataset.sampleRows;
  if (Array.isArray(dataset.rows)) return dataset.rows;
  return [];
}

export function getDatasetFields(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset.fields)) return dataset.fields;
  const rows = getDatasetPreviewRows(dataset);
  if (rows.length > 0 && typeof rows[0] === "object") return Object.keys(rows[0]);
  return [];
}
