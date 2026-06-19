import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgClass?: string;
  iconTextClass?: string;
  valueClass?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconBgClass = 'bg-bg-blue50',
  iconTextClass = 'text-primary',
  valueClass = 'text-foreground',
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border border-border/40", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconTextClass)} />
          </div>
          <div>
            <p className="caption-sm text-muted-foreground">{label}</p>
            <p className={cn("title-md", valueClass)}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Horizontal stat for desktop layouts
interface HorizontalStatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgClass?: string;
  iconTextClass?: string;
  valueClass?: string;
  bgClass?: string;
  className?: string;
}

export function HorizontalStat({
  icon: Icon,
  label,
  value,
  iconBgClass = 'bg-primary/10',
  iconTextClass = 'text-primary',
  valueClass = 'text-foreground',
  bgClass = 'bg-gradient-to-b from-primary/5 to-transparent',
  className,
}: HorizontalStatProps) {
  return (
    <div className={cn("p-5 flex flex-col justify-between border-l border-border/40 first:border-l-0", bgClass, className)}>
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", iconBgClass)}>
          <Icon className={cn("h-3.5 w-3.5", iconTextClass)} />
        </div>
        <p className="caption-sm text-muted-foreground">{label}</p>
      </div>
      <p className={cn("text-3xl font-bold", valueClass)}>{value}</p>
    </div>
  );
}
