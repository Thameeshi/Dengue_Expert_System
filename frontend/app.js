/**
 * app.js
 * Dengue Risk & Warning-Sign Assessment Expert System
 *
 * Frontend JavaScript — Implements TWO inference approaches:
 *   1. FORWARD CHAINING (Data-Driven):
 *      - Collects all patient facts upfront
 *      - Fires all matching rules R01–R31 against the facts
 *      - Derives all possible conclusions
 *
 *   2. BACKWARD CHAINING (Goal-Driven):
 *      - User selects a hypothesis (goal) to test
 *      - System asks targeted yes/no questions
 *      - Works backward from the goal to find supporting evidence
 *      - Proves or disproves the hypothesis
 *
 * IMPORTANT:
 *   This file does NOT contain any clinical decision logic.
 *   All inference is performed by the Prolog backend (local)
 *   or the serverless API (Vercel cloud).
 */

// ============================================================
// CONFIGURATION
// ============================================================

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE_URL = isLocal ? 'http://localhost:8060' : '/api';

// Human-readable labels for symptom/fact atoms
const FACT_LABELS = {
    high_fever: 'High Fever',
    severe_headache: 'Severe Headache',
    pain_behind_eyes: 'Pain Behind the Eyes',
    muscle_joint_pain: 'Muscle / Joint Pain',
    nausea_vomiting: 'Nausea / Vomiting',
    skin_rash: 'Skin Rash',
    leucopenia: 'Leucopenia',
    abdominal_pain: 'Abdominal Pain / Tenderness',
    persistent_vomiting: 'Persistent Vomiting',
    clinical_fluid_accumulation: 'Clinical Fluid Accumulation',
    mucosal_bleeding: 'Mucosal Bleeding',
    lethargy: 'Lethargy',
    restlessness: 'Restlessness',
    liver_enlargement_over_2cm: 'Liver Enlargement >2 cm',
    increased_haematocrit: 'Increased Haematocrit',
    rapid_platelet_decrease: 'Rapid Decrease in Platelet Count',
    severe_plasma_leakage: 'Severe Plasma Leakage',
    shock: 'Shock',
    respiratory_distress: 'Respiratory Distress',
    severe_bleeding: 'Severe Bleeding',
    severe_organ_impairment: 'Severe Organ Impairment',
    ast_alt_1000_or_more: 'AST / ALT ≥ 1000',
    impaired_consciousness: 'Impaired Consciousness',
    temperature_decreasing: 'Temperature Decreasing',
    warning_sign_transition_period: 'Warning Signs at Phase Transition'
};

// Conclusion labels
const CONCLUSION_LABELS = {
    probable_dengue: 'Probable Dengue',
    warning_sign: 'Warning Sign',
    dengue_with_warning_signs: 'Dengue with Warning Signs',
    severe_dengue: 'Severe Dengue',
    critical_phase_monitoring: 'Critical-Phase Monitoring',
    urgent_medical_assessment: 'Urgent Medical Assessment'
};

// Current active approach
let currentApproach = null; // 'forward' or 'backward'


// ============================================================
// APPROACH SELECTION
// ============================================================

/**
 * selectApproach(approach)
 * Called when the user selects forward or backward chaining.
 */
