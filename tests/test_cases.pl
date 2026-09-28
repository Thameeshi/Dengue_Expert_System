% ============================================================
% test_cases.pl
% Dengue Risk and Warning-Sign Assessment Expert System
%
% Automated Test Cases
%
% These tests verify that the inference engine correctly
% applies the source-derived rules to patient facts and
% produces the expected assessments.
%
% Run with: swipl -g run_all_tests -g halt test_cases.pl
% ============================================================

:- use_module(library(lists)).
:- [backend/knowledge_base].
:- [backend/inference_engine].

% ============================================================
% TEST FRAMEWORK
% ============================================================

:- dynamic test_passed/1.
:- dynamic test_failed/2.

% run_all_tests/0
% Executes all test cases and prints a summary.
run_all_tests :-
    retractall(test_passed(_)),
    retractall(test_failed(_, _)),
    format('~n================================================~n'),
    format('  DENGUE EXPERT SYSTEM — AUTOMATED TESTS~n'),
    format('================================================~n~n'),

    run_test(1), run_test(2), run_test(3), run_test(4),
    run_test(5), run_test(6), run_test(7), run_test(8),

    format('~n================================================~n'),
    format('  TEST SUMMARY~n'),
    format('================================================~n'),
    aggregate_all(count, test_passed(_), PassedCount),
    aggregate_all(count, test_failed(_, _), FailedCount),
    Total is PassedCount + FailedCount,
    format('  Total:  ~w~n', [Total]),
    format('  Passed: ~w~n', [PassedCount]),
    format('  Failed: ~w~n', [FailedCount]),
    format('================================================~n~n'),
    ( FailedCount > 0 ->
        format('  SOME TESTS FAILED!~n~n'),
        forall(test_failed(N, Reason),
            format('  Test ~w FAILED: ~w~n', [N, Reason])
        )
    ;
        format('  ALL TESTS PASSED!~n~n')
    ).


% run_test(+TestNumber)
% Runs a single test case.
run_test(N) :-
    test_case(N, Name, Facts, ExpectedPrimary, ExpectedRules),
    format('Test ~w: ~w~n', [N, Name]),
    format('  Facts: ~w~n', [Facts]),

    % Clear and assert facts
    clear_patient_facts,
    assert_patient_facts(Facts),

    % Run assessment
    run_assessment(
        assessment(
            primary(ActualPrimary),
            _Categories,
            triggered_rules(TriggeredRules)
        )
    ),

    % Extract triggered rule IDs
    findall(RID, member(rule_info(RID, _), TriggeredRules), ActualRuleIDs),

    % Check primary assessment
    ( ActualPrimary == ExpectedPrimary ->
        format('  Primary Assessment: PASS (~w)~n', [ActualPrimary])
    ;
        format('  Primary Assessment: FAIL~n'),
        format('    Expected: ~w~n', [ExpectedPrimary]),
        format('    Actual:   ~w~n', [ActualPrimary])
    ),

    % Check expected rules are present
    check_expected_rules(ExpectedRules, ActualRuleIDs, RulesOK),

    format('  Triggered Rules: ~w~n', [ActualRuleIDs]),

    % Record pass/fail
    ( ActualPrimary == ExpectedPrimary, RulesOK == true ->
        assertz(test_passed(N)),
        format('  Result: PASS~n~n')
    ;
        ( ActualPrimary \== ExpectedPrimary ->
            format(atom(Reason), 'Expected ~w but got ~w', [ExpectedPrimary, ActualPrimary])
        ;
            format(atom(Reason), 'Missing expected rules from ~w in ~w', [ExpectedRules, ActualRuleIDs])
        ),
        assertz(test_failed(N, Reason)),
        format('  Result: FAIL~n~n')
    ),

    % Clean up
    clear_patient_facts.


% check_expected_rules(+ExpectedRules, +ActualRules, -OK)
% Verifies that all expected rules are present in actual.
check_expected_rules([], _, true).
check_expected_rules([R|Rest], Actual, OK) :-
    ( member(R, Actual) ->
        check_expected_rules(Rest, Actual, OK)
    ;
        format('  Missing expected rule: ~w~n', [R]),
        OK = false
    ).


% ============================================================
% TEST CASE DEFINITIONS
% ============================================================
% test_case(Number, Name, FactList, ExpectedPrimaryAssessment, ExpectedRuleIDs)

% TEST 1: High fever + nausea/vomiting + rash -> Probable Dengue
test_case(1,
    'Probable Dengue (R01: fever + nausea/vomiting + rash)',
    [high_fever, nausea_vomiting, skin_rash],
    'Probable Dengue',
    [r01]
).

% TEST 2: High fever + nausea/vomiting + muscle/joint pain -> Probable Dengue
test_case(2,
    'Probable Dengue (R02: fever + nausea/vomiting + aches)',
    [high_fever, nausea_vomiting, muscle_joint_pain],
    'Probable Dengue',
    [r02]
).

% TEST 3: Probable dengue + persistent vomiting -> Dengue with Warning Signs
test_case(3,
    'Dengue with Warning Signs (R09 + R16)',
    [high_fever, nausea_vomiting, skin_rash, persistent_vomiting],
    'Dengue with Warning Signs',
    [r09, r16]
).

% TEST 4: Probable dengue + mucosal bleeding -> Dengue with Warning Signs
test_case(4,
    'Dengue with Warning Signs (R11 + R18)',
    [high_fever, nausea_vomiting, skin_rash, mucosal_bleeding],
    'Dengue with Warning Signs',
    [r11, r18]
).

% TEST 5: Severe plasma leakage + shock -> Severe Dengue
test_case(5,
    'Severe Dengue (R22 + R25)',
    [severe_plasma_leakage, shock],
    'Severe Dengue',
    [r22, r25]
).

% TEST 6: AST/ALT >= 1000 -> Severe Dengue
test_case(6,
    'Severe Dengue (R27: AST/ALT >= 1000)',
    [ast_alt_1000_or_more],
    'Severe Dengue',
    [r27]
).

% TEST 7: Day 5 + decreasing temperature -> Critical-phase monitoring
test_case(7,
    'Critical-Phase Monitoring (R29: day 5 + temp decreasing)',
    [day_of_illness(5), temperature_decreasing],
    'Critical-Phase Monitoring Required',
    [r29]
).

% TEST 8: Day 5 + warning sign -> Urgent medical assessment
test_case(8,
    'Urgent Medical Assessment (R30: day 5 + warning sign)',
    [day_of_illness(5), abdominal_pain],
    'Urgent Medical Assessment Required',
    [r30]
).


% ============================================================
% AUTO-RUN
% ============================================================
:- initialization(run_all_tests).
