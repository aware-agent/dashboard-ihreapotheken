import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { CircularProgressRing } from "./CircularProgressRing";
import { useLocale } from "@/hooks/useLocale";

const healthZoneGradients: Record<string, string> = {};
// All zones: same dark base, color signals score (set dynamically)
const ZONE_DARK = 'linear-gradient(160deg, #1a1a1a 0%, #111111 100%)';

interface HealthZoneCardProps {
  id: string;
  name: string;
  icon?: string | null;
  inRange: number;
  outOfRange: number;
  totalMarkers?: number;
  variant?: "default" | "compact";
  className?: string;
}

export function HealthZoneCard({ id, name, icon, inRange, outOfRange, totalMarkers: totalMarkersProp, variant = "default", className }: HealthZoneCardProps) {
  const testedMarkers = inRange + outOfRange;
  const totalMarkers = totalMarkersProp ?? testedMarkers;
  const { t } = useLocale();
  const scoreAccent = score >= 80 ? '#D32F2F' : score >= 60 ? '#d4a017' : '#e05a4b';
  const segments = testedMarkers > 0
    ? [{ value: inRange, color: scoreAccent }, { value: outOfRange, color: "rgba(255,255,255,0.15)" }]
    : [];
  const gradient = ZONE_DARK;
  const score = testedMarkers > 0 ? Math.round((inRange / testedMarkers) * 100) : 0;

  if (variant === "compact") {
    return (
      <Link to={`/health-zones/${id}`}>
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-colors", className)}
          style={{ background: gradient }}>
          {icon && <img src={icon} alt={name} className="w-4 h-4 object-contain brightness-0 invert opacity-80" />}
          <span className="text-xs font-medium text-white truncate">{name}</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs font-semibold text-white">{inRange}</span>
            <span className="text-[10px] text-white/50">/ {testedMarkers}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/health-zones/${id}`} className="block group">
      <div
        className={cn("relative rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl", className)}
        style={{ height: '180px', background: gradient }}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />

        <div className="relative z-10 p-5 h-full flex flex-col justify-between">
          {/* Top: icon + name */}
          <div className="flex items-start justify-between">
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              {name}
            </span>
            {icon && (
              <img src={icon} alt={name} className="w-6 h-6 object-contain brightness-0 invert opacity-60" />
            )}
          </div>

          {/* Bottom: score + ring */}
          <div className="flex items-end justify-between">
            <div>
              <div style={{ fontFamily: 'Palanquin, sans-serif', fontSize: '42px', fontWeight: 300, lineHeight: 1, color: 'white', letterSpacing: '-0.02em' }}>
                {testedMarkers > 0 ? score : '—'}<span style={{ fontSize: '18px', opacity: 0.5 }}>%</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                {inRange}/{totalMarkers} {t("common.tested")}
              </div>
            </div>
            <CircularProgressRing
              segments={segments}
              total={Math.max(testedMarkers, 1)}
              size={48}
              strokeWidth={5}
              centerContent={null}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
