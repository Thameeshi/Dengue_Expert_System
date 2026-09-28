% ============================================================
% knowledge_base.pl
% Dengue Risk and Warning-Sign Assessment Expert System
%
% Knowledge Base: Source-Derived Facts and Rules
%
% PRIMARY SOURCE:
%   Sri Lanka National Dengue Control Unit,
%   "National Guidelines on Management of Dengue Fever &
%    Dengue Haemorrhagic Fever in Adults – 2024"
%
% SUPPORTING SOURCES:
%   World Health Organization (WHO) dengue clinical
%   classification and guidance.
%
% IMPORTANT:
%   All facts and rules are derived from the above sources.
%   No rules have been invented for this implementation.
%   This system is an academic prototype and does NOT
%   diagnose dengue. It applies predefined clinical rules
%   to user-supplied information for educational purposes.
% ============================================================

:- module(knowledge_base, [
    % Fact predicates (definitions)
    illness_duration_days/2,
    critical_phase_day_range/2,

    % Rule predicates
    probable_dengue/0,
    warning_sign/0,
    dengue_with_warning_signs/0,
    severe_dengue/0,
    critical_phase_monitoring/0,
    urgent_medical_assessment/0,
    not_recovery_despite_temp_decrease/0,

    % Explanation predicates
    triggered_rule/2,
    rule_description/4,
    all_triggered_rules/1
]).

:- use_module(library(lists)).

% Dynamic patient facts imported/referenced
:- dynamic inference_engine:patient_fact/1.
:- dynamic inference_engine:day_of_illness/1.
patient_fact(X) :- inference_engine:patient_fact(X).
day_of_illness(X) :- inference_engine:day_of_illness(X).


% ============================================================
% SECTION A: DENGUE-SUSPECTED CLINICAL FACTS (F01–F07)
% ============================================================
% These facts define the clinical presentations commonly
% associated with dengue. They are asserted dynamically
% via patient_fact/1 during an assessment session.
%
% F01: Dengue commonly presents with high fever.
%      -> patient_fact(high_fever)
%
% F02: Severe headache can occur in dengue.
%      -> patient_fact(severe_headache)
%
% F03: Pain behind the eyes can occur in dengue.
%      -> patient_fact(pain_behind_eyes)
%
% F04: Muscle and joint pain can occur in dengue.
%      -> patient_fact(muscle_joint_pain)
%
% F05: Nausea and vomiting can occur in dengue.
%      -> patient_fact(nausea_vomiting)
%
% F06: Skin rash can occur in dengue.
%      -> patient_fact(skin_rash)
%
% F07: Dengue illness commonly lasts about 2–7 days.

illness_duration_days(2, 7).


% ============================================================
% SECTION B: WARNING-SIGN FACTS (F08–F14)
% ============================================================
% These facts represent dengue warning signs. They are
% asserted via patient_fact/1 during assessment.
%
% F08: Abdominal pain/tenderness   -> patient_fact(abdominal_pain)
% F09: Persistent vomiting         -> patient_fact(persistent_vomiting)
% F10: Clinical fluid accumulation  -> patient_fact(clinical_fluid_accumulation)
% F11: Mucosal bleeding            -> patient_fact(mucosal_bleeding)
% F12: Lethargy or restlessness    -> patient_fact(lethargy)
%                                     patient_fact(restlessness)
% F13: Liver enlargement >2cm      -> patient_fact(liver_enlargement_over_2cm)
% F14: Increased haematocrit +
%      rapid platelet decrease     -> patient_fact(increased_haematocrit)
%                                     patient_fact(rapid_platelet_decrease)


% ============================================================
% SECTION C: SEVERE DENGUE FACTS (F15–F21)
% ============================================================
% F15: Severe plasma leakage       -> patient_fact(severe_plasma_leakage)
% F16: Shock                       -> patient_fact(shock)
% F17: Respiratory distress +
%      fluid accumulation          -> patient_fact(respiratory_distress)
%                                     patient_fact(clinical_fluid_accumulation)
% F18: Severe bleeding             -> patient_fact(severe_bleeding)
% F19: Severe organ impairment     -> patient_fact(severe_organ_impairment)
% F20: AST/ALT >= 1000            -> patient_fact(ast_alt_1000_or_more)
% F21: Impaired consciousness      -> patient_fact(impaired_consciousness)


% ============================================================
% SECTION D: DISEASE-PHASE FACTS (F22–F25)
% ============================================================
% F22: Critical phase occurs around 3–7 days after first symptoms.

critical_phase_day_range(3, 7).

% F23: Temperature decreasing during critical phase does not
%      necessarily mean recovery.
%      -> patient_fact(temperature_decreasing)
%
% F24: Warning signs can occur around the transition to
%      critical phase.
%      -> patient_fact(warning_sign_transition_period)
%
% F25: Patients with severe dengue symptoms require
%      immediate medical care.
%      (Represented as a decision-support concept in the rules.)


% ============================================================
% RULES — PART 1: PROBABLE DENGUE (R01–R07)
% ============================================================

% R01: IF fever AND nausea/vomiting AND rash THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(skin_rash).

% R02: IF fever AND nausea/vomiting AND aches/pains THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(muscle_joint_pain).

% R03: IF fever AND nausea/vomiting AND leucopenia THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(leucopenia).

% R04: IF fever AND rash AND aches/pains THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(skin_rash),
    patient_fact(muscle_joint_pain).

% R05: IF fever AND rash AND leucopenia THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(skin_rash),
    patient_fact(leucopenia).

% R06: IF fever AND aches/pains AND leucopenia THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    patient_fact(muscle_joint_pain),
    patient_fact(leucopenia).

% R07: IF fever AND any warning sign THEN probable dengue.
probable_dengue :-
    patient_fact(high_fever),
    warning_sign.


% ============================================================
% RULES — PART 2: WARNING SIGNS (R08–R14)
% ============================================================

% R08: IF abdominal pain/tenderness THEN warning sign present.
warning_sign :- patient_fact(abdominal_pain).

% R09: IF persistent vomiting THEN warning sign present.
warning_sign :- patient_fact(persistent_vomiting).

% R10: IF clinical fluid accumulation THEN warning sign present.
warning_sign :- patient_fact(clinical_fluid_accumulation).

% R11: IF mucosal bleeding THEN warning sign present.
warning_sign :- patient_fact(mucosal_bleeding).

% R12: IF lethargy OR restlessness THEN warning sign present.
warning_sign :- patient_fact(lethargy).
warning_sign :- patient_fact(restlessness).

% R13: IF liver enlargement >2 cm THEN warning sign present.
warning_sign :- patient_fact(liver_enlargement_over_2cm).

% R14: IF increased haematocrit AND rapid decrease in platelet count
%      THEN warning sign present.
warning_sign :-
    patient_fact(increased_haematocrit),
    patient_fact(rapid_platelet_decrease).


% ============================================================
% RULES — PART 3: DENGUE WITH WARNING SIGNS (R15–R21)
% ============================================================
% General rule: IF probable dengue AND warning sign
%               THEN dengue with warning signs.
%
% The specific rules R15–R21 are documented in the annex
% and each corresponds to a specific warning sign
% combined with probable dengue.

% R15: IF probable dengue AND abdominal pain THEN dengue with warning signs.
% R16: IF probable dengue AND persistent vomiting THEN dengue with warning signs.
% R17: IF probable dengue AND clinical fluid accumulation THEN dengue with warning signs.
% R18: IF probable dengue AND mucosal bleeding THEN dengue with warning signs.
% R19: IF probable dengue AND lethargy/restlessness THEN dengue with warning signs.
% R20: IF probable dengue AND liver enlargement >2cm THEN dengue with warning signs.
% R21: IF probable dengue AND increased haematocrit AND rapidly falling platelets
%      THEN dengue with warning signs.

dengue_with_warning_signs :-
    probable_dengue,
    warning_sign.


% ============================================================
% RULES — PART 4: SEVERE DENGUE (R22–R28)
% ============================================================

% R22: IF severe plasma leakage THEN severe dengue.
severe_dengue :- patient_fact(severe_plasma_leakage).

% R23: IF severe bleeding THEN severe dengue.
severe_dengue :- patient_fact(severe_bleeding).

% R24: IF severe organ impairment THEN severe dengue.
severe_dengue :- patient_fact(severe_organ_impairment).

% R25: IF severe plasma leakage AND shock THEN severe dengue.
severe_dengue :-
    patient_fact(severe_plasma_leakage),
    patient_fact(shock).

% R26: IF severe plasma leakage AND fluid accumulation AND
%      respiratory distress THEN severe dengue.
severe_dengue :-
    patient_fact(severe_plasma_leakage),
    patient_fact(clinical_fluid_accumulation),
    patient_fact(respiratory_distress).

% R27: IF AST/ALT >= 1000 THEN severe dengue.
severe_dengue :- patient_fact(ast_alt_1000_or_more).

% R28: IF impaired consciousness THEN severe dengue.
severe_dengue :- patient_fact(impaired_consciousness).


% ============================================================
% RULES — PART 5: CRITICAL PHASE (R29–R31)
% ============================================================

% R29: IF day of illness is 3–7 AND temperature is decreasing
%      THEN critical-phase monitoring required.
critical_phase_monitoring :-
    day_of_illness(Day),
    critical_phase_day_range(Start, End),
    Day >= Start,
    Day =< End,
    patient_fact(temperature_decreasing).

% R30: IF day of illness is 3–7 AND warning sign is present
%      THEN urgent medical assessment required.
urgent_medical_assessment :-
    day_of_illness(Day),
    critical_phase_day_range(Start, End),
    Day >= Start,
    Day =< End,
    warning_sign.

urgent_medical_assessment :-
    not_recovery_despite_temp_decrease.

% R31: IF temperature decreases AND warning signs appear
%      THEN do not classify as recovery; urgent assessment required.
not_recovery_despite_temp_decrease :-
    patient_fact(temperature_decreasing),
    warning_sign.


% ============================================================
% RULE EXPLANATION / TRACEABILITY
% ============================================================
% Each rule_description/4 maps:
%   rule_description(RuleID, Conditions, Conclusion, Description)

rule_description(r01,
    [high_fever, nausea_vomiting, skin_rash],
    probable_dengue,
    'IF fever AND nausea/vomiting AND rash THEN probable dengue').

rule_description(r02,
    [high_fever, nausea_vomiting, muscle_joint_pain],
    probable_dengue,
    'IF fever AND nausea/vomiting AND aches/pains THEN probable dengue').

rule_description(r03,
    [high_fever, nausea_vomiting, leucopenia],
    probable_dengue,
    'IF fever AND nausea/vomiting AND leucopenia THEN probable dengue').

rule_description(r04,
    [high_fever, skin_rash, muscle_joint_pain],
    probable_dengue,
    'IF fever AND rash AND aches/pains THEN probable dengue').

rule_description(r05,
    [high_fever, skin_rash, leucopenia],
    probable_dengue,
    'IF fever AND rash AND leucopenia THEN probable dengue').

rule_description(r06,
    [high_fever, muscle_joint_pain, leucopenia],
    probable_dengue,
    'IF fever AND aches/pains AND leucopenia THEN probable dengue').

rule_description(r07,
    [high_fever, warning_sign],
    probable_dengue,
    'IF fever AND any warning sign THEN probable dengue').

rule_description(r08,
    [abdominal_pain],
    warning_sign,
    'IF abdominal pain/tenderness THEN warning sign present').

rule_description(r09,
    [persistent_vomiting],
    warning_sign,
    'IF persistent vomiting THEN warning sign present').

rule_description(r10,
    [clinical_fluid_accumulation],
    warning_sign,
    'IF clinical fluid accumulation THEN warning sign present').

rule_description(r11,
    [mucosal_bleeding],
    warning_sign,
    'IF mucosal bleeding THEN warning sign present').

rule_description(r12,
    [lethargy, restlessness],
    warning_sign,
    'IF lethargy OR restlessness THEN warning sign present').

rule_description(r13,
    [liver_enlargement_over_2cm],
    warning_sign,
    'IF liver enlargement >2 cm THEN warning sign present').

rule_description(r14,
    [increased_haematocrit, rapid_platelet_decrease],
    warning_sign,
    'IF increased haematocrit AND rapid decrease in platelet count THEN warning sign present').

