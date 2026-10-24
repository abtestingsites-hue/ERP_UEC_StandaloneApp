import React, { useEffect, useState } from 'react';
import { syncEngine, type SyncStatusType } from '../offline/syncEngine';
import { OfflineQueueModal } from './OfflineQueueModal';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const NetworkStatusBar: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusType>('ONLINE');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  
  // PWA Deferred Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Subscribe to SyncEngine
    const unsubscribe = syncEngine.subscribe((newStatus, pending, failed) => {
      setStatus(newStatus);
      setPendingCount(pending);
      setFailedCount(failed);
    });

    // 2. Listen for PWA Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleManualSync = () => {
    syncEngine.processQueue(queryClient);
  };

  const renderBadge = () => {
    if (status === 'OFFLINE') {
      return (
        <button
          type="button"
          onClick={() => setIsQueueModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-extrabold hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span>Offline Mode</span>
          {pendingCount > 0 && (
            <span className="ml-1 bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>
      );
    }

    if (status === 'SYNCING') {
      return (
        <button
          type="button"
          onClick={() => setIsQueueModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-extrabold hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <span>Syncing ({pendingCount})</span>
        </button>
      );
    }

    if (status === 'SYNC_FAILED' || failedCount > 0) {
      return (
        <button
          type="button"
          onClick={() => setIsQueueModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-extrabold hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Sync Failed ({failedCount})</span>
        </button>
      );
    }

    if (pendingCount > 0) {
      return (
        <button
          type="button"
          onClick={handleManualSync}
          className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-xl text-xs font-extrabold hover:bg-sky-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
          <span>Queued ({pendingCount})</span>
        </button>
      );
    }

    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-xl text-xs font-bold">
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span>Online</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Network / Offline Status Badge */}
      {renderBadge()}

      {/* PWA Install Button */}
      {deferredPrompt && !isInstalled && (
        <button
          type="button"
          onClick={handleInstallPWA}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
          title="Install VisitorApp on Gate Tablet"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
      />
    </div>
  );
};
