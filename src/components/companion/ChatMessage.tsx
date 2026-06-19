import { format } from 'date-fns';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import type { ChatMessage as ChatMessageType } from '@/types/companion';
import { ContextBadge } from './ContextBadge';
import { StreamingIndicator } from './StreamingIndicator';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
  onRetry?: (messageId: string) => void;
}

export function ChatMessage({ message, isLatest, onRetry }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming && isLatest;
  const isError = message.isError && !isUser;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        'group flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-foreground text-background'
            : isError
              ? 'bg-card border border-destructive/40'
              : 'bg-card border border-border/40'
        )}
      >
        {/* Context badge for both user and assistant messages */}
        {message.context && (
          <div className="mb-2">
            <ContextBadge context={message.context} size="sm" />
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            'prose prose-sm max-w-none',
            isUser ? 'prose-invert' : '',
            'break-words'
          )}
        >
          {isStreaming && !message.content ? (
            <StreamingIndicator />
          ) : (
            <MessageContent content={message.content} isUser={isUser} />
          )}
          {isStreaming && message.content && (
            <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </div>

        {/* Retry button for error messages */}
        {isError && onRetry && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(message.id)}
              className="w-full"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              {t('companion.tryAgain')}
            </Button>
          </div>
        )}

        {/* Footer with timestamp and copy button */}
        {!isStreaming && message.timestamp && (
          <div
            className={cn(
              'mt-2 flex items-center gap-2',
              isUser ? 'justify-end' : 'justify-between'
            )}
          >
            <span
              className={cn(
                'text-[10px]',
                isUser ? 'text-background/60' : 'text-muted-foreground'
              )}
            >
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
            
            {/* Copy button for assistant messages */}
            {!isUser && message.content && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted transition-all"
                      aria-label={copied ? t('companion.copied') : t('companion.copyToClipboard')}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-hm-optimal" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{copied ? t('companion.copied') : t('companion.copyToClipboard')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  // Simple markdown-like rendering for assistant messages
  if (isUser) {
    return <p className="m-0">{content}</p>;
  }

  // Split content into paragraphs and handle basic formatting
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Handle markdown headers (## Heading)
        if (trimmedLine.startsWith('## ')) {
          return (
            <h3 key={index.toString()} className="font-bold text-base mt-4 mb-2 text-foreground">
              {trimmedLine.slice(3)}
            </h3>
          );
        }

        // Handle markdown headers (# Heading)
        if (trimmedLine.startsWith('# ')) {
          return (
            <h2 key={index.toString()} className="font-bold text-lg mt-4 mb-2 text-foreground">
              {trimmedLine.slice(2)}
            </h2>
          );
        }

        // Detect section headings (lines ending with ":" that are short and likely headings)
        // Examples: "Summary:", "What Erythrocytes measure:", "Top 3 takeaways:"
        if (trimmedLine.endsWith(':') && trimmedLine.length < 80 && !trimmedLine.startsWith('-') && !trimmedLine.match(/^\d+\./)) {
          // Check if it's likely a heading (not a regular sentence ending with colon)
          const isLikelyHeading = trimmedLine.length < 60 ||
            trimmedLine.split(' ').length <= 8 ||
            /^[A-Z]/.test(trimmedLine);

          if (isLikelyHeading) {
            return (
              <h3 key={index.toString()} className="font-bold text-base mt-4 mb-2 text-foreground">
                {trimmedLine.slice(0, -1)}
              </h3>
            );
          }
        }

        // Handle bold-only lines (entire line is bold)
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
          return (
            <p key={index.toString()} className="font-bold m-0 text-foreground">
              {trimmedLine.slice(2, -2)}
            </p>
          );
        }

        // Handle bold text inline (double asterisks **text**)
        if (trimmedLine.includes('**')) {
          const parts = trimmedLine.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={index.toString()} className="m-0">
              {parts.map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i.toString()} className="font-semibold text-foreground">{part}</strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }

        // Handle text with single asterisks (*text*) - treat as bold
        // This handles cases like "*This information is for educational purposes only...*"
        if (trimmedLine.includes('*') && !trimmedLine.includes('**')) {
          // Check if the line starts and ends with asterisks (entire line wrapped in asterisks)
          // This is typically used for disclaimers - style as bold and muted
          if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && trimmedLine.length > 2) {
            const content = trimmedLine.slice(1, -1);
            // Process any additional bold text inside (like **bold** within the asterisks)
            if (content.includes('**')) {
              const parts = content.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={index.toString()} className="m-0 font-semibold text-muted-foreground">
                  {parts.map((part, i) =>
                    i % 2 === 1 ? (
                      <strong key={i.toString()} className="font-bold">{part}</strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            }
            return (
              <p key={index.toString()} className="m-0 font-semibold text-muted-foreground">
                {content}
              </p>
            );
          }
          // Handle inline single asterisks as bold (for emphasis within text)
          const parts = trimmedLine.split(/\*([^*]+)\*/g);
          if (parts.length > 1) {
            return (
              <p key={index.toString()} className="m-0">
                {parts.map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i.toString()} className="font-semibold text-foreground">{part}</strong>
                  ) : (
                    part
                  )
                )}
              </p>
            );
          }
        }

        // Handle numbered list items (1. Item)
        if (trimmedLine.match(/^\d+\.\s/)) {
          const listMatch = trimmedLine.match(/^(\d+)\.\s(.+)$/);
          if (listMatch) {
            return (
              <div key={index.toString()} className="flex gap-2 m-0">
                <span className="font-semibold text-foreground shrink-0">{listMatch[1]}.</span>
                <span className="flex-1">{listMatch[2]}</span>
              </div>
            );
          }
        }

        // Handle bullet list items (- Item or • Item)
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
          const bulletText = trimmedLine.startsWith('- ') ? trimmedLine.slice(2) : trimmedLine.slice(2);
          return (
            <div key={index.toString()} className="flex gap-2 m-0">
              <span className="text-foreground shrink-0">•</span>
              <span className="flex-1">{bulletText}</span>
            </div>
          );
        }

        // Handle checkmarks
        if (trimmedLine.startsWith('✅') || trimmedLine.startsWith('❌')) {
          return (
            <p key={index.toString()} className="m-0">
              {trimmedLine}
            </p>
          );
        }

        // Handle horizontal rules
        if (trimmedLine === '---' || trimmedLine === '***') {
          return <hr key={index.toString()} className="my-3 border-border/40" />;
        }

        // Empty lines
        if (!trimmedLine) {
          return <div key={index.toString()} className="h-2" />;
        }

        // Regular paragraphs
        return (
          <p key={index.toString()} className="m-0 leading-relaxed">
            {trimmedLine}
          </p>
        );
      })}
    </div>
  );
}
