% ============================================================
% main.pl
% Dengue Risk and Warning-Sign Assessment Expert System
%
% Main entry point: HTTP server that bridges the web GUI
% and the Prolog inference engine.
%
% Uses SWI-Prolog's built-in HTTP libraries.
% ============================================================

:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_cors)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/json)).
:- use_module(library(http/json_convert)).
:- use_module(library(lists)).

% Load the inference engine and knowledge base modules
:- use_module(inference_engine).
:- use_module(knowledge_base).

% ============================================================
% CORS CONFIGURATION
% ============================================================
% Allow cross-origin requests from the frontend.
:- set_setting(http:cors, [*]).

% ============================================================
% HTTP ROUTE HANDLERS
% ============================================================

% POST & OPTIONS /assess — Main assessment endpoint
:- http_handler('/assess', handle_assess, [method(post), method(options)]).
:- http_handler('/health', handle_health, [method(get), method(options)]).
:- http_handler('/rules', handle_rules, [method(get), method(options)]).

% GET /rules — Return all rule descriptions
:- http_handler('/rules', handle_rules, []).


% ============================================================
% /assess HANDLER
% ============================================================
% Receives patient facts as JSON, runs the inference engine,
% and returns the assessment result.
%
% Expected JSON input:
% {
%   "patient_id": "P001",
%   "day_of_illness": 5,
%   "symptoms": ["high_fever", "nausea_vomiting", "skin_rash"]
% }
%
% JSON output:
% {
%   "patient_id": "P001",
%   "primary_assessment": "Probable Dengue",
%   "categories": { ... },
%   "triggered_rules": [ ... ],
%   "disclaimer": "..."
% }

handle_assess(Request) :-
    cors_enable(Request, [methods([post, options])]),
    ( memberchk(method(options), Request) ->
        format('Content-type: text/plain~n~n')
    ;
        http_read_json_dict(Request, Data),
        process_assessment(Data, ResponseDict),
        reply_json_dict(ResponseDict, [headers([access_control_allow_origin('*')])])
    ).


% process_assessment(+InputDict, -ResponseDict)
% Extracts patient data from the input, runs inference,
% and builds the response dictionary.
process_assessment(Data, Response) :-
    % Extract patient ID (optional)
    ( get_dict(patient_id, Data, PatientID) -> true ; PatientID = "anonymous" ),

    % Extract day of illness (optional)
    ( get_dict(day_of_illness, Data, DayRaw) ->
        ( number(DayRaw) -> Day = DayRaw ; atom_number(DayRaw, Day) )
    ;
        Day = 0
    ),

    % Extract symptoms list
    ( get_dict(symptoms, Data, SymptomsList) -> true ; SymptomsList = [] ),

    % Convert symptom strings to atoms and build fact list
    maplist(ensure_atom, SymptomsList, SymptomAtoms),

    % Add day_of_illness to fact list if provided
    ( Day > 0 ->
        FactList = [day_of_illness(Day) | SymptomAtoms]
    ;
        FactList = SymptomAtoms
    ),

    % Clear previous facts, assert new ones, run inference
    clear_patient_facts,
    assert_patient_facts(FactList),

    % Run the assessment
    run_assessment(
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
        )
    ),

    % Format triggered rules
    format_rules_list(TriggeredRules, RulesDicts),

    % Collect patient facts for transparency
    findall(F, patient_fact(F), PatientFacts),
    maplist(term_to_atom_safe, PatientFacts, FactAtoms),

    % Build response
    Response = response{
        patient_id: PatientID,
        primary_assessment: PrimaryAssessment,
        categories: categories{
            severe_dengue: SD,
            urgent_assessment: UA,
            dengue_warning_signs: DWS,
            probable_dengue: PD,
            critical_phase: CP
        },
        triggered_rules: RulesDicts,
        patient_facts: FactAtoms,
        disclaimer: "This system is an academic Expert System prototype developed for educational purposes. It applies a predefined set of source-derived dengue clinical rules to the information entered by the user. It is not a medical diagnostic tool and does not replace assessment by a qualified healthcare professional. If severe or concerning symptoms are present, the user should seek appropriate medical care."
    },

    % Clean up patient facts
    clear_patient_facts.


% ============================================================
% /health HANDLER
% ============================================================
handle_health(Request) :-
    cors_enable(Request, [methods([get])]),
    reply_json_dict(health{
        status: "ok",
        system: "Dengue Risk and Warning-Sign Assessment Expert System",
        engine: "SWI-Prolog"
    }).


% ============================================================
% /rules HANDLER
% ============================================================
% Returns all rule descriptions for documentation/display.
handle_rules(Request) :-
    cors_enable(Request, [methods([get])]),
    findall(
        rule{
            rule_id: RuleID,
            conditions: Conditions,
            conclusion: Conclusion,
            description: Description
        },
        (
            rule_description(RuleID, Conditions, Conclusion, Description)
        ),
        AllRules
    ),
    reply_json_dict(rules{rules: AllRules}).


% ============================================================
% HELPER PREDICATES
% ============================================================

% ensure_atom(+Input, -Atom)
% Converts a string or atom to an atom.
ensure_atom(Input, Atom) :-
    ( atom(Input) -> Atom = Input
    ; string(Input) -> atom_string(Atom, Input)
    ; term_to_atom(Input, Atom)
    ).

% term_to_atom_safe(+Term, -Atom)
% Safely converts a term to an atom for JSON output.
term_to_atom_safe(Term, Atom) :-
    ( atom(Term) -> Atom = Term
    ; term_to_atom(Term, Atom)
    ).

% format_rules_list(+RuleInfoList, -DictList)
% Converts list of rule_info terms to list of dicts for JSON.
format_rules_list([], []).
format_rules_list([rule_info(RuleID, Desc)|Rest], [Dict|RestDicts]) :-
    % Get the conditions and conclusion from rule_description
    ( rule_description(RuleID, Conditions, Conclusion, _) ->
        maplist(term_to_atom_safe, Conditions, CondAtoms),
        term_to_atom_safe(Conclusion, ConcAtom)
    ;
        CondAtoms = [],
        ConcAtom = unknown
    ),
    Dict = rule{
        rule_id: RuleID,
        description: Desc,
        conditions: CondAtoms,
        conclusion: ConcAtom
    },
    format_rules_list(Rest, RestDicts).


% ============================================================
% SERVER STARTUP
% ============================================================

% start_server/0
% Starts the HTTP server on port 8060.
start_server :-
    start_server(8060).

% start_server(+Port)
% Starts the HTTP server on the specified port.
start_server(Port) :-
    format('~n========================================~n'),
    format('  Dengue Risk & Warning-Sign Assessment~n'),
    format('  Expert System — Prolog Backend~n'),
    format('========================================~n'),
    format('  Starting HTTP server on port ~w...~n', [Port]),
    http_server(http_dispatch, [port(Port)]),
    format('  Server running at http://localhost:~w~n', [Port]),
    format('  Endpoints:~n'),
    format('    POST /assess  — Run patient assessment~n'),
    format('    GET  /health  — Health check~n'),
    format('    GET  /rules   — List all rules~n'),
    format('========================================~n~n').

% stop_server/0
% Stops the HTTP server on port 8060.
stop_server :-
    stop_server(8060).

% stop_server(+Port)
stop_server(Port) :-
    http_stop_server(Port, []).


% ============================================================
% AUTO-START
% ============================================================
% When this file is loaded, the server starts automatically.
:- initialization(start_server).
