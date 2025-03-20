const DB_NAME = "PaymentsDB";
const STORE_NAME = "attachments";
const DB_VERSION = 1;

export interface StoredAttachment {
  id: string;
  data: Blob;
  type: string;
  timestamp: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const storeAttachment = async (
  id: string,
  file: File
): Promise<string> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const attachment: StoredAttachment = {
    id,
    data: file,
    type: file.type,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(attachment);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const url = `indexeddb://${id}`;
      resolve(url);
    };
  });
};

export const getAttachment = async (
  id: string
): Promise<StoredAttachment | null> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const deleteAttachment = async (id: string): Promise<void> => {
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const isIndexedDBUrl = (url: string): boolean => {
  return url.startsWith("indexeddb://");
};

export const getIdFromUrl = (url: string): string => {
  return url.replace("indexeddb://", "");
};
