/**
 * Output templates for structured responses
 * These help guide the AI to produce consistent, well-formatted output
 */

export const OUTPUT_TEMPLATES = {
	biomarkerExplanation: `
**Your result:** {{value}} {{unit}} — {{status}} (for your age/sex).

**What {{biomarker_name}} measures:** {{description}}, it is important because/for {{importance}} (1 sentence).

**What your result can suggest:** {{interpretation}} (1–2 sentences, cautious).

**Key takeaways (max 3 bullets):**

- For you, this can mean: {{personal_meaning}}
- Possible factors affecting {{biomarker_name}}: {{factors}}
- The key next step for you could be: {{next_step}}
`,

	healthZoneOverview: `
**Overview of your {{zone_name}} results:**
{{summary}}

**What stands out (2–4 bullets):**
{{highlights}}

**How these markers relate:**
{{relationships}}

**Top 3 things to pay attention to:**
1. {{priority_1}}
2. {{priority_2}}
3. {{priority_3}}
`,

	outOfRangeReview: `
## Highest Priority to Review

**{{biomarker_a}}** — {{value}} {{unit}} ({{status}})

**Why it matters:**
{{clinical_relevance}}

**What could be influencing it:**
{{factors}}

**What it can mean (generally):**
{{interpretation}}

---

## Medium Priority to Monitor
{{medium_priority_markers}}

---

## Lower Priority (often affected by short-term factors)
{{lower_priority_markers}}
`,

	trendAnalysis: `
**Positive trends:**
{{improving_markers}}

**Areas needing attention:**
{{declining_markers}}

**What's driving these changes:**
{{factors}}

**Recommended actions:**
{{recommendations}}
`,

	doctorQuestions: `
**Questions to discuss with your doctor:**

1. {{question_1}}
2. {{question_2}}
3. {{question_3}}

**Follow-up tests to consider:**
{{suggested_tests}}

**Key points to mention:**
{{key_points}}
`,

	noHistoricalData: `
I don't have enough historical data to identify trends yet. You've only completed one test.

**To track your progress:**
- Consider testing again in 3-6 months
- This will help identify meaningful changes vs. normal fluctuations
- Consistent testing provides the best insights over time

Would you like me to explain your current results instead?
`,
} as const;
