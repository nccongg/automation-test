import { apiClient } from "@/api";

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
  if (verdict === "fail" || verdict === "error") return "Failed";

  if (status === "queued" || status === "running") return "Running";
  if (status === "completed") return "Completed";
  if (status === "failed" || status === "cancelled") return "Failed";

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

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}/${filePath.replace(/^\/+/, "")}`;
}

export async function getTestResults() {
  const response = await apiClient.get("/test-runs", {
    params: { latestPerProject: "true" },
  });
  const payload = normalizeApiPayload(response);
  const rawRuns = Array.isArray(payload) ? payload : [];

  const recentRuns = rawRuns.map((run) => {
    const result = mapVerdictToResult(run.verdict, run.status);

    return {
      id: run.id,
      projectName: run.project_name || run.test_case_title || `Run #${run.id}`,
      status: run.status || "unknown",
      result,
      totalTests: 1,
      passed: result === "Passed" ? 1 : 0,
      failed: result === "Failed" ? 1 : 0,
      duration: formatDuration(run.started_at, run.finished_at),
      executedAt: formatDateTime(run.created_at),
      executedBy: "System",
      _rawStartedAt: run.started_at,
      _rawFinishedAt: run.finished_at,
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

  return {
    run: payload?.run || null,
    attempts: Array.isArray(payload?.attempts) ? payload.attempts : [],
    steps: steps.map((step) => {
      const screenshots = evidences
        .filter((evidence) => evidence.run_step_log_id === step.id)
        .map((evidence) => ({
          id: evidence.id,
          filePath: evidence.file_path,
          imageUrl: normalizeScreenshotUrl(evidence.file_path),
          pageUrl: evidence.page_url || "",
          capturedAt: formatDateTime(evidence.captured_at),
        }));

      return {
        id: step.id,
        stepNo: step.step_no,
        title: step.step_title || step.action || `Step ${step.step_no}`,
        action: step.action || "",
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

export async function createTestRun({ testCaseId, promptText }) {
  const response = await apiClient.post("/test-runs", {
    testCaseId,
    promptText,
  });

  return normalizeApiPayload(response);
}

export async function generateTestCase(promptText) {
  const response = await apiClient.post("/test-cases/generate", {
    promptText,
  });

  return normalizeApiPayload(response);
}
