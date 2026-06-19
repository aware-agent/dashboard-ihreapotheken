import { Card, CardContent } from '@/components/ui/card';
import { Activity, Heart, Moon, Flame, Footprints, Droplets, GripVertical, Minus, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { useLocale } from '@/hooks/useLocale';
import { localizeRelativeTimeString } from '@/lib/dateUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { WearableMetricId, WidgetConfig } from '@/hooks/useDashboardPreferences';

interface WearableMetric {
  id: WearableMetricId;
  nameKey: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  source: string;
  lastUpdatedMinutes: number; // Store as minutes for dynamic localization
}

// Demo data for wearable metrics
const demoMetrics: WearableMetric[] = [
  {
    id: 'heart-rate',
    nameKey: 'dashboard.restingHR',
    value: '62',
    unit: 'bpm',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    trend: 'down',
    trendValue: '-3',
    source: 'Apple Watch',
    lastUpdatedMinutes: 5,
  },
  {
    id: 'steps',
    nameKey: 'dashboard.stepsToday',
    value: '8,432',
    unit: 'steps',
    icon: Footprints,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    trend: 'up',
    trendValue: '+12%',
    source: 'Apple Watch',
    lastUpdatedMinutes: 2,
  },
  {
    id: 'calories',
    nameKey: 'dashboard.activeCalories',
    value: '487',
    unit: 'kcal',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    trend: 'up',
    trendValue: '+8%',
    source: 'Apple Watch',
    lastUpdatedMinutes: 2,
  },
  {
    id: 'sleep',
    nameKey: 'dashboard.sleepScore',
    value: '85',
    unit: '%',
    icon: Moon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    trend: 'stable',
    source: 'Oura Ring',
    lastUpdatedMinutes: 480, // 8 hours
  },
  {
    id: 'hrv',
    nameKey: 'dashboard.hrv',
    value: '48',
    unit: 'ms',
    icon: Activity,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    trend: 'up',
    trendValue: '+5',
    source: 'Oura Ring',
    lastUpdatedMinutes: 480, // 8 hours
  },
  {
    id: 'hydration',
    nameKey: 'dashboard.hydration',
    value: '2.1',
    unit: 'L',
    icon: Droplets,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    trend: 'stable',
    source: 'Manual Entry',
    lastUpdatedMinutes: 60, // 1 hour
  },
];

// Export for use in Dashboard
export const WEARABLE_METRICS_DATA = demoMetrics;

interface WearableDataSectionProps {
  className?: string;
  showTitle?: boolean;
  showManageLink?: boolean;
  compact?: boolean;
  editMode?: boolean;
  orderedMetrics?: WidgetConfig[];
  onToggleMetric?: (metricId: WearableMetricId) => void;
  getMetricConfig?: (metricId: WearableMetricId) => WidgetConfig;
}

export function WearableDataSection({ 
  className, 
  showTitle = true,
  showManageLink = true,
  compact = false,
  editMode = false,
  orderedMetrics,
  onToggleMetric,
  getMetricConfig,
}: WearableDataSectionProps) {
  const { t } = useLocale();

  // Get metrics in order if orderedMetrics provided, otherwise use default order
  const metricsToRender = orderedMetrics
    ? orderedMetrics.map(om => demoMetrics.find(m => m.id === om.id as WearableMetricId)!).filter(Boolean)
    : demoMetrics;

  return (
    <section className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="title-md text-foreground">{t('dashboard.wearableData')}</h2>
          {showManageLink && (
            <Link 
              to="/wearables" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('dashboard.manageDevices')} →
            </Link>
          )}
        </div>
      )}
      
      <div className={cn(
        "grid gap-3",
        compact 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" 
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      )}>
        {metricsToRender.map((metric) => {
          const config = getMetricConfig?.(metric.id);
          const isVisible = config?.visible ?? true;
          
          // In non-edit mode, skip hidden metrics
          if (!editMode && !isVisible) return null;
          
          if (editMode && onToggleMetric && config) {
            return (
              <SortableWearableMetricCard 
                key={metric.id} 
                metric={metric} 
                compact={compact}
                editMode={editMode}
                config={config}
                onToggle={() => onToggleMetric(metric.id)}
              />
            );
          }
          
          return (
            <WearableMetricCard key={metric.id} metric={metric} compact={compact} />
          );
        })}
      </div>
    </section>
  );
}

interface WearableMetricCardProps {
  metric: WearableMetric;
  compact?: boolean;
}

function WearableMetricCard({ metric, compact }: WearableMetricCardProps) {
  const { t, locale } = useLocale();
  const Icon = metric.icon;
  const metricName = t(metric.nameKey);
  
  // Get localized relative time
  const getLocalizedTime = (minutes: number) => {
    if (minutes < 60) {
      return localizeRelativeTimeString(`${minutes} min ago`, locale);
    }
    const hours = Math.floor(minutes / 60);
    return localizeRelativeTimeString(`${hours} hour${hours > 1 ? 's' : ''} ago`, locale);
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return `↑ ${t('dashboard.improving')}`;
      case 'down': return `↓ ${t('dashboard.decreasing')}`;
      case 'stable': return `→ ${t('dashboard.stable')}`;
    }
  };
  
  const localizedTime = getLocalizedTime(metric.lastUpdatedMinutes);
  
  return (
    <WearableCardContent 
      metric={metric} 
      compact={compact} 
      metricName={metricName} 
      localizedTime={localizedTime} 
      getTrendLabel={getTrendLabel}
    />
  );
}

