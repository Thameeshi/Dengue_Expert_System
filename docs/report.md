# Dengue Risk and Warning-Sign Assessment Expert System

## Academic Report

---

## 1. Title Page

**Title:** Dengue Risk and Warning-Sign Assessment Expert System

**Subtitle:** Rule-Based Clinical Decision-Support Prototype

**Type:** Expert Systems Assignment

**Technology:** SWI-Prolog + Web-based GUI

---

## 2. Introduction

Dengue fever is a mosquito-borne viral infection that is endemic in many tropical and subtropical regions, including Sri Lanka. Clinical management of dengue requires rapid assessment of disease severity, as the illness can progress from a mild febrile phase to life-threatening severe dengue.

The **World Health Organization (WHO)** classifies dengue into three categories:
- **Probable Dengue** — Fever with supporting clinical features
- **Dengue with Warning Signs** — Probable dengue with one or more warning signs
- **Severe Dengue** — Dengue with severe plasma leakage, severe bleeding, or severe organ impairment

This classification is well-suited for implementation as a **rule-based Expert System** because:
- The classification follows clear **IF-THEN rules**
- The decision criteria are **well-defined** in published clinical guidelines
- The reasoning process can be made **transparent** (explainable)
- A rule-based system can **consistently** apply the same criteria

This project implements an academic Expert System prototype that encodes the dengue classification rules in **SWI-Prolog** and provides a web-based interface for demonstration purposes.

> **Disclaimer:** This system is an academic Expert System prototype developed for educational purposes. It is not a medical diagnostic tool and does not replace assessment by a qualified healthcare professional.

---

## 3. Problem Definition

### Problem
Clinical assessment of dengue severity requires evaluating multiple symptoms, warning signs, and clinical indicators against established classification criteria. In busy clinical settings, systematically checking all criteria can be challenging.

### What the System Addresses
This Expert System takes patient-provided clinical information and systematically evaluates it against a predefined set of source-derived dengue classification rules. It identifies which risk category the supplied information falls into and explains the reasoning.

### What the System Specializes In
- Dengue risk categorization (Probable Dengue, Warning Signs, Severe Dengue)
- Warning sign identification
- Critical phase monitoring alerts
- Rule-based explanation of the assessment

### What the System Does NOT Do
- It does not diagnose dengue
- It does not provide treatment recommendations
- It does not replace medical professionals
- It does not claim clinical accuracy

---

## 4. Objective

### Main Objective
To develop an academic Expert System that demonstrates rule-based reasoning for dengue risk and warning-sign assessment using SWI-Prolog.

### Specific Objectives
1. Implement a knowledge base containing 25 source-derived clinical facts
2. Implement 31 source-derived classification rules in SWI-Prolog
3. Build an inference engine that evaluates patient data against the rules
4. Provide an explanation facility that shows which rules fired and why
5. Create a web-based GUI for easy demonstration
6. Ensure complete traceability of all rules to published sources

---

## 5. Knowledge Acquisition

### Source of Knowledge
The facts and rules in this Expert System were obtained from **authoritative published dengue clinical guidance**:

1. **Primary Source:** Sri Lanka National Dengue Control Unit, *"National Guidelines on Management of Dengue Fever & Dengue Haemorrhagic Fever in Adults – 2024"*, Ministry of Health, Sri Lanka.

2. **Supporting Source:** World Health Organization, *Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control*.

3. **Supporting Source:** World Health Organization, *"Dengue and severe dengue"* WHO Fact Sheet.

### Important Notes
- **No rules were invented** specifically for this implementation
- **No AI/LLM was used** to generate clinical rules
- **No individual medical expert** was consulted — all knowledge is from published guidelines
- The rules correspond to the established WHO dengue classification system
- See the complete traceability table in ANNEX C

---

## 6. Knowledge Representation

### Facts
Facts represent clinical observations and findings. In this system, patient facts are represented as dynamic Prolog terms:

```prolog
% Example: Patient presents with high fever
patient_fact(high_fever).

% Example: Patient has persistent vomiting
patient_fact(persistent_vomiting).
```

Facts are dynamically asserted at assessment time and retracted afterwards. They are never permanently stored.

Static facts represent reference data:
```prolog
% Dengue illness typically lasts 2–7 days
illness_duration_days(2, 7).

% Critical phase occurs around days 3–7
critical_phase_day_range(3, 7).
```

### IF-THEN Rules
Rules encode the clinical classification logic. Each rule has a set of conditions (IF) and a conclusion (THEN):

**Example — R01 (Probable Dengue):**
```prolog
% R01: IF fever AND nausea/vomiting AND rash THEN probable dengue
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(skin_rash).
```

**Example — R08 (Warning Sign):**
```prolog
% R08: IF abdominal pain THEN warning sign
warning_sign :- patient_fact(abdominal_pain).
```

**Example — R22 (Severe Dengue):**
```prolog
% R22: IF severe plasma leakage THEN severe dengue
severe_dengue :- patient_fact(severe_plasma_leakage).
```

The complete set of 31 rules is documented in ANNEX B.

---

## 7. System Architecture

### Architecture Diagram

```
            PATIENT (User)
               │
               ▼
       Patient Input Form
       (HTML + JavaScript)
               │
               ▼ HTTP POST /assess (JSON)
         Fact Extraction
       (main.pl HTTP handler)
               │
               ▼
    ┌───────────────────────┐
    │   PROLOG KNOWLEDGE    │
    │       BASE            │
    │                       │
    │  Facts F01–F25        │
    │  Rules R01–R31        │
    │                       │
    │  knowledge_base.pl    │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │   INFERENCE ENGINE    │
    │       (PROLOG)        │
    │                       │
    │  Assert patient facts │
    │  Evaluate rules       │
    │  Collect conclusions  │
    │  Generate explanation │
    │                       │
    │  inference_engine.pl  │
    └───────────┬───────────┘
                │
                ▼
      Derived Conclusions
                │
      ┌─────────┼─────────┐
      │         │         │
      ▼         ▼         ▼
  Probable   Warning   Severe
  Dengue     Signs     Dengue
      │         │         │
      └─────────┼─────────┘
                │
                ▼
      Decision Explanation
      (Triggered Rules + Why)
                │
                ▼ HTTP JSON Response
         GUI Result Display
       (HTML + JavaScript)
```

### Component Interaction

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Frontend | HTML, CSS, JavaScript | Collect user input, display results |
| HTTP Server | SWI-Prolog `library(http)` | REST API, JSON processing |
| Knowledge Base | SWI-Prolog | Facts and rules |
| Inference Engine | SWI-Prolog | Fact management, rule evaluation |

---

## 8. Inference Process

### Backward Chaining (Goal-Driven Reasoning)

This system uses SWI-Prolog's native **backward chaining** inference mechanism. When the system needs to determine if a conclusion (e.g., `probable_dengue`) is true, Prolog works backward from the goal through the rules to check if the conditions are satisfied by the asserted patient facts.

**Example:**

Goal: Does `dengue_with_warning_signs` hold?

```
dengue_with_warning_signs?
  └── probable_dengue?
  │     └── patient_fact(high_fever)?        ✓ (asserted)
  │     └── patient_fact(nausea_vomiting)?   ✓ (asserted)
  │     └── patient_fact(skin_rash)?         ✓ (asserted)
  │     └── Result: probable_dengue = TRUE
  └── warning_sign?
        └── patient_fact(persistent_vomiting)? ✓ (asserted)
        └── Result: warning_sign = TRUE
  └── Result: dengue_with_warning_signs = TRUE
```

### Assessment Pipeline

1. **Clear** all previous patient facts (`retractall(patient_fact(_))`)
2. **Assert** current patient facts (`assertz(patient_fact(high_fever))`, etc.)
3. **Evaluate** all rule categories using backward chaining
4. **Collect** all triggered rules with their descriptions
5. **Determine** the primary assessment using display priority
6. **Return** the result with explanations
7. **Clear** patient facts for the next assessment

---

## 9. System Implementation

### SWI-Prolog Backend

The backend consists of three Prolog files:

- **`knowledge_base.pl`** — Contains all 25 facts and 31 rules, plus rule description metadata and triggered rule detection
- **`inference_engine.pl`** — Manages dynamic patient facts, runs the assessment pipeline, and formats results
- **`main.pl`** — HTTP server providing REST API endpoints

### HTTP API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assess` | POST | Run patient assessment |
| `/health` | GET | Health check |
| `/rules` | GET | List all rule descriptions |

### GUI

The frontend uses vanilla HTML, CSS, and JavaScript:
- **`index.html`** — Patient input form with 5 sections + results display
- **`style.css`** — Professional dark-themed styling
- **`app.js`** — Form data collection, HTTP communication, result rendering

**Important:** The frontend contains **zero clinical decision logic**. All reasoning is performed by the Prolog backend.

### Communication

```
Frontend (JavaScript)
    ↓ HTTP POST /assess
    ↓ Content-Type: application/json
    ↓ Body: { patient_id, day_of_illness, symptoms[] }
Backend (SWI-Prolog)
    ↓ Parse JSON
    ↓ Assert patient facts
    ↓ Run inference
    ↓ Collect triggered rules
    ↓ Format JSON response
    ↓ Return to frontend
Frontend (JavaScript)
    ↓ Display results
```

---

## 10. User Interface

### Patient Input Form
The GUI presents 5 sections for data entry:
1. **Patient Information** — Reference ID and day of illness
2. **Dengue-Compatible Symptoms** — 7 checkboxes (F01–F06 + leucopenia)
3. **Warning Signs** — 9 checkboxes (F08–F14)
4. **Severe Dengue Indicators** — 7 checkboxes (F15–F21)
5. **Temperature / Disease Phase** — 2 checkboxes (F23–F24)

### Assessment Result Display
After clicking "Run Assessment", the GUI shows:
1. **Primary Assessment** — Color-coded badge (Severe=red, Warning=orange, Probable=blue)
2. **Categories Evaluated** — All 5 categories with active/inactive status
3. **Triggered Rules** — Each rule with ID, description, conditions, and conclusion
4. **Why This Result?** — Step-by-step explanation of the inference process
5. **Patient Facts Submitted** — The exact data sent to Prolog

---

## 11. Test Cases

| Test # | Input Facts | Expected Primary Assessment | Expected Key Rules | Result |
|--------|-------------|---------------------------|-------------------|--------|
| 1 | high_fever, nausea_vomiting, skin_rash | Probable Dengue | R01 | ✓ |
| 2 | high_fever, nausea_vomiting, muscle_joint_pain | Probable Dengue | R02 | ✓ |
| 3 | high_fever, nausea_vomiting, skin_rash, persistent_vomiting | Dengue with Warning Signs | R09, R16 | ✓ |
| 4 | high_fever, nausea_vomiting, skin_rash, mucosal_bleeding | Dengue with Warning Signs | R11, R18 | ✓ |
| 5 | severe_plasma_leakage, shock | Severe Dengue | R22, R25 | ✓ |
| 6 | ast_alt_1000_or_more | Severe Dengue | R27 | ✓ |
| 7 | day_of_illness(5), temperature_decreasing | Critical-Phase Monitoring Required | R29 | ✓ |
| 8 | day_of_illness(5), abdominal_pain | Urgent Medical Assessment Required | R30 | ✓ |

Tests can be run automatically:
```bash
swipl -g run_all_tests -g halt tests/test_cases.pl
```

---

## 12. How to Run Locally

### Prerequisites
- SWI-Prolog (version 8.x or later)
- Modern web browser

### Step-by-Step

1. **Install SWI-Prolog:**
   ```bash
   # macOS
   brew install swi-prolog
   
   # Ubuntu/Debian
   sudo apt-get install swi-prolog
   
   # Windows: download from https://www.swi-prolog.org/download/stable
   ```

2. **Navigate to the project directory:**
   ```bash
   cd Dengue_ES
   ```

3. **Start the Prolog backend:**
   ```bash
   swipl backend/main.pl
   ```
   The server starts on port 8060.

4. **Open the frontend:**
   Open `frontend/index.html` in a web browser (directly or via a local HTTP server).

5. **Run an example assessment:**
   - Select: High Fever, Nausea/Vomiting, Skin Rash
   - Click "Run Assessment"
   - View result: Probable Dengue (Rule R01)

6. **Run automated tests:**
   ```bash
   swipl -g run_all_tests -g halt tests/test_cases.pl
   ```

---

## 13. Limitations

1. **Academic prototype** — This system is designed for educational purposes and is not validated for clinical use.
2. **Not a medical diagnostic system** — The system applies predefined rules but does not diagnose dengue.
3. **Limited to encoded rules** — Only 31 rules and 25 facts are implemented; the system cannot reason beyond these.
4. **No learning capability** — The system does not adapt or learn from new data.
5. **Does not replace healthcare professionals** — Medical assessment should always be performed by qualified professionals.
6. **No treatment recommendations** — The system does not provide treatment guidance.
7. **Source verification pending** — Some exact page numbers from the primary source require individual verification.

---

## 14. Conclusion

This project demonstrates the application of Expert System technology to the domain of dengue risk assessment. By implementing the WHO-aligned dengue classification rules in SWI-Prolog, the system shows how rule-based reasoning can be used for clinical decision support.

Key achievements:
- **31 source-derived rules** successfully implemented in Prolog
- **Transparent reasoning** — every conclusion is explained through triggered rules
- **Clean separation** — clinical logic resides entirely in Prolog, not in the frontend
- **Complete traceability** — all rules are mapped to published clinical sources
- **Automated testing** — 8 test scenarios verify correctness

The system serves as a useful demonstration of how Expert Systems can provide structured, explainable decision support in healthcare domains, while clearly acknowledging the limitations of such academic prototypes.

---

## 15. References

1. Sri Lanka National Dengue Control Unit. *National Guidelines on Management of Dengue Fever & Dengue Haemorrhagic Fever in Adults – 2024*. Ministry of Health, Sri Lanka.

2. World Health Organization. *Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control*. WHO, Geneva.

3. World Health Organization. *"Dengue and severe dengue"*. WHO Fact Sheet. Available at: https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue

4. Wielenga, J. et al. *SWI-Prolog Reference Manual*. Available at: https://www.swi-prolog.org/pldoc/

---

## ANNEX A — Complete Knowledge Base

See [annex_rules.md — ANNEX A](annex_rules.md#annex-a--complete-knowledge-base)

## ANNEX B — Complete Decision-Making Rules R01–R31

See [annex_rules.md — ANNEX B](annex_rules.md#annex-b--complete-decision-making-rules-r01r31)

## ANNEX C — Important Source Statements / Traceability

See [annex_rules.md — ANNEX C](annex_rules.md#annex-c--important-source-statements--traceability)

See also: [sources.md](sources.md) for the complete rule traceability table.
