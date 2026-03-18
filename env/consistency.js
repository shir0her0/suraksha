// env/consistency.js

export function collectConsistency() {
    const ua = navigator.userAgent || '';
    const languages = navigator.languages || [navigator.language];
    // simple consistency heuristics
    const ua_lower = ua.toLowerCase();
    const isMobileUA = /mobi|android|iphone/.test(ua_lower);
    const languageHeader = navigator.language || (languages[0] || null);
    const languageConsistency = (languageHeader && languages.length) ? (languages[0] === languageHeader) : true;
  
    const device = {
      device_type_estimate: isMobileUA ? 'mobile' : 'desktop',
      language_consistency: languageConsistency,
      ua_snippet: ua.split(' ').slice(0,3).join(' ')
    };
  
    const browserFeatureScore = {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  
    return {
      device,
      browserFeatureScore
    };
  }
  