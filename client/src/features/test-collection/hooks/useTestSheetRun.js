import { useEffect, useRef, useState } from "react";
import { getSheetRunDetail } from "../api/testSheetApi";

const POLL_INTERVAL_MS = 3000;

export function useTestSheetRun(runId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      return;
    }

    async function fetch() {
      try {
        const result = await getSheetRunDetail(runId);
        setData(result);
        setError("");

        // Stop polling when completed/failed/cancelled
        const status = result?.run?.status;
        if (["completed", "failed", "cancelled"].includes(status)) {
          clearInterval(intervalRef.current);
        }
      } catch (e) {
        setError(e?.message || "Failed to load run detail.");
        clearInterval(intervalRef.current);
      } finally {
        setLoading(false);
      }
    }

    fetch();
    intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [runId]);

  return { data, loading, error };
}
