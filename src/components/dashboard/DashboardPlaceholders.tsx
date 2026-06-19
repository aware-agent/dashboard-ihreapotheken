import { env } from "@/config/urls";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Heart,
  Lightbulb,
  Upload,
  History,
  TestTube,
  Watch,
  MessageSquare,
  Hourglass,
} from "lucide-react";
import { CircularProgressRing } from "@/components/shared/CircularProgressRing";
import { ChevronArrowIcon } from "@/components/icons/ChevronArrowIcon";
import { useLocale } from "@/hooks/useLocale";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { cn } from "@/lib/utils";

// Placeholder Health Stats Card (greyed out version)
export function HealthStatsCardPlaceholder() {
  const { t } = useLocale();
  const segments = [
    { value: 70, color: "hsl(var(--muted))" },
    { value: 30, color: "hsl(var(--muted))" },
  ];

  return (
    <Card className="border border-dashed border-border/60 bg-muted/5 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1">
        {/* Ring Graph - greyed out */}
        <div className="opacity-25">
          <CircularProgressRing
            segments={segments}
            total={100}
            size={100}
            strokeWidth={10}
            centerContent={
              <div className="text-center">
                <span className="text-2xl font-semibold text-muted-foreground">
                  --
                </span>
                <span className="text-xs text-muted-foreground block">
                  {t("placeholders.score")}
                </span>
              </div>
            }
          />
        </div>

        {/* Stats - greyed out */}
        <div className="mt-4 space-y-2 w-full opacity-30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("placeholders.total")}
              </span>
            </div>
            <span className="font-medium text-muted-foreground">--</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("placeholders.inRange")}
              </span>
            </div>
            <span className="font-medium text-muted-foreground">--</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("placeholders.outOfRange")}
              </span>
            </div>
            <span className="font-medium text-muted-foreground">--</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder Bio Age Widget
export function BioAgeWidgetPlaceholder() {
  const { t } = useLocale();
  return (
    <Card className="border border-dashed border-border/60 bg-muted/5 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1">
        <div className="w-16 h-16 rounded-full bg-muted/20 border-2 border-dashed border-muted/40 flex items-center justify-center mb-3 opacity-40">
          <Hourglass className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="caption-md text-muted-foreground mb-0.5">
          {t("placeholders.bioAge")}
        </h3>
        <p className="body-xs text-muted-foreground/60 text-center">
          {t("placeholders.discoverBioAge")}
        </p>
      </CardContent>
    </Card>
  );
}

// Placeholder Companion Widget
export function CompanionWidgetPlaceholder() {
  const { t } = useLocale();
  return (
    <Card className="border border-dashed border-border/60 bg-muted/5 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1">
        <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-3 opacity-40">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="caption-md text-muted-foreground mb-0.5">
          {t("placeholders.aiCompanion")}
        </h3>
        <p className="body-xs text-muted-foreground/60 text-center">
          {t("placeholders.getInsights")}
        </p>
      </CardContent>
    </Card>
  );
}

// Placeholder Wearables Widget
export function WearablesWidgetPlaceholder() {
  if (!env.VITE_WEARABLES_ENABLED) return null;
  const { t } = useLocale();
  return (
    <Card className="border border-dashed border-border/60 bg-muted/5 h-full flex flex-col">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1">
        <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-3 opacity-40">
          <Watch className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="caption-md text-muted-foreground mb-0.5">
          {t("placeholders.wearables")}
        </h3>
        <p className="body-xs text-muted-foreground/60 text-center">
          {t("placeholders.connectDevices")}
        </p>
      </CardContent>
    </Card>
  );
}

// Placeholder Health Zone Card
export function HealthZoneCardPlaceholder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Card
      className={cn(
        "border border-dashed border-border/60 bg-muted/5",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3 opacity-30">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="caption-md text-muted-foreground">{name}</p>
            <p className="body-xs text-muted-foreground/60">
              {t("placeholders.noData")}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full" />
      </CardContent>
    </Card>
  );
}

