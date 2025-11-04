// env/fingerprint.js
// NOTE: This tries to use FingerprintJS (if you load their CDN in HTML).
// If not present, returns basic plugin/font hash approximations.
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return (h >>> 0).toString(16);
  }
  
  // Fallback UUID generator
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // ---- Persistent Session Handling ----
  export async function collectFingerprint() {
    // 1. Try to retrieve session_id from sessionStorage
    let sessionId = sessionStorage.getItem('suraksha_session_id');
  
    // 2. If not found, generate a temporary one
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('suraksha_session_id', sessionId);
    }
  
    // 3. Try loading FingerprintJS to replace sessionId with stable visitorId (optional)
    let visitorId = null, pluginHash = null, fontHash = null;
  
    if (window && window.FingerprintJS) {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        visitorId = result.visitorId;
        pluginHash = simpleHash(JSON.stringify(result.components.plugins?.value || []));
        fontHash = simpleHash(JSON.stringify(result.components.fonts?.value || []));
  
        // Overwrite the session ID only if none exists (first page load)
        if (!sessionStorage.getItem('suraksha_session_id')) {
          sessionId = visitorId || sessionId;
          sessionStorage.setItem('suraksha_session_id', sessionId);
        }
      } catch (err) {
        console.warn("FingerprintJS unavailable, using UUID fallback", err);
      }
    } else {
      // fallback plugin/font detection
      const pluginCount = navigator.plugins ? navigator.plugins.length : 0;
      const fontsGuess = (navigator.userAgent || "") + (screen.width || 0) + "@" + (navigator.platform || "");
      pluginHash = simpleHash(String(pluginCount));
      fontHash = simpleHash(fontsGuess);
    }
  
    // 4. Debug print for developers
    console.log("%cSuraksha session ID:", "color:#1a73e8;font-weight:bold;", sessionId);
  
    // 5. Return data for JSON payloads
    return {
      visitorId: visitorId || sessionId,
      sessionId,
      plugin_hash: pluginHash,
      font_hash: fontHash
    };
  }