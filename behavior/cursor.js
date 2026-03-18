// behavior/cursor.js
export class CursorCollector {
    constructor() {
      this.samples = []; // {t, x, y}
      this.clicks = [];  // {t, x, y, type}
      this.focusEvents = [];
      this.scrollCount = 0;
  
      this._onMove = this._onMove.bind(this);
      this._onDown = this._onDown.bind(this);
      this._onUp = this._onUp.bind(this);
      this._onScroll = this._onScroll.bind(this);
      this._onFocus = this._onFocus.bind(this);
      this._onBlur = this._onBlur.bind(this);
  
      this._started = false;
      this._lastSampleTs = 0;
      this._sampleInterval = 25; // ms, throttle mouse samples ~40Hz
    }
  
    start() {
      if (this._started) return;
      window.addEventListener('mousemove', this._onMove, true);
      window.addEventListener('mousedown', this._onDown, true);
      window.addEventListener('mouseup', this._onUp, true);
      window.addEventListener('scroll', this._onScroll, true);
      window.addEventListener('focus', this._onFocus);
      window.addEventListener('blur', this._onBlur);
      this._started = true;
    }
  
    stop() {
      if (!this._started) return this.getSamples();
      window.removeEventListener('mousemove', this._onMove, true);
      window.removeEventListener('mousedown', this._onDown, true);
      window.removeEventListener('mouseup', this._onUp, true);
      window.removeEventListener('scroll', this._onScroll, true);
      window.removeEventListener('focus', this._onFocus);
      window.removeEventListener('blur', this._onBlur);
      this._started = false;
      return this.getSamples();
    }
  
    _onMove(e) {
      const now = performance.now();
      if (now - this._lastSampleTs < this._sampleInterval) return;
      this._lastSampleTs = now;
      const x = Math.round(e.clientX);
      const y = Math.round(e.clientY);
      this.samples.push({ t: Math.round(now), x, y });
      // trim to reasonable length to avoid huge arrays on long sessions
      if (this.samples.length > 10000) this.samples.shift();
    }
  
    _onDown(e) {
      this.clicks.push({ t: Math.round(performance.now()), x: e.clientX, y: e.clientY, type: 'down' });
    }
  
    _onUp(e) {
      this.clicks.push({ t: Math.round(performance.now()), x: e.clientX, y: e.clientY, type: 'up' });
    }
  
    _onScroll(e) {
      this.scrollCount++;
    }
  
    _onFocus() {
      this.focusEvents.push({ t: Math.round(performance.now()), event: 'focus' });
    }
  
    _onBlur() {
      this.focusEvents.push({ t: Math.round(performance.now()), event: 'blur' });
    }
  
    getSamples() {
      return {
        samples: [...this.samples],
        clicks: [...this.clicks]
      };
    }
  
    getFocusEvents() {
      return [...this.focusEvents];
    }
  
    getScrollCount() {
      return this.scrollCount;
    }
  }
  