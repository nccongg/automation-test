import { useEffect, useState } from "react";
import { getTestCases } from "../api/testCasesApi";

function normalizeTestCase(tc, index = 0) {
  return {
    id: tc.id ?? tc.testCaseId ?? `tc-${index}`,
    testCaseId: tc.testCaseId ?? tc.id ?? null,
    title: tc.title ?? tc.name ?? "Untitled test case",
    goal: tc.goal ?? tc.description ?? "No goal provided",
    status: tc.status ?? "draft",
    promptText: tc.promptText ?? tc.prompt_text ?? "",
    versionNo: tc.versionNo ?? tc.version_no ?? tc.version ?? "N/A",
    executionMode: tc.executionMode ?? tc.execution_mode ?? "N/A",
    runtimeConfigId: tc.runtimeConfigId ?? tc.runtime_config_id ?? null,
    raw: tc,
  };
}

export function useTestCases(projectId) {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setError("");

        if (!projectId) {
          if (!mounted) return;
          setTestCases([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const rows = await getTestCases(projectId);

        if (!mounted) return;

        const normalized = Array.isArray(rows)
          ? rows.map((tc, index) => normalizeTestCase(tc, index))
          : [];

        setTestCases(normalized);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load test cases.");
        setTestCases([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  return { testCases, loading, error };
}