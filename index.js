// index.js
import { collectBasicEnv } from "./env/basic.js";
import { collectFingerprint } from "./env/fingerprint.js";
import { collectConsistency } from "./env/consistency.js";
import { TypingCollector } from "./behavior/typing.js";
import { CursorCollector } from "./behavior/cursor.js";
import { computeDerivedFeatures } from "./aggregation/features.js";
import { Transport } from "./core/transport.js";

const transport = new Transport();

let typing, cursor;
let sessionStart;

/**
 * Helper: get or create persistent session ID from sessionStorage.
 */
function getSessionId() {
  let sid = sessionStorage.getItem('suraksha_session_id');
  if (!sid) {
    // Fallback in case env/fingerprint.js didn’t initialize yet
    sid = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    sessionStorage.setItem('suraksha_session_id', sid);
  }
  return sid;
}

/**
 * Initialize environment + behavioral collectors.
 * @param {string} [taskId="default_task"]
 * @param {boolean} [consent=true]
 */
export async function initCollectors(taskId = "default_task", consent = true) {
  const sessionId = getSessionId(); // 👈 auto-managed session ID

  // Collect environment metadata
  const basic = collectBasicEnv();
  const fingerprint = await collectFingerprint(); // includes sessionId + visitorId
  const consistency = collectConsistency();

  // Start behavior collectors (if consented)
  typing = new TypingCollector();
  cursor = new CursorCollector();
  if (consent) {
    typing.start();
    cursor.start();
    sessionStart = performance.now();
  }

  return {
    sessionMeta: {
      session_id: sessionId,
      task_id: taskId,
      consent: !!consent,
      timestamp_start: Date.now()
    },
    device: { ...basic.device, ...consistency.device },
    browser_env: { ...basic.browser_env, ...fingerprint },
    network: basic.network
  };
}

/**
 * Stop collectors, compute features, and send data to backend.
 */
export async function gatherAndSend(baseMeta, label = "unknown") {
  const typingEvents = typing.stop();
  const mouseSamples = cursor.stop();
  const focusEvents = cursor.getFocusEvents();
  const scrollEvents = cursor.getScrollCount();
  const pasteCount = typing.getPasteCount();
  const timestamp_end = Date.now();

  const derived = computeDerivedFeatures({ typingEvents, mouseSamples, focusEvents });

  const payload = {
    ...baseMeta.sessionMeta,
    timestamp_end,
    device: baseMeta.device,
    browser_env: baseMeta.browser_env,
    network: baseMeta.network,
    behavior: {
      typing_events: baseMeta.sessionMeta.consent ? typingEvents : [],
      mouse_samples: baseMeta.sessionMeta.consent ? mouseSamples : [],
      focus_events: baseMeta.sessionMeta.consent ? focusEvents : [],
      paste_events: pasteCount,
      scroll_events: scrollEvents
    },
    derived_features: derived,
    label
  };

  await transport.send(payload);
  return payload;
}

// Optional: expose sessionId globally for debugging
window.getSurakshaSessionId = getSessionId;
