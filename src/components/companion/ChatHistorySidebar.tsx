import { ChevronLeft, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({
  isOpen,
  onToggle,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
}: ChatHistorySidebarProps) {
  const { data, isLoading, error } = useConversations({ limit: 50 });

  const handleSelect = useCallback(
    (conversationId: string) => {
      onSelectConversation(conversationId);
    },
    [onSelectConversation]
  );

  const handleNewChat = useCallback(() => {
    onSelectConversation(null);
    onNewChat();
  }, [onSelectConversation, onNewChat]);

  return (
    <div
      className={cn(
        'relative h-full bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden',
        isOpen ? 'w-64' : 'w-0'
      )}
    >
      <div className="flex flex-col h-full w-64">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm">Chat History</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button
            type="button"
            onClick={handleNewChat}
            className="w-full justify-center gap-2"
            variant="default"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Failed to load conversations
              </div>
            ) : !data?.conversations || data.conversations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {data.conversations.map((conversation) => {
                  const isSelected = conversation.id === selectedConversationId;
                  const lastMessageDate = new Date(conversation.lastMessageAt);
                  const timeAgo = formatDistanceToNow(lastMessageDate, { addSuffix: true });

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => handleSelect(conversation.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors',
                        'hover:bg-muted/50',
                        isSelected && 'bg-muted'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate max-w-[200px]',
                            isSelected ? 'text-foreground' : 'text-foreground/90'
                          )}
                        >
                          {conversation.title || 'New conversation'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{timeAgo}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
