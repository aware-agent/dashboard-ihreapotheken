import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  History,
  FileDown,
  Sparkles,
  Loader2,
  TestTube,
  X,
} from "lucide-react";
import { useResults } from "@/hooks/useResults";
import { useHealthZones } from "@/hooks/useHealthZones";
import { useUserProfile } from "@/hooks/useUser";
import {
  useDashboardPreferences,
  DashboardWidgets,
  SectionId,
  WearableMetricId,
} from "@/hooks/useDashboardPreferences";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { usePdfDownload } from "@/hooks/usePdfDownload";
import { useArticles } from "@/hooks/useArticles";
import { Article } from "@/types/articles";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";
import { env } from "@/config/urls";
import {
  HealthZoneCard as SharedHealthZoneCard,
  ArticleCard,
  OutdatedResultsBanner,
} from "@/components/shared";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { BioAgeWidget } from "@/components/dashboard/BioAgeWidget";
import { WearablesWidget } from "@/components/dashboard/WearablesWidget";
import { CompanionWidget } from "@/components/dashboard/CompanionWidget";
import { LatestTestCard } from "@/components/dashboard/LatestTestCard";
import { HealthZonesCard } from "@/components/dashboard/HealthZonesCard";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import {
  DashboardEditToolbar,
  SortableWidget,
  SortableSection,
} from "@/components/dashboard/DashboardCustomizer";
import {
  WearableDataSection,
  WearableDataSectionSkeleton,
} from "@/components/dashboard/WearableDataSection";
import { PageLayout } from "@/components/PageLayout";
import {
  HealthStatsCardPlaceholder,
  BioAgeWidgetPlaceholder,
  CompanionWidgetPlaceholder,
  WearablesWidgetPlaceholder,
  HealthZonesPlaceholder,
  InsightsPlaceholder,
  WearableDataPlaceholder,
  QuickActionsCard,
} from "@/components/dashboard/DashboardPlaceholders";
import { ProFeatureGate } from "@/components/shared/ProFeatureGate";
import { useLocale } from "@/hooks/useLocale";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentsResponse } from "@/types/appointments";

// Configuration
const HEALTH_ZONES_SKELETON_COUNT = 9;

