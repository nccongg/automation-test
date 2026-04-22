import { apiClient } from "@/api/client";

function formatDateTime(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString();
}

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return "-";

  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "-";

  const totalSeconds = Math.floor((end - start) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatStepStatus(status) {
  if (!status) return "Unknown";
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

function mapVerdictToResult(verdict, status) {
  if (verdict === "pass") return "Passed";
  if (verdict === "fail") return "Failed";

  if (status === "queued" || status === "running") return "Running";
  if (status === "completed") return "Completed";

  return "Pending";
}

function calculateSummary(runs) {
  const totalRuns = runs.length;
  const passed = runs.filter((run) => run.result === "Passed").length;
  const failed = runs.filter((run) => run.result === "Failed").length;
  const skipped = 0;

  const durationValuesInSeconds = runs
    .map((run) => {
      if (!run._rawStartedAt || !run._rawFinishedAt) return null;

      const start = new Date(run._rawStartedAt).getTime();
      const end = new Date(run._rawFinishedAt).getTime();

      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
      return Math.floor((end - start) / 1000);
    })
    .filter((value) => value !== null);

  let avgDuration = "-";
  if (durationValuesInSeconds.length > 0) {
    const avgSeconds = Math.floor(
      durationValuesInSeconds.reduce((sum, value) => sum + value, 0) /
        durationValuesInSeconds.length,
    );

    const minutes = Math.floor(avgSeconds / 60);
    const seconds = avgSeconds % 60;
    avgDuration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  const passRate =
    totalRuns > 0 ? `${((passed / totalRuns) * 100).toFixed(1)}%` : "0%";

  return {
    totalRuns,
    passed,
    failed,
    skipped,
    passRate,
    avgDuration,
    lastRunDate: runs[0]?.executedAt || "N/A",
  };
}

function normalizeApiPayload(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

function normalizeScreenshotUrl(filePath) {
  if (!filePath) return "";

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const marker = "screenshots";
  const normalizedPath = filePath.replace(/\\/g, "/");
  const index = normalizedPath.indexOf(marker);

  if (index !== -1) {
    let pathAfter = normalizedPath.substring(index + marker.length);
    if (pathAfter.startsWith("/")) {
      pathAfter = pathAfter.substring(1);
    }

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    let baseUrl = apiUrl.replace(/\/api\/?$/, "");
    if (baseUrl.includes(":8001")) {
      baseUrl = baseUrl.replace(":8001", ":3001");
    }

    return `${baseUrl}/screenshots/${pathAfter}`;
  }

  return "";
}

export async function getTestResults(projectId) {
  const params = projectId ? { projectId } : {};
  const response = await apiClient.get("/test-runs", { params });
  const payload = normalizeApiPayload(response);
  const rawRuns = Array.isArray(payload) ? payload : [];

  const recentRuns = rawRuns.map((run) => {
    const result = mapVerdictToResult(run.verdict, run.status);

    return {
      id: run.id,
      testCaseId: run.testCaseId,
      projectName: run.testCaseTitle || `Run #${run.id}`,
      status: run.status || "unknown",
      verdict: run.verdict || null,
      result,
      fromSheet: !!run.fromSheet,
      totalTests: 1,
      passed: result === "Passed" ? 1 : 0,
      failed: result === "Failed" ? 1 : 0,
      duration: formatDuration(run.startedAt, run.finishedAt),
      executedAt: formatDateTime(run.createdAt),
      executedBy: "System",
      _rawStartedAt: run.startedAt,
      _rawFinishedAt: run.finishedAt,
    };
  });

  return {
    summary: calculateSummary(recentRuns),
    recentRuns,
  };
}

export async function getTestRunDetail(runId) {
  const response = await apiClient.get(`/test-runs/${runId}`);
  const payload = normalizeApiPayload(response);

  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  const evidences = Array.isArray(payload?.evidences) ? payload.evidences : [];
  const attempts = Array.isArray(payload?.attempts) ? payload.attempts : [];
  const datasetBindings = Array.isArray(payload?.datasetBindings)
    ? payload.datasetBindings
    : [];

  return {
    run: payload?.run || null,
    attempts,
    datasetBindings,
    steps: steps.map((step) => {
      const screenshots = evidences
        .filter((evidence) => evidence.run_step_log_id === step.id)
        .map((evidence) => ({
          id: evidence.id,
          filePath: evidence.file_path,
          fileName: (evidence.file_path || "").split(/[\\/]/).pop(),
          imageUrl: normalizeScreenshotUrl(evidence.file_path),
          pageUrl: evidence.page_url || "",
          capturedAt: formatDateTime(evidence.captured_at),
        }));

      const isUnknown = (v) => !v || String(v).toLowerCase() === "unknown";

      return {
        id: step.id,
        stepNo: step.step_no,
        title: !isUnknown(step.step_title)
          ? step.step_title
          : !isUnknown(step.action)
            ? step.action
            : `Step ${step.step_no}`,
        action: isUnknown(step.action) ? "" : step.action,
        status: formatStepStatus(step.status),
        message: step.message || "",
        currentUrl: step.current_url || "",
        thoughtText: step.thought_text || "",
        extractedContent: step.extracted_content || "",
        createdAt: formatDateTime(step.created_at),
        screenshots,
      };
    }),
  };
}

export async function createTestRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  paramsOverride = {},
  triggeredBy = null,
}) {
  const response = await apiClient.post("/test-runs", {
    testCaseId,
    testCaseVersionId,
    runtimeConfigId,
    browserProfileId,
    datasetId,
    datasetAlias,
    rowIndex,
    rowKey,
    paramsOverride,
    triggeredBy,
  });

  return normalizeApiPayload(response);
}

export async function replayTestRun({
  sourceRunId = null,
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId,
  datasetId = null,
  datasetAlias = null,
  rowIndex = null,
  rowKey = null,
  params = {},
  triggeredBy = null,
}) {
  const response = await apiClient.post("/test-runs/replay", {
    sourceRunId,
    testCaseId,
    testCaseVersionId,
    runtimeConfigId,
    browserProfileId,
    executionScriptId,
    datasetId,
    datasetAlias,
    rowIndex,
    rowKey,
    params,
    triggeredBy,
  });

  return normalizeApiPayload(response);
}

export async function parameterizeScript({ scriptId, steps }) {
  const response = await apiClient.patch(`/agent/execution-scripts/${scriptId}/steps`, { steps });
  return normalizeApiPayload(response);
}

export async function batchReplayTestRun({
  testCaseId,
  testCaseVersionId = null,
  runtimeConfigId = null,
  browserProfileId = null,
  executionScriptId,
  datasetId,
  rowIndexes = null,
  columnBindings = null,
}) {
  const response = await apiClient.post("/test-runs/batch-replay", {
    testCaseId,
    testCaseVersionId,
    runtimeConfigId,
    browserProfileId,
    executionScriptId,
    datasetId,
    rowIndexes,
    columnBindings,
  });

  return normalizeApiPayload(response);
}

export async function analyzeTestRun(runId) {
  const response = await apiClient.post(`/test-runs/${runId}/analyze`);
  return normalizeApiPayload(response);
}

export async function analyzeSheetRun(runId) {
  const response = await apiClient.post(`/test-suite-runs/${runId}/analyze`);
  return normalizeApiPayload(response);
}

export async function generateTestCase(promptText) {
  const response = await apiClient.post("/test-cases/generate", {
    promptText,
  });

  return normalizeApiPayload(response);
}