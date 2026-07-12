# Creative Alibi — Workflow & Data Flow Documentation

> **Version:** 2.0.0  
> **Last Updated:** 2026-07-12

---

## Table of Contents

1. [User Workflow](#1-user-workflow)
2. [Recording Data Flow](#2-recording-data-flow)
3. [Forensic Analysis Flow](#3-forensic-analysis-flow)
4. [API Request Flow](#4-api-request-flow)
5. [Certificate Generation Flow](#5-certificate-generation-flow)
6. [Deployment Workflow](#6-deployment-workflow)
7. [Error Handling Flows](#7-error-handling-flows)
8. [Cross-Layer Agreement Flow](#8-cross-layer-agreement-flow)

---

## 1. User Workflow

### 1.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREATIVE ALIBI — USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌───────────┐    ┌──────────┐    ┌────────────────────┐    │
│  │  OPEN   │    │  CONFIGURE │    │  RECORD  │    │  STOP & ANALYZE    │    │
│  │  WORD   │───▶│  SETTINGS  │───▶│  SESSION │───▶│  (Auto)            │    │
│  │         │    │            │    │          │    │                    │    │
│  └─────────┘    └───────────┘    └──────────┘    └────────┬───────────┘    │
│                                                            │                 │
│                  ┌─────────────────────────────────────────┘                 │
│                  ▼                                                          │
│  ┌────────────────────────────┐    ┌──────────────────────┐                │
│  │  REVIEW FORENSIC DASHBOARD │    │  GENERATE CERTIFICATE │                │
│  │                            │────▶│                      │                │
│  │  • Ring gauge score       │    │  • SHA-256 hash      │                │
│  │  • Layer breakdown        │    │  • Preview in panel  │                │
│  │  • Linguistic metrics     │    │                      │                │
│  │  • Verdict + agreement    │    └──────────┬───────────┘                │
│  └────────────────────────────┘               │                            │
│                                                │                            │
│                        ┌───────────────────────┴───────────────┐           │
│                        ▼                                       ▼          │
│              ┌───────────────────┐                  ┌──────────────────┐  │
│              │  DOWNLOAD .JSON   │                  │  INSERT INTO     │  │
│              │  CERTIFICATE      │                  │  WORD DOCUMENT   │  │
│              │                   │                  │                  │  │
│              └───────────────────┘                  └──────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Step-by-Step User Interaction

#### Phase 1: Setup

```
User Action                               System Response
────────────                               ───────────────
1. Open Microsoft Word                     ──
2. Open Add-in → Home tab →               Task pane opens showing
   "Creative Alibi" group                   Recording / Forensic / About tabs
3. Click "Rekam Proses" button            Default "Record" tab active
   (or task pane auto-opens)               Status: "Siap Merekam" (idle)
                                           Timer: 00:00:00
4. (Optional) Click ⚙️ Settings            Settings overlay opens:
                                           ☑ Layer 2 (Linguistic) [ON]
                                           ☐ Layer 3 (External API) [OFF]
                                              Provider: [dropdown]
                                              Proxy URL: [input]
                                              ☐ Saya setuju mengirim teks
5. Configure settings → Close             Settings applied, state updated
```

#### Phase 2: Recording

```
User Action                               System Response
────────────                               ───────────────
6. Click "Mulai Rekam"                     Status → "Sedang Merekam" (green dot)
                                           Timer starts counting up
                                           Polling begins (every 1.2s)
                                           Activity canvas shows real-time bars

7. Begin typing naturally                  Each poll detects delta:
                                           • Typing → edits++, sample++
                                           • Character change > 40 → bursts++
                                           • Pause ≥ 4s → pauses++
                                           • Delete text → revisions++

8. (Optional) Click "Jeda"                 Polling pauses, timer freezes
   (phone call, interruption)              Status → "Dijeda" (yellow dot)
                                           Button changes to "Lanjutkan"

9. (Optional) Click "Lanjutkan"            Polling resumes, timer continues
                                           New startedAt timestamp

10. Continue typing / editing              Samples continue accumulating

11. Click "Berhenti"                       1. Polling stops
                                           2. Timer stops
                                           3. Document text fetched via Word API
                                           4. Forensic analysis auto-triggers
                                           5. Switch to "Forensic" tab
```

#### Phase 3: Results & Certificate

```
User Action                               System Response
────────────                               ───────────────
12. View Forensic Dashboard                Shows:
                                           • Ring gauge: Forensic Score 0-100
                                           • Layer 1: Behavioral Score
                                           • Layer 2: Linguistic Score
                                           • Layer 3: API Score (if enabled)
                                           • Verdict badge (color-coded)
                                           • Agreement bar
                                           • Confidence level

13. (If L2 active) Review Linguistic       Bar chart of 8 metrics:
    Breakdown card                          • Sentence Burstiness
                                           • Vocabulary Richness
                                           • Hapax Legomena
                                           • Sentence Starter Diversity
                                           • Connective Overuse
                                           • Zipf Compliance
                                           • Repetitive N-grams
                                           • Paragraph Uniformity

14. Click "Buat Sertifikat"                Certificate preview appears:
                                           • Timestamp
                                           • Session duration
                                           • All layer scores
                                           • SHA-256 hash
                                           • Buttons enabled: Download, Insert

15a. Click "Download"                      Browser downloads .json file
                                           Filename: ca-forensic-cert-{ts}.json

15b. (Optional) Click "Sisipkan ke         Certificate text appended to end
     Dokumen"                               of current Word document

16. (Optional) Click "Mulai Ulang"         All data cleared, back to idle state
```

---

## 2. Recording Data Flow

### 2.1 Polling Cycle (L1 Behavioral)

```
Time (ms)           Word Document          Task Pane (Poll)
─────────           ──────────────         ────────────────
T=0                 ──                     startSession()
                                           interval = setInterval(poll, 1200)

T=0+1200            body.text = "Hel"      pollDocumentLength()
                    len = 3                  Word.run() → body.load("text")
                                             handleSample(3)
                                               lastLen = null? → set: 3
                                               return (no delta yet)

T=0+2400            body.text = "Hello,    pollDocumentLength()
                    world. I am writing      handleSample(49)
                    my essay."                delta = 49-3 = 46
                    len = 46                  (> 40? → bursts++)
                                              gap = now - lastChangeAt
                                              (< 4000? → no pause recorded)
                                              edits.push({ t, delta:46 })
                                              revisions? (delta > 0 → no)
                                              lastLen = 46

T=0+3600            body.text = "Hello,    pollDocumentLength()
                    world. I am writing      handleSample(46)
                    my"                       delta = 46-46 = 0
                    len = 46                  (no change, skip)

T=0+4800            body.text = "Hello,    pollDocumentLength()
                    world. I am writing      handleSample(40)
                    my essa"                  delta = 40-46 = -6
                    len = 40                  (< 0 → revisions++)
                                              edits.push({ t, delta:-6 })
                                              lastLen = 40

                    ... (cycles continue) ...

T=stop              Click "Berhenti"         clearInterval(pollHandle)
                                             clearInterval(timerHandle)
                                             fetchDocumentText()
                                             runForensicAnalysis()
```

### 2.2 State Machine

```
         ┌─────────────────────────────────────────────────────────┐
         │                                                         │
         │  ┌─────────┐    start()    ┌───────────┐    pause()    │
         │  │  IDLE   │──────────────▶│ RECORDING │──────────────▶│
         │  │         │               │           │               │
         │  │ "Siap   │               │ "Sedang   │               │
         │  │ Merekam"│               │ Merekam"  │               │
         │  │         │               │           │               │
         │  └────┬────┘               └─────┬─────┘               │
         │       │                          │                      │
         │       │ reset()                  │ resume()             │
         │       │                          │     ┌─────────┐     │
         │       │               ┌──────────┴─────▶│ PAUSED  │     │
         │       │               │                │         │     │
         │       │               │                │ "Dijeda"│     │
         │       │               │                └─────────┘     │
         │       │               │                                 │
         │       │               │ stop()                          │
         │       │               ▼                                 │
         │       │         ┌────────────┐                          │
         │       └─────────│ ANALYZING  │                          │
         │                 │            │                          │
         │                 │ Auto-      │                          │
         │                 │ compute L1 │                          │
         │                 │ + L2 + L3  │                          │
         │                 └──────┬─────┘                          │
         │                        │                                │
         │                        ▼                                │
         │                 ┌──────────────┐                        │
         │                 │  COMPLETE    │── reset() ──▶ IDLE     │
         │                 │              │                        │
         │                 │ Results +    │                        │
         │                 │ Certificate  │                        │
         │                 │ ready        │                        │
         │                 └──────────────┘                        │
         └─────────────────────────────────────────────────────────┘
```

---

## 3. Forensic Analysis Flow

### 3.1 Multi-Layer Analysis Pipeline

```
        ┌─────────────────────────────────────┐
        │  STOP RECORDING                      │
        │  textAtStop = fetchDocumentText()   │
        └────────────┬────────────────────────┘
                     │
        ┌────────────┴────────────────────────┐
        │  L1: Behavioral Score               │
        │  ──────────────────────              │
        │                                     │
        │  Input: session state (edits[],     │
        │         bursts, pauses, revisions,  │
        │         elapsedBeforePause)         │
        │                                     │
        │  Process:                           │
        │  1. baseScore = 70                  │
        │  2. burstPenalty = bursts/edits     │
        │     * 100 * 0.6 (cap at 45)         │
        │  3. revisionBonus = revisions * 1.5 │
        │     (cap at 10)                     │
        │  4. pauseBonus = +5 if pauses > 0   │
        │  5. inactivityPenalty = -15 if      │
        │     >5min and 0 pauses              │
        │  6. clamp to [0, 100]               │
        │  7. if edits < 5: score = -1        │
        │                                     │
        │  Output: { score, durationMs,       │
        │    totalSamples, totalEdits,        │
        │    bursts, burstRatio, revisions,   │
        │    pauses, pauseMeanMs }            │
        └────────────────┬────────────────────┘
                         │
        ┌────────────────┴────────────────────┐
        │  [Gate] Is L2 Enabled?              │
        │  config.l2Enabled                   │
        └────────────────┬────────────────────┘
                         │
              ┌──────────┴──────────┐
              │ YES                 │ NO
              ▼                     ▼
 ┌──────────────────────┐  ┌────────────────────┐
 │ L2: Linguistic Score  │  │ L2: Skipped        │
 │ ───────────────────── │  │ l2Result = null    │
 │                       │  └────────────────────┘
 │ Input: textAtStop     │
 │                       │
 │ Process:              │
 │ 1. tokenize(text)     │
 │ 2. splitSentences()   │
 │ 3. splitParagraphs()  │
 │ 4. For each of 8     │
 │    metrics:           │
 │    - Compute score    │
 │      (0-100 or -1)   │
 │    - Filter invalid   │
 │    - Weight:          │
 │      bursty: 0.15     │
 │      vocab: 0.15      │
 │      hapax: 0.10      │
 │      starter: 0.10    │
 │      conn: 0.15       │
 │      zipf: 0.10       │
 │      ngram: 0.15      │
 │      para: 0.10       │
 │ 5. score = weighted   │
 │    average / totalWt  │
 │                       │
 │ Output: { available,  │
 │   score, confidence,  │
 │   metrics: { 8 },     │
 │   wordCount, ... }    │
 └───────────────────────┘
                         │
        ┌────────────────┴────────────────────┐
        │  [Gate] Is L3 Enabled AND           │
        │         Consent Given?              │
        │  config.l3Enabled &&                │
        │  apiStatus.consented               │
        └────────────────┬────────────────────┘
                         │
              ┌──────────┴──────────┐
              │ YES                 │ NO
              ▼                     ▼
 ┌──────────────────────┐  ┌────────────────────┐
 │ L3: API Detection    │  │ L3: Skipped        │
 │ ──────────────────── │  │ l3Result = null    │
 │                      │  └────────────────────┘
 │ Input: textAtStop    │
 │ to proxy/backend     │
 │                      │
 │ Process:             │
 │ 1. Check cache:      │
 │    SHA-256(text)     │
 │    → found? return   │
 │ 2. POST /api/detect  │
 │    { text, provider }│
 │ 3. Normalize result  │
 │    to human score    │
 │    (0-100)           │
 │ 4. Cache result      │
 │                      │
 │ Output: { available, │
 │   score, status,     │
 │   details: {         │
 │     provider,        │
 │     aiProbability,   │
 │     processingTime,  │
 │     ... } }          │
 └───────────────────────┘
                         │
        ┌────────────────┴────────────────────┐
        │  FORENSIC ENSEMBLE ENGINE            │
        │  ──────────────────────────          │
        │                                     │
        │  Input: l1Score, l2Result,          │
        │         l3Result                     │
        │                                     │
        │  computeForensicScore({             │
        │    behavioralScore,                 │
        │    linguisticResult,                │
        │    apiResult                        │
        │  })                                 │
        │                                     │
        │  1. Determine active layers         │
        │  2. determineWeights():             │
        │     - All 3: ↓30/40/30            │
        │     - No API: ↓40/60              │
        │     - L1 only: 100/0/0             │
        │     - Edge cases auto-handled      │
        │  3. weightedAvg = sum(score*weight)│
        │     / totalWeight                   │
        │  4. computeConfidenceLevel():       │
        │     Based on active layers +        │
        │     agreement strength              │
        │  5. computeAgreement():             │
        │     maxDiff = max-min scores        │
        │     zones = [GREEN/YELLOW/RED]      │
        │     STRONG: diff≤15 + same zone    │
        │     MODERATE: diff≤25 or same zone │
        │     WEAK: otherwise                 │
        │  6. interpretForensicScore():      │
        │     Map score + confidence to       │
        │     verdict/color/label            │
        │                                     │
        │  Output: { score, activeLayers,     │
        │    weights, confidenceLevel,        │
        │    agreement, interpretation,       │
        │    layerDetails, timestamp }        │
        └─────────────────────────────────────┘
```

### 3.2 Weight Determination Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DYNAMIC WEIGHT SELECTION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  L1 (Behavioral) │ L2 (Linguistic) │ L3 (API) │ Resulting Weights     │
│  ──────────────  │  ─────────────  │  ─────── │  ─────────────────    │
│                                                                          │
│      ✅ Active   │    ✅ Active    │ ✅ Active│ B:0.30  L:0.40  A:0.30 │
│      ✅ Active   │    ✅ Active    │ ❌ Off   │ B:0.40  L:0.60  A:0.00 │
│      ✅ Active   │    ❌ Off       │ ✅ Active│ B:0.45  L:0.00  A:0.55 │
│      ✅ Active   │    ❌ Off       │ ❌ Off   │ B:1.00  L:0.00  A:0.00 │
│      ❌ Off      │    ✅ Active    │ ✅ Active│ B:0.00  L:0.55  A:0.45 │
│      ❌ Off      │    ✅ Active    │ ❌ Off   │ B:0.00  L:1.00  A:0.00 │
│      ❌ Off      │    ❌ Off       │ ✅ Active│ B:0.00  L:0.00  A:1.00 │
│      ❌ Off      │    ❌ Off       │ ❌ Off   │ B:0.00  L:0.00  A:0.00 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Score Interpretation Table

```
┌────────────┬──────────────────┬──────────┬──────────────┬────────────────────┐
│ Score      │ Verdict          │ Color    │ Confidence   │ Meaning            │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│ 80 - 100   │ HUMAN_VERIFIED   │ 🟢 Green │ VERY_HIGH    │ 3 layers agree:    │
│            │                  │          │              │ strong human       │
│            │                  │          │              │ evidence           │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│ 65 - 79    │ HUMAN_LIKELY     │ 🟢 Green │ HIGH         │ Likely human with  │
│            │                  │          │              │ moderate evidence  │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│ 50 - 64    │ MIXED            │ 🟡 Yellow│ MEDIUM       │ Mixed signals;     │
│            │                  │          │              │ possible partial   │
│            │                  │          │              │ AI assistance      │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│ 30 - 49    │ AI_LIKELY        │ 🟠 Orange│ REVIEW       │ Many AI indicators │
│            │                  │          │              │ detected           │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│  0 - 29    │ AI_DETECTED      │ 🔴 Red   │ HIGH         │ Strong AI pattern  │
│            │                  │          │              │ detected           │
├────────────┼──────────────────┼──────────┼──────────────┼────────────────────┤
│ -1         │ UNKNOWN          │ ⚫ Gray  │ NONE         │ Insufficient data  │
└────────────┴──────────────────┴──────────┴──────────────┴────────────────────┘
```

---

## 4. API Request Flow

### 4.1 End-to-End Detection Request

```
┌─────────────────────────────────────────────────────────────────────────┐
│              API REQUEST FLOW: POST /api/detect                         │
│                                                                          │
│  User clicks "Detect" in Word Add-in (or API client)                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  API CLIENT (Word Add-in / curl / Postman)                       │    │
│  │                                                                   │    │
│  │  POST https://creative-alibi-...run.app/api/detect              │    │
│  │  Headers: Content-Type: application/json                         │    │
│  │           X-API-Key: your-key (optional)                         │    │
│  │  Body: { "provider": "desklib", "text": "..." }                 │    │
│  └────────────────────────────────┬─────────────────────────────────┘    │
│                                   │                                      │
│                                   ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  creative-alibi (Node.js Express)                                │    │
│  │                                                                   │    │
│  │  1. Rate Limiter Check                                           │    │
│  │     → 20 req/min per IP                                          │    │
│  │     → Over limit? Return 429 { error: "Terlalu banyak..." }      │    │
│  │                                                                   │    │
│  │  2. API Key Auth (optional)                                      │    │
│  │     → API_KEY set in env? Check X-API-Key header                │    │
│  │     → Invalid/missing? Return 401/403 { error }                 │    │
│  │                                                                   │    │
│  │  3. Request Validation                                           │    │
│  │     → text is string?                                            │    │
│  │     → text.trim().length >= 50?                                  │    │
│  │     → provider is valid? (desklib/watsonx/gptzero/zerogpt/hix)  │    │
│  │     → Invalid? Return 400 { error: "..." }                      │    │
│  │                                                                   │    │
│  │  4. Route to Provider Handler                                    │    │
│  │     → provider === "desklib" ? desklibHandler(text)              │    │
│  │     → provider === "gptzero" ? gptzeroHandler(text)             │    │
│  │     → provider === "zerogpt" ? zerogptHandler(text)             │    │
│  │     → provider === "watsonx" ? watsonxHandler(text)             │    │
│  │     → provider === "hix" ? hixHandler(text)                     │    │
│  └────────────────────────────────┬─────────────────────────────────┘    │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                       │
│                    ▼                               ▼                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐         │
│  │ desklib (Default)         │  │ Other Providers (External)   │         │
│  │ ────────────────────────  │  │ ───────────────────────────  │         │
│  │                           │  │                              │         │
│  │ Reads DESKLIB_URL env:    │  │ GPTZero → api.gptzero.me    │         │
│  │   http://127.0.0.1:5000  │  │ ZeroGPT → api.zerogpt.com   │         │
│  │     (local Python)        │  │ watsonx → us-south.ml.cloud │         │
│  │   OR Cloud Run URL        │  │ HIX → hixbypass.com         │         │
│  │                           │  │                              │         │
│  │ axios.post({ text,        │  │ (Each has own auth via env  │         │
│  │   threshold: 0.5 })       │  │  variables)                 │         │
│  │ timeout: 60000ms          │  │                              │         │
│  └──────────────┬────────────┘  └──────────────────────────────┘         │
│                 ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  desklib-detector (Python FastAPI - Port 5000)                   │    │
│  │                                                                   │    │
│  │  POST /detect                                                     │    │
│  │  { "text": "...", "threshold": 0.5, "max_length": 768 }          │    │
│  │                                                                   │    │
│  │  1. Validate text.length >= 20                                   │    │
│  │  2. Check model loaded (warm_up already ran at startup)          │    │
│  │  3. Tokenize: DeBERTa-v3 tokenizer, padding, truncation          │    │
│  │  4. Inference:                                                    │    │
│  │     input_ids + attention_mask → DeBERTaV2Model                 │    │
│  │     → last_hidden_state → mean pooling                          │    │
│  │     → Linear(1024, 1) → logit → sigmoid → probability           │    │
│  │  5. Classification: probability >= threshold → AI (1)            │    │
│  │  6. Return { probability, label, is_ai_generated, threshold }   │    │
│  │                                                                   │    │
│  │  Health check endpoint: GET /health                              │    │
│  │  { status: "ok", model: "...", device: "cpu",                   │    │
│  │    model_loaded: true }                                          │    │
│  └──────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Response to Client                                              │    │
│  │                                                                   │    │
│  │  Success:                                                        │    │
│  │  {                                                               │    │
│  │    "success": true,                                              │    │
│  │    "provider": "desklib",                                        │    │
│  │    "model": "desklib/ai-text-detector-v1.01",                    │    │
│  │    "probability": 0.1234,                                        │    │
│  │    "label": 0,                                                   │    │
│  │    "isAiGenerated": false,                                       │    │
│  │    "threshold": 0.5,                                             │    │
│  │    "textLength": 512,                                            │    │
│  │    "processingTimeMs": 2847,                                     │    │
│  │    "source": "cloud"                                             │    │
│  │  }                                                               │    │
│  │                                                                   │    │
│  │  Error (Desklib unreachable):                                    │    │
│  │  {                                                               │    │
│  │    "success": false,                                             │    │
│  │    "provider": "desklib",                                        │    │
│  │    "error": "Python detection service tidak dapat dijangkau...", │    │
│  │    "processingTimeMs": 5002,                                     │    │
│  │    "source": "local",                                            │    │
│  │    "unreachable": true                                           │    │
│  │  }                                                               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Support Chat API Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              API REQUEST FLOW: POST /api/support                        │
│                                                                          │
│  USER                                  SERVER                            │
│  ────                                  ──────                            │
│                                                                          │
│  POST /api/support                                                       │
│  { message: "How do I...",                                               │
│    history: [] }                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌───────────────────────┐                                              │
│  │ Validation             │                                              │
│  │ • message is string   │                                              │
│  │ • message >= 2 chars  │                                              │
│  └──────────┬────────────┘                                              │
│             │                                                            │
│             ▼                                                            │
│  ┌──────────────────────────────────────┐                               │
│  │ OpenRouter API Call                  │                               │
│  │                                      │                               │
│  │ POST https://openrouter.ai/api/v1/   │                               │
│  │   chat/completions                   │                               │
│  │                                      │                               │
│  │ Messages:                            │                               │
│  │ [                                    │                               │
│  │   { role: "system", content:         │                               │
│  │     "Kamu adalah asisten support..." │                               │
│  │   },                                 │                               │
│  │   ...history.slice(-10)...           │                               │
│  │   { role: "user", content: msg }     │                               │
│  │ ]                                    │                               │
│  │                                      │                               │
│  │ Model: deepseek/deepseek-chat        │                               │
│  │ Max tokens: 1024, Temperature: 0.7   │                               │
│  │ Auth: Bearer OPENROUTER_API_KEY      │                               │
│  └──────────────────────────────────────┘                               │
│             │                                                            │
│             ▼                                                            │
│  Return: { success: true, reply: "Langkah 1..." }                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Certificate Generation Flow

### 5.1 Certificate Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CERTIFICATE LIFECYCLE                                │
│                                                                          │
│  1. TRIGGER: User clicks "Buat Sertifikat"                             │
│     ─────────────────────────────────────────                            │
│     Preconditions:                                                      │
│     • session.forensicResult exists (not null)                         │
│     • computeBehavioralScore() can be called again                      │
│                                                                          │
│  2. COLLECT SESSION METADATA                                           │
│     ──────────────────────────                                          │
│     durationSec = round(elapsedBeforePause / 1000)                     │
│     totalSamples = session.samples                                      │
│     totalEdits = edits.length                                           │
│     pauses = pauses.length                                              │
│     pauseMeanMs = mean of all pauses                                    │
│     bursts = session.bursts                                             │
│     burstRatio = bursts / totalEdits                                    │
│     revisions = session.revisions                                       │
│                                                                          │
│  3. BUILD PAYLOAD                                                      │
│     ──────────────                                                      │
│     cert = generateForensicCertificatePayload(                          │
│       forensicResult, behavioralMetrics                                 │
│     )                                                                   │
│                                                                          │
│     Structure:                                                          │
│     {                                                                   │
│       dokumen: "Sertifikat Forensik — Creative Alibi v2.0",            │
│       versi: "2.0.0",                                                   │
│       dibuat: "2026-07-12T05:23:00.000Z",                              │
│       forensicConfidenceScore: 85,                                      │
│       tingkatKepercayaan: "Sangat Tinggi",                              │
│       verdict: "HUMAN_VERIFIED",                                        │
│       verdictLabel: "Bukti forensik sangat kuat...",                    │
│       layerAktif: 3,                                                    │
│       totalLayer: 3,                                                    │
│       bobotLayer: { behavioral: 0.3, linguistic: 0.4, api: 0.3 },      │
│       behavioral: { score: 78, interpretation: "..." },                │
│       linguistic: { score: 88, confidence: "HIGH", interpretation:... },│
│       apiDetection: { score: 85, provider: "Desklib (RAID #1)", ... },  │
│       agreement: { agreementLevel: "STRONG", maxDiff: 10, ... },       │
│       metrikPerilaku: { durasiDetik: 846, intervalAktif: 342, ... },   │
│       hashIntegritas: null, /* filled below */                          │
│       catatan: "Sertifikat ini dihasilkan..."                          │
│     }                                                                   │
│                                                                          │
│  4. COMPUTE HASH                                                       │
│     ─────────────                                                       │
│     hash = await sha256Hex(JSON.stringify(cert))                       │
│     cert.hashIntegritas = hash                                          │
│                                                                          │
│     Note: hash is computed on payload WITHOUT hashIntegritas field,    │
│     then the hash is appended. This ensures the hash itself isn't       │
│     part of the hashed content.                                         │
│                                                                          │
│  5. STORE & RENDER                                                     │
│     ──────────────────                                                  │
│     session.certificate = cert                                          │
│     renderCertificatePreview(cert)                                      │
│     → Show in UI panel                                                 │
│     → Enable "Download" and "Insert" buttons                          │
│                                                                          │
│  6. EXPORT OPTIONS                                                     │
│     ──────────────────                                                  │
│                                                                          │
│     a) DOWNLOAD:                                                        │
│        blob = new Blob([JSON.stringify(cert, null, 2)],                │
│          { type: "application/json" })                                  │
│        url = URL.createObjectURL(blob)                                  │
│        <a download="ca-forensic-cert-{ts}.json" href={url}>.click()   │
│                                                                          │
│     b) INSERT INTO WORD:                                                │
│        Word.run() → body.insertParagraph() for each line:              │
│        "SERTIFIKAT FORENSIK — CREATIVE ALIBI v2.0"                     │
│        "Waktu Dibuat: ..."                                              │
│        "Durasi Aktif: 14m 6s"                                           │
│        "Skor Forensik Keseluruhan: 85/100"                              │
│        "Interpretasi: HUMAN_VERIFIED"                                   │
│        "Layer 1 (Behavioral): 78"                                       │
│        "Layer 2 (Linguistic): 88"                                       │
│        "Layer 3 (External API): 85 (Desklib)"                           │
│        "SHA-256 Hash: a1b2c3..."                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Example Certificate Output

```json
{
  "dokumen": "Sertifikat Forensik — Creative Alibi v2.0",
  "versi": "2.0.0",
  "dibuat": "2026-07-12T05:18:30.000Z",
  "forensicConfidenceScore": 83,
  "tingkatKepercayaan": "Sangat Tinggi",
  "verdict": "HUMAN_VERIFIED",
  "verdictLabel": "Bukti forensik sangat kuat: karya ini sangat konsisten dengan proses kreatif manusia.",
  "layerAktif": 3,
  "totalLayer": 3,
  "bobotLayer": {
    "behavioral": 0.3,
    "linguistic": 0.4,
    "api": 0.3
  },
  "behavioral": {
    "score": 76,
    "interpretation": "Pola kerja cukup wajar, ada lonjakan."
  },
  "linguistic": {
    "score": 84,
    "confidence": "HIGH",
    "interpretation": "Struktur teks konsisten dengan tulisan manusia."
  },
  "apiDetection": {
    "score": 87,
    "provider": "Desklib (RAID #1)",
    "interpretation": "Model ML mendeteksi tulisan manusia."
  },
  "agreement": {
    "agreementLevel": "STRONG",
    "maxDiff": 11,
    "allSameZone": true,
    "description": "Semua layer memberikan penilaian yang sangat konsisten."
  },
  "metrikPerilaku": {
    "durasiDetik": 846,
    "totalSamples": 705,
    "totalEdits": 342,
    "pauses": 18,
    "pauseMeanMs": 6850,
    "bursts": 3,
    "burstRatio": 0.0088,
    "revisions": 27
  },
  "hashIntegritas": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "catatan": "Sertifikat ini dihasilkan oleh Creative Alibi v2.0 dengan sistem deteksi multi-layer. Forensic Confidence Score menggabungkan analisis perilaku menulis, struktur linguistik teks, dan (jika diaktifkan) hasil dari AI detector eksternal."
}
```

---

## 6. Deployment Workflow

### 6.1 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT WORKFLOW                                   │
│                                                                          │
│  DEVELOPER                                                               │
│  ─────────                                                                │
│                                                                          │
│  git checkout -b feature/new-provider                                   │
│  ... (make changes) ...                                                  │
│  git add -A                                                              │
│  git commit -m "feat: add new provider"                                 │
│  git push origin feature/new-provider                                   │
│                                                                          │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  GITHUB                                                          │    │
│  │  ──────                                                          │    │
│  │  • Repository: indri007/ai-alibi                                │    │
│  │  • Default branch: main                                         │    │
│  │  • Branch protection: PR required for main                      │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │ push to main                             │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  GOOGLE CLOUD BUILD                                              │    │
│  │  ────────────────────                                            │    │
│  │                                                                   │    │
│  │  Trigger: push to main                                           │    │
│  │  Config: cloudbuild.yaml                                         │    │
│  │                                                                   │    │
│  │  Step 1: Build creative-alibi                                    │    │
│  │  ─────────────────────────                                       │    │
│  │  docker build -f Dockerfile                                      │    │
│  │    -t gcr.io/heaven-493814/creative-alibi:latest                 │    │
│  │    .                                                              │    │
│  │  Node.js 20-slim base                                             │    │
│  │  npm install --production                                         │    │
│  │  Healthcheck: GET /health every 30s                              │    │
│  │  Port: 8080                                                       │    │
│  │                                                                   │    │
│  │  Step 2: Build desklib-detector                                  │    │
│  │  ──────────────────────────                                       │    │
│  │  docker build -f Dockerfile.desklib                               │    │
│  │    -t gcr.io/heaven-493814/desklib-detector:latest               │    │
│  │    .                                                              │    │
│  │  Python 3.11 + PyTorch (CPU)                                     │    │
│  │  DeBERTa-v3-large model (~2.1 GB)                                │    │
│  │  Pre-loads model on startup (lifespan event)                     │    │
│  │                                                                   │    │
│  │  Push both images to Container Registry                           │    │
│  │  Timeout: 1200s (model build is heavy)                           │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │ images pushed to GCR                     │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  GOOGLE CLOUD RUN                                                │    │
│  │  ────────────────────                                            │    │
│  │                                                                   │    │
│  │  Service: creative-alibi                                         │    │
│  │  ─────────────────────                                            │    │
│  │  Image: gcr.io/heaven-493814/creative-alibi:latest              │    │
│  │  Region: asia-southeast2 (Jakarta)                               │    │
│  │  Port: 3001 (env: PORT=3001)                                     │    │
│  │  Memory: 8Gi, CPU: 4                                             │    │
│  │  Min instances: 0, Max: 10                                       │    │
│  │  Concurrency: 80                                                  │    │
│  │  Allow unauthenticated: yes                                      │    │
│  │  URL: creative-alibi-994794168239.asia-southeast2.run.app       │    │
│  │  Env: DESKLIB_URL = desklib-detector URL                         │    │
│  │                                                                   │    │
│  │  Service: desklib-detector                                       │    │
│  │  ────────────────────────                                         │    │
│  │  Image: gcr.io/heaven-493814/desklib-detector:latest            │    │
│  │  Region: asia-southeast2                                         │    │
│  │  Port: 5000                                                       │    │
│  │  Memory: 8Gi, CPU: 4                                             │    │
│  │  Min instances: 0, Max: 2                                        │    │
│  │  Concurrency: 1 (model is single-threaded)                       │    │
│  │  Allow unauthenticated: yes (internal only)                      │    │
│  │  Cold start: ~30-60s (model loading)                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  VERIFICATION                                                    │    │
│  │  ────────────                                                    │    │
│  │                                                                   │    │
│  │  curl https://creative-alibi-...asia-southeast2.run.app/health  │    │
│  │  { "status":"ok", "providers": {"desklib":true,...} }           │    │
│  │                                                                   │    │
│  │  curl -X POST \                                                   │    │
│  │    https://creative-alibi-...asia-southeast2.run.app/api/detect \│    │
│  │    -H "Content-Type: application/json" \                         │    │
│  │    -d '{"provider":"desklib","text":"Test text..."}'             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Architecture Diagram (Deployment)

```
                         Internet
                            │
                   ┌────────┴────────┐
                   │  DNS / HTTPS    │
                   │                 │
                   │  *.run.app      │
                   └────────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             │             ▼
    ┌─────────────────┐     │    ┌─────────────────────┐
    │  Word Add-in    │     │    │  curl / API Client  │
    │  (browser JS)   │     │    │                     │
    │                 │     │    │                     │
    │  Connects to    │     │    │                     │
    │  Cloud Run URL  │     │    │                     │
    └────────┬────────┘     │    └─────────────────────┘
             │              │
             │  HTTPS       │
             ▼              │
    ┌─────────────────────────┐
    │    creative-alibi       │
    │    (Cloud Run)          │
    │    Node.js Express      │
    │    Port 8080            │
    │                         │
    │  /health                │
    │  /api/detect ───────────┼──────────┐
    │  /api/support ────┐    │          │
    │  /auth/google      │    │          │
    │  /auth/callback    │    │          │
    │  /taskpane.html    │    │          │
    └────────────────────┼────┘          │
                         │               │
                         │ DESKLIB_URL   │ OpenRouter
                         ▼               ▼
              ┌─────────────────┐  ┌──────────────┐
              │desklib-detector  │  │  OpenRouter  │
              │(Cloud Run)       │  │  API         │
              │Python FastAPI    │  │              │
              │Port 5000         │  │  deepseek/   │
              │                  │  │  deepseek-   │
              │DeBERTa-v3-large  │  │  chat        │
              │Model ~2.1GB     │  │              │
              │CPU Inference     │  │              │
              └─────────────────┘  └──────────────┘
```

---

## 7. Error Handling Flows

### 7.1 Error Matrix

| Layer | Error Condition | Handling | User Impact |
|-------|----------------|----------|-------------|
| **L1** | Edits < 5 | Score = -1, "Tidak cukup data" | Cannot generate certificate |
| **L2** | Word count < 50 | `available: false`, message shown | L2 skipped in ensemble |
| **L2** | Only 1-2 paragraphs | Paragraph metric returns -1, weight redistributed | Slightly less accurate score |
| **L3** | No consent given | Function returns early, `status: "USER_NO_CONSENT"` | L3 skipped |
| **L3** | No provider selected | `status: "NO_PROVIDER"` | L3 skipped |
| **L3** | Text < 50 chars | `status: "TEXT_TOO_SHORT"` | L3 skipped |
| **L3** | Network error | `status: "NETWORK_ERROR"`, fallback message | L3 skipped (L1+L2 used) |
| **L3** | API error (4xx/5xx) | `status: "API_ERROR"`, details in message | L3 skipped |
| **L3** | Timeout (>60s) | axios timeout → error response | L3 skipped |
| **L3** | Desklib cold start | Timeout with "Model mungkin masih cold start" | Retry after ~60s |
| **API** | Rate limit exceeded | 429 response from backend | User waits 1 minute |
| **API** | Invalid API key | 401/403 response | User configures API key |
| **Ensemble** | All layers skip | Score = -1, "Belum ada data forensik" | No certificate |
| **Cert** | No forensic result | Button disabled, can't generate | Must re-run analysis |
| **Word** | Office.js error | Caught in try/catch, logged to console | Poll cycle skipped silently |

### 7.2 Graceful Degradation Path

```
                    ALL LAYERS FAIL
                          │
                          ▼
                ┌─────────────────────┐
                │ Score: -1           │
                │ Verdict: UNKNOWN    │
                │ "Belum ada data     │
                │  forensik"          │
                └─────────────────────┘
                          ▲
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     L1 ONLY         L1 + L2         L1 + L2 + L3
          │               │               │
          ▼               ▼               ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ Weight:     │  │ Weight:     │  │ Weight:     │
  │ L1: 1.0     │  │ L1: 0.4     │  │ L1: 0.3     │
  │             │  │ L2: 0.6     │  │ L2: 0.4     │
  │ Confidence: │  │ L3: 0.0     │  │ L3: 0.3     │
  │ LOW         │  │             │  │             │
  │ (1 layer)   │  │ Confidence: │  │ Confidence: │
  │             │  │ MEDIUM-HIGH │  │ VERY_HIGH   │
  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 8. Cross-Layer Agreement Flow

### 8.1 Agreement Decision Tree

```
                    ┌─────────────────────┐
                    │  Gather layer scores │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │  Active layers ≥ 2?  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼──────────────────┐
              │ YES            │ NO (only 1 layer) │
              ▼                │                   ▼
    ┌─────────────────┐       │          ┌────────────────────┐
    │ Compute maxDiff  │       │          │ Agreement: N/A     │
    │ = max(scores) -  │       │          │ "Minimal 2 layer   │
    │   min(scores)    │       │          │  diperlukan."      │
    └────────┬─────────┘       │          └────────────────────┘
             │                 │
             ▼                 │
    ┌─────────────────┐       │
    │ Assign zones:    │       │
    │ score ≥ 75 → G   │       │
    │ score ≥ 50 → Y   │       │
    │ score < 50 → R   │       │
    └────────┬─────────┘       │
             │                 │
             ▼                 │
    ┌──────────────────────────────┐
    │  All same zone?              │
    └────┬─────────────────────────┘
         │
    ┌────┴─────────────────────┐
    │ YES                      │ NO
    ▼                          ▼
┌──────────────┐       ┌────────────────┐
│ maxDiff ≤ 15? │       │ maxDiff ≤ 25?  │
└──────┬───────┘       └───────┬────────┘
       │                       │
   ┌───┴───┐              ┌────┴────┐
   │YES    │NO            │YES     │NO
   ▼       ▼              ▼        ▼
┌──────┐ ┌────────┐  ┌────────┐ ┌───────┐
│STRONG│ │MODERATE│  │MODERATE│ │ WEAK  │
└──────┘ └────────┘  └────────┘ └───────┘
```

### 8.2 Example Agreement Scenarios

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGREEMENT EXAMPLES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO 1: Student writing thesis for 3 hours                         │
│  ──────────────────────────────────────────                             │
│  L1 (Behavioral): 82    → GREEN zone                                     │
│  L2 (Linguistic):  91   → GREEN zone                                     │
│  L3 (Desklib):     87   → GREEN zone                                     │
│                                                                          │
│  maxDiff = 9  |  allSameZone = true                                     │
│  Agreement: STRONG  |  Confidence: VERY_HIGH                            │
│  Verdict: HUMAN_VERIFIED (Score: 87)                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  SCENARIO 2: Writer pasted from ChatGPT then edited slightly            │
│  ─────────────────────────────────────────────────────                  │
│  L1 (Behavioral): 45   → RED zone      (high burst ratio)              │
│  L2 (Linguistic):  62   → YELLOW zone   (some human patterns)          │
│  L3 (Desklib):     12   → RED zone      (high AI probability)          │
│                                                                          │
│  maxDiff = 50  |  allSameZone = false                                   │
│  Agreement: WEAK  |  Confidence: REVIEW                                │
│  Verdict: AI_LIKELY (Score: 42)                                         │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  SCENARIO 3: Journalist writing naturally (no API enabled)              │
│  ─────────────────────────────────────────────────────                  │
│  L1 (Behavioral): 75   → GREEN zone                                     │
│  L2 (Linguistic):  88   → GREEN zone                                     │
│  L3: skipped (no consent)                                               │
│                                                                          │
│  maxDiff = 13  |  allSameZone = true                                    │
│  Agreement: STRONG  |  Confidence: HIGH (2 layers)                     │
│  Verdict: HUMAN_LIKELY (Score: 83)  /* weight: 0.4/0.6 */             │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  SCENARIO 4: Short text (<50 words), min edits                         │
│  ──────────────────────────────────────────────────                     │
│  L1: -1  (insufficient data)                                            │
│  L2: -1  (text too short)                                               │
│  L3: skipped                                                            │
│                                                                          │
│  Score: -1  |  Confidence: NONE  |  Verdict: UNKNOWN                   │
│  "Tidak ada data forensik."                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Quick Reference

### Data Flow Summary

| Phase | Input | Processing | Output |
|-------|-------|------------|--------|
| Recording | Word document body | Poll every 1.2s, detect deltas | edits[] with timestamps |
| L1 Analysis | edits[], pauses, bursts | Score formula (base 70 ± adjustments) | Behavioral score (0-100) |
| L2 Analysis | textAtStop | 8 linguistic metric calculations | Weighted linguistic score |
| L3 Analysis | textAtStop (with consent) | POST to API provider, normalize | Normalized human score |
| Ensemble | L1/L2/L3 scores | Weighted average + agreement | ForensicResult |
| Certificate | ForensicResult + metadata | Build JSON + SHA-256 hash | Downloadable .json |

### Configuration Flow

```
Settings UI → applySettings()
                │
                ├── config.l2Enabled = toggle value
                ├── config.l3Enabled = toggle value
                ├── config.l3Provider = dropdown value
                ├── config.l3Proxy = text input
                └── config.l3Consent = checkbox
                       │
                       ▼
                initApiDetector({ provider, proxyUrl })
                setApiConsent(consent)
```

### Key Constants

| Constant | Value | Context |
|----------|-------|---------|
| POLL_MS | 1200 ms | Behavioral engine polling interval |
| PAUSE_THRESHOLD | 4000 ms | Gap ≥ this = "natural pause" |
| BURST_THRESHOLD | 40 chars | Delta > this = "burst" (paste) |
| L3_MIN_CHARS | 50 | Minimum text for API detection |
| L2_MIN_WORDS | 50 | Minimum text for linguistic analysis |
| L2_IDEAL_WORDS | 250 | Recommended minimum for accurate analysis |
| RATE_LIMIT | 20 req/min | API rate limit per IP |
| API_CACHE_SIZE | 20 entries | SHA-256 text hash cache |
| DESKLIB_TIMEOUT | 60000 ms | Timeout for Python inference |
| DESKLIB_MAX_TOKENS | 768 | DeBERTa-v3 max token length |
| CERT_VERSION | "2.0.0" | Certificate format version |
