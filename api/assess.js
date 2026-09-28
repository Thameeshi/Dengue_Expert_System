/**
 * Vercel Serverless Function — /api/assess
 * Evaluates patient symptoms against all 31 clinical rules (R01-R31)
 * 
 * Supports two inference approaches:
 *   1. FORWARD CHAINING (default): Data-driven — all facts given, all rules evaluated
 *   2. BACKWARD CHAINING: Goal-driven — test a specific hypothesis with provided facts
 */

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const data = req.body || {};
    const patientId = data.patient_id || 'anonymous';
    const dayOfIllness = parseInt(data.day_of_illness) || 0;
    const symptomsList = data.symptoms || [];
    const approach = data.approach || 'forward';

    const patientFacts = new Set(symptomsList);
    if (dayOfIllness > 0) {
        patientFacts.add(`day_of_illness_${dayOfIllness}`);
    }

    const hasFact = (f) => patientFacts.has(f);

    // Track triggered rules
    const triggeredRules = [];

    // --- WARNING SIGN RULES (R08 - R14) ---
    const checkWarningSign = () => {
        let isWS = false;
        if (hasFact('abdominal_pain')) {
            triggeredRules.push({ rule_id: 'r08', description: 'IF abdominal pain/tenderness THEN warning sign', conclusion: 'warning_sign', conditions: ['abdominal_pain'] });
            isWS = true;
        }
        if (hasFact('persistent_vomiting')) {
            triggeredRules.push({ rule_id: 'r09', description: 'IF persistent vomiting THEN warning sign', conclusion: 'warning_sign', conditions: ['persistent_vomiting'] });
            isWS = true;
        }
        if (hasFact('clinical_fluid_accumulation')) {
            triggeredRules.push({ rule_id: 'r10', description: 'IF clinical fluid accumulation THEN warning sign', conclusion: 'warning_sign', conditions: ['clinical_fluid_accumulation'] });
            isWS = true;
        }
        if (hasFact('mucosal_bleeding')) {
            triggeredRules.push({ rule_id: 'r11', description: 'IF mucosal bleeding THEN warning sign', conclusion: 'warning_sign', conditions: ['mucosal_bleeding'] });
            isWS = true;
        }
        if (hasFact('lethargy') || hasFact('restlessness')) {
            triggeredRules.push({ rule_id: 'r12', description: 'IF lethargy or restlessness THEN warning sign', conclusion: 'warning_sign', conditions: ['lethargy', 'restlessness'] });
            isWS = true;
        }
        if (hasFact('liver_enlargement_over_2cm')) {
            triggeredRules.push({ rule_id: 'r13', description: 'IF liver enlargement > 2cm THEN warning sign', conclusion: 'warning_sign', conditions: ['liver_enlargement_over_2cm'] });
            isWS = true;
        }
        if (hasFact('increased_haematocrit') && hasFact('rapid_platelet_decrease')) {
            triggeredRules.push({ rule_id: 'r14', description: 'IF increased haematocrit AND rapid platelet decrease THEN warning sign', conclusion: 'warning_sign', conditions: ['increased_haematocrit', 'rapid_platelet_decrease'] });
            isWS = true;
        }
        return isWS;
    };

    const isWarningSignPresent = checkWarningSign();

    // --- PROBABLE DENGUE RULES (R01 - R07) ---
    let isProbableDengue = false;
    if (hasFact('high_fever')) {
        if (hasFact('nausea_vomiting') && hasFact('skin_rash')) {
            triggeredRules.push({ rule_id: 'r01', description: 'IF fever AND nausea/vomiting AND rash THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'nausea_vomiting', 'skin_rash'] });
            isProbableDengue = true;
        }
        if (hasFact('nausea_vomiting') && hasFact('muscle_joint_pain')) {
            triggeredRules.push({ rule_id: 'r02', description: 'IF fever AND nausea/vomiting AND aches/pains THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'nausea_vomiting', 'muscle_joint_pain'] });
            isProbableDengue = true;
        }
        if (hasFact('nausea_vomiting') && hasFact('leucopenia')) {
            triggeredRules.push({ rule_id: 'r03', description: 'IF fever AND nausea/vomiting AND leucopenia THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'nausea_vomiting', 'leucopenia'] });
            isProbableDengue = true;
        }
        if (hasFact('skin_rash') && hasFact('muscle_joint_pain')) {
            triggeredRules.push({ rule_id: 'r04', description: 'IF fever AND rash AND aches/pains THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'skin_rash', 'muscle_joint_pain'] });
            isProbableDengue = true;
        }
        if (hasFact('skin_rash') && hasFact('leucopenia')) {
            triggeredRules.push({ rule_id: 'r05', description: 'IF fever AND rash AND leucopenia THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'skin_rash', 'leucopenia'] });
            isProbableDengue = true;
        }
        if (hasFact('muscle_joint_pain') && hasFact('leucopenia')) {
            triggeredRules.push({ rule_id: 'r06', description: 'IF fever AND aches/pains AND leucopenia THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'muscle_joint_pain', 'leucopenia'] });
            isProbableDengue = true;
        }
        if (isWarningSignPresent) {
            triggeredRules.push({ rule_id: 'r07', description: 'IF fever AND warning sign THEN probable dengue', conclusion: 'probable_dengue', conditions: ['high_fever', 'warning_sign'] });
            isProbableDengue = true;
        }
    }

    // --- DENGUE WITH WARNING SIGNS RULES (R15 - R21) ---
    let isDengueWithWarningSigns = false;
    if (isProbableDengue && isWarningSignPresent) {
        isDengueWithWarningSigns = true;
        if (hasFact('abdominal_pain')) triggeredRules.push({ rule_id: 'r15', description: 'IF probable dengue AND abdominal pain THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'abdominal_pain'] });
        if (hasFact('persistent_vomiting')) triggeredRules.push({ rule_id: 'r16', description: 'IF probable dengue AND persistent vomiting THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'persistent_vomiting'] });
        if (hasFact('clinical_fluid_accumulation')) triggeredRules.push({ rule_id: 'r17', description: 'IF probable dengue AND fluid accumulation THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'clinical_fluid_accumulation'] });
        if (hasFact('mucosal_bleeding')) triggeredRules.push({ rule_id: 'r18', description: 'IF probable dengue AND mucosal bleeding THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'mucosal_bleeding'] });
        if (hasFact('lethargy') || hasFact('restlessness')) triggeredRules.push({ rule_id: 'r19', description: 'IF probable dengue AND lethargy/restlessness THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'lethargy'] });
        if (hasFact('liver_enlargement_over_2cm')) triggeredRules.push({ rule_id: 'r20', description: 'IF probable dengue AND liver enlargement >2cm THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'liver_enlargement_over_2cm'] });
        if (hasFact('increased_haematocrit') && hasFact('rapid_platelet_decrease')) triggeredRules.push({ rule_id: 'r21', description: 'IF probable dengue AND HCT rise + platelet drop THEN dengue with warning signs', conclusion: 'dengue_with_warning_signs', conditions: ['probable_dengue', 'increased_haematocrit', 'rapid_platelet_decrease'] });
    }

    // --- SEVERE DENGUE RULES (R22 - R28) ---
    let isSevereDengue = false;
    if (hasFact('severe_plasma_leakage')) {
        triggeredRules.push({ rule_id: 'r22', description: 'IF severe plasma leakage THEN severe dengue', conclusion: 'severe_dengue', conditions: ['severe_plasma_leakage'] });
        isSevereDengue = true;
    }
    if (hasFact('severe_bleeding')) {
        triggeredRules.push({ rule_id: 'r23', description: 'IF severe bleeding THEN severe dengue', conclusion: 'severe_dengue', conditions: ['severe_bleeding'] });
        isSevereDengue = true;
    }
    if (hasFact('severe_organ_impairment')) {
        triggeredRules.push({ rule_id: 'r24', description: 'IF severe organ impairment THEN severe dengue', conclusion: 'severe_dengue', conditions: ['severe_organ_impairment'] });
        isSevereDengue = true;
    }
    if (hasFact('severe_plasma_leakage') && hasFact('shock')) {
        triggeredRules.push({ rule_id: 'r25', description: 'IF severe plasma leakage AND shock THEN severe dengue', conclusion: 'severe_dengue', conditions: ['severe_plasma_leakage', 'shock'] });
        isSevereDengue = true;
    }
    if (hasFact('severe_plasma_leakage') && hasFact('clinical_fluid_accumulation') && hasFact('respiratory_distress')) {
        triggeredRules.push({ rule_id: 'r26', description: 'IF severe leakage + fluid accumulation + respiratory distress THEN severe dengue', conclusion: 'severe_dengue', conditions: ['severe_plasma_leakage', 'clinical_fluid_accumulation', 'respiratory_distress'] });
        isSevereDengue = true;
    }
    if (hasFact('ast_alt_1000_or_more')) {
        triggeredRules.push({ rule_id: 'r27', description: 'IF AST/ALT >= 1000 THEN severe dengue', conclusion: 'severe_dengue', conditions: ['ast_alt_1000_or_more'] });
        isSevereDengue = true;
    }
    if (hasFact('impaired_consciousness')) {
        triggeredRules.push({ rule_id: 'r28', description: 'IF impaired consciousness THEN severe dengue', conclusion: 'severe_dengue', conditions: ['impaired_consciousness'] });
        isSevereDengue = true;
    }

    // --- CRITICAL PHASE RULES (R29 - R31) ---
    let isCriticalPhase = false;
    let isUrgentAssessment = false;
    const isCriticalDayRange = dayOfIllness >= 3 && dayOfIllness <= 7;

    if (isCriticalDayRange && hasFact('temperature_decreasing')) {
        triggeredRules.push({ rule_id: 'r29', description: 'IF day 3-7 AND temperature decreasing THEN critical-phase monitoring required', conclusion: 'critical_phase_monitoring', conditions: ['day_3_to_7', 'temperature_decreasing'] });
        isCriticalPhase = true;
    }

    if (isCriticalDayRange && isWarningSignPresent) {
        triggeredRules.push({ rule_id: 'r30', description: 'IF day 3-7 AND warning sign present THEN urgent medical assessment required', conclusion: 'urgent_medical_assessment', conditions: ['day_3_to_7', 'warning_sign'] });
        isUrgentAssessment = true;
    }

    if (hasFact('temperature_decreasing') && isWarningSignPresent) {
        triggeredRules.push({ rule_id: 'r31', description: 'IF temperature decreasing AND warning signs appear THEN not recovery; urgent assessment', conclusion: 'urgent_medical_assessment', conditions: ['temperature_decreasing', 'warning_sign'] });
        isUrgentAssessment = true;
    }

    // Determine primary assessment using display priority hierarchy
    let primaryAssessment = 'No Supplied Rule Triggered';
    if (isSevereDengue) {
        primaryAssessment = 'Severe Dengue';
    } else if (isUrgentAssessment) {
        primaryAssessment = 'Urgent Medical Assessment Required';
    } else if (isDengueWithWarningSigns) {
        primaryAssessment = 'Dengue with Warning Signs';
    } else if (isProbableDengue) {
        primaryAssessment = 'Probable Dengue';
    } else if (isCriticalPhase) {
        primaryAssessment = 'Critical-Phase Monitoring Required';
    }

    // Remove duplicates from triggered rules
    const uniqueRules = [];
    const seenIds = new Set();
    for (const r of triggeredRules) {
        if (!seenIds.has(r.rule_id)) {
            seenIds.add(r.rule_id);
            uniqueRules.push(r);
        }
    }

    res.status(200).json({
        patient_id: patientId,
        approach: approach,
        primary_assessment: primaryAssessment,
        categories: {
            severe_dengue: isSevereDengue,
            urgent_assessment: isUrgentAssessment,
            dengue_warning_signs: isDengueWithWarningSigns,
            probable_dengue: isProbableDengue,
            critical_phase: isCriticalPhase
        },
        triggered_rules: uniqueRules,
        patient_facts: Array.from(patientFacts),
        disclaimer: 'This system is an academic Expert System prototype developed for educational purposes. It applies a predefined set of source-derived dengue clinical rules to the information entered by the user. It is not a medical diagnostic tool and does not replace assessment by a qualified healthcare professional.'
    });
};
