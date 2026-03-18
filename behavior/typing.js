const KEY_CLASS_MAP = (code) => {
  if (!code) return 'unknown';
  if (/^Key[A-Z]/.test(code)) return 'letter';
  if (/^Digit/.test(code)) return 'digit';
  if (code === 'Space') return 'space';
  if (/Backspace|Delete/.test(code)) return 'backspace';
  if (/Enter/.test(code)) return 'enter';
  if (/Shift|Control|Alt|Meta/.test(code)) return 'modifier';
  return 'other';
};

export class TypingCollector {
  constructor() {
    this.events = [];
    this.activeKeys = {}; // ✅ FIX
    this._pasteCount = 0;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPaste = this._onPaste.bind(this);

    this._started = false;
  }

  start() {
    if (this._started) return;
    window.addEventListener('keydown', this._onKeyDown, true);
    window.addEventListener('keyup', this._onKeyUp, true);
    window.addEventListener('paste', this._onPaste, true);
    this._started = true;
  }

  stop() {
    if (!this._started) return this.events;
    window.removeEventListener('keydown', this._onKeyDown, true);
    window.removeEventListener('keyup', this._onKeyUp, true);
    window.removeEventListener('paste', this._onPaste, true);
    this._started = false;
    return [...this.events];
  }

  _onKeyDown(e) {
    const now = performance.now();
    const kc = KEY_CLASS_MAP(e.code || e.key);

    this.activeKeys[e.code] = now;

    this.events.push({
      t: Math.round(now),
      type: 'keydown',
      key_class: kc
    });
  }

  _onKeyUp(e) {
    const now = performance.now();
    const kc = KEY_CLASS_MAP(e.code || e.key);

    const downTime = this.activeKeys[e.code];

    this.events.push({
      t: Math.round(now),
      type: 'keyup',
      key_class: kc,
      dwell: downTime ? (now - downTime) : null
    });

    delete this.activeKeys[e.code];
  }

  _onPaste() {
    this._pasteCount += 1;
  }

  getPasteCount() {
    return this._pasteCount;
  }
}