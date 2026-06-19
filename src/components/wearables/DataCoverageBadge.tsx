import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';

interface DataCoverageBadgeProps {
  daysTracked: number;
  totalDays: number;
  className?: string;
  showLabel?: boolean;
}

export function DataCoverageBadge({ 
  daysTracked, 
  totalDays, 
  className,
  showLabel = true,
}: DataCoverageBadgeProps) {
  const { t } = useLocale();
  const percentage = Math.round((daysTracked / totalDays) * 100);
  const isLowCoverage = daysTracked < 4;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Progress bar */}
      <div className="relative h-2 w-12 rounded-full bg-muted overflow-hidden">
        <div 
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all',
            isLowCoverage ? 'bg-muted-foreground' : 'bg-hm-optimal200'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Fraction display */}
      <span className={cn(
        'body-sm font-medium',
        isLowCoverage ? 'text-muted-foreground' : 'text-foreground'
      )}>
        {daysTracked}/{totalDays}
      </span>
    </div>
  );
}
