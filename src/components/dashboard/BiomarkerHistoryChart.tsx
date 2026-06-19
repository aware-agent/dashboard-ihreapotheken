import { useMemo, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subMonths, subYears } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "@/hooks/useLocale";
import { useResults } from "@/hooks/useResults";
import { Skeleton } from "@/components/ui/skeleton";
import { EXTERNAL_URLS } from "@/config/urls";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import bookAppointmentBg from "@/assets/book-appointment-bg.jpg";
import { formatNumberAuto, formatNumberCompact } from "@/lib/dateUtils";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

type TimeRange = "3M" | "6M" | "1Y" | "ALL";

interface BiomarkerHistoryChartProps {
  biomarkerCode: string;
  biomarkerName: string;
  unit: string;
  range: [number | null, number | null];
  optimalRange?: [number | null, number | null];
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

function getMonthTicks(range: TimeRange): number[] {
  const now = new Date();
  const ticks: number[] = [];

  let monthsBack: number;
  switch (range) {
    case "3M":
      monthsBack = 3;
      break;
    case "6M":
      monthsBack = 6;
      break;
    case "1Y":
      monthsBack = 12;
      break;
    case "ALL":
      return []; // Let recharts auto-calculate for ALL
  }

  for (let i = monthsBack; i >= 0; i--) {
    const date = subMonths(now, i);
    // Use first day of each month for tick position
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    ticks.push(firstOfMonth.getTime());
  }

  return ticks;
}

export function BiomarkerHistoryChart({
  biomarkerCode,
  biomarkerName,
  unit,
  range,
  optimalRange,
  className,
}: BiomarkerHistoryChartProps) {
  const { data: resultsData, isLoading } = useResults();
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const { locale, t } = useLocale();
  const dateLocale = locale === "DE" ? de : enUS;
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  const allChartData = useMemo(() => {
    if (!resultsData?.results) return [];

    const dataPoints: ChartDataPoint[] = [];

    // Sort results by date (oldest first for timeline)
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

  // Filter data based on selected time range
  const chartData = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange);
    if (!cutoff) return allChartData;

    const cutoffTime = cutoff.getTime();
    return allChartData.filter((d) => d.timestamp >= cutoffTime);
  }, [allChartData, timeRange]);

