import { CircularProgressRing } from "@/components/shared/CircularProgressRing";
import { Link } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthZoneSummary {
  id: string;
  name: string;
  icon?: string | null;
  inRange: number;
  outOfRange: number;
  totalMarkers?: number; // Total known biomarkers in this zone
}

interface HealthZonesCardProps {
  healthZones: HealthZoneSummary[];
}

const healthZoneColors: Record<string, string> = {
  Blood: "#FFEFEF",
  Heart: "#F9EFFC",
  Hormones: "#EFF2FE",
  Immunity: "#E8F5FC",
  Kidneys: "#FFF1F6",
  Liver: "#E4F6F8",
  Metabolism: "#F4F0FD",
  Minerals: "#EBF9F6",
  Vitamins: "#FDEEFF",
};

const healthZoneGradients: Record<string, string> = {
  Blood:      'linear-gradient(135deg, #c0392b, #8e1010)',
  Heart:      'linear-gradient(135deg, #8e44ad, #5b1a7a)',
  Hormones:   'linear-gradient(135deg, #2980b9, #1a5276)',
  Immunity:   'linear-gradient(135deg, #27ae60, #1e6b3f)',
  Kidneys:    'linear-gradient(135deg, #d35400, #922b21)',
  Liver:      'linear-gradient(135deg, #16a085, #0e5f52)',
  Metabolism: 'linear-gradient(135deg, #7f8c8d, #4a5568)',
  Minerals:   'linear-gradient(135deg, #D32F2F, #3d7018)',
  Vitamins:   'linear-gradient(135deg, #e67e22, #a04000)',
};

export function HealthZonesCard({ healthZones }: HealthZonesCardProps) {
  if (!healthZones || healthZones.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Mobile: Compact 3-column grid with vertical cards */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {healthZones.map((zone) => {
          const testedCount = zone.inRange + zone.outOfRange;
          const totalMarkers = zone.totalMarkers ?? testedCount;
          const zoneSegments =
            testedCount > 0
              ? [
                  { value: zone.inRange, color: "#D32F2F" },
                  { value: zone.outOfRange, color: "#F87171" },
                ]
              : [];

          return (
            <Link
              key={zone.id}
              to={`/health-zones/${zone.id}`}
              className="block"
            >
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card hover:bg-muted/50 transition-colors text-center">
                <div className="w-14 h-14">
                  <CircularProgressRing
                    segments={zoneSegments}
                    total={Math.max(testedCount, 1)}
                    size={56}
                    strokeWidth={4}
                    centerContent={
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor:
                            healthZoneColors[zone.name] || "hsl(var(--muted))",
                        }}
                      >
                        {zone.icon ? (
                          <img
                            src={zone.icon}
                            alt={zone.name}
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <div className="w-5 h-5" />
                        )}
                      </div>
                    }
                  />
                </div>
                <p className="text-[11px] font-medium text-foreground leading-tight whitespace-normal break-words">
                  {zone.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {testedCount}/{totalMarkers} Tested
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: Gradient cards grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-3">
        {healthZones.map(zone => {
          const bg = healthZoneGradients[zone.name] || 'from-gray-400 to-gray-600';
          const testedCount = zone.inRange + zone.outOfRange;
          return (
            <Link key={zone.id} to={`/health-zones/${zone.id}`}>
              <div className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ height: '160px', background: bg }}>
                {/* no separate gradient div needed */}
                <div />
                {/* Content */}
                <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    {zone.icon && <img src={zone.icon} alt={zone.name} className="w-7 h-7 object-contain brightness-0 invert opacity-80" />}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">{zone.name}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white" style={{ fontFamily: 'Palanquin' }}>
                      {zone.inRange}<span className="text-sm text-white/60">/{testedCount}</span>
                    </div>
                    <div className="text-xs text-white/60 mt-0.5">in Range</div>
                  </div>
                </div>
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
