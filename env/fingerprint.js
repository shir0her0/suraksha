// env/fingerprint.js

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function collectFingerprint() {

  // ✅ stable session ID (never overwritten)
  let sessionId = sessionStorage.getItem('suraksha_session_id');

  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('suraksha_session_id', sessionId);
  }

  let visitorId = null, pluginHash = null, fontHash = null;

  if (window && window.FingerprintJS) {
    try {
      const fp = await (await FingerprintJS.load()).get();

      visitorId = fp.visitorId;
      pluginHash = simpleHash(JSON.stringify(fp.components.plugins?.value || []));
      fontHash = simpleHash(JSON.stringify(fp.components.fonts?.value || []));

      // ❌ DO NOT overwrite sessionId anymore

    } catch (err) {
      console.warn("FingerprintJS unavailable, using UUID fallback", err);
    }
  } else {
    const pluginCount = navigator.plugins ? navigator.plugins.length : 0;
    const fontsGuess = (navigator.userAgent || "") +
                       (screen.width || 0) +
                       "@" +
                       (navigator.platform || "");

    pluginHash = simpleHash(String(pluginCount));
    fontHash = simpleHash(fontsGuess);
  }

  console.log("%cSuraksha session ID:", "color:#1a73e8;font-weight:bold;", sessionId);

  return {
    visitorId: visitorId || sessionId,
    sessionId,
    plugin_hash: pluginHash,
    font_hash: fontHash
  };
}