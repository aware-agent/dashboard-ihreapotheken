import { COMPANION_API_URL } from '@/config/urls';
import type { ChatRequest, SSEComplete, SSEContextUsed, SSEError, SSETextDelta } from '@/types/companion';

// Use the aware-llm backend URL
// In development, ALWAYS use relative URLs to leverage Vite proxy (avoids CORS issues)
// When frontend is on HTTPS (ngrok) and backend is on HTTP (localhost), browser blocks direct requests
// Vite proxy allows same-origin requests which get proxied to the backend
//
// Strategy: Always use relative URLs in development to leverage Vite proxy
// This avoids CORS/Private Network Access issues when frontend is on ngrok (HTTPS)
const isDevelopment = import.meta.env.DEV;

// Helper function to get the API URL - checks at runtime for ngrok detection
function getCompanionApiUrl(): string {
  // In development, always use relative URLs (Vite proxy handles it)
  // This avoids CORS issues when frontend is on HTTPS (ngrok) and backend is on HTTP
  if (isDevelopment) {
    return ''; // Empty string = relative URL (uses Vite proxy)
  }

  // In production, use explicit URL or env variable
  const baseUrl = import.meta.env.VITE_COMPANION_API_URL || COMPANION_API_URL || 'http://localhost:3000';
  // Remove trailing slash to prevent double slashes in URL construction
  return baseUrl.replace(/\/+$/, '');
}

export interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onContextUsed: (context: { type: string; name: string }) => void;
  onComplete: (finalOutput: string, timestamp: string, conversationId?: string) => void;
  onError: (error: string) => void;
}

/**
 * Stream a chat message to the companion API using SSE
 */
export async function streamChatMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {

  // Get API URL - uses relative URL in development (Vite proxy handles it)
  // This avoids CORS issues when frontend is on HTTPS (ngrok) and backend is on HTTP
  const apiBaseUrl = getCompanionApiUrl();
  const url = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/chat/stream`
    : '/api/v1/chat/stream'; // Relative URL uses Vite proxy

  // Debug logging in development
  if (import.meta.env.DEV) {
    const isNgrok = typeof window !== 'undefined' && window.location.hostname.includes('ngrok');
    console.debug('Companion API request:', {
      apiBaseUrl,
      url,
      isNgrok,
      isDevelopment,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
    });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal,
    });
  } catch (fetchError) {

    const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new Error(`Failed to connect to API: ${errorMsg}. URL: ${url}`);
  }

  if (!response.ok) {

    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let hasReceivedEvent = false;
  let hasReceivedContent = false; // Track if we received any text deltas
  let completionCalled = false; // Track if onComplete was explicitly called
  let lastEventTime = Date.now();
  let currentEventType: string | null = null; // Track current event type across iterations
  const TIMEOUT_MS = 120000; // 2 minutes timeout

  try {
    if (import.meta.env.DEV) {
      console.debug('SSE stream started, waiting for events...', {
        url,
        method: 'POST',
      });
    }

    while (true) {
      // Check for timeout
      if (Date.now() - lastEventTime > TIMEOUT_MS) {
        throw new Error('Stream timeout: No response received for 2 minutes');
      }

      const { done, value } = await reader.read();


      if (done) {

        if (import.meta.env.DEV) {
          console.debug('SSE stream ended', {
            hasReceivedEvent,
            hasReceivedContent,
            completionCalled,
            bufferLength: buffer.length,
            bufferPreview: buffer.substring(0, 200),
          });
        }
        // Stream ended - process any remaining buffer
        if (buffer.trim()) {

          // Process remaining lines in buffer
          // Important: Process complete SSE message blocks, not just individual lines
          const lines = buffer.split('\n');
          let pendingEventType: string | null = null;

          for (const line of lines) {
            const trimmedLine = line.trim();

            // Empty line indicates end of SSE message block - reset event type
            if (!trimmedLine) {
              pendingEventType = null;
              continue;
            }

            if (trimmedLine.startsWith('event: ')) {
              pendingEventType = trimmedLine.slice(7).trim();
              currentEventType = pendingEventType; // Also update current for compatibility

              continue;
            }

            if (trimmedLine.startsWith('data: ')) {
              const dataStr = trimmedLine.slice(6);
              try {
                const data = JSON.parse(dataStr);
                hasReceivedEvent = true;

                // Check for completion - use pendingEventType if available, fall back to currentEventType
                const eventType = pendingEventType || currentEventType;


                if (import.meta.env.DEV) {
                  console.debug('Processing final buffer data:', {
                    eventType,
                    pendingEventType,
                    currentEventType,
                    hasFinalOutput: 'finalOutput' in data,
                    dataKeys: Object.keys(data),
                  });
                }

                // Check for completion in remaining buffer
                if (eventType === 'complete' || 'finalOutput' in data) {

                  completionCalled = true;
                  const completeData = data as SSEComplete;
                  callbacks.onComplete(
                    completeData.finalOutput || '',
                    completeData.timestamp || new Date().toISOString(),
                    completeData.conversationId
                  );
                  return; // Stream completed
                }
              } catch (e) {
                // Log parsing errors for debugging
                if (import.meta.env.DEV && dataStr && dataStr.length > 0) {
                  console.warn('Failed to parse final buffer data:', dataStr.substring(0, 100), e);
                }
              }
            }
          }
        }

        // If stream ended, ensure completion is called if we received content
        // This handles cases where the completion event might have been missed
        if (hasReceivedContent && !completionCalled) {
          // We received content but completion wasn't explicitly called
          // Call it now - the hook will use accumulated content from onTextDelta
          callbacks.onComplete('', new Date().toISOString(), undefined);
          return;
        }

        // If completion was called or we received other events, stream completed
        if (completionCalled || hasReceivedEvent) {
          break;
        }

        // If stream ended with content in buffer but no events processed, try to process buffer one more time
        // This handles edge cases where events are in the buffer but weren't processed
        if (buffer.trim() && !hasReceivedEvent) {
          // Try to parse any remaining data in buffer as a completion event
          try {
            const lines = buffer.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.slice(6);
                const data = JSON.parse(dataStr);
                if ('finalOutput' in data) {
                  const completeData = data as SSEComplete;
                  callbacks.onComplete(
                    completeData.finalOutput || '',
                    completeData.timestamp || new Date().toISOString(),
                    completeData.conversationId
                  );
                  return;
                }
              }
            }
          } catch (_e) {
            // Ignore parsing errors
          }
        }

        // If no events received at all, it's an error
        throw new Error('Stream ended unexpectedly without any events');
      }

      lastEventTime = Date.now();
      const chunk = decoder.decode(value, { stream: true });


      buffer += chunk;

      // Log raw chunks in development for debugging (limit to first few chunks to avoid spam)
      if (import.meta.env.DEV && chunk.length > 0) {
        const chunkCount = (buffer.match(/event:/g) || []).length;
        if (chunkCount <= 10) {
          console.debug('SSE chunk received:', {
            chunkNumber: chunkCount,
            chunkLength: chunk.length,
            chunkPreview: chunk.substring(0, 300).replace(/\n/g, '\\n'),
            bufferLength: buffer.length,
            hasEventTextDelta: chunk.includes('event: text_delta'),
            hasDataDelta: chunk.includes('"delta"'),
          });
        }
      }

      // Process SSE events
      // SSE format: event: <type>\ndata: <json>\n\n (empty line ends event)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Empty line indicates end of event - reset event type
        if (!trimmedLine) {
          currentEventType = null;
          continue;
        }

        if (trimmedLine.startsWith('event: ')) {
          currentEventType = trimmedLine.slice(7).trim();
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);
          try {
            const data = JSON.parse(dataStr);
            hasReceivedEvent = true;

            // Log all received events in development
            if (import.meta.env.DEV) {
              console.debug('SSE event received:', {
                eventType: currentEventType,
                dataKeys: Object.keys(data),
                dataPreview: JSON.stringify(data).substring(0, 100),
              });
            }

            // Handle error events explicitly
            if (currentEventType === 'error' || currentEventType === 'emergency') {
              const errorMsg = (data as SSEError).message || 'An error occurred';
              callbacks.onError(errorMsg);
              return; // Stop processing on error
            }

            // Ignore ping events (keepalive to prevent proxy buffering)
            if (currentEventType === 'ping') {
              continue; // Skip ping events, they're just keepalive
            }

            // Handle completion event explicitly (check event type first)
            if (currentEventType === 'complete' || 'finalOutput' in data) {

              if (import.meta.env.DEV) {
                console.debug('Completion event received:', {
                  currentEventType,
                  hasFinalOutput: 'finalOutput' in data,
                  dataKeys: Object.keys(data),
                });
              }
              completionCalled = true;
              const completeData = data as SSEComplete;
              callbacks.onComplete(
                completeData.finalOutput || '',
                completeData.timestamp || new Date().toISOString(),
                completeData.conversationId
              );
              return; // Stream completed successfully
            }

            if (currentEventType === 'text_delta') {

              hasReceivedContent = true;
              const delta = (data as SSETextDelta).delta;
              if (delta && typeof delta === 'string') {
                if (import.meta.env.DEV) {
                  console.debug('Received text_delta:', {
                    eventType: currentEventType,
                    deltaLength: delta.length,
                    deltaPreview: delta.substring(0, 50)
                  });
                }
                callbacks.onTextDelta(delta);
              } else {
                // Log if we have text_delta event but no delta in data
                if (import.meta.env.DEV) {
                  console.warn('text_delta event but no delta in data:', {
                    eventType: currentEventType,
                    dataKeys: Object.keys(data),
                    dataPreview: JSON.stringify(data).substring(0, 100)
                  });
                }
              }
            } else if ('delta' in data && currentEventType !== 'complete' && currentEventType !== 'context_used') {
              // Fallback: if data has delta but event type wasn't set, treat as text_delta
              hasReceivedContent = true;
              const delta = (data as SSETextDelta).delta;
              if (delta && typeof delta === 'string') {
                if (import.meta.env.DEV) {
                  console.debug('Received text_delta (fallback - delta in data):', {
                    eventType: currentEventType,
                    deltaLength: delta.length,
                    deltaPreview: delta.substring(0, 50)
                  });
                }
                callbacks.onTextDelta(delta);
              }
            } else if (currentEventType === 'context_used' || ('type' in data && 'name' in data && !('finalOutput' in data))) {
              if (import.meta.env.DEV) {
                console.debug('Received context_used:', data);
              }
              callbacks.onContextUsed(data as SSEContextUsed);
            } else if ('message' in data && currentEventType !== 'complete') {
              // Error message in data (but not a completion event)
              callbacks.onError((data as SSEError).message);
              return; // Stop processing on error
            } else {
              // Log unhandled events for debugging
              if (import.meta.env.DEV) {
                console.warn('Unhandled SSE event:', {
                  eventType: currentEventType,
                  dataKeys: Object.keys(data),
                  dataPreview: JSON.stringify(data).substring(0, 100)
                });
              }
            }
          } catch (e) {
            // Log parsing errors for debugging (but only for non-empty strings)
            if (dataStr && dataStr.length > 0 && dataStr !== 'null' && !dataStr.startsWith(':')) {
              console.warn('Failed to parse SSE data:', dataStr.substring(0, 100), e);
            }
            // Skip non-JSON data lines (empty lines, comments, etc.)
            // This is normal for SSE streams
          }
        }
      }
    }

    // If we exit the loop without completion, it's an error
    if (!hasReceivedEvent) {
      throw new Error('Stream ended without any events');
    }
  } catch (error) {
    // Ensure error callback is called for any error
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    callbacks.onError(errorMessage);
    throw error; // Re-throw to be caught by caller
  } finally {
    reader.releaseLock();
  }
}

/**
 * Send a non-streaming chat message
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<{ role: 'assistant'; content: string; timestamp: string }> {
  // Get API URL - uses relative URL in development (Vite proxy)
  const apiBaseUrl = getCompanionApiUrl();
  const url = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/chat`
    : '/api/v1/chat'; // Relative URL uses Vite proxy

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.message;
}

export interface ConversationSummary {
  id: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  messageCount: number;
  lastMessageAt: string;
  contextType?: 'healthZone' | 'biomarker' | 'general' | 'bioAge';
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  nextCursor?: string;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  contextSnapshot?: {
    type: string;
    name?: string;
  };
  summarized: boolean;
}

/**
 * List conversations for the current user
 */
export async function listConversations(
  userId: string,
  options?: { limit?: number; cursor?: string }
): Promise<ListConversationsResponse> {
  const apiBaseUrl = getCompanionApiUrl();
  const url = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/conversations`
    : '/api/v1/conversations';

  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.cursor) params.set('cursor', options.cursor);

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get messages for a conversation (requires user id for auth)
 */
export async function getConversationMessages(
  userId: string,
  conversationId: string,
  options?: { limit?: number }
): Promise<StoredMessage[]> {
  const apiBaseUrl = getCompanionApiUrl();
  const url = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/conversations/${conversationId}/messages`
    : `/api/v1/conversations/${conversationId}/messages`;

  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
