# Creative Alibi — Entity Relationship Diagram

> **Version:** 2.0.0  
> **Last Updated:** 2026-07-12

---

## 1. Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CREATIVE ALIBI — DATA MODEL (In-Memory)                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  All session data lives in browser memory (JavaScript object).      │     │
│  │  No data is persisted to disk or sent to any server unless the       │     │
│  │  user explicitly enables Layer 3 and provides consent.               │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌──────────────────────┐                                                    │
│  │        SESSION       │ ◄────── Root object, 1 per recording              │
│  │──────────────────────│                                                    │
│  │ PK id: UUID          │                                                    │
│  │──────────────────────│                                                    │
│  │ startedAt: timestamp │                                                    │
│  │ running: boolean     │                                                    │
│  │ paused: boolean      │                                                    │
│  │ elapsedBeforePause:  │                                                    │
│  │   durationMs         │                                                    │
│  │ lastLen: int|null    │                                                    │
│  │ lastChangeAt:        │                                                    │
│  │   timestamp|null     │                                                    │
│  │ textAtStop: string   │                                                    │
│  │──────────────────────│                                                    │
│  │ + start()            │                                                    │
│  │ + pause()            │                                                    │
│  │ + stop()             │                                                    │
│  │ + reset()            │                                                    │
│  └──────┬───────────────┘                                                    │
│         │                                                                    │
│    ┌────┴───────────────────────────────────────────────┐                   │
│    │                                                    │                    │
│    ▼ 1..*                                               ▼ 1                   │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌───────────────────┐ │
│  │   BEHAVIORAL_SAMPLE  │  │    LINGUISTIC_METRIC  │  │ CERTIFICATE       │ │
│  │──────────────────────│  │───────────────────────│  │───────────────────│ │
│  │ #: edits[]           │  │ PK type: string       │  │ PK createdAt: ts  │ │
│  │──────────────────────│  │───────────────────────│  │───────────────────│ │
│  │ timestamp: epoch     │  │ score: 0-100          │  │ hashIntegritas:   │ │
│  │ delta: int           │  │ label: string         │  │   sha256          │ │
│  │ isBurst: boolean     │  │ description: text     │  │ forensicScore:    │ │
│  │ isRevision: boolean  │  │ weight: float (0-1)   │  │   0-100           │ │
│  │ pauseMs: int (0)     │  │ confidence: HIGH|     │  │ confidenceLevel:  │ │
│  │ textLength: int      │  │   MEDIUM|LOW|NONE     │  │   enum            │ │
│  └──────────────────────┘  └───────────────────────┘  │ layerScores: json  │ │
│                                                       │ agreement: enum    │ │
│                                                       │ verdict: enum      │ │
│                                                       │────────────────────│ │
│                                                       │ + generate()       │ │
│                                                       │ + download()       │ │
│                                                       │ + insertToDocument()│ │
│                                                       └────────┬──────────┘ │
│                                                                │            │
│                                                                │ 1           │
│                                                                ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DETECTION_RESULT (L3)                           │   │
│  │─────────────────────────────────────────────────────────────────────│   │
│  │ provider: enum [desklib|watsonx|gptzero|zerogpt|hix]               │   │
│  │ available: boolean                                                  │   │
│  │ score: 0-100                                                       │   │
│  │ status: string                                                     │   │
│  │ message: string                                                    │   │
│  │ fromCache: boolean                                                 │   │
│  │ timestamp: timestamp                                               │   │
│  │ details: object {                                                  │   │
│  │   provider: string,                                                │   │
│  │   aiProbability: float,                                            │   │
│  │   humanProbability: float,                                         │   │
│  │   label: string,                                                   │   │
│  │   isAiGenerated: boolean,                                          │   │
│  │   processingTimeMs: int,                                           │   │
│  │   source: local|cloud,                                             │   │
│  │   raw: object (provider-specific)                                  │   │
│  │ }                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    FORENSIC_RESULT (Computed)                          │  │
│  │──────────────────────────────────────────────────────────────────────│  │
│  │ score: 0-100 (weighted avg)                                          │  │
│  │ activeLayers: int (1-3)                                              │  │
│  │ totalLayers: 3                                                       │  │
│  │ layers: [{id, name, score, available, icon}]                         │  │
│  │ layerDetails: { behavioral, linguistic, api }                        │  │
│  │ weights: { behavioral: 0-1, linguistic: 0-1, api: 0-1 }             │  │
│  │ confidenceLevel: { level: enum, label, color }                       │  │
│  │ agreement: { agreementLevel: STRONG|MODERATE|WEAK|N/A, maxDiff,      │  │
│  │              allSameZone, description }                              │  │
│  │ interpretation: { color, label, verdict: enum, icon }                │  │
│  │ timestamp: timestamp                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity Definitions

