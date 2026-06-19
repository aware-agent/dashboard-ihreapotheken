import { useMemo, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subMonths, subYears } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useLocale } from "@/hooks/useLocale";
import { Skeleton } from "@/components/ui/skeleton";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import bookAppointmentBg from "@/assets/book-appointment-bg.jpg";
import { formatNumber, formatNumberCompact } from "@/lib/dateUtils";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import type { BioAge } from "@/types/bioAge";

type TimeRange = "3M" | "6M" | "1Y" | "ALL";

interface BioAgeProgressChartProps {
  data: BioAge[] | null;
  isLoading?: boolean;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  dateFormatted: string;
  bioAge: number;
  chronologicalAge: number;
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
  // Validate timestamp before creating Date object
  if (!timestamp || !isFinite(timestamp) || timestamp <= 0) {
    return "";
  }

  const date = new Date(timestamp);

  // Check if the Date object is valid
  if (isNaN(date.getTime())) {
    return "";
  }

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
      return [];
  }

  for (let i = monthsBack; i >= 0; i--) {
    const date = subMonths(now, i);
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    ticks.push(firstOfMonth.getTime());
  }

  return ticks;
}

export function BioAgeProgressChart({
  data,
  isLoading,
  className,
}: BioAgeProgressChartProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const { locale, t } = useLocale();
  const dateLocale = locale === "DE" ? de : enUS;
  const isMobile = useIsMobile();

  const allChartData = useMemo(() => {
    if (!data) return [];

    return data.map((point) => ({
      date: point.dateOfBloodDraw,
      timestamp: new Date(point.dateOfBloodDraw).getTime(),
      dateFormatted: new Date(point.dateOfBloodDraw).toLocaleDateString(locale),
      bioAge: point.bioAge,
      chronologicalAge: point.ageAtBloodDraw,
    }));
  }, [data, locale, dateLocale]);

  const chartData = useMemo(() => {
    const cutoff = getTimeRangeCutoff(timeRange);
    if (!cutoff) return allChartData;

    const cutoffTime = cutoff.getTime();
    return allChartData.filter((d) => d.timestamp >= cutoffTime);
  }, [allChartData, timeRange]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].bioAge;
    const last = chartData[chartData.length - 1].bioAge;
    const change = last - first;

    if (Math.abs(change) < 0.5)
      return { direction: "stable" as const, value: "0" };

    return {
      direction: change < 0 ? ("improving" as const) : ("declining" as const),
      value: formatNumberCompact(Math.abs(change), locale),
    };
  }, [chartData, locale]);

  const latestChronologicalAge = data?.[data.length - 1]?.yearsOld;

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 50];

    const allAges = chartData.flatMap((d) => [d.bioAge, d.chronologicalAge]);
    const minAge = Math.min(...allAges);
    const maxAge = Math.max(...allAges);
    const padding = (maxAge - minAge) * 0.2 || 5;

    // Round to nice integer values
    return [
      Math.floor(Math.max(0, minAge - padding)),
      Math.ceil(maxAge + padding),
    ];
  }, [chartData]);

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

  const segmentsArray = useMemo(() => {
    const allAges = chartData
      .flatMap((d) => d.chronologicalAge)
      .sort((a, b) => a - b);

    const toRet: { x: number; y: number }[] = [];
    let lastX = 0;
    for (const age of allAges) {
      toRet.push({ x: xDomain[lastX], y: age });
      lastX += 1;
    }
    return toRet;
  }, [xDomain, chartData]);

  const monthTicks = useMemo(() => getMonthTicks(timeRange), [timeRange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (allChartData.length < 2) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="title-sm">
            {t("bioAge.bioAgeOverTime")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <h3 className="title-md text-foreground mb-2">
              {t("dashboard.notEnoughData")}
            </h3>
            <p className="body-sm text-muted-foreground mb-6 max-w-[280px]">
              {t("bioAge.bookAnotherTestBioAge")}
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

  const timeRanges: TimeRange[] = ["3M", "6M", "1Y", "ALL"];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="title-sm">
              {t("bioAge.bioAgeOverTime")}
            </CardTitle>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.direction === "improving" ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-hm-optimal200" />
                    <span className="caption-md text-hm-optimal200">
                      -{trend.value} {t("bioAge.yrs")}
                    </span>
                  </>
                ) : trend.direction === "declining" ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-hm-moderaterisk200" />
                    <span className="caption-md text-hm-moderaterisk200">
                      +{trend.value} {t("bioAge.yrs")}
                    </span>
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <span className="caption-md text-muted-foreground">
                      {t("dashboard.stable")}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
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
      <CardContent className="pt-0 pb-4 px-2 sm:px-6">
        {chartData.length < 2 ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            {t("dashboard.noDataForPeriod")}
          </div>
        ) : (
          <div className="h-[320px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{
                  top: 20,
                  right: isMobile ? 16 : 90,
                  left: isMobile ? 0 : 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  horizontal={false}
                  vertical
                  strokeDasharray="0"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                {/* Chronological age reference line */}
                {latestChronologicalAge && (
                  <ReferenceLine
                    segment={segmentsArray}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={
                      isMobile
                        ? undefined
                        : {
                            value: `${t("bioAge.chronological")}: ${formatNumberCompact(latestChronologicalAge, locale)}`,
                            position: "right",
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 10,
                          }
                    }
                  />
                )}

                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={xDomain}
                  ticks={monthTicks.length > 0 ? monthTicks : undefined}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  dy={10}
                  tickFormatter={(value) =>
                    formatTickByRange(value, timeRange, dateLocale)
                  }
                />
                <YAxis
                  domain={yDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={isMobile ? 28 : 35}
                  tickFormatter={(value) => Math.round(value).toString()}
                />

                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="rounded-lg bg-background border border-border shadow-lg px-3 py-2">
                        <p className="caption-sm text-muted-foreground mb-1">
                          {point.dateFormatted}
                        </p>
                        <p className="body-md font-bold text-foreground">
                          {t("bioAge.bioAgeLabel")}:{" "}
                          {formatNumber(point.bioAge, locale, 1)}
                        </p>
                        <p className="caption-sm text-muted-foreground">
                          {t("bioAge.chronological")}:{" "}
                          {formatNumber(point.chronologicalAge, locale, 0)}
                        </p>
                      </div>
                    );
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="bioAge"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    const isLast = index === chartData.length - 1;
                    const isYounger = payload.bioAge < payload.chronologicalAge;
                    const color = isYounger
                      ? "hsl(var(--hm-optimal200))"
                      : "hsl(var(--hm-moderaterisk200))";

                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={isLast ? 6 : 4}
                        fill={color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{
                    r: 6,
                    fill: "hsl(var(--foreground))",
                    stroke: "white",
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
