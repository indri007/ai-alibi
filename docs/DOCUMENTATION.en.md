# Technical Documentation — Creative Alibi Word Add-in

> Document version: 1.0.0 · Language: English (see `DOCUMENTATION.id.md` for the Indonesian version)

This document is the complete reference for understanding **what was built, why it was built this way, exactly how it works, and where every number shown to the user comes from**. It is separate from `README.md` (which focuses on installation & quick usage) — here we go into architecture detail, data schemas, and scoring methodology.

---

## Table of Contents

1. [Background & Design Thinking Mapping](#1-background--design-thinking-mapping)
2. [System Architecture](#2-system-architecture)
3. [File Structure & Responsibilities](#3-file-structure--responsibilities)
4. [User Flow](#4-user-flow)
5. [Technical Data Flow](#5-technical-data-flow)
6. [Data Schema / Metadata](#6-data-schema--metadata)
7. [Human Rhythm Score Methodology — Full Scoring Reference](#7-human-rhythm-score-methodology--full-scoring-reference)
8. [Process Certificate & Hash Integrity](#8-process-certificate--hash-integrity)
9. [Function Reference (`taskpane.js`)](#9-function-reference-taskpanejs)
10. [Manifest Reference (`manifest.xml`)](#10-manifest-reference-manifestxml)
11. [Privacy & Security](#11-privacy--security)
12. [Known Limitations & Risks](#12-known-limitations--risks)
13. [Installation, Build, and Deployment](#13-installation-build-and-deployment)
14. [Development Roadmap](#14-development-roadmap)
15. [Glossary](#15-glossary)

---

## 1. Background & Design Thinking Mapping

This product is a direct output of Team ALIBI's *Design Thinking Quick Sheet* worksheet (`Brainstorming_2_-_Creative_Alibi.xlsx`). Below is the mapping from each stage to a concrete product decision:

| Stage | Worksheet Content | Product Decision |
|---|---|---|
| **Empathize** | Freelance creators are wrongly accused of "using AI" by clients/platforms, losing income and reputation with no way to defend themselves. | The core feature must produce **evidence** that can be sent to a third party — not just an internal log. |
| **Persona** | "Made", a 29-year-old vector illustrator, frequently suspected of using AI because of how clean his style is. | UI copy and product language are written for a non-technical user under pressure (needs something fast and convincing, not complicated). |
| **Define** | *"How might we help freelance creators objectively prove that their work process is genuinely manual... without having to expose every detail of their work publicly?"* | This is the reason **content is never recorded** — only numeric metadata. Proving process without exposing the artwork. |
| **Ideate** | 4 ideas: Process Recorder, Human Rhythm Score, Timestamp Ledger, Instant Dispute Kit. The team chose the combination of Idea 1+2+4 for the MVP; Idea 3 (blockchain ledger) was marked as a later phase. | This MVP fully implements Ideas 1, 2, and 4. Idea 3 is documented under [Roadmap](#14-development-roadmap) as *not yet implemented*. |
| **Prototype & Test** | Flow: install plugin → record process timeline → compute score → generate certificate + short replay video → send to client. Two validation questions: (1) is the certificate convincing to clients, (2) does recording interfere with daily workflow. | This flow is implemented exactly (see [Chapter 4](#4-user-flow)), minus the replay video (see Roadmap). Recording overhead is kept light: numeric polling every 1.2 seconds, never copying/storing text. |

---

## 2. System Architecture

```
┌─────────────────────────────┐
│        Microsoft Word       │
│  (Desktop / Online / Mac)   │
│                              │
│  ┌────────────────────────┐ │
│  │   Task Pane (iframe)   │ │   <-- rendered by Word, content is taskpane.html
│  │                        │ │
│  │  taskpane.js  ─────────┼─┼──> Office.js API (Word.run, context.sync)
│  │  taskpane.css          │ │
│  └────────────────────────┘ │
└──────────────┬───────────────┘
               │ HTTPS (localhost:3000 during dev,
               │        hosting domain in production)
               ▼
     ┌───────────────────┐
     │  Dev/Static Server │   <-- webpack-dev-server (dev) or static hosting (prod)
     │  dist/taskpane.html│
     │  dist/taskpane.js  │
     │  dist/assets/*     │
     └───────────────────┘
```

**Why this architecture?**
- A Word Add-in **does not run as a separate native process** — it is a web page (HTML/CSS/JS) rendered inside a task pane by Word, communicating with the document through the **Office.js API**. This is the only officially supported way to build a Word "plugin" that runs across Windows/Mac/Web without shipping separate `.exe`/`.dll` files.
- All logic (polling, score calculation, certificate generation) runs **100% client-side (inside the browser engine embedded in Word)** — there is no backend server storing user data. This is a deliberate privacy decision: there is no place for data to leak besides the user's own machine.
- **Webpack** is used for bundling because it is the standard tooling recommended by Microsoft for modern Office Add-ins (not an arbitrary choice) — it supports automatic HTTPS dev serving via `office-addin-dev-certs`, which is mandatory since Word requires task panes to be served over HTTPS.

---

## 3. File Structure & Responsibilities

```
creative-alibi-word-addin/
├── manifest.xml              # the add-in's "ID card": name, icon, permissions, taskpane location, ribbon button
├── package.json              # dependencies & scripts (start, build, dev-server, validate)
├── webpack.config.js         # bundling config + local HTTPS dev server
├── README.md                 # quick installation & usage guide
├── docs/
│   ├── DOCUMENTATION.id.md   # Indonesian version
│   └── DOCUMENTATION.en.md   # this document
├── assets/
│   ├── icon-16.png           # small icon (menu/toolbar)
│   ├── icon-32.png           # standard icon (taskpane header, manifest)
│   ├── icon-64.png           # medium icon (some Office contexts)
│   └── icon-80.png           # large icon (ribbon button, high-res)
└── src/
    ├── commands/              # folder reserved for additional ribbon commands (unused in v1)
    └── taskpane/
        ├── taskpane.html      # UI markup: status, timer, metrics, score, certificate
        ├── taskpane.css       # "certificate/notary" visual theme (see design section in README)
        └── taskpane.js        # ALL logic: polling, scoring, certificate, hashing, document insertion
```

**Why organized this way?**
- `manifest.xml` is kept separate from the code because it is read **by Word itself**, not by the browser — it's a special Office XML schema, not part of the JS bundle.
- `src/taskpane/` is nested rather than at root because it follows the official Office Add-in Yeoman generator convention — this makes the project structure instantly recognizable to anyone familiar with Office Add-ins.
- `docs/` is kept separate from `README.md` per the request: `README.md` is for quick onboarding ("how to use it"), `docs/` is for deep understanding ("how it works & why").

---

## 4. User Flow

```
[1] Open Word, click the "Rekam Proses" (Record Process) ribbon button
        │
        ▼
[2] The Creative Alibi panel opens on the right
        │
        ▼
[3] Click "▶ Mulai Rekam" (Start Recording)  ───────► status: idle → recording
        │                                              timer starts running
        │                                              polling begins (every 1.2s)
        ▼
[4] The user writes/edits the document as usual
        │   (every 1.2 seconds, the system checks: has text length changed or not?)
        │
        ├── If UNCHANGED for a while (≥ 4 seconds)   → logged as a "thinking pause"
        ├── If changed gradually and in small amounts → logged as "normal editing"
        ├── If changed by a LARGE amount at once (>40 chars) → logged as a "sudden burst"
        └── If text length DECREASES                 → logged as "revision/deletion"
        │
        ▼   (optional, can happen repeatedly)
[4b] Click "⏸ Jeda" (Pause) to pause recording without resetting (e.g. long break)
        │
        ▼
[5] Click "■ Berhenti" (Stop) when done working
        │   → the system computes the Human Rhythm Score from the entire session
        ▼
[6] Click "📄 Buat Sertifikat" (Generate Certificate)
        │   → metadata payload is assembled + SHA-256 hash is computed
        ▼
[7a] Click "⬇ Unduh JSON" (Download JSON)   [7b] Click "📝 Sisipkan ke Dokumen" (Insert into Document)
     → sertifikat-proses-*.json file            → a certificate summary is appended
       is downloaded, ready to attach              as a paragraph at the end of the Word document
       to an email/dispute ticket to the client
        │
        ▼
[8] The user sends the certificate (JSON and/or the Word document) to the client/platform
    as supporting evidence against an "AI-generated" accusation
```

The **"Hapus sesi & mulai ulang"** (Clear session & start over) button is available at any time to wipe the entire state (samples, edits, pauses, score, certificate) and start a fresh session.

---

## 5. Technical Data Flow

This is the code-level data flow, from a Word event all the way to the numbers displayed on screen.

```
setInterval (every 1200ms)
        │
        ▼
pollDocument()
        │  Word.run(context => {
        │    range = body.getRange()
        │    range.load("text")
        │    await context.sync()      ← the ONLY point where text content is "touched"
        │    len = range.text.length   ← ONLY the numeric length is taken
        │    range.text = null         ← the string is discarded from memory IMMEDIATELY
        │  })
        ▼
handleLengthSample(len)
        │  delta = len - lastLen
        │  if delta != 0:
        │     - compute time gap since last change → push to `pauses[]` if ≥ 4000ms
        │     - push { t, delta } to `edits[]`
        │     - if |delta| > 40 → bursts++
        │     - if delta < 0 → revisions++
        ▼
updateMetricsUI() + drawActivity()
        │  (render numbers & activity bar chart to the DOM on every new sample)
        ▼
[when the user clicks "Stop"]
        ▼
computeMetrics()
        │  computes: burstRatio, typing-speed coefficient of variation,
        │            pause coefficient of variation, etc.
        │  → produces a `score` of 0–100  (see Chapter 7 for the full formula)
        ▼
generateCertificate()
        │  assembles the metadata payload (see Chapter 6)
        │  hash = SHA-256(JSON.stringify(payload))
        ▼
downloadCertificate() / insertCertificateIntoDoc()
```

**Key point:** the `edits`, `pauses`, `samples`, `bursts`, and `revisions` variables **contain only numbers and timestamps** — not a single string of document content is ever stored in the `state` variable throughout the add-in's lifecycle.

---

## 6. Data Schema / Metadata

### 6.1 `state` structure (in-memory, not persisted, lost on reset/close)

```ts
state = {
  running: boolean,
  paused: boolean,
  startedAt: number | null,        // epoch ms
  elapsedBeforePause: number,      // accumulated active duration, ms
  lastLen: number | null,          // last known text length (number)
  lastChangeAt: number | null,     // epoch ms of the last change
  samples: number,                 // total measurement points
  edits: Array<{ t: number, delta: number }>,  // numbers only
  pauses: Array<number>,           // duration of each pause, in ms
  bursts: number,                  // count of sudden bursts
  revisions: number,                // count of negative deltas
  lastCertificate: object | null
}
```

### 6.2 Certificate Payload Schema (`payload` in `generateCertificate()`)

```json
{
  "dokumen": "Sertifikat Proses — Creative Alibi",
  "dibuat": "2026-07-07T05:12:33.000Z",
  "durasiDetik": 1830,
  "totalSampel": 1525,
  "intervalAktif": 240,
  "jedaTerdeteksi": 12,
  "rataRataJedaMs": 8340,
  "lonjakanMendadak": 3,
  "rasioLonjakan": 0.0125,
  "revisi": 18,
  "variasiKecepatanMengetik": 0.42,
  "humanRhythmScore": 81,
  "hashIntegritas": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85",
  "catatan": "Metadata numerik saja. Tidak memuat isi/kutipan konten dokumen."
}
```

> Note: field names remain in Indonesian in the actual JSON output (`durasiDetik`, `totalSampel`, etc.) to stay consistent with the product's primary language. The table below gives the English meaning of each field.

| Field | Type | Meaning | Source |
|---|---|---|---|
| `durasiDetik` | number | Total active session duration in seconds (excludes paused time) | `elapsedBeforePause / 1000` |
| `totalSampel` | number | How many times the system measured the document's length | `state.samples` |
| `intervalAktif` | number | How many times the document's length actually changed | `state.edits.length` |
| `jedaTerdeteksi` | number | How many pauses of ≥ 4 seconds without change occurred | `state.pauses.length` |
| `rataRataJedaMs` | number | Average pause duration | `avg(state.pauses)` |
| `lonjakanMendadak` | number | How many times the length changed by more than 40 characters in one interval | `state.bursts` |
| `rasioLonjakan` | number | `bursts / totalEdits`, range 0–1 | computed |
| `revisi` | number | How many times the document length decreased (deletion/rework) | `state.revisions` |
| `variasiKecepatanMengetik` | number | Coefficient of variation of positive deltas | computed, see Chapter 7 |
| `humanRhythmScore` | number | Final score, 0–100 | see Chapter 7 |
| `hashIntegritas` | string (hex) | SHA-256 of the entire payload (before this hash field is added) | Web Crypto API |

---

## 7. Human Rhythm Score Methodology — Full Scoring Reference

### 7.1 Conceptual Basis

This score draws on the general principles of **keystroke dynamics / behavioral biometrics** — a field long used in security research (e.g. identity verification via typing patterns) that shows humans have naturally **non-constant** rhythmic patterns: typing speed varies, thinking pauses occur irregularly, and there is rework behavior (backspacing, sentence revisions). By contrast, content pasted from another source (including copy-pasted AI-generated output) shows up as an **instant jump in text length** — not a gradual process.

> **Important honesty note for users/clients:** this is a **heuristic**, not a trained machine-learning model or a scientific study specifically validated for this use case. The formula is designed around *general principles* of keystroke dynamics, adapted for a hackathon MVP context. This score should be positioned as **supporting evidence**, not absolute forensic proof — this is explicitly stated in the UI (`ca-score-label`) and in every generated certificate.

### 7.2 The Four Scoring Factors

The score starts from a **baseline of 70**, then is adjusted by 4 factors:

#### Factor 1 — Sudden Burst Ratio (`burstRatio`)
```
burstRatio = number_of_intervals_with_|delta|>40_chars / total_active_intervals
score -= min(45, burstRatio * 100 * 0.6)
```
- **Why 40 characters?** This threshold was chosen because normal manual typing within one interval (1.2 seconds) typically produces a few words (~5–15 characters). A burst of >40 characters in 1.2 seconds far exceeds normal human typing speed (~40–60 WPM ≈ 4–6 characters/second), making it a strong indicator of a paste/instant insert.
- **Why cap the penalty at 45?** This is capped so that a single factor cannot drag the score all the way to zero on its own — reflecting the fact that bursts can also have legitimate causes (pasting one's own quote, pasting from another draft file), so it is not treated as 100% proof of cheating.

#### Factor 2 — Typing Speed Variation (`typingSpeedCv`)
```
cv = stdev(positive_deltas) / mean(positive_deltas)
if positive_sample_count >= 4:
    if cv < 0.15  → score -= 15   (too uniform/mechanical)
    if cv > 0.30  → score += 10   (natural variation)
```
- **Why Coefficient of Variation (CV)?** CV (std/mean) is used instead of raw standard deviation because CV is scale-independent — suitable for comparing "relative uniformity" regardless of whether the user types fast or slow overall.
- **Why the 0.15 and 0.30 thresholds?** These are **initial heuristic values (rules of thumb)**, not the result of formal statistical calibration against a large dataset — chosen so that low variation (below 15% of the mean) is treated as "too mechanical," and high variation (above 30%) is treated as "very human." This value is the first candidate that **must be recalibrated** with real data before being claimed as accurate (see [Limitations](#12-known-limitations--risks)).

#### Factor 3 — Thinking Pause Pattern
```
if session_duration > 5 minutes AND pause_count == 0:
    score -= 15   (suspicious: a long session with zero pauses at all)
otherwise, if there are pauses:
    score += min(10, pauseCv * 10)
```
- **Why is zero pauses in a long session suspicious?** Manual creative work (writing/illustrating) naturally involves moments of stopping to think, check references, etc. A session longer than 5 minutes with not a single pause ≥4 seconds is an unusual pattern for manual creative work.
- **`pauseCv`** is computed the same way as in Factor 2, but for pause durations — pauses that vary (sometimes short, sometimes long) are considered more natural than perfectly uniform pauses.

#### Factor 4 — Revisions/Deletions
```
if revisions > 0:
    score += min(10, revisions * 1.5)
```
- **Why do revisions raise the score?** Manual creative work is rarely linear — humans delete, retype, and rephrase. This is one of the strongest signals of "rethinking" behavior, which is difficult to replicate with a single one-time paste action.

### 7.3 Final Formula

```js
score = clamp(0, 100, round(
  70
  - min(45, burstRatio * 60)
  ± (typing speed variation penalty/bonus)
  ± (pause pattern penalty/bonus)
  + min(10, revisions * 1.5)
))
```

### 7.4 Score Interpretation (shown to the user)

| Range | Color | Label |
|---|---|---|
| 75–100 | Green (`#2f7a4f`) | "Work pattern is consistent with a gradual manual process." |
| 50–74 | Amber (`#b4762b`) | "Work pattern is fairly normal, with a few sudden bursts." |
| 0–49 | Red (`#a5432b`) | "Unusual work pattern — needs manual review." |

Every label ends with the phrase: *"(indicative, not absolute forensic proof)"* — this is intentional, part of the product's commitment to not overclaim.

---

## 8. Process Certificate & Hash Integrity

- **Hash**: computed with `crypto.subtle.digest("SHA-256", ...)` (the browser's built-in Web Crypto API, no external library) over the entire payload content (as a JSON string) **before** the hash field itself is added to the object.
- **The hash here is not a blockchain/public timestamp** — it only proves that the certificate JSON's contents **were not modified after creation** (a local integrity check), not that the certificate was created at a specific time verifiable by an independent third party. For non-repudiable time proof, see the planned **Timestamp Ledger** in the [Roadmap](#14-development-roadmap).
- The certificate can be exported as:
  1. **A JSON file** (via `downloadCertificate()`) — suitable for attaching to an email/dispute ticket.
  2. **A paragraph inside the Word document** (via `insertCertificateIntoDoc()`) — suitable for making the certificate part of the artwork file itself, using a small `Courier New` font to clearly distinguish it from the actual creative content.

---

## 9. Function Reference (`taskpane.js`)

| Function | Responsibility |
|---|---|
| `Office.onReady(...)` | Add-in entry point; registers all button event listeners once Word is ready. |
| `startRecording()` | Resets state for a new session, starts the polling `setInterval` (1200ms) and the UI timer (250ms). |
| `togglePause()` | Pauses/resumes polling without resetting data; accumulates into `elapsedBeforePause`. |
| `stopRecording()` | Stops all intervals, locks status to "finished," calls `computeAndRenderScore()`. |
| `resetSession()` | Wipes the entire `state`, returns the whole UI to its initial condition. |
| `pollDocument()` | The only function that touches document content. Reads `range.text.length`, immediately discards the string (`range.text = null`), passes the number to `handleLengthSample()`. |
| `handleLengthSample(len)` | Compares the new length to the previous one → updates `edits[]`, `pauses[]`, `bursts`, `revisions`. |
| `setStatus(kind, text)` | Updates the status dot indicator (idle/recording/paused) and its text. |
| `toggleButtons({...})` | Sets `disabled` on buttons according to the current workflow phase. |
| `updateTimer()` | Renders `elapsedBeforePause` plus the currently running time as `HH:MM:SS`. |
| `updateMetricsUI()` | Renders the samples/edits/pauses/bursts numbers onto the metric cards. |
| `drawActivity()` | Draws the activity bar chart (last 60 edits) onto the `<canvas>`, using distinct colors for bursts (red), revisions (brown), and normal edits (navy). |
| `computeAndRenderScore()` | Wrapper: calls `computeMetrics()` then `renderScore()`. |
| `computeMetrics()` | Computes all statistics and the final score (see Chapter 7). |
| `renderScore(metrics)` | Renders the score number, color, and interpretation label to the UI. |
| `avg(arr)` / `stdev(arr, mean)` | Basic statistics utilities (mean, population standard deviation). |
| `generateCertificate()` | Assembles the `payload`, computes `sha256Hex`, stores it in `state.lastCertificate`, shows the preview. |
| `renderCertificatePreview(payload)` | Renders the certificate's definition list (`<dl>`) into the UI card. |
| `formatDuration(totalSec)` | Formats seconds into `"Xj Ym Zd"` (hours/minutes/seconds, Indonesian labels). |
| `sha256Hex(message)` | Computes SHA-256 using the Web Crypto API, returns a hex string. |
| `downloadCertificate()` | Creates a JSON `Blob`, triggers a download of `sertifikat-proses-<timestamp>.json`. |
| `insertCertificateIntoDoc()` | Uses `Word.run` to insert a certificate summary as paragraphs at the end of the document. |

### Configuration Constants

| Constant | Value | Meaning | How changing it affects behavior |
|---|---|---|---|
| `POLL_MS` | 1200 | Document-length polling frequency (ms) | A smaller value = finer resolution but more `Word.run` calls (potential performance overhead). |
| `PAUSE_THRESHOLD_MS` | 4000 | A gap without change ≥ this is considered a "thinking pause" | Raise it if you only want long breaks (e.g. coffee breaks) to be logged; lower it to capture micro-pauses. |
| `BURST_CHAR_THRESHOLD` | 40 | A length delta greater than this in one interval = a "sudden burst" | Tune this to the target user's average typing speed (see Factor 1, Chapter 7.2). |

---

## 10. Manifest Reference (`manifest.xml`)

| Element | Function |
|---|---|
| `<Id>` | The add-in's unique UUID — a permanent identity, must not change after publishing. |
| `<Version>` | The add-in's version, used for updates/cache-busting on the Office side. |
| `<DefaultLocale>` | `id-ID` — the add-in's default language matches the product's primary language (Indonesian). |
| `<IconUrl>` / `<HighResIconUrl>` | Icons shown in the Office add-in gallery. |
| `<AppDomains>` | The list of domains the add-in is allowed to navigate to/communicate with (currently only `localhost:3000` for dev). |
| `<Hosts><Host Name="Document" /></Hosts>` | Declares this add-in is for **Word** (`Document` = Word in the Office Add-in schema). |
| `<Permissions>ReadWriteDocument</Permissions>` | The minimum permission required: read (for length polling) and write (for `insertCertificateIntoDoc`). Deliberately does not request a higher permission level. |
| `<ExtensionPoint xsi:type="PrimaryCommandSurface">` | Adds a new button group named **Creative Alibi** to the **Home** ribbon tab. |
| `<Control xsi:type="Button" id="CreativeAlibi.TaskpaneButton">` | The "Rekam Proses" ribbon button that opens the task pane. |
| `<Resources>` | The collection of strings and images referenced by the elements above (additional languages can be added here later). |

---

## 11. Privacy & Security

1. **No backend.** All code runs client-side (inside the Word task pane). No server receives user data.
2. **No content storage.** The `pollDocument()` function is the only point that reads `range.text`, and the very next line immediately sets `range.text = null` before any other function is called. There is no `console.log(range.text)`, no writing to `localStorage`/`sessionStorage`/files, and no network transmission of content.
3. **No persistence at all** — even the metadata (numbers) disappears once the task pane is closed/reset, unless the user explicitly clicks "Download JSON" or "Insert into Document."
4. **The hash is one-way** — `hashIntegritas` cannot be reversed to reconstruct document content; it is only a checksum of the numeric metadata itself.
5. **Minimal manifest permissions** — only `ReadWriteDocument`, with no request for file system, network, or other-document access.

---

## 12. Known Limitations & Risks

- **The thresholds (40 characters, CV 0.15/0.30, 4-second pause) are initial heuristic values**, not yet calibrated with real user studies. For stronger production claims, it is recommended to collect real session data (with consent) and statistically recalibrate these thresholds.
- **The 1.2-second polling resolution** means very fast changes (e.g. two small bursts within <1.2 seconds) can merge into a single large delta — potentially misclassified as a "sudden burst" when it was actually two rapid, sequential manual actions.
- **The score can be deliberately gamed** by a user who knows the formula (e.g. intentionally inserting fake pauses, typing slowly with artificial variation). This is not a manipulation-resistant anti-cheat system — it is suited for good-faith use cases, not high-stakes adversarial environments.
- **Does not distinguish copy-pasting from within the same document** (e.g. duplicating one's own paragraph) from external pastes — both are equally logged as "sudden bursts."
- **Multi-window/multi-device**: if the user opens the same document in more than one window/task pane simultaneously, the recording session is not synchronized between windows (state is local to each task pane instance).
- **Depends on Word staying open with the task pane active** — if Word/the task pane is closed mid-session without clicking "Stop," any session data for which a certificate hasn't been generated yet will be lost (consistent with the "no persistent storage" privacy principle, but a trade-off the user should be aware of).

---

## 13. Installation, Build, and Deployment

See `README.md` for the quick steps. Additional technical summary:

- **Dev**: `npm start` runs `office-addin-debugging start manifest.xml`, which internally triggers the `dev-server` (webpack-dev-server with a local HTTPS certificate from `office-addin-dev-certs`) and automatically sideloads the manifest into Word.
- **Production build**: `npm run build` → `webpack --mode production` → produces a `dist/` folder containing `taskpane.html`, a minified `taskpane.js`, `assets/`, and a copy of `manifest.xml`.
- **Deployment**: `dist/` needs to be hosted on an HTTPS server (Azure Static Web Apps, SharePoint, or other static hosting). After that, **every `https://localhost:3000` URL in `manifest.xml` must be replaced with the production hosting domain** before distributing it as an official add-in — whether via manual sideload, AppSource, or centralized deployment through the Microsoft 365 admin center.
- **Manifest validation**: `npm run validate` runs `office-addin-manifest validate manifest.xml` to check the XML schema before publishing.

---

## 14. Development Roadmap

Ordered by what makes sense to tackle next after this MVP:

1. **Timestamp Ledger (Idea 3 from the brainstorming session, not yet implemented)** — send `hashIntegritas` to a public timestamping service (e.g. OpenTimestamps, or anchor it to a lightweight blockchain) at every milestone (not just at the end), so the certificate's creation time can be verified by an independent party rather than merely claimed unilaterally.
2. **Calibrate scoring thresholds with real data** — collect real sessions (with explicit consent from creators, still without recording content) to replace the heuristic values (40 characters, CV 0.15/0.30, etc.) with statistically validated thresholds.
3. **Short replay video** — as envisioned in the original Prototype stage, build a replay visualization from the delta data (an animated chart, not a screen recording of content) as a supplement to the certificate that's easier for a lay client to digest.
4. **Procreate/Photoshop support** — the target persona is also a vector illustrator; a similar add-in/plugin for design software would expand the product's reach in line with the Empathize research.
5. **Public verification server** — an independent endpoint (outside the creator's control) where a client/platform can check a hash's validity without having to trust the creator's unilateral claim.
6. **Stamped PDF export** — in addition to JSON, add an option to print the certificate as a PDF with a formal layout for legal/formal needs.
7. **Full UI bilingual support** — the UI is currently Indonesian-only; add an EN/ID toggle in the task pane (this documentation being bilingual is a first step in that direction).

---

## 15. Glossary

| Term | Explanation |
|---|---|
| **Metadata** | Data *about* the work process (text length, time, number of changes) — not the content/substance of the work itself. |
| **Delta** | The difference in text length between one measurement (poll) and the previous one. Can be positive (addition) or negative (deletion). |
| **Burst / Sudden burst** | A delta with a large absolute value (>40 characters) within one polling interval — an indicator of a possible paste/instant insert. |
| **Coefficient of Variation (CV)** | The statistical measure `stdev / mean`, used to assess how "uniform" or "varied" a pattern is relative to its own scale. |
| **Human Rhythm Score** | A 0–100 heuristic score combining burst ratio, typing speed variation, pause pattern, and revision count. |
| **Hash Integrity** | The SHA-256 value of the certificate's contents, used to prove the file was not altered after creation (not third-party time proof). |
| **Task Pane** | The side panel in Word where the add-in's UI is rendered (HTML/CSS/JS inside an Office-controlled iframe). |
| **Office.js** | Microsoft's official JavaScript API for interacting with Office documents (Word, Excel, etc.) from a task pane/add-in. |
| **Manifest** | The XML file (`manifest.xml`) that describes the add-in to Office: name, icon, permissions, UI location. |
| **Sideload** | The process of installing an add-in manually/locally (not via AppSource) for development/testing purposes. |
