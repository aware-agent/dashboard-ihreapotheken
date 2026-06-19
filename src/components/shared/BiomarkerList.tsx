import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, Filter, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BiomarkerResult, Result, BiomarkerStatus } from "@/types/results";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/statusUtils";
import { BiomarkerVerticalRangeBar } from "@/components/dashboard/BiomarkerVerticalRangeBar";
import { getBiomarkerIcon } from "@/lib/biomarkerIcons";
import { StatusIndicatorOverlay } from "@/components/shared/StatusIndicatorIcon";
import { useLocale } from "@/hooks/useLocale";

type FilterStatus = "all" | "optimal" | "normal" | "attention";

interface BiomarkerListProps {
  biomarkers: BiomarkerResult[];
  allResults: Result[];
  showSearch?: boolean;
  showFilter?: boolean;
  className?: string;
  // Selection mode: when provided, clicking selects instead of navigating
  selectedBiomarkerId?: string;
  onSelect?: (biomarker: BiomarkerResult) => void;
}

export function BiomarkerList({
  biomarkers,
  allResults,
  showSearch = true,
  showFilter = true,
  className,
  selectedBiomarkerId,
  onSelect,
}: BiomarkerListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const { t } = useLocale();

  const filteredBiomarkers = useMemo(() => {
    return biomarkers.filter((biomarker) => {
      // Search filter
      const matchesSearch =
        biomarker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        biomarker.code.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "optimal") {
        matchesStatus = biomarker.biomarkerStatus === "OPTIMAL";
      } else if (statusFilter === "normal") {
        matchesStatus =
          biomarker.biomarkerStatus === "NORMAL" ||
          biomarker.biomarkerStatus === "OPTIMAL";
      } else if (statusFilter === "attention") {
        matchesStatus =
          biomarker.biomarkerStatus === "HIGH" ||
          biomarker.biomarkerStatus === "LOW";
      }

      return matchesSearch && matchesStatus;
    });
  }, [biomarkers, searchQuery, statusFilter]);

  const hasFilters = searchQuery || statusFilter !== "all";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Controls */}
      {(showSearch || showFilter) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search biomarkers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {showFilter && (
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as FilterStatus)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="optimal">
                  {t("common.optimalOnly")}
                </SelectItem>
                <SelectItem value="normal">{t("common.inRange")}</SelectItem>
                <SelectItem value="attention">
                  {t("common.needsAttention")}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Results count when filtered */}
      {hasFilters && (
        <p className="caption-sm text-muted-foreground">
          Showing {filteredBiomarkers.length} of {biomarkers.length} biomarkers
        </p>
      )}

      {/* Biomarkers List */}
      <Card className="border border-border/40 overflow-hidden">
        <CardContent className="p-0 overflow-hidden">
          {filteredBiomarkers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No biomarkers match your search criteria.
            </div>
          ) : (
            <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto overflow-x-hidden">
              {filteredBiomarkers.map((biomarker) => (
                <BiomarkerListItem
                  key={biomarker.id}
                  biomarker={biomarker}
                  allResults={allResults}
                  isSelected={selectedBiomarkerId === biomarker.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BiomarkerListItemProps {
  biomarker: BiomarkerResult;
  allResults: Result[];
  isSelected?: boolean;
  onSelect?: (biomarker: BiomarkerResult) => void;
}

function BiomarkerListItem({
  biomarker,
  allResults,
  isSelected,
  onSelect,
}: BiomarkerListItemProps) {
  const config = getStatusConfig(biomarker.biomarkerStatus);
  const [min, max] = biomarker.range;

  const content = (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-bg-sodium transition-colors group overflow-hidden",
        isSelected && "bg-bg-sodium",
      )}
    >
      {/* Top row on mobile: Icon + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon with status indicator */}
        <div className="relative flex-shrink-0">
          {getBiomarkerIcon(
            biomarker.code,
            biomarker.biomarkerIcon || undefined,
          ) ? (
            <div className="relative w-10 h-10 sm:w-11 sm:h-11">
              <img
                src={getBiomarkerIcon(
                  biomarker.code,
                  biomarker.biomarkerIcon || undefined,
                )}
                alt={biomarker.name}
                className="w-full h-full object-cover rounded-full"
              />
              <StatusIndicatorOverlay status={biomarker.biomarkerStatus} />
            </div>
          ) : (
            <div className="relative w-10 h-10 sm:w-11 sm:h-11">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <StatusIndicatorOverlay status={biomarker.biomarkerStatus} />
            </div>
          )}
        </div>

        {/* Name & Code */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="caption-lg text-foreground truncate group-hover:text-primary transition-colors">
              {biomarker.name}
            </p>
            <span className="font-mono caption-sm bg-bg-sodium px-1.5 py-0.5 rounded text-muted-foreground hidden sm:inline flex-shrink-0">
              {biomarker.code}
            </span>
          </div>
        </div>
      </div>

      {/* Range bar - full width on mobile, fixed width on desktop */}
      <div className="flex-shrink-0 pl-[52px] sm:pl-0">
        <BiomarkerVerticalRangeBar
          value={biomarker.value}
          range={[min, max]}
          optimalRange={biomarker.optimalRange}
          rangeOptimalTernary={biomarker.rangeOptimalTernary}
          unit={biomarker.unit}
          height={36}
          rangeType={biomarker.rangeType}
        />
      </div>
    </div>
  );

  // If onSelect is provided, use button for selection mode
  if (onSelect) {
    return (
      <button onClick={() => onSelect(biomarker)} className="w-full text-left">
        {content}
      </button>
    );
  }

  // Otherwise, use Link for navigation mode
  return (
    <Link
      to="/biomarkers/$id"
      params={{
        id: biomarker.id,
      }}
    >
      {content}
    </Link>
  );
}
