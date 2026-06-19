import { useMemo, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { format, subMonths, subYears } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "@/hooks/useLocale";
import { useResults } from "@/hooks/useResults";
import { Skeleton } from "@/components/ui/skeleton";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import bookAppointmentBg from "@/assets/book-appointment-bg.jpg";
import { formatNumberAuto } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  HighTagIcon,
  InRangeTagIcon,
  LowTagIcon,
  OptimalTagIcon,
} from "@/components/icons/StatusTagIcons";
import type { BiomarkerDetailStatus } from "@/types/biomarkerDetail";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

type TimeRange = "3M" | "6M" | "1Y" | "ALL";

interface UnifiedBiomarkerChartProps {
  biomarkerCode: string;
  biomarkerName: string;
  unit: string;
  value?: number;
  valueText?: string;
  status: BiomarkerDetailStatus;
  range: [number | null, number | null];
  optimalRange?: [number | null, number | null];
  description?: string | null;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  dateFormatted: string;
  value: number;
  inRange: boolean;
}

function getTimeRangeCutoff(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "3M":
      return subMonths(now, 3);
    case "6M":
      return subMonths(now, 6);
    case "1Y":
      return subYears(now, 1);
    case "ALL":
      return null;
  }
}

function formatTickByRange(
  timestamp: number,
  range: TimeRange,
  dateLocale: typeof de | typeof enUS,
): string {
  const date = new Date(timestamp);
  if (range === "ALL") {
    return format(date, "MMM ''yy", { locale: dateLocale });
  }
  return format(date, "MMM", { locale: dateLocale });
}

function getStatusConfig(
  status: BiomarkerDetailStatus,
  t: (key: string) => string,
) {
  const badgeBase =
    "h-6 px-2 gap-1 text-xs font-bold border-0 rounded-full inline-flex items-center";

  switch (status) {
    case "OPTIMAL":
      return {
        label: t("biomarkerDetail.optimal"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-optimal-bg))] text-[hsl(var(--status-optimal-text))]`,
        tagIcon: <OptimalTagIcon />,
      };
    case "NORMAL":
      return {
        label: t("biomarkerDetail.normal"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-inrange-bg))] text-[hsl(var(--status-inrange-text))]`,
        tagIcon: <InRangeTagIcon />,
      };
    case "HIGH":
      return {
        label: t("biomarkerDetail.high"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-high-bg))] text-[hsl(var(--status-high-text))]`,
        tagIcon: <HighTagIcon />,
      };
    case "LOW":
      return {
        label: t("biomarkerDetail.low"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-low-bg))] text-[hsl(var(--status-low-text))]`,
        tagIcon: <LowTagIcon />,
      };
    default:
      return {
        label: t("biomarkerDetail.noData"),
        badgeClass: `${badgeBase} bg-muted text-muted-foreground`,
        tagIcon: null,
      };
  }
}

