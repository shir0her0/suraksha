// core/transport.js
const API_URL = "https://59gtln6uf4.execute-api.ap-south-1.amazonaws.com/prod"; // << API Endpoint URL
export class Transport {
  constructor() {
    this.queue = [];
    this.maxBatch = 1; // you can increase to batch multiple payloads
    this.sending = false;
    this.storageKey = "suraksha_pending";
    this._loadQueueFromStorage();
    window.addEventListener('online', () => this._flushQueue());
  }

  _loadQueueFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.queue = JSON.parse(raw);
    } catch (e) { this.queue = []; }
  }

  _saveQueueToStorage() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.queue)); } catch(e){}
  }

  async send(payload) {
    this.queue.push(payload);
    this._saveQueueToStorage();
    return this._flushQueue();
  }

  async _flushQueue() {
    if (this.sending || !this.queue.length || !navigator.onLine) return;
    this.sending = true;
    const item = this.queue.shift();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        keepalive: true
      });
      if (!res.ok) throw new Error("Network error "+res.status);
      // success, persist queue minus the sent item
      this._saveQueueToStorage();
    } catch (e) {
      // push the item back and retry later
      this.queue.unshift(item);
      this._saveQueueToStorage();
    } finally {
      this.sending = false;
      // if more items, attempt next send (with small delay)
      if (this.queue.length && navigator.onLine) setTimeout(()=>this._flushQueue(), 1000);
    }
  }
}
