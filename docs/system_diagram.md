# System Architecture Diagram

## Overview

The Dengue Risk and Warning-Sign Assessment Expert System follows a layered architecture that separates the user interface, fact conversion, knowledge representation, inference, and explanation output.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                     PATIENT                          │
│              (User / Lecturer)                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              PATIENT INPUT FORM                      │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Patient  │ │ Symptoms │ │ Warning  │            │
│  │  Info    │ │          │ │  Signs   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                          │
│  │ Severe   │ │ Disease  │                          │
│  │Indicators│ │  Phase   │                          │
│  └──────────┘ └──────────┘                          │
│                                                      │
│  frontend/index.html + app.js                        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP POST /assess
                      │ JSON: { symptoms: [...] }
                      ▼
┌─────────────────────────────────────────────────────┐
│              FACT EXTRACTION                         │
│                                                      │
│  Converts user selections to Prolog-compatible       │
│  atom list: [high_fever, nausea_vomiting, ...]       │
│                                                      │
│  backend/main.pl (handle_assess)                     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          PROLOG KNOWLEDGE BASE                       │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  FACTS (F01–F25)                        │        │
│  │                                          │        │
│  │  • Dengue-compatible symptoms (F01–F07)  │        │
│  │  • Warning signs (F08–F14)               │        │
│  │  • Severe dengue facts (F15–F21)         │        │
│  │  • Disease phase facts (F22–F25)         │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  RULES (R01–R31)                        │        │
│  │                                          │        │
│  │  • Probable dengue (R01–R07)             │        │
│  │  • Warning signs (R08–R14)               │        │
│  │  • Dengue + warning signs (R15–R21)      │        │
│  │  • Severe dengue (R22–R28)               │        │
│  │  • Critical phase (R29–R31)              │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  backend/knowledge_base.pl                           │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            INFERENCE ENGINE                          │
│                                                      │
│  1. Clear previous patient facts                     │
│  2. Assert current patient facts (dynamic)           │
│  3. Evaluate all rules via backward chaining         │
│  4. Collect triggered rules with explanations        │
│  5. Determine primary assessment (priority)          │
│  6. Clear patient facts                              │
│                                                      │
│  backend/inference_engine.pl                         │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           DERIVED CONCLUSIONS                        │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │  Probable   │ │  Warning   │ │  Severe    │      │
│  │  Dengue     │ │  Signs     │ │  Dengue    │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│  ┌────────────┐ ┌────────────┐                      │
│  │  Critical   │ │  Urgent    │                      │
│  │  Phase      │ │  Assessment│                      │
│  └────────────┘ └────────────┘                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│         DECISION EXPLANATION                         │
│                                                      │
│  • Rule ID (R01, R02, ...)                           │
│  • IF conditions satisfied                           │
│  • THEN conclusion derived                           │
│  • Patient facts that matched                        │
│                                                      │
│  knowledge_base.pl (triggered_rule/2)                │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP JSON Response
                      ▼
┌─────────────────────────────────────────────────────┐
│              GUI RESULT DISPLAY                      │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │  Assessment: Dengue with Warning Signs    │       │
│  └──────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────┐       │
│  │  Triggered Rules: R01, R09, R16           │       │
│  └──────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────┐       │
│  │  Why This Result?                         │       │
│  │  Step 1: Facts received...                │       │
│  │  Step 2: Rules evaluated...               │       │
│  │  Step 3: Conclusion derived...            │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  frontend/index.html (results section)               │
└─────────────────────────────────────────────────────┘
```

## Data Flow Summary

```
User Input → JSON → Prolog Facts → Rule Evaluation → Conclusions → JSON → GUI Display
```

## Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| Patient Input Form | `frontend/index.html`, `frontend/app.js` | Collect patient data, send to backend, display results |
| HTTP Server | `backend/main.pl` | REST API endpoints, JSON parsing, CORS |
| Knowledge Base | `backend/knowledge_base.pl` | Facts (F01–F25), Rules (R01–R31), rule descriptions |
| Inference Engine | `backend/inference_engine.pl` | Dynamic fact management, rule evaluation, result formatting |
| Test Suite | `tests/test_cases.pl` | Automated verification of inference correctness |

## Key Design Decisions

1. **Prolog for inference**: All clinical decision logic resides in SWI-Prolog. The frontend performs zero clinical reasoning.
2. **Dynamic facts**: Patient facts are asserted/retracted per assessment session using `assertz/retractall`, preventing cross-contamination between assessments.
3. **Backward chaining**: SWI-Prolog naturally uses backward chaining (goal-driven reasoning). When the system checks if `probable_dengue` holds, Prolog works backward through the rules to see if the conditions are met by the asserted patient facts.
4. **Display priority**: The primary assessment shown to the user follows a priority hierarchy (Severe > Urgent > Warning Signs > Probable > Critical-Phase > None). This is a display convention, not a medical rule.
