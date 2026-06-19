import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Result, BiomarkerResult } from "@/types/results";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import { formatShortDate, formatInteger } from "@/lib/dateUtils";

interface WhatChangedProps {
  currentResult: Result;
  previousResult: Result | undefined;
  className?: string;
}

interface BiomarkerChange {
  biomarker: BiomarkerResult;
  previousValue: number | null;
  previousStatus: string | null;
  change: number | null;
  changePercent: number | null;
  improved: boolean | null;
  statusChanged: boolean;
}

export function WhatChanged({
  currentResult,
  previousResult,
  className,
}: WhatChangedProps) {
  const [showAll, setShowAll] = useState(false);
  const { locale, t } = useLocale();

  const changes = useMemo(() => {
    if (!previousResult) return null;

    const biomarkerChanges: BiomarkerChange[] = [];

    for (const current of currentResult.biomarkers) {
      const previous = previousResult.biomarkers.find(
        (b) => b.code === current.code,
      );

      if (previous) {
        const change = current.value - previous.value;
        const changePercent =
          previous.value !== 0
            ? ((current.value - previous.value) / previous.value) * 100
            : null;

        // Determine if the change is an improvement
        const wasOutOfRange =
          previous.biomarkerStatus === "HIGH" ||
          previous.biomarkerStatus === "LOW";
        const isNowInRange =
          current.biomarkerStatus === "OPTIMAL" ||
          current.biomarkerStatus === "NORMAL";
        const wasInRange =
          previous.biomarkerStatus === "OPTIMAL" ||
          previous.biomarkerStatus === "NORMAL";
        const isNowOutOfRange =
          current.biomarkerStatus === "HIGH" ||
          current.biomarkerStatus === "LOW";

        let improved: boolean | null = null;
        if (wasOutOfRange && isNowInRange) improved = true;
        if (wasInRange && isNowOutOfRange) improved = false;

        const statusChanged =
          previous.biomarkerStatus !== current.biomarkerStatus;

        if (
          statusChanged ||
          (changePercent !== null && Math.abs(changePercent) > 5)
        ) {
          biomarkerChanges.push({
            biomarker: current,
            previousValue: previous.value,
            previousStatus: previous.biomarkerStatus,
            change,
            changePercent,
            improved,
            statusChanged,
          });
        }
      }
    }

    // Sort by significance: status changes first, then by change magnitude
    biomarkerChanges.sort((a, b) => {
      if (a.statusChanged && !b.statusChanged) return -1;
      if (!a.statusChanged && b.statusChanged) return 1;
      return Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0);
    });

    // Calculate summary stats
    const improved = biomarkerChanges.filter((c) => c.improved === true).length;
    const declined = biomarkerChanges.filter(
      (c) => c.improved === false,
    ).length;
    const newInRange = currentResult.inRange - previousResult.inRange;
    const newOutOfRange = currentResult.outOfRange - previousResult.outOfRange;

    return {
      allBiomarkerChanges: biomarkerChanges,
      summary: {
        improved,
        declined,
        newInRange,
        newOutOfRange,
        totalChanges: biomarkerChanges.length,
      },
      previousDate: previousResult.date,
    };
  }, [currentResult, previousResult]);

  if (!changes || changes.allBiomarkerChanges.length === 0) {
    return null;
  }

  const previousFormattedDate = formatShortDate(changes.previousDate, locale);

  const visibleChanges = showAll
    ? changes.allBiomarkerChanges
    : changes.allBiomarkerChanges.slice(0, 6);
  const remainingCount = changes.summary.totalChanges - 6;
  const hasMore = remainingCount > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 flex sm:flex-row flex-col sm:items-center items-start justify-between">
        <CardTitle className="title-sm">
          {t("dashboard.whatsChanged")}
        </CardTitle>
        <span className="text-xs text-foreground bg-muted px-2 py-1 rounded-md">
          {t("dashboard.comparedTo")} {previousFormattedDate}
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {changes.summary.improved > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hm-optimal50 text-hm-optimal200 caption-md">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {changes.summary.improved} {t("dashboard.improved")}
              </span>
            </div>
          )}
          {changes.summary.declined > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-hm-highlow50 text-hm-highlow200 caption-md">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>
                {changes.summary.declined} {t("dashboard.needsAttention")}
              </span>
            </div>
          )}
          {changes.summary.newInRange > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E2F2FF] text-[#2F2F2F] caption-md">
              <span>
                +{changes.summary.newInRange} {t("dashboard.nowInRange")}
              </span>
            </div>
          )}
        </div>

        {/* Change details */}
        <div className="flex flex-col gap-1.5">
          {visibleChanges.map((change) => (
            <ChangeRow key={change.biomarker.id} change={change} />
          ))}
        </div>

        {/* Toggle button for more changes */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-1.5 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-border/40 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <span className="caption-md">
              {showAll
                ? t("common.showLess")
                : `+${remainingCount} ${t("common.moreChanges")}`}
            </span>
            {showAll ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeRow({ change }: { change: BiomarkerChange }) {
  const { biomarker, previousValue, changePercent, improved, statusChanged } =
    change;
  const { locale, t } = useLocale();

  const isIncrease = changePercent !== null && changePercent > 0;
  const displayPercent =
    changePercent !== null
      ? formatInteger(Math.abs(changePercent), locale)
      : null;

  return (
    <Link to={`/biomarkers/${biomarker.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border/40 hover:bg-muted/50 transition-colors group animate-fade-in">
        {/* Icon - circular like biomarker icons */}
        {biomarker.biomarkerIcon ? (
          <img
            src={biomarker.biomarkerIcon}
            alt={biomarker.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Name and tags - all in one row */}
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <p className="caption-md text-foreground group-hover:text-primary transition-colors">
            {biomarker.name}
          </p>
          {/* Value change tag - blue */}
          <span className="px-2 py-0.5 rounded-full bg-[#E2F2FF] text-[#0066CC] text-xs font-medium whitespace-nowrap">
            {previousValue} → {biomarker.valueText}
          </span>
          {/* Status tag - show based on current status, not just status change */}
          {improved === true && (
            <span className="px-2 py-0.5 rounded-full bg-hm-optimal50 text-hm-optimal200 text-xs font-medium whitespace-nowrap">
              {t("dashboard.nowInRange")}
            </span>
          )}
          {improved === false && (
            <span className="px-2 py-0.5 rounded-full bg-hm-highlow50 text-hm-highlow200 text-xs font-medium whitespace-nowrap">
              {t("dashboard.needsAttention")}
            </span>
          )}
        </div>

        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M16 8.13867C17.4619 9.20073 18.7713 10.4457 19.8942 11.8408C20.0353 12.016 20.0353 12.2613 19.8942 12.4365C18.7713 13.8316 17.4619 15.0766 16 16.1387"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}
