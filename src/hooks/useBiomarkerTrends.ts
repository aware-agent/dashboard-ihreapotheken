import { useMemo } from 'react';
import type { MarkerTrend } from '@/types/biomarkers';
import type { BiomarkerResult, Result } from '@/types/results';
import { useResults } from './useResults';

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface BiomarkerTrendData {
  code: string;
  name: string;
  unit: string;
  currentValue: number;
  currentStatus: BiomarkerResult['biomarkerStatus'];
  rangeTernary: BiomarkerResult['rangeTernary'];
  range: [number | null, number | null];
  optimalRange: [number | null, number | null];
  dataPoints: TrendDataPoint[];
  percentageChange: number | null;
  trendDirection: 'up' | 'down' | 'stable' | null;
}

// Extract trend data from multiple results for a specific biomarker
function extractTrendForBiomarker(
  results: Result[],
  biomarkerCode: string
): TrendDataPoint[] {
  const dataPoints: TrendDataPoint[] = [];

  // Sort results by date (oldest first for chart display)
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const result of sortedResults) {
    const biomarker = result.biomarkers.find((b) => b.code === biomarkerCode);
    if (biomarker) {
      dataPoints.push({
        date: result.date,
        value: biomarker.value,
      });
    }
  }

  return dataPoints;
}

// Calculate percentage change between first and last data points
function calculatePercentageChange(dataPoints: TrendDataPoint[]): number | null {
  if (dataPoints.length < 2) return null;

  const firstValue = dataPoints[0].value;
  const lastValue = dataPoints[dataPoints.length - 1].value;

  if (firstValue === 0) return null;

  return ((lastValue - firstValue) / firstValue) * 100;
}

// Determine trend direction
function getTrendDirection(
  dataPoints: TrendDataPoint[]
): 'up' | 'down' | 'stable' | null {
  if (dataPoints.length < 2) return null;

  const percentChange = calculatePercentageChange(dataPoints);
  if (percentChange === null) return null;

  if (Math.abs(percentChange) < 3) return 'stable';
  return percentChange > 0 ? 'up' : 'down';
}

// Hook to get trend data for all biomarkers from the latest result
export function useBiomarkerTrends() {
  const { data: resultsData, isLoading, error } = useResults();

  const trends = useMemo(() => {
    if (!resultsData?.results || resultsData.results.length === 0) {
      return [];
    }

    const latestResult = resultsData.results[0];
    const allResults = resultsData.results;

    const biomarkerTrends: BiomarkerTrendData[] = latestResult.biomarkers.map(
      (biomarker) => {
        const dataPoints = extractTrendForBiomarker(allResults, biomarker.code);
        const percentageChange = calculatePercentageChange(dataPoints);
        const trendDirection = getTrendDirection(dataPoints);

        return {
          code: biomarker.code,
          name: biomarker.name,
          unit: biomarker.unit,
          currentValue: biomarker.value,
          currentStatus: biomarker.biomarkerStatus,
          rangeTernary: biomarker.rangeTernary,
          range: biomarker.range,
          optimalRange: biomarker.optimalRange,
          dataPoints,
          percentageChange,
          trendDirection,
        };
      }
    );

    return biomarkerTrends;
  }, [resultsData]);

  // Get key biomarkers (out of range or significant changes)
  const keyBiomarkers = useMemo(() => {
    return trends
      .filter(
        (t) =>
          t.rangeTernary !== 0 || // Out of range
          (t.percentageChange !== null && Math.abs(t.percentageChange) > 10) // Significant change
      )
      .slice(0, 6); // Max 6 key biomarkers
  }, [trends]);

  // Convert to MarkerTrend format for TrendChart compatibility
  const chartTrends: MarkerTrend[] = useMemo(() => {
    return trends
      .filter((t) => t.dataPoints.length >= 2) // Only show trends with history
      .map((t) => ({
        markerId: t.code,
        markerName: t.name,
        unit: t.unit,
        data: t.dataPoints,
        referenceRange: {
          min: t.range[0] ?? 0,
          max: t.range[1] ?? 100,
          optimalMin: t.optimalRange[0] ?? undefined,
          optimalMax: t.optimalRange[1] ?? undefined,
        },
      }));
  }, [trends]);

  return {
    trends,
    keyBiomarkers,
    chartTrends,
    isLoading,
    error,
  };
}
