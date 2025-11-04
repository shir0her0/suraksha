# SURAKSHA — Login Simulation (Research & Education)

Single-page simulation mimicking Google's sign-in design language to collect behavioral signals for passive CAPTCHA research. This project focuses on privacy-preserving client-side obfuscation and derived feature collection. Raw credentials are never sent to the backend.

## Quick Start

- Serve `index.html` from any static server.
- Optional: include FingerprintJS script (public CDN) if you want fingerprint presence/ID; otherwise the page works without it.
- Client will POST a JSON payload to `POST /api/suraksha/collect`.

## Consent and Warnings

- Purpose: collect behavioral signals for passive CAPTCHA research.
- Collected: event counts, timing metrics, mouse trajectory stats (speed/accel/entropy/curvature/pause count), click precision, scroll metrics, backspace count, browser header snapshot, optional fingerprint.
- Handling: raw credentials are not stored; only HMAC-SHA256 hashes (salted with `session_id`) and derived features (length, character classes, entropy estimate) are included.
- Prominent warning: Do not enter extremely sensitive secrets (bank PINs, 2FA codes). If using real credentials, ensure username/password are for different services and do not match within a single service.
- Only consenting adult volunteers should participate.

## Client Payload Contract

Endpoint: `POST /api/suraksha/collect`

Headers:
- `Content-Type: application/json`

Body (example fields):
```json
{
  "metadata": {
    "session_id": "uuid-v4",
    "session_age_ms": 12345,
    "created_at_iso": "2025-10-01T12:34:56.789Z",
    "client_time_offset_ms": -15
  },
  "consent": { "consented": true },
  "inputs": {
    "username_len": 12,
    "username_hash": "hmac_sha256_hex",
    "username_char_classes": { "letters": 8, "digits": 2, "special": 2 },
    "password_len": 14,
    "password_hash": "hmac_sha256_hex",
    "password_char_classes": { "letters": 7, "digits": 4, "special": 3 },
    "password_entropy_estimate": 84.31,
    "test_phrase_used": false
  },
  "events": {
    "ttf_first_interaction_ms": 523,
    "n_mousemove": 210,
    "n_clicks": 3,
    "n_keydowns": 24,
    "n_scroll_events": 0,
    "focus_count": 2,
    "visibility_count": 1
  },
  "ikd": { "mean_ms": 110.2, "std_ms": 35.7, "min_ms": 65.1, "max_ms": 188.9 },
  "mouse": {
    "speed": { "avg": 0.45, "std": 0.21 },
    "accel": { "avg": 0.002, "std": 0.004 },
    "dirEntropy": 3.12,
    "pathCurvature": 0.54,
    "pauseCount": 4
  },
  "click_precision": { "avgClickOffset": 6.1, "stdClickOffset": 3.9 },
  "backspace_count": 2,
  "scroll": { "totalDistance": 0, "n_scroll_events": 0, "avgIntervalMs": 0 },
  "fingerprint": { "fingerprint_present": true, "fingerprint_id_hashed_or_null": "hmac_sha256_hex" },
  "header_snapshot": { "userAgent": "...", "platform": "MacIntel", "language": "en-US", "languages": ["en-US","en"], "timezoneOffsetMin": 240 },
  "honeytrap_triggered": false,
  "backend_instructions": "enrich IP reputation using request IP and compare with header_snapshot; return header_consistency boolean."
}
```

## Backend Implementation Guidance

Implement `POST /api/suraksha/collect` approximately as follows (pseudo):

1. Record request IP at entry; do not rely on client fields.
2. Enrich IP reputation using a reputable service (e.g., IPQualityScore, AbuseIPDB, MaxMind risk, etc.), producing `ip_reputation_score` and (optional) geo.
3. Compute `header_consistency` by comparing geo/timezone/language/UA from IP intel vs `header_snapshot` for mismatches.
4. If `fingerprint.fingerprint_id_hashed_or_null` present, store it and compute cross-session `session_behavioral_diversity` over recent sessions for that hashed ID.
5. Persist submission in NDJSON, 1 object per line, with additional backend-enriched fields.
6. Respond `{ id: shortId }`.

### Example NDJSON record (server-augmented)
```json
{
  "id": "c7f39a",
  "received_at_iso": "2025-10-01T12:35:10.000Z",
  "request_ip": "203.0.113.42",
  "ip_reputation_score": 0.12,
  "header_consistency": true,
  "session_behavioral_diversity": 0.41,
  "payload": { /* entire client payload from above */ }
}
```

### Minimal Node/Express example (sketch)
```js
app.post('/api/suraksha/collect', express.json(), async (req, res) => {
  const submissionId = Math.random().toString(36).slice(2, 8);
  const requestIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const payload = req.body;
  // TODO: enrich IP reputation and header consistency here
  // TODO: write to NDJSON store
  res.json({ id: submissionId });
});
```

## ML-Ready Storage Schema

