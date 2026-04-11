import { useEffect, useState, useCallback } from "react";
import { getTestSheets } from "../api/testSheetApi";

export function useTestSheets(projectId) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSheets = useCallback(async () => {
    if (!projectId) {
      setSheets([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getTestSheets(projectId);
      setSheets(data);
    } catch (e) {
      setError(e?.message || "Failed to load test sheets.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  return { sheets, loading, error, refetch: fetchSheets };
}
