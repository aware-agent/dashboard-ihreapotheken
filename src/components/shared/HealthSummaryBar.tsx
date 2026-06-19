import { useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, Calendar, Heart, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BiomarkerInfo {
  name: string;
  biomarkerStatus: 'OPTIMAL' | 'NORMAL' | 'HIGH' | 'LOW' | 'NO_RANGE';
}

interface HealthSummaryBarProps {
  healthScore?: number;
  totalMarkers: number;
  inRange: number;
  outOfRange: number;
  lastTestDate?: string;
  showHealthScore?: boolean;
  className?: string;
  biomarkers?: BiomarkerInfo[];
}

export function HealthSummaryBar({
  healthScore,
  totalMarkers,
  inRange,
  outOfRange,
  lastTestDate,
  showHealthScore = true,
  className,
  biomarkers,
}: HealthSummaryBarProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const calculatedScore = healthScore ?? (totalMarkers > 0 ? Math.round((inRange / totalMarkers) * 100) : 0);
  
  const formattedDate = lastTestDate
    ? new Date(lastTestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : undefined;

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  // Get biomarkers by status for breakdown
  const optimalBiomarkers = biomarkers?.filter(b => b.biomarkerStatus === 'OPTIMAL') || [];
  const normalBiomarkers = biomarkers?.filter(b => b.biomarkerStatus === 'NORMAL') || [];
  const outOfRangeBiomarkers = biomarkers?.filter(b => b.biomarkerStatus === 'HIGH' || b.biomarkerStatus === 'LOW') || [];

  return (
    <>
      <Card className={cn("border border-border/40 overflow-hidden", className)}>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 lg:grid-cols-5">
            {/* Health Score - Primary Card - Clickable */}
            {showHealthScore && (
              <button
                onClick={() => setShowBreakdown(true)}
                className="col-span-2 lg:col-span-1 p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex flex-col justify-between text-left hover:from-primary/90 hover:to-primary/70 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium opacity-90">Health Score</span>
                  <Heart className="h-5 w-5 opacity-75 group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{calculatedScore}%</span>
                  <div className="flex items-center gap-1">
                    <p className="text-sm opacity-75 mt-0.5">{getScoreLabel(calculatedScore)}</p>
                    <Info className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            )}

            {/* Total Markers */}
            <div className={cn(
              "p-5 flex flex-col justify-between border-l border-border/40 bg-gradient-to-b from-primary/5 to-transparent gap-3",
              !showHealthScore && "border-l-0"
            )}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="body-sm text-muted-foreground">Total Markers</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{totalMarkers}</p>
            </div>

            {/* In Range */}
            <div className="p-5 flex flex-col justify-between border-l border-border/40 bg-gradient-to-b from-hm-optimal50/50 to-transparent gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-hm-optimal50">
                  <CheckCircle className="h-3.5 w-3.5 text-hm-optimal200" />
                </div>
                <p className="body-sm text-muted-foreground">In Range</p>
              </div>
              <p className="text-3xl font-bold text-hm-optimal200">{inRange}</p>
            </div>

            {/* Out of Range */}
            <div className="p-5 flex flex-col justify-between border-l border-border/40 bg-gradient-to-b from-hm-highlow50/50 to-transparent gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-hm-highlow50">
                  <AlertTriangle className="h-3.5 w-3.5 text-hm-highlow200" />
                </div>
                <p className="body-sm text-muted-foreground">Out of Range</p>
              </div>
              <p className="text-3xl font-bold text-hm-highlow200">{outOfRange}</p>
            </div>

            {/* Last Test */}
            {formattedDate && (
              <div className="p-5 flex flex-col justify-between border-l border-border/40 gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-muted">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="body-sm text-muted-foreground">Last Test</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{formattedDate}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Score Breakdown Modal */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Health Score
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Score Summary */}
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <p className="text-5xl font-bold text-primary">{calculatedScore}%</p>
              <p className="caption-md text-muted-foreground mt-1">
                {inRange} of {totalMarkers} biomarkers in range
              </p>
            </div>

            {/* Breakdown by status */}
            {biomarkers && biomarkers.length > 0 && (
              <div className="space-y-2">
                {/* Optimal */}
                {optimalBiomarkers.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-hm-optimal50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-hm-optimal200" />
                      <span className="body-sm text-foreground">Optimal</span>
                    </div>
                    <span className="body-sm text-hm-optimal200 font-medium">{optimalBiomarkers.length}</span>
                  </div>
                )}

                {/* Normal */}
                {normalBiomarkers.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-hm-normal50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-hm-normal200" />
                      <span className="body-sm text-foreground">Normal</span>
                    </div>
                    <span className="body-sm text-hm-normal200 font-medium">{normalBiomarkers.length}</span>
                  </div>
                )}

                {/* Out of Range */}
                {outOfRangeBiomarkers.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-hm-highlow50/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-hm-highlow200" />
                      <span className="body-sm text-foreground">Out of Range</span>
                    </div>
                    <span className="body-sm text-hm-highlow200 font-medium">{outOfRangeBiomarkers.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