Store as NDJSON (one JSON object per line) with server-augmented fields. Each line conforms to:
```json
{
  "id": "short-id",
  "received_at_iso": "ISO-8601",
  "request_ip": "IP address",
  "ip_reputation_score": 0.0,
  "header_consistency": true,
  "session_behavioral_diversity": 0.0,
  "payload": {
    "metadata": { "session_id": "", "session_age_ms": 0, "created_at_iso": "", "client_time_offset_ms": 0 },
    "consent": { "consented": true },
    "inputs": { "username_len": 0, "username_hash": "", "username_char_classes": {"letters":0,"digits":0,"special":0}, "password_len": 0, "password_hash": "", "password_char_classes": {"letters":0,"digits":0,"special":0}, "password_entropy_estimate": 0, "test_phrase_used": false },
    "events": { "ttf_first_interaction_ms": 0, "n_mousemove": 0, "n_clicks": 0, "n_keydowns": 0, "n_scroll_events": 0, "focus_count": 0, "visibility_count": 0 },
    "ikd": { "mean_ms": 0, "std_ms": 0, "min_ms": 0, "max_ms": 0 },
    "mouse": { "speed": {"avg":0,"std":0}, "accel": {"avg":0,"std":0}, "dirEntropy": 0, "pathCurvature": 0, "pauseCount": 0 },
    "click_precision": { "avgClickOffset": 0, "stdClickOffset": 0 },
    "backspace_count": 0,
    "scroll": { "totalDistance": 0, "n_scroll_events": 0, "avgIntervalMs": 0 },
    "fingerprint": { "fingerprint_present": false, "fingerprint_id_hashed_or_null": null },
    "header_snapshot": { "userAgent": "", "platform": "", "language": "", "languages": [], "timezoneOffsetMin": 0 },
    "honeytrap_triggered": false,
    "backend_instructions": "enrich IP reputation using request IP and compare with header_snapshot; return header_consistency boolean."
  }
}
```

## CSV Conversion

Use a script to flatten NDJSON to CSV for training. Example Node script sketch:
```js
// ndjson_to_csv.js
const fs = require('fs');
const readline = require('readline');

(async () => {
  const rl = readline.createInterface({ input: fs.createReadStream('submissions.ndjson') });
  const rows = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    const p = obj.payload;
    rows.push({
      id: obj.id,
      received_at_iso: obj.received_at_iso,
      request_ip: obj.request_ip,
      ip_reputation_score: obj.ip_reputation_score,
      header_consistency: obj.header_consistency,
      session_behavioral_diversity: obj.session_behavioral_diversity,
      session_id: p.metadata.session_id,
      session_age_ms: p.metadata.session_age_ms,
      username_len: p.inputs.username_len,
      password_len: p.inputs.password_len,
      username_letters: p.inputs.username_char_classes.letters,
      username_digits: p.inputs.username_char_classes.digits,
      username_special: p.inputs.username_char_classes.special,
      password_letters: p.inputs.password_char_classes.letters,
      password_digits: p.inputs.password_char_classes.digits,
      password_special: p.inputs.password_char_classes.special,
      password_entropy_estimate: p.inputs.password_entropy_estimate,
      ttf_first_interaction_ms: p.events.ttf_first_interaction_ms,
      n_mousemove: p.events.n_mousemove,
      n_clicks: p.events.n_clicks,
      n_keydowns: p.events.n_keydowns,
      n_scroll_events: p.events.n_scroll_events,
      focus_count: p.events.focus_count,
      visibility_count: p.events.visibility_count,
      ikd_mean_ms: p.ikd.mean_ms,
      ikd_std_ms: p.ikd.std_ms,
      ikd_min_ms: p.ikd.min_ms,
      ikd_max_ms: p.ikd.max_ms,
      mouse_speed_avg: p.mouse.speed.avg,
      mouse_speed_std: p.mouse.speed.std,
      mouse_accel_avg: p.mouse.accel.avg,
      mouse_accel_std: p.mouse.accel.std,
      mouse_dirEntropy: p.mouse.dirEntropy,
      mouse_pathCurvature: p.mouse.pathCurvature,
      mouse_pauseCount: p.mouse.pauseCount,
      click_avg_offset: p.click_precision.avgClickOffset,
      click_std_offset: p.click_precision.stdClickOffset,
      backspace_count: p.backspace_count,
      scroll_totalDistance: p.scroll.totalDistance,
      scroll_avgIntervalMs: p.scroll.avgIntervalMs,
      fingerprint_present: p.fingerprint.fingerprint_present,
      header_timezone_min: p.header_snapshot.timezoneOffsetMin,
      honeytrap_triggered: p.honeytrap_triggered
    });
  }
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  fs.writeFileSync('submissions.csv', csv);
})();
```

## Ethics / IRB Checklist

- Clear description of purpose and data collected
- No storage of raw credentials; only hashed/derived features
- Prominent warning to avoid extremely sensitive secrets
- Consent checkbox gating collection and submission
- Only consenting adult volunteers
- Provide contact for questions/withdrawal (placeholder now)
- Data minimization and access controls
- Hashed identifiers; avoid direct identifiers unless essential
