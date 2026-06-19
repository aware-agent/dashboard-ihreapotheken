import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { ChatContext } from '@/types/companion';

interface ContextBadgeProps {
  context: ChatContext;
  onClear?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function ContextBadge({ context, onClear, className, size = 'md' }: ContextBadgeProps) {
  const getLabel = () => {
    if (context.name) {
      return `Referencing: ${context.name}`;
    }
    switch (context.type) {
      case 'biomarker':
        return 'Referencing biomarker data';
      case 'healthZone':
        return 'Referencing health zone';
      case 'general':
        return 'Referencing latest results';
      default:
        return 'Context active';
    }
  };

  // Use health marker colors that match the existing status badges
  const getBgColor = () => {
    switch (context.type) {
      case 'biomarker':
        return 'bg-hm-normal50 text-hm-normal200';
      case 'healthZone':
        return 'bg-bg-magnesium50 text-text-magnesium400';
      case 'general':
        // For "Latest Results" context, use optimal green
        if (context.name === 'Latest Results') {
          return 'bg-hm-optimal50 text-hm-optimal200';
        }
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        getBgColor(),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        className
      )}
    >
      <Pencil className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{getLabel()}</span>
    </span>
  );
}
