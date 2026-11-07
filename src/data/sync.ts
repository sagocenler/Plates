/**
 * Sync contract for the Supabase phase. Today every repository writes to IndexedDB, so there is
 * nothing to sync and `localOnlySync` is a no-op. When the remote repos arrive, writes go to the
 * local store first (so logging works with no signal), are queued in an outbox, and `flush()` drains
 * the queue when the app opens, the device comes back online, or the tab becomes visible.
 * (iOS has no Background Sync, so those are the only triggers there.)
 */
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

export interface SyncEngine {
  status(): SyncStatus
  /** Number of local changes not yet confirmed by the server. */
  pending(): Promise<number>
  flush(): Promise<void>
}

export const localOnlySync: SyncEngine = {
  status: () => 'idle',
  pending: async () => 0,
  flush: async () => undefined,
}
