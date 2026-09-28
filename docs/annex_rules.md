# ANNEX A — Complete Knowledge Base

## Facts (F01–F25)

### A. Dengue-Suspected Clinical Facts

| Fact ID | Description | Prolog Representation |
|---------|-------------|----------------------|
| F01 | Dengue commonly presents with high fever | `patient_fact(high_fever)` |
| F02 | Severe headache can occur in dengue | `patient_fact(severe_headache)` |
| F03 | Pain behind the eyes can occur in dengue | `patient_fact(pain_behind_eyes)` |
| F04 | Muscle and joint pain can occur in dengue | `patient_fact(muscle_joint_pain)` |
| F05 | Nausea and vomiting can occur in dengue | `patient_fact(nausea_vomiting)` |
| F06 | Skin rash can occur in dengue | `patient_fact(skin_rash)` |
| F07 | Dengue illness commonly lasts 2–7 days | `illness_duration_days(2, 7)` |

### B. Warning-Sign Facts

| Fact ID | Description | Prolog Representation |
|---------|-------------|----------------------|
| F08 | Abdominal pain/tenderness is a warning sign | `patient_fact(abdominal_pain)` |
| F09 | Persistent vomiting is a warning sign | `patient_fact(persistent_vomiting)` |
| F10 | Clinical fluid accumulation is a warning sign | `patient_fact(clinical_fluid_accumulation)` |
| F11 | Mucosal bleeding is a warning sign | `patient_fact(mucosal_bleeding)` |
| F12 | Lethargy or restlessness is a warning sign | `patient_fact(lethargy)`, `patient_fact(restlessness)` |
| F13 | Liver enlargement >2 cm is a warning sign | `patient_fact(liver_enlargement_over_2cm)` |
| F14 | Increased haematocrit + rapid platelet decrease | `patient_fact(increased_haematocrit)`, `patient_fact(rapid_platelet_decrease)` |

### C. Severe Dengue Facts

| Fact ID | Description | Prolog Representation |
|---------|-------------|----------------------|
| F15 | Severe plasma leakage | `patient_fact(severe_plasma_leakage)` |
| F16 | Shock from severe plasma leakage | `patient_fact(shock)` |
| F17 | Respiratory distress + fluid accumulation | `patient_fact(respiratory_distress)`, `patient_fact(clinical_fluid_accumulation)` |
| F18 | Severe bleeding | `patient_fact(severe_bleeding)` |
| F19 | Severe organ impairment | `patient_fact(severe_organ_impairment)` |
| F20 | AST/ALT ≥ 1000 (severe liver involvement) | `patient_fact(ast_alt_1000_or_more)` |
| F21 | Impaired consciousness (severe CNS involvement) | `patient_fact(impaired_consciousness)` |

### D. Disease-Phase Facts

| Fact ID | Description | Prolog Representation |
|---------|-------------|----------------------|
| F22 | Critical phase around 3–7 days after onset | `critical_phase_day_range(3, 7)` |
| F23 | Temperature decrease ≠ recovery during critical phase | `patient_fact(temperature_decreasing)` |
| F24 | Warning signs at phase transition | `patient_fact(warning_sign_transition_period)` |
| F25 | Severe dengue requires immediate medical care | Decision-support concept |

---

# ANNEX B — Complete Decision-Making Rules (R01–R31)

## Part 1: Probable Dengue Rules (R01–R07)