### 2.1 Session

The **root entity** for a single recording session. Created when user clicks "Mulai Rekam", destroyed on reset.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID (implied) | — | Unique session identity |
| `running` | boolean | `false` | Whether session is actively polling |
| `paused` | boolean | `false` | Whether session is paused by user |
| `startedAt` | timestamp \| null | `null` | When current (or last unpaused) recording started |
| `elapsedBeforePause` | number | `0` | Accumulated ms from before last pause |
| `lastLen` | number \| null | `null` | Previous document length (for delta calc) |
| `lastChangeAt` | timestamp \| null | `null` | Timestamp of last detected change |
| `samples` | number | `0` | Total polls made |
| `edits` | `BehavioralSample[]` | `[]` | Array of all edit samples |
| `pauses` | number[] | `[]` | Array of pause durations (ms) |
| `bursts` | number | `0` | Count of edits > 40 chars |
| `revisions` | number | `0` | Count of negative deltas |
| `pollHandle` | interval ID | `null` | Active `setInterval` handle for polling |
| `timerHandle` | interval ID | `null` | Active `setInterval` handle for timer |
| `textAtStop` | string | `""` | Full document text captured at stop |
| `l1Score` | number \| null | `null` | Computed L1 Behavioral score |
| `l2Result` | object \| null | `null` | L2 Linguistic analysis result |
| `l3Result` | object \| null | `null` | L3 API detection result |
| `forensicResult` | object \| null | `null` | Final ensemble forensic result |
| `certificate` | object \| null | `null` | Generated certificate payload |

**Relationships:**
- `Session` **has many** `BehavioralSample` (1:N via `edits[]`)
- `Session` **has many** `LinguisticMetric` (1:N via `l2Result.metrics`)
- `Session` **has one** `DetectionResult` (1:1 via `l3Result`)
- `Session` **has one** `ForensicResult` (1:1 via `forensicResult`)
- `Session` **has one** `Certificate` (1:1 via `certificate`)

### 2.2 BehavioralSample

A single data point captured during the 1.2-second polling cycle.

| Field | Type | Description |
|-------|------|-------------|
| `t` | timestamp | Epoch ms when sample was taken |
| `delta` | integer | Change in character count (positive = typing, negative = deletion) |
| `isBurst` | boolean | `delta > 40` → probable copy-paste |
| `isRevision` | boolean | `delta < 0` → deletion/revision |
| `pauseMs` | integer | Milliseconds since last change before this sample |
| `textLength` | integer | Current total document length |

**Derived Behavioral Metrics:**

| Metric | Formula |
|--------|---------|
| Burst Ratio | `bursts / totalEdits` |
| Edit Rate | `totalEdits / durationSeconds` |
| Pause Mean | `sum(pauses) / pauses.length` |
| Revision Density | `revisions / totalEdits` |

### 2.3 LinguisticMetric

One of 8 linguistic analysis metrics computed from the stopped document text.

| Field | Type | Description |
|-------|------|-------------|
| `type` | string (key) | Metric identifier: `sentenceBurstiness`, `vocabularyRichness`, `hapaxRatio`, `sentenceStarterDiv`, `connectiveOveruse`, `zipfCompliance`, `repetitiveNgrams`, `paragraphUniformity` |
| `score` | number (0–100) | Computed metric score (-1 if insufficient data) |
| `label` | string | Human-readable name (e.g., "Variasi Panjang Kalimat") |
| `description` | string | Explanation of what the metric measures |
| `weight` | float (0–1) | Default weight in the 8-metric ensemble (`sum = 1.0`) |

