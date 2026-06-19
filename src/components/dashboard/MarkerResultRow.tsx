import { Info } from 'lucide-react';
import { Biomarker } from '@/types/biomarkers';
import { StatusBadge } from './StatusBadge';
import { formatMarkerValue, getStatusColor } from '@/lib/biomarkerUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarkerResultRowProps {
  marker: Biomarker;
}

export function MarkerResultRow({ marker }: MarkerResultRowProps) {
  const { value, referenceRange } = marker;
  const rangeWidth = referenceRange.max - referenceRange.min;
  const valuePosition = Math.min(
    Math.max(((value - referenceRange.min) / rangeWidth) * 100, 0),
    100
  );

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{marker.name}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{marker.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            {/* Reference range indicator */}
            <div className="absolute inset-0 bg-[hsl(var(--hm-normal)/0.3)]" />
            {/* Optimal range if exists */}
            {marker.referenceRange.optimalMin !== undefined && (
              <div
                className="absolute h-full bg-[hsl(var(--hm-optimal)/0.3)]"
                style={{
                  left: `${((marker.referenceRange.optimalMin - referenceRange.min) / rangeWidth) * 100}%`,
                  width: `${((marker.referenceRange.optimalMax! - marker.referenceRange.optimalMin) / rangeWidth) * 100}%`,
                }}
              />
            )}
            {/* Value marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background"
              style={{
                left: `${valuePosition}%`,
                transform: `translateX(-50%) translateY(-50%)`,
                backgroundColor: getStatusColor(marker.status),
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{referenceRange.min}</span>
            <span>{referenceRange.max} {marker.unit}</span>
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-foreground">
          {formatMarkerValue(marker.value, marker.unit)}
        </p>
        <StatusBadge status={marker.status} size="sm" className="mt-1" />
      </div>
    </div>
  );
}
