import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { 
  getQueuedMutations, 
  removeMutation, 
  updateMutationStatus, 
  clearSyncedMutations, 
  type QueuedMutation 
} from '../offline/idb';
import { syncEngine } from '../offline/syncEngine';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock, WifiOff } from 'lucide-react';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({ isOpen, onClose }) => {
  const [mutations, setMutations] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const activeUnitId = useAuthStore((state) => state.activeUnitId);
  const queryClient = useQueryClient();

  const loadQueue = async () => {
    const records = await getQueuedMutations(activeUnitId);
    setMutations(records);
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen, activeUnitId]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncEngine.processQueue(queryClient);
    await loadQueue();
    setIsSyncing(false);
  };

  const handleRetryItem = async (item: QueuedMutation) => {
    await updateMutationStatus(item.id, { status: 'QUEUED', retryCount: 0, errorReason: undefined });
    await handleManualSync();
  };

  const handleRemoveItem = async (id: string) => {
    await removeMutation(id);
    await loadQueue();
  };

  const handleClearSynced = async () => {
    await clearSyncedMutations();
    await loadQueue();
  };

  const statusBadge = (status: QueuedMutation['status']) => {
    switch (status) {
      case 'QUEUED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Queued</span>;
      case 'SYNCING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><RefreshCw className="w-3 h-3 animate-spin" /> Syncing</span>;
      case 'SYNCED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Synced</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3" /> Failed</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Offline Gate Operations Queue"
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <WifiOff className="w-4 h-4 text-slate-500" />
            <span>Unit: {activeUnitId || 'Default'}</span>
            <span className="text-slate-400">•</span>
            <span>{mutations.length} Local Operations</span>
          </div>
          <div className="flex items-center gap-2">
            {mutations.some(m => m.status === 'SYNCED') && (
              <button
                type="button"
                onClick={handleClearSynced}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
              >
                Clear Synced
              </button>
            )}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing || mutations.length === 0}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {mutations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
            No pending offline operations for this unit.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {mutations.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {statusBadge(item.status)}
                    <span className="text-xs font-bold text-slate-900">{item.description || item.operationType}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Created: {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {item.retryCount > 0 && <span className="ml-2 text-amber-600 font-semibold">• Retries: {item.retryCount}/{item.maxRetries}</span>}
                  </div>
                  {item.errorReason && (
                    <div className="text-[11px] text-rose-600 font-semibold mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      Reason: {item.errorReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.status === 'FAILED' && (
                    <button
                      type="button"
                      onClick={() => handleRetryItem(item)}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
