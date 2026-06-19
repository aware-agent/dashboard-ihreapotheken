import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { WearableInsight } from '@/types/wearables';

interface WearableInsightCardProps {
  insight: WearableInsight;
  className?: string;
}

export function WearableInsightCard({ insight, className }: WearableInsightCardProps) {
  const TrendIcon = insight.trend === 'up' 
    ? TrendingUp 
    : insight.trend === 'down' 
      ? TrendingDown 
      : Minus;

  return (
    <div className={cn(
      'p-3 rounded-xl',
      insight.isPositive 
        ? 'bg-hm-optimal50' 
        : 'bg-hm-highlow50',
      className
    )}>
      {/* Content */}
      <p className="body-sm text-foreground leading-relaxed">
        {insight.message}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <TrendIcon className={cn(
          'h-3.5 w-3.5',
          insight.trend === 'up' && 'text-hm-optimal200',
          insight.trend === 'down' && 'text-hm-highlow200',
          insight.trend === 'stable' && 'text-muted-foreground'
        )} />
        <span className={cn(
          'caption-sm',
          insight.isPositive ? 'text-hm-optimal200' : 'text-hm-highlow200'
        )}>
          {insight.metricName} → {insight.biomarkerName}
        </span>
      </div>
    </div>
  );
}
