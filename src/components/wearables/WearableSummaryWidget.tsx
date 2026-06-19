import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Footprints, Moon, Activity, Flame, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';

import type { WearableSummaryPeriod } from '@/types/wearables';
import { DEMO_WEARABLE_SUMMARY_DATA } from '@/lib/wearableBiomarkerMapping';

// Metric configuration with colors matching design system
const metricConfig: Record<string, { 
  icon: React.ElementType; 
  bgClass: string; 
  iconClass: string;
  unit: string;
}> = {
  'steps': { 
    icon: Footprints, 
    bgClass: 'bg-hm-optimal50', 
    iconClass: 'text-hm-optimal200',
    unit: 'steps'
  },
  'calories': { 
    icon: Flame, 
    bgClass: 'bg-hm-highlow50', 
    iconClass: 'text-hm-highlow200',
    unit: 'kcal'
  },
  'heart-rate': { 
    icon: Heart, 
    bgClass: 'bg-[#FEE2E2]', 
    iconClass: 'text-[#EF4444]',
    unit: 'bpm'
  },
  'sleep': { 
    icon: Moon, 
    bgClass: 'bg-[#E0E7FF]', 
    iconClass: 'text-[#6366F1]',
    unit: '%'
  },
  'hrv': { 
    icon: Activity, 
    bgClass: 'bg-[#D1FAE5]', 
    iconClass: 'text-[#10B981]',
    unit: 'ms'
  },
  'hydration': { 
    icon: Droplets, 
    bgClass: 'bg-[#DBEAFE]', 
    iconClass: 'text-[#3B82F6]',
    unit: 'L'
  },
};

interface WearableSummaryWidgetProps {
  className?: string;
  period?: WearableSummaryPeriod;
}

export function WearableSummaryWidget({ 
  className,
  period = 'biweekly',
}: WearableSummaryWidgetProps) {
  const { t } = useLocale();

  // Get top 6 metrics to show in 2x3 grid
  const topMetrics = DEMO_WEARABLE_SUMMARY_DATA.slice(0, 6);

  const formatValue = (value: number, metricId: string) => {
    if (metricId === 'steps' && value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    if (value % 1 !== 0) return value.toFixed(0);
    return value.toLocaleString();
  };

  return (
    <Card className={cn('bg-white border-0 rounded-2xl h-full flex flex-col', className)}>
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-5">
          <h3 className="title-sm text-foreground">
            {t('wearables.healthSummary')}
          </h3>
          <p className="caption-sm text-muted-foreground mt-0.5">
            {t('wearables.last2Weeks')}
          </p>
        </div>

        {/* Metrics Grid - 2 columns, 3 rows */}
        <div className="grid grid-cols-2 gap-3 flex-1">
          {topMetrics.map((metric) => {
            const config = metricConfig[metric.id] || metricConfig['heart-rate'];
            const Icon = config.icon;
            
            return (
              <div 
                key={metric.id} 
                className="flex flex-col p-3 rounded-xl border border-[#b8e094] bg-transparent hover:bg-muted/30 transition-colors"
              >
                {/* Icon + Label inline */}
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {t(metric.nameKey)}
                  </p>
                </div>
                
                {/* Value below */}
                <span className="title-sm text-foreground mt-1">
                  {formatValue(metric.currentPeriod.average, metric.id)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="mt-auto flex justify-center pt-4">
          <Button
            asChild
            className="bg-foreground hover:bg-foreground/90 text-background text-xs font-bold p-2 rounded-lg h-6 leading-[21px]"
          >
            <Link to="/wearables">{t('wearables.viewAllData')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
