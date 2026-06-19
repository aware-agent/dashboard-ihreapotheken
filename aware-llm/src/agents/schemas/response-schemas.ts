import { z } from "zod";

/**
 * Base response schema with common fields
 */
const BaseResponseSchema = z.object({
	disclaimer: z
		.string()
		.describe(
			"Medical disclaimer statement that must be included in every response",
		),
});

/**
 * Schema for biomarker explanation responses
 */
export const BiomarkerExplanationSchema = BaseResponseSchema.extend({
	result: z.object({
		value: z.number().describe("The biomarker value"),
		unit: z.string().describe("Unit of measurement"),
		status: z
			.enum(["optimal", "in_range", "high", "low", "no_range"])
			.describe("Status relative to reference range"),
		statusForUserProfile: z
			.string()
			.describe("Status description personalized for user's age and sex"),
	}),
	explanation: z.object({
		whatItMeasures: z
			.string()
			.describe("Simple explanation of what this biomarker measures"),
		whatItMeans: z
			.string()
			.describe("What the user's specific result could suggest"),
		relatedContext: z
			.string()
			.optional()
			.describe("Context from related biomarkers if available"),
	}),
	takeaways: z
		.array(
			z.object({
				title: z.string().describe("Brief title for the takeaway"),
				description: z.string().describe("Detailed explanation"),
			}),
		)
		.max(3)
		.describe("Top 3 personalized takeaways for the user"),
});

export type BiomarkerExplanation = z.infer<typeof BiomarkerExplanationSchema>;

/**
 * Schema for health zone overview responses
 */
export const HealthZoneOverviewSchema = BaseResponseSchema.extend({
	zone: z.object({
		name: z.string().describe("Name of the health zone"),
		inRange: z.number().describe("Count of biomarkers in range"),
		outOfRange: z.number().describe("Count of biomarkers out of range"),
	}),
	highlights: z
		.array(
			z.object({
				biomarkerName: z.string(),
				status: z.string(),
				significance: z.string().describe("Why this marker stands out"),
			}),
		)
		.describe("Key biomarkers that stand out in this zone"),
	relationships: z
		.string()
		.describe("How the markers in this zone relate to each other"),
	focusAreas: z
		.array(z.string())
		.max(3)
		.describe("Top 3 things to pay attention to"),
});

export type HealthZoneOverview = z.infer<typeof HealthZoneOverviewSchema>;

/**
 * Schema for out-of-range biomarker review responses
 */
export const OutOfRangeReviewSchema = BaseResponseSchema.extend({
	prioritizedBiomarkers: z
		.array(
			z.object({
				name: z.string().describe("Biomarker name"),
				value: z.string().describe("Value with unit"),
				status: z
					.enum(["high", "low"])
					.describe("Whether value is high or low"),
				priority: z
					.enum(["high", "medium", "low"])
					.describe("Clinical priority level"),
				whyItMatters: z.string().describe("Why this biomarker is important"),
				influencingFactors: z
					.array(z.string())
					.describe("Common factors that could affect this marker"),
				generalMeaning: z
					.string()
					.describe("General interpretation using cautious language"),
			}),
		)
		.describe("Biomarkers sorted by clinical importance"),
});

export type OutOfRangeReview = z.infer<typeof OutOfRangeReviewSchema>;

/**
 * Schema for trend analysis responses
 */
export const TrendAnalysisSchema = BaseResponseSchema.extend({
	hasTrends: z
		.boolean()
		.describe("Whether there is enough data to identify trends"),
	improving: z
		.array(
			z.object({
				name: z.string(),
				change: z.string().describe("Description of the improvement"),
				significance: z.string().describe("Why this improvement matters"),
			}),
		)
		.describe("Biomarkers showing improvement"),
	declining: z
		.array(
			z.object({
				name: z.string(),
				change: z.string().describe("Description of the decline"),
				significance: z.string().describe("Why this change matters"),
				suggestedActions: z.string().describe("General lifestyle suggestions"),
			}),
		)
		.describe("Biomarkers showing decline"),
	patterns: z
		.string()
		.optional()
		.describe("Any patterns observed across markers"),
	insufficientDataMessage: z
		.string()
		.optional()
		.describe("Message if not enough data for trends"),
});

export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;

/**
 * Schema for doctor questions response
 */
export const DoctorQuestionsSchema = BaseResponseSchema.extend({
	questions: z
		.array(
			z.object({
				question: z.string().describe("Question to ask the doctor"),
				context: z
					.string()
					.describe("Why this question is relevant based on results"),
			}),
		)
		.max(5)
		.describe("Suggested questions for doctor consultation"),
	suggestedTests: z
		.array(z.string())
		.optional()
		.describe("Follow-up tests to consider discussing"),
	keyPoints: z
		.array(z.string())
		.optional()
		.describe("Key points from results to mention"),
});

export type DoctorQuestions = z.infer<typeof DoctorQuestionsSchema>;

/**
 * Generic chat response schema for general queries
 */
export const GeneralChatResponseSchema = BaseResponseSchema.extend({
	response: z.string().describe("The main response content"),
	relatedTopics: z
		.array(z.string())
		.optional()
		.describe("Related topics the user might be interested in"),
	actionItems: z
		.array(z.string())
		.optional()
		.describe("Suggested next steps or actions"),
});

export type GeneralChatResponse = z.infer<typeof GeneralChatResponseSchema>;
