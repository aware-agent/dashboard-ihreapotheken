import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Heart, Footprints, Flame, Moon, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import type { WearableMetricType, TrendDirection, WearableMetricSummary } from '@/types/wearables';
import { 
  DEMO_WEARABLE_SUMMARY_DATA, 
  getBiomarkerToWearableMetrics,
  hasEnoughData,
} from '@/lib/wearableBiomarkerMapping';

// Icon mapping with colors
const metricConfig: Record<string, { 
  icon: React.ElementType; 
  bgClass: string; 
  iconClass: string;
}> = {
  'footprints': { 
    icon: Footprints, 
    bgClass: 'bg-hm-optimal50', 
    iconClass: 'text-hm-optimal200',
  },
  'flame': { 
    icon: Flame, 
    bgClass: 'bg-hm-highlow50', 
    iconClass: 'text-hm-highlow200',
  },
  'heart': { 
    icon: Heart, 
    bgClass: 'bg-[#FEE2E2]', 
    iconClass: 'text-[#EF4444]',
  },
  'moon': { 
    icon: Moon, 
    bgClass: 'bg-[#E0E7FF]', 
    iconClass: 'text-[#6366F1]',
  },
  'activity': { 
    icon: Activity, 
    bgClass: 'bg-[#D1FAE5]', 
    iconClass: 'text-[#10B981]',
  },
  'activity-square': { 
    icon: Activity, 
    bgClass: 'bg-[#D1FAE5]', 
    iconClass: 'text-[#10B981]',
  },
};

interface RelatedWearableDataProps {
  biomarkerCode?: string;
  biomarkerName?: string;
  className?: string;
}

export function RelatedWearableData({ 
  biomarkerCode, 
  biomarkerName,
  className,
}: RelatedWearableDataProps) {
  const { t } = useLocale();

  // Get related wearable metrics for this biomarker
  const relatedMetrics: WearableMetricSummary[] = useMemo(() => {
    if (!biomarkerCode) return [];
    
    const biomarkerToMetrics = getBiomarkerToWearableMetrics();
    
    // Find which metrics are related to this biomarker by checking all biomarker codes
    const matchingMetricIds = new Set<WearableMetricType>();
    
    for (const [code, metricIds] of Object.entries(biomarkerToMetrics)) {
      // Check if the biomarker code matches (case-insensitive, partial match)
      if (
        code.toLowerCase().includes(biomarkerCode.toLowerCase()) ||
        biomarkerCode.toLowerCase().includes(code.toLowerCase().replace('_', ''))
      ) {
        metricIds.forEach(id => matchingMetricIds.add(id));
      }
    }
    
    return DEMO_WEARABLE_SUMMARY_DATA.filter(m => matchingMetricIds.has(m.id));
  }, [biomarkerCode]);

  if (relatedMetrics.length === 0) return null;

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3.5 w-3.5" />;
      case 'down': return <TrendingDown className="h-3.5 w-3.5" />;
      default: return <Minus className="h-3.5 w-3.5" />;
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    if (value % 1 !== 0) return value.toFixed(1);
    return value.toLocaleString();
  };

  return (
    <section className={className}>
      {/* Header with title and link */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="title-sm text-foreground">
          {t('wearables.relatedMetrics')}
        </h2>
        <Link 
          to="/wearables"
          className="inline-flex items-center gap-1 caption-md text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('wearables.viewAllMetrics')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedMetrics.map((metric) => {
          const config = metricConfig[metric.icon] || metricConfig['activity'];
          const Icon = config.icon;
          const hasData = hasEnoughData(metric.currentPeriod);
          const trendPercent = metric.currentPeriod.trendPercent;
          const trend = metric.currentPeriod.trend;
          
          return (
            <Card key={metric.id} className="bg-white border-0 rounded-2xl">
              <CardContent className="p-4">
                {/* Header with colored icon and name */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    config.bgClass
                  )}>
                    <Icon className={cn("h-4 w-4", config.iconClass)} />
                  </div>
                  <span className="body-sm font-medium text-foreground">
                    {t(metric.nameKey)}
                  </span>
                </div>
                
                {hasData ? (
                  <>
                    {/* Value */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-2xl font-bold text-foreground">
                        {formatValue(metric.currentPeriod.average)}
                      </span>
                      <span className="body-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    
                    {/* Trend badge - pill style like wearables page */}
                    {trendPercent !== null && (
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full caption-md',
                        trend === 'up' && 'bg-hm-optimal50 text-hm-optimal200',
                        trend === 'down' && 'bg-hm-highlow50 text-hm-highlow200',
                        trend === 'stable' && 'bg-muted text-muted-foreground'
                      )}>
                        {getTrendIcon(trend)}
                        <span>
                          {trendPercent > 0 ? '+' : ''}{trendPercent}% {t('wearables.vsLastPeriod')}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="caption-sm text-muted-foreground">
                    {t('wearables.notEnoughData')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