**Relationships:**
- 8 `LinguisticMetric` entries belong to 1 `Session`

### 2.4 DetectionResult

Result from a single external API detection call (Layer 3).

| Field | Type | Description |
|-------|------|-------------|
| `available` | boolean | Whether detection succeeded |
| `score` | number (0–100) | Normalized human-likelihood score (-1 on failure) |
| `status` | string | Status code: `OK`, `USER_NO_CONSENT`, `NO_PROVIDER`, `TEXT_TOO_SHORT`, `API_ERROR`, `NETWORK_ERROR`, `UNKNOWN_ERROR` |
| `message` | string | Human-readable status message |
| `fromCache` | boolean | Whether result came from SHA-256 cache |
| `timestamp` | timestamp | When detection was performed |
| `details.provider` | string | Provider display name (e.g., "Desklib (RAID #1)") |
| `details.aiProbability` | float (0–1) | Raw AI probability from provider |
| `details.humanProbability` | float (0–1) | Raw human probability |
| `details.label` | number \| null | Classification label (0=human, 1=AI) |
| `details.isAiGenerated` | boolean \| null | Binary flag from provider |
| `details.processingTimeMs` | number | Wall-clock time for API call |
| `details.source` | "local" \| "cloud" | Whether proxy target is local or Cloud Run |
| `details.raw` | object | Original provider response (for audit) |

### 2.5 ForensicResult

The computed ensemble result combining all active layers.

| Field | Type | Description |
|-------|------|-------------|
| `score` | number (0–100) | Weighted average of all active layer scores |
| `activeLayers` | int (0–3) | How many layers contributed |
| `totalLayers` | 3 | Total possible layers |
| `layers[]` | array | Array of `{id, name, score, available, icon}` |
| `layerDetails` | object | Detailed breakdown per layer |
| `weights` | object | Dynamic weights applied (sum = 1.0) |
| `confidenceLevel.level` | enum | `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`, `REVIEW`, `NONE` |
| `agreement.agreementLevel` | enum | `STRONG`, `MODERATE`, `WEAK`, `N/A` |
| `interpretation.verdict` | enum | `HUMAN_VERIFIED`, `HUMAN_LIKELY`, `MIXED`, `AI_LIKELY`, `AI_DETECTED`, `UNKNOWN` |
| `timestamp` | string (ISO 8601) | When analysis was completed |

### 2.6 Certificate

The final output — a cryptographically signed JSON document.

| Field | Type | Description |
|-------|------|-------------|
| `dokumen` | string | "Sertifikat Forensik — Creative Alibi v2.0" |
| `versi` | string | "2.0.0" |
| `dibuat` | string | ISO 8601 timestamp of generation |
| `forensicConfidenceScore` | int (0–100) | Final ensemble score |
| `tingkatKepercayaan` | string | Confidence level label |
| `verdict` | string | Verdict enum value |
| `verdictLabel` | string | Full verdict description |
| `layerAktif` | int | Number of active layers |
| `totalLayer` | int (3) | Total layers |
| `bobotLayer` | object | The weights used (e.g., `{behavioral: 0.30, ...}`) |
| `behavioral` | object \| null | L1 score + interpretation |
| `linguistic` | object \| null | L2 score + confidence + interpretation |
| `apiDetection` | object \| null | L3 score + provider + interpretation |
| `agreement` | object | Agreement analysis result |
| `metrikPerilaku` | object | Raw behavioral metrics (duration, samples, etc.) |
| `hashIntegritas` | string (hex) | SHA-256 hash of the entire certificate JSON |
| `catatan` | string | Standard disclaimer note |

---

## 3. Relationship Diagram (Crow's Foot Notation)

```
SESSION ──────<╴ BEHAVIORAL_SAMPLE
    │    (1:N)        edits[]
    │
    │────────<╴ LINGUISTIC_METRIC
    │    (1:N)        l2Result.metrics {}
    │
    │────────╴ DETECTION_RESULT
    │    (1:1)         l3Result
    │
    │────────╴ FORENSIC_RESULT
    │    (1:1)         forensicResult
    │
    │────────╴ CERTIFICATE
    │    (1:1)         certificate

Key:
  ╴ = "has"
  <╴ = "has many"
  |  = exactly one
```

