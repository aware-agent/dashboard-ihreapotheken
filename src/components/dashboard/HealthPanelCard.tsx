import { Droplet, Heart, Flame, Activity, Sun } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthPanel } from '@/types/biomarkers';
import { StatusBadge } from './StatusBadge';
import { getZoneBgClass, getZoneTextClass } from '@/lib/biomarkerUtils';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplet,
  Heart,
  Flame,
  Activity,
  Sun,
};

interface HealthPanelCardProps {
  panel: HealthPanel;
  healthZoneId?: string;
  onClick?: () => void;
}

export function HealthPanelCard({ panel, healthZoneId, onClick }: HealthPanelCardProps) {
  const Icon = iconMap[panel.icon] || Activity;
  const outOfRange = panel.markers.filter(m => !['optimal', 'normal'].includes(m.status)).length;

  const cardContent = (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', getZoneBgClass(panel.zone))}>
              <Icon className={cn('h-5 w-5', getZoneTextClass(panel.zone))} />
            </div>
            <CardTitle className="text-base font-medium">{panel.name}</CardTitle>
          </div>
          <StatusBadge status={panel.overallStatus} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {panel.markers.length} markers
          </span>
          {outOfRange > 0 && (
            <span className="text-[hsl(var(--hm-highlow200))] font-medium">
              {outOfRange} out of range
            </span>
          )}
        </div>
      </CardContent>
    </>
  );

  const cardClassName = cn(
    'cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
    'border-border/50'
  );

  // If healthZoneId is provided, wrap in Link
  if (healthZoneId) {
    return (
      <Link to={`/health-zones/${healthZoneId}`}>
        <Card className={cardClassName}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClassName} onClick={onClick}>
      {cardContent}
    </Card>
  );
}
