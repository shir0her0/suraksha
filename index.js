// index.js
import { collectBasicEnv } from "./env/basic.js";
import { collectFingerprint } from "./env/fingerprint.js";
import { collectConsistency } from "./env/consistency.js";
import { TypingCollector } from "./behavior/typing.js";
import { CursorCollector } from "./behavior/cursor.js";
import { computeDerivedFeatures } from "./aggregation/features.js";
import { Transport } from "./core/transport.js";

/*
  Bootstraps everything, waits for user consent, then starts collectors.
  Exports `gatherAndSend()` for Suraksha.html submit handler to call.
*/

const transport = new Transport();

let typing, cursor;
let sessionStart;

export async function initCollectors(sessionId, taskId, consent=true) {
  // collect environment basics synchronously
  const basic = collectBasicEnv();
  const fingerprint = await collectFingerprint();
  const consistency = collectConsistency();

  typing = new TypingCollector();
  cursor = new CursorCollector();

  // do not start capturing until consent
  if (consent) {
    typing.start();
    cursor.start();
    sessionStart = performance.now();
  }

  // return base meta to be used in final payload
  return {
    sessionMeta: {
      session_id: sessionId,
      task_id: taskId,
      consent: !!consent,
      timestamp_start: Date.now()
    },
    device: {...basic.device, ...consistency.device},
    browser_env: {...basic.browser_env, ...fingerprint},
    network: basic.network
  };
}

export async function gatherAndSend(baseMeta, label = "unknown") {
  // stop collectors and fetch raw arrays
  const typingEvents = typing.stop(); // returns array
  const mouseSamples = cursor.stop(); // returns array
  const focusEvents = cursor.getFocusEvents();
  const scrollEvents = cursor.getScrollCount();
  const pasteCount = typing.getPasteCount();

  const timestamp_end = Date.now();

  // compute derived features client-side
  const derived = computeDerivedFeatures({ typingEvents, mouseSamples, focusEvents });

  const payload = {
    ...baseMeta.sessionMeta,
    consent: baseMeta.sessionMeta.consent,
    timestamp_start: baseMeta.sessionMeta.timestamp_start,
    timestamp_end,
    device: baseMeta.device,
    browser_env: baseMeta.browser_env,
    network: baseMeta.network,
    behavior: {
      // NOTE: we include raw events only if consent true; otherwise send empty arrays
      typing_events: baseMeta.sessionMeta.consent ? typingEvents : [],
      mouse_samples: baseMeta.sessionMeta.consent ? mouseSamples : [],
      focus_events: baseMeta.sessionMeta.consent ? focusEvents : [],
      paste_events: pasteCount,
      scroll_events: scrollEvents
    },
    derived_features: derived,
    label
  };

  // send to server (Transport handles batching / retry)
  await transport.send(payload);

  return payload;
}

// Automatically run small init for landing if available
if (document.readyState !== "loading") {
  // no auto-init here; Suraksha.html will call initCollectors when ready
} else {
  document.addEventListener("DOMContentLoaded", () => {
    // nothing automatic
  });
}
