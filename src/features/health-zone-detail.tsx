import { formatDayMonth } from "@/lib/dateUtils";
import { Link, useParams } from "@tanstack/react-router";
import { Activity, TestTube } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealthZones } from "@/hooks/useHealthZones";
import { useResults } from "@/hooks/useResults";
import { useLocale } from "@/hooks/useLocale";
import { HealthZone } from "@/types/healthZones";
import { BiomarkerResult } from "@/types/results";
import { PageLayout } from "@/components/PageLayout";
import { DefinitionCard } from "@/components/DefinitionCard";
import { cn } from "@/lib/utils";
import {
  CircularProgressRing,
  ArticleCard,
  AskCompanionButton,
} from "@/components/shared";
import { getBiomarkerIcon } from "@/lib/biomarkerIcons";
import { StatusIndicatorOverlay } from "@/components/shared/StatusIndicatorIcon";
import { ChevronArrowIcon } from "@/components/icons/ChevronArrowIcon";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

export default function HealthZoneDetail() {
  const { id, resultId } = useParams({ strict: false }) as {
    id: string;
    resultId?: string;
  };
  const { data, isLoading, error } = useHealthZones();
  const { data: resultsData, isLoading: resultsLoading } = useResults();
  const { t, locale } = useLocale();

  const healthZone = data?.healthZones.find((zone) => zone.id === id);

  // Get the latest result and create a map of biomarker values
  const latestResult = resultId
    ? resultsData?.results?.find((result) => result.id === resultId)
    : resultsData?.results?.[0];
  const biomarkerValuesMap = new Map<string, BiomarkerResult>();

  if (latestResult?.biomarkers) {
    latestResult.biomarkers.forEach((biomarker) => {
      biomarkerValuesMap.set(biomarker.code, biomarker);
    });
  }

  // Calculate stats for this health zone
  const biomarkerCodes = healthZone?.knownBiomarkers.map((b) => b.code) || [];
  const testedBiomarkers = biomarkerCodes.filter((code) =>
    biomarkerValuesMap.has(code),
  );
  const inRangeBiomarkers = testedBiomarkers.filter((code) => {
    const result = biomarkerValuesMap.get(code);
    return (
      result?.biomarkerStatus === "OPTIMAL" ||
      result?.biomarkerStatus === "NORMAL" ||
      result?.biomarkerStatus === "NO_RANGE"
    );
  });
  const outOfRangeBiomarkers = testedBiomarkers.filter((code) => {
    const result = biomarkerValuesMap.get(code);
    return (
      result?.biomarkerStatus === "HIGH" || result?.biomarkerStatus === "LOW"
    );
  });
  const notTestedCount = biomarkerCodes.length - testedBiomarkers.length;

  // Collect biomarker results for this health zone to send to AI
  const healthZoneBiomarkerResults = testedBiomarkers
    .map((code) => biomarkerValuesMap.get(code))
    .filter((result): result is BiomarkerResult => result !== undefined);

  if (isLoading) {
    return <HealthZoneDetailSkeleton />;
  }

  if (error || !healthZone) {
    return (
      <PageLayout title={t("healthZone.notFound")}>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t("healthZone.notFoundDesc")}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={healthZone.name}
      headerActions={
        <AskCompanionButton
          context={healthZone.name}
          contextType="healthZone"
          contextId={healthZone.id}
          contextData={{
            healthZone: {
              id: healthZone.id,
              name: healthZone.name,
              icon: healthZone.icon,
              description: healthZone.description,
            },
            biomarkers: healthZoneBiomarkerResults,
            latestResultDate: latestResult?.date,
          }}
        />
      }
    >
      {/* Header Card with Image and Content */}
      <DefinitionCard
        title={t("healthZone.whatIs").replace("{name}", healthZone.name)}
        description={healthZone.about.description}
        image={healthZone.icon}
        imageAlt={healthZone.name}
      />

      {/* Combined Stats and Tested Biomarkers Card */}
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left: Stats Section - Circular Graph */}
            <div className="flex flex-col items-center flex-shrink-0 w-full lg:w-[180px]">
              <p className="text-sm text-muted-foreground mb-2"></p>

              <div className="text-center mb-1">
                <span className="text-3xl font-bold text-foreground">
                  {latestResult?.date
                    ? formatDayMonth(latestResult.date, locale)
                    : "—"}
                </span>
              </div>

              {/* Segments: green for in-range, yellow for out-of-range */}
              {/* Only show segments if there are tested results */}
              <CircularProgressRing
                segments={[
                  {
                    value: inRangeBiomarkers.length,
                    color: "hsl(var(--hm-optimal200))",
                  },
                  {
                    value: outOfRangeBiomarkers.length,
                    color: "hsl(var(--hm-highlow200))",
                  },
                ]}
                total={inRangeBiomarkers.length + outOfRangeBiomarkers.length}
                size={100}
                strokeWidth={10}
                centerContent={
                  <div className="text-center">
                    <span className="text-xl font-semibold text-foreground">
                      {inRangeBiomarkers.length}/{testedBiomarkers.length}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {t("common.inRange")}
                    </p>
                  </div>
                }
              />

              <p className="mt-2 text-sm text-muted-foreground">
                {testedBiomarkers.length}/{biomarkerCodes.length}{" "}
                {t("healthZone.tested")}
              </p>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-border/60 self-stretch min-h-[200px]" />
            <div className="lg:hidden w-full h-px bg-border/60" />

            {/* Right: Tested Biomarkers */}
            <div className="flex-1 w-full">
              <TestedBiomarkersInCard
                biomarkers={healthZone.knownBiomarkers}
                biomarkerValuesMap={biomarkerValuesMap}
                hasResults={!!latestResult}
                isLoadingValue={resultsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Untested Biomarkers Section (if any) */}
      <UntestedBiomarkersSection
        biomarkers={healthZone.knownBiomarkers}
        biomarkerValuesMap={biomarkerValuesMap}
        hasResults={!!latestResult}
        isLoadingValue={resultsLoading}
      />

      {/* Health Tips Section */}
      {healthZone.healthTip &&
        healthZone.healthTip.healthTipItems.length > 0 && (
          <section>
            <h2 className="title-md text-foreground mb-4">
              {healthZone.healthTip.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthZone.healthTip.healthTipItems.map((tip) => (
                <HealthTipCard key={tip.id} tip={tip} />
              ))}
            </div>
          </section>
        )}

      {/* Related Articles Section */}
      {healthZone.relatedArticles.length > 0 && (
        <section>
          <h2 className="title-md text-foreground mb-4">
            {t("healthZone.relatedArticles")} (
            {healthZone.relatedArticles.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {healthZone.relatedArticles.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </PageLayout>
  );
}

// Biomarker Card Component
interface BiomarkerCardProps {
  biomarker: HealthZone["knownBiomarkers"][0];
  latestValue?: BiomarkerResult;
  isLoadingValue?: boolean;
}

function BiomarkerCard({
  biomarker,
  latestValue,
  isLoadingValue,
}: BiomarkerCardProps) {
  const { t } = useLocale();
  const hasValue = latestValue !== undefined;
  const isHighOrLow =
    latestValue?.biomarkerStatus === "HIGH" ||
    latestValue?.biomarkerStatus === "LOW";

  // Get background color for icon - use muted for better contrast
  const getIconBgClass = () => {
    if (!hasValue) return "bg-muted";
    return "bg-muted";
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (!hasValue) return null;
    return (
      <StatusIndicatorOverlay
        status={latestValue.biomarkerStatus}
        position="bottom-left"
      />
    );
  };

  // Use appropriate link based on whether biomarker is tested or not
  const biomarkerLink = hasValue
    ? `/biomarkers/${latestValue.id}`
    : `/biomarkers/known/${biomarker.code}`;

  return (
    <Link to={biomarkerLink}>
      <Card
        className={cn(
          "hover:bg-muted/50 transition-colors",
          !hasValue && "bg-muted/20",
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icon with status indicator */}
            <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
              {getBiomarkerIcon(biomarker.code, biomarker.biomarkerIcon) ? (
                <img
                  src={getBiomarkerIcon(
                    biomarker.code,
                    biomarker.biomarkerIcon,
                  )}
                  alt={biomarker.name}
                  className="w-11 h-11 object-cover rounded-full"
                />
              ) : (
                <Activity className="h-5 w-5 text-muted-foreground" />
              )}
              {/* Status indicator overlay */}
              {getStatusIndicator()}
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate text-sm">
                {biomarker.name}
              </p>
            </div>

            {/* Value and Unit */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                {isLoadingValue ? (
                  <>
                    <Skeleton className="h-5 w-10 mb-0.5" />
                    <Skeleton className="h-3 w-8" />
                  </>
                ) : hasValue ? (
                  <>
                    <p className="font-semibold text-foreground">
                      {latestValue.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latestValue.unit}
                    </p>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {t("healthZone.notTested")}
                  </span>
                )}
              </div>
              <ChevronArrowIcon size={20} className="text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Biomarker Card Skeleton Component
function BiomarkerCardSkeleton() {
  return (
    <Card className="">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[100px]" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <Skeleton className="h-5 w-10 mb-0.5" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Biomarkers Sections Component
interface BiomarkersSectionsProps {
  biomarkers: HealthZone["knownBiomarkers"];
  biomarkerValuesMap: Map<string, BiomarkerResult>;
  hasResults: boolean;
  isLoadingValue?: boolean;
}

function BiomarkersSections({
  biomarkers,
  biomarkerValuesMap,
  hasResults,
  isLoadingValue,
}: BiomarkersSectionsProps) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  // If no results, show upsell to book a test
  if (!hasResults) {
    return (
      <section>
        <h2 className="title-md text-foreground mb-4">
          {t("history.biomarkers")} ({biomarkers.length})
        </h2>
        {/* Upsell Card */}
        <Card className="border border-primary/20 bg-primary/5 mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TestTube className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="caption-md text-foreground">
                    {t("healthZone.unlockHealthZone")}
                  </p>
                  <p className="body-sm text-muted-foreground">
                    {t("healthZone.bookTestToSee").replace(
                      "{count}",
                      biomarkers.length.toString(),
                    )}
                  </p>
                </div>
              </div>
              <Button asChild>
                <a
                  href={userShopUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {t("common.bookTest")}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Show greyed out biomarkers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
          {biomarkers.map((biomarker) => (
            <BiomarkerCard
              key={biomarker.code}
              biomarker={biomarker}
              latestValue={undefined}
              isLoadingValue={isLoadingValue}
            />
          ))}
        </div>
      </section>
    );
  }

  // Split biomarkers into tested and untested
  const testedBiomarkers = biomarkers.filter((b) =>
    biomarkerValuesMap.has(b.code),
  );
  const untestedBiomarkers = biomarkers.filter(
    (b) => !biomarkerValuesMap.has(b.code),
  );

  return (
    <>
      {/* Tested Biomarkers Section */}
      {testedBiomarkers.length > 0 && (
        <section>
          <h2 className="title-md text-foreground mb-4">
            {t("healthZone.testedBiomarkers")} ({testedBiomarkers.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {testedBiomarkers.map((biomarker) => (
              <BiomarkerCard
                key={biomarker.code}
                biomarker={biomarker}
                latestValue={biomarkerValuesMap.get(biomarker.code)}
                isLoadingValue={isLoadingValue}
              />
            ))}
          </div>
        </section>
      )}

      {/* Untested Biomarkers Section */}
      {untestedBiomarkers.length > 0 && (
        <section>
          <h2 className="title-md text-foreground mb-3">
            {t("healthZone.untestedBiomarkers")} ({untestedBiomarkers.length})
          </h2>
          {/* Upsell Banner */}
          <Card className="border border-primary/20 bg-primary/5 mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <TestTube className="h-5 w-5 text-primary shrink-0" />
                  <p className="body-sm text-muted-foreground">
                    {t("healthZone.biomarkersNotIncluded")}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={userShopUrl.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("common.bookTest")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {untestedBiomarkers.map((biomarker) => (
              <BiomarkerCard
                key={biomarker.code}
                biomarker={biomarker}
                latestValue={undefined}
                isLoadingValue={false}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// Tested Biomarkers shown inside the stats card
function TestedBiomarkersInCard({
  biomarkers,
  biomarkerValuesMap,
  hasResults,
  isLoadingValue,
}: BiomarkersSectionsProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  const { t } = useLocale();
  const testedBiomarkers = biomarkers.filter((b) =>
    biomarkerValuesMap.has(b.code),
  );

  if (!hasResults || testedBiomarkers.length === 0) {
    return (
      <div className="text-center py-8">
        <TestTube className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {t("healthZone.noResultsYet")}
        </p>
        <Button asChild className="mt-4" size="sm">
          <a
            href={userShopUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("common.bookTest")}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">
        {t("healthZone.testedBiomarkers")} ({testedBiomarkers.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 divide-y divide-gray-200 sm:divide-y-0">
        {testedBiomarkers.map((biomarker) => (
          <BiomarkerCard
            key={biomarker.code}
            biomarker={biomarker}
            latestValue={biomarkerValuesMap.get(biomarker.code)}
            isLoadingValue={isLoadingValue}
          />
        ))}
      </div>
    </div>
  );
}

// Untested Biomarkers shown outside the stats card
function UntestedBiomarkersSection({
  biomarkers,
  biomarkerValuesMap,
  hasResults,
  isLoadingValue,
}: BiomarkersSectionsProps) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  if (!hasResults) return null;

  const untestedBiomarkers = biomarkers.filter(
    (b) => !biomarkerValuesMap.has(b.code),
  );

  if (untestedBiomarkers.length === 0) return null;

  return (
    <section>
      <h2 className="title-md text-foreground mb-4">
        {t("healthZone.untestedBiomarkers")}
      </h2>

      {/* Info Banner - Light blue */}
      <div className="bg-[hsl(210_100%_96%)] border border-[#006FFD0D] rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-foreground body-md flex-1">
          {t("healthZone.biomarkersNotIncluded")}
        </p>
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

      {/* Biomarker Cards - Horizontal Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {untestedBiomarkers.map((biomarker) => (
          <Link key={biomarker.code} to={`/biomarkers/known/${biomarker.code}`}>
            <Card className="border-border/40 bg-card transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {getBiomarkerIcon(
                      biomarker.code,
                      biomarker.biomarkerIcon,
                    ) ? (
                      <img
                        src={getBiomarkerIcon(
                          biomarker.code,
                          biomarker.biomarkerIcon,
                        )}
                        alt={biomarker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Name */}
                  <p className="font-medium text-foreground flex-1">
                    {biomarker.name}
                  </p>

                  {/* Chevron */}
                  <ChevronArrowIcon
                    size={20}
                    className="text-muted-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Health Tip Card Component
interface HealthTipCardProps {
  tip: HealthZone["healthTip"] extends { healthTipItems: infer T }
    ? T extends (infer U)[]
      ? U
      : never
    : never;
}

function HealthTipCard({ tip }: HealthTipCardProps) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow h-full">
      <CardContent className="p-4 flex flex-row gap-4 h-full">
        {/* Text content on the left */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h3 className="font-medium text-foreground mb-2">{tip.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {tip.description}
          </p>
        </div>
        {/* Image on the right */}
        {tip.image && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={tip.image}
              alt={tip.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Local ArticleCard removed - now using shared component from @/components/shared

// Loading Skeleton
function HealthZoneDetailSkeleton() {
  return (
    <PageLayout title="Loading...">
      {/* Header Card Skeleton */}
      <Card className="border border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-40 sm:min-w-[10rem] bg-muted/30 flex items-center justify-center p-6 sm:p-8">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg" />
            </div>
            <div className="flex-1 p-5 sm:p-6 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section Skeleton - Circular Graph */}
      <Card className="border border-border/40">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          {/* Ring Skeleton */}
          <Skeleton className="w-[100px] h-[100px] rounded-full" />

          {/* Stats Skeleton */}
          <div className="mt-4 space-y-2 w-full max-w-[200px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tested Biomarkers Section Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BiomarkerCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Untested Biomarkers Section Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BiomarkerCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Health Tips Section Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Related Articles Section Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