| Rule ID | IF Conditions | THEN Conclusion | Prolog Implementation |
|---------|--------------|-----------------|----------------------|
| R01 | High fever AND nausea/vomiting AND skin rash | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(nausea_vomiting), patient_fact(skin_rash).` |
| R02 | High fever AND nausea/vomiting AND muscle/joint pain | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(nausea_vomiting), patient_fact(muscle_joint_pain).` |
| R03 | High fever AND nausea/vomiting AND leucopenia | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(nausea_vomiting), patient_fact(leucopenia).` |
| R04 | High fever AND skin rash AND muscle/joint pain | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(skin_rash), patient_fact(muscle_joint_pain).` |
| R05 | High fever AND skin rash AND leucopenia | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(skin_rash), patient_fact(leucopenia).` |
| R06 | High fever AND muscle/joint pain AND leucopenia | Probable Dengue | `probable_dengue :- patient_fact(high_fever), patient_fact(muscle_joint_pain), patient_fact(leucopenia).` |
| R07 | High fever AND any warning sign | Probable Dengue | `probable_dengue :- patient_fact(high_fever), warning_sign.` |

## Part 2: Warning Sign Rules (R08–R14)

| Rule ID | IF Conditions | THEN Conclusion | Prolog Implementation |
|---------|--------------|-----------------|----------------------|
| R08 | Abdominal pain/tenderness | Warning sign present | `warning_sign :- patient_fact(abdominal_pain).` |
| R09 | Persistent vomiting | Warning sign present | `warning_sign :- patient_fact(persistent_vomiting).` |
| R10 | Clinical fluid accumulation | Warning sign present | `warning_sign :- patient_fact(clinical_fluid_accumulation).` |
| R11 | Mucosal bleeding | Warning sign present | `warning_sign :- patient_fact(mucosal_bleeding).` |
| R12 | Lethargy OR restlessness | Warning sign present | `warning_sign :- patient_fact(lethargy).` / `warning_sign :- patient_fact(restlessness).` |
| R13 | Liver enlargement >2 cm | Warning sign present | `warning_sign :- patient_fact(liver_enlargement_over_2cm).` |
| R14 | Increased haematocrit AND rapid platelet decrease | Warning sign present | `warning_sign :- patient_fact(increased_haematocrit), patient_fact(rapid_platelet_decrease).` |

## Part 3: Dengue with Warning Signs Rules (R15–R21)

| Rule ID | IF Conditions | THEN Conclusion | Prolog Implementation |
|---------|--------------|-----------------|----------------------|
| R15 | Probable dengue AND abdominal pain | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R08) |
| R16 | Probable dengue AND persistent vomiting | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R09) |
| R17 | Probable dengue AND clinical fluid accumulation | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R10) |
| R18 | Probable dengue AND mucosal bleeding | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R11) |
| R19 | Probable dengue AND lethargy/restlessness | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R12) |
| R20 | Probable dengue AND liver enlargement >2 cm | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R13) |
| R21 | Probable dengue AND increased haematocrit AND rapid platelet decrease | Dengue with Warning Signs | `dengue_with_warning_signs :- probable_dengue, warning_sign.` (via R14) |

**Implementation Note:** Rules R15–R21 are implemented through the general rule `dengue_with_warning_signs :- probable_dengue, warning_sign.` which covers all specific warning sign combinations. Each specific rule (R15–R21) is individually tracked by the triggered rule detection system for traceability.

## Part 4: Severe Dengue Rules (R22–R28)

| Rule ID | IF Conditions | THEN Conclusion | Prolog Implementation |
|---------|--------------|-----------------|----------------------|
| R22 | Severe plasma leakage | Severe Dengue | `severe_dengue :- patient_fact(severe_plasma_leakage).` |
| R23 | Severe bleeding | Severe Dengue | `severe_dengue :- patient_fact(severe_bleeding).` |
| R24 | Severe organ impairment | Severe Dengue | `severe_dengue :- patient_fact(severe_organ_impairment).` |
| R25 | Severe plasma leakage AND shock | Severe Dengue | `severe_dengue :- patient_fact(severe_plasma_leakage), patient_fact(shock).` |
| R26 | Severe plasma leakage AND fluid accumulation AND respiratory distress | Severe Dengue | `severe_dengue :- patient_fact(severe_plasma_leakage), patient_fact(clinical_fluid_accumulation), patient_fact(respiratory_distress).` |
| R27 | AST/ALT ≥ 1000 | Severe Dengue | `severe_dengue :- patient_fact(ast_alt_1000_or_more).` |
| R28 | Impaired consciousness | Severe Dengue | `severe_dengue :- patient_fact(impaired_consciousness).` |

## Part 5: Critical Phase Rules (R29–R31)

| Rule ID | IF Conditions | THEN Conclusion | Prolog Implementation |
|---------|--------------|-----------------|----------------------|
| R29 | Day of illness 3–7 AND temperature decreasing | Critical-phase monitoring required | `critical_phase_monitoring :- day_of_illness(Day), critical_phase_day_range(Start, End), Day >= Start, Day =< End, patient_fact(temperature_decreasing).` |
| R30 | Day of illness 3–7 AND warning sign present | Urgent medical assessment required | `urgent_medical_assessment :- day_of_illness(Day), critical_phase_day_range(Start, End), Day >= Start, Day =< End, warning_sign.` |
| R31 | Temperature decreasing AND warning signs appear | Not recovery; urgent assessment required | `not_recovery_despite_temp_decrease :- patient_fact(temperature_decreasing), warning_sign.` / `urgent_medical_assessment :- not_recovery_despite_temp_decrease.` |

---

# ANNEX C — Important Source Statements / Traceability

## Source Identification

All facts and rules implemented in this Expert System are derived from published dengue clinical guidance:

1. **Primary Source:** Sri Lanka National Dengue Control Unit, *"National Guidelines on Management of Dengue Fever & Dengue Haemorrhagic Fever in Adults – 2024"*, Ministry of Health, Sri Lanka.

2. **Supporting Source:** World Health Organization, *Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control*, WHO, Geneva.

3. **Supporting Source:** World Health Organization, *"Dengue and severe dengue"* WHO Fact Sheet.

## Important Statements

- **No rules were invented** specifically for this implementation. All rules correspond to established dengue clinical classification criteria.
- **No LLM was used** to generate clinical rules. The LLM was used only for code implementation of the supplied rule set.
- **No expert consultation** was conducted. All clinical knowledge is from published guidelines.
- **Page numbers** marked as "Page to be verified from source PDF" indicate that while the clinical content is consistent with the source, the exact page number has not been individually verified against the source PDF.
- **The WHO dengue classification** (Probable Dengue, Dengue with Warning Signs, Severe Dengue) is the foundation of rules R01–R28.
- **Critical phase rules** (R29–R31) are based on clinical guidance about the dengue illness timeline and the importance of monitoring during the critical phase.

## Display Priority Note

The system uses a display priority hierarchy for presenting the primary assessment:

1. Severe Dengue
2. Urgent Medical Assessment Required
3. Dengue with Warning Signs
4. Probable Dengue
5. Critical-Phase Monitoring Required
6. No Supplied Rule Triggered

**This is an output-display convention, NOT a medical rule.** It determines which assessment is shown as the primary result when multiple categories are satisfied simultaneously.
