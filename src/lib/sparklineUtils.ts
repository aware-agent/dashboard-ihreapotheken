import { Result } from '@/types/results';

export interface SparklineDataPoint {
  value: number;
}

/**
 * Extracts the last N values for a biomarker across multiple results
 * Returns data sorted from oldest to newest (for proper sparkline display)
 */
export function getBiomarkerSparklineData(
  results: Result[],
  biomarkerCode: string,
  maxPoints: number = 5
): SparklineDataPoint[] {
  // Sort results by date (newest first to get the most recent values)
  const sortedResults = [...results].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dataPoints: SparklineDataPoint[] = [];

  for (const result of sortedResults) {
    if (dataPoints.length >= maxPoints) break;
    
    const biomarker = result.biomarkers.find((b) => b.code === biomarkerCode);
    if (biomarker) {
      dataPoints.push({ value: biomarker.value });
    }
  }

  // Reverse to show oldest to newest (left to right on chart)
  return dataPoints.reverse();
}

/**
 * Determines the sparkline color based on trend direction and biomarker status
 */
export function getSparklineColor(
  dataPoints: SparklineDataPoint[],
  currentStatus: string
): 'success' | 'warning' | 'danger' | 'default' {
  if (dataPoints.length < 2) return 'default';

  const isOutOfRange = currentStatus === 'HIGH' || currentStatus === 'LOW';
  
  if (isOutOfRange) {
    return 'warning';
  }
  
  return 'success';
}
