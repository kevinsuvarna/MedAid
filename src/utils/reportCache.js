import localforage from 'localforage';

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const dataKey = (reportId) => `report_${reportId}`;
const cachedAtKey = (reportId) => `report_${reportId}_cachedAt`;

export async function getCachedReport(reportId) {
  const cachedAt = await localforage.getItem(cachedAtKey(reportId));
  if (!cachedAt || Date.now() - cachedAt > CACHE_EXPIRY_MS) return null;

  const data = await localforage.getItem(dataKey(reportId));
  return data || null;
}

export async function cacheReport(reportId, reportData) {
  await localforage.setItem(dataKey(reportId), reportData);
  await localforage.setItem(cachedAtKey(reportId), Date.now());
}

export async function clearCachedReport(reportId) {
  await localforage.removeItem(dataKey(reportId));
  await localforage.removeItem(cachedAtKey(reportId));
}
