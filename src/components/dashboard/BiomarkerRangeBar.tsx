import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocale } from "@/hooks/useLocale";
import { formatNumberAuto } from "@/lib/dateUtils";
import { RangeTernary } from "@/types/results";

interface BiomarkerRangeBarProps {
  value: number;
  range: [number | null, number | null];
  optimalRange: [number | null, number | null];
  rangeOptimalTernary: RangeTernary;
  unit?: string;
  showLabels?: boolean;
  barHeight?: "sm" | "md";
  rangeType: string | null;
}

export function BiomarkerRangeBar({
  value,
  range,
  optimalRange,
  rangeOptimalTernary,
  unit,
  showLabels = true,
  barHeight = "md",
  rangeType = null,
}: BiomarkerRangeBarProps) {
  const { locale, t } = useLocale();
  const [min, max] = range;
  const [optMin, optMax] = optimalRange;

  // Check if we have any reference data at all
  const hasRangeData = min !== null || max !== null;
  const hasOptimalData = optMin !== null || optMax !== null;

  if (!hasRangeData && !hasOptimalData) {
    return (
      <p className="caption-md text-muted-foreground">
        {t("common.noReferenceRange")}
      </p>
    );
  }

  // Calculate display range with padding
  let displayMin = 0;
  let displayMax = 100;

  // Use optimal range if regular range is not available
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

  // Ensure value is within display range
  if (value < displayMin) displayMin = value * 0.8;
  if (value > displayMax) displayMax = value * 1.2;

  // Calculate position as percentage
  const getPosition = (val: number | null) => {
    if (val === null) return null;
    const pos = ((val - displayMin) / (displayMax - displayMin)) * 100;
    return Math.max(0, Math.min(100, pos));
  };

  // Calculate value position (clamped between 5% and 95%)
  let position = ((value - displayMin) / (displayMax - displayMin)) * 100;
  position = Math.max(5, Math.min(95, position));

  // Calculate positions for tick marks
  const rangeMinPos = getPosition(min);
  const rangeMaxPos = getPosition(max);
  const optMinPos = getPosition(optMin);
  const optMaxPos = getPosition(optMax);

  // Build tick marks array with unique values
  const tickMarks: { value: number; position: number; isOptimal: boolean }[] =
    [];

  // Add range boundaries
  if (min !== null && rangeMinPos !== null) {
    tickMarks.push({ value: min, position: rangeMinPos, isOptimal: false });
  }
  if (max !== null && rangeMaxPos !== null) {
    tickMarks.push({ value: max, position: rangeMaxPos, isOptimal: false });
  }

  // Add optimal boundaries (if different from range boundaries)
  if (optMin !== null && optMinPos !== null && optMin !== min) {
    tickMarks.push({ value: optMin, position: optMinPos, isOptimal: true });
  }
  if (optMax !== null && optMaxPos !== null && optMax !== max) {
    tickMarks.push({ value: optMax, position: optMaxPos, isOptimal: true });
  }

  // Sort by position
  tickMarks.sort((a, b) => a.position - b.position);

  // Filter out ticks that are too close together (within 8% of each other)
  const filteredTicks = tickMarks.filter((tick, index, arr) => {
    if (index === 0) return true;
    return tick.position - arr[index - 1].position > 8;
  });

  // Determine range type and calculate gradient stops
  const getGradientStyle = () => {
    // Case 1: No range data, only optimal range (e.g., HDL cholesterol)
    if (!hasRangeData && hasOptimalData) {
      const stops: string[] = [];
      if (optMinPos !== null && optMaxPos === null) {
        // Optimal starts at optMin and goes to right (e.g., HDL: higher is better)
        if (rangeOptimalTernary === -1) {
          stops.push(`hsl(var(--hm-norange)) 0%`);
          stops.push(`hsl(var(--hm-norange)) ${optMinPos}%`);
          stops.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
          stops.push(`hsl(var(--hm-optimal100)) 100%`);
        } else {
          stops.push(`hsl(var(--hm-highlow100)) 0%`);
          stops.push(`hsl(var(--hm-highlow100)) ${optMinPos}%`);
          stops.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
          stops.push(`hsl(var(--hm-optimal100)) 100%`);
        }
      } else if (optMinPos === null && optMaxPos !== null) {
        // Optimal from left to optMax (e.g., LDL: lower is better)
        stops.push(`hsl(var(--hm-optimal100)) 0%`);
        stops.push(`hsl(var(--hm-optimal100)) ${optMaxPos}%`);
        stops.push(`hsl(var(--hm-highlow100)) ${optMaxPos}%`);
        stops.push(`hsl(var(--hm-highlow100)) 100%`);
      } else if (optMinPos !== null && optMaxPos !== null) {
        // Both optimal bounds exist
        stops.push(`hsl(var(--hm-highlow100)) 0%`);
        stops.push(`hsl(var(--hm-highlow100)) ${optMinPos}%`);
        stops.push(`hsl(var(--hm-optimal100)) ${optMinPos}%`);
        stops.push(`hsl(var(--hm-optimal100)) ${optMaxPos}%`);
        stops.push(`hsl(var(--hm-highlow100)) ${optMaxPos}%`);
        stops.push(`hsl(var(--hm-highlow100)) 100%`);
      }
      return `linear-gradient(to right, ${stops.join(", ")})`;
    }

    // Case 2: Has range data - build gradient with LOW, NORMAL, OPTIMAL, NORMAL, HIGH zones
    const stops: string[] = [];

    // Determine zone boundaries
    const lowEnd = rangeMinPos ?? 0;
    const optStart = optMinPos ?? rangeMinPos ?? 0;
    const optEnd = optMaxPos ?? rangeMaxPos ?? 100;
    const highStart = rangeMaxPos ?? 100;

    // LOW zone: 0% to rangeMin (orange)
    // If rangeType is leftSideRisk, use normal color instead of highlow color
    if (lowEnd > 0) {
      if (rangeType === "leftSideRisk") {
        stops.push(`hsl(var(--hm-normal100)) 0%`);
        stops.push(`hsl(var(--hm-normal100)) ${lowEnd}%`);
      } else {
        stops.push(`hsl(var(--hm-highlow100)) 0%`);
        stops.push(`hsl(var(--hm-highlow100)) ${lowEnd}%`);
      }
    }

    // NORMAL zone below optimal: rangeMin to optMin (light green)
    if (optStart > lowEnd) {
      stops.push(`hsl(var(--hm-normal100)) ${lowEnd}%`);
      stops.push(`hsl(var(--hm-normal100)) ${optStart}%`);
    }

    // OPTIMAL zone: optMin to optMax (dark green)
    // This always starts from where we left off or from 0 if nothing before
    const currentPos = Math.max(lowEnd, optStart);
    if (stops.length === 0) {
      stops.push(`hsl(var(--hm-optimal100)) 0%`);
    } else {
      if (rangeType === "leftSideRisk") {
        stops.push(`hsl(var(--hm-moderaterisk75)) ${currentPos}%`);
      } else {
        if (optMin === null && optMax === null) {
          stops.push(`hsl(var(--hm-normal100)) ${currentPos}%`);
        } else {
          stops.push(`hsl(var(--hm-optimal100)) ${currentPos}%`);
        }
      }
    }
    if (rangeType === "leftSideRisk") {
      stops.push(`hsl(var(--hm-moderaterisk75)) ${optEnd}%`);
    } else {
      if (optMin === null && optMax === null) {
        stops.push(`hsl(var(--hm-normal100)) ${optEnd}%`);
      } else {
        stops.push(`hsl(var(--hm-optimal100)) ${optEnd}%`);
      }
    }

    // NORMAL zone above optimal: optMax to rangeMax (light green)
    if (highStart > optEnd) {
      stops.push(`hsl(var(--hm-normal100)) ${optEnd}%`);
      stops.push(`hsl(var(--hm-normal100)) ${highStart}%`);
    }

    // HIGH zone: rangeMax to 100% (orange)
    if (highStart < 100) {
      if (rangeType === "leftSideRisk") {
        stops.push(`hsl(var(--hm-highlow100)) ${highStart}%`);
        stops.push(`hsl(var(--hm-highlow100)) 100%`);
      } else {
        stops.push(`hsl(var(--hm-highlow100)) ${highStart}%`);
        stops.push(`hsl(var(--hm-highlow100)) 100%`);
      }
    } else if (stops.length > 0) {
      // Extend the last color to 100%
      const lastColor = stops[stops.length - 1].split(" ")[0];
      stops.push(`${lastColor} 100%`);
    }

    if (stops.length === 0) {
      return "linear-gradient(to right, hsl(var(--hm-highlow100)), hsl(var(--hm-optimal100)), hsl(var(--hm-highlow100)))";
    }

    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const heightClass = barHeight === "sm" ? "h-3" : "h-4";
  const dotSize = barHeight === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <TooltipProvider>
      <div>
        <div className="relative">
          {/* Background bar with dynamic gradient */}
          <div
            className={`${heightClass} rounded-full`}
            style={{ background: getGradientStyle() }}
          />

          {/* Value indicator with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`absolute top-1/2 ${dotSize} rounded-full bg-foreground border-2 border-background shadow-lg cursor-pointer transition-transform hover:scale-110`}
                style={{
                  left: `${position}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {formatNumberAuto(value, locale)} {unit}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tick marks and labels */}
        {showLabels && (
          <div className="relative h-5 mt-1">
            {filteredTicks.map((tick, index) => (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${tick.position}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-px h-1.5 bg-muted-foreground/40" />
                <span className="text-xs text-muted-foreground mt-0.5">
                  {formatNumberAuto(tick.value, locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
