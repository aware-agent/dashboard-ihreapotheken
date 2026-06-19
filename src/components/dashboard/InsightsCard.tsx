import { BiomarkerResult } from "@/types/results";
import { Link } from "@tanstack/react-router";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { useLocale } from "@/hooks/useLocale";
import { ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

interface InsightsCardProps {
  markers: BiomarkerResult[];
}

interface Insight {
  type: "attention" | "improving" | "tip";
  title: string;
  description: string;
  status?: string;
  href?: string;
  externalHref?: string;
  metric?: { value: string; unit: string; trend?: "up" | "down" | "stable" };
}

const insightThemes = {
  attention: {
    borderColor: '#c0392b',
    iconColor: '#c0392b',
    bgTint: '#fdf5f5',
    icon: AlertTriangle,
    label: 'ACHTUNG',
    labelColor: '#c0392b',
  },
  improving: {
    borderColor: '#4a8c28',
    iconColor: '#4a8c28',
    bgTint: '#f0fae8',
    icon: CheckCircle2,
    label: 'GUT',
    labelColor: '#4a8c28',
  },
  tip: {
    borderColor: '#8A8580',
    iconColor: '#8A8580',
    bgTint: '#F7F5F2',
    icon: Calendar,
    label: 'TIPP',
    labelColor: '#8A8580',
  },
};

export function InsightsCard({ markers }: InsightsCardProps) {
  const insights = generateInsights(markers);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      {insights.map((insight, index) => {
        const theme = insightThemes[insight.type];
        const Icon = theme.icon;

        const card = (
          <div
            key={index}
            className="relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-white border border-[#E8E5E1] h-full"
            style={{ borderLeftWidth: '3px', borderLeftColor: theme.borderColor, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <div className="p-5 flex flex-col h-full" style={{ minHeight: '200px', backgroundColor: theme.bgTint + '30' }}>
              {/* Top: label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color: theme.iconColor }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: theme.labelColor }}>
                    {theme.label}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#C0BDB8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Metric — or spacer to keep alignment */}
              <div style={{ minHeight: '60px' }}>
                {insight.metric ? (
                  <div>
                    <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '36px', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.02em', color: '#1A1A1A' }}>
                      {insight.metric.value}
                      <span style={{ fontSize: '14px', color: '#8A8580', marginLeft: '4px' }}>{insight.metric.unit}</span>
                    </div>
                    {insight.metric.trend && insight.metric.trend !== 'stable' && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" style={{ color: theme.iconColor, transform: insight.metric.trend === 'down' ? 'scaleY(-1)' : 'none' }} />
                        <span style={{ fontSize: '11px', color: theme.iconColor, fontWeight: 600 }}>
                          {insight.metric.trend === 'up' ? 'erhöht' : 'erniedrigt'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Text */}
              <div className="pt-1">
                <h3 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '15px', fontWeight: 400, color: '#1A1A1A', lineHeight: 1.45, marginBottom: '6px' }}>
                  {insight.title}
                </h3>
                <p className="line-clamp-3" style={{ fontSize: '12px', lineHeight: 1.5, color: '#8A8580' }}>
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        );

        if (insight.externalHref) {
          return <a key={index} href={insight.externalHref} target="_blank" rel="noopener noreferrer">{card}</a>;
        }
        if (insight.href) {
          return <Link key={index} to={insight.href}>{card}</Link>;
        }
        return card;
      })}
    </div>
  );
}

function generateInsights(markers: BiomarkerResult[]): Insight[] {
  const { t } = useLocale();
  const { url: userShopUrl } = useUserShopUrl();
  const insights: Insight[] = [];

  const highMarkers = markers.filter((m) => m.biomarkerStatus === "HIGH");
  const lowMarkers = markers.filter((m) => m.biomarkerStatus === "LOW");

  if (highMarkers.length > 0) {
    const marker = highMarkers[0];
    insights.push({
      type: "attention",
      title: t("insights.changesOverTime").replace("{name}", marker.name),
      description: t("insights.changesOverTimeDescription")
        .replace("{name}", marker.name)
        .replace("{value}", marker.valueText)
        .replace("{unit}", marker.unit),
      status: "HIGH",
      href: "/actions",
      metric: { value: marker.valueText, unit: marker.unit, trend: "up" },
    });
  }

  if (lowMarkers.length > 0) {
    const marker = lowMarkers[0];
    insights.push({
      type: "attention",
      title: t("insights.needsAttention").replace("{name}", marker.name),
      description: t("insights.needsAttentionDescription").replace("{name}", marker.name),
      status: "LOW",
      href: "/actions",
      metric: { value: marker.valueText, unit: marker.unit, trend: "down" },
    });
  }

  const optimalCount = markers.filter(
    (m) => m.biomarkerStatus === "OPTIMAL" || m.biomarkerStatus === "NORMAL" || m.biomarkerStatus === "NO_RANGE"
  ).length;

  if (optimalCount > markers.length * 0.7) {
    insights.push({
      type: "improving",
      title: t("insights.greatProgressOverall"),
      description: t("insights.greatProgressOverallDescription")
        .replace("{count}", optimalCount.toString())
        .replace("{total}", markers.length.toString()),
      href: "/actions",
      metric: { value: `${Math.round((optimalCount / markers.length) * 100)}`, unit: "%", trend: "stable" },
    });
  }

  insights.push({
    type: "tip",
    title: t("insights.trackYourProgress"),
    description: t("insights.regularTestingHelpsIdentifyTrendsEarly"),
    externalHref: userShopUrl.toString(),
  });

  return insights.slice(0, 3);
}
