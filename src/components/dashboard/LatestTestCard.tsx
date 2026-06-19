import { CircularProgressRing } from "@/components/shared/CircularProgressRing";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/hooks/useLocale";
import { formatDayMonth } from "@/lib/dateUtils";
import { ArrowUpRight } from "lucide-react";

interface LatestTestCardProps {
  latestResultId: string;
  totalMarkers: number;
  inRange: number;
  outOfRange: number;
  lastTestDate: string;
}

export function LatestTestCard({ totalMarkers, inRange, outOfRange, lastTestDate, latestResultId }: LatestTestCardProps) {
  const { t, locale } = useLocale();
  const segments = [
    { value: inRange, color: "#D32F2F" },
    { value: outOfRange, color: "#ef4444" },
  ];
  const formattedDate = formatDayMonth(lastTestDate, locale);
  const score = Math.round((inRange / Math.max(inRange + outOfRange, 1)) * 100);

  return (
    <div className="relative rounded-3xl overflow-hidden group" style={{ minHeight: '280px' }}>
      {/* Photo */}
      <div className="absolute inset-0">
        <img src="/hero-barbell.jpg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: '280px' }}>
        {/* Top label */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            {t("dashboard.latestTest")}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{formattedDate}</span>
        </div>

        {/* Hero number */}
        <div>
          <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '80px', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.04em', color: 'white' }}>
            {score}<span style={{ fontSize: '36px', opacity: 0.5 }}>%</span>
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
            {inRange} von {totalMarkers} Biomarkern im Bereich
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <CircularProgressRing
            segments={segments}
            total={inRange + outOfRange}
            size={64}
            strokeWidth={6}
            centerContent={<span style={{ fontSize: '10px', fontWeight: 600, color: 'white' }}>{inRange}/{inRange+outOfRange}</span>}
          />
          <Link to="/results/$id" params={{ id: latestResultId }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors backdrop-blur-sm cursor-pointer">
              Ergebnisse <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