// Sortable wrapper for edit mode
interface SortableWearableMetricCardProps {
  metric: WearableMetric;
  compact?: boolean;
  editMode: boolean;
  config: WidgetConfig;
  onToggle: () => void;
}

function SortableWearableMetricCard({ metric, compact, editMode, config, onToggle }: SortableWearableMetricCardProps) {
  const { t, locale } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: metric.id, disabled: !editMode });

  const style = {
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const metricName = t(metric.nameKey);
  
  const getLocalizedTime = (minutes: number) => {
    if (minutes < 60) {
      return localizeRelativeTimeString(`${minutes} min ago`, locale);
    }
    const hours = Math.floor(minutes / 60);
    return localizeRelativeTimeString(`${hours} hour${hours > 1 ? 's' : ''} ago`, locale);
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return `↑ ${t('dashboard.improving')}`;
      case 'down': return `↓ ${t('dashboard.decreasing')}`;
      case 'stable': return `→ ${t('dashboard.stable')}`;
    }
  };
  
  const localizedTime = getLocalizedTime(metric.lastUpdatedMinutes);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      animate={{
        x: transform ? transform.x : 0,
        y: transform ? transform.y : 0,
        scale: isDragging ? 1.02 : 1,
        opacity: isDragging ? 0.8 : config.visible ? 1 : 0.3,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 25,
        mass: 0.8,
      }}
      className={cn(
        'relative group',
        editMode && 'ring-2 ring-dashed ring-primary/30 rounded-xl',
      )}
    >
      {/* Toggle visibility button */}
      <div className="absolute -top-2 right-2 z-10">
        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded-full transition-colors border',
            config.visible
              ? 'bg-hm-highlow100 hover:bg-hm-highlow200 border-hm-highlow200 text-white'
              : 'bg-hm-optimal100 hover:bg-hm-optimal200 border-hm-optimal200 text-white'
          )}
          title={config.visible ? t('dashboard.hideWidget') : t('dashboard.showWidget')}
        >
          {config.visible ? (
            <Minus className="h-2.5 w-2.5" />
          ) : (
            <Plus className="h-2.5 w-2.5" />
          )}
        </button>
      </div>

      {/* Drag handle */}
      <motion.div 
        {...attributes}
        {...listeners}
        className="absolute top-1/2 -left-1 -translate-y-1/2 z-10 p-0.5 bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing transition-all border border-border opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </motion.div>

      <div className={cn(!config.visible && 'pointer-events-none')}>
        <WearableCardContent 
          metric={metric} 
          compact={compact} 
          metricName={metricName} 
          localizedTime={localizedTime} 
          getTrendLabel={getTrendLabel}
        />
      </div>
    </motion.div>
  );
}

// Shared card content component
interface WearableCardContentProps {
  metric: WearableMetric;
  compact?: boolean;
  metricName: string;
  localizedTime: string;
  getTrendLabel: (trend: 'up' | 'down' | 'stable') => string;
}

function WearableCardContent({ metric, compact, metricName, localizedTime, getTrendLabel }: WearableCardContentProps) {
  const { t } = useLocale();
  const Icon = metric.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-white border-0">
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  metric.bgColor
                )}>
                  <Icon className={cn("h-3.5 w-3.5", metric.color)} />
                </div>
                <span className={cn(
                  "caption-sm text-muted-foreground",
                  compact && "text-xs"
                )}>
                  {metricName}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-xl font-semibold text-foreground",
                  compact && "text-lg"
                )}>
                  {metric.value}
                </span>
                <span className="text-xs text-muted-foreground">{metric.unit}</span>
              </div>
              
              {metric.trend && metric.trendValue && (
                <div className={cn(
                  "mt-1 text-xs",
                  metric.trend === 'up' && "text-hm-optimal200",
                  metric.trend === 'down' && "text-hm-highlow200",
                  metric.trend === 'stable' && "text-muted-foreground"
                )}>
                  {metric.trendValue} {t('dashboard.vsAvg')}
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-1.5 text-sm">
            <div className="font-medium">{metricName}</div>
            <div className="flex items-center justify-between gap-4 text-muted-foreground">
              <span>{t('dashboard.source')}</span>
              <span className="text-foreground">{metric.source}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-muted-foreground">
              <span>{t('dashboard.updated')}</span>
              <span className="text-foreground">{localizedTime}</span>
            </div>
            {metric.trend && (
              <div className="flex items-center justify-between gap-4 text-muted-foreground">
                <span>{t('dashboard.trend')}</span>
                <span className={cn(
                  metric.trend === 'up' && "text-hm-optimal200",
                  metric.trend === 'down' && "text-hm-highlow200",
                  metric.trend === 'stable' && "text-foreground"
                )}>
                  {getTrendLabel(metric.trend)}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Skeleton loader for wearable data section
export function WearableDataSectionSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 rounded bg-muted animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
      
      <div className={cn(
        "grid gap-3",
        compact 
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" 
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white border-0">
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "h-7 w-7 rounded-lg bg-muted animate-pulse",
                  compact && "h-6 w-6"
                )} />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-6 w-12 rounded bg-muted animate-pulse mb-1" />
              <div className="h-3 w-14 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}