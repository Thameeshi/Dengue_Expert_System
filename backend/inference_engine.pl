% ============================================================
% inference_engine.pl
% Dengue Risk and Warning-Sign Assessment Expert System
%
% Inference Engine: Manages patient facts, runs inference,
% and produces assessment results with explanations.
%
% The engine uses dynamic assertion/retraction to manage
% temporary patient facts. Facts are never permanently
% stored — they are cleared before each new assessment.
% ============================================================

:- module(inference_engine, [
    patient_fact/1,
    day_of_illness/1,
    assert_patient_facts/1,
    clear_patient_facts/0,
    run_assessment/1,
    run_assessment_json/2
]).

:- use_module(library(lists)).

% ============================================================
% DYNAMIC PATIENT FACTS
% ============================================================
% patient_fact/1 holds the currently asserted patient symptoms
% and clinical findings. These are transient and must be
% cleared between assessments.

:- dynamic patient_fact/1.
:- dynamic day_of_illness/1.


% ============================================================
% FACT MANAGEMENT
% ============================================================

% clear_patient_facts/0
% Removes all currently asserted patient facts and day_of_illness.
% Must be called before every new assessment session.
clear_patient_facts :-
    retractall(patient_fact(_)),
    retractall(day_of_illness(_)).

% assert_patient_facts(+FactList)
% Takes a list of atoms representing patient symptoms/findings
% and asserts each one as a patient_fact/1.
% Also handles day_of_illness if present in the list.
assert_patient_facts([]).
assert_patient_facts([day_of_illness(Day)|Rest]) :-
    !,
    ( number(Day) ->
        assertz(day_of_illness(Day))
    ;
        atom_number(Day, DayNum),
        assertz(day_of_illness(DayNum))
    ),
    assert_patient_facts(Rest).
assert_patient_facts([Fact|Rest]) :-
    assertz(patient_fact(Fact)),
    assert_patient_facts(Rest).


% ============================================================
% ASSESSMENT ENGINE
% ============================================================

% run_assessment(-Result)
% Performs a complete assessment based on currently asserted
% patient facts. Returns a structured result term.
%
% The assessment follows a priority hierarchy for display:
%   1. Severe Dengue
%   2. Urgent medical assessment required
%   3. Dengue with Warning Signs
%   4. Probable Dengue
%   5. Critical-phase monitoring
%   6. No supplied rule triggered
%
% IMPORTANT: This priority is for output display only.
%            It is NOT a new medical rule.

run_assessment(Result) :-

    % Determine which categories are satisfied
    ( knowledge_base:severe_dengue -> SevereDengue = true ; SevereDengue = false ),
    ( knowledge_base:urgent_medical_assessment -> UrgentAssessment = true ; UrgentAssessment = false ),
    ( knowledge_base:dengue_with_warning_signs -> DengueWarning = true ; DengueWarning = false ),
    ( knowledge_base:probable_dengue -> ProbableDengue = true ; ProbableDengue = false ),
    ( knowledge_base:critical_phase_monitoring -> CriticalPhase = true ; CriticalPhase = false ),

    % Collect all triggered rules with explanations
    knowledge_base:all_triggered_rules(TriggeredRules),

    % Determine primary assessment based on display priority
    determine_primary_assessment(
        SevereDengue, UrgentAssessment, DengueWarning,
        ProbableDengue, CriticalPhase,
        PrimaryAssessment
    ),

    % Build result structure
    Result = assessment(
        primary(PrimaryAssessment),
        categories(
            severe_dengue(SevereDengue),
            urgent_assessment(UrgentAssessment),
            dengue_warning_signs(DengueWarning),
            probable_dengue(ProbableDengue),
            critical_phase(CriticalPhase)
        ),
        triggered_rules(TriggeredRules)
    ).


% determine_primary_assessment/6
% Applies the display priority hierarchy.
determine_primary_assessment(true, _, _, _, _, 'Severe Dengue') :- !.
determine_primary_assessment(_, true, _, _, _, 'Urgent Medical Assessment Required') :- !.
determine_primary_assessment(_, _, true, _, _, 'Dengue with Warning Signs') :- !.
determine_primary_assessment(_, _, _, true, _, 'Probable Dengue') :- !.
determine_primary_assessment(_, _, _, _, true, 'Critical-Phase Monitoring Required') :- !.
determine_primary_assessment(_, _, _, _, _, 'No Supplied Rule Triggered').


% ============================================================
% JSON-FRIENDLY ASSESSMENT OUTPUT
% ============================================================

% run_assessment_json(+FactList, -JSONAtom)
% Complete pipeline: clear facts -> assert facts -> run inference
% -> format result as JSON string -> clear facts.

run_assessment_json(FactList, JSONAtom) :-
    % Clear any previous patient data
    clear_patient_facts,

    % Assert new patient facts
    assert_patient_facts(FactList),

    % Run the inference engine
    run_assessment(Result),

    % Format result as JSON
    format_result_json(Result, JSONAtom),

    % Clean up patient facts after assessment
    clear_patient_facts.


% ============================================================
% JSON FORMATTING
% ============================================================

% format_result_json/2
% Converts the assessment result term into a JSON-formatted atom.
format_result_json(
    assessment(
        primary(PrimaryAssessment),
        categories(
            severe_dengue(SD),
            urgent_assessment(UA),
            dengue_warning_signs(DWS),
            probable_dengue(PD),
            critical_phase(CP)
        ),
        triggered_rules(TriggeredRules)
    ),
    JSONAtom
) :-
    % Format triggered rules as JSON array
    format_triggered_rules_json(TriggeredRules, RulesJSON),

    % Build the complete JSON string
    format(atom(JSONAtom),
        '{"primary_assessment":"~w","categories":{"severe_dengue":~w,"urgent_assessment":~w,"dengue_warning_signs":~w,"probable_dengue":~w,"critical_phase":~w},"triggered_rules":[~w]}',
        [PrimaryAssessment, SD, UA, DWS, PD, CP, RulesJSON]
    ).

% format_triggered_rules_json/2
% Formats a list of rule_info terms into a JSON array string.
format_triggered_rules_json([], '').
format_triggered_rules_json([rule_info(RuleID, Desc)], RuleJSON) :-
    !,
    escape_json_string(Desc, EscapedDesc),
    format(atom(RuleJSON),
        '{"rule_id":"~w","description":"~w"}',
        [RuleID, EscapedDesc]
    ).
format_triggered_rules_json([rule_info(RuleID, Desc)|Rest], AllJSON) :-
    escape_json_string(Desc, EscapedDesc),
    format(atom(ThisJSON),
        '{"rule_id":"~w","description":"~w"}',
        [RuleID, EscapedDesc]
    ),
    format_triggered_rules_json(Rest, RestJSON),
    format(atom(AllJSON), '~w,~w', [ThisJSON, RestJSON]).

% escape_json_string/2
% Escapes special characters for JSON string safety.
escape_json_string(Input, Output) :-
    atom_chars(Input, Chars),
    escape_chars(Chars, EscapedChars),
    atom_chars(Output, EscapedChars).

escape_chars([], []).
escape_chars(['"'|Rest], ['\\', '"'|EscRest]) :- !, escape_chars(Rest, EscRest).
escape_chars(['\\'|Rest], ['\\', '\\'|EscRest]) :- !, escape_chars(Rest, EscRest).
escape_chars(['\n'|Rest], ['\\', 'n'|EscRest]) :- !, escape_chars(Rest, EscRest).
escape_chars([C|Rest], [C|EscRest]) :- escape_chars(Rest, EscRest).