function selectApproach(approach) {
    currentApproach = approach;

    // Hide selection screen
    document.getElementById('approach-selection').classList.add('hidden');

    if (approach === 'forward') {
        document.getElementById('forward-section').classList.remove('hidden');
        document.getElementById('backward-section').classList.add('hidden');
    } else if (approach === 'backward') {
        document.getElementById('forward-section').classList.add('hidden');
        document.getElementById('backward-section').classList.remove('hidden');
        initBackwardChaining();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * goBackToSelection()
 * Returns to the approach selection screen.
 */
function goBackToSelection() {
    currentApproach = null;
    document.getElementById('approach-selection').classList.remove('hidden');
    document.getElementById('forward-section').classList.add('hidden');
    document.getElementById('backward-section').classList.add('hidden');

    // Reset states
    clearForm();
    resetBackwardChaining();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ============================================================
// ===================== FORWARD CHAINING =====================
// ============================================================

// Preset cases for quick testing
const PRESET_CASES = {
    probable: {
        patient_id: 'P-101',
        day_of_illness: 2,
        symptoms: ['high_fever', 'nausea_vomiting', 'skin_rash']
    },
    warning: {
        patient_id: 'P-102',
        day_of_illness: 4,
        symptoms: ['high_fever', 'nausea_vomiting', 'skin_rash', 'abdominal_pain', 'persistent_vomiting']
    },
    severe: {
        patient_id: 'P-103',
        day_of_illness: 5,
        symptoms: ['severe_plasma_leakage', 'shock', 'ast_alt_1000_or_more']
    },
    critical: {
        patient_id: 'P-104',
        day_of_illness: 5,
        symptoms: ['high_fever', 'temperature_decreasing', 'abdominal_pain']
    }
};

function applyPreset(presetKey) {
    const preset = PRESET_CASES[presetKey];
    if (!preset) return;

    document.getElementById('assessment-form').reset();
    document.getElementById('patient-id').value = preset.patient_id;
    document.getElementById('day-of-illness').value = preset.day_of_illness;

    preset.symptoms.forEach(sym => {
        const checkbox = document.querySelector(`input[value="${sym}"]`);
        if (checkbox) checkbox.checked = true;
    });

    runForwardChaining();
}

/**
 * runForwardChaining()
 * Collects form data, sends it to the backend, and displays the result.
 * This is the DATA-DRIVEN approach: all facts are given, all rules are evaluated.
 */
async function runForwardChaining() {
    const checkboxes = document.querySelectorAll('#assessment-form input[name="symptoms"]:checked');
    const symptoms = Array.from(checkboxes).map(cb => cb.value);

    const patientId = document.getElementById('patient-id').value.trim() || 'anonymous';
    const dayOfIllnessRaw = document.getElementById('day-of-illness').value.trim();
    const dayOfIllness = dayOfIllnessRaw ? parseInt(dayOfIllnessRaw, 10) : 0;

    if (symptoms.length === 0 && dayOfIllness === 0) {
        showFCError('Please select at least one symptom or enter the day of illness before running the assessment.');
        return;
    }

    const payload = {
        patient_id: patientId,
        day_of_illness: dayOfIllness,
        symptoms: symptoms,
        approach: 'forward'
    };

    showFCLoading(true);
    hideFCResults();
    hideFCError();

    try {
        const response = await fetch(`${API_BASE_URL}/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Server returned status ${response.status}`);

        const result = await response.json();
        displayForwardResults(result);

    } catch (error) {
        console.error('Forward chaining assessment error:', error);
        showFCError(
            'Could not connect to the backend server. ' +
            'Please ensure SWI-Prolog is running on port 8060. ' +
            'Start it with: swipl backend/main.pl'
        );
    } finally {
        showFCLoading(false);
    }
}

/**
 * displayForwardResults(result)
 * Renders the forward chaining assessment result.
 */
function displayForwardResults(result) {
    const resultsSection = document.getElementById('fc-results-section');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 1. Primary Assessment Badge
    displayFCPrimaryAssessment(result);

    // 2. Categories
    displayFCCategories(result.categories);

    // 3. Triggered Rules
    displayFCTriggeredRules(result.triggered_rules);

    // 4. Explanation (Forward chaining trace)
    displayFCExplanation(result);

    // 5. Patient Facts
    displayFCPatientFacts(result.patient_facts);
}

function displayFCPrimaryAssessment(result) {
    const badge = document.getElementById('fc-result-badge');
    const explanation = document.getElementById('fc-result-explanation');
    const patientRef = document.getElementById('fc-result-patient-ref');

    const assessment = result.primary_assessment;
    patientRef.textContent = result.patient_id !== 'anonymous' ? `Patient Reference: ${result.patient_id}` : '';

    badge.textContent = assessment;
    badge.className = 'result-badge';

    if (assessment.includes('Severe')) badge.classList.add('badge-severe');
    else if (assessment.includes('Urgent')) badge.classList.add('badge-urgent');
    else if (assessment.includes('Warning')) badge.classList.add('badge-warning');
    else if (assessment.includes('Probable')) badge.classList.add('badge-probable');
    else if (assessment.includes('Critical')) badge.classList.add('badge-critical');
    else badge.classList.add('badge-none');

    if (assessment === 'No Supplied Rule Triggered') {
        explanation.textContent =
            'Forward Chaining Result: The inference engine evaluated all 31 rules against the entered patient data. ' +
            'None of the rule conditions were fully satisfied. This does not rule out dengue.';
    } else {
        explanation.textContent =
            'Forward Chaining Result: Starting from the entered patient facts, the engine fired all rules whose ' +
            'conditions matched. The highest-priority triggered conclusion is shown above.';
    }
}

function displayFCCategories(categories) {
    const grid = document.getElementById('fc-categories-grid');
    grid.innerHTML = '';

    const categoryList = [
        { key: 'severe_dengue', label: 'Severe Dengue' },
        { key: 'urgent_assessment', label: 'Urgent Medical Assessment' },
        { key: 'dengue_warning_signs', label: 'Dengue with Warning Signs' },
        { key: 'probable_dengue', label: 'Probable Dengue' },
        { key: 'critical_phase', label: 'Critical-Phase Monitoring' }
    ];

    categoryList.forEach(cat => {
        const isActive = categories[cat.key] === true;
        const item = document.createElement('div');
        item.className = `category-item${isActive ? ' active' : ''}`;
        item.innerHTML = `
            <span class="category-dot ${isActive ? 'dot-active' : 'dot-inactive'}"></span>
            <span class="category-label">${cat.label}</span>
        `;
        grid.appendChild(item);
    });
}

function displayFCTriggeredRules(rules) {
    const container = document.getElementById('fc-triggered-rules-list');
    container.innerHTML = '';

    if (!rules || rules.length === 0) {
        container.innerHTML = '<div class="no-rules">No rules were triggered by the entered data.</div>';
        return;
    }

    rules.forEach(rule => {
        const item = document.createElement('div');
        item.className = 'rule-item';
        const ruleIdStr = String(rule.rule_id).toUpperCase();
        const conclusionLabel = CONCLUSION_LABELS[rule.conclusion] || formatFactName(rule.conclusion);

        let conditionsHTML = '';
        if (rule.conditions && rule.conditions.length > 0) {
            const tags = rule.conditions.map(c => {
                const label = FACT_LABELS[c] || CONCLUSION_LABELS[c] || formatFactName(c);
                return `<span class="condition-tag">${label}</span>`;
            }).join('');
            conditionsHTML = `<div class="rule-conditions">${tags}</div>`;
        }

        item.innerHTML = `
            <div class="rule-header">
                <span class="rule-id">${ruleIdStr}</span>
                <span class="rule-conclusion">${conclusionLabel}</span>
            </div>
            <div class="rule-description">${rule.description}</div>
            ${conditionsHTML}
        `;
        container.appendChild(item);
    });
}

function displayFCExplanation(result) {
    const container = document.getElementById('fc-explanation-content');
    container.innerHTML = '';

    const rules = result.triggered_rules || [];

    if (rules.length === 0) {
        container.innerHTML = `
            <div class="explanation-step">
                <div class="step-label">Forward Chaining — No Rules Fired</div>
                <p>The forward chaining engine asserted all patient facts into the working memory and evaluated all 31 rules. 
                No rule conditions were fully satisfied by the submitted facts.</p>
            </div>
        `;
        return;
    }

    // Step 1: Facts asserted into working memory
    const step1 = document.createElement('div');
    step1.className = 'explanation-step';
    const factsSubmitted = (result.patient_facts || []).map(f => FACT_LABELS[f] || formatFactName(f)).join(', ');
    step1.innerHTML = `
        <div class="step-label">Step 1 — Assert Facts into Working Memory</div>
        <p>The following patient facts were asserted into the working memory: ${factsSubmitted}.</p>
    `;
    container.appendChild(step1);

    // Step 2: Match-resolve-act cycle
    const step2 = document.createElement('div');
    step2.className = 'explanation-step';
    const ruleIds = rules.map(r => String(r.rule_id).toUpperCase()).join(', ');
    step2.innerHTML = `
        <div class="step-label">Step 2 — Match-Resolve-Act Cycle</div>
        <p>The forward chaining engine compared all 31 rule conditions against working memory. The following rules had all conditions satisfied and fired: ${ruleIds}.</p>
    `;
    container.appendChild(step2);

    // Step 3+: Derived conclusions
    const conclusions = {};
    rules.forEach(r => {
        const conclusion = CONCLUSION_LABELS[r.conclusion] || formatFactName(r.conclusion);
        if (!conclusions[conclusion]) conclusions[conclusion] = [];
        conclusions[conclusion].push(r);
    });

    let stepNum = 3;
    for (const [conclusion, conRules] of Object.entries(conclusions)) {
        const step = document.createElement('div');
        step.className = 'explanation-step';
        const ruleDescs = conRules.map(r => `${String(r.rule_id).toUpperCase()}: ${r.description}`).join('; ');
        step.innerHTML = `
            <div class="step-label">Step ${stepNum} — New Fact Derived: ${conclusion}</div>
            <p>${ruleDescs}</p>
        `;
        container.appendChild(step);
        stepNum++;
    }

    // Final step
    const finalStep = document.createElement('div');
    finalStep.className = 'explanation-step';
    finalStep.innerHTML = `
        <div class="step-label">Step ${stepNum} — Final Assessment (Conflict Resolution)</div>
        <p>Using priority hierarchy (Severe Dengue > Urgent Assessment > Warning Signs > Probable > Critical-Phase > None), 
        the primary assessment is: <strong>${result.primary_assessment}</strong>.</p>
    `;
    container.appendChild(finalStep);
}

function displayFCPatientFacts(facts) {
    const container = document.getElementById('fc-facts-list');
    container.innerHTML = '';

    if (!facts || facts.length === 0) {
        container.innerHTML = '<span class="fact-tag">No facts submitted</span>';
        return;
    }

    facts.forEach(fact => {
        const tag = document.createElement('span');
        tag.className = 'fact-tag';
        tag.textContent = fact;
        container.appendChild(tag);
    });
}

// FC UI Helpers
function showFCLoading(show) {
    const el = document.getElementById('fc-loading');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

function showFCError(message) {
    const el = document.getElementById('fc-error-message');
    document.getElementById('fc-error-text').textContent = message;
    el.classList.remove('hidden');
}

function hideFCError() {
    document.getElementById('fc-error-message').classList.add('hidden');
}

function hideFCResults() {
    document.getElementById('fc-results-section').classList.add('hidden');
}

function clearForm() {
    const form = document.getElementById('assessment-form');
    if (form) {
        form.reset();
        const checkboxes = form.querySelectorAll('input[name="symptoms"]');
        checkboxes.forEach(cb => { cb.checked = false; });
    }
    hideFCResults();
    hideFCError();
}


// ============================================================
// =================== BACKWARD CHAINING ======================
// ============================================================

/**
 * Backward Chaining Implementation
 * 
 * The system defines hypotheses (goals) the user can test.
 * For each hypothesis, a set of rules needs to be satisfied.
 * The engine works backwards: 
 *   Goal -> Required sub-goals -> Required facts (questions)
 * 
 * The user answers yes/no questions. If all required conditions
 * for at least one rule are met, the goal is PROVEN.
 * If the user answers "no" to all possible rule paths, the goal is DISPROVEN.
 */

// Hypotheses available for backward chaining
const BC_HYPOTHESES = [
    {
        id: 'severe_dengue',
        label: 'Severe Dengue',
        description: 'Test whether the patient has Severe Dengue (most critical classification)',
        badgeClass: 'badge-severe',
        rules: ['r22', 'r23', 'r24', 'r25', 'r26', 'r27', 'r28']
    },
    {
        id: 'dengue_with_warning_signs',
        label: 'Dengue with Warning Signs',
        description: 'Test whether the patient has Dengue with Warning Signs',
        badgeClass: 'badge-warning',
        rules: ['r15', 'r16', 'r17', 'r18', 'r19', 'r20', 'r21']
    },
    {
        id: 'probable_dengue',
        label: 'Probable Dengue',
        description: 'Test whether the patient has Probable Dengue',
        badgeClass: 'badge-probable',
        rules: ['r01', 'r02', 'r03', 'r04', 'r05', 'r06', 'r07']
    },
    {
        id: 'warning_sign',
        label: 'Warning Sign Present',
        description: 'Test whether any warning sign is present',
        badgeClass: 'badge-warning',
        rules: ['r08', 'r09', 'r10', 'r11', 'r12', 'r13', 'r14']
    },
    {
        id: 'critical_phase',
        label: 'Critical-Phase Monitoring',
        description: 'Test whether the patient needs critical-phase monitoring',
        badgeClass: 'badge-critical',
        rules: ['r29', 'r30', 'r31']
    }
];

// Complete backward chaining rule definitions with required facts
const BC_RULES = {
    // --- Probable Dengue (R01–R07) ---
    r01: {
        id: 'R01', conclusion: 'probable_dengue',
        description: 'IF high fever AND nausea/vomiting AND skin rash THEN probable dengue',
        conditions: ['high_fever', 'nausea_vomiting', 'skin_rash']
    },
    r02: {
        id: 'R02', conclusion: 'probable_dengue',
        description: 'IF high fever AND nausea/vomiting AND muscle/joint pain THEN probable dengue',
        conditions: ['high_fever', 'nausea_vomiting', 'muscle_joint_pain']
    },
    r03: {
        id: 'R03', conclusion: 'probable_dengue',
        description: 'IF high fever AND nausea/vomiting AND leucopenia THEN probable dengue',
        conditions: ['high_fever', 'nausea_vomiting', 'leucopenia']
    },
    r04: {
        id: 'R04', conclusion: 'probable_dengue',
        description: 'IF high fever AND skin rash AND muscle/joint pain THEN probable dengue',
        conditions: ['high_fever', 'skin_rash', 'muscle_joint_pain']
    },
    r05: {
        id: 'R05', conclusion: 'probable_dengue',
        description: 'IF high fever AND skin rash AND leucopenia THEN probable dengue',
        conditions: ['high_fever', 'skin_rash', 'leucopenia']
    },
    r06: {
        id: 'R06', conclusion: 'probable_dengue',
        description: 'IF high fever AND muscle/joint pain AND leucopenia THEN probable dengue',
        conditions: ['high_fever', 'muscle_joint_pain', 'leucopenia']
    },
    r07: {
        id: 'R07', conclusion: 'probable_dengue',
        description: 'IF high fever AND any warning sign THEN probable dengue',
        conditions: ['high_fever', '_warning_sign_']  // special: needs any warning sign
    },

    // --- Warning Signs (R08–R14) ---
    r08: {
        id: 'R08', conclusion: 'warning_sign',
        description: 'IF abdominal pain/tenderness THEN warning sign',
        conditions: ['abdominal_pain']
    },
    r09: {
        id: 'R09', conclusion: 'warning_sign',
        description: 'IF persistent vomiting THEN warning sign',
        conditions: ['persistent_vomiting']
    },
    r10: {
        id: 'R10', conclusion: 'warning_sign',
        description: 'IF clinical fluid accumulation THEN warning sign',
        conditions: ['clinical_fluid_accumulation']
    },
    r11: {
        id: 'R11', conclusion: 'warning_sign',
        description: 'IF mucosal bleeding THEN warning sign',
        conditions: ['mucosal_bleeding']
    },
    r12: {
        id: 'R12', conclusion: 'warning_sign',
        description: 'IF lethargy or restlessness THEN warning sign',
        conditions: ['_lethargy_or_restlessness_']  // special OR
    },
    r13: {
        id: 'R13', conclusion: 'warning_sign',
        description: 'IF liver enlargement > 2cm THEN warning sign',
        conditions: ['liver_enlargement_over_2cm']
    },
    r14: {
        id: 'R14', conclusion: 'warning_sign',
        description: 'IF increased haematocrit AND rapid platelet decrease THEN warning sign',
        conditions: ['increased_haematocrit', 'rapid_platelet_decrease']
    },

    // --- Dengue with Warning Signs (R15–R21) ---
    r15: {
        id: 'R15', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND abdominal pain THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'abdominal_pain']
    },
    r16: {
        id: 'R16', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND persistent vomiting THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'persistent_vomiting']
    },
    r17: {
        id: 'R17', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND clinical fluid accumulation THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'clinical_fluid_accumulation']
    },
    r18: {
        id: 'R18', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND mucosal bleeding THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'mucosal_bleeding']
    },
    r19: {
        id: 'R19', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND lethargy/restlessness THEN dengue with warning signs',
        conditions: ['_probable_dengue_', '_lethargy_or_restlessness_']
    },
    r20: {
        id: 'R20', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND liver enlargement > 2cm THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'liver_enlargement_over_2cm']
    },
    r21: {
        id: 'R21', conclusion: 'dengue_with_warning_signs',
        description: 'IF probable dengue AND HCT rise + platelet drop THEN dengue with warning signs',
        conditions: ['_probable_dengue_', 'increased_haematocrit', 'rapid_platelet_decrease']
    },

    // --- Severe Dengue (R22–R28) ---
    r22: {
        id: 'R22', conclusion: 'severe_dengue',
        description: 'IF severe plasma leakage THEN severe dengue',
        conditions: ['severe_plasma_leakage']
    },
    r23: {
        id: 'R23', conclusion: 'severe_dengue',
        description: 'IF severe bleeding THEN severe dengue',
        conditions: ['severe_bleeding']
    },
    r24: {
        id: 'R24', conclusion: 'severe_dengue',
        description: 'IF severe organ impairment THEN severe dengue',
        conditions: ['severe_organ_impairment']
    },
    r25: {
        id: 'R25', conclusion: 'severe_dengue',
        description: 'IF severe plasma leakage AND shock THEN severe dengue',
        conditions: ['severe_plasma_leakage', 'shock']
    },
    r26: {
        id: 'R26', conclusion: 'severe_dengue',
        description: 'IF severe leakage + fluid accumulation + respiratory distress THEN severe dengue',
        conditions: ['severe_plasma_leakage', 'clinical_fluid_accumulation', 'respiratory_distress']
    },
    r27: {
        id: 'R27', conclusion: 'severe_dengue',
        description: 'IF AST/ALT ≥ 1000 THEN severe dengue',
        conditions: ['ast_alt_1000_or_more']
    },
    r28: {
        id: 'R28', conclusion: 'severe_dengue',
        description: 'IF impaired consciousness THEN severe dengue',
        conditions: ['impaired_consciousness']
    },

    // --- Critical Phase / Urgent (R29–R31) ---
    r29: {
        id: 'R29', conclusion: 'critical_phase_monitoring',
        description: 'IF day 3-7 AND temperature decreasing THEN critical-phase monitoring',
        conditions: ['_day_3_to_7_', 'temperature_decreasing']
    },
    r30: {
        id: 'R30', conclusion: 'urgent_medical_assessment',
        description: 'IF day 3-7 AND any warning sign THEN urgent medical assessment',
        conditions: ['_day_3_to_7_', '_warning_sign_']
    },
    r31: {
        id: 'R31', conclusion: 'urgent_medical_assessment',
        description: 'IF temperature decreasing AND warning signs appear THEN urgent assessment',
        conditions: ['temperature_decreasing', '_warning_sign_']
    }
};

