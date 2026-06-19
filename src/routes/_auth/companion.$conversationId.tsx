import {
  ChevronRight,
  Heart,
  Send,
  Square,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import companionIcon from "@/assets/companion-icon.png";

export const Route = createFileRoute("/_auth/companion/$conversationId")({
  component: Companion,
});
import { ChatHistorySidebar } from "@/components/companion/ChatHistorySidebar";
import { ChatMessage } from "@/components/companion/ChatMessage";
import { ContextSelector } from "@/components/companion/ContextSelector";
import { SuggestedPrompts } from "@/components/companion/SuggestedPrompts";
import { PageLayout } from "@/components/PageLayout";
import { ProFeatureGate } from "@/components/shared/ProFeatureGate";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanionChat } from "@/hooks/useCompanionChat";
import { useLocale } from "@/hooks/useLocale";
import { useResults } from "@/hooks/useResults";
import { useUserProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import type { ChatContext, SuggestedPrompt } from "@/types/companion";
import { useSearchParams } from "@/hooks/useSearchParams";

const MIN_TEXTAREA_ROWS = 1; // Minimum number of rows when empty (1 line)
const MAX_TEXTAREA_ROWS = 5; // Maximum number of rows before scrolling (5 lines)
const LINE_HEIGHT = 24; // Approximate line height in pixels
const MAX_TEXTAREA_HEIGHT = LINE_HEIGHT * MAX_TEXTAREA_ROWS; // Maximum height in pixels before scrolling (5 lines)

// Placeholder for non-members
function CompanionPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      {/* Companion icon placeholder */}
      <Skeleton className="w-40 h-40 rounded-full mb-8" />

      {/* Welcome text placeholder */}
      <Skeleton className="h-8 w-64 mb-10" />

      {/* Quick suggestion cards placeholder */}
      <div className="grid md:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-4">
              <Skeleton className="w-6 h-6 rounded-full mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input area placeholder */}
      <div className="w-full max-w-3xl">
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
export default function Companion() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const { data: user, isLoading: userLoading } = useUserProfile();
  const isMember = user?.activeMembershipInfo?.isMember ?? false;
  const { conversationId: conversationIdParam } = Route.useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();

  // Build quick suggestions with translations
  const quickSuggestions = useMemo(
    () => [
      {
        iconComponent: Trophy,
        iconBg: "bg-hm-optimal/10",
        iconColor: "text-hm-optimal",
        text: t("companion.quickSuggestions.healthWins"),
        icon: "trophy",
        category: "Quick Suggestions",
        contextType: "general" as const,
        contextName: "Latest Results",
      },
      {
        iconComponent: TrendingUp,
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
        text: t("companion.quickSuggestions.focusImproving"),
        icon: "trending-up",
        category: "Quick Suggestions",
        contextType: "general" as const,
        contextName: "Latest Results",
      },
      {
        iconComponent: Heart,
        iconBg: "bg-hz-heart/10",
        iconColor: "text-hz-heart",
        text: t("companion.quickSuggestions.cholesterol"),
        icon: "heart",
        category: "Quick Suggestions",
        contextType: "general" as const,
        contextName: "Latest Results",
      },
    ],
    [t],
  );

  const {
    messages,
    isLoading,
    isLoadingConversation,
    sendMessage,
    retryMessage,
    stopStreaming,
    currentContext,
    conversationId,
    loadConversation,
    clearChat,
  } = useCompanionChat();

  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const [selectedContext, setSelectedContext] = useState<ChatContext | null>(
    null,
  );

  // Get data for auto-context detection
  const { data: resultsData } = useResults();

  // Function to resize textarea based on content
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Account for padding: pt-3 (12px top) + pb-0 (0px bottom) = 12px total vertical padding
      const verticalPadding = 12;
      const minHeight = LINE_HEIGHT * MIN_TEXTAREA_ROWS + verticalPadding; // 1 line + padding
      const maxHeight = LINE_HEIGHT * MAX_TEXTAREA_ROWS + verticalPadding; // 5 lines + padding

      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      // Calculate target height:
      // - If empty: use minimum (1 line + padding)
      // - If has content: use actual content height, capped at max (5 lines + padding)
      const hasContent = inputValue.trim().length > 0;
      const targetHeight = hasContent
        ? Math.min(scrollHeight, maxHeight)
        : minHeight;

      textarea.style.height = `${targetHeight}px`;
    }
  }, [inputValue]);

  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Sync selectedContext with currentContext from hook (from URL params)
  // Always update when currentContext changes (e.g., when clicking a new prompt)
  useEffect(() => {
    if (currentContext) {
      setSelectedContext(currentContext);
    }
  }, [currentContext]);

  // Generate prompt based on context type
  const generatePromptForContext = useCallback(
    (contextType: ChatContext["type"], contextName?: string): string => {
      switch (contextType) {
        case "biomarker":
          return `Explain my ${contextName || "biomarker"} result in simple language. Use my age and sex to add context for typical ranges where relevant. Explain what it measures, how my value compares to the reference range, and what it's commonly associated with. Mention related markers that help interpret it. End with my top 3 takeaways.`;
        case "healthZone":
          return `Explain my ${contextName || "health zone"} results in simple language: what stands out and how these markers relate. End with the top 3 things to pay attention to.`;
        case "bioAge":
          return "Based on the biomarkers that negatively contribute to my Bio Age, how can I improve my results? Highlight 3 key priorities I should focus on.";
        default:
          return "";
      }
    },
    [],
  );

  // Auto-send prompt when arriving via URL (e.g. from AskCompanionButton)
  useEffect(() => {
    // Build context from URL params if present
    const contextType = searchParams?.contextType;
    if (!contextType || hasSentMessage || isLoading) return;

    const contextId = searchParams?.contextId || undefined;
    const contextName = searchParams?.contextName || undefined;
    const contextDataParam = searchParams.get("contextData");

    // Parse contextData safely (already JSON, not URI encoded)
    let parsedData: unknown;
    if (contextDataParam) {
      try {
        parsedData = JSON.parse(contextDataParam);
      } catch {
        console.warn("Failed to parse contextData");
      }
    }

    const urlContext: ChatContext = {
      type: contextType,
      id: contextId,
      name: contextName,
      data: parsedData,
    };

    // Generate prompt based on context type
    const generatedPrompt = generatePromptForContext(contextType, contextName);
    if (!generatedPrompt) return;

    setHasSentMessage(true);
    setInputValue("");
    sendMessage(generatedPrompt, urlContext);
    setSelectedContext(null);
    // Keep context info in URL for reference, but remove contextData to keep URL clean
    const cleanParams = new URLSearchParams();
    if (contextType) cleanParams.set("contextType", contextType);
    if (contextName) cleanParams.set("contextName", contextName);
    setSearchParams(Object.fromEntries(cleanParams.entries()));
  }, [
    searchParams,
    hasSentMessage,
    isLoading,
    sendMessage,
    setSearchParams,
    generatePromptForContext,
  ]);

  // Resize textarea on mount and when input value changes
  useEffect(() => {
    resizeTextarea();
  }, [resizeTextarea]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    const messageToSend = inputValue.trim();
    // Mark that we've sent a message to prevent URL params from re-populating
    setHasSentMessage(true);
    // Clear input immediately
    setInputValue("");
    // Reset textarea height immediately to 1 line
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const verticalPadding = 12; // pt-3 = 12px
      const minHeight = LINE_HEIGHT * MIN_TEXTAREA_ROWS + verticalPadding; // 1 line + padding
      textareaRef.current.style.height = `${minHeight}px`;
    }
    // Send message with selected context
    sendMessage(messageToSend, selectedContext || undefined);
    // Clear context after sending (user can add new context for next message)
    setSelectedContext(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPrompt = (prompt: SuggestedPrompt) => {
    const latestResult = resultsData?.results?.[0];

    let promptContext: ChatContext | undefined;

    if (prompt.contextType) {
      if (prompt.contextType === "general" && latestResult) {
        const baseContext: ChatContext = {
          type: "general",
          id: latestResult.id,
          name: prompt.contextName ?? "Latest Results",
        };

        if (
          prompt.requiresMultipleResults &&
          resultsData?.results &&
          resultsData.results.length >= 2
        ) {
          const resultsToInclude = resultsData.results.slice(0, 2);
          baseContext.data = {
            results: resultsToInclude.map((result) => ({
              id: result.id,
              date: result.date,
              biomarkers:
                result.biomarkers?.map((b) => ({
                  id: b.id,
                  name: b.name,
                  code: b.code,
                  value: b.value,
                  valueText: b.valueText,
                  unit: b.unit,
                  range: b.range,
                  biomarkerStatus: b.biomarkerStatus,
                  optimalRange: b.optimalRange,
                })) || [],
            })),
          };
        } else {
          baseContext.data = {
            result: {
              id: latestResult.id,
              date: latestResult.date,
            },
            biomarkers:
              latestResult.biomarkers?.map((b) => ({
                id: b.id,
                name: b.name,
                code: b.code,
                value: b.value,
                valueText: b.valueText,
                unit: b.unit,
                range: b.range,
                biomarkerStatus: b.biomarkerStatus,
                optimalRange: b.optimalRange,
              })) || [],
          };
        }

        promptContext = baseContext;
      } else {
        promptContext = {
          type: prompt.contextType,
          id: prompt.contextId,
          name: prompt.contextName,
        };
      }
    }

    setHasSentMessage(true);
    setInputValue("");
    sendMessage(prompt.text, promptContext);
    setSelectedContext(null);
  };

  // URL is source of truth: when route param changes, load that conversation or clear for new chat
  // Use a ref to track if we've already processed the initial navigation
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only run this effect when on the companion page
    if (!location.pathname.startsWith("/companion")) {
      hasInitializedRef.current = false;
      return;
    }

    if (conversationIdParam) {
      setSelectedConversationId(conversationIdParam);
      if (conversationIdParam !== conversationId) {
        loadConversation(conversationIdParam);
      }
      hasInitializedRef.current = true;
    } else if (!hasInitializedRef.current) {
      // If we are at /companion without an ID, generate one and redirect immediately
      // This ensures we always have an ID in the URL and avoids refreshes later
      hasInitializedRef.current = true;
      const newId = crypto.randomUUID();
      // Set the conversation ID immediately via clearChat to prevent race conditions
      clearChat(newId);
      setSelectedConversationId(newId);
      navigate({ to: `/companion/${newId}`, replace: true });
    }
  }, [
    conversationIdParam,
    conversationId,
    loadConversation,
    navigate,
    clearChat,
    location.pathname,
  ]);

  const handleSelectConversation = useCallback(
    (convId: string | null) => {
      if (convId) {
        navigate({ to: `/companion/${convId}` });
      } else {
        navigate({ to: "/companion" });
      }
    },
    [navigate],
  );

  const handleNewChat = useCallback(() => {
    const newId = crypto.randomUUID();
    // Pass the new conversation ID to clearChat to set it atomically
    // This prevents race conditions where sendMessage might use null/stale conversationId
    clearChat(newId);
    setSelectedConversationId(newId);
    navigate({ to: `/companion/${newId}` });
  }, [navigate, clearChat]);

  const hasMessages = messages.length > 0;

  return (
    <PageLayout
      title=""
      maxWidth="max-w-none"
      isLoading={userLoading}
      loadingSkeleton={<CompanionPlaceholder />}
    >
      <ProFeatureGate
        isMember={isMember}
        isLoading={userLoading}
        placeholder={<CompanionPlaceholder />}
        featureName="companion"
      >
        <div
          className={cn(
            "flex h-[calc(100vh-0rem)] bg-muted/20 -m-4 md:-m-14 overflow-hidden border-t border-border/40",
          )}
        >
          {/* Chat History Sidebar */}
          <ChatHistorySidebar
            isOpen={isHistorySidebarOpen}
            onToggle={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 relative h-full">
            {/* Toggle History Button - shown when sidebar is closed */}
            {!isHistorySidebarOpen && (
              <button
                type="button"
                onClick={() => setIsHistorySidebarOpen(true)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-12 w-6 bg-card border border-border border-l-0 rounded-r-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                aria-label="Open chat history"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-40">
              {isLoadingConversation ? (
                <div className="flex items-center justify-center min-h-full">
                  <div className="text-muted-foreground">
                    Loading conversation...
                  </div>
                </div>
              ) : !hasMessages ? (
                // Empty state - show welcome + suggestions
                <div className="flex flex-col items-center justify-center min-h-full py-12">
                  <div className="mb-4">
                    <img
                      src={companionIcon}
                      alt="Companion"
                      className="w-40 h-40 object-contain"
                    />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-10">
                    {t("companion.howCanIHelp")}
                  </h1>

                  {/* Quick Suggestion Cards */}
                  <div className="grid md:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
                    {quickSuggestions.map((suggestion, index) => (
                      <button
                        type="button"
                        key={index.toString()}
                        onClick={() => handleSelectPrompt(suggestion)}
                        className="group bg-card rounded-2xl p-4 text-left hover:shadow-md transition-all duration-200"
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${suggestion.iconBg} flex items-center justify-center mb-2`}
                        >
                          <suggestion.iconComponent
                            className={`h-[18px] w-[18px] ${suggestion.iconColor}`}
                          />
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {suggestion.text}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* All Suggested Prompts */}
                  <div className="w-full max-w-2xl">
                    <SuggestedPrompts
                      onSelectPrompt={handleSelectPrompt}
                      resultsData={resultsData}
                    />
                  </div>
                </div>
              ) : (
                // Chat messages
                <div className="max-w-3xl mx-auto py-6 space-y-4 w-full">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLatest={index === messages.length - 1}
                      onRetry={retryMessage}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Absolute inside relative chat area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-6">
              <div className="max-w-3xl mx-auto">
                {/* Input Container */}
                <div className="relative bg-card border border-border/40 rounded-2xl shadow-lg overflow-hidden">
                  <div className="px-4 pt-4 pb-0">
                    <textarea
                      id={textareaId}
                      name="companion-input"
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        // Resize after state update
                        setTimeout(() => resizeTextarea(), 0);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t("companion.inputPlaceholder")}
                      className="w-full px-4 pt-3 pb-3 mb-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm resize-none overflow-y-auto"
                      rows={MIN_TEXTAREA_ROWS}
                      disabled={isLoading}
                      style={{
                        minHeight: `${LINE_HEIGHT * MIN_TEXTAREA_ROWS + 12}px`,
                        maxHeight: `${MAX_TEXTAREA_HEIGHT + 12}px`,
                        marginBottom: 0,
                      }}
                    />
                  </div>
                  {/* Button row below textarea - 8px spacing */}
                  <div
                    className="px-4 pb-4 flex items-center gap-2"
                    style={{ paddingTop: "8px" }}
                  >
                    <div className="flex-1 min-w-0">
                      <ContextSelector
                        selectedContext={selectedContext}
                        onContextChange={setSelectedContext}
                      />
                    </div>
                    {isLoading ? (
                      <button
                        type="button"
                        onClick={stopStreaming}
                        className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-xl font-medium text-sm hover:bg-destructive/90 transition-all shrink-0"
                      >
                        <Square className="h-4 w-4" />
                        {t("companion.stop")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-medium text-sm hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                      >
                        {t("companion.send")}
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  {t("companion.disclaimer")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProFeatureGate>
    </PageLayout>
  );
}