const Dashboard = () => {
  const { t } = useLocale();
  const {
    data: resultsData,
    isLoading: resultsLoading,
    error: resultsError,
    refetch,
  } = useResults();
  const { data: healthZonesData } = useHealthZones();
  const { data: appointmentsData, isLoading: appointmentsLoading } =
    useAppointments();

  const { data: user, isLoading: userLoading } = useUserProfile();
  const {
    editMode,
    enterEditMode,
    exitEditMode,
    toggleSection,
    toggleWidget,
    toggleWearableMetric,
    reorderSections,
    reorderFeatureWidgets,
    reorderWearableMetrics,
    resetToDefaults,
    getOrderedSections,
    getOrderedFeatureWidgets,
    getOrderedWearableMetrics,
    getWidgetConfig,
    getSectionConfig,
    getWearableMetricConfig,
    isSectionVisible,
  } = useDashboardPreferences();

  const { downloadPdf, isDownloading } = usePdfDownload();
  const { data: articlesData, isLoading: articlesLoading } = useArticles();

  // Membership check
  const isMember = user?.activeMembershipInfo?.isMember ?? false;

  // Filter to only show Aware results (LAB or SCAN types, not user uploads)
  const awareResults = resultsData?.results.filter((r) => r.type === "LAB");
  const latestResult = awareResults?.[0];
  const hasResults = awareResults && awareResults.length > 0;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  const handleWidgetDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFeatureWidgets(active.id as string, over.id as string);
    }
  };

  const handleWearableMetricDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWearableMetrics(active.id as string, over.id as string);
    }
  };

  const handleExportReport = () => {
    if (latestResult) {
      const dateStr = new Date(latestResult.date).toISOString().split("T")[0];
      downloadPdf(latestResult.id, `health-report-${dateStr}.pdf`);
    }
  };

  // Calculate health score
  const healthScore = latestResult
    ? Math.round((latestResult.inRange / latestResult.biomarkers.length) * 100)
    : 0;

  // Get ordered data
  const orderedSections = useMemo(
    () => getOrderedSections(),
    [getOrderedSections],
  );
  const orderedFeatureWidgets = useMemo(
    () => getOrderedFeatureWidgets(),
    [getOrderedFeatureWidgets],
  );
  const orderedWearableMetrics = useMemo(
    () => getOrderedWearableMetrics(),
    [getOrderedWearableMetrics],
  );
  const sectionIds = useMemo(
    () => orderedSections.map((s) => s.id),
    [orderedSections],
  );
  const featureWidgetIds = useMemo(
    () => orderedFeatureWidgets.map((w) => w.id),
    [orderedFeatureWidgets],
  );
  const wearableMetricIds = useMemo(
    () => orderedWearableMetrics.map((m) => m.id),
    [orderedWearableMetrics],
  );

  // Render feature widget
  const renderFeatureWidget = (widgetId: keyof DashboardWidgets) => {
    if (!latestResult) return null;

    const config = getWidgetConfig(widgetId);
    const commonProps = {
      widgetId,
      config,
      editMode,
      onToggle: () => toggleWidget(widgetId),
    };

    switch (widgetId) {
      case "healthStats":
        return (
          <SortableWidget key={widgetId} {...commonProps}>
            <LatestTestCard
              latestResultId={latestResult.id}
              totalMarkers={latestResult.inRange + latestResult.outOfRange}
              inRange={latestResult.inRange}
              outOfRange={latestResult.outOfRange}
              lastTestDate={latestResult.date}
            />
          </SortableWidget>
        );
      case "bioAge":
        return (
          <SortableWidget key={widgetId} {...commonProps}>
            <BioAgeWidget />
          </SortableWidget>
        );
      case "companion":
        return (
          <SortableWidget key={widgetId} {...commonProps}>
            <CompanionWidget />
          </SortableWidget>
        );
      case "wearables":
        if (!env.VITE_WEARABLES_ENABLED) return null;
        return (
          <SortableWidget key={widgetId} {...commonProps}>
            <WearablesWidget />
          </SortableWidget>
        );
      default:
        return null;
    }
  };

  // Render section content
  const renderSectionContent = (sectionId: SectionId) => {
    if (!latestResult) return null;

    switch (sectionId) {
      case "featureWidgets":
        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleWidgetDragEnd}
          >
            <SortableContext
              items={featureWidgetIds}
              strategy={horizontalListSortingStrategy}
            >
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                {orderedFeatureWidgets.map((widget) =>
                  renderFeatureWidget(widget.id as keyof DashboardWidgets),
                )}
              </div>
            </SortableContext>
          </DndContext>
        );

      case "healthZones":
        return (
          <section>
            <div className="mb-5">
              <h2 className="title-md">{t("dashboard.healthZones")}</h2>
            </div>
            <HealthZonesGrid
              zones={latestResult.healthZones}
              healthZonesData={healthZonesData}
              allResults={awareResults ?? []}
            />
          </section>
        );

      case "insights":
        return (
          <section>
            <div className="mb-5">
              <h2 className="title-md">
                {t("dashboard.personalizedInsights")}
              </h2>
            </div>
            <InsightsCard markers={latestResult.biomarkers} />
          </section>
        );
      /*  CANT USE FF HERE - Wearable Data Section
      case "wearableData":
        return (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleWearableMetricDragEnd}
          >
            <SortableContext
              items={wearableMetricIds}
              strategy={horizontalListSortingStrategy}
            >
              <WearableDataSection
                editMode={editMode}
                orderedMetrics={orderedWearableMetrics}
                onToggleMetric={toggleWearableMetric}
                getMetricConfig={getWearableMetricConfig}
              />
            </SortableContext>
          </DndContext>
        );
        */

      case "quickActions":
        return (
          <section>
            <div className="mb-5">
              <h2 className="title-md">{t("dashboard.quickActions")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/uploads">
                <QuickActionCard
                  photo="/hero-hands.jpg"
                  gradient="linear-gradient(160deg, #1a1a1a 0%, #111111 100%)"
                  accent="#D32F2F"
                  icon={<Upload className="w-4 h-4 text-white/70" />}
                  label={t("dashboard.uploadNewResults")}
                  desc={t("dashboard.uploadNewResultsDesc")}
                />
              </Link>
              <Link to="/history">
                <QuickActionCard
                  photo="/hero-barbell.jpg"
                  gradient="linear-gradient(160deg, #1a1a1a 0%, #111111 100%)"
                  accent="#D32F2F"
                  icon={<History className="w-4 h-4 text-white/70" />}
                  label={t("dashboard.viewFullHistory")}
                  desc={t("dashboard.viewFullHistoryDesc")}
                />
              </Link>
              <button onClick={handleExportReport} disabled={isDownloading} className="text-left disabled:opacity-50 w-full">
                <QuickActionCard
                  gradient="linear-gradient(160deg, #1a1a1a 0%, #111111 100%)"
                  accent="#aab7b8"
                  icon={isDownloading ? <Loader2 className="w-4 h-4 text-white/70 animate-spin" /> : <FileDown className="w-4 h-4 text-white/70" />}
                  label={t("dashboard.exportReport")}
                  desc={t("dashboard.exportReportDesc")}
                />
              </button>
            </div>
          </section>
        );

      case "DEAD_CODE_NEVER":
        return (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={handleExportReport} disabled={isDownloading}>
                <Card className="h-full">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center">
                      {isDownloading ? (
                        <Loader2 className="h-[18px] w-[18px] text-primary animate-spin" />
                      ) : (
                        <FileDown className="h-[18px] w-[18px] text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-bold text-foreground">
                      {t("dashboard.exportReport")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.exportReportDesc")}
                    </p>
                  </CardContent>
                </Card>
              </button>
            </div>
          </section>
        );

      case "articles":
        return (
          <RecommendedArticles
            articles={articlesData?.articles}
            isLoading={articlesLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout
      preTitle="Dein Gesundheits-Dashboard"
      title={<span className="font-['Lora'] font-normal italic text-[#1a1a1a]">{t("dashboard.greeting")}, {user?.givenName || ""}.</span>}
      subtitle={t("dashboard.personalizedOverview")}
      isLoading={resultsLoading || userLoading}
      loadingSkeleton={<DashboardSkeleton />}
      hideHeaderContentOnMobile={editMode}
      headerActions={
        hasResults && isMember ? (
          <DashboardEditToolbar
            editMode={editMode}
            onEnterEdit={enterEditMode}
            onSave={() => exitEditMode(true)}
            onCancel={() => exitEditMode(false)}
            onReset={resetToDefaults}
          />
        ) : undefined
      }
    >
      <ProFeatureGate
        isMember={isMember}
        isLoading={userLoading}
        placeholder={<DashboardPlaceholder />}
        featureName="dashboard"
      >
        {resultsError && !resultsLoading ? (
          <ErrorState
            title={t("errorsPage.failedToLoadDashboard")}
            message={t("errorsPage.couldNotLoadHealthData")}
            onRetry={() => refetch()}
          />
        ) : !hasResults && !appointmentsData ? (
          <DashboardEmptyState
            articlesData={articlesData}
            articlesLoading={articlesLoading}
          />
        ) : !hasResults && appointmentsData ? (
          <DashboardEmptyState
            appointmentsData={appointmentsData}
            appointmentsLoading={appointmentsLoading}
            articlesData={articlesData}
            articlesLoading={articlesLoading}
          />
        ) : (
          <>
            {/* Outdated Results Banner */}
            <OutdatedResultsBanner
              lastTestDate={latestResult.date}
              className="mb-6"
            />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={sectionIds}
                strategy={rectSortingStrategy}
              >
                <div className="space-y-6">
                  {orderedSections.map((section) => (
                    <SortableSection
                      key={section.id}
                      sectionId={section.id}
                      config={section}
                      editMode={editMode}
                      onToggle={() => toggleSection(section.id)}
                    >
                      {renderSectionContent(section.id)}
                    </SortableSection>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </ProFeatureGate>
    </PageLayout>
  );
};

export default Dashboard;

// Dashboard Empty State - shows same layout structure with placeholders
function DashboardEmptyState({
  appointmentsData,
  appointmentsLoading,
  articlesData,
  articlesLoading,
}: {
  appointmentsData?: AppointmentsResponse;
  appointmentsLoading?: boolean;
  articlesData?: { articles: Article[] };
  articlesLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {!appointmentsData && <EmptyStateBanner />}

      {/* Feature Widgets - Placeholders */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
        <HealthStatsCardPlaceholder />
        <BioAgeWidgetPlaceholder />
        <CompanionWidgetPlaceholder />
        {/* <WearablesWidgetPlaceholder />   */}
      </div>

      {/* Health Zones - Placeholder */}
      <HealthZonesPlaceholder />

      {/* Insights - Placeholder */}
      {env.VITE_COMPANION_ENABLED && <InsightsPlaceholder />}

      {/* Wearable Data - Placeholder */}
      {env.VITE_WEARABLES_ENABLED && <WearableDataPlaceholder />}

      {/* Quick Actions - Works without data */}
      {!appointmentsData && <QuickActionsCard />}

      {/* Articles - Can show real articles even without results */}
      <RecommendedArticles
        articles={articlesData?.articles}
        isLoading={articlesLoading}
      />
    </div>
  );
}

// Empty State Welcome Banner
function EmptyStateBanner() {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card
      className={cn(
        "bg-gradient-to-r from-[#FDEAEA] to-[#fff] border border-[#b8e094] overflow-hidden transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      )}
    >
      <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/15">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="title-sm text-foreground mb-1">
            {t("dashboard.getStartedTitle")}
          </h3>
          <p className="body-sm text-muted-foreground">
            {t("dashboard.getStartedDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button asChild size="sm">
            <a
              href={userShopUrl.toString()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TestTube className="h-4 w-4 mr-1.5" />
              {t("common.bookTest")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/uploads">
              <Upload className="h-4 w-4 mr-1.5" />
              {t("common.uploadResults")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder for non-members (used by ProFeatureGate)
function DashboardPlaceholder() {
  return (
    <div className="space-y-6">
      {/* Feature Widgets Placeholder */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
        <HealthStatsCardPlaceholder />
        <BioAgeWidgetPlaceholder />
        <CompanionWidgetPlaceholder />
        {/* <WearablesWidgetPlaceholder /> */}
      </div>

      {/* Health Zones Placeholder */}
      <HealthZonesPlaceholder />

      {/* Insights Placeholder */}
      <InsightsPlaceholder />

      {/* Wearable Data Placeholder */}
      {/* <WearableDataPlaceholder /> */}

      {/* Quick Actions Placeholder */}
      <QuickActionsCard />
    </div>
  );
}

// Dashboard Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Feature Widgets Skeleton */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>

      {/* Health Zones Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: HEALTH_ZONES_SKELETON_COUNT }).map((_, i) => (
            <Card key={i} className="border border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Insights Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Card className="border border-border/40">
          <CardContent className="p-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      </section>

      {/* Wearable Data Skeleton */}
      {/* <WearableDataSectionSkeleton /> */}

      {/* Quick Actions Skeleton */}
      <Card className="border border-border/40">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Articles Skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border/40 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// Recommended Articles Component
function RecommendedArticles({
  articles,
  isLoading,
}: {
  articles?: Article[];
  isLoading: boolean;
}) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <section>
        <div className="mb-5">
          <h2 className="title-md">
            {t("dashboard.recommendedArticles")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border/40 overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  // Editorial article layout — full-width row, first article large
  return (
    <section>
      <div className="mb-5">
        <h2 className="title-md">{t("dashboard.recommendedArticles")}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article, i) => (
          <div
            key={article.id}
            className={i === 0 ? "md:col-span-2 md:row-span-1" : ""}
          >
            <ArticleCard article={article} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Health Zones Grid ──────────────────────────────────────────────────────

// All zones use the same dark base — color only signals performance
const ZONE_BASE = { gradient: 'linear-gradient(160deg, #1e1e1e 0%, #111111 100%)' };
const getZoneAccent = (score: number) => {
  if (score >= 80) return '#27AE60';      // green = good
  if (score >= 60) return '#d4a017';      // Amber = needs attention
  return '#c0392b';                        // Red = warning
};
const zoneConfig: Record<string, { gradient: string; accent: string }> = {};
const defaultZone = { gradient: ZONE_BASE.gradient, accent: '#D32F2F' };

function HealthZonesGrid({ zones, healthZonesData, allResults }: {
  zones: Array<{ id: string; name: string; icon?: string | null; inRange: number; outOfRange: number }>;
  healthZonesData?: { healthZones: Array<{ id: string; knownBiomarkers: Array<{ code: string; name: string; unit?: string }> }> } | null;
  allResults?: Array<{ biomarkers: Array<{ code: string; name: string; value: number; valueText: string; unit: string; biomarkerStatus: string; percentageVariation: number | null }> }>;
}) {
  // Build a map: code → [value_newest, value_older] for sparkline
  const valueHistory = useMemo(() => {
    const map: Record<string, number[]> = {};
    if (!allResults) return map;
    // allResults[0] = newest, allResults[1] = older
    allResults.slice(0, 3).forEach(result => {
      result.biomarkers.forEach(bm => {
        if (!map[bm.code]) map[bm.code] = [];
        map[bm.code].push(bm.value);
      });
    });
    return map;
  }, [allResults]);

  // Get latest biomarker data
  const latestBiomarkers = allResults?.[0]?.biomarkers ?? [];
  const biomarkerMap = useMemo(() => {
    const map: Record<string, typeof latestBiomarkers[0]> = {};
    latestBiomarkers.forEach(bm => { map[bm.code] = bm; });
    return map;
  }, [latestBiomarkers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {zones.map((zone) => {
        const tested = zone.inRange + zone.outOfRange;
        const fullZone = healthZonesData?.healthZones.find(hz => hz.id === zone.id);
        const knownMarkers = fullZone?.knownBiomarkers ?? [];
        const total = knownMarkers.length || tested;
        const score = tested > 0 ? Math.round((zone.inRange / tested) * 100) : 0;
        const accent = tested > 0 ? getZoneAccent(score) : '#aaa';
        const pct = total > 0 ? Math.min((zone.inRange / Math.max(total, tested)) * 100, 100) : 0;

        return (
          <Link key={zone.id} to={`/health-zones/${zone.id}`} className="block group">
            <div
              className="bg-white rounded-2xl border border-[#E8E5E1] transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <div className="px-6 pt-5 pb-4">
                {/* Zone header */}
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A8580' }}>
                    {zone.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: accent }}>
                      {tested > 0 ? `${score}%` : '—'}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-[#C0BDB8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 rounded-full bg-[#EDEAE6] mb-4">
                  {pct > 0 && (
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: accent }} />
                  )}
                </div>

                {/* Biomarker rows with trend */}
                {knownMarkers.length > 0 ? (
                  <div className="space-y-3">
                    {knownMarkers.slice(0, 3).map(km => {
                      const bm = biomarkerMap[km.code];
                      const history = valueHistory[km.code] ?? [];
                      const variation = bm?.percentageVariation;
                      const statusColor = bm?.biomarkerStatus === 'OPTIMAL' ? '#4a8c28'
                        : bm?.biomarkerStatus === 'NORMAL' ? '#4a8c28'
                        : bm?.biomarkerStatus === 'HIGH' || bm?.biomarkerStatus === 'LOW' ? '#c0392b'
                        : '#8A8580';

                      return (
                        <div key={km.code} className="flex items-center gap-3">
                          {/* Marker name */}
                          <div className="flex-1 min-w-0">
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A', lineHeight: 1.3 }}>
                              {km.name}
                            </div>
                          </div>

                          {/* Sparkline — simple 2-3 point line */}
                          {history.length >= 2 && (
                            <div className="shrink-0">
                              <MiniSparkline values={history} color={statusColor} />
                            </div>
                          )}

                          {/* Current value + trend */}
                          <div className="text-right shrink-0" style={{ minWidth: '60px' }}>
                            {bm ? (
                              <>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: statusColor }}>
                                  {bm.valueText}
                                  <span style={{ fontSize: '10px', fontWeight: 400, color: '#8A8580', marginLeft: '2px' }}>{bm.unit}</span>
                                </div>
                                {variation !== null && variation !== 0 && (
                                  <div style={{ fontSize: '10px', color: variation > 0 ? '#d4750a' : '#4a8c28', fontWeight: 500 }}>
                                    {variation > 0 ? '↑' : '↓'} {Math.abs(variation)}%
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#C0BDB8' }}>—</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {knownMarkers.length > 3 && (
                      <div style={{ fontSize: '10px', color: '#C0BDB8', paddingTop: '2px' }}>
                        +{knownMarkers.length - 3} weitere
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#8A8580' }}>
                    {tested > 0 ? `${zone.inRange} von ${tested} im Bereich` : 'Noch kein Test'}
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Mini Sparkline SVG ─────────────────────────────────────────────────────

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 36, h = 16;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.slice(0, 3).map((v, i) => {
    const x = (i / (values.slice(0,3).length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Last point dot */}
      {(() => {
        const last = pts.split(' ').pop()?.split(',');
        if (!last) return null;
        return <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r="2" fill={color} opacity="0.9" />;
      })()}
    </svg>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────

function QuickActionCard({ photo, gradient, accent, icon, label, desc }: {
  photo?: string;
  gradient: string;
  accent: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E8E5E1] group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: '110px' }}
    >
      <div className="relative p-5 h-full flex flex-col justify-between" style={{ minHeight: '110px' }}>
        {/* Accent top-bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D32F2F] opacity-60" />

        <div className="w-8 h-8 rounded-lg bg-[#f0fae8] flex items-center justify-center text-[#D32F2F]">
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>{label}</h3>
          <p style={{ fontSize: '12px', color: '#8A8580', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}
