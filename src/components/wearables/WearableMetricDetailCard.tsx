import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Heart, Footprints, Flame, Moon, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { getBiomarkerIcon } from '@/lib/biomarkerIcons';
import type { WearableMetricSummary, TrendDirection, RelatedBiomarkerInfo, BiomarkerRangeStatus } from '@/types/wearables';
import type { BiomarkerResult } from '@/types/results';
import { 
  matchBiomarkerByName, 
  getBiomarkerRangeStatus, 
  getBiomarkerDisplayName,
} from '@/lib/wearableBiomarkerMapping';

// Import status icons
import inRangeIcon from '@/assets/status-icons/in_range.svg';
import optimalIcon from '@/assets/status-icons/optimal.svg';
import highIcon from '@/assets/status-icons/high.svg';
import lowIcon from '@/assets/status-icons/low.svg';

// Icon mapping with proper colors
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

interface WearableMetricDetailCardProps {
  metric: WearableMetricSummary;
  biomarkers?: BiomarkerResult[];
  className?: string;
  showChart?: boolean;
}

export function WearableMetricDetailCard({ 
  metric, 
  biomarkers = [],
  className,
}: WearableMetricDetailCardProps) {
  const { t } = useLocale();
  const config = metricConfig[metric.icon] || metricConfig['activity'];
  const Icon = config.icon;

  // Get ALL related biomarkers with status
  const relatedBiomarkersWithStatus: RelatedBiomarkerInfo[] = useMemo(() => {
    return metric.relatedBiomarkerCodes.map(code => {
      const displayName = getBiomarkerDisplayName(code);
      const matched = matchBiomarkerByName(displayName, code, biomarkers);
      return {
        code,
        name: matched?.name || displayName,
        status: getBiomarkerRangeStatus(matched),
        id: matched?.id,
      };
    });
  }, [metric.relatedBiomarkerCodes, biomarkers]);

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3.5 w-3.5" />;
      case 'down': return <TrendingDown className="h-3.5 w-3.5" />;
      default: return <Minus className="h-3.5 w-3.5" />;
    }
  };

  const getTrendColor = (trend: TrendDirection) => {
    switch (trend) {
      case 'up': return 'text-hm-optimal200';
      case 'down': return 'text-hm-highlow200';
      default: return 'text-muted-foreground';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    if (value % 1 !== 0) return value.toFixed(1);
    return value.toString();
  };

  return (
    <Card className={cn('bg-white border-0 rounded-2xl overflow-hidden', className)}>
      <CardContent className="p-5">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-foreground" />
          <h3 className="title-sm text-foreground">
            {t(metric.nameKey)}
          </h3>
        </div>

        {/* Stats row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-foreground">
            {formatValue(metric.currentPeriod.average)}
          </span>
          <span className="body-sm text-muted-foreground">{metric.unit}</span>
        </div>

        {/* Trend badge */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {metric.currentPeriod.trendPercent !== null && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full caption-md',
              metric.currentPeriod.trend === 'up' && 'bg-hm-optimal50 text-hm-optimal200',
              metric.currentPeriod.trend === 'down' && 'bg-hm-highlow50 text-hm-highlow200',
              metric.currentPeriod.trend === 'stable' && 'bg-muted text-muted-foreground'
            )}>
              {getTrendIcon(metric.currentPeriod.trend)}
              <span>
                {metric.currentPeriod.trendPercent > 0 ? '+' : ''}
                {metric.currentPeriod.trendPercent}% {t('wearables.vsLastPeriod')}
              </span>
            </div>
          )}
        </div>

        {/* Related biomarkers section */}
        {relatedBiomarkersWithStatus.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {t('wearables.relatedBiomarkers')}
            </p>
            <div className="flex flex-wrap gap-2">
              {relatedBiomarkersWithStatus.map((biomarker) => (
                <BiomarkerPill key={biomarker.code} biomarker={biomarker} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BiomarkerPillProps {
  biomarker: RelatedBiomarkerInfo;
}

function BiomarkerPill({ biomarker }: BiomarkerPillProps) {
  const isNotTested = biomarker.status === 'not_tested';
  const iconSrc = getBiomarkerIcon(biomarker.code);
  
  const content = (
    <div className={cn(
      'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
      isNotTested 
        ? 'border border-dashed border-[#b8e094]' 
        : 'border border-[#b8e094]',
      biomarker.id && !isNotTested && 'hover:bg-muted/50 cursor-pointer'
    )}>
      {/* Biomarker icon with status overlay */}
      <div className="relative flex-shrink-0">
        {iconSrc ? (
          <img 
            src={iconSrc} 
            alt={biomarker.name}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[8px] font-medium text-muted-foreground">
              {biomarker.code.slice(0, 2)}
            </span>
          </div>
        )}
        {/* Status indicator overlay */}
        <StatusOverlay status={biomarker.status} />
      </div>
      
      {/* Biomarker name */}
      <span className={cn(
        'text-xs',
        isNotTested ? 'text-muted-foreground' : 'text-foreground'
      )}>
        {biomarker.name}
      </span>
      
      {/* Arrow icon (only for tested biomarkers with links) */}
      {biomarker.id && !isNotTested && (
        <ArrowIcon className="w-4 h-4 text-foreground flex-shrink-0" />
      )}
    </div>
  );

  if (biomarker.id && !isNotTested) {
    return (
      <Link to={`/biomarkers/${biomarker.id}`}>
        {content}
      </Link>
    );
  }

  return content;
}

interface StatusOverlayProps {
  status: BiomarkerRangeStatus;
}

function StatusOverlay({ status }: StatusOverlayProps) {
  if (status === 'not_tested') {
    return null;
  }

  let iconSrc: string | null = null;
  
  if (status === 'in_range') {
    iconSrc = inRangeIcon;
  } else if (status === 'out_of_range') {
    iconSrc = highIcon;
  }

  if (!iconSrc) return null;

  return (
    <img 
      src={iconSrc} 
      alt={status} 
      className="absolute -bottom-0.5 -right-0.5 w-3 h-3"
    />
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M10.1131 4C11.5153 5.03704 12.7748 6.24852 13.8603 7.60379C13.9534 7.72005 14 7.86002 14 8M10.1131 12C11.5153 10.963 12.7748 9.75148 13.8603 8.39621C13.9534 8.27995 14 8.13998 14 8M14 8H2" 
        stroke="currentColor" 
        strokeWidth="1.33" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