export function UnifiedBiomarkerChart({
  biomarkerCode,
  biomarkerName,
  unit,
  value,
  valueText,
  status,
  range,
  optimalRange,
  description,
  className,
}: UnifiedBiomarkerChartProps) {
  const { data: resultsData, isLoading } = useResults();
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const { locale, t } = useLocale();
  const dateLocale = locale === "DE" ? de : enUS;
  const statusConfig = getStatusConfig(status, t);
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  const allChartData = useMemo(() => {
    if (!resultsData?.results) return [];

    const dataPoints: ChartDataPoint[] = [];
    const sortedResults = [...resultsData.results].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const result of sortedResults) {
      const biomarker = result.biomarkers.find((b) => b.code === biomarkerCode);
      if (biomarker) {
        const [min, max] = range;
        const inRange =
          min !== null && max !== null
            ? biomarker.value >= min && biomarker.value <= max
            : min !== null
              ? biomarker.value >= min
              : max !== null
                ? biomarker.value <= max
                : true;

        const timestamp = new Date(result.date).getTime();

        dataPoints.push({
          date: result.date,
          timestamp,
          dateFormatted: format(
            new Date(result.date),
            locale === "DE" ? "d. MMM yyyy" : "MMM d, yyyy",
            { locale: dateLocale },
          ),
          value: biomarker.value,
          inRange,
        });
      }
    }

    return dataPoints;
  }, [resultsData, biomarkerCode, range, locale, dateLocale]);

  const chartData = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange);
    if (!cutoff) return allChartData;
    const cutoffTime = cutoff.getTime();
    return allChartData.filter((d) => d.timestamp >= cutoffTime);
  }, [allChartData, timeRange]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const values = chartData.map((d) => d.value);
    const [rangeMin, rangeMax] = range;
    const effectiveMin = rangeMin ?? optimalRange?.[0];
    const effectiveMax = rangeMax ?? optimalRange?.[1];

    let displayMin = 0;
    let displayMax = 100;

    if (
      effectiveMin !== null &&
      effectiveMax !== null &&
      effectiveMax !== undefined &&
      effectiveMin !== undefined
    ) {
      const rangeSize = effectiveMax - effectiveMin;
      const padding = rangeSize * 0.3;
      displayMin = effectiveMin - padding;
      displayMax = effectiveMax + padding;
    } else if (effectiveMax !== null && effectiveMax !== undefined) {
      displayMin = 0;
      displayMax = effectiveMax * 1.5;
    } else if (effectiveMin !== null && effectiveMin !== undefined) {
      displayMin = 0;
      displayMax = effectiveMin * 2;
    }

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    if (dataMin < displayMin) displayMin = dataMin * 0.8;
    if (dataMax > displayMax) displayMax = dataMax * 1.2;
    displayMin = Math.max(0, displayMin);

    return [displayMin, displayMax];
  }, [chartData, range, optimalRange]);

  const xDomain = useMemo(() => {
    const now = new Date();

    if (timeRange === "ALL") {
      if (chartData.length === 0) return [Date.now() - 86400000, Date.now()];
      const timestamps = chartData.map((d) => d.timestamp);
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const padding = (maxTime - minTime) * 0.05 || 86400000;
      return [minTime - padding, maxTime + padding];
    }

    const cutoff = getTimeRangeCutoff(timeRange);
    const startTime = cutoff ? cutoff.getTime() : now.getTime() - 86400000;
    const endTime = now.getTime();
    return [startTime, endTime + (endTime - startTime) * 0.02];
  }, [chartData, timeRange]);

  const [rangeMin, rangeMax] = range;
  const [optMin, optMax] = optimalRange || [null, null];
  const timeRanges: TimeRange[] = ["3M", "6M", "1Y", "ALL"];

  // Format range text for the vertical bar
  const formatRangeLabel = () => {
    if (rangeMax !== null && rangeMin !== null) {
      return `${formatNumberAuto(rangeMin, locale)} - ${formatNumberAuto(rangeMax, locale)}`;
    }
    if (rangeMax !== null) {
      return `< ${formatNumberAuto(rangeMax, locale)}`;
    }
    if (rangeMin !== null) {
      return `> ${formatNumberAuto(rangeMin, locale)}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={cn("border-0 rounded-2xl", className)}>
        <CardContent className="p-6">
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasEnoughData = true; //allChartData.length >= 2;

  return (
    <Card
      className={cn("border-0 rounded-2xl bg-white overflow-hidden", className)}
    >
      <CardContent className="p-6">
        {/* Header with status badge and time range selector */}
        <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
          <div className="flex flex-col items-start gap-3">
            <Badge className={cn(statusConfig.badgeClass, "w-auto")}>
              {statusConfig.tagIcon}
              {statusConfig.label}
            </Badge>
            {hasEnoughData && (
              <h3 className="title-sm text-foreground">
                {t("biomarkerDetail.progressOverTime")}
              </h3>
            )}
          </div>

          {hasEnoughData && (
            <div className="inline-flex items-center rounded-[12px] border border-border p-1">
              {timeRanges.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTimeRange(tr)}
                  className={`inline-flex h-6 items-center justify-center whitespace-nowrap rounded-[8px] px-2.5 text-xs font-medium transition-colors ${
                    timeRange === tr
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main content: Info + Chart - stacked on mobile, side by side on desktop */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left side: Biomarker info */}
          <div className="flex-shrink-0 md:w-[200px] lg:w-[240px]">
            {/* Value display */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "caption-md font-medium",
                  status === "OPTIMAL" && "text-hm-optimal200",
                  status === "NORMAL" && "text-hm-normal200",
                  (status === "HIGH" || status === "LOW") &&
                    "text-hm-highlow200",
                )}
              >
                {statusConfig.label}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="body-md font-semibold text-foreground">
                {valueText ||
                  (value !== undefined ? formatNumberAuto(value, locale) : "-")}
              </span>
              <span className="caption-sm text-muted-foreground">{unit}</span>
            </div>

            {/* Description */}
            {description && (
              <p className="body-sm text-muted-foreground leading-relaxed mb-4">
                {description}
              </p>
            )}

            {/* Lab Reference Range */}
            {formatRangeLabel() && (
              <div className="caption-sm text-muted-foreground">
                <span className="font-medium">
                  {t("biomarkerDetail.labReferenceRange")}
                </span>{" "}
                <span>
                  {formatRangeLabel()} {unit}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Vertical range bar + Chart */}
          <div className="flex-1 flex gap-3 min-w-0">
            {/* Chart */}
            <div className="flex-1 min-w-0">
              {hasEnoughData ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                    >
                      {/* Zone shading - green band shows the actual in-range Y values */}
                      {(() => {
                        const yMin = yDomain[0];
                        const yMax = yDomain[1];
                        const hasRangeData =
                          rangeMin !== null || rangeMax !== null;
                        const hasOptimalData =
                          optMin !== null || optMax !== null;

                        const clamp = (v: number, min: number, max: number) =>
                          Math.max(min, Math.min(max, v));
                        const area = (
                          key: string,
                          y1: number,
                          y2: number,
                          fill: string,
                          fillOpacity: number,
                        ) => {
                          const a = clamp(y1, yMin, yMax);
                          const b = clamp(y2, yMin, yMax);
                          // Skip if area would be zero-height
                          if (Math.abs(a - b) < 0.001) return null;
                          const low = Math.min(a, b);
                          const high = Math.max(a, b);
                          return (
                            <ReferenceArea
                              key={key}
                              y1={low}
                              y2={high}
                              fill={fill}
                              fillOpacity={fillOpacity}
                            />
                          );
                        };

                        const zones: React.ReactNode[] = [];

                        // Case 1: Only optimal range data (no lab reference range)
                        if (!hasRangeData && hasOptimalData) {
                          if (optMin !== null && optMax === null) {
                            zones.push(
                              area(
                                "optimal",
                                optMin,
                                yMax,
                                "hsl(var(--hm-optimal100))",
                                0.35,
                              ),
                            );
                          } else if (optMin === null && optMax !== null) {
                            zones.push(
                              area(
                                "optimal",
                                yMin,
                                optMax,
                                "hsl(var(--hm-optimal100))",
                                0.35,
                              ),
                            );
                          } else if (optMin !== null && optMax !== null) {
                            zones.push(
                              area(
                                "optimal",
                                optMin,
                                optMax,
                                "hsl(var(--hm-optimal100))",
                                0.45,
                              ),
                            );
                          }
                          return zones.filter(Boolean);
                        }

                        // Case 2: Has lab reference range - show green band at the ACTUAL range values
                        if (hasRangeData) {
                          // Use the actual reference range values (not yMin/yMax)
                          const effectiveRangeMin = rangeMin ?? yMin;
                          const effectiveRangeMax = rangeMax ?? yMax;

                          if (hasOptimalData) {
                            const optStart = optMin ?? effectiveRangeMin;
                            const optEnd = optMax ?? effectiveRangeMax;
                            zones.push(
                              area(
                                "normal-low",
                                effectiveRangeMin,
                                optStart,
                                "hsl(var(--hm-normal100))",
                                0.2,
                              ),
                            );
                            zones.push(
                              area(
                                "optimal",
                                optStart,
                                optEnd,
                                "hsl(var(--hm-optimal100))",
                                0.45,
                              ),
                            );
                            zones.push(
                              area(
                                "normal-high",
                                optEnd,
                                effectiveRangeMax,
                                "hsl(var(--hm-normal100))",
                                0.2,
                              ),
                            );
                          } else {
                            zones.push(
                              area(
                                "range",
                                effectiveRangeMin,
                                effectiveRangeMax,
                                "hsl(var(--hm-optimal100))",
                                0.35,
                              ),
                            );
                          }
                          return zones.filter(Boolean);
                        }

                        return null;
                      })()}

                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        scale="time"
                        domain={xDomain}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                        dy={5}
                        tickFormatter={(value) =>
                          formatTickByRange(value, timeRange, dateLocale)
                        }
                      />
                      <YAxis domain={yDomain} hide />

                      {/* Boundary reference lines */}
                      {rangeMin !== null && rangeMin > yDomain[0] && (
                        <ReferenceLine
                          y={rangeMin}
                          stroke="hsl(var(--hm-normal200))"
                          strokeDasharray="4 4"
                          strokeOpacity={0.4}
                        />
                      )}
                      {rangeMax !== null && rangeMax < yDomain[1] && (
                        <ReferenceLine
                          y={rangeMax}
                          stroke="hsl(var(--hm-normal200))"
                          strokeDasharray="4 4"
                          strokeOpacity={0.4}
                        />
                      )}

                      <RechartsTooltip
                        cursor={{
                          stroke: "hsl(var(--border))",
                          strokeWidth: 1,
                          strokeDasharray: "4 4",
                        }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          fontSize: "12px",
                          padding: "8px 12px",
                        }}
                        labelFormatter={(value) =>
                          format(
                            new Date(value as number),
                            locale === "DE" ? "d. MMM yyyy" : "MMM d, yyyy",
                            { locale: dateLocale },
                          )
                        }
                        formatter={(val: number) => [
                          <span key="value" className="font-semibold">
                            {formatNumberAuto(val, locale)} {unit}
                          </span>,
                          "",
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={
                          status === "HIGH" || status === "LOW"
                            ? "hsl(var(--hm-highlow200))"
                            : "hsl(var(--hm-optimal200))"
                        }
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={(props: any) => {
                          const { cx, cy, payload, index } = props;
                          if (!cx || !cy) return null;
                          const isLast = index === chartData.length - 1;
                          const isInRange = payload.inRange;

                          // Use status-based colors for the latest value
                          const isCurrentOutOfRange =
                            status === "HIGH" || status === "LOW";

                          if (isLast) {
                            const outerFill = isCurrentOutOfRange
                              ? "hsl(var(--hm-highlow100))"
                              : "hsl(var(--hm-optimal100))";
                            const innerFill = isCurrentOutOfRange
                              ? "hsl(var(--hm-highlow200))"
                              : "hsl(var(--hm-optimal200))";
                            return (
                              <g key={`dot-${index}`}>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={8}
                                  fill="hsl(var(--hm-optimal100))"
                                />
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={5}
                                  fill="hsl(var(--hm-optimal200))"
                                />
                                {/* Value label */}
                                <text
                                  x={cx}
                                  y={cy - 16}
                                  textAnchor="middle"
                                  fill={innerFill}
                                  fontSize={13}
                                  fontWeight={600}
                                >
                                  {formatNumberAuto(payload.value, locale)}
                                </text>
                              </g>
                            );
                          }

                          return (
                            <circle
                              key={`dot-${index}`}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={
                                isInRange
                                  ? "hsl(var(--hm-optimal200))"
                                  : "hsl(var(--hm-highlow200))"
                              }
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: "hsl(var(--foreground))" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Empty state when not enough data */
                <div className="h-[180px] flex flex-col items-center justify-center text-center">
                  <h3 className="body-md text-foreground mb-1">
                    {t("dashboard.notEnoughData")}
                  </h3>
                  <p className="caption-sm text-muted-foreground mb-4">
                    {t("dashboard.bookAnotherTest")}
                  </p>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: `url(${bookAppointmentBg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <a
                      href={userShopUrl.toString()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg font-medium px-3 py-1.5 m-2 text-sm bg-foreground text-background hover:bg-foreground/90 transition-all"
                    >
                      <span>{t("common.bookTest")}</span>
                      <img
                        src={ArrowRightIcon}
                        alt=""
                        className="h-3.5 w-3.5"
                      />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
