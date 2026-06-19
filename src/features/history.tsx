import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ArrowUp, ArrowDown } from "lucide-react";
import { CalendarFilterIcon } from "@/components/icons/CalendarFilterIcon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useResults } from "@/hooks/useResults";
import { useHealthZones } from "@/hooks/useHealthZones";
import { Result, BiomarkerResult, Package } from "@/types/results";
import { ErrorState } from "@/components/ErrorState";
import { useState, useMemo, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  format,
  subDays,
  subMonths,
  startOfYear,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
} from "date-fns";
import { formatMediumDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import {
  BiomarkerList,
  ResponsiveBiomarkerDetail,
  OutdatedResultsBanner,
  ResultTypeBadge,
} from "@/components/shared";
import { HealthStatsCard } from "@/components/dashboard/HealthStatsCard";
import { HistoryEmptyState } from "@/components/history/HistoryPlaceholders";
import { CircularProgressRing } from "@/components/shared/CircularProgressRing";

import {
  TestResultSwitcher,
  ResultFilterType,
} from "@/components/dashboard/TestResultSwitcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { TimelineIcon } from "@/components/icons/TimelineIcon";
import { BiomarkersIcon } from "@/components/icons/BiomarkersIcon";
import { useLocale } from "@/hooks/useLocale";
import { useSearchParams } from "@/hooks/useSearchParams";
import { getPackageName } from "@/utils/packageName";
import { HealthPackage } from "@/types/packages";

type SortOrder = "desc" | "asc";
type QuickFilter = "all" | "30days" | "3months" | "year";

// Quick filters are now localized in component

const History = () => {
  const { t } = useLocale();
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<Date | undefined>(undefined);
  const { data, isLoading, error, refetch } = useResults();
  const { data: healthZonesData } = useHealthZones();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>("all");
  const [resultTypeFilter, setResultTypeFilter] =
    useState<ResultFilterType>("all");
  const [selectedBiomarker, setSelectedBiomarker] =
    useState<BiomarkerResult | null>(null);
  const isMobile = useIsMobile();

  const quickFilters: { key: QuickFilter; label: string }[] = [
    { key: "all", label: t("history.allTime") },
    { key: "30days", label: t("history.last30Days") },
    { key: "3months", label: t("history.last3Months") },
    { key: "year", label: t("history.thisYear") },
  ];

  useEffect(() => {
    if (data?.results && data.results.length > 0) {
      //get min and max date from results
      const minDateLocal = data.results.reduce(
        (min, result) => {
          return startOfDay(new Date(result.date)) < startOfDay(min)
            ? startOfDay(new Date(result.date))
            : min;
        },
        startOfDay(new Date(data.results[0].date)),
      );
      const maxDateLocal = data.results.reduce(
        (max, result) => {
          return endOfDay(new Date(result.date)) > endOfDay(max)
            ? endOfDay(new Date(result.date))
            : max;
        },
        endOfDay(new Date(data.results[0].date)),
      );

      if (minDateLocal) setMinDate(minDateLocal);
      if (maxDateLocal) setMaxDate(maxDateLocal);
    }
  }, [data]);

  // Get tab from URL query params, default to 'timeline'
  // const tabParam = searchParams.search.get("tab");
  const tabParam = searchParams.tab as "timeline" | "biomarkers" | undefined;

  const activeTab = (tabParam === "biomarkers" ? "biomarkers" : "timeline") as
    | "timeline"
    | "biomarkers";

  const setActiveTab = (tab: "timeline" | "biomarkers") => {
    setSearchParams({ tab });
  };

  // Get latest result for biomarkers tab
  const latestResult = data?.results[0];
  const biomarkers = latestResult?.biomarkers || [];

  // Auto-select first biomarker when switching to biomarkers tab (only on desktop)
  // Wait for isMobile to be explicitly false (not undefined) to avoid auto-opening on mobile
  useEffect(() => {
    if (
      activeTab === "biomarkers" &&
      isMobile === false &&
      biomarkers.length > 0 &&
      !selectedBiomarker
    ) {
      setSelectedBiomarker(biomarkers[0]);
    }
  }, [activeTab, biomarkers, selectedBiomarker, isMobile]);

  const applyQuickFilter = (filter: QuickFilter) => {
    setActiveQuickFilter(filter);
    const today = new Date();

    switch (filter) {
      case "30days":
        setDateRange({
          from: startOfDay(subDays(today, 30)),
          to: endOfDay(today),
        });
        break;
      case "3months":
        setDateRange({
          from: startOfDay(subMonths(today, 3)),
          to: endOfDay(today),
        });
        break;
      case "year":
        setDateRange({ from: startOfYear(today), to: endOfDay(today) });
        break;
      case "all":
      default:
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    if (!data?.results) return [];

    let results = [...data.results];

    // Filter by result type
    if (resultTypeFilter !== "all") {
      results = results.filter((result) => {
        if (resultTypeFilter === "aware") return result.type === "LAB";
        if (resultTypeFilter === "scan") return result.type === "SCAN";
        return true;
      });
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      results = results.filter((result) => {
        const resultDate = new Date(result.date);
        if (dateRange.from && dateRange.to) {
          return resultDate >= dateRange.from && resultDate <= dateRange.to;
        }
        if (dateRange.from) {
          return resultDate >= dateRange.from;
        }
        if (dateRange.to) {
          return resultDate <= dateRange.to;
        }
        return true;
      });
    }

    // Sort by date
    results.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return results;
  }, [data?.results, dateRange, sortOrder, resultTypeFilter]);

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
    setActiveQuickFilter("all");
  };

  const handleCustomDateChange = (
    type: "from" | "to",
    date: Date | undefined,
  ) => {
    setDateRange((prev) => ({ ...prev, [type]: date }));
    setActiveQuickFilter("all"); // Reset quick filter when using custom dates
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const hasDateFilter = dateRange.from || dateRange.to;

  return (
    <PageLayout
      title={t("history.title")}
      subtitle={t("history.subtitle")}
      isLoading={isLoading}
      loadingSkeleton={<HistorySkeleton />}
    >
      {error ? (
        <ErrorState
          title={t("errorsPage.failedToLoadResults")}
          message={t("errorsPage.couldNotLoadTestHistory")}
          onRetry={() => refetch()}
        />
      ) : !data?.results.length ? (
        <HistoryEmptyState />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "timeline" | "biomarkers")}
          className="space-y-6"
        >
          {/* Outdated Results Banner */}
          <OutdatedResultsBanner
            lastTestDate={data.results[0].date}
            className="mb-2"
          />

          <TabsList>
            <TabsTrigger value="timeline">
              <TimelineIcon
                className="h-4 w-4 mr-2"
                active={activeTab === "timeline"}
              />
              {t("history.timeline")}
            </TabsTrigger>
            <TabsTrigger value="biomarkers">
              <BiomarkersIcon
                className="h-4 w-4 mr-2"
                active={activeTab === "biomarkers"}
              />
              {t("history.biomarkers")}
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6 mt-0">
            {/* Filters Section - Always visible */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
              {/* Result Type Switcher */}
              <TestResultSwitcher
                results={data.results}
                filter={resultTypeFilter}
                onFilterChange={setResultTypeFilter}
                className="h-8 rounded-[8px] px-3 border-[hsl(var(--history-border))] bg-transparent text-foreground hover:bg-muted hover:text-foreground flex-shrink-0"
              />

              <div className="w-px h-6 bg-[hsl(var(--history-border))] flex-shrink-0" />

              {/* Quick Filters */}
              {quickFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickFilter(filter.key)}
                  className={cn(
                    "h-8 rounded-full px-3 transition-all border flex-shrink-0",
                    activeQuickFilter === filter.key
                      ? "bg-[#2F2F2F] text-white border-[#2F2F2F] hover:bg-[#2F2F2F]/90 hover:text-white"
                      : "bg-transparent border-[hsl(var(--history-border))] text-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {filter.label}
                </Button>
              ))}

              <div className="w-px h-6 bg-[hsl(var(--history-border))] flex-shrink-0" />

              {/* From Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal h-8 rounded-[8px] px-3 gap-2 border-[hsl(var(--history-border))] bg-transparent hover:bg-muted flex-shrink-0",
                      dateRange.from
                        ? "text-foreground hover:text-foreground"
                        : "text-muted-foreground hover:text-muted-foreground",
                    )}
                  >
                    <CalendarFilterIcon
                      size={18}
                      className="text-muted-foreground"
                    />
                    {dateRange.from
                      ? format(dateRange.from, "MMM d, yyyy")
                      : t("history.fromDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white border border-border shadow-lg z-50"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => handleCustomDateChange("from", date)}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => {
                      if (dateRange.to) {
                        if (isAfter(date, dateRange.to)) {
                          return true;
                        }
                      }
                      if (minDate) {
                        if (isBefore(date, minDate)) {
                          return true;
                        }
                      }
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground caption-md flex-shrink-0">
                {t("history.to")}
              </span>

              {/* To Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal h-8 rounded-[8px] px-3 gap-2 border-[hsl(var(--history-border))] bg-transparent hover:bg-muted flex-shrink-0",
                      dateRange.to
                        ? "text-foreground hover:text-foreground"
                        : "text-muted-foreground hover:text-muted-foreground",
                    )}
                  >
                    <CalendarFilterIcon
                      size={18}
                      className="text-muted-foreground"
                    />
                    {dateRange.to
                      ? format(dateRange.to, "MMM d, yyyy")
                      : t("history.toDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white border border-border shadow-lg z-50"
                  align="start"
                >
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => handleCustomDateChange("to", date)}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => {
                      if (dateRange.from) {
                        if (isBefore(date, dateRange.from)) {
                          return true;
                        }
                      }
                      if (maxDate) {
                        if (isAfter(date, maxDate)) {
                          return true;
                        }
                      }
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>

              {hasDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="h-8 rounded-[8px] px-3 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t("history.clear")}
                </Button>
              )}

              <div className="w-px h-6 bg-[hsl(var(--history-border))] flex-shrink-0" />

              {/* Sort Toggle - Now inside scrollable area */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="h-8 rounded-[8px] px-3 gap-2 border-[hsl(var(--history-border))] bg-transparent text-foreground hover:bg-muted hover:text-foreground flex-shrink-0"
              >
                {sortOrder === "desc" ? (
                  <>
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    {t("history.newestFirst")}
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    {t("history.oldestFirst")}
                  </>
                )}
              </Button>
            </div>

            {/* Results count */}
            <p className="caption-md text-muted-foreground">
              {filteredAndSortedResults.length}{" "}
              {filteredAndSortedResults.length === 1
                ? t("history.result")
                : t("history.results")}
            </p>

            {filteredAndSortedResults.length === 0 ? (
              <Card className="bg-white border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <CardContent className="py-12 text-center">
                  <CalendarFilterIcon
                    size={40}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <h2 className="font-serif font-normal text-2xl text-[#2F2F2F] mb-2">
                    {t("history.noResultsFound")}
                  </h2>
                  <p className="body-md text-muted-foreground">
                    {t("history.noResultsInRange")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    packages={data?.packages || []}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Biomarkers Tab */}
          <TabsContent value="biomarkers" className="space-y-6 mt-0">
            {latestResult && (
              <>
                {/* Health Stats Card - Full Width with Health Zones */}
                <HealthStatsCard
                  packages={data?.packages || []}
                  bookedPackageCodes={latestResult.bookedPackageCodes}
                  totalMarkers={biomarkers.length}
                  inRange={latestResult.inRange}
                  outOfRange={latestResult.outOfRange}
                  lastTestDate={latestResult.date}
                  resultId={latestResult.id}
                  optimalCount={
                    biomarkers.filter((b) => b.biomarkerStatus === "OPTIMAL")
                      .length
                  }
                  normalCount={
                    biomarkers.filter((b) => b.biomarkerStatus === "NORMAL")
                      .length
                  }
                  healthZones={healthZonesData?.healthZones
                    .map((zone) => {
                      // Count biomarkers in this zone
                      const zoneBiomarkerCodes = zone.knownBiomarkers.map((b) =>
                        b.code.toLowerCase(),
                      );
                      const zoneBiomarkers = biomarkers.filter((b) =>
                        zoneBiomarkerCodes.includes(b.code.toLowerCase()),
                      );
                      const inRangeCount = zoneBiomarkers.filter(
                        (b) =>
                          b.biomarkerStatus === "OPTIMAL" ||
                          b.biomarkerStatus === "NORMAL",
                      ).length;
                      const outOfRangeCount =
                        zoneBiomarkers.length - inRangeCount;

                      return {
                        id: zone.id,
                        name: zone.name,
                        icon: zone.icon,
                        inRange: inRangeCount,
                        outOfRange: outOfRangeCount,
                        totalMarkers: zone.knownBiomarkers.length, // Total known biomarkers in zone
                      };
                    })
                    .filter((zone) => zone.inRange + zone.outOfRange > 0)}
                />

                {/* Main Content - Split View on Desktop, Full Width on Mobile */}
                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Biomarkers List */}
                  <div className="lg:col-span-3">
                    <BiomarkerList
                      biomarkers={biomarkers}
                      allResults={data?.results || []}
                      showSearch={true}
                      showFilter={true}
                      selectedBiomarkerId={selectedBiomarker?.id}
                      onSelect={setSelectedBiomarker}
                    />
                  </div>

                  {/* Detail Panel - Hidden on mobile via CSS, drawer shows instead */}
                  <div className="lg:col-span-2 hidden lg:block">
                    <ResponsiveBiomarkerDetail
                      biomarker={selectedBiomarker}
                      biomarkers={biomarkers}
                      onClose={() => setSelectedBiomarker(null)}
                      onNavigate={setSelectedBiomarker}
                    />
                  </div>
                </div>

                {/* Mobile Drawer - ResponsiveBiomarkerDetail handles showing drawer on mobile */}
                <div className="lg:hidden">
                  <ResponsiveBiomarkerDetail
                    biomarker={selectedBiomarker}
                    biomarkers={biomarkers}
                    onClose={() => setSelectedBiomarker(null)}
                    onNavigate={setSelectedBiomarker}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  );
};

function ResultCard({
  result,
  packages,
}: {
  result: Result;
  packages: Package[];
}) {
  const { locale } = useLocale();

  // Format date with locale awareness
  const displayDate = formatMediumDate(result.date, locale);

  const totalMarkers = result.inRange + result.outOfRange;
  // Segments: green for in-range, yellow for out-of-range
  // Background grey circle represents total (always full)
  // Only show segments if there are tested results
  const segments =
    totalMarkers > 0
      ? [
          { value: result.inRange, color: "hsl(var(--hm-optimal200))" },
          { value: result.outOfRange, color: "hsl(var(--hm-highlow200))" },
        ]
      : [];

  return (
    <Link to="/results/$id" params={{ id: result.id }} className="block">
      <Card className="bg-white rounded-2xl border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-full transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5">
        <CardContent className="p-5 !pt-5 h-full flex items-center">
          {/* Top row: Date and circular progress */}
          <div className="flex items-center justify-between gap-4 w-full content-start">
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-serif font-normal text-2xl text-[#2F2F2F]">{displayDate}</h3>
              <div className="mt-1">
                <ResultTypeBadge type={result.type} />
              </div>

              {result.bookedPackageCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.bookedPackageCodes.slice(0, 2).map((code) => (
                    <span
                      key={code}
                      className="px-3 py-1.5 rounded-full bg-bg-sodium text-muted-foreground caption-sm"
                    >
                      {getPackageName(code, packages)}
                    </span>
                  ))}
                  {result.bookedPackageCodes.length > 2 && (
                    <span className="px-3 py-1.5 rounded-full bg-bg-sodium text-muted-foreground caption-sm">
                      +{result.bookedPackageCodes.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Health zones tags */}
              {/* {result.healthZones.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.healthZones.slice(0, 2).map((zone) => (
                    <span
                      key={zone.id}
                      className="px-3 py-1.5 rounded-full bg-bg-sodium text-muted-foreground caption-sm"
                    >
                      {zone.name}
                    </span>
                  ))}
                  {result.healthZones.length > 2 && (
                    <span className="px-3 py-1.5 rounded-full bg-bg-sodium text-muted-foreground caption-sm">
                      +{result.healthZones.length - 2}
                    </span>
                  )}
                </div>
              )} */}
            </div>

            {/* Circular Progress Ring */}
            <CircularProgressRing
              segments={segments}
              total={totalMarkers}
              size={64}
              strokeWidth={6}
              centerContent={
                <span className="text-sm font-semibold text-foreground">
                  {result.inRange}/{totalMarkers}
                </span>
              }
              animated={false}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// EmptyState removed - now using EmptyStateCard from shared components

function HistorySkeleton() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.tab as "timeline" | "biomarkers" | undefined;
  const isTimelineTab = tabParam !== "biomarkers";

  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="grid w-full max-w-md grid-cols-2 h-11 bg-muted rounded-md p-1">
        <Skeleton
          className={`h-9 rounded-sm ${isTimelineTab ? "bg-primary/20" : ""}`}
        />
        <Skeleton
          className={`h-9 rounded-sm ${!isTimelineTab ? "bg-primary/20" : ""}`}
        />
      </div>

      {isTimelineTab ? (
        // Timeline Tab Skeleton
        <>
          {/* Timeline chart skeleton */}
          <Card className="border border-border/60 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-[240px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Filters skeleton */}
          <Card className="border border-border/40 shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Top row: Source Filter + Quick Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-20 rounded-md" />
                  ))}
                </div>
                <div className="hidden sm:block w-px h-6 bg-border/60" />
                <div className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-md" />
                  ))}
                </div>
              </div>
              {/* Bottom row: Date Range + Sort */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-9 w-[140px] rounded-md" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-9 w-[140px] rounded-md" />
                </div>
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* Results count skeleton */}
          <Skeleton className="h-4 w-16" />

          {/* Result cards skeleton */}
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border/40 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-5">
                    <Skeleton className="hidden sm:block h-14 w-14 rounded-full" />
                    <Skeleton className="sm:hidden h-11 w-11 rounded-xl" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-4 w-44" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <div className="sm:hidden text-right space-y-1">
                      <Skeleton className="h-5 w-10 ml-auto" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                    <Skeleton className="h-5 w-5" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-8 w-24 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        // Biomarkers Tab Skeleton
        <>
          {/* Health Stats Card skeleton - matches HealthStatsCard */}
          <div className="max-w-xs">
            <Card className="border border-border/40">
              <CardContent className="p-6 flex flex-col items-center">
                {/* Circular ring skeleton */}
                <Skeleton className="h-[100px] w-[100px] rounded-full" />

                {/* Stats skeleton */}
                <div className="mt-4 space-y-2 w-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between",
                        i === 3 && "pt-1 border-t border-border/40",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-3.5 w-3.5 rounded" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-3">
              <Card className="border border-border/40">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-4">
                        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48 hidden sm:block" />
                        </div>
                        <Skeleton className="h-8 w-16 hidden lg:block" />
                        <div className="text-right space-y-1">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12 hidden sm:block" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2 hidden lg:block">
              <Card className="border border-border/40">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-32 mx-auto" />
                    <Skeleton className="h-10 w-20 mx-auto" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default History;
