import { MarkerStatus } from '@/types/biomarkers';
import { getStatusBgColor, getStatusTextColor, getStatusLabel } from '@/lib/biomarkerUtils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: MarkerStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        getStatusBgColor(status),
        getStatusTextColor(status),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
