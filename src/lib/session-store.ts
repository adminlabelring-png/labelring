export type SessionScanResult = {
  id: string;
  productName: string;
  market: "uk" | "eu" | "aus";
  score: number;
  issueCount: number;
  scannedAt: string;
};

const STORAGE_KEY = "labelring.session-scan-results";
const UPDATE_EVENT = "labelring:session-scan-results-updated";

let inMemoryResults: SessionScanResult[] = [];
let loaded = false;

const isBrowser = () => typeof window !== "undefined";

const sortByMostRecent = (results: SessionScanResult[]) =>
  [...results].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

const loadFromStorage = (): SessionScanResult[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SessionScanResult[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortByMostRecent(parsed);
  } catch {
    return [];
  }
};

const saveToStorage = (results: SessionScanResult[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
};

const emitUpdate = () => {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(UPDATE_EVENT));
};

const ensureLoaded = () => {
  if (loaded) {
    return;
  }

  inMemoryResults = loadFromStorage();
  loaded = true;
};

export const getSessionScanResults = (): SessionScanResult[] => {
  ensureLoaded();
  return [...inMemoryResults];
};

export const appendSessionScanResult = (
  record: Omit<SessionScanResult, "id" | "scannedAt"> & Partial<Pick<SessionScanResult, "id" | "scannedAt">>,
): SessionScanResult => {
  ensureLoaded();

  const nextRecord: SessionScanResult = {
    id: record.id ?? `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scannedAt: record.scannedAt ?? new Date().toISOString(),
    productName: record.productName,
    market: record.market,
    score: record.score,
    issueCount: record.issueCount,
  };

  inMemoryResults = sortByMostRecent([nextRecord, ...inMemoryResults]);
  saveToStorage(inMemoryResults);
  emitUpdate();
  return nextRecord;
};

export const subscribeToSessionScanResults = (onUpdate: () => void): (() => void) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handler = () => onUpdate();
  window.addEventListener(UPDATE_EVENT, handler);
  return () => {
    window.removeEventListener(UPDATE_EVENT, handler);
  };
};
