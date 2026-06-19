import { MessageSquare, TrendingDown, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import type { BiomarkerTrendData } from "@/hooks/useBiomarkerTrends";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import { formatNumber, formatNumberAuto } from "@/lib/dateUtils";

interface BiomarkerTileProps {
  biomarker: BiomarkerTrendData;
  foundBiomarkerId?: string;
}

const statusConfig = {
  OPTIMAL: {
    label: "optimal",
    color: "text-hm-optimal200",
    bg: "bg-hm-optimal50",
  },
  NORMAL: {
    label: "normal",
    color: "text-hm-normal200",
    bg: "bg-hm-normal50",
  },
  HIGH: {
    label: "high",
    color: "text-hm-high200",
    bg: "bg-hm-high50",
  },
  LOW: {
    label: "low",
    color: "text-hm-highlow200",
    bg: "bg-hm-highlow50",
  },
  NO_RANGE: {
    label: "noRange",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export function BiomarkerTile({
  biomarker,
  foundBiomarkerId,
}: BiomarkerTileProps) {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const status = statusConfig[biomarker.currentStatus];

  const TrendIcon =
    biomarker.trendDirection === "up"
      ? TrendingUp
      : biomarker.trendDirection === "down"
        ? TrendingDown
        : null;

  const trendColor =
    biomarker.rangeTernary === 0
      ? biomarker.trendDirection === "stable"
        ? "text-muted-foreground"
        : "text-hm-optimal200"
      : biomarker.trendDirection === "stable"
        ? "text-muted-foreground"
        : "text-hm-highlow200";

  const isClickable = !!foundBiomarkerId;

  const handleAskAI = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const contextId = foundBiomarkerId || biomarker.code;
    // Pass simplified biomarker data - prompt will be generated in Companion
    const simplifiedData = {
      id: contextId,
      name: biomarker.name,
      value: biomarker.currentValue,
      unit: biomarker.unit,
      range: biomarker.range,
      biomarkerStatus: biomarker.currentStatus,
    };
    const params = new URLSearchParams({
      contextType: "biomarker",
      contextName: biomarker.name,
      contextId,
      contextData: JSON.stringify(simplifiedData),
    });
    navigate(`/companion?${params.toString()}`);
  };

  const content = (
    <Card
      className={cn(
        "border-border/40 bg-card transition-all duration-200",
        isClickable &&
          "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {biomarker.name}
            </p>
            <span
              className={cn(
                "inline-block text-xs px-2 py-0.5 rounded-full mt-1",
                status.bg,
                status.color,
              )}
            >
              {t(`biomarkerDetail.${status.label}`)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAskAI}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
            title="Ask AI about this biomarker"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">
              {biomarker.currentValue}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              {biomarker.unit}
            </span>
          </div>

          {biomarker.percentageChange !== null && TrendIcon && (
            <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {biomarker.percentageChange > 0 ? "+" : ""}
                {formatNumber(biomarker.percentageChange, locale, 1)}%
              </span>
            </div>
          )}
        </div>

        {biomarker.range[0] !== null && biomarker.range[1] !== null && (
          <p className="text-xs text-muted-foreground mt-2">
            Range: {formatNumberAuto(biomarker.range[0], locale)} -{" "}
            {formatNumberAuto(biomarker.range[1], locale)} {biomarker.unit}
          </p>
        )}
      </CardContent>
    </Card>
  );

  // If we have a foundBiomarkerId, wrap in Link
  if (foundBiomarkerId) {
    return <Link to={`/biomarkers/${foundBiomarkerId}`}>{content}</Link>;
  }

  return content;
}
