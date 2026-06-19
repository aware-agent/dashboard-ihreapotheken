import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@/hooks/useLocale";
import { formatNumberAuto } from "@/lib/dateUtils";
import { RangeTernary } from "@/types/results";

interface BiomarkerVerticalRangeBarProps {
  value: number;
  range: [number | null, number | null];
  optimalRange: [number | null, number | null];
  rangeOptimalTernary: RangeTernary;
  unit?: string;
  height?: number;
  rangeType: string | null;
}

export function BiomarkerVerticalRangeBar({
  value,
  range,
  optimalRange,
  rangeOptimalTernary,
  unit,
  height = 44,
  rangeType = null,
}: BiomarkerVerticalRangeBarProps) {
  const { locale } = useLocale();
  const [min, max] = range;
  const [optMin, optMax] = optimalRange;

  const hasRangeData = min !== null || max !== null;
  const hasOptimalData = optMin !== null || optMax !== null;

  if (!hasRangeData && !hasOptimalData) {
    return (
      <div className="w-28 h-11 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">N/A</span>
      </div>
    );
  }

  // Calculate display range with padding
  let displayMin = 0;
  let displayMax = 100;

  const effectiveMin = min ?? optMin;
  const effectiveMax = max ?? optMax;

  if (effectiveMin !== null && effectiveMax !== null) {
    const rangeSize = effectiveMax - effectiveMin;
    const padding = rangeSize * 0.3;
    displayMin = effectiveMin - padding;
    displayMax = effectiveMax + padding;
  } else if (effectiveMax !== null) {
    displayMin = 0;
    displayMax = effectiveMax * 1.5;
  } else if (effectiveMin !== null) {
    displayMin = 0;
    displayMax = effectiveMin * 2;
  }

  if (value < displayMin) displayMin = value * 0.8;
  if (value > displayMax) displayMax = value * 1.2;

  // Calculate position (0 = bottom, 100 = top)
  let valuePosition = ((value - displayMin) / (displayMax - displayMin)) * 100;
  valuePosition = Math.max(5, Math.min(95, valuePosition));

  // Zone positions
  const getPosition = (val: number | null) => {
    if (val === null) return null;
    const pos = ((val - displayMin) / (displayMax - displayMin)) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  const rangeMinPos = getPosition(min);
  const rangeMaxPos = getPosition(max);
  const optMinPos = getPosition(optMin);
  const optMaxPos = getPosition(optMax);

  // Determine status - check if out of range first
  const isHigh = max !== null && value > max;
  const isLow = min !== null && value < min;
  const isOutOfRange = isHigh || isLow;

  // Only check optimal if we have optimal data and value is in range
  const isOptimal =
    !isOutOfRange &&
    hasOptimalData &&
    (optMin === null || value >= optMin) &&
    (optMax === null || value <= optMax);

  // In range but not optimal (normal)
  const isInRange = !isOutOfRange && !isOptimal;

  // Colors based on status - prioritize out of range
  const dotColor = isOutOfRange
    ? "hsl(var(--hm-highlow200))"
    : isOptimal
      ? "hsl(var(--hm-optimal200))"
      : "hsl(var(--hm-normal200))";

  const lineColor = isOutOfRange
    ? "hsl(var(--hm-highlow100))"
    : isOptimal
      ? "hsl(var(--hm-optimal100))"
      : "hsl(var(--hm-normal100))";

  const bgColor = isOutOfRange
    ? "hsl(var(--hm-highlow100) / 0.15)"
    : isOptimal
      ? "hsl(var(--hm-optimal100) / 0.15)"
      : "hsl(var(--hm-normal100) / 0.15)";

  // Build gradient for vertical bar
  const buildGradient = () => {
    const segments: string[] = [];

    if (!hasRangeData && hasOptimalData) {
      if (optMinPos !== null && optMaxPos === null) {
        if (rangeOptimalTernary === -1) {
          segments.push(`hsl(var(--hm-norange)) 0%`);
          segments.push(`hsl(var(--hm-norange)) ${optMinPos}%`);
          segments.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
          segments.push(`hsl(var(--hm-optimal100)) 100%`);
        } else {
          segments.push(`hsl(var(--hm-highlow100)) 0%`);
          segments.push(`hsl(var(--hm-highlow100)) ${optMinPos}%`);
          segments.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
          segments.push(`hsl(var(--hm-optimal100)) 100%`);
        }
      } else if (optMinPos === null && optMaxPos !== null) {
        segments.push(`hsl(var(--hm-optimal100)) 0%`);
        segments.push(`hsl(var(--hm-optimal100)) ${optMaxPos}%`);
        segments.push(`hsl(var(--hm-highlow100)) ${optMaxPos}%`);
        segments.push(`hsl(var(--hm-highlow100)) 100%`);
      } else if (optMinPos !== null && optMaxPos !== null) {
        segments.push(`hsl(var(--hm-highlow100)) 0%`);
        segments.push(`hsl(var(--hm-highlow100)) ${optMinPos}%`);
        segments.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
        segments.push(`hsl(var(--hm-optimal100)) ${optMaxPos}%`);
        segments.push(`hsl(var(--hm-highlow100)) ${optMaxPos}%`);
        segments.push(`hsl(var(--hm-highlow100)) 100%`);
      }
      return `linear-gradient(to top, ${segments.join(", ")})`;
    }

    if (rangeMinPos !== null && rangeMinPos > 0) {
      if (rangeType === "leftSideRisk") {
        segments.push(`hsl(var(--hm-normal100)) 0%`);
        segments.push(`hsl(var(--hm-normal100)) ${rangeMinPos}%`);
      } else {
        segments.push(`hsl(var(--hm-highlow100)) 0%`);
        segments.push(`hsl(var(--hm-highlow100)) ${rangeMinPos}%`);
      }
    }

    const normalLowStart = rangeMinPos ?? 0;
    const normalLowEnd = optMinPos ?? rangeMinPos ?? 0;

    if (normalLowEnd > normalLowStart) {
      if (segments.length === 0) {
        segments.push(`hsl(var(--hm-normal100)) 0%`);
      } else {
        segments.push(`hsl(var(--hm-normal100)) ${normalLowStart}%`);
      }
      segments.push(`hsl(var(--hm-normal100)) ${normalLowEnd}%`);
    }

    const optStart = optMinPos ?? rangeMinPos ?? 0;
    const optEnd = optMaxPos ?? rangeMaxPos ?? 100;

    if (segments.length === 0) {
      segments.push(`hsl(var(--hm-optimal100)) 0%`);
    } else {
      if (rangeType === "leftSideRisk") {
        segments.push(`hsl(var(--hm-moderaterisk75)) ${optStart}%`);
      } else {
        if (optMin === null && optMax === null) {
          segments.push(`hsl(var(--hm-normal100)) ${optStart}%`);
        } else {
          segments.push(`hsl(var(--hm-optimal100)) ${optStart}%`);
        }
      }
    }
    if (rangeType === "leftSideRisk") {
      segments.push(`hsl(var(--hm-moderaterisk75)) ${optEnd}%`);
    } else {
      if (optMin === null && optMax === null) {
        segments.push(`hsl(var(--hm-normal100)) ${optEnd}%`);
      } else {
        segments.push(`hsl(var(--hm-optimal100)) ${optEnd}%`);
      }
    }

    const normalHighStart = optMaxPos ?? rangeMaxPos ?? 100;
    const normalHighEnd = rangeMaxPos ?? 100;

    if (normalHighEnd > normalHighStart) {
      segments.push(`hsl(var(--hm-normal100)) ${normalHighStart}%`);
      segments.push(`hsl(var(--hm-normal100)) ${normalHighEnd}%`);
    }

    if (rangeMaxPos !== null && rangeMaxPos < 100) {
      segments.push(`hsl(var(--hm-highlow100)) ${rangeMaxPos}%`);
      segments.push(`hsl(var(--hm-highlow100)) 100%`);
    } else if (segments.length > 0) {
      const lastColor = segments[segments.length - 1].split(" ")[0];
      segments.push(`${lastColor} 100%`);
    }

    if (segments.length === 0) {
      return "linear-gradient(to top, hsl(var(--hm-optimal100)) 0%, hsl(var(--hm-optimal100)) 100%)";
    }

    return `linear-gradient(to top, ${segments.join(", ")})`;
  };

  // Calculate the zone background position to match the vertical bar zone

  // Calculate the zone background position to match the vertical bar zone
  const getZonePosition = () => {
    if (isOptimal && optMinPos !== null && optMaxPos !== null) {
      return { bottom: optMinPos, height: optMaxPos - optMinPos };
    } else if (isOptimal && optMinPos !== null) {
      return { bottom: optMinPos, height: 100 - optMinPos };
    } else if (isOptimal && optMaxPos !== null) {
      return { bottom: 0, height: optMaxPos };
    } else if (isHigh && rangeMaxPos !== null) {
      // For high values, show the high zone (above rangeMax)
      return { bottom: rangeMaxPos, height: 100 - rangeMaxPos };
    } else if (isLow && rangeMinPos !== null) {
      // For low values, show the low zone (below rangeMin)
      return { bottom: 0, height: rangeMinPos };
    } else if (isInRange && rangeMinPos !== null && rangeMaxPos !== null) {
      // For normal range, use the range positions
      return { bottom: rangeMinPos, height: rangeMaxPos - rangeMinPos };
    } else if (isInRange && rangeMinPos !== null) {
      return { bottom: rangeMinPos, height: 100 - rangeMinPos };
    } else if (isInRange && rangeMaxPos !== null) {
      return { bottom: 0, height: rangeMaxPos };
    }
    // Fallback
    return { bottom: 0, height: 100 };
  };

  const zonePosition = getZonePosition();

  return (
    <TooltipProvider>
      <div
        className="relative flex items-end w-full sm:w-28"
        style={{ height: `${height}px` }}
      >
        {/* Subtle background fill matching the zone on vertical bar */}
        <div
          className="absolute left-0 right-4"
          style={{
            bottom: `${zonePosition.bottom}%`,
            height: `${zonePosition.height}%`,
            background: `linear-gradient(to right, transparent 0%, ${bgColor} 30%, ${bgColor} 100%)`,
          }}
        />

        {/* Container for line and dot - positioned at value height */}
        <div
          className="absolute left-0 right-4 flex items-center z-10"
          style={{
            bottom: `${valuePosition}%`,
            transform: "translateY(50%)",
          }}
        >
          {/* Horizontal line with gradient fade */}
          <div
            className="flex-1 h-0.5 rounded-full"
            style={{
              background: `linear-gradient(to right, transparent 0%, ${lineColor} 50%, ${dotColor} 100%)`,
            }}
          />

          {/* Dot indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 cursor-pointer transition-transform hover:scale-125 z-10 -ml-0.5"
                style={{ backgroundColor: dotColor }}
              />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="font-medium">
                {formatNumberAuto(value, locale)} {unit}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Vertical range bar - fixed on right side */}
        <div className="absolute right-0">
          {/* Main gradient bar showing all zones */}
          <div
            className="w-2 rounded-full relative"
            style={{
              height: `${height}px`,
              background: buildGradient(),
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
