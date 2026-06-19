import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Dot,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkerTrend } from '@/types/biomarkers';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { formatNumberAuto } from '@/lib/dateUtils';

interface TrendChartProps {
  trends: MarkerTrend[];
}

type TimeRange = '3M' | '6M' | '1Y' | 'ALL';

// Custom dot component for data points
const CustomDot = (props: any) => {
  const { cx, cy, payload, isLast, referenceRange } = props;
  
  if (!cx || !cy) return null;
  
  const value = payload.value;
  const isInOptimal = referenceRange?.optimalMin !== undefined && 
    value >= referenceRange.optimalMin && 
    value <= (referenceRange.optimalMax || referenceRange.max);
  
  if (isLast) {
    // Last point: solid green with white border
    return (
      <g>
        {/* Dotted vertical line to x-axis */}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={props.viewBox?.height || 280}
          stroke="#1a1a1a"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* White outer circle */}
        <circle cx={cx} cy={cy} r={10} fill="white" stroke="#4ADE80" strokeWidth={3} />
        {/* Green inner circle */}
        <circle cx={cx} cy={cy} r={5} fill="#4ADE80" />
      </g>
    );
  }
  
  if (isInOptimal) {
    // In optimal: smaller green dot
    return <circle cx={cx} cy={cy} r={4} fill="#4ADE80" />;
  }
  
  // Out of optimal: orange ring
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={6} 
      fill="white" 
      stroke="#F5A623" 
      strokeWidth={2.5} 
    />
  );
};

// Custom label for last data point
const CustomLabel = (props: any) => {
  const { viewBox, value } = props;
  if (!viewBox) return null;
  
  return (
    <g>
      <rect
        x={viewBox.x + 12}
        y={viewBox.y - 14}
        width={36}
        height={28}
        rx={6}
        fill="white"
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
      />
      <text
        x={viewBox.x + 30}
        y={viewBox.y + 4}
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize={13}
        fontWeight={600}
      >
        {value}
      </text>
    </g>
  );
};

export function TrendChart({ trends }: TrendChartProps) {
  const [selectedMarker, setSelectedMarker] = useState(trends[0]?.markerId || '');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const { locale, t } = useLocale();
  const dateLocale = locale === 'DE' ? de : enUS;
  const currentTrend = trends.find(t => t.markerId === selectedMarker);

  if (!currentTrend) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('common.noTrendData')}
        </CardContent>
      </Card>
    );
  }

  const filteredData = filterDataByTimeRange(currentTrend.data, timeRange);
  
  // Calculate domain with padding
  const allValues = filteredData.map(d => d.value);
  const minValue = Math.min(...allValues, currentTrend.referenceRange.min);
  const maxValue = Math.max(...allValues, currentTrend.referenceRange.max);
  const padding = (maxValue - minValue) * 0.2;
  const yMin = minValue - padding;
  const yMax = maxValue + padding;

  const lastDataPoint = filteredData[filteredData.length - 1];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">{t('common.trendAnalysis')}</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedMarker} onValueChange={setSelectedMarker}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select marker" />
              </SelectTrigger>
              <SelectContent>
                {trends.map((trend) => (
                  <SelectItem key={trend.markerId} value={trend.markerId}>
                    {trend.markerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="inline-flex items-center rounded-[12px] border border-[#CDC9DD] p-1">
              {(['3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-[8px] px-4 py-2 text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-[#2F2F2F] text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredData} 
              margin={{ top: 20, right: 40, left: 0, bottom: 10 }}
            >
              {/* Out of range area - bottom (peach/light orange) */}
              <ReferenceArea
                y1={yMin}
                y2={currentTrend.referenceRange.min}
                fill="#FDEBD0"
                fillOpacity={0.8}
              />
              
              {/* Out of range area - top (peach/light orange) */}
              <ReferenceArea
                y1={currentTrend.referenceRange.max}
                y2={yMax}
                fill="#FDEBD0"
                fillOpacity={0.8}
              />
              
              {/* In range area (light green) */}
              <ReferenceArea
                y1={currentTrend.referenceRange.min}
                y2={currentTrend.referenceRange.max}
                fill="#BBF7D0"
                fillOpacity={0.6}
              />
              
              {/* Optimal range area (darker green) - if exists */}
              {currentTrend.referenceRange.optimalMin !== undefined && (
                <ReferenceArea
                  y1={currentTrend.referenceRange.optimalMin}
                  y2={currentTrend.referenceRange.optimalMax || currentTrend.referenceRange.max}
                  fill="#86EFAC"
                  fillOpacity={0.8}
                />
              )}
              
              {/* Dashed lines at range boundaries */}
              <ReferenceLine
                y={currentTrend.referenceRange.max}
                stroke="#86EFAC"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <ReferenceLine
                y={currentTrend.referenceRange.min}
                stroke="#86EFAC"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), 'MMM', { locale: dateLocale })}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 13 }}
                dy={10}
              />
              <YAxis 
                hide 
                domain={[yMin, yMax]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(value) => format(new Date(value as string), locale === 'DE' ? 'd. MMM yyyy' : 'MMM d, yyyy', { locale: dateLocale })}
                formatter={(value: number) => [`${formatNumberAuto(value, locale)} ${currentTrend.unit}`, currentTrend.markerName]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1a1a1a"
                strokeWidth={2.5}
                dot={(dotProps: any) => {
                  const isLast = dotProps.index === filteredData.length - 1;
                  return (
                    <CustomDot 
                      {...dotProps} 
                      isLast={isLast}
                      referenceRange={currentTrend.referenceRange}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#1a1a1a' }}
              />
              
              {/* Value label for last point */}
              {lastDataPoint && (
                <ReferenceLine
                  x={lastDataPoint.date}
                  stroke="transparent"
                  label={<CustomLabel value={lastDataPoint.value} />}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FDEBD0' }} />
            <span className="text-muted-foreground">{t('common.outOfRange')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#BBF7D0' }} />
            <span className="text-muted-foreground">{t('common.inRange')}: {formatNumberAuto(currentTrend.referenceRange.min, locale)}-{formatNumberAuto(currentTrend.referenceRange.max, locale)} {currentTrend.unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function filterDataByTimeRange(data: MarkerTrend['data'], range: TimeRange): MarkerTrend['data'] {
  if (range === 'ALL') return data;

  const now = new Date();
  const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
  const cutoff = new Date(now.setMonth(now.getMonth() - months));

  return data.filter(d => new Date(d.date) >= cutoff);
}