rule_description(r15,
    [probable_dengue, abdominal_pain],
    dengue_with_warning_signs,
    'IF probable dengue AND abdominal pain THEN dengue with warning signs').

rule_description(r16,
    [probable_dengue, persistent_vomiting],
    dengue_with_warning_signs,
    'IF probable dengue AND persistent vomiting THEN dengue with warning signs').

rule_description(r17,
    [probable_dengue, clinical_fluid_accumulation],
    dengue_with_warning_signs,
    'IF probable dengue AND clinical fluid accumulation THEN dengue with warning signs').

rule_description(r18,
    [probable_dengue, mucosal_bleeding],
    dengue_with_warning_signs,
    'IF probable dengue AND mucosal bleeding THEN dengue with warning signs').

rule_description(r19,
    [probable_dengue, lethargy_or_restlessness],
    dengue_with_warning_signs,
    'IF probable dengue AND lethargy/restlessness THEN dengue with warning signs').

rule_description(r20,
    [probable_dengue, liver_enlargement_over_2cm],
    dengue_with_warning_signs,
    'IF probable dengue AND liver enlargement >2 cm THEN dengue with warning signs').

rule_description(r21,
    [probable_dengue, increased_haematocrit, rapid_platelet_decrease],
    dengue_with_warning_signs,
    'IF probable dengue AND increased haematocrit AND rapidly falling platelets THEN dengue with warning signs').

rule_description(r22,
    [severe_plasma_leakage],
    severe_dengue,
    'IF severe plasma leakage THEN severe dengue').

rule_description(r23,
    [severe_bleeding],
    severe_dengue,
    'IF severe bleeding THEN severe dengue').

rule_description(r24,
    [severe_organ_impairment],
    severe_dengue,
    'IF severe organ impairment THEN severe dengue').

rule_description(r25,
    [severe_plasma_leakage, shock],
    severe_dengue,
    'IF severe plasma leakage AND shock THEN severe dengue').

rule_description(r26,
    [severe_plasma_leakage, clinical_fluid_accumulation, respiratory_distress],
    severe_dengue,
    'IF severe plasma leakage AND fluid accumulation AND respiratory distress THEN severe dengue').

rule_description(r27,
    [ast_alt_1000_or_more],
    severe_dengue,
    'IF AST/ALT >= 1000 THEN severe dengue').

rule_description(r28,
    [impaired_consciousness],
    severe_dengue,
    'IF impaired consciousness THEN severe dengue').

rule_description(r29,
    [day_in_critical_range, temperature_decreasing],
    critical_phase_monitoring,
    'IF day of illness is 3-7 AND temperature is decreasing THEN critical-phase monitoring required').

rule_description(r30,
    [day_in_critical_range, warning_sign],
    urgent_medical_assessment,
    'IF day of illness is 3-7 AND warning sign is present THEN urgent medical assessment required').

rule_description(r31,
    [temperature_decreasing, warning_sign],
    urgent_medical_assessment,
    'IF temperature decreases AND warning signs appear THEN do not classify as recovery; urgent assessment required').


% ============================================================
% TRIGGERED RULE DETECTION
% ============================================================
% triggered_rule(RuleID, Description) succeeds for each
% rule whose conditions are satisfied by current patient facts.

