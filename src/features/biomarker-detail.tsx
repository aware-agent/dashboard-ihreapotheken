import { Info, Utensils } from "lucide-react";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import awareCompanionIcon from "@/assets/aware-companion-button-icon.png";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import { DefinitionCard } from "@/components/DefinitionCard";
import { UnifiedBiomarkerChart } from "@/components/dashboard/UnifiedBiomarkerChart";
import { RelatedWearableData } from "@/components/wearables";
import { ErrorState } from "@/components/ErrorState";
import {
  HighTagIcon,
  InRangeTagIcon,
  LowTagIcon,
  NoDataTagIcon,
  OptimalTagIcon,
} from "@/components/icons/StatusTagIcons";
import { PageLayout } from "@/components/PageLayout";
import { ArticleCard } from "@/components/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { env } from "@/config/urls";
import {
  useBiomarkerDetail,
  useKnownBiomarkerDetail,
} from "@/hooks/useBiomarkerDetail";
import { useHealthZones } from "@/hooks/useHealthZones";
import { useLocale } from "@/hooks/useLocale";
import type { BiomarkerDetailStatus } from "@/types/biomarkerDetail";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

export default function BiomarkerDetail() {
  const { id, code } = useParams({ strict: false }) as {
    id?: string;
    code?: string;
  };
  const location = useLocation();
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  // Determine if we're on the known biomarker route
  const isKnownRoute = location.pathname.includes("/biomarkers/known/");

  // Use appropriate hook based on route
  const testedQuery = useBiomarkerDetail(isKnownRoute ? undefined : id);
  const knownQuery = useKnownBiomarkerDetail(isKnownRoute ? code : undefined);

  // Get the active query result
  const {
    data: biomarker,
    isLoading,
    error,
    refetch,
  } = isKnownRoute ? knownQuery : testedQuery;

  console.log(biomarker);

  // Fetch health zones to get zone names
  const { data: healthZonesData } = useHealthZones();

  // Get health zones with names and IDs
  const healthZones =
    (biomarker?.healthZoneIds
      ?.map((zoneId) => {
        const zone = healthZonesData?.healthZones?.find((z) => z.id === zoneId);
        return zone ? { id: zoneId, name: zone.name } : null;
      })
      .filter(Boolean) as { id: string; name: string }[]) || [];

  if (error || (!isLoading && !biomarker)) {
    return (
      <PageLayout title={t("biomarkerDetail.title")}>
        <ErrorState
          title={t("biomarkerDetail.failedToLoad")}
          message={t("biomarkerDetail.couldNotLoad")}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  const isNotTested = biomarker?.biomarkerStatus === "NOT_TESTED";
  const statusConfig = biomarker
    ? getStatusConfig(biomarker.biomarkerStatus, t)
    : null;

  // Find the "What's/What is/What are [biomarker]?" health fact and filter it from the list
  const whatIsFact = biomarker?.healthFacts?.find((fact) => {
    const title = fact.title?.toLowerCase() || "";
    return (
      title.startsWith("what's") ||
      title.startsWith("what is") ||
      title.startsWith("what are")
    );
  });
  const filteredHealthFacts =
    biomarker?.healthFacts?.filter((fact) => fact !== whatIsFact) || [];

  // Aware AI Button component for header
  const AwareAIButton =
    biomarker && !isNotTested ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={`/companion?prompt=${encodeURIComponent(
                `Explain my ${biomarker.name} result in simple language. Use my age and sex to add context for typical ranges where relevant. Explain what it measures, how my value compares to the reference range, and what it's commonly associated with. Mention related markers that help interpret it. End with my top 3 takeaways.`,
              )}&contextType=biomarker&contextName=${encodeURIComponent(
                biomarker.name,
              )}${
                biomarker.id ? `&contextId=${biomarker.id}` : ""
              }&contextData=${encodeURIComponent(JSON.stringify(biomarker))}`}
            >
              <div className="flex items-center gap-2 bg-black hover:bg-black/90 transition-colors rounded-xl pl-1 pr-3 py-1">
                <img
                  src={awareCompanionIcon}
                  alt=""
                  className="w-8 h-8 rounded-lg"
                />
                <span className="text-white font-medium text-sm">
                  {t("biomarkerDetail.askCompanion")}
                </span>
                <img src={ArrowRightIcon} alt="" className="w-4 h-4" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p>
              {t("biomarkerDetail.getPersonalizedInsights").replace(
                "{name}",
                biomarker.name,
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;

  return (
    <PageLayout
      title={biomarker?.name || ""}
      subtitle={
        healthZones.length > 0 ? (
          <span className="flex flex-wrap items-center gap-2">
            {healthZones.map((zone) => (
              <Link
                key={zone.id}
                to={`/health-zones/${zone.id}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:underline transition-colors caption-md"
              >
                {zone.name}
              </Link>
            ))}
          </span>
        ) : (
          biomarker?.code
        )
      }
      isLoading={isLoading}
      loadingSkeleton={<BiomarkerDetailSkeleton />}
      // headerActions={AwareAIButton}
    >
      {biomarker && statusConfig && (
        <>
          {/* Book a Test Banner - Only show when biomarker has no results */}
          {isNotTested && (
            <div className="bg-[hsl(210_100%_96%)] border border-[#006FFD0D] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-foreground">
                  {t("biomarkerDetail.getYourTested").replace(
                    "{name}",
                    biomarker.name,
                  )}
                </p>
                <p className="text-[14px] font-semibold text-muted-foreground">
                  {t("biomarkerDetail.bookTestToSee")}
                </p>
              </div>
              <a
                href={userShopUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg font-medium px-4 py-1 text-base bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90 transition-all shrink-0"
              >
                <span>{t("common.bookTest")}</span>
                <img src={ArrowRightIcon} alt="" className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Definition Card - "What is [biomarker]?" - shown first for all */}
          {whatIsFact && (
            <DefinitionCard
              title={whatIsFact.title}
              description={whatIsFact.description}
              image={whatIsFact.image}
              imageAlt={biomarker.name}
            />
          )}

          {/* Not Tested Card - matches design mockup */}
          {isNotTested && (
            <Card className="border border-border/40">
              <CardContent className="p-6 text-center">
                {/* No data yet badge */}
                <span className="inline-block caption-sm text-muted-foreground bg-muted px-3 py-1 rounded-full mb-4">
                  {t("biomarkerDetail.noDataYet")}
                </span>

                {/* Biomarker name */}
                <h2 className="title-lg text-foreground mb-3">
                  {biomarker.name}
                </h2>

                {/* Dash for value */}
                <p className="text-3xl font-bold text-foreground mb-1">-</p>

                {/* Unit with info icon */}
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-6">
                  <span className="body-sm">{biomarker.unit}</span>
                  <Info className="h-3.5 w-3.5" />
                </div>

                {/* Gray line separator */}
                <div className="h-px bg-border mb-4" />

                {/* Placeholder message */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="body-sm text-foreground">
                    {t("biomarkerDetail.valuePlaceholder")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unified Biomarker Display - Combined info + chart */}
          {!isNotTested && biomarker.valueText && biomarker.code && (
            <UnifiedBiomarkerChart
              biomarkerCode={biomarker.code}
              biomarkerName={biomarker.name}
              unit={biomarker.unit}
              value={biomarker.value}
              valueText={biomarker.valueText}
              status={biomarker.biomarkerStatus}
              range={biomarker.range}
              optimalRange={biomarker.optimalRange}
              description={
                biomarker.outline?.description || biomarker.description
              }
            />
          )}
          {biomarker.healthHabit &&
            biomarker.healthHabit.healthHabitItems.length > 0 && (
              <section>
                <h2 className="title-sm text-foreground mb-4">
                  {biomarker.healthHabit.title}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {biomarker.healthHabit.healthHabitItems.map((habit) => (
                    <Card
                      key={habit.id}
                      className="border-border/50 hover:shadow-md transition-shadow h-full"
                    >
                      <CardContent className="p-4 flex flex-row gap-4 h-full">
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <h3 className="font-medium text-foreground mb-2">
                            {habit.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {habit.description}
                          </p>
                        </div>
                        {habit.image && (
                          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={habit.image}
                              alt={habit.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

          {biomarker.foodItem &&
            biomarker.foodItem.healthFoodItems.length > 0 && (
              <section>
                <h2 className="title-sm text-foreground mb-4">
                  {biomarker.foodItem.title}
                </h2>
                <Card className="border border-border/40">
                  <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 sm:gap-5">
                      {biomarker.foodItem.healthFoodItems.map((food) => (
                        <div key={food.id} className="text-center">
                          <div className="aspect-square w-16 sm:w-20 mx-auto rounded-xl bg-muted overflow-hidden mb-2">
                            {food.image ? (
                              <img
                                src={food.image}
                                alt={food.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Utensils className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="caption-sm text-foreground truncate max-w-[80px] mx-auto">
                            {food.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

          {/* Health Facts */}
          {filteredHealthFacts.length > 0 && (
            <section>
              <h2 className="title-sm text-foreground mb-4">
                {t("biomarkerDetail.healthFacts")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredHealthFacts.map((fact, index) => (
                  <Card
                    key={index.toString()}
                    className="border-0 shadow-none bg-card h-full hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-3">
                      {fact.image && (
                        <div className="relative h-32 overflow-hidden rounded-lg mb-3">
                          <img
                            src={fact.image}
                            alt={fact.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="body-md text-foreground font-medium mt-2 line-clamp-2">
                        {fact.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                        {fact.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Related Wearable Data - Two-way linking */}
          {env.VITE_WEARABLES_ENABLED && !isNotTested && biomarker.code && (
            <RelatedWearableData
              biomarkerCode={biomarker.code}
              biomarkerName={biomarker.name}
            />
          )}

          {/* Related Articles */}
          {biomarker.articles && biomarker.articles.length > 0 && (
            <section>
              <h2 className="title-sm text-foreground mb-4">
                {t("biomarkerDetail.relatedArticles")}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {biomarker.articles.slice(0, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageLayout>
  );
}

// Helper Functions
function _formatRange(
  range: [number | null, number | null],
  unit: string,
): string {
  const [min, max] = range;
  if (min === null && max === null) return "-";
  if (min === null) return `≤ ${max}${unit ? ` ${unit}` : ""}`;
  if (max === null) return `≥ ${min}${unit ? ` ${unit}` : ""}`;
  return `${min} - ${max}${unit ? ` ${unit}` : ""}`;
}

function getStatusConfig(
  status: BiomarkerDetailStatus,
  t: (key: string) => string,
) {
  // Badge base styles: h-6 (24px), px-2 (8px padding), gap-1 (4px), text-xs (12px), font-bold, no border
  const badgeBase =
    "h-6 px-2 gap-1 text-xs font-bold border-0 rounded-full inline-flex items-center";

  switch (status) {
    case "OPTIMAL":
      return {
        label: t("biomarkerDetail.optimal"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-optimal-bg))] text-[hsl(var(--status-optimal-text))]`,
        bgClass: "bg-[hsl(var(--status-optimal-bg))]",
        tagIcon: <OptimalTagIcon />,
      };
    case "NORMAL":
      return {
        label: t("biomarkerDetail.normal"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-inrange-bg))] text-[hsl(var(--status-inrange-text))]`,
        bgClass: "bg-[hsl(var(--status-inrange-bg))]",
        tagIcon: <InRangeTagIcon />,
      };
    case "HIGH":
      return {
        label: t("biomarkerDetail.high"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-attention-bg))] text-[hsl(var(--status-attention-text))]`,
        bgClass: "bg-[hsl(var(--status-attention-bg))]",
        tagIcon: <HighTagIcon />,
      };
    case "LOW":
      return {
        label: t("biomarkerDetail.low"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-attention-bg))] text-[hsl(var(--status-attention-text))]`,
        bgClass: "bg-[hsl(var(--status-attention-bg))]",
        tagIcon: <LowTagIcon />,
      };
    case "NOT_TESTED":
      return {
        label: t("biomarkerDetail.notTested"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-nodata-bg))] text-[hsl(var(--status-nodata-text))]`,
        bgClass: "bg-[hsl(var(--status-nodata-bg))]",
        tagIcon: <NoDataTagIcon />,
      };
    default:
      return {
        label: t("biomarkerDetail.notTested"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-nodata-bg))] text-[hsl(var(--status-nodata-text))]`,
        bgClass: "bg-[hsl(var(--status-nodata-bg))]",
        tagIcon: <NoDataTagIcon />,
      };
  }
}

// Skeleton
function BiomarkerDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Definition Card Skeleton */}
      <Card className="border border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-40 sm:min-w-[10rem] bg-muted/30 flex items-center justify-center p-6 sm:p-8">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
            </div>
            <div className="flex-1 p-5 sm:p-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Results Card Skeleton */}
      <Card className="border border-border/40">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-32 mx-auto mb-3" />
          <Skeleton className="h-10 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-12 mx-auto mb-6" />
          {/* Range bar skeleton */}
          <Skeleton className="h-4 w-full rounded-full mb-2" />
          <div className="flex justify-between mb-6">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
          {/* Outline skeleton */}
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
      {/* History Chart Skeleton */}
      <Card className="border border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
          <div className="flex items-center justify-center gap-6 mt-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      {/* Additional sections skeleton */}
      <Card className="border border-border/40">
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