// Placeholder Health Zones Section
export function HealthZonesPlaceholder() {
  const { t } = useLocale();
  const placeholderZones = ["Heart", "Liver", "Kidney", "Thyroid", "Immune"];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-muted-foreground/50" />
        <h2 className="title-md text-muted-foreground">
          {t("placeholders.healthZones")}
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {placeholderZones.map((zone) => (
          <HealthZoneCardPlaceholder key={zone} name={zone} />
        ))}
      </div>
    </section>
  );
}

// Placeholder Insights Section
export function InsightsPlaceholder() {
  const { t } = useLocale();
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-muted-foreground/50" />
        <h2 className="title-md text-muted-foreground">
          {t("placeholders.personalizedInsights")}
        </h2>
      </div>
      <Card className="border border-dashed border-border/60 bg-muted/5">
        <CardContent className="p-6">
          <div className="space-y-3 opacity-25">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/20">
                <div className="h-4 w-4 rounded-full bg-muted/50 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-muted/50 rounded" />
                  <div className="h-2.5 w-full bg-muted/30 rounded" />
                </div>
              </div>
            ))}
          </div>
          <p className="body-sm text-muted-foreground/60 text-center mt-6">
            {t("placeholders.getPersonalizedInsights")}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

// Placeholder Wearable Data Section
export function WearableDataPlaceholder() {
  if (!env.VITE_WEARABLES_ENABLED) return null;
  const { t } = useLocale();
  const placeholderMetrics = [
    { name: "Resting HR", value: "--", unit: "bpm" },
    { name: "Steps Today", value: "--", unit: "steps" },
    { name: "Active Calories", value: "--", unit: "kcal" },
    { name: "Sleep Score", value: "--", unit: "%" },
    { name: "HRV", value: "--", unit: "ms" },
    { name: "Hydration", value: "--", unit: "L" },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Watch className="h-5 w-5 text-muted-foreground/50" />
          <h2 className="title-md text-muted-foreground">
            {t("placeholders.wearableData")}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground/40">
          {t("placeholders.manageDevices")} →
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {placeholderMetrics.map((metric, i) => (
          <Card
            key={i}
            className="border border-dashed border-border/60 bg-muted/5"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 opacity-30">
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="caption-sm text-muted-foreground truncate">
                  {metric.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1 opacity-30">
                <span className="text-xl font-semibold text-muted-foreground">
                  {metric.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {metric.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="body-sm text-muted-foreground/60 text-center mt-4">
        {t("placeholders.connectWearablesToSee")}
      </p>
    </section>
  );
}

// Quick Actions (works without data) - The main CTA section
export function QuickActionsCard() {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="title-sm">
          {t("placeholders.getStarted")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <a
          href={userShopUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-primary/15">
            <TestTube className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <span className="caption-md text-foreground block">
              {t("placeholders.bookATest")}
            </span>
            <span className="body-xs text-muted-foreground">
              {t("placeholders.getBloodTested")}
            </span>
          </div>
          <ChevronArrowIcon
            size={20}
            className="text-muted-foreground group-hover:text-primary transition-colors"
          />
        </a>
        <Link
          to="/uploads"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-muted">
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="caption-md text-foreground block">
              {t("placeholders.uploadResults")}
            </span>
            <span className="body-xs text-muted-foreground">
              {t("placeholders.addExistingTest")}
            </span>
          </div>
          <ChevronArrowIcon
            size={20}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
        </Link>
        <Link
          to="/history"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-muted">
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="caption-md text-foreground block">
              {t("placeholders.viewHistory")}
            </span>
            <span className="body-xs text-muted-foreground">
              {t("placeholders.seeAllPastResults")}
            </span>
          </div>
          <ChevronArrowIcon
            size={20}
            className="text-muted-foreground group-hover:text-foreground transition-colors"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
