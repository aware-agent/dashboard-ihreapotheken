import { CircularProgressRing } from "@/components/shared/CircularProgressRing";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/hooks/useLocale";
import { getPackageName } from "@/utils/packageName";
import { Package } from "@/types/results";
import { ArrowRight } from "lucide-react";

interface HealthZoneSummary {
  id: string;
  name: string;
  icon?: string | null;
  inRange: number;
  outOfRange: number;
  totalMarkers?: number;
}

interface HealthStatsCardProps {
  bookedPackageCodes: string[];
  totalMarkers: number;
  inRange: number;
  outOfRange: number;
  lastTestDate: string;
  resultId?: string;
  optimalCount?: number;
  normalCount?: number;
  healthZones?: HealthZoneSummary[];
  packages: Package[];
}

export function HealthStatsCard({
  bookedPackageCodes,
  packages,
  resultId,
  totalMarkers,
  inRange,
  outOfRange,
  lastTestDate,
  optimalCount,
  normalCount,
  healthZones,
}: HealthStatsCardProps) {
  const { t } = useLocale();
  const segments = [
    { value: inRange, color: "#D32F2F" },
    { value: outOfRange, color: "#F87171" },
  ];
  const formattedDate = format(new Date(lastTestDate), "d. MMM yyyy");
  const score = Math.round((inRange / (inRange + outOfRange)) * 100);

  return (
    <div className="relative rounded-2xl overflow-hidden w-full" style={{ minHeight: '280px' }}>
      {/* Photo background */}
      <div className="absolute inset-0">
        <img src="/photo-fitness.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 photo-overlay" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(101,179,46,0.4) 0%, rgba(0,0,0,0.5) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col justify-between" style={{ minHeight: '280px' }}>
        {/* Top: Label + Date */}
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">
            {t("dashboard.latestTest")}
          </span>
          <span className="text-xs text-white/60">{formattedDate}</span>
        </div>

        {/* Middle: Big number */}
        <div className="flex items-end gap-6">
          <div>
            <div className="font-['Lora'] text-[72px] font-normal leading-none text-white" style={{ letterSpacing: '-0.03em' }}>
              {score}<span className="text-3xl text-white/60">%</span>
            </div>
            <div className="text-sm text-white/70 mt-1">{inRange} von {totalMarkers} {t("dashboard.inRange")}</div>
          </div>
          <div className="mb-3">
            <CircularProgressRing
              segments={segments}
              total={inRange + outOfRange}
              size={72}
              strokeWidth={7}
              centerContent={
                <span className="text-[11px] font-medium text-white">{inRange}/{inRange + outOfRange}</span>
              }
            />
          </div>
        </div>

        {/* Bottom: Packages + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {bookedPackageCodes.slice(0, 2).map(code => (
              <span key={code} className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white backdrop-blur-sm">
                {getPackageName(code, packages)}
              </span>
            ))}
          </div>
          {resultId && (
            <Link to={`/results/${resultId}`}>
              <span className="flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors">
                Details <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
