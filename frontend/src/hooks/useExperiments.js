import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createExperiment,
  deleteExperiment,
  extractApiError,
  getExperiments,
  updateExperiment,
} from '../services/api';

/**
 * Custom hook managing persistent experiments stored in SQLite via FastAPI.
 */
export default function useExperiments(autoFetch = true) {
  const [experiments, setExperiments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperiments = useCallback(async (skip = 0, limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExperiments(skip, limit);
      setExperiments(data.experiments || []);
      setTotal(data.total || 0);
      return data;
    } catch (err) {
      const msg = extractApiError(err, 'Failed to fetch saved experiments.');
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchExperiments();
    }
  }, [autoFetch, fetchExperiments]);

  const saveExperiment = useCallback(async (payload) => {
    try {
      const created = await createExperiment(payload);
      setExperiments((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      toast.success(`Saved "${created.name}"`);
      return created;
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to save experiment.'));
      throw err;
    }
  }, []);

  const editExperiment = useCallback(async (id, payload) => {
    try {
      const updated = await updateExperiment(id, payload);
      setExperiments((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Experiment updated');
      return updated;
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update experiment.'));
      throw err;
    }
  }, []);

  const removeExperiment = useCallback(async (id) => {
    try {
      await deleteExperiment(id);
      setExperiments((prev) => prev.filter((e) => e.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Experiment deleted');
      return true;
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete experiment.'));
      throw err;
    }
  }, []);

  return {
    experiments,
    total,
    loading,
    error,
    fetchExperiments,
    saveExperiment,
    editExperiment,
    removeExperiment,
  };
}