// Backward chaining state
let bcState = {
    selectedHypothesis: null,
    currentRuleIndex: 0,        // index in the hypothesis's rule list
    currentConditionIndex: 0,   // index in the current rule's condition list
    knownFacts: {},             // fact_atom -> true/false (answered)
    proofTrace: [],             // step-by-step trace
    rulesExamined: [],          // rules examined
    provenRules: [],            // rules that were proven
    disprovenRules: [],         // rules that were disproven
    allQuestions: [],           // all questions to ask for this hypothesis
    answeredQuestions: [],      // questions already answered
    currentQuestionIdx: 0,
    goalProven: false,
    finished: false
};

/**
 * Build the list of unique fact-questions needed for a hypothesis
 */
function buildBackwardQuestions(hypothesis) {
    const questions = [];
    const seenFacts = new Set();
    const ruleIds = hypothesis.rules;

    // For sub-goal dependencies, expand them
    const subGoalQuestions = {
        '_probable_dengue_': {
            question: 'Has the patient been assessed as having Probable Dengue? (High fever + at least 2 symptoms)',
            fact: '_probable_dengue_'
        },
        '_warning_sign_': {
            question: 'Does the patient have any warning sign? (abdominal pain, persistent vomiting, fluid accumulation, mucosal bleeding, lethargy/restlessness, liver enlargement, or HCT+platelet changes)',
            fact: '_warning_sign_'
        },
        '_lethargy_or_restlessness_': {
            question: 'Does the patient show lethargy OR restlessness?',
            fact: '_lethargy_or_restlessness_'
        },
        '_day_3_to_7_': {
            question: 'Is the patient currently in day 3 to 7 of illness?',
            fact: '_day_3_to_7_'
        }
    };

    ruleIds.forEach(ruleId => {
        const rule = BC_RULES[ruleId];
        if (!rule) return;

        rule.conditions.forEach(condition => {
            if (!seenFacts.has(condition)) {
                seenFacts.add(condition);

                if (subGoalQuestions[condition]) {
                    questions.push(subGoalQuestions[condition]);
                } else {
                    const label = FACT_LABELS[condition] || formatFactName(condition);
                    questions.push({
                        question: `Does the patient have: ${label}?`,
                        fact: condition
                    });
                }
            }
        });
    });

    return questions;
}

