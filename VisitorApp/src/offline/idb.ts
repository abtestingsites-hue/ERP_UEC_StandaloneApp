export interface QueuedMutation {
  id: string;
  operationType: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: any;
  unitId: string | null;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  errorReason?: string;
  description?: string;
}

const DB_NAME = 'VisitorApp_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_mutations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('unitId', 'unitId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineMutation(mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount' | 'maxRetries' | 'status'>): Promise<QueuedMutation> {
  const db = await openDB();
  const newRecord: QueuedMutation = {
    ...mutation,
    id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
    status: 'QUEUED'
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newRecord);

    request.onsuccess = () => resolve(newRecord);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedMutations(unitId?: string | null): Promise<QueuedMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let records: QueuedMutation[] = request.result || [];
      if (unitId) {
        records = records.filter(r => r.unitId === unitId);
      }
      // Sort chronologically ascending to preserve operation order
      records.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateMutationStatus(id: string, updates: Partial<QueuedMutation>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return resolve();

      const updatedRecord = { ...record, ...updates };
      const putReq = store.put(updatedRecord);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeMutation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearSyncedMutations(): Promise<void> {
  const mutations = await getQueuedMutations();
  const synced = mutations.filter(m => m.status === 'SYNCED');
  for (const m of synced) {
    await removeMutation(m.id);
  }
}
