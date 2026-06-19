import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { StatCard } from './StatCard';

interface BiomarkerSummaryCardsProps {
  totalBiomarkers: number;
  inRange: number;
  outOfRange: number;
  className?: string;
}

export function BiomarkerSummaryCards({
  totalBiomarkers,
  inRange,
  outOfRange,
  className,
}: BiomarkerSummaryCardsProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Activity}
          label="Total Tested"
          value={totalBiomarkers}
        />
        <StatCard
          icon={CheckCircle}
          label="In Range"
          value={inRange}
          iconBgClass="bg-hm-optimal50"
          iconTextClass="text-hm-optimal200"
          valueClass="text-hm-optimal200"
        />
        <StatCard
          icon={AlertTriangle}
          label="Out of Range"
          value={outOfRange}
          iconBgClass="bg-hm-highlow50"
          iconTextClass="text-hm-highlow200"
          valueClass="text-hm-highlow200"
        />
      </div>
    </div>
  );
}