## 4. Data Flow Sequence (Per Session)

```
 START
   │
   ▼
 ┌────────────────────────────────────────────────────────────┐
 │ SESSION CREATED                                             │
 │ { running: true, startedAt: now, edits: [], pauses: [] }   │
 └──────────┬─────────────────────────────────────────────────┘
            │
            │ pollDocumentLength() every 1,200ms
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ BEHAVIORAL_SAMPLE CREATED                                   │
 │ { t, delta, isBurst, isRevision, pauseMs, textLength }     │
 │ edits.push(sample)                                         │
 └──────────┬─────────────────────────────────────────────────┘
            │ (repeats until STOP)
            ▼
 STOP ──── fetchDocumentText() ──── textAtStop
            │
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ L1: computeBehavioralScore()                               │
 │ → { score, durationMs, samples, edits, bursts, revisions, │
 │      pauses, pauseMeanMs, burstRatio }                     │
 │ → session.l1Score = score                                  │
 └──────────┬─────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ L2: analyzeLinguistic(textAtStop)                          │
 │ → { available, score, confidence, metrics: { 8 items } }  │
 │ → session.l2Result = result                                │
 └──────────┬─────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ L3: detectWithApi(textAtStop)   ← consent check            │
 │ → { available, score, status, details: { provider, ... } } │
 │ → session.l3Result = result                                │
 └──────────┬─────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ FORENSIC_RESULT COMPUTED                                   │
 │ computeForensicScore({                                     │
 │   behavioralScore: l1Score,                                │
 │   linguisticResult: l2Result,                              │
 │   apiResult: l3Result                                      │
 │ })                                                         │
 │ → { score, activeLayers, weights, confidenceLevel,         │
 │      agreement, interpretation, timestamp }                │
 └──────────┬─────────────────────────────────────────────────┘
            │
            ▼
 ┌────────────────────────────────────────────────────────────┐
 │ CERTIFICATE GENERATED                                      │
 │ generateForensicCertificatePayload(forensicResult, meta)   │
 │ sha256(JSON.stringify(cert)) → hashIntegritas             │
 │ → certificate ready for download or document insert       │
 └────────────────────────────────────────────────────────────┘
```

---

## 5. Cache Entity (API Result Cache)

Stored in a JavaScript `Map` (browser memory) with LRU eviction.

| Key | Value | Max Size | Eviction |
|-----|-------|----------|----------|
| SHA-256(text) | `DetectionResult` | 20 entries | Oldest entry removed when full |

**Purpose:** Avoid sending identical text to external APIs twice in the same session.

---

## 6. Configuration Entity

A separate non-session object with persistent UI state.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `l2Enabled` | boolean | `true` | Enable Layer 2 linguistic analysis |
| `l3Enabled` | boolean | `false` | Enable Layer 3 external API detection |
| `l3Provider` | string | `"gptzero"` | Chosen API provider (falls back to desklib) |
| `l3Proxy` | string | `"https://creative-alibi-994794168239.asia-southeast2.run.app"` | Backend proxy URL |
| `l3Consent` | boolean | `false` | User has consented to send text to API |

---

## 7. Relationships Summary Table

| Entity | Parent | Cardinality | Bidirectional |
|--------|--------|-------------|---------------|
| BehavioralSample | Session | N:1 | No (owned array) |
| LinguisticMetric | Session | 8:1 | No (owned object) |
| DetectionResult | Session | 1:1 | No (owned) |
| ForensicResult | Session | 1:1 | No (derived) |
| Certificate | ForensicResult | 1:1 | No (derived) |
| Config | — | Singleton | N/A |

> **Note:** All entities are purely **in-memory** within the browser task pane. There is no database, no server-side persistence, and no data retention after the session is reset or the browser tab is closed. The only persistent artifacts are certificate `.json` files explicitly downloaded by the user or inserted into their Word document.
