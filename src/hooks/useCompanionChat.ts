import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getConversationMessages, streamChatMessage } from '@/api/companion';
import { useUserProfile } from '@/hooks/useUser';
import type { ChatContext, ChatMessage, ChatRequest } from '@/types/companion';
import { getUserIdFromToken } from '@/utils/jwt';
import { useCookies } from './useCookies';
import { useNavigate } from '@tanstack/react-router';

// Calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | undefined {
  if (!dateOfBirth) return undefined;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function useCompanionChat() {
  const navigate = useNavigate();
  const { authCookies } = useCookies();
  const { data: userProfile } = useUserProfile();
  // Note: Search params handling needs to be configured in route definition
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const queryClient = useQueryClient();
  const userId = getUserIdFromToken(authCookies.accessToken);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentContext, setCurrentContext] = useState<ChatContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedMessages, setFailedMessages] = useState<Map<string, string>>(new Map()); // Map of assistant message ID to user message content
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messageIdCounter = useRef(0);

  // Parse context from URL params on mount
  useEffect(() => {
    const contextType = searchParams.get('contextType') as ChatContext['type'] | null;
    const contextId = searchParams.get('contextId');
    const contextName = searchParams.get('contextName');
    const contextData = searchParams.get('contextData');

    if (contextType) {
      let parsedData: unknown;
      if (contextData) {
        try {
          // contextData is now plain JSON (not URI encoded)
          parsedData = JSON.parse(contextData);
        } catch {
          console.warn('Failed to parse contextData');
        }
      }

      const context: ChatContext = {
        type: contextType,
        id: contextId || undefined,
        name: contextName || undefined,
        data: parsedData,
      };
      setCurrentContext(context);
    }
  }, [searchParams]);

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  const sendMessage = useCallback(
    async (content: string, context?: ChatContext) => {
      if (!authCookies.accessToken || !content.trim()) return;

      setError(null);
      setIsLoading(true);
      setStreamingContent('');

      // Use provided context or current context
      const messageContext = context || currentContext;
      if (context) {
        setCurrentContext(context);
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
        context: messageContext || undefined,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Prepare assistant message placeholder
      const assistantMessageId = generateMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
        context: messageContext || undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const request: ChatRequest = {
        message: content.trim(),
        context: messageContext || undefined,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        conversationId: conversationId || undefined,
        userProfile: {
          accessToken: authCookies.accessToken,
          age: calculateAge(userProfile?.dateOfBirth ?? null),
          sex: userProfile?.sex ?? undefined,
        },
      };

      let fullContent = '';

      try {
        await streamChatMessage(
          request,
          {
            onTextDelta: (delta) => {

              fullContent += delta;
              setStreamingContent(fullContent);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            },
            onContextUsed: (ctx) => {
              // Context is already set from URL params or passed context
              console.log('Context used:', ctx);
            },
            onComplete: async (finalOutput, timestamp, newConversationId) => {

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                      ...m,
                      content: finalOutput || fullContent,
                      timestamp,
                      isStreaming: false,
                    }
                    : m
                )
              );
              setStreamingContent('');
              setIsLoading(false);
              if (newConversationId) {
                setConversationId(newConversationId);
              }

              // Refetch conversations to get updated list (in case a new conversation was created)
              // We add a small delay to ensure the backend has finished title generation
              if (userId) {
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['conversations', userId] });
                }, 1000);
              }
            },
            onError: (errorMsg) => {
              setError(errorMsg);
              // Store the user message content for retry
              setFailedMessages((prev) => {
                const newMap = new Map(prev);
                newMap.set(assistantMessageId, content.trim());
                return newMap;
              });
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? {
                      ...m,
                      content:
                        "I'm having trouble processing your request right now. Please try again in a moment.",
                      isStreaming: false,
                      isError: true,
                      retryMessageId: userMessage.id,
                    }
                    : m
                )
              );
              setIsLoading(false);
            },
          },
          abortControllerRef.current.signal
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        // Store the user message content for retry
        setFailedMessages((prev) => {
          const newMap = new Map(prev);
          newMap.set(assistantMessageId, content.trim());
          return newMap;
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                ...m,
                content:
                  "I'm having trouble processing your request right now. Please try again in a moment.",
                isStreaming: false,
                isError: true,
                retryMessageId: userMessage.id,
              }
              : m
          )
        );
        setIsLoading(false);
      }

      // Clear URL params after processing
      navigate({ to: "/companion", replace: true });
    },
    [authCookies.accessToken, userProfile, messages, currentContext, conversationId, generateMessageId, navigate, userId, queryClient]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!userId) return;
      // Set conversationId immediately (optimistically) so it's available for the next message
      // This ensures that when a new frontend-generated UUID is used, it's sent to the backend
      setConversationId(convId);
      setIsLoadingConversation(true);
      setError(null);
      try {
        const storedMessages = await getConversationMessages(userId, convId, { limit: 100 });
        const loadedMessages: ChatMessage[] = storedMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          context: msg.contextSnapshot
            ? {
              type: msg.contextSnapshot.type as ChatContext['type'],
              name: msg.contextSnapshot.name,
            }
            : undefined,
        }));
        setMessages(loadedMessages);
        // ConversationId already set above, but ensure it's still set after successful load
        setConversationId(convId);
      } catch (err) {
        // If the conversation is not found (e.g. newly generated front-end ID),
        // we just set the ID and start with an empty message list.
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('404')) {
          setMessages([]);
          // ConversationId already set above, but ensure it's still set for new conversations
          setConversationId(convId);
        } else {
          setError(errorMsg);
        }
      } finally {
        setIsLoadingConversation(false);
      }
    },
    [userId]
  );

  const clearChat = useCallback((newConversationId?: string) => {
    setMessages([]);
    setCurrentContext(null);
    setStreamingContent('');
    setError(null);
    // If a new conversation ID is provided, set it immediately to avoid race conditions
    // where sendMessage might be called before loadConversation updates the state
    setConversationId(newConversationId ?? null);
  }, []);

  const clearContext = useCallback(() => {
    setCurrentContext(null);
    navigate({ to: "/_auth/companion", replace: true });
  }, [navigate]);

  const retryMessage = useCallback(
    (assistantMessageId: string) => {
      const userMessageContent = failedMessages.get(assistantMessageId);
      if (!userMessageContent) return;

      // Find the error message to get the retryMessageId
      const errorMessage = messages.find((m) => m.id === assistantMessageId);
      const userMessageId = errorMessage?.retryMessageId;

      // Remove both the error message and its associated user message to avoid duplicates
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantMessageId && m.id !== userMessageId)
      );

      // Clear the failed message from the map
      setFailedMessages((prev) => {
        const newMap = new Map(prev);
        newMap.delete(assistantMessageId);
        return newMap;
      });

      // Resend the message (this will add a fresh user message)
      sendMessage(userMessageContent);
    },
    [failedMessages, sendMessage, messages]
  );

  return {
    messages,
    isLoading,
    isLoadingConversation,
    streamingContent,
    currentContext,
    error,
    conversationId,
    sendMessage,
    retryMessage,
    stopStreaming,
    clearChat,
    clearContext,
    loadConversation,
  };
}
