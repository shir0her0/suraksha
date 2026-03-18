// core/transport.js
const API_URL = "https://59gtln6uf4.execute-api.ap-south-1.amazonaws.com/prod/collect";

export class Transport {
  constructor() {
    this.queue = [];
    this.maxBatch = 1;
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
      // 🔥 FIRST: try sendBeacon (important for AWS + beforeunload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(item)], {
          type: "application/json"
        });

        const success = navigator.sendBeacon(API_URL, blob);

        if (success) {
          this._saveQueueToStorage();
          this.sending = false;

          if (this.queue.length && navigator.onLine) {
            setTimeout(() => this._flushQueue(), 1000);
          }
          return;
        }
      }

      // fallback to fetch
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        keepalive: true
      });

      if (!res.ok) throw new Error("Network error " + res.status);

      this._saveQueueToStorage();

    } catch (e) {
      this.queue.unshift(item);
      this._saveQueueToStorage();
    } finally {
      this.sending = false;

      if (this.queue.length && navigator.onLine) {
        setTimeout(() => this._flushQueue(), 1000);
      }
    }
  }
}