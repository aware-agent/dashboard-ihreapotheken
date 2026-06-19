import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendDirection } from '@/lib/statusUtils';

interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: number | null;
  showValue?: boolean;
  isPositive?: boolean; // Whether the trend is good (green) or bad (orange)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', padding: 'px-2.5 py-1.5' },
};

export function TrendIndicator({
  direction,
  value,
  showValue = true,
  isPositive,
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const config = sizeConfig[size];
  
  // Determine color based on isPositive prop, or default based on direction
  const getColorClasses = () => {
    if (isPositive !== undefined) {
      return isPositive
        ? 'text-hm-optimal200 bg-hm-optimal50'
        : 'text-hm-highlow200 bg-hm-highlow50';
    }
    // Default: up is positive, down is negative, stable is neutral
    if (direction === 'up') return 'text-hm-optimal200 bg-hm-optimal50';
    if (direction === 'down') return 'text-hm-highlow200 bg-hm-highlow50';
    return 'text-muted-foreground bg-muted';
  };

  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;
  const formattedValue = value !== null && value !== undefined 
    ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    : null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.padding,
        config.text,
        getColorClasses(),
        className
      )}
    >
      <Icon className={config.icon} />
      {showValue && formattedValue && <span>{formattedValue}</span>}
    </div>
  );
}

// Compact version for use in lists/tables
export function TrendArrow({
  direction,
  isPositive,
  className,
}: {
  direction: TrendDirection;
  isPositive?: boolean;
  className?: string;
}) {
  const getColor = () => {
    if (isPositive !== undefined) {
      return isPositive ? 'text-hm-optimal200' : 'text-hm-highlow200';
    }
    if (direction === 'up') return 'text-hm-optimal200';
    if (direction === 'down') return 'text-hm-highlow200';
    return 'text-muted-foreground';
  };

  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;
  
  return <Icon className={cn('h-4 w-4', getColor(), className)} />;
}
