/**
 * In-memory HTTP monitoring store.
 *
 * Captures 4xx / 5xx errors and suspicious requests for the admin HTTP monitor page.
 * Persists for the lifetime of the Node process (resets on restart).
 * Max 2000 log entries. Block list is persistent in memory.
 */

export type HttpLogEntry = {
  id: string;
  timestamp: Date;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  referer: string | null;
  statusCode: number;
};

export type BlockListEntry = {
  pattern: string;       // path prefix or exact path to block
  addedAt: Date;
  reason: string;
  type: 'exact' | 'prefix' | 'contains';
};

const MAX_ENTRIES = 2000;

// Module-level singletons — survive across requests within a process.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = global as any;

if (!g.__httpMonitorStore) g.__httpMonitorStore = [] as HttpLogEntry[];
if (!g.__httpMonitorBlockList) g.__httpMonitorBlockList = [] as BlockListEntry[];

const store: HttpLogEntry[] = g.__httpMonitorStore;
const blockList: BlockListEntry[] = g.__httpMonitorBlockList;

let counter = 0;

// ── Logging ─────────────────────────────────────────────────────────────────

export function logHttpRequest(entry: Omit<HttpLogEntry, 'id' | 'timestamp'>) {
  // Only log error responses (4xx + 5xx)
  if (entry.statusCode < 400) return;

  const newEntry: HttpLogEntry = {
    id: `hm-${Date.now()}-${++counter}`,
    timestamp: new Date(),
    ...entry,
  };

  store.push(newEntry);

  if (store.length > MAX_ENTRIES) {
    store.splice(0, store.length - MAX_ENTRIES);
  }
}

// ── Block list ───────────────────────────────────────────────────────────────

export function addToBlockList(
  pattern: string,
  type: BlockListEntry['type'] = 'exact',
  reason = 'Manually blocked via admin',
) {
  // Deduplicate
  if (blockList.some((b) => b.pattern === pattern && b.type === type)) return;

  blockList.push({ pattern, addedAt: new Date(), reason, type });
}

export function removeFromBlockList(pattern: string) {
  const idx = blockList.findIndex((b) => b.pattern === pattern);
  if (idx !== -1) blockList.splice(idx, 1);
}

export function getBlockList(): BlockListEntry[] {
  return [...blockList];
}

export function isBlocked(path: string): boolean {
  return blockList.some((b) => {
    if (b.type === 'exact') return path === b.pattern;
    if (b.type === 'prefix') return path.startsWith(b.pattern);
    if (b.type === 'contains') return path.includes(b.pattern);
    return false;
  });
}

// ── Bot detection ────────────────────────────────────────────────────────────

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i, /python-requests/i,
  /go-http/i, /java\//i, /zgrab/i, /masscan/i, /nmap/i, /nikto/i, /nuclei/i,
  /sqlmap/i, /dirbuster/i, /gobuster/i, /ffuf/i, /wfuzz/i, /hydra/i, /libwww/i,
];

export function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

// ── Stats & query ────────────────────────────────────────────────────────────

export type HttpMonitorStats = {
  total4xx: number;
  total5xx: number;
  uniqueIPs: number;
  uniquePaths: number;
  topPaths: { path: string; count: number }[];
  topIPs: { ip: string; count: number; isSuspicious: boolean }[];
  topUserAgents: { userAgent: string; count: number; isBot: boolean }[];
};

export function getHttpMonitorStats(options: {
  page?: number;
  perPage?: number;
  statusCode?: number;
  pathFilter?: string;
  ipFilter?: string;
}): { stats: HttpMonitorStats; entries: HttpLogEntry[]; total: number } {
  const { page = 1, perPage = 50, statusCode, pathFilter, ipFilter } = options;

  let filtered = [...store].reverse(); // newest first

  if (statusCode) {
    filtered = filtered.filter((e) => e.statusCode === statusCode);
  }
  if (pathFilter) {
    filtered = filtered.filter((e) =>
      e.path.toLowerCase().includes(pathFilter.toLowerCase()),
    );
  }
  if (ipFilter) {
    filtered = filtered.filter((e) => e.ip.includes(ipFilter));
  }

  const total = filtered.length;
  const entries = filtered.slice((page - 1) * perPage, page * perPage);

  // Stats computed from full unfiltered store
  const allEntries = [...store];

  const pathCounts = new Map<string, number>();
  const ipCounts = new Map<string, number>();
  const uaCounts = new Map<string, number>();

  for (const e of allEntries) {
    pathCounts.set(e.path, (pathCounts.get(e.path) ?? 0) + 1);
    ipCounts.set(e.ip, (ipCounts.get(e.ip) ?? 0) + 1);
    uaCounts.set(e.userAgent, (uaCounts.get(e.userAgent) ?? 0) + 1);
  }

  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const topIPs = [...ipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count, isSuspicious: count > 20 }));

  const topUserAgents = [...uaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userAgent, count]) => ({ userAgent, count, isBot: isBot(userAgent) }));

  const stats: HttpMonitorStats = {
    total4xx: allEntries.filter((e) => e.statusCode >= 400 && e.statusCode < 500).length,
    total5xx: allEntries.filter((e) => e.statusCode >= 500).length,
    uniqueIPs: ipCounts.size,
    uniquePaths: pathCounts.size,
    topPaths,
    topIPs,
    topUserAgents,
  };

  return { stats, entries, total };
}
