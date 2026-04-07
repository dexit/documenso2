/**
 * In-memory store for system emails (signup, password reset, etc.)
 * that are not tied to a document/envelope.
 *
 * Max 1000 entries. Resets on server restart.
 */

export type SystemEmailEntry = {
  id: string;
  type: 'signup_confirmation' | 'password_reset' | 'password_changed' | 'other';
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  sentAt: Date;
  metadata?: Record<string, unknown>;
};

const MAX_ENTRIES = 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = global as any;

if (!g.__systemEmailLogStore) g.__systemEmailLogStore = [] as SystemEmailEntry[];

const store: SystemEmailEntry[] = g.__systemEmailLogStore;

let counter = 0;

export function logSystemEmail(
  entry: Omit<SystemEmailEntry, 'id' | 'sentAt'>,
): void {
  const newEntry: SystemEmailEntry = {
    id: `se-${Date.now()}-${++counter}`,
    sentAt: new Date(),
    ...entry,
  };

  store.push(newEntry);

  if (store.length > MAX_ENTRIES) {
    store.splice(0, store.length - MAX_ENTRIES);
  }
}

export function getSystemEmailLogs(options: {
  page?: number;
  perPage?: number;
  type?: SystemEmailEntry['type'];
  emailFilter?: string;
}): { entries: SystemEmailEntry[]; total: number } {
  const { page = 1, perPage = 50, type, emailFilter } = options;

  let filtered = [...store].reverse(); // newest first

  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }
  if (emailFilter) {
    filtered = filtered.filter((e) =>
      e.recipientEmail.toLowerCase().includes(emailFilter.toLowerCase()),
    );
  }

  const total = filtered.length;
  const entries = filtered.slice((page - 1) * perPage, page * perPage);

  return { entries, total };
}
