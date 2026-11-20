import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function extractApiError(err, fallback = 'Request failed. Please check backend connection.') {
  if (err?.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
    }
  }
  if (err?.message) return err.message;
  return fallback;
}

export async function checkHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export async function getDashboardSummary() {
  const { data } = await api.get('/api/dashboard/summary');
  return data;
}

export async function getGates() {
  const { data } = await api.get('/api/gates');
  return data;
}

export async function validateCircuit(circuitConfig) {
  const { data } = await api.post('/api/circuit/validate', circuitConfig);
  return data;
}

export async function runSimulation(simulationRequest) {
  const { data } = await api.post('/api/simulate', simulationRequest);
  return data;
}

export async function getExperiments(skip = 0, limit = 100) {
  const { data } = await api.get('/api/experiments', { params: { skip, limit } });
  return data;
}

export async function getExperiment(id) {
  const { data } = await api.get(`/api/experiments/${id}`);
  return data;
}

export async function createExperiment(payload) {
  const { data } = await api.post('/api/experiments', payload);
  return data;
}

export async function updateExperiment(id, payload) {
  const { data } = await api.put(`/api/experiments/${id}`, payload);
  return data;
}

export async function deleteExperiment(id) {
  const { data } = await api.delete(`/api/experiments/${id}`);
  return data;
}

export async function getExperimentStats() {
  const { data } = await api.get('/api/experiments/stats');
  return data;
}

export async function getLearningModules() {
  const { data } = await api.get('/api/learning');
  return data;
}

export async function getLearningProgress() {
  const { data } = await api.get('/api/learning/progress');
  return data;
}

export async function visitLesson(moduleId, lessonId) {
  const { data } = await api.post(`/api/learning/${moduleId}/lessons/${lessonId}/visit`);
  return data;
}

export async function submitQuiz(payload) {
  const { data } = await api.post('/api/quiz/submit', payload);
  return data;
}

export async function explainWithTutor(payload) {
  const { data } = await api.post('/api/tutor/explain', payload);
  return data;
}

export async function chatWithTutor(payload) {
  const { data } = await api.post('/api/tutor/chat', payload);
  return data;
}

export default api;
