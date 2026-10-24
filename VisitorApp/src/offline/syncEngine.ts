import api from '../lib/axios';
import { 
  getQueuedMutations, 
  updateMutationStatus, 
  removeMutation, 
  type QueuedMutation 
} from './idb';
import { useAuthStore } from '../store/authStore';

export type SyncStatusType = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_COMPLETE' | 'SYNC_FAILED';

type SyncListener = (status: SyncStatusType, pendingCount: number, failedCount: number) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyStatus();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getStatusSnapshot(): Promise<{ isOnline: boolean; pendingCount: number; failedCount: number }> {
    const activeUnitId = useAuthStore.getState().activeUnitId;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const mutations = await getQueuedMutations(activeUnitId);
    
    const pending = mutations.filter(m => m.status === 'QUEUED' || m.status === 'SYNCING');
    const failed = mutations.filter(m => m.status === 'FAILED');

    return {
      isOnline,
      pendingCount: pending.length,
      failedCount: failed.length
    };
  }

  private async notifyStatus(statusOverride?: SyncStatusType) {
    const { isOnline, pendingCount, failedCount } = await this.getStatusSnapshot();
    
    let currentStatus: SyncStatusType = isOnline ? 'ONLINE' : 'OFFLINE';
    if (this.isSyncing) {
      currentStatus = 'SYNCING';
    } else if (statusOverride) {
      currentStatus = statusOverride;
    } else if (failedCount > 0) {
      currentStatus = 'SYNC_FAILED';
    }

    this.listeners.forEach(listener => listener(currentStatus, pendingCount, failedCount));
  }

  private async handleNetworkChange() {
    if (navigator.onLine) {
      await this.processQueue();
    } else {
      this.notifyStatus('OFFLINE');
    }
  }

  public async processQueue(queryClient?: any): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const activeUnitId = useAuthStore.getState().activeUnitId;
    const token = useAuthStore.getState().token;

    if (!token) {
      this.notifyStatus('OFFLINE');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyStatus('SYNCING');

    let syncedCount = 0;
    let failedCount = 0;

    try {
      const mutations = await getQueuedMutations(activeUnitId);
      const queueToProcess = mutations.filter(m => m.status === 'QUEUED' || m.status === 'FAILED');

      for (const mutation of queueToProcess) {
        // Double check unit isolation matching
        if (mutation.unitId && activeUnitId && mutation.unitId !== activeUnitId) {
          continue; // Skip mutations belonging to another unit
        }

        await updateMutationStatus(mutation.id, { status: 'SYNCING' });

        try {
          await api.request({
            url: mutation.endpoint,
            method: mutation.method,
            data: mutation.payload
          });

          // Mark synced and remove from queue
          await updateMutationStatus(mutation.id, { status: 'SYNCED' });
          await removeMutation(mutation.id);
          syncedCount++;

          // Invalidate React Query caches after successful sync
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ['security-gate-queue'] });
            queryClient.invalidateQueries({ queryKey: ['security-dashboard-action-queue'] });
            queryClient.invalidateQueries({ queryKey: ['security-vehicle-movements'] });
            queryClient.invalidateQueries({ queryKey: ['security-staff-movements'] });
            queryClient.invalidateQueries({ queryKey: ['security-resident-outings'] });
            queryClient.invalidateQueries({ queryKey: ['visitorPasses'] });
          }
        } catch (error: any) {
          const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.status === 502 || error.status === 503 || error.status === 504;
          const retryCount = mutation.retryCount + 1;
          const errorMsg = error.response?.data?.message || error.message || 'Synchronization request failed';

          if (isNetworkError && retryCount < mutation.maxRetries) {
            await updateMutationStatus(mutation.id, {
              status: 'QUEUED',
              retryCount,
              errorReason: `Network error (Attempt ${retryCount}/${mutation.maxRetries})`
            });
            break; // Stop further requests if connection is lost again
          } else {
            // Permanent failure or max retries exceeded
            await updateMutationStatus(mutation.id, {
              status: 'FAILED',
              retryCount,
              errorReason: errorMsg
            });
            failedCount++;
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyStatus(failedCount > 0 ? 'SYNC_FAILED' : 'SYNC_COMPLETE');
    }

    return { synced: syncedCount, failed: failedCount };
  }
}

export const syncEngine = new SyncEngine();
