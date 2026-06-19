import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: { value: number }[];
  color?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const colorMap = {
  default: 'hsl(var(--primary))',
  success: 'hsl(var(--hm-optimal))',
  warning: 'hsl(var(--hm-highlow))',
  danger: 'hsl(var(--hm-high))',
};

export function Sparkline({ data, color = 'default', className }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div className={cn('flex items-center justify-center text-muted-foreground text-xs', className)}>
        —
      </div>
    );
  }

  return (
    <div className={cn('h-8 w-16', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={colorMap[color]}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
