import { get, set, keys, clear } from 'idb-keyval';

// Key names
const PROFILE_KEY = 'healthi_profile';
const LOGS_KEY = 'healthi_logs';

export async function getProfile() {
  return await get(PROFILE_KEY);
}

export async function setProfile(data) {
  return await set(PROFILE_KEY, data);
}

export async function getLogs() {
  const logs = await get(LOGS_KEY);
  return logs || [];
}

export async function addLog(logData) {
  const logs = await getLogs();
  logs.push(logData);
  return await set(LOGS_KEY, logs);
}

export async function getLogsByDateRange(startDate, endDate) {
  const logs = await getLogs();
  return logs.filter(log => {
    const d = new Date(log.date);
    return d >= startDate && d <= endDate;
  });
}

const METRICS_KEY = 'healthi_metrics';

export async function getMetricLogs() {
  const logs = await get(METRICS_KEY);
  return logs || [];
}

export async function addMetricLog(metricData) {
  const logs = await getMetricLogs();
  logs.push({ ...metricData, id: Date.now().toString(), date: new Date().toISOString() });
  return await set(METRICS_KEY, logs);
}

export async function clearAllData() {
  await clear();
}
