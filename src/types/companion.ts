// Types for Companion chat functionality

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context?: ChatContext;
  isStreaming?: boolean;
  isError?: boolean;
  retryMessageId?: string; // ID of the user message to retry
}

export interface ChatContext {
  type: 'healthZone' | 'biomarker' | 'general' | 'bioAge';
  id?: string;
  name?: string;
  data?: unknown;
}

export interface UserProfile {
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  accessToken: string;
}

export interface ChatRequest {
  message: string;
  context?: ChatContext;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  conversationId?: string;
  userProfile: UserProfile;
}

export interface SSETextDelta {
  delta: string;
}

export interface SSEContextUsed {
  type: string;
  name: string;
}

export interface SSEComplete {
  finalOutput: string;
  timestamp: string;
  conversationId?: string;
}

export interface SSEError {
  message: string;
}

export type SSEEventType = 'text_delta' | 'context_used' | 'complete' | 'error';

// Suggested prompts for the companion
export interface SuggestedPrompt {
  text: string;
  icon: string;
  category: string;
  contextType?: 'healthZone' | 'biomarker' | 'general' | 'bioAge';
  contextId?: string;
  contextName?: string;
  requiresMultipleResults?: boolean; // If true, prompt needs at least 2 results to show trends
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  // Results Overview
  {
    text: "Explain my latest lab results in simple language and highlight what matters most",
    icon: "clipboard-list",
    category: "Results Overview",
    contextType: "general",
    contextName: "Latest Results",
  },
  {
    text: "Review my out-of-range biomarkers and explain why they may be off",
    icon: "alert-triangle",
    category: "Results Overview",
    contextType: "general",
    contextName: "Latest Results",
  },
  {
    text: "Identify my top focus areas based on my data and give me one action per area",
    icon: "target",
    category: "Results Overview",
    contextType: "general",
    contextName: "Latest Results",
  },
  // Trends & Patterns
  {
    text: "Which biomarkers are trending positively and what's driving improvement?",
    icon: "trending-up",
    category: "Trends & Patterns",
    contextType: "general",
    contextName: "Latest Results",
    requiresMultipleResults: true,
  },
  {
    text: "Which biomarkers are trending negatively and what steps can help reverse that?",
    icon: "trending-down",
    category: "Trends & Patterns",
    contextType: "general",
    contextName: "Latest Results",
    requiresMultipleResults: true,
  },
  {
    text: "What changed since my last test and which changes are meaningful?",
    icon: "git-compare",
    category: "Trends & Patterns",
    contextType: "general",
    contextName: "Latest Results",
  },
  // Deep Insights
  {
    text: "Do any results cluster into common themes (lipids, blood sugar, liver, kidney)?",
    icon: "pie-chart",
    category: "Deep Insights",
    contextType: "general",
    contextName: "Latest Results",
  },
  {
    text: "What's my biggest potential risk area right now?",
    icon: "shield-alert",
    category: "Deep Insights",
    contextType: "general",
    contextName: "Latest Results",
  },
  {
    text: "Which biomarkers need the closest attention and what can I do to improve them?",
    icon: "eye",
    category: "Deep Insights",
    contextType: "general",
    contextName: "Latest Results",
  },
  // Doctor & Lifestyle
  {
    text: "Give me a list of questions and follow-up tests to discuss with my doctor",
    icon: "stethoscope",
    category: "Doctor & Lifestyle",
    contextType: "general",
    contextName: "Latest Results",
  },
  {
    text: "List common factors that can shift my results (nutrition, exercise, alcohol, illness)",
    icon: "list-checks",
    category: "Doctor & Lifestyle",
    contextType: "general",
    contextName: "Latest Results",
  },
];