/**
 * Initialize backward chaining for the selected hypothesis
 */
function initBackwardChaining() {
    const grid = document.getElementById('hypothesis-grid');
    grid.innerHTML = '';

    BC_HYPOTHESES.forEach(hyp => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'hypothesis-card';
        card.onclick = () => startBackwardChaining(hyp);
        card.innerHTML = `
            <div class="hypothesis-card-badge ${hyp.badgeClass}">${hyp.label}</div>
            <p class="hypothesis-card-desc">${hyp.description}</p>
            <div class="hypothesis-card-rules">${hyp.rules.length} rules to check (${hyp.rules.map(r => r.toUpperCase()).join(', ')})</div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Start backward chaining for a specific hypothesis
 */
function startBackwardChaining(hypothesis) {
    // Reset state
    bcState = {
        selectedHypothesis: hypothesis,
        currentRuleIndex: 0,
        currentConditionIndex: 0,
        knownFacts: {},
        proofTrace: [],
        rulesExamined: [],
        provenRules: [],
        disprovenRules: [],
        allQuestions: buildBackwardQuestions(hypothesis),
        answeredQuestions: [],
        currentQuestionIdx: 0,
        goalProven: false,
        finished: false
    };

    // Add initial trace
    bcState.proofTrace.push({
        type: 'goal',
        text: `Goal: Prove "${hypothesis.label}"`,
        detail: `The backward chaining engine will try to prove the hypothesis "${hypothesis.label}" by checking rules ${hypothesis.rules.map(r => r.toUpperCase()).join(', ')}.`
    });

    // Show question step, hide others
    document.getElementById('bc-step-hypothesis').classList.add('hidden');
    document.getElementById('bc-step-questions').classList.remove('hidden');
    document.getElementById('bc-step-result').classList.add('hidden');

    document.getElementById('bc-hypothesis-label').textContent = `Testing: ${hypothesis.label}`;
    document.getElementById('bc-answered-list').innerHTML = '';

    // Start asking questions
    showNextQuestion();
}

/**
 * Show the next backward chaining question
 */
function showNextQuestion() {
    if (bcState.currentQuestionIdx >= bcState.allQuestions.length || bcState.finished) {
        finishBackwardChaining();
        return;
    }

    const q = bcState.allQuestions[bcState.currentQuestionIdx];
    const total = bcState.allQuestions.length;
    const current = bcState.currentQuestionIdx + 1;

    document.getElementById('bc-question-text').textContent = q.question;
    document.getElementById('bc-progress-text').textContent = `Question ${current} of ${total}`;

    // Update progress bar
    const progressPct = ((current - 1) / total) * 100;
    document.getElementById('bc-progress-bar').style.width = `${progressPct}%`;
}

/**
 * Handle user's yes/no answer
 */
function answerBackwardQuestion(answer) {
    const q = bcState.allQuestions[bcState.currentQuestionIdx];
    bcState.knownFacts[q.fact] = answer;

    // Record the answered question
    bcState.answeredQuestions.push({
        question: q.question,
        fact: q.fact,
        answer: answer
    });

    // Add to trace
    bcState.proofTrace.push({
        type: answer ? 'fact_yes' : 'fact_no',
        text: `${answer ? '✓ YES' : '✗ NO'}: ${q.question}`,
        detail: `Fact "${FACT_LABELS[q.fact] || q.fact}" is ${answer ? 'TRUE' : 'FALSE'}.`
    });

    // Update answered list in UI
    const answeredList = document.getElementById('bc-answered-list');
    const item = document.createElement('div');
    item.className = `bc-answered-item ${answer ? 'answer-yes' : 'answer-no'}`;
    item.innerHTML = `
        <span class="bc-answered-icon">${answer ? '✓' : '✗'}</span>
        <span class="bc-answered-text">${q.question}</span>
        <span class="bc-answered-badge ${answer ? 'badge-yes' : 'badge-no'}">${answer ? 'Yes' : 'No'}</span>
    `;
    answeredList.appendChild(item);

    // Check if any rule is now fully proven
    checkIfGoalProven();

    // Move to next question
    bcState.currentQuestionIdx++;

    // Check if we can short-circuit (goal already proven)
    if (bcState.goalProven) {
        finishBackwardChaining();
        return;
    }

    // Check if remaining questions can still prove the goal
    // If not, we can finish early
    if (canStillProveGoal()) {
        showNextQuestion();
    } else {
        // No possible path remains — goal disproven
        bcState.proofTrace.push({
            type: 'disproven',
            text: 'All rule paths exhausted — Goal DISPROVEN',
            detail: 'No remaining combination of unanswered questions can satisfy any rule for this goal.'
        });
        finishBackwardChaining();
    }
}

/**
 * Check if the goal can still be proven given known facts
 */
function canStillProveGoal() {
    const hypothesis = bcState.selectedHypothesis;

    for (const ruleId of hypothesis.rules) {
        const rule = BC_RULES[ruleId];
        if (!rule) continue;

        let canBeProven = true;
        for (const cond of rule.conditions) {
            if (bcState.knownFacts[cond] === false) {
                canBeProven = false;
                break;
            }
        }
        if (canBeProven) return true;
    }
    return false;
}

/**
 * Check if any rule for the selected hypothesis is fully proven
 */
function checkIfGoalProven() {
    const hypothesis = bcState.selectedHypothesis;

    for (const ruleId of hypothesis.rules) {
        const rule = BC_RULES[ruleId];
        if (!rule) continue;

        let allConditionsMet = true;
        for (const cond of rule.conditions) {
            if (bcState.knownFacts[cond] !== true) {
                allConditionsMet = false;
                break;
            }
        }

        if (allConditionsMet) {
            bcState.goalProven = true;
            bcState.provenRules.push(ruleId);
            bcState.proofTrace.push({
                type: 'proven',
                text: `Rule ${rule.id} SATISFIED — Goal "${hypothesis.label}" is PROVEN`,
                detail: `${rule.description}. All conditions are met.`
            });
        }
    }

    // Also track disproven rules
    for (const ruleId of hypothesis.rules) {
        const rule = BC_RULES[ruleId];
        if (!rule) continue;

        let disproven = false;
        for (const cond of rule.conditions) {
            if (bcState.knownFacts[cond] === false) {
                disproven = true;
                break;
            }
        }

        if (disproven && !bcState.disprovenRules.includes(ruleId) && !bcState.provenRules.includes(ruleId)) {
            bcState.disprovenRules.push(ruleId);
            bcState.rulesExamined.push({
                ruleId: rule.id,
                description: rule.description,
                status: 'disproven',
                reason: 'One or more conditions not met'
            });
        }
    }
}

/**
 * Finish the backward chaining process and display results
 */
function finishBackwardChaining() {
    bcState.finished = true;

    // Update progress bar to 100%
    document.getElementById('bc-progress-bar').style.width = '100%';

    // Show results
    document.getElementById('bc-step-questions').classList.add('hidden');
    document.getElementById('bc-step-result').classList.remove('hidden');

    const hypothesis = bcState.selectedHypothesis;

    // Result badge
    const badge = document.getElementById('bc-result-badge');
    const explanation = document.getElementById('bc-result-explanation');
    const hypLabel = document.getElementById('bc-result-hypothesis-label');

    hypLabel.textContent = `Hypothesis tested: ${hypothesis.label}`;

    if (bcState.goalProven) {
        badge.textContent = `${hypothesis.label} — PROVEN ✓`;
        badge.className = `result-badge ${hypothesis.badgeClass}`;
        explanation.textContent = `Backward Chaining Result: The hypothesis "${hypothesis.label}" has been PROVEN. ` +
            `By asking targeted questions and working backwards from the goal, the engine found that rule(s) ` +
            `${bcState.provenRules.map(r => r.toUpperCase()).join(', ')} had all conditions satisfied.`;
    } else {
        badge.textContent = `${hypothesis.label} — DISPROVEN ✗`;
        badge.className = 'result-badge badge-none';
        explanation.textContent = `Backward Chaining Result: The hypothesis "${hypothesis.label}" could NOT be proven. ` +
            `None of the rules (${hypothesis.rules.map(r => r.toUpperCase()).join(', ')}) had all their conditions met. ` +
            `This does not rule out dengue — it means the specific conditions for this classification were not confirmed.`;
    }

    // Proof trace
    displayBCProofTrace();

    // Rules examined
    displayBCRulesExamined();

    // Scroll to result
    document.getElementById('bc-step-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Display the backward chaining proof trace
 */
function displayBCProofTrace() {
    const container = document.getElementById('bc-proof-trace-content');
    container.innerHTML = '';

    bcState.proofTrace.forEach((step, idx) => {
        const el = document.createElement('div');
        el.className = `explanation-step bc-trace-${step.type}`;
        el.innerHTML = `
            <div class="step-label">Trace Step ${idx + 1} — ${step.text}</div>
            <p>${step.detail}</p>
        `;
        container.appendChild(el);
    });
}

/**
 * Display the rules examined during backward chaining
 */
function displayBCRulesExamined() {
    const container = document.getElementById('bc-rules-checked-list');
    container.innerHTML = '';

    const hypothesis = bcState.selectedHypothesis;

    hypothesis.rules.forEach(ruleId => {
        const rule = BC_RULES[ruleId];
        if (!rule) return;

        const isProven = bcState.provenRules.includes(ruleId);
        const isDisproven = bcState.disprovenRules.includes(ruleId);
        const status = isProven ? 'proven' : (isDisproven ? 'disproven' : 'not-evaluated');
        const statusLabel = isProven ? '✓ PROVEN' : (isDisproven ? '✗ DISPROVEN' : '— Not fully evaluated');

        const item = document.createElement('div');
        item.className = `rule-item bc-rule-${status}`;
        item.innerHTML = `
            <div class="rule-header">
                <span class="rule-id">${rule.id}</span>
                <span class="rule-conclusion bc-status-${status}">${statusLabel}</span>
            </div>
            <div class="rule-description">${rule.description}</div>
            <div class="rule-conditions">
                ${rule.conditions.map(c => {
                    const label = FACT_LABELS[c] || formatFactName(c);
                    const factKnown = bcState.knownFacts[c];
                    const tagClass = factKnown === true ? 'condition-tag-yes' : (factKnown === false ? 'condition-tag-no' : 'condition-tag');
                    return `<span class="${tagClass}">${label} ${factKnown === true ? '✓' : (factKnown === false ? '✗' : '?')}</span>`;
                }).join('')}
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Restart backward chaining (go back to hypothesis selection)
 */
function restartBackwardChaining() {
    resetBackwardChaining();
    initBackwardChaining();
}

/**
 * Reset backward chaining state
 */
function resetBackwardChaining() {
    bcState = {
        selectedHypothesis: null,
        currentRuleIndex: 0,
        currentConditionIndex: 0,
        knownFacts: {},
        proofTrace: [],
        rulesExamined: [],
        provenRules: [],
        disprovenRules: [],
        allQuestions: [],
        answeredQuestions: [],
        currentQuestionIdx: 0,
        goalProven: false,
        finished: false
    };

    document.getElementById('bc-step-hypothesis').classList.remove('hidden');
    document.getElementById('bc-step-questions').classList.add('hidden');
    document.getElementById('bc-step-result').classList.add('hidden');
}


// ============================================================
// SHARED UI HELPERS
// ============================================================

/**
 * formatFactName(factAtom)
 * Converts a Prolog atom name to a human-readable label.
 */
function formatFactName(name) {
    if (!name) return '';
    return String(name)
        .replace(/^_/, '').replace(/_$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}


// ============================================================
// RULE EXPLORER MODAL (Shared)
// ============================================================

let allRulesData = [];

async function openRulesModal() {
    const modal = document.getElementById('rules-modal');
    modal.classList.remove('hidden');

    if (allRulesData.length === 0) {
        try {
            const res = await fetch(`${API_BASE_URL}/rules`);
            if (res.ok) {
                const data = await res.json();
                allRulesData = Array.isArray(data.rules) ? data.rules : (data.rules ? data.rules.rules : []);
                renderRulesList(allRulesData);
            }
        } catch (e) {
            console.error('Failed to load rules for explorer', e);
        }
    }
}

function closeRulesModal() {
    document.getElementById('rules-modal').classList.add('hidden');
}

function renderRulesList(rules) {
    const listEl = document.getElementById('rules-modal-list');
    listEl.innerHTML = '';

    if (!rules || rules.length === 0) {
        listEl.innerHTML = '<p style="color: var(--color-text-muted);">No rules found.</p>';
        return;
    }

    rules.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'rule-card';
        const ruleId = (rule.rule_id || rule.id || '').toUpperCase();
        const desc = rule.description || 'No description available';
        
        card.innerHTML = `
            <span class="rule-card-badge">Rule ${ruleId}</span>
            <div class="rule-card-desc">${desc}</div>
        `;
        listEl.appendChild(card);
    });
}


// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Preset buttons (Forward Chaining)
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const preset = e.target.getAttribute('data-preset');
            applyPreset(preset);
        });
    });

    // Modal triggers
    const openBtn = document.getElementById('btn-open-rules');
    const closeBtn = document.getElementById('btn-close-rules');
    const modal = document.getElementById('rules-modal');
    const searchInput = document.getElementById('rule-search-input');

    if (openBtn) openBtn.addEventListener('click', openRulesModal);
    if (closeBtn) closeBtn.addEventListener('click', closeRulesModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeRulesModal();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allRulesData.filter(r => 
                (r.rule_id && r.rule_id.toLowerCase().includes(query)) ||
                (r.description && r.description.toLowerCase().includes(query))
            );
            renderRulesList(filtered);
        });
    }
});
