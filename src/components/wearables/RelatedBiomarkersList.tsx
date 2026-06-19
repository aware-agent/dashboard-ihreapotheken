import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { getBiomarkerIcon } from '@/lib/biomarkerIcons';
import type { RelatedBiomarkerInfo, BiomarkerRangeStatus } from '@/types/wearables';

// Import status icons
import inRangeIcon from '@/assets/status-icons/in_range.svg';
import optimalIcon from '@/assets/status-icons/optimal.svg';
import highIcon from '@/assets/status-icons/high.svg';
import lowIcon from '@/assets/status-icons/low.svg';

interface RelatedBiomarkersListProps {
  biomarkers: RelatedBiomarkerInfo[];
  className?: string;
  compact?: boolean;
}

export function RelatedBiomarkersList({ 
  biomarkers, 
  className,
  compact = false,
}: RelatedBiomarkersListProps) {
  const { t } = useLocale();

  if (biomarkers.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {!compact && (
        <h4 className="caption-md text-muted-foreground font-medium">
          {t('wearables.relatedBiomarkers')}
        </h4>
      )}
      <div className="flex flex-wrap gap-2">
        {biomarkers.map((biomarker) => (
          <BiomarkerPill 
            key={biomarker.code} 
            biomarker={biomarker} 
          />
        ))}
      </div>
    </div>
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
        ? 'border border-dashed border-border' 
        : 'border border-border',
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
        'text-sm',
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
  detailedStatus?: 'OPTIMAL' | 'NORMAL' | 'HIGH' | 'LOW';
}

function StatusOverlay({ status, detailedStatus }: StatusOverlayProps) {
  if (status === 'not_tested') {
    return null;
  }

  let iconSrc: string | null = null;
  
  if (status === 'in_range') {
    // Default to in_range icon, could be optimal
    iconSrc = detailedStatus === 'OPTIMAL' ? optimalIcon : inRangeIcon;
  } else if (status === 'out_of_range') {
    // Default to high, could be low
    iconSrc = detailedStatus === 'LOW' ? lowIcon : highIcon;
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
