import { useState, useEffect, useCallback } from "react";
import {
  getTestObjects,
  createTestObject,
  updateTestObject,
  deleteTestObject,
  confirmTestObject,
  getCandidates,
  acceptCandidate,
  dismissCandidate,
} from "../api/objectRepositoryApi";

export function useObjectRepository(projectId) {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      setObjects(await getTestObjects(projectId));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (payload) => {
    const obj = await createTestObject(projectId, payload);
    setObjects((prev) => [...prev, obj]);
    return obj;
  }, [projectId]);

  const update = useCallback(async (id, payload) => {
    const obj = await updateTestObject(projectId, id, payload);
    setObjects((prev) => prev.map((o) => (o.id === id ? obj : o)));
    return obj;
  }, [projectId]);

  const remove = useCallback(async (id) => {
    await deleteTestObject(projectId, id);
    setObjects((prev) => prev.filter((o) => o.id !== id));
  }, [projectId]);

  const confirm = useCallback(async (id) => {
    const obj = await confirmTestObject(projectId, id);
    setObjects((prev) => prev.map((o) => (o.id === id ? obj : o)));
    return obj;
  }, [projectId]);

  // Group by pageKey
  const grouped = objects.reduce((acc, obj) => {
    const key = obj.pageKey || "(No Page)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {});

  return { objects, grouped, loading, error, reload: load, create, update, remove, confirm };
}

export function useCandidates(projectId, objectId) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!projectId || !objectId) return;
    setLoading(true);
    try {
      setCandidates(await getCandidates(projectId, objectId));
    } finally {
      setLoading(false);
    }
  }, [projectId, objectId]);

  useEffect(() => { load(); }, [load]);

  const accept = useCallback(async (candidateId) => {
    const obj = await acceptCandidate(projectId, objectId, candidateId);
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    return obj;
  }, [projectId, objectId]);

  const dismiss = useCallback(async (candidateId) => {
    await dismissCandidate(projectId, objectId, candidateId);
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
  }, [projectId, objectId]);

  return { candidates, loading, reload: load, accept, dismiss };
}
