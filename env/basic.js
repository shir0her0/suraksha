// env/basic.js
export function collectBasicEnv() {
    // webdriver flag
    const webdriver = !!(navigator.webdriver);
  
    // performance timing snapshot (Navigation Timing API)
    const perf = (performance && performance.getEntriesByType) ? performance.getEntriesByType('navigation')[0] : null;
    const navTiming = perf ? {
      startTime: perf.startTime,
      duration: perf.duration,
      // may include other metrics if supported
    } : {};
  
    // network info (may be undefined on some browsers)
    const connection = navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : {};
  
    // page-level device metrics
    const device = {
      device_memory: navigator.deviceMemory || null,
      hardware_concurrency: navigator.hardwareConcurrency || null,
      screen: {
        width: screen.width,
        height: screen.height,
        color_depth: screen.colorDepth || null
      },
      os_name: navigator.platform || null,
      browser: navigator.userAgent || null,
      timezone_offset: new Date().getTimezoneOffset()
    };
  
    const browser_env = {
      webdriver,
      userAgent: navigator.userAgent,
      languages: navigator.languages || [navigator.language]
    };
  
    return {
      device,
      browser_env,
      network: {
        effective_type: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null
      },
      nav_timing: navTiming
    };
  }
  