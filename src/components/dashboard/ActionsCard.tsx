import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Dumbbell,
  FlaskConical,
  Salad,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ResultAction } from "@/types/results";
import { cn } from "@/lib/utils";
import { ChevronArrowIcon } from "@/components/icons/ChevronArrowIcon";
import { useLocale } from "@/hooks/useLocale";
import { useNavigate } from "node_modules/@tanstack/react-router/dist/esm/useNavigate";

interface ActionsCardProps {
  actions: ResultAction[];
  isLoading?: boolean;
  layout?: "vertical" | "horizontal";
  className?: string;
}

// Category display configuration using design system colors
const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  WORKOUTS: {
    label: "workouts",
    icon: Dumbbell,
    color: "text-hz-hormones",
    bgColor: "bg-hz-hormones300",
  },
  TEST_PACKAGES: {
    label: "recommendedTest",
    icon: FlaskConical,
    color: "text-hz-metabolism",
    bgColor: "bg-hz-metabolism300",
  },
  DIETS: {
    label: "dietTips",
    icon: Salad,
    color: "text-hm-optimal200",
    bgColor: "bg-hm-optimal50",
  },
  LIFESTYLE_CHANGES: {
    label: "lifestyleChanges",
    icon: Heart,
    color: "text-hz-kidneys",
    bgColor: "bg-hz-kidneys300",
  },
};

const defaultConfig = {
  label: "recommendations",
  icon: Lightbulb,
  color: "text-hm-moderaterisk200",
  bgColor: "bg-hm-moderaterisk50",
};

export function ActionsCard({
  actions,
  isLoading,
  layout = "vertical",
  className,
}: ActionsCardProps) {
  const isHorizontal = layout === "horizontal";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { t } = useLocale();

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1,
    );
  }, []);

  useEffect(() => {
    if (!isHorizontal) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollability();
    container.addEventListener("scroll", checkScrollability);
    window.addEventListener("resize", checkScrollability);

    return () => {
      container.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [isHorizontal, checkScrollability, actions]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Don't render anything while loading - let page skeleton handle it
  if (isLoading) {
    return null;
  }

  // Hide if no actions
  if (!actions || actions.length === 0) {
    return null;
  }

  // Remove duplicates by code and limit items
  const uniqueActions = actions
    .reduce((acc, action) => {
      if (!acc.find((a) => a.code === action.code)) {
        acc.push(action);
      }
      return acc;
    }, [] as ResultAction[])
    .slice(0, isHorizontal ? 8 : 6);

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="py-4">
        <div className="flex items-center justify-between">
          <h2 className="title-md text-foreground">
            {t("resultDetail.recommendations")}
          </h2>

          {/* Scroll arrows for horizontal layout */}
          {isHorizontal && (canScrollLeft || canScrollRight) && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-opacity",
                  canScrollLeft
                    ? "opacity-100"
                    : "opacity-30 cursor-not-allowed",
                )}
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-opacity",
                  canScrollRight
                    ? "opacity-100"
                    : "opacity-30 cursor-not-allowed",
                )}
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className={cn(
            isHorizontal
              ? "flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth -mr-6 pr-6"
              : "space-y-2",
          )}
          style={
            isHorizontal
              ? { scrollbarWidth: "none", msOverflowStyle: "none" }
              : undefined
          }
        >
          {uniqueActions.map((action) => (
            <ActionItem
              key={action.code}
              action={action}
              compact={isHorizontal}
            />
          ))}
        </div>

        {/* Gradient fade indicators */}
        {isHorizontal && canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        )}
        {isHorizontal && canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}

function ActionItem({
  action,
  compact = false,
}: {
  action: ResultAction;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: `/actions/${action.code}` });
  };

  const config = categoryConfig[action.category] || defaultConfig;
  const Icon = config.icon;

  // Generate description based on triggering indicators
  const getDescription = () => {
    if (action.triggeringIndicators.length === 0) {
      return t("actions.generalHealthRecommendation");
    }
    const biomarkers = action.triggeringIndicators
      .filter((i) => i.isBiomarker)
      .map((i) => i.indicator.replace(/[*#]/g, ""));
    if (biomarkers.length > 0) {
      return `${t("actions.basedOn")}: ${biomarkers.slice(0, compact ? 2 : 3).join(", ")}${
        biomarkers.length > (compact ? 2 : 3) ? "..." : ""
      }`;
    }
    return t("actions.personalizedForYou");
  };

  if (compact) {
    return (
      <div
        className="flex flex-col gap-2 p-4 rounded-2xl bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer min-w-[180px] max-w-[220px] flex-shrink-0"
        onClick={handleClick}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${config.bgColor}`}
        >
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>
        <div className="min-w-0 mt-1">
          <p className="text-sm font-medium text-foreground mb-1">
            {t(`actions.${config.label}`)}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {getDescription()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center ${config.bgColor}`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      </div>
      <div className="min-w-0 mt-1">
        <p className="text-sm font-medium text-foreground mb-1">
          {t(`actions.${config.label}`)}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {getDescription()}
        </p>
      </div>
    </div>
  );
}
