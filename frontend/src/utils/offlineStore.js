/**
 * Offline POS Store using browser IndexedDB (Zero External Dependencies)
 * Manages product catalog caching and offline invoice submission queue.
 */

const DB_NAME = 'hisabi_offline_db';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            return reject(new Error('IndexedDB not supported in this browser'));
        }
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('offline_invoices')) {
                db.createObjectStore('offline_invoices', { keyPath: 'client_id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ─── Products Cache ──────────────────────────────────────────────────────────

export async function cacheProducts(products) {
    try {
        const db = await openDB();
        const tx = db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');
        await store.clear();
        for (const item of products) {
            store.put(item);
        }
        return true;
    } catch (e) {
        console.warn('[OfflineStore] Failed to cache products:', e);
        return false;
    }
}

export async function getCachedProducts() {
    try {
        const db = await openDB();
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('[OfflineStore] Failed to fetch cached products:', e);
        return [];
    }
}

// ─── Offline Invoices Queue ──────────────────────────────────────────────────

export async function queueOfflineInvoice(invoiceData) {
    try {
        const db = await openDB();
        const tx = db.transaction('offline_invoices', 'readwrite');
        const store = tx.objectStore('offline_invoices');
        const client_id = 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const record = {
            client_id,
            timestamp: new Date().toISOString(),
            data: invoiceData
        };
        await store.put(record);
        return record;
    } catch (e) {
        console.error('[OfflineStore] Failed to queue offline invoice:', e);
        throw e;
    }
}

export async function getPendingOfflineInvoices() {
    try {
        const db = await openDB();
        const tx = db.transaction('offline_invoices', 'readonly');
        const store = tx.objectStore('offline_invoices');
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        return [];
    }
}

export async function removeOfflineInvoice(client_id) {
    try {
        const db = await openDB();
        const tx = db.transaction('offline_invoices', 'readwrite');
        const store = tx.objectStore('offline_invoices');
        await store.delete(client_id);
        return true;
    } catch (e) {
        return false;
    }
}
