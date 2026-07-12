# Creative Alibi — Product Requirements Document

> **Version:** 2.0.0  
> **Status:** Production 🌐  
> **Last Updated:** 2026-07-12  
> **Repository:** [github.com/indri007/ai-alibi](https://github.com/indri007/ai-alibi)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [System Architecture](#4-system-architecture)
5. [Feature Requirements](#5-feature-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Stories](#7-user-stories)
8. [Scoring Methodology](#8-scoring-methodology)
9. [API Specifications](#9-api-specifications)
10. [Deployment Topology](#10-deployment-topology)
11. [Environment Configuration](#11-environment-configuration)
12. [Roadmap](#12-roadmap)

---

## 1. Product Overview

**Creative Alibi** is a Microsoft Word Add-in that functions as a **Digital Notary** — it records the _process_ of creating text (not the content itself) and mathematically proves the text was produced through genuine human effort. It provides a verifiable defense against false accusations from faulty AI detectors.

The system uses a **Multi-Layer Forensic Architecture** with three independent analytical engines that together produce a **Forensic Confidence Score** and a cryptographically hashed certificate.

### Core Value Proposition

> **"Proof of human effort, not detection of AI."**

Rather than trying to detect whether text _might_ be AI-generated (which suffers from high false-positive rates), Creative Alibi captures the irrefutable behavioral metadata of _how_ the text was created — typing rhythms, edit patterns, pause distributions, and linguistic signatures — and packages that into a tamper-proof certificate.

---

## 2. Problem Statement

The generative AI boom has created an **Authenticity Crisis** for the creative industry:

- **False Accusations:** Writers, journalists, and students are falsely accused of using AI to generate work, damaging reputations and livelihoods.
- **Faulty Detectors:** Traditional AI detectors have high false-positive rates (up to 60% for non-native English speakers) and no "ground truth."
- **IP Exposure:** Most detectors require uploading full text to third-party servers, risking intellectual property leaks.
- **Retroactive Only:** Existing solutions analyze _final_ text, missing the creation process entirely.

Creative Alibi solves this by shifting the paradigm: instead of asking "was this made by AI?", it proves "a human created this through demonstrated effort."

---

## 3. Target Users

### Primary Personas

| Persona | Pain Point | Creative Alibi Solution |
|---------|-----------|------------------------|
| **Freelance Writer** | Client accuses of AI use after submitting article | Generate forensic certificate as proof-of-process attachment with invoice |
| **University Student** | Professor's AI detector flags thesis chapter as AI-generated | Present certificate showing days of active editing, revisions, and natural typing patterns |
| **Journalist** | Editor questions authenticity of investigative piece | Share certificate with SHA-256 integrity hash verifiable by anyone |
| **Publisher** | Must verify human origin of unsolicited manuscripts | Require Creative Alibi certificate at submission without reading raw content |

### Secondary Personas

| Persona | Need |
|---------|------|
| **Content Agency Owner** | Legally protect freelancers against AI-usage disputes |
| **Academic Researcher** | Document research writing process for ethics boards |
| **Legal Professional** | Verify affidavit/memo was drafted by human associate |

---

## 4. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MICROSOFT WORD (Desktop)                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Creative Alibi Task Pane (iframe)               │    │
│  │                                                              │    │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐     │    │
│  │  │  L1: Behavioral      │  │  L2: Linguistic           │     │    │
│  │  │  Engine (offline)    │  │  Engine (offline)         │     │    │
│  │  │                      │  │                          │     │    │
│  │  │  • Poll Word API     │  │  • Sentence Burstiness    │     │    │
│  │  │    every 1.2s        │  │  • Vocabulary Richness    │     │    │
│  │  │  • Detect bursts     │  │  • Hapax Legomena         │     │    │
│  │  │    (>40 chars)       │  │  • Sentence Starter Div.  │     │    │
│  │  │  • Track pauses      │  │  • Connective Overuse     │     │    │
│  │  │    (≥4s gaps)        │  │  • Zipf Compliance        │     │    │
│  │  │  • Count revisions   │  │  • N-gram Repetition      │     │    │
│  │  │  • Activity canvas   │  │  • Paragraph Uniformity   │     │    │
│  │  └──────────────────────┘  └──────────────────────────┘     │    │
│  │                                                              │    │
│  │  ┌─── Consent Gate (user must explicitly agree) ──────────┐ │    │
│  │  │                                                        │ │    │
│  │  │  L3: External API Verification (consent-based)         │ │    │
│  │  │  ┌─────────────────────────────────────────────────┐   │ │    │
│  │  │  │ Providers: Desklib ⭐ | WatsonX | GPTZero |      │   │ │    │
│  │  │  │            ZeroGPT | HIX                         │   │ │    │
│  │  │  └─────────────────────────────────────────────────┘   │ │    │
│  │  └──────────────────────────┬─────────────────────────────┘ │    │
│  │                             │                                │    │
│  │  ┌──────────────────────────▼─────────────────────────────┐ │    │
│  │  │           Forensic Ensemble Engine                     │ │    │
│  │  │  ┌────────────────────────────────────────────────┐   │ │    │
│  │  │  │ Weighted average (L1:30% L2:40% L3:30%)        │   │ │    │
│  │  │  │ Agreement analysis (STRONG/MODERATE/WEAK)       │   │ │    │
│  │  │  │ Confidence level (VERY_HIGH to LOW)             │   │ │    │
│  │  │  │ Final verdict (HUMAN_VERIFIED - AI_DETECTED)    │   │ │    │
│  │  │  └────────────────────────────────────────────────┘   │ │    │
│  │  └───────────────────────────────────────────────────────┘ │    │
│  │                                                              │    │
│  │  ┌───────────────────────────────────────────────────────┐  │    │
│  │  │              Certificate Generator                     │  │    │
│  │  │  • SHA-256 integrity hash of all data                  │  │    │
│  │  │  • JSON certificate with all layer scores              │  │    │
│  │  │  • Download as .json or insert into Word doc           │  │    │
│  │  └───────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                │                                     │
│                                │ HTTPS (fetch to Cloud Run)          │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                  CLOUD RUN: creative-alibi                          │
│              (Node.js 20 / Express / Port 3001 → 8080)             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  /api/detect │  │ /api/support │  │      OAuth (optional)   │  │
│  │              │  │              │  │  /auth/google            │  │
│  │ POST with    │  │ POST chat    │  │  /auth/google/callback   │  │
│  │ provider +   │  │ message +    │  │  /auth/logout            │  │
│  │ text         │  │ history      │  │  /api/me                 │  │
│  └──────┬───────┘  └──────────────┘  └─────────────────────────┘  │
│         │                                                           │
│  ┌──────▼───────┐  ┌──────────────────────────────────────────┐  │
│  │   /health    │  │  Rate Limiter (20 req/min per IP)         │  │
│  │   /api/health│  │  API Key Auth (optional)                  │  │
│  └──────────────┘  │  CORS (Office domains + dev)              │  │
│                    └──────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────┘
                            │ DESKLIB_URL
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│            CLOUD RUN: desklib-detector                              │
│         (Python 3.11 / FastAPI / DeBERTa-v3-large)                  │
│                                                                     │
│  ┌────────────────────┐  ┌──────────────────────────────────────┐ │
│  │   GET /health      │  │   POST /detect                       │ │
│  │   {                │  │   { text, threshold: 0.5,           │ │
│  │     status: "ok",  │  │     max_length: 768 }                │ │
│  │     model_loaded:  │  │   → { probability, label,           │ │
│  │     true,          │  │       is_ai_generated }              │ │
│  │     device         │  └──────────────────────────────────────┘ │
│  │   }                │                                           │
│  └────────────────────┘  Memory: 8Gi  CPU: 4  Region: SEA        │
└────────────────────────────────────────────────────────────────────┘
```

### Layer Architecture Detail

#### Layer 1: Behavioral Engine (100% Local/Offline)

Runs inside the Word Add-in task pane. Polls the Word document body every **1.2 seconds** via the Office.js Word API to detect formatting and typing patterns.

**Captured Metrics:**
| Metric | Detection | Human Signal | AI Signal |
|--------|-----------|-------------|-----------|
| **Burst Ratio** | Characters changed in single poll > 40 | Low burst frequency | High burst frequency (paste) |
| **Edit Frequency** | Number of delta changes per minute | Steady, variable | Erratic or none |
| **Pause Distribution** | Gaps ≥ 4 seconds between changes | Natural pauses (thinking, reading) | Unnatural uniformity or no pauses |
| **Revision Count** | Negative deltas (deletions) | Frequent revisions (rewriting) | Very few deletions |
| **Total Duration** | Session elapsed time | Correlated with text length | No correlation |

#### Layer 2: Linguistic Engine (100% Local/Offline)

Runs 8 independent linguistic metrical analyses entirely within the browser. **Text never leaves the user's machine.**

**8 Metrics (with weights):**
| # | Metric | Weight | What It Detects |
|---|--------|--------|-----------------|
| 1 | Sentence Burstiness | 15% | Human writers mix short/long sentences; AI is uniform |
| 2 | Vocabulary Richness (MATTR) | 15% | Humans use broader vocabulary; AI is repetitive |
| 3 | Hapax Legomena Ratio | 10% | Words appearing only once — more in human writing |
| 4 | Sentence Starter Diversity | 10% | AI repeats opening words/phrases |
| 5 | Connective Overuse | 15% | AI over-uses "Furthermore", "Moreover", "Selain itu" |
| 6 | Zipf's Law Compliance | 10% | Natural text follows Zipf distribution; AI deviates |
| 7 | Repetitive N-gram Detection | 15% | AI repeats bigrams/trigrams more frequently |
| 8 | Paragraph Uniformity | 10% | AI generates uniformly-sized paragraphs |

Minimum text for analysis: **50 words** (recommended: 250+)

#### Layer 3: External API Verification (Consent-Based)

Requires **explicit user opt-in** via a consent checkbox in Settings. Text is sent through a proxy server to selected provider.

| Provider | Model | Accuracy | Status |
|----------|-------|----------|--------|
| **Desklib** ⭐ | DeBERTa-v3-large (RAID #1) | ~99.98% | ✅ Default (local Cloud Run) |
| **IBM watsonx.ai** | Granite Foundation Models | Enterprise-grade | ⬜ Requires API Key |
| **GPTZero** | Proprietary | Academic-focused | ⬜ Requires API Key |
| **ZeroGPT** | Proprietary | Developer-friendly | ⬜ Requires API Key |
| **HIX** | AI Bypass Premium | Premium account | ⬜ Requires Credentials |

### Forensic Ensemble Engine

After all enabled layers complete, the ensemble engine:

1. Normalizes all scores to 0-100 scale
2. Applies dynamic weights (auto-adjusts when layers are inactive)
3. Computes **Forensic Confidence Score** (weighted average)
4. Calculates **Agreement Level** (STRONG / MODERATE / WEAK / CONFLICT)
5. Determines **Confidence Level** (VERY_HIGH / HIGH / MEDIUM / LOW / REVIEW)
6. Assigns **Verdict** (HUMAN_VERIFIED / HUMAN_LIKELY / MIXED / AI_LIKELY / AI_DETECTED)

#### Default Weights (All 3 Layers Active)

| Layer | Weight |
|-------|--------|
| L1: Behavioral | 30% |
| L2: Linguistic | 40% |
| L3: External API | 30% |

#### Fallback Weights (API Disabled)

| Layer | Weight |
|-------|--------|
| L1: Behavioral | 40% |
| L2: Linguistic | 60% |

#### Fallback Weights (Behavioral Only)

| Layer | Weight |
|-------|--------|
| L1: Behavioral | 100% |

---

## 5. Feature Requirements

### 5.1 Recording Session

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-01 | Start Recording | P0 | Begin capturing behavioral metadata from Word document |
| FR-02 | Pause/Resume | P1 | Pause recording (for phone calls, interruptions) |
| FR-03 | Stop Recording | P0 | End session and trigger forensic analysis |
| FR-04 | Reset Session | P0 | Clear all recorded data and start fresh |
| FR-05 | Session Timer | P0 | Live timer showing HH:MM:SS elapsed |
| FR-06 | Live Activity Canvas | P1 | Real-time bar chart of recent edits |
| FR-07 | Live Metrics Display | P0 | Show samples, edits, pauses, bursts counts |
| FR-08 | Status Indicator | P0 | Visual indicator (recording/paused/idle) |

### 5.2 Configuration

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-09 | Layer 2 Toggle | P0 | Enable/disable linguistic analysis |
| FR-10 | Layer 3 Toggle | P0 | Enable/disable external API detection |
| FR-11 | Provider Selection | P0 | Choose which external API provider to use |
| FR-12 | Proxy URL Config | P0 | Configure custom backend proxy URL |
| FR-13 | Consent Checkbox | P0 | Explicit consent to send text to API |
| FR-14 | Reset All Settings | P2 | Restore default configuration |

### 5.3 Forensic Dashboard

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-15 | Forensic Ring Score | P0 | Circular gauge showing 0-100 score |
| FR-16 | Layer Scores (L1, L2, L3) | P0 | Individual scores per active layer |
| FR-17 | Linguistic Metric Breakdown | P0 | Bar chart visualization of 8 metrics |
| FR-18 | Verdict Badge | P0 | Final verdict label with color coding |
| FR-19 | Agreement Bar | P1 | Visual indicator of cross-layer agreement |
| FR-20 | Confidence Tag | P1 | Confidence level label (VERY_HIGH to LOW) |

### 5.4 Certificate

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-21 | Generate Certificate | P0 | Create JSON certificate from forensic results |
| FR-22 | SHA-256 Integrity Hash | P0 | Cryptographic hash of entire certificate payload |
| FR-23 | Certificate Preview | P0 | In-panel preview of certificate details |
| FR-24 | Download Certificate | P0 | Download .json file to local machine |
| FR-25 | Insert into Document | P0 | Append certificate text to current Word document |
| FR-26 | Certificate Contains: | P0 | Session metadata, layer scores, hash, timestamp |

### 5.5 Support Chat

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-27 | AI Support Chat | P1 | In-app support powered by DeepSeek/OpenRouter |
| FR-28 | Chat History | P1 | Retain last 10 messages in conversation context |
| FR-29 | Bahasa Indonesia | P1 | Support assistant speaks Indonesian |
| FR-30 | Step-by-step Guidance | P1 | Installation and troubleshooting help |

### 5.6 Backend API

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FR-31 | POST /api/detect | P0 | AI detection endpoint for all providers |
| FR-32 | POST /api/support | P1 | Support chat endpoint |
| FR-33 | GET /health | P0 | Server health and provider status |
| FR-34 | GET /api/health | P0 | API health check (proxy-aware) |
| FR-35 | Google OAuth | P2 | Optional Google login for premium features |
| FR-36 | API Key Auth | P1 | Optional X-API-Key header authentication |
| FR-37 | Rate Limiting | P0 | 20 requests/minute per IP on /api/ routes |
| FR-38 | CORS Whitelist | P0 | Restrict to Office domains + dev origins |

---

## 6. Non-Functional Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR-01 | **Privacy** — L1 & L2 run 100% offline, no data leaves the browser | No network calls from engines | P0 |
| NFR-02 | **Consent Gate** — L3 never sends text without explicit user checkbox | Consent state check before every API call | P0 |
| NFR-03 | **Polling Interval** — Behavioral engine polls document every | ≤ 1,200 ms | P0 |
| NFR-04 | **Maximum Response Time** — API detection endpoint | ≤ 65 seconds (incl. model cold start) | P0 |
| NFR-05 | **Session Data** — All session data stored in browser memory only | Not persisted to disk | P0 |
| NFR-06 | **Minimum Text Length** — L3 API requires | ≥ 50 characters | P0 |
| NFR-07 | **Minimum Word Count** — L2 Linguistic requires | ≥ 50 words | P0 |
| NFR-08 | **Cache** — API results cached by SHA-256 text hash | Max 20 entries | P1 |
| NFR-09 | **Cloud Run Cold Start** — Model warm-up on boot, not first request | Lifespan event handler | P1 |
| NFR-10 | **Hash** — Certificate integrity uses | SHA-256 | P0 |
| NFR-11 | **Rate Limit** — Max requests per IP per minute | 20 requests/minute | P1 |
| NFR-12 | **HTTPS** — All production traffic must be | TLS 1.3 | P0 |
| NFR-13 | **Idempotency** — Identical API detection calls return same normalized result | Cache hit returns same shape | P1 |

---

## 7. User Stories

### Recording Flow
```
As a freelance writer,
I want to start a recording session before I begin writing,
So that I have documented proof of my creative process.

As a university student,
I want to pause recording when I get interrupted,
So that the pause statistics accurately reflect my work rhythm.

As a journalist,
I want to see my typing activity as a live chart,
So that I can confirm the system is recording properly.
```

### Analysis Flow
```
As a user,
I want the system to automatically analyze my text when I stop recording,
So that I don't have to manually trigger analysis.

As a non-technical user,
I want a simple 0-100 score with a color-coded verdict,
So that I can quickly understand the forensic result.

As a detail-oriented professional,
I want to see the breakdown of all 8 linguistic metrics,
So that I can understand exactly why the score was calculated.
```

### Certificate Flow
```
As a freelancer,
I want to download a JSON certificate with a SHA-256 hash,
So that I can attach it to my invoice as proof of human effort.

As a student,
I want to insert the certificate directly into my Word document,
So that the professor sees the proof alongside the content.

As a publisher,
I want to verify the certificate's hash hasn't been tampered with,
So that I can trust the authenticity claim.
```

### Detection Flow
```
As a power user,
I want to choose which AI detection provider to use,
So that I can cross-reference results from multiple sources.

As a privacy-conscious user,
I want to explicitly consent before my text is sent to any external API,
So that my intellectual property remains protected.

As a user with slow internet,
I want the offline layers (L1 & L2) to still provide a meaningful score,
So that I don't rely on external API availability.
```

---

## 8. Scoring Methodology

### 8.1 Layer 1: Behavioral Score (Base 70)

| Factor | Effect | Calculation | Range |
|--------|--------|-------------|-------|
| Burst Ratio | Penalty | `bursts/edits * 100 * 0.6` | -45 to 0 |
| Revisions | Bonus | `revisions * 1.5` | +0 to +10 |
| Natural Pauses | Bonus | `+5` if pauses > 0 | +5 |
| Long Session, No Pauses | Penalty | `-15` if >5min and 0 pauses | -15 |
| Insufficient Data | Floor | Score = -1 if edits < 5 | N/A |

**Base Score**: 70  
**Valid Range**: 0–100 (clamped)  
**Minimum Edits**: 5 (below = insufficient data)

### 8.2 Layer 2: Linguistic Score (8 Metrics)

Each metric returns a float between 0 and 100. The engine uses a weighted average:

| Metric | Weight | Human Range | AI Range |
|--------|--------|-------------|----------|
| Sentence Burstiness (CV) | 15% | CV ≥ 0.5 | CV ≤ 0.35 |
| Vocabulary Richness (MATTR) | 15% | MATTR ≥ 0.75 | MATTR ≤ 0.65 |
| Hapax Legomena | 10% | ≥ 55% of unique words | ≤ 45% |
| Sentence Starter Diversity | 10% | ≥ 70% unique | ≤ 55% |
| Connective Overuse | 15% | ≤ 0.1 per sentence | ≥ 0.2 per sentence |
| Zipf Compliance (R²) | 10% | R² ≥ 0.85 | R² ≤ 0.70 |
| Repetitive N-grams | 15% | ≤ 6% repetition | ≥ 10% repetition |
| Paragraph Uniformity (CV) | 10% | CV ≥ 0.5 | CV ≤ 0.35 |

If a metric has insufficient data (score = -1), it is excluded and its weight redistributed proportionally.

### 8.3 Layer 3: API Score

Each provider result is normalized to a **human score** (0–100):

| Provider | Raw Output | Normalized Score |
|----------|-----------|-----------------|
| Desklib | `probability` (0-1) = AI probability | `(1 - probability) * 100` |
| GPTZero | `completely_generated_prob` | `(1 - prob) * 100` |
| ZeroGPT | `ai_percentage` (0-100) | `100 - ai_percentage` |
| IBM watsonx | `human_score` (0-100) | `human_score` directly |

### 8.4 Agreement Analysis

When multiple layers are active, agreement is computed:

```
maxDiff = max(scores) - min(scores)
zones = [GREEN if s ≥ 75, YELLOW if s ≥ 50, RED otherwise]

STRONG  → maxDiff ≤ 15 AND allSameZone
MODERATE → maxDiff ≤ 25 OR allSameZone
WEAK    → otherwise
```

### 8.5 Verdict Mapping

| Score Range | Verdict | Color | Meaning |
|-------------|---------|-------|---------|
| ≥ 80 | HUMAN_VERIFIED | 🟢 Green | Very strong forensic evidence |
| 65–79 | HUMAN_LIKELY | 🟢 Light | Likely human-written |
| 50–64 | MIXED | 🟡 Yellow | Mixed indicators |
| 30–49 | AI_LIKELY | 🟠 Orange | Many AI indicators |
| < 30 | AI_DETECTED | 🔴 Red | Strong AI pattern detected |

---

## 9. API Specifications

### 9.1 POST /api/detect

**Description:** AI-generated text detection via configured provider.

**Request:**
```json
{
  "provider": "desklib",
  "text": "The text to analyze... (min 50 characters)"
}
```

**Provider values:** `desklib`, `watsonx`, `gptzero`, `zerogpt`, `hix`

**Headers:** (optional) `X-API-Key: your-api-key`

**Rate Limit:** 20 requests/minute per IP

**Success Response (Desklib):**
```json
{
  "success": true,
  "provider": "desklib",
  "model": "desklib/ai-text-detector-v1.01",
  "probability": 0.1234,
  "label": 0,
  "isAiGenerated": false,
  "threshold": 0.5,
  "textLength": 512,
  "processingTimeMs": 2847,
  "source": "cloud"
}
```

**Error Response:**
```json
{
  "success": false,
  "provider": "desklib",
  "error": "Python detection service tidak dapat dijangkau di ...",
  "processingTimeMs": 5002,
  "source": "local",
  "unreachable": true
}
```

### 9.2 POST /api/support

**Description:** AI support chat via DeepSeek (OpenRouter).

**Request:**
```json
{
  "message": "How do I install the Word Add-in?",
  "history": []
}
```

**Success Response:**
```json
{
  "success": true,
  "reply": "Langkah 1: Clone repo...",
  "usage": { "prompt_tokens": 456, "completion_tokens": 123 }
}
```

### 9.3 GET /health

**Description:** Server health check with provider status.

**Response:**
```json
{
  "status": "ok",
  "auth": false,
  "providers": {
    "gptzero": false,
    "zerogpt": false,
    "watsonx": false,
    "desklib": true,
    "hix": false
  }
}
```

---

## 10. Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
│               github.com/indri007/ai-alibi                       │
│                                                                  │
│  node_modules/   server/   src/   dist/   docs/   assets/       │
└────────────────────────────┬────────────────────────────────────┘
                             │ git push
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Google Cloud Build                           │
│                                                                  │
│  Step 1: Docker build -f Dockerfile          → creative-alibi   │
│  Step 2: Docker build -f Dockerfile.desklib  → desklib-detector │
│                                                                  │
│  Timeout: 1200s                                                  │
└────────────┬──────────────────────────┬─────────────────────────┘
             │                          │
             ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  Cloud Run Service 1     │  │  Cloud Run Service 2     │
│                          │  │                          │
│  creative-alibi          │  │  desklib-detector        │
│  Region: asia-southeast2 │  │  Region: asia-southeast2 │
│  URL: *.run.app:443      │  │  URL: *.run.app:5000     │
│  Memory: 8Gi             │  │  Memory: 8Gi             │
│  CPU: 4                  │  │  CPU: 4                  │
│  Concurrency: 80         │  │  Concurrency: 1          │
│  Min Instances: 0        │  │  Min Instances: 0        │
│  Max Instances: 10       │  │  Max Instances: 2        │
│                          │  │                          │
│  Node.js 20              │  │  Python 3.11             │
│  Express                 │  │  FastAPI                 │
│  Serve:                  │  │  Serve:                  │
│  • API endpoints         │  │  • /detect              │
│  • Static dist/          │  │  • /health               │
│  • /detect proxied →     │──┼──> POST /detect          │
│  • DESKLIB_URL env       │  │  • DeBERTa-v3-large     │
└──────────────────────────┘  └──────────────────────────┘
                                       │
                                       ▼
                             ┌───────────────────────┐
                             │  Model Storage         │
                             │                        │
                             │  ai-text-detector-v1.01│
                             │  • config.json         │
                             │  • model.safetensors   │
                             │  • tokenizer.json      │
                             │  (2.1 GB DeBERTa-v3)   │
                             └───────────────────────┘

      VPS (Windows) ─── Word 2019 + Sideloaded manifest.xml
      (optional local deployment)
```

### Desklib Detector Model Details

| Property | Value |
|----------|-------|
| Base Architecture | DeBERTa-v3-large |
| Model Name | `desklib/ai-text-detector-v1.01` |
| Training Dataset | RAID #1 (RAID benchmark leader) |
| Token Limit | 768 tokens |
| Classifier | Mean pooling + Linear (BCE) |
| Weight | ~2.1 GB |
| Format | HuggingFace safetensors |
| Device | CPU (Cloud Run) / CUDA (local) |

---

## 11. Environment Configuration

### creative-alibi (Node.js Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Express server port |
| `DESKLIB_URL` | Yes* | `http://127.0.0.1:5000` | Python sidecar/Cloud Run URL |
| `DESKLIB_TIMEOUT_MS` | No | 60000 | Timeout for Desklib requests |
| `GPTZERO_API_KEY` | No | - | GPTZero API key |
| `ZEROGPT_API_KEY` | No | - | ZeroGPT API key |
| `WATSONX_API_KEY` | No | - | IBM watsonx API key |
| `WATSONX_PROJECT_ID` | No | - | IBM watsonx project ID |
| `HIX_EMAIL` | No | - | HIX AI Bypass premium email |
| `HIX_PASSWORD` | No | - | HIX AI Bypass premium password |
| `OPENROUTER_API_KEY` | No | - | Support chat API key |
| `OPENROUTER_MODEL` | No | `deepseek/deepseek-chat` | Support chat model |
| `API_KEY` | No | (empty) | Optional auth key for API |
| `RATE_LIMIT_MAX` | No | 20 | Requests/minute limit |
| `CORS_ORIGINS` | No | Office domains + localhost | Allowed CORS origins |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth secret |
| `SESSION_SECRET` | No | - | Session encryption secret |

### desklib-detector (Python FastAPI)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DESKLIB_PORT` | No | 5000 | FastAPI server port |
| `DESKLIB_HOST` | No | `0.0.0.0` | FastAPI bind address |
| `DESKLIB_MODEL_PATH` | No | `/app/ai-text-detector-v1.01` | Path to model directory |

---

## 12. Roadmap

| Phase | Version | Feature | Status |
|-------|---------|---------|--------|
| **v1.0** | 1.0 | Behavioral engine + basic certificate | ✅ Complete |
| **v2.0** | 2.0 | Linguistic engine (8 metrics), Desklib integration, Cloud Run, Support Chat, Google OAuth | ✅ **Live** |
| **v2.1** | 2.1 | Oracle Cloud migration, cost optimization, multi-region | 🔜 Next |
| **v2.2** | 2.2 | LoRA fine-tuning custom model on user writing data, improved Zipf analysis | 📝 Planned |
| **v3.0** | 3.0 | Multi-language support (Arabic, Mandarin), Procreate/Photoshop add-in for visual arts | 🎯 Future |
| **v3.1** | 3.1 | API monetization, team accounts, enterprise SSO | 💡 Proposed |

---

### Success Metrics

| Metric | Target |
|--------|--------|
| L1+L2 score accuracy vs. human panel | ≥ 85% agreement |
| L3 Desklib accuracy | ≥ 95% (RAID benchmark) |
| Certificate verification time | < 100ms |
| Offline mode (L1+L2) availability | 100% |
| Cold start to first detection | ≤ 60 seconds |
| Uptime (Cloud Run) | ≥ 99.9% |
