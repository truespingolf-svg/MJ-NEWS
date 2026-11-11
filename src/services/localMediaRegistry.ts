// Local IndexedDB Media Registry for high-capacity local audio, video, and image storage
// Prevents Firestore 1MB document size limits and avoids browser state/network stalls

const DB_NAME = 'MJJ_RECORDS_LOCAL_MEDIA_DB';
const STORE_NAME = 'media_registry';
const DB_VERSION = 1;

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeLocalMedia(key: string, dataUrl: string): Promise<string> {
  if (!dataUrl) return '';
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, key);
      req.onsuccess = () => resolve(`indexeddb://${key}`);
      req.onerror = () => resolve(dataUrl);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to direct string:', err);
    return dataUrl;
  }
}

export async function getLocalMedia(keyOrUrl: string): Promise<string> {
  if (!keyOrUrl) return '';
  if (!keyOrUrl.startsWith('indexeddb://')) {
    return keyOrUrl;
  }
  const key = keyOrUrl.replace('indexeddb://', '');
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result || '');
      };
      req.onerror = () => resolve('');
    });
  } catch {
    return '';
  }
}

// Safely process media before writing to Firestore:
// If dataUrl is base64 and > 150KB, store in IndexedDB and return lightweight 'indexeddb://key' URL for Firestore!
export async function processMediaForStorage(dataUrl: string, prefix = 'media'): Promise<string> {
  if (!dataUrl) return '';
  if (!dataUrl.startsWith('data:')) return dataUrl; // Already a regular URL or indexeddb key

  // Check string size (Base64 over 150,000 chars)
  if (dataUrl.length > 150000) {
    const key = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    return await storeLocalMedia(key, dataUrl);
  }
  return dataUrl;
}