triggered_rule(r01, Desc) :-
    rule_description(r01, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(skin_rash).

triggered_rule(r02, Desc) :-
    rule_description(r02, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(muscle_joint_pain).

triggered_rule(r03, Desc) :-
    rule_description(r03, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(nausea_vomiting),
    patient_fact(leucopenia).

triggered_rule(r04, Desc) :-
    rule_description(r04, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(skin_rash),
    patient_fact(muscle_joint_pain).

triggered_rule(r05, Desc) :-
    rule_description(r05, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(skin_rash),
    patient_fact(leucopenia).

triggered_rule(r06, Desc) :-
    rule_description(r06, _, _, Desc),
    patient_fact(high_fever),
    patient_fact(muscle_joint_pain),
    patient_fact(leucopenia).

triggered_rule(r07, Desc) :-
    rule_description(r07, _, _, Desc),
    patient_fact(high_fever),
    warning_sign.

triggered_rule(r08, Desc) :-
    rule_description(r08, _, _, Desc),
    patient_fact(abdominal_pain).

triggered_rule(r09, Desc) :-
    rule_description(r09, _, _, Desc),
    patient_fact(persistent_vomiting).

triggered_rule(r10, Desc) :-
    rule_description(r10, _, _, Desc),
    patient_fact(clinical_fluid_accumulation).

triggered_rule(r11, Desc) :-
    rule_description(r11, _, _, Desc),
    patient_fact(mucosal_bleeding).

triggered_rule(r12, Desc) :-
    rule_description(r12, _, _, Desc),
    ( patient_fact(lethargy) ; patient_fact(restlessness) ).

triggered_rule(r13, Desc) :-
    rule_description(r13, _, _, Desc),
    patient_fact(liver_enlargement_over_2cm).

triggered_rule(r14, Desc) :-
    rule_description(r14, _, _, Desc),
    patient_fact(increased_haematocrit),
    patient_fact(rapid_platelet_decrease).

triggered_rule(r15, Desc) :-
    rule_description(r15, _, _, Desc),
    probable_dengue,
    patient_fact(abdominal_pain).

triggered_rule(r16, Desc) :-
    rule_description(r16, _, _, Desc),
    probable_dengue,
    patient_fact(persistent_vomiting).

triggered_rule(r17, Desc) :-
    rule_description(r17, _, _, Desc),
    probable_dengue,
    patient_fact(clinical_fluid_accumulation).

triggered_rule(r18, Desc) :-
    rule_description(r18, _, _, Desc),
    probable_dengue,
    patient_fact(mucosal_bleeding).

triggered_rule(r19, Desc) :-
    rule_description(r19, _, _, Desc),
    probable_dengue,
    ( patient_fact(lethargy) ; patient_fact(restlessness) ).

triggered_rule(r20, Desc) :-
    rule_description(r20, _, _, Desc),
    probable_dengue,
    patient_fact(liver_enlargement_over_2cm).

triggered_rule(r21, Desc) :-
    rule_description(r21, _, _, Desc),
    probable_dengue,
    patient_fact(increased_haematocrit),
    patient_fact(rapid_platelet_decrease).

triggered_rule(r22, Desc) :-
    rule_description(r22, _, _, Desc),
    patient_fact(severe_plasma_leakage).

triggered_rule(r23, Desc) :-
    rule_description(r23, _, _, Desc),
    patient_fact(severe_bleeding).

triggered_rule(r24, Desc) :-
    rule_description(r24, _, _, Desc),
    patient_fact(severe_organ_impairment).

triggered_rule(r25, Desc) :-
    rule_description(r25, _, _, Desc),
    patient_fact(severe_plasma_leakage),
    patient_fact(shock).

triggered_rule(r26, Desc) :-
    rule_description(r26, _, _, Desc),
    patient_fact(severe_plasma_leakage),
    patient_fact(clinical_fluid_accumulation),
    patient_fact(respiratory_distress).

triggered_rule(r27, Desc) :-
    rule_description(r27, _, _, Desc),
    patient_fact(ast_alt_1000_or_more).

triggered_rule(r28, Desc) :-
    rule_description(r28, _, _, Desc),
    patient_fact(impaired_consciousness).

triggered_rule(r29, Desc) :-
    rule_description(r29, _, _, Desc),
    day_of_illness(Day),
    critical_phase_day_range(Start, End),
    Day >= Start,
    Day =< End,
    patient_fact(temperature_decreasing).

triggered_rule(r30, Desc) :-
    rule_description(r30, _, _, Desc),
    day_of_illness(Day),
    critical_phase_day_range(Start, End),
    Day >= Start,
    Day =< End,
    warning_sign.

triggered_rule(r31, Desc) :-
    rule_description(r31, _, _, Desc),
    patient_fact(temperature_decreasing),
    warning_sign.


% ============================================================
% COLLECT ALL TRIGGERED RULES
% ============================================================
% all_triggered_rules(-List)
% Returns a list of rule_info(RuleID, Description) for all
% rules whose conditions are satisfied.

all_triggered_rules(UniqueRules) :-
    findall(
        rule_info(RuleID, Desc),
        triggered_rule(RuleID, Desc),
        AllRules
    ),
    sort(AllRules, UniqueRules).
