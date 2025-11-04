// aggregation/features.js

function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((s,x) => s + x, 0) / arr.length;
  }
  function std(arr, mu=null) {
    if (!arr.length) return 0;
    const m = mu === null ? mean(arr) : mu;
    return Math.sqrt(arr.reduce((s,x) => s + Math.pow(x - m, 2), 0) / arr.length);
  }
  
  export function computeDerivedFeatures({ typingEvents, mouseSamples, focusEvents }) {
    // typingEvents: array of {t, type, key_class}; compute dwell (keyup-keydown) & flights
    const downTimes = {};
    const dwellTimes = [];
    const keyDowns = typingEvents.filter(e => e.type === 'keydown');
    const keyUps = typingEvents.filter(e => e.type === 'keyup');
  
    // match by order (best-effort, since we do not store key id)
    let di = 0, ui = 0;
    while (di < keyDowns.length && ui < keyUps.length) {
      if (keyUps[ui].t >= keyDowns[di].t) {
        const dwell = keyUps[ui].t - keyDowns[di].t;
        if (dwell >= 0 && dwell < 5000) dwellTimes.push(dwell);
        di++; ui++;
      } else {
        ui++;
      }
    }
  
    // flight times: time between consecutive keydowns
    const flights = [];
    for (let i=1;i<keyDowns.length;i++){
      flights.push(keyDowns[i].t - keyDowns[i-1].t);
    }
  
    // mouse speed / jitter: compute velocities and high freq energy
    const mouse = mouseSamples.samples || [];
    const velocities = [];
    for (let i=1;i<mouse.length;i++){
      const dx = mouse[i].x - mouse[i-1].x;
      const dy = mouse[i].y - mouse[i-1].y;
      const dt = Math.max(1, mouse[i].t - mouse[i-1].t);
      velocities.push(Math.sqrt(dx*dx + dy*dy) / dt);
    }
  
    // jitter_score: ratio of high-frequency variance vs overall
    const mouseJitter = std(velocities) || 0;
    const meanVel = mean(velocities) || 0;
  
    const derived = {
      mean_dwell: mean(dwellTimes),
      std_dwell: std(dwellTimes),
      mean_flight: mean(flights),
      std_flight: std(flights),
      burstiness: (std(flights) / (mean(flights)||1)),
      backspace_rate: typingEvents.filter(e => e.key_class === 'backspace').length / Math.max(1, keyDowns.length),
      mouse_jitter_score: mouseJitter,
      mouse_mean_velocity: meanVel,
      focus_changes: (focusEvents || []).length,
      typing_event_count: typingEvents.length,
      mouse_event_count: mouse.length,
      click_count: (mouseSamples.clicks || []).length
    };
  
    return derived;
  }
  