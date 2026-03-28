import { useState, useEffect } from "react";
import { getTestCases } from "../api/testCasesApi";

import { useState, useEffect } from "react";
import { getTestCases } from "../api/testCasesApi";

export function useTestCases(projectId) {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (!projectId) return;
        setLoading(true);
        const res = await getTestCases(projectId);
        if (!mounted) return;
        setTestCases(Array.isArray(res) ? res : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load test cases.");
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
