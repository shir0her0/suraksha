// env/fingerprint.js
// NOTE: This tries to use FingerprintJS (if you load their CDN in HTML).
// If not present, returns basic plugin/font hash approximations.

function simpleHash(str) {
    // small non-crypto hash for compactness
    let h=0;
    for(let i=0;i<str.length;i++) h = ((h<<5)-h)+str.charCodeAt(i), h|=0;
    return (h >>> 0).toString(16);
  }
  
  export async function collectFingerprint() {
    // If FingerprintJS is loaded globally (via CDN), use it
    if (window && window.FingerprintJS) {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        return {
          visitorId: result.visitorId,
          plugin_hash: simpleHash(JSON.stringify(result.components.plugins?.value || [])),
          font_hash: simpleHash(JSON.stringify(result.components.fonts?.value || []))
        };
      } catch (e) {
        // fallback to basic
      }
    }
  
    // Fallback: basic plugin/font approximations (non-identifying)
    const pluginCount = navigator.plugins ? navigator.plugins.length : 0;
    const fontsGuess = (navigator.userAgent || "") + (screen.width||0) + "@" + (navigator.platform || "");
    return {
      visitorId: null,
      plugin_hash: simpleHash(String(pluginCount)),
      font_hash: simpleHash(fontsGuess)
    };
  }
  