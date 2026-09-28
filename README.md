# Dengue Risk and Warning-Sign Assessment Expert System

## Description

This is an **academic Expert System prototype** that applies source-derived dengue clinical rules to user-supplied patient information. The system uses **SWI-Prolog** as the knowledge representation and inference engine, with a web-based GUI for demonstration.

The system determines whether the supplied information indicates:

- **Probable Dengue**
- **Dengue with Warning Signs**
- **Severe Dengue**
- **Critical-Phase Monitoring Required**
- **Urgent Medical Assessment Required**

> ⚠️ **Academic Disclaimer:** This system is an academic Expert System prototype developed for educational purposes. It applies a predefined set of source-derived dengue clinical rules to the information entered by the user. It is **not** a medical diagnostic tool and does **not** replace assessment by a qualified healthcare professional. If severe or concerning symptoms are present, the user should seek appropriate medical care.

---

## Features

- **31 source-derived clinical rules** (R01–R31)
- **25 clinical facts** (F01–F25)
- **SWI-Prolog inference engine** with backward chaining
- **Rule explanation facility** — the system shows which rules fired and why
- **Dynamic patient fact management** — facts are asserted/retracted per session
- **Web-based GUI** for easy demonstration
- **Automated test cases** (8 test scenarios)
- **Complete rule traceability** to published clinical guidelines

---

## Knowledge Sources

| Source Type | Reference |
|---|---|
| **Primary Source** | Sri Lanka National Dengue Control Unit, *"National Guidelines on Management of Dengue Fever & Dengue Haemorrhagic Fever in Adults – 2024"* |
| **Supporting Source** | World Health Organization (WHO), Dengue clinical classification and guidance |
| **Supporting Source** | WHO, *"Dengue and severe dengue"* information |

All facts and rules are derived from the above sources. No rules were invented for this implementation.

---

## Technology Stack

| Component | Technology |
|---|---|
| Knowledge Base & Inference Engine | SWI-Prolog |
| HTTP Server | SWI-Prolog `library(http)` |
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Communication | REST API (JSON over HTTP) |

---

## Project Structure

```
Dengue_ES/
├── backend/
│   ├── knowledge_base.pl      # Facts (F01–F25) and Rules (R01–R31)
│   ├── inference_engine.pl    # Dynamic fact management & inference
│   └── main.pl                # HTTP server (REST API)
├── frontend/
│   ├── index.html             # Patient input form & results display
│   ├── style.css              # Professional dark-theme styling
│   └── app.js                 # Form handling & API communication
├── tests/
│   └── test_cases.pl          # 8 automated test scenarios
├── docs/
│   ├── README.md              # This file (duplicate for /docs)
│   ├── report.md              # Complete academic report
│   ├── sources.md             # Source traceability document
│   ├── system_diagram.md      # System architecture diagram
│   └── annex_rules.md         # Complete rule annex (R01–R31)
└── README.md                  # Project README (this file)
```

---

## Requirements

- **SWI-Prolog** (version 8.x or later) — [https://www.swi-prolog.org/](https://www.swi-prolog.org/)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- No Node.js, npm, or database required
- No API keys required

### Installing SWI-Prolog

**macOS (Homebrew):**
```bash
brew install swi-prolog
```

**Ubuntu/Debian:**
```bash
sudo apt-get install swi-prolog
```

**Windows:**
Download from [https://www.swi-prolog.org/download/stable](https://www.swi-prolog.org/download/stable)

---

## Installation

1. **Clone or extract the project:**
   ```bash
   git clone <repository-url>
   cd Dengue_ES
   ```

2. **Verify SWI-Prolog is installed:**
   ```bash
   swipl --version
   ```

---

## Running the Prolog Engine (Backend)

1. **Open a terminal** and navigate to the project root:
   ```bash
   cd Dengue_ES
   ```

2. **Start the Prolog HTTP server:**
   ```bash
   swipl backend/main.pl
   ```

3. You should see:
   ```
   ========================================
     Dengue Risk & Warning-Sign Assessment
     Expert System — Prolog Backend
   ========================================
     Starting HTTP server on port 8060...
     Server running at http://localhost:8060
     Endpoints:
       POST /assess  — Run patient assessment
       GET  /health  — Health check
       GET  /rules   — List all rules
   ========================================
   ```

4. **Verify the server is running:**
   ```bash
   curl http://localhost:8060/health
   ```
   Expected response:
   ```json
   {"status":"ok","system":"Dengue Risk and Warning-Sign Assessment Expert System","engine":"SWI-Prolog"}
   ```

---

## Running the Frontend

1. **Keep the Prolog backend running** in one terminal.

2. **Open the frontend** in a browser:
   - Simply open `frontend/index.html` directly in a browser, **OR**
   - Use a simple HTTP server:
     ```bash
     # Python 3
     cd frontend
     python3 -m http.server 8080
     # Then open http://localhost:8080
     ```

3. The GUI will load in your browser.

---

## Using the System

### Example Assessment

1. Open the GUI in your browser.
2. Enter a Patient/Reference ID (e.g., `P001`).
3. Set Day of Illness to `5`.
4. Select the following symptoms:
   - ☑ **High Fever**
   - ☑ **Nausea / Vomiting**
   - ☑ **Skin Rash**
5. Click **Run Assessment**.
6. The system derives: **Probable Dengue**.
7. View the triggered rules:
   - **R01** — IF fever AND nausea/vomiting AND rash THEN probable dengue
8. View the step-by-step explanation.

### Example with Warning Signs

1. In addition to the above, also select:
   - ☑ **Persistent Vomiting**
2. Click **Run Assessment**.
3. The system derives: **Dengue with Warning Signs**.
4. Triggered rules include:
   - **R01** — Probable Dengue
   - **R09** — Warning Sign (persistent vomiting)
   - **R16** — Dengue with Warning Signs

---

## Testing

### Running Automated Tests

```bash
cd Dengue_ES
swipl -g run_all_tests -g halt tests/test_cases.pl
```

Expected output:
```
================================================
  DENGUE EXPERT SYSTEM — AUTOMATED TESTS
================================================

Test 1: Probable Dengue (R01: fever + nausea/vomiting + rash)
  ...
  Result: PASS

Test 2: Probable Dengue (R02: fever + nausea/vomiting + aches)
  ...
  Result: PASS

...

================================================
  TEST SUMMARY
================================================
  Total:  8
  Passed: 8
  Failed: 0
================================================

  ALL TESTS PASSED!
```

### Test Scenarios

| Test | Input | Expected Result | Key Rules |
|------|-------|----------------|-----------|
| 1 | High fever + nausea/vomiting + rash | Probable Dengue | R01 |
| 2 | High fever + nausea/vomiting + muscle/joint pain | Probable Dengue | R02 |
| 3 | Probable dengue + persistent vomiting | Dengue with Warning Signs | R09, R16 |
| 4 | Probable dengue + mucosal bleeding | Dengue with Warning Signs | R11, R18 |
| 5 | Severe plasma leakage + shock | Severe Dengue | R22, R25 |
| 6 | AST/ALT ≥ 1000 | Severe Dengue | R27 |
| 7 | Day 5 + decreasing temperature | Critical-Phase Monitoring | R29 |
| 8 | Day 5 + abdominal pain | Urgent Medical Assessment | R30 |

---

## API Reference

### POST /assess

Run a patient assessment.

**Request:**
```json
{
    "patient_id": "P001",
    "day_of_illness": 5,
    "symptoms": ["high_fever", "nausea_vomiting", "skin_rash"]
}
```

**Response:**
```json
{
    "patient_id": "P001",
    "primary_assessment": "Probable Dengue",
    "categories": {
        "severe_dengue": false,
        "urgent_assessment": false,
        "dengue_warning_signs": false,
        "probable_dengue": true,
        "critical_phase": false
    },
    "triggered_rules": [
        {
            "rule_id": "r01",
            "description": "IF fever AND nausea/vomiting AND rash THEN probable dengue",
            "conditions": ["high_fever", "nausea_vomiting", "skin_rash"],
            "conclusion": "probable_dengue"
        }
    ],
    "patient_facts": ["high_fever", "nausea_vomiting", "skin_rash"],
    "disclaimer": "This system is an academic Expert System prototype..."
}
```

### GET /health

Health check endpoint.

### GET /rules

Returns all 31 rule descriptions.

---

## Source Traceability

All facts and rules are derived from the following sources:

1. **Primary:** Sri Lanka National Dengue Control Unit, *"National Guidelines on Management of Dengue Fever & Dengue Haemorrhagic Fever in Adults – 2024"*
2. **Supporting:** WHO dengue clinical classification and guidance

See [docs/sources.md](docs/sources.md) for the complete rule traceability table.

See [docs/annex_rules.md](docs/annex_rules.md) for the complete rule annex (R01–R31).

---

## Limitations

- This is an **academic prototype** for educational purposes only.
- It is **not** a medical diagnostic system.
- The system is limited to the 31 encoded rules and 25 facts.
- It does **not** replace assessment by qualified healthcare professionals.
- It does **not** provide treatment recommendations.
- It uses a predefined rule set and does not learn or adapt.

---

## Academic Disclaimer

This system is an academic Expert System prototype developed for educational purposes. It applies a predefined set of source-derived dengue clinical rules to the information entered by the user. It is **not** a medical diagnostic tool and does **not** replace assessment by a qualified healthcare professional. If severe or concerning symptoms are present, the user should seek appropriate medical care.

---

## License

This project is developed for academic purposes as part of a university assignment.
