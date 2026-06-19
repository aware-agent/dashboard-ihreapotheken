import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Result } from '@/types/results';
import { useLocale } from '@/hooks/useLocale';
import { formatShortDate, formatMediumDate } from '@/lib/dateUtils';

interface HealthScoreTimelineProps {
  results: Result[];
  className?: string;
}

interface ChartDataPoint {
  id: string;
  date: string;
  dateFormatted: string;
  healthScore: number;
  inRange: number;
  outOfRange: number;
  totalBiomarkers: number;
}

export function HealthScoreTimeline({ results, className }: HealthScoreTimelineProps) {
  const navigate = useNavigate();
  const { locale } = useLocale();

  const chartData = useMemo(() => {
    if (!results.length) return [];

    // Sort by date ascending for the timeline
    return [...results]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((result): ChartDataPoint => {
        const totalBiomarkers = result.biomarkers.length;
        const healthScore = totalBiomarkers > 0 
          ? Math.round((result.inRange / totalBiomarkers) * 100) 
          : 0;

        return {
          id: result.id,
          date: result.date,
          dateFormatted: formatMediumDate(result.date, locale),
          healthScore,
          inRange: result.inRange,
          outOfRange: result.outOfRange,
          totalBiomarkers,
        };
      });
  }, [results, locale]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].healthScore;
    const last = chartData[chartData.length - 1].healthScore;
    const change = last - first;
    return {
      direction: change >= 0 ? 'up' : 'down',
      value: Math.abs(change),
    };
  }, [chartData]);

  const handleClick = (data: ChartDataPoint) => {
    if (data?.id) {
      navigate(`/results/${data.id}`);
    }
  };

  if (chartData.length < 2) {
    return null; // Don't show timeline with less than 2 data points
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="title-sm">
            Health Score Trend
          </CardTitle>
          {trend && (
            <div className={`flex items-center gap-1.5 caption-md font-medium px-3 py-1.5 rounded-full ${
              trend.direction === 'up' 
                ? 'bg-hm-optimal50 text-hm-optimal200' 
                : 'bg-hm-highlow50 text-hm-highlow200'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}% overall</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              onClick={(e) => e?.activePayload?.[0]?.payload && handleClick(e.activePayload[0].payload)}
            >
              <defs>
                <linearGradient id="healthScoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foundation-magnesium400))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--foundation-magnesium400))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="4 4" 
                vertical={false} 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="dateFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dx={-10}
                tickFormatter={(value) => `${value}%`}
                width={45}
                ticks={[0, 25, 50, 75, 100]}
              />
              <ReferenceLine
                y={80}
                stroke="hsl(var(--hm-optimal100))"
                strokeDasharray="6 4"
                strokeOpacity={0.7}
                label={{
                  value: 'Good',
                  position: 'right',
                  fill: 'hsl(var(--hm-optimal200))',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[180px]">
                      <p className="caption-md text-muted-foreground mb-1">{data.dateFormatted}</p>
                      <p className="title-md text-foreground">{data.healthScore}% in range</p>
                      <div className="flex items-center gap-3 mt-2 caption-sm">
                        <span className="flex items-center gap-1 text-hm-optimal200">
                          <span className="w-2 h-2 rounded-full bg-hm-optimal100" />
                          {data.inRange} optimal
                        </span>
                        <span className="flex items-center gap-1 text-hm-highlow200">
                          <span className="w-2 h-2 rounded-full bg-hm-highlow100" />
                          {data.outOfRange} out
                        </span>
                      </div>
                      <p className="caption-sm text-foundation-magnesium400 mt-3 font-medium">Click to view details →</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="healthScore"
                stroke="transparent"
                fill="url(#healthScoreGradient)"
              />
              <Line
                type="monotone"
                dataKey="healthScore"
                stroke="hsl(var(--foundation-magnesium400))"
                strokeWidth={3}
                dot={{
                  fill: 'hsl(var(--background))',
                  stroke: 'hsl(var(--foundation-magnesium400))',
                  strokeWidth: 2.5,
                  r: 5,
                }}
                activeDot={{
                  fill: 'hsl(var(--foundation-magnesium400))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 3,
                  r: 8,
                  cursor: 'pointer',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
