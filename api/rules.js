/**
 * Vercel Serverless Function — /api/rules
 * Returns all 31 Prolog clinical rules for the Rule Explorer Modal
 */

const ALL_RULES = [
    { rule_id: "r01", description: "IF high fever AND nausea/vomiting AND skin rash THEN probable dengue" },
    { rule_id: "r02", description: "IF high fever AND nausea/vomiting AND muscle/joint pain THEN probable dengue" },
    { rule_id: "r03", description: "IF high fever AND nausea/vomiting AND leucopenia THEN probable dengue" },
    { rule_id: "r04", description: "IF high fever AND skin rash AND muscle/joint pain THEN probable dengue" },
    { rule_id: "r05", description: "IF high fever AND skin rash AND leucopenia THEN probable dengue" },
    { rule_id: "r06", description: "IF high fever AND muscle/joint pain AND leucopenia THEN probable dengue" },
    { rule_id: "r07", description: "IF high fever AND any warning sign THEN probable dengue" },

    { rule_id: "r08", description: "IF abdominal pain/tenderness THEN warning sign" },
    { rule_id: "r09", description: "IF persistent vomiting THEN warning sign" },
    { rule_id: "r10", description: "IF clinical fluid accumulation THEN warning sign" },
    { rule_id: "r11", description: "IF mucosal bleeding THEN warning sign" },
    { rule_id: "r12", description: "IF lethargy or restlessness THEN warning sign" },
    { rule_id: "r13", description: "IF liver enlargement > 2cm THEN warning sign" },
    { rule_id: "r14", description: "IF increased haematocrit AND rapid platelet decrease THEN warning sign" },

    { rule_id: "r15", description: "IF probable dengue AND abdominal pain THEN dengue with warning signs" },
    { rule_id: "r16", description: "IF probable dengue AND persistent vomiting THEN dengue with warning signs" },
    { rule_id: "r17", description: "IF probable dengue AND clinical fluid accumulation THEN dengue with warning signs" },
    { rule_id: "r18", description: "IF probable dengue AND mucosal bleeding THEN dengue with warning signs" },
    { rule_id: "r19", description: "IF probable dengue AND lethargy/restlessness THEN dengue with warning signs" },
    { rule_id: "r20", description: "IF probable dengue AND liver enlargement > 2cm THEN dengue with warning signs" },
    { rule_id: "r21", description: "IF probable dengue AND HCT rise + platelet drop THEN dengue with warning signs" },

    { rule_id: "r22", description: "IF severe plasma leakage THEN severe dengue" },
    { rule_id: "r23", description: "IF severe bleeding THEN severe dengue" },
    { rule_id: "r24", description: "IF severe organ impairment THEN severe dengue" },
    { rule_id: "r25", description: "IF severe plasma leakage AND shock THEN severe dengue" },
    { rule_id: "r26", description: "IF severe leakage + fluid accumulation + respiratory distress THEN severe dengue" },
    { rule_id: "r27", description: "IF AST/ALT >= 1000 THEN severe dengue" },
    { rule_id: "r28", description: "IF impaired consciousness THEN severe dengue" },

    { rule_id: "r29", description: "IF day 3-7 AND temperature decreasing THEN critical-phase monitoring required" },
    { rule_id: "r30", description: "IF day 3-7 AND warning sign present THEN urgent medical assessment required" },
    { rule_id: "r31", description: "IF temperature decreasing AND warning signs appear THEN not recovery; urgent assessment" }
];

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.status(200).json({ rules: ALL_RULES });
};
