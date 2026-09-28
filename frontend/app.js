/**
 * app.js
 * Dengue Risk & Warning-Sign Assessment Expert System
 *
 * Frontend JavaScript — Responsible ONLY for:
 *   1. Collecting patient-entered data from the form
 *   2. Sending the data to the Prolog backend via HTTP
 *   3. Displaying the assessment result returned by Prolog
 *
 * IMPORTANT:
 *   This file does NOT contain any clinical decision logic.
 *   All inference is performed by the SWI-Prolog backend.
 */

// ============================================================
// CONFIGURATION
// ============================================================

// Robust API URL detection for local file://, local server 8060, and Vercel cloud
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


// ============================================================
// MAIN ASSESSMENT FUNCTION
// ============================================================

/**
 * runAssessment()
 * Collects form data, sends it to the Prolog backend,
 * and displays the returned assessment result.
 */
async function runAssessment() {
    // Collect selected symptoms
    const checkboxes = document.querySelectorAll('input[name="symptoms"]:checked');
    const symptoms = Array.from(checkboxes).map(cb => cb.value);

    // Collect patient info
    const patientId = document.getElementById('patient-id').value.trim() || 'anonymous';
    const dayOfIllnessRaw = document.getElementById('day-of-illness').value.trim();
    const dayOfIllness = dayOfIllnessRaw ? parseInt(dayOfIllnessRaw, 10) : 0;

    // Validate: at least one symptom should be selected
    if (symptoms.length === 0 && dayOfIllness === 0) {
        showError('Please select at least one symptom or enter the day of illness before running the assessment.');
        return;
    }

    // Build request payload
    const payload = {
        patient_id: patientId,
        day_of_illness: dayOfIllness,
        symptoms: symptoms
    };

    // Show loading state
    showLoading(true);
    hideResults();
    hideError();

    try {
        const response = await fetch(`${API_BASE_URL}/assess`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const result = await response.json();
        displayResults(result);

    } catch (error) {
        console.error('Assessment error:', error);
        showError(
            'Could not connect to the Prolog backend server. ' +
            'Please ensure SWI-Prolog is running on port 8060. ' +
            'Start it with: swipl backend/main.pl'
        );
    } finally {
        showLoading(false);
    }
}


// ============================================================
// DISPLAY RESULTS
// ============================================================

/**
 * displayResults(result)
 * Renders the assessment result from the Prolog backend.
 */
function displayResults(result) {
    const resultsSection = document.getElementById('results-section');
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 1. Primary Assessment Badge
    displayPrimaryAssessment(result);

    // 2. Categories
    displayCategories(result.categories);

    // 3. Triggered Rules
    displayTriggeredRules(result.triggered_rules);

    // 4. Explanation
    displayExplanation(result);

    // 5. Patient Facts
    displayPatientFacts(result.patient_facts);
}

/**
 * displayPrimaryAssessment(result)
 * Shows the primary assessment badge and explanation text.
 */
function displayPrimaryAssessment(result) {
    const badge = document.getElementById('result-badge');
    const explanation = document.getElementById('result-explanation');
    const patientRef = document.getElementById('result-patient-ref');

    const assessment = result.primary_assessment;

    // Set patient reference
    patientRef.textContent = result.patient_id !== 'anonymous'
        ? `Patient Reference: ${result.patient_id}`
        : '';

    // Set badge text and style
    badge.textContent = assessment;
    badge.className = 'result-badge';

    if (assessment.includes('Severe')) {
        badge.classList.add('badge-severe');
    } else if (assessment.includes('Urgent')) {
        badge.classList.add('badge-urgent');
    } else if (assessment.includes('Warning')) {
        badge.classList.add('badge-warning');
    } else if (assessment.includes('Probable')) {
        badge.classList.add('badge-probable');
    } else if (assessment.includes('Critical')) {
        badge.classList.add('badge-critical');
    } else {
        badge.classList.add('badge-none');
    }

    // Set explanation text
    if (assessment === 'No Supplied Rule Triggered') {
        explanation.textContent =
            'Based on the encoded rules, the entered information did not satisfy any of the predefined dengue assessment rules. ' +
            'This does not rule out dengue — it means the specific rule conditions were not met by the entered data.';
    } else {
        explanation.textContent =
            'Based on the supplied symptoms and the encoded clinical rules, the system identifies a dengue-related risk category ' +
            'requiring appropriate medical attention. See the triggered rules below for details.';
    }
}

/**
 * displayCategories(categories)
 * Shows the status of each assessment category.
 */
function displayCategories(categories) {
    const grid = document.getElementById('categories-grid');
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

/**
 * displayTriggeredRules(rules)
 * Shows each triggered rule with its ID, description, conditions, and conclusion.
 */
function displayTriggeredRules(rules) {
    const container = document.getElementById('triggered-rules-list');
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

/**
 * displayExplanation(result)
 * Generates a step-by-step explanation of the inference process.
 */
function displayExplanation(result) {
    const container = document.getElementById('explanation-content');
    container.innerHTML = '';

    const rules = result.triggered_rules || [];

    if (rules.length === 0) {
        container.innerHTML = `
            <div class="explanation-step">
                <div class="step-label">Inference Result</div>
                <p>The Prolog inference engine evaluated all 31 encoded rules against the entered patient data. 
                None of the rule conditions were fully satisfied by the submitted facts.</p>
            </div>
        `;
        return;
    }

    // Step 1: Facts received
    const step1 = document.createElement('div');
    step1.className = 'explanation-step';
    const factsSubmitted = (result.patient_facts || []).map(f => FACT_LABELS[f] || formatFactName(f)).join(', ');
    step1.innerHTML = `
        <div class="step-label">Step 1 — Facts Received</div>
        <p>The following patient facts were asserted into the Prolog knowledge base: ${factsSubmitted}.</p>
    `;
    container.appendChild(step1);

    // Step 2: Rules evaluated
    const step2 = document.createElement('div');
    step2.className = 'explanation-step';
    const ruleIds = rules.map(r => String(r.rule_id).toUpperCase()).join(', ');
    step2.innerHTML = `
        <div class="step-label">Step 2 — Rules Evaluated</div>
        <p>The inference engine evaluated all rules (R01–R31). The following rules were triggered: ${ruleIds}.</p>
    `;
    container.appendChild(step2);

    // Step 3: For each key conclusion
    const conclusions = {};
    rules.forEach(r => {
        const conclusion = CONCLUSION_LABELS[r.conclusion] || formatFactName(r.conclusion);
        if (!conclusions[conclusion]) {
            conclusions[conclusion] = [];
        }
        conclusions[conclusion].push(r);
    });

    let stepNum = 3;
    for (const [conclusion, conRules] of Object.entries(conclusions)) {
        const step = document.createElement('div');
        step.className = 'explanation-step';
        const ruleDescs = conRules.map(r =>
            `${String(r.rule_id).toUpperCase()}: ${r.description}`
        ).join('; ');
        step.innerHTML = `
            <div class="step-label">Step ${stepNum} — Derived: ${conclusion}</div>
            <p>${ruleDescs}</p>
        `;
        container.appendChild(step);
        stepNum++;
    }

    // Final step: Primary assessment
    const finalStep = document.createElement('div');
    finalStep.className = 'explanation-step';
    finalStep.innerHTML = `
        <div class="step-label">Step ${stepNum} — Final Assessment</div>
        <p>Based on the display priority hierarchy (Severe Dengue > Urgent Assessment > Warning Signs > Probable > Critical-Phase > None), 
        the primary assessment is: <strong>${result.primary_assessment}</strong>.</p>
    `;
    container.appendChild(finalStep);
}

/**
 * displayPatientFacts(facts)
 * Shows the facts that were submitted to Prolog.
 */
function displayPatientFacts(facts) {
    const container = document.getElementById('facts-list');
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


// ============================================================
// UI HELPERS
// ============================================================

/**
 * clearForm()
 * Resets all form inputs and hides results.
 */
function clearForm() {
    document.getElementById('patient-id').value = '';
    document.getElementById('day-of-illness').value = '';

    const checkboxes = document.querySelectorAll('input[name="symptoms"]');
    checkboxes.forEach(cb => { cb.checked = false; });

    hideResults();
    hideError();
}

/**
 * showLoading(show)
 * Shows or hides the loading indicator.
 */
function showLoading(show) {
    const el = document.getElementById('loading');
    if (show) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

/**
 * showError(message)
 * Displays an error message.
 */
function showError(message) {
    const el = document.getElementById('error-message');
    const textEl = document.getElementById('error-text');
    textEl.textContent = message;
    el.classList.remove('hidden');
}

/**
 * hideError()
 * Hides the error message.
 */
function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

/**
 * hideResults()
 * Hides the results section.
 */
function hideResults() {
    document.getElementById('results-section').classList.add('hidden');
}

/**
 * formatFactName(factAtom)
 * Converts a Prolog atom name to a human-readable label.
 * Example: "high_fever" -> "High Fever"
 */
function formatFactName(name) {
    if (!name) return '';
    return String(name)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================
// NEW FEATURE 1: CLINICAL TEST CASE PRESET LOADERS
// ============================================================

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

    // Reset form
    document.getElementById('assessment-form').reset();

    // Set basic info
    document.getElementById('patient-id').value = preset.patient_id;
    document.getElementById('day-of-illness').value = preset.day_of_illness;

    // Check symptoms
    preset.symptoms.forEach(sym => {
        const checkbox = document.querySelector(`input[value="${sym}"]`);
        if (checkbox) checkbox.checked = true;
    });

    // Auto-evaluate for seamless demo
    runAssessment();
}

// ============================================================
// NEW FEATURE 2: PROLOG KNOWLEDGE BASE RULE EXPLORER MODAL
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
                allRulesData = data.rules.rules || data.rules || [];
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

// Event Listeners for New Features
document.addEventListener('DOMContentLoaded', () => {
    // Preset buttons
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

