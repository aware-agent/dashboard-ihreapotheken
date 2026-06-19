import { useState, useEffect, useMemo } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResults } from "@/hooks/useResults";
import { useHealthZones } from "@/hooks/useHealthZones";
import { useResultActions } from "@/hooks/useResultActions";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { useLocale } from "@/hooks/useLocale";
import { formatFullDate } from "@/lib/dateUtils";
import { ActionsCard } from "@/components/dashboard/ActionsCard";
import { WhatsNextSection } from "@/components/dashboard/WhatsNextSection";
import { WhatChanged } from "@/components/dashboard/WhatChanged";
import { HealthStatsCard } from "@/components/dashboard/HealthStatsCard";
import { PageLayout } from "@/components/PageLayout";
import {
  BiomarkerList,
  ResponsiveBiomarkerDetail,
  ResultTypeBadge,
} from "@/components/shared";
import { BiomarkerResult } from "@/types/results";
import { useParams } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";

export default function ResultDetail() {
  const { id } = useParams({ strict: false }) as {
    id: string;
  };
  const navigate = useNavigate();
  const { data, isLoading, error } = useResults();
  const { data: healthZonesData } = useHealthZones();
  const { data: actionsData, isLoading: actionsLoading } = useResultActions(id);
  const { downloadPdf, isDownloading } = usePdfDownload();
  const { t, locale } = useLocale();
  const [selectedBiomarker, setSelectedBiomarker] =
    useState<BiomarkerResult | null>(null);

  const result = data?.results.find((r) => r.id === id);

  // Find the first result before the current result
  const previousResult = data?.results.find(
    (r) => r.date && new Date(r.date) < new Date(result?.date || ""),
  );

  const biomarkers = result?.biomarkers || [];

  // Auto-select first biomarker when data loads (desktop only)
  // Don't rely on useIsMobile() here because it returns false during initial mount.
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && biomarkers.length > 0 && !selectedBiomarker) {
      setSelectedBiomarker(biomarkers[0]);
    }
  }, [biomarkers, selectedBiomarker]);

  const dateSelector = useMemo(() => {
    if (data?.results && data?.results.length > 1) {
      return (
        <div className="text-center">
          <Select
            value={id}
            onValueChange={(v) => {
              navigate({
                to: "/results/$id",
                params: { id: v },
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-inherit">
              <SelectValue placeholder={t("common.selectResult")} />
            </SelectTrigger>
            <SelectContent>
              {data?.results.map((result) => (
                <SelectItem key={result.id} value={result.id}>
                  {format(new Date(result.date), "d MMMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return null;
  }, [data?.results, id, navigate, t]);

  const handleDownload = () => {
    if (!result) return;
    const dateStr = new Date(result.date).toISOString().split("T")[0];
    downloadPdf(result.id, `blood-test-${dateStr}.pdf`);
  };

  if (error || (!isLoading && !result)) {
    return (
      <PageLayout title={t("resultDetail.notFound")}>
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="title-lg text-foreground mb-2">
            {t("resultDetail.notFound")}
          </h2>
          <p className="text-muted-foreground">
            {t("resultDetail.notFoundDesc")}
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-3">
          <span>{t("resultDetail.title")}</span>
          {result && <ResultTypeBadge type={result.type} />}
        </div>
      }
      subtitle={dateSelector}
      isLoading={isLoading}
      loadingSkeleton={<ResultDetailSkeleton />}
    >
      {result && (
        <>
          {/* Top Section: Health Stats Card with Health Zones */}
          <section className="mb-6">
            <HealthStatsCard
              packages={data?.packages || []}
              bookedPackageCodes={result.bookedPackageCodes}
              totalMarkers={biomarkers.length}
              inRange={result.inRange}
              outOfRange={result.outOfRange}
              lastTestDate={result.date}
              resultId={result.id}
              healthZones={result.healthZones.map((zone) => {
                // Get total biomarkers from healthZonesData
                const fullZoneData = healthZonesData?.healthZones.find(
                  (hz) => hz.id === zone.id,
                );
                return {
                  ...zone,
                  totalMarkers: fullZoneData?.knownBiomarkers.length,
                };
              })}
            />
          </section>

          {/* What's Next Section */}
          <WhatsNextSection
            resultId={result.id}
            onDownloadPdf={handleDownload}
            isDownloading={isDownloading}
            className="mb-6"
          />

          {/* What Changed - Comparison with previous result */}
          {previousResult && (
            <WhatChanged
              currentResult={result}
              previousResult={previousResult}
            />
          )}

          {/* Recommendations - Horizontal Layout */}
          <ActionsCard
            actions={actionsData?.actions || []}
            isLoading={actionsLoading}
            layout="horizontal"
            className="mb-6"
          />

          {/* Biomarkers - Full Width Split View (like Biomarkers page) */}
          <section>
            <h2 className="title-md text-foreground mb-4">
              {t("resultDetail.allBiomarkers")} ({biomarkers.length})
            </h2>
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

              {/* Detail Panel - Hidden on mobile via CSS */}
              <div className="lg:col-span-2 hidden lg:block">
                <ResponsiveBiomarkerDetail
                  biomarker={selectedBiomarker}
                  biomarkers={biomarkers}
                  onClose={() => setSelectedBiomarker(null)}
                  onNavigate={setSelectedBiomarker}
                />
              </div>
            </div>
          </section>

          {/* Mobile Drawer */}
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
    </PageLayout>
  );
}

// Loading Skeleton
function ResultDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* HealthStatsCard Skeleton - Circular Graph */}
      <div className="w-full sm:max-w-xs sm:mx-0">
        <Card className="border border-border/40">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            {/* Ring Skeleton */}
            <Skeleton className="w-[100px] h-[100px] rounded-full" />

            {/* Stats Skeleton */}
            <div className="mt-4 space-y-2 w-full">
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
      </div>

      {/* Health Zones Skeleton - Full Width */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border border-border/40 w-[220px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between mt-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommendations Skeleton - Horizontal */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-20 w-48 rounded-xl flex-shrink-0"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biomarkers - Full Width */}
      <section>
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="border border-border/40">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 hidden lg:block">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  <Skeleton className="h-8 w-40 mx-auto" />
                  <Skeleton className="h-12 w-24 mx-auto" />
                </div>
                <Skeleton className="h-16 w-16 mx-auto rounded-2xl" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
