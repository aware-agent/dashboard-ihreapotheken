import { cn } from '@/lib/utils';
import { BiomarkerStatus } from '@/types/results';
import { getStatusConfig } from '@/lib/statusUtils';

interface BiomarkerStatusBadgeProps {
  status: BiomarkerStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function BiomarkerStatusBadge({
  status,
  size = 'md',
  className,
}: BiomarkerStatusBadgeProps) {
  const config = getStatusConfig(status);
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bgClass,
        config.textClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 caption-sm',
        className
      )}
    >
      {config.label}
    </span>
  );
}