  // Calculate trend based on filtered data
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].value;
    const last = chartData[chartData.length - 1].value;
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 3)
      return { direction: "stable" as const, value: "0" };

    const absChange = Math.abs(change);
    let formattedValue: string;
    if (absChange >= 10000) {
      formattedValue = `${(absChange / 1000).toFixed(0)}K`;
    } else if (absChange >= 1000) {
      formattedValue = `${(absChange / 1000).toFixed(1)}K`;
    } else if (absChange >= 100) {
      formattedValue = absChange.toFixed(0);
    } else {
      formattedValue = absChange.toFixed(1);
    }

    return {
      direction: change > 0 ? ("up" as const) : ("down" as const),
      value: formattedValue,
    };
  }, [chartData]);

  // Calculate Y-axis domain matching BiomarkerRangeBar logic
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const values = chartData.map((d) => d.value);
    const [rangeMin, rangeMax] = range;

    // Use effective min/max (range or optimal fallback)
    const effectiveMin = rangeMin ?? optimalRange?.[0];
    const effectiveMax = rangeMax ?? optimalRange?.[1];

    // Calculate display range with padding (matching BiomarkerRangeBar logic)
    let displayMin = 0;
    let displayMax = 100;

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

    // Ensure all data values are within display range
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    if (dataMin < displayMin) displayMin = dataMin * 0.8;
    if (dataMax > displayMax) displayMax = dataMax * 1.2;

    // Ensure minimum is not negative
    displayMin = Math.max(0, displayMin);

    return [displayMin, displayMax];
  }, [chartData, range, optimalRange]);

  // Calculate X-axis domain for time-based scaling (full period, not just data range)
  const xDomain = useMemo(() => {
    const now = new Date();

    if (timeRange === "ALL") {
      // For ALL, use actual data range
      if (chartData.length === 0) return [Date.now() - 86400000, Date.now()];
      const timestamps = chartData.map((d) => d.timestamp);
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const padding = (maxTime - minTime) * 0.05 || 86400000;
      return [minTime - padding, maxTime + padding];
    }

    // For specific ranges, use full calendar period
    const cutoff = getTimeRangeCutoff(timeRange);
    const startTime = cutoff ? cutoff.getTime() : now.getTime() - 86400000;
    const endTime = now.getTime();

    // Add small padding at the end
    return [startTime, endTime + (endTime - startTime) * 0.02];
  }, [chartData, timeRange]);

  // Get month ticks for the selected range
  const monthTicks = useMemo(() => getMonthTicks(timeRange), [timeRange]);

  // Get today's date and period start for reference lines
  const todayTimestamp = useMemo(() => new Date().getTime(), []);
  const periodStartTimestamp = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange);
    return cutoff ? cutoff.getTime() : null;
  }, [timeRange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (allChartData.length < 2) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="title-sm">
            {t("dashboard.progressOverTime")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <h3 className="title-md text-foreground mb-2">
              {t("dashboard.notEnoughData")}
            </h3>
            <p className="body-sm text-muted-foreground mb-6 max-w-[280px]">
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
                className="inline-flex items-center gap-2 rounded-lg font-medium px-4 py-2 m-4 text-base bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90 transition-all"
              >
                <span>{t("common.bookTest")}</span>
                <img src={ArrowRightIcon} alt="" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [rangeMin, rangeMax] = range;
  const [optMin, optMax] = optimalRange || [null, null];
  const timeRanges: TimeRange[] = ["3M", "6M", "1Y", "ALL"];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="title-sm">
            {t("dashboard.progressOverTime")}
          </CardTitle>
          <div className="inline-flex items-center rounded-[12px] border border-border p-1">
            {timeRanges.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTimeRange(tr)}
                className={`inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[8px] px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  timeRange === tr
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {chartData.length < 2 ? (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
            {t("dashboard.noDataForPeriod")}
          </div>
        ) : (
          <>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 30, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    vertical
                    strokeDasharray="0"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />

                  {/* Zone rendering matching BiomarkerRangeBar logic (supports one-sided ranges) */}
                  {(() => {
                    const yMin = yDomain[0];
                    const yMax = yDomain[1];

                    const hasRangeData = rangeMin !== null || rangeMax !== null;
                    const hasOptimalData = optMin !== null || optMax !== null;

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
                      if (a === b) return null;
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

                    // Case 1: No range data, only optimal (mirrors BiomarkerRangeBar case 1)
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

                    // Case 2: Has range data (mirrors BiomarkerRangeBar case 2)
                    if (hasRangeData) {
                      const rangeStart = rangeMin ?? yMin;
                      const rangeEnd = rangeMax ?? yMax;

                      // NOTE: Out-of-range area should remain white (no yellow shading)

                      if (hasOptimalData) {
                        const optStart = optMin ?? rangeStart;
                        const optEnd = optMax ?? rangeEnd;

                        // In-range - lighter green
                        zones.push(
                          area(
                            "normal-low",
                            rangeStart,
                            optStart,
                            "hsl(var(--hm-normal100))",
                            0.2,
                          ),
                        );
                        // Optimal - more saturated green
                        zones.push(
                          area(
                            "optimal",
                            optStart,
                            optEnd,
                            "hsl(var(--hm-optimal100))",
                            0.45,
                          ),
                        );
                        // In-range - lighter green
                        zones.push(
                          area(
                            "normal-high",
                            optEnd,
                            rangeEnd,
                            "hsl(var(--hm-normal100))",
                            0.2,
                          ),
                        );
                      } else {
                        // No optimal range - entire range is green (matching BiomarkerRangeBar)
                        zones.push(
                          area(
                            "range",
                            rangeStart,
                            rangeEnd,
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
                    ticks={monthTicks.length > 0 ? monthTicks : undefined}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    dy={10}
                    tickFormatter={(value) =>
                      formatTickByRange(value, timeRange, dateLocale)
                    }
                  />
                  <YAxis
                    domain={yDomain}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    width={10}
                  />

                  {/* Boundary reference lines for normal range (no labels) */}
                  {rangeMin !== null && rangeMin > yDomain[0] && (
                    <ReferenceLine
                      y={rangeMin}
                      stroke="hsl(var(--hm-normal200))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                    />
                  )}

                  {rangeMax !== null && rangeMax < yDomain[1] && (
                    <ReferenceLine
                      y={rangeMax}
                      stroke="hsl(var(--hm-normal200))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                    />
                  )}

                  {/* Vertical reference line for today */}
                  {timeRange !== "ALL" && (
                    <ReferenceLine
                      x={todayTimestamp}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{
                        value: "Today",
                        position: "top",
                        fill: "hsl(var(--primary))",
                        fontSize: 10,
                        offset: 5,
                      }}
                    />
                  )}

                  {/* Vertical reference line for period start */}
                  {timeRange !== "ALL" && periodStartTimestamp && (
                    <ReferenceLine
                      x={periodStartTimestamp}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  )}

                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as ChartDataPoint;
                      const hasOptimalData = optMin !== null || optMax !== null;
                      const isOptimal =
                        hasOptimalData &&
                        (optMin !== null && optMax !== null
                          ? data.value >= optMin && data.value <= optMax
                          : optMin !== null
                            ? data.value >= optMin
                            : optMax !== null
                              ? data.value <= optMax
                              : false);

                      // Match BiomarkerRangeBar color logic
                      let statusColor: string;
                      let statusLabel: string;

                      if (!data.inRange) {
                        statusColor = "text-hm-highlow200";
                        statusLabel = t("common.outOfRange");
                      } else if (hasOptimalData) {
                        statusColor = isOptimal
                          ? "text-hm-optimal200"
                          : "text-hm-normal200";
                        statusLabel = isOptimal
                          ? t("biomarkerDetail.optimal")
                          : t("common.inRange");
                      } else {
                        // No optimal range - use green for in-range
                        statusColor = "text-hm-optimal200";
                        statusLabel = t("common.inRange");
                      }

                      return (
                        <div className="bg-card border border-border rounded-xl shadow-md px-4 py-3 min-w-[120px]">
                          <p className="text-xs text-muted-foreground mb-1">
                            {data.dateFormatted}
                          </p>
                          <p className={`text-lg font-bold ${statusColor}`}>
                            {formatNumberAuto(data.value, locale)} {unit}
                          </p>
                          <p className={`text-xs mt-0.5 ${statusColor}`}>
                            {statusLabel}
                          </p>
                        </div>
                      );
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={3}
                    dot={({ cx, cy, payload, index }) => {
                      if (typeof cx !== "number" || typeof cy !== "number")
                        return null;

                      const isInRange = payload.inRange;
                      const hasOptimalData = optMin !== null || optMax !== null;
                      const isOptimal =
                        hasOptimalData &&
                        (optMin !== null && optMax !== null
                          ? payload.value >= optMin && payload.value <= optMax
                          : optMin !== null
                            ? payload.value >= optMin
                            : optMax !== null
                              ? payload.value <= optMax
                              : false);

                      const isLast = index === chartData.length - 1;

                      // Determine colors based on status
                      // Out of range (high/low) = yellow/orange
                      // In range but not optimal = normal color
                      // Optimal = green
                      let strokeColor = "hsl(var(--hm-optimal200))";
                      let fillColor = "hsl(var(--hm-optimal200))";

                      if (!isInRange) {
                        // Out of range - use yellow/orange
                        strokeColor = "hsl(var(--hm-highlow200))";
                        fillColor = "hsl(var(--hm-highlow200))";
                      } else if (hasOptimalData && !isOptimal) {
                        // In range but not optimal
                        strokeColor = "hsl(var(--hm-normal200))";
                        fillColor = "hsl(var(--hm-normal200))";
                      }

                      if (isLast) {
                        return (
                          <g>
                            <line
                              x1={cx}
                              y1={cy}
                              x2={cx}
                              y2={1000}
                              stroke="hsl(var(--foreground))"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                            />
                            <circle
                              cx={cx}
                              cy={cy}
                              r={10}
                              fill="hsl(var(--card))"
                              stroke={strokeColor}
                              strokeWidth={3}
                            />
                            <circle cx={cx} cy={cy} r={5} fill={fillColor} />
                          </g>
                        );
                      }

                      // Non-last points that are out of range or not optimal: ring style
                      if (!isInRange || (hasOptimalData && !isOptimal)) {
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill="hsl(var(--card))"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                          />
                        );
                      }

                      // Optimal: solid green dot
                      return <circle cx={cx} cy={cy} r={4} fill={fillColor} />;
                    }}
                    activeDot={false}
                  >
                    {/* Only show value label for the last point */}
                    <LabelList
                      dataKey="value"
                      content={({ x, y, value, index }) => {
                        if (index !== chartData.length - 1) return null;
                        if (
                          typeof x !== "number" ||
                          typeof y !== "number" ||
                          value === undefined
                        )
                          return null;

                        const numValue = Number(value);
                        const formattedValue = Number.isInteger(numValue)
                          ? numValue.toString()
                          : numValue < 10
                            ? numValue.toFixed(2)
                            : numValue < 100
                              ? numValue.toFixed(1)
                              : Math.round(numValue).toString();

                        const boxWidth = 44;
                        const boxHeight = 28;

                        return (
                          <g>
                            <rect
                              x={x - boxWidth / 2}
                              y={y - 42}
                              width={boxWidth}
                              height={boxHeight}
                              rx={10}
                              fill="hsl(var(--card))"
                              stroke="hsl(var(--border))"
                              strokeWidth={1}
                            />
                            <text
                              x={x}
                              y={y - 23}
                              textAnchor="middle"
                              className="text-sm fill-foreground font-semibold"
                            >
                              {formattedValue}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
