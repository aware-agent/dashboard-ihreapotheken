import { useState } from "react";
import { ChevronDown, Check, FlaskConical, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Result, ResultType } from "@/types/results";
import { cn } from "@/lib/utils";
import { ResultTypeBadge } from "@/components/shared";
import { useLocale } from "@/hooks/useLocale";

export type ResultFilterType = "all" | "aware" | "scan";

interface TestResultSwitcherProps {
  results: Result[];
  filter: ResultFilterType;
  onFilterChange: (filter: ResultFilterType) => void;
  className?: string;
}

export function TestResultSwitcher({
  results,
  filter,
  onFilterChange,
  className,
}: TestResultSwitcherProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const getResultTypeLabel = (type: ResultType) => {
    switch (type) {
      case "LAB":
        return "Aware Test";
      case "SCAN":
        return "Scan";
      default:
        return type;
    }
  };

  const isAwareTest = (type: ResultType) => type === "LAB";

  // Count results by type
  const awareCount = results.filter((r) => isAwareTest(r.type)).length;
  const scanCount = results.filter((r) => r.type === "SCAN").length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-1.5 border-border hover:bg-muted hover:border-border",
            className,
          )}
        >
          <span className="text-foreground">
            {filter === "all" && t("history.allResults")}
            {filter === "aware" && t("history.awareTestsOnly")}
            {filter === "scan" && t("history.scansOnly")}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 bg-white border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-muted-foreground">
          {t("history.filterBySource")}
        </DropdownMenuLabel>

        {/* All Results */}
        <DropdownMenuItem
          className={cn(
            "flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted focus:bg-muted",
            filter === "all" && "bg-foundation-manganese",
          )}
          onClick={() => {
            onFilterChange("all");
            setOpen(false);
          }}
        >
          <span className="text-foreground">{t("history.allResults")}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {results.length}
            </span>
            {filter === "all" && (
              <div className="w-5 h-5 rounded-full bg-foundation-magnesium400 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Aware Tests */}
        <DropdownMenuItem
          className={cn(
            "flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted focus:bg-muted",
            filter === "aware" && "bg-foundation-manganese",
          )}
          onClick={() => {
            onFilterChange("aware");
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            <ResultTypeBadge type="LAB" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{awareCount}</span>
            {filter === "aware" && (
              <div className="w-5 h-5 rounded-full bg-foundation-magnesium400 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </DropdownMenuItem>

        {/* Uploads */}
        <DropdownMenuItem
          className={cn(
            "flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted focus:bg-muted",
            filter === "scan" && "bg-foundation-manganese",
          )}
          onClick={() => {
            onFilterChange("scan");
            setOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            <ResultTypeBadge type="SCAN" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{scanCount}</span>
            {filter === "scan" && (
              <div className="w-5 h-5 rounded-full bg-foundation-magnesium400 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
