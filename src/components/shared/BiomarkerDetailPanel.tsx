import { useState, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { BiomarkerResult, BiomarkerStatus } from "@/types/results";
import { BiomarkerRangeBar } from "@/components/dashboard/BiomarkerRangeBar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  OptimalTagIcon,
  InRangeTagIcon,
  HighTagIcon,
  LowTagIcon,
  NoDataTagIcon,
} from "@/components/icons/StatusTagIcons";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";

import { useLocale } from "@/hooks/useLocale";

interface BiomarkerDetailPanelProps {
  biomarker: BiomarkerResult;
  testDate?: string;
  className?: string;
}

// Content component shared between panel and drawer
function BiomarkerDetailContent({
  biomarker,
  testDate,
}: {
  biomarker: BiomarkerResult;
  testDate?: string;
}) {
  const { t } = useLocale();
  const statusConfig = getStatusConfig(biomarker.biomarkerStatus);

  // Format date as dd.mm.yyyy
  const formattedDate = testDate
    ? new Date(testDate)
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, ".")
    : null;

  return (
    <>
      {/* Top Row: Status Badge + Date */}
      <div className="flex items-center justify-between mb-8">
        <Badge className={cn(statusConfig.badgeClass)}>
          {statusConfig.tagIcon}
          {statusConfig.label}
        </Badge>
        {formattedDate && (
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        )}
      </div>

      {/* Name & Value - Centered */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {biomarker.name}
        </h2>
        <p className="text-5xl font-bold text-foreground">
          {biomarker.valueText}
        </p>
        <p className="text-muted-foreground mt-1">{biomarker.unit}</p>
      </div>

      {/* Range Visualization */}
      <div className="mb-6">
        <BiomarkerRangeBar
          value={biomarker.value}
          range={biomarker.range}
          optimalRange={biomarker.optimalRange}
          rangeOptimalTernary={biomarker.rangeOptimalTernary}
          unit={biomarker.unit}
          barHeight="sm"
          rangeType={biomarker.rangeType}
        />
      </div>

      {/* Ranges Context Text */}
      <p className="text-center text-sm text-muted-foreground mb-6">
        {t("biomarkerDetail.rangesDefinedForYourProfile")}{" "}
        <Link
          to="/biomarkers/$id"
          params={{
            id: biomarker.id,
          }}
          className="underline font-medium text-foreground"
        >
          {t("biomarkerDetail.learnMore")}
        </Link>
      </p>

      {/* Status Message */}
      <div className={cn("p-4 rounded-xl", statusConfig.bgClass)}>
        <p className="font-semibold text-foreground mb-1">
          {statusConfig.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {statusConfig.description}
        </p>
      </div>

      {/* View Full Details Link */}
      <Link
        to="/biomarkers/$id"
        params={{
          id: biomarker.id,
        }}
        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors text-sm font-medium"
      >
        {t("biomarkerDetail.seeFullProgressOverTime")}
        <ArrowRightIcon size={16} />
      </Link>
    </>
  );
}

// Desktop panel version
export function BiomarkerDetailPanel({
  biomarker,
  className,
}: BiomarkerDetailPanelProps) {
  return (
    <Card
      key={biomarker.id}
      className={cn(
        "border-border/50 shadow-sm sticky top-20 animate-fade-in",
        className,
      )}
    >
      <CardContent className="p-6">
        <BiomarkerDetailContent biomarker={biomarker} />
      </CardContent>
    </Card>
  );
}

// Empty state for no selection
export function BiomarkerDetailPanelEmpty({
  className,
}: {
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardContent className="py-12 text-center text-muted-foreground">
        Select a biomarker to view details
      </CardContent>
    </Card>
  );
}

// Mobile drawer version with swipe support
interface BiomarkerDetailDrawerProps {
  biomarker: BiomarkerResult | null;
  biomarkers?: BiomarkerResult[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (biomarker: BiomarkerResult) => void;
}

export function BiomarkerDetailDrawer({
  biomarker,
  biomarkers = [],
  open,
  onOpenChange,
  onNavigate,
}: BiomarkerDetailDrawerProps) {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  );
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentIndex = biomarker
    ? biomarkers.findIndex((b) => b.id === biomarker.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < biomarkers.length - 1;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && hasNext) {
        // Swiped left - go to next
        setSwipeDirection("left");
        setTimeout(() => {
          onNavigate?.(biomarkers[currentIndex + 1]);
          setSwipeDirection(null);
        }, 150);
      } else if (diff < 0 && hasPrev) {
        // Swiped right - go to previous
        setSwipeDirection("right");
        setTimeout(() => {
          onNavigate?.(biomarkers[currentIndex - 1]);
          setSwipeDirection(null);
        }, 150);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [biomarkers, currentIndex, hasNext, hasPrev, onNavigate]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setSwipeDirection("right");
      setTimeout(() => {
        onNavigate?.(biomarkers[currentIndex - 1]);
        setSwipeDirection(null);
      }, 150);
    }
  }, [biomarkers, currentIndex, hasPrev, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setSwipeDirection("left");
      setTimeout(() => {
        onNavigate?.(biomarkers[currentIndex + 1]);
        setSwipeDirection(null);
      }, 150);
    }
  }, [biomarkers, currentIndex, hasNext, onNavigate]);

  if (!biomarker) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            {/* Navigation arrows */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-opacity",
                hasPrev ? "opacity-100" : "opacity-30 cursor-not-allowed",
              )}
              onClick={goToPrev}
              disabled={!hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <DrawerTitle className="text-lg font-semibold">
              {biomarkers.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {currentIndex + 1} / {biomarkers.length}
                </span>
              )}
            </DrawerTitle>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-opacity",
                hasNext ? "opacity-100" : "opacity-30 cursor-not-allowed",
              )}
              onClick={goToNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Swipeable content area */}
        <div
          ref={contentRef}
          className={cn(
            "p-6 overflow-y-auto transition-transform duration-150",
            swipeDirection === "left" && "animate-slide-out-left",
            swipeDirection === "right" && "animate-slide-out-right",
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <BiomarkerDetailContent biomarker={biomarker} />

          {/* Swipe hint */}
          {biomarkers.length > 1 && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              Swipe left or right to navigate
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Responsive wrapper that automatically uses drawer on mobile
interface ResponsiveBiomarkerDetailProps {
  biomarker: BiomarkerResult | null;
  biomarkers?: BiomarkerResult[];
  onClose?: () => void;
  onNavigate?: (biomarker: BiomarkerResult) => void;
  className?: string;
}

export function ResponsiveBiomarkerDetail({
  biomarker,
  biomarkers = [],
  onClose,
  onNavigate,
  className,
}: ResponsiveBiomarkerDetailProps) {
  const isMobile = useIsMobile();

  // Wait for isMobile to be determined (not undefined)
  // This prevents the drawer from opening during the initial hydration
  if (isMobile === undefined) {
    return null;
  }

  // On mobile, only render the drawer - it controls its own open state based on biomarker selection
  // The drawer only opens when biomarker is explicitly selected (not on initial page load)
  if (isMobile === true) {
    // Don't render anything if no biomarker selected on mobile
    if (!biomarker) return null;

    return (
      <BiomarkerDetailDrawer
        biomarker={biomarker}
        biomarkers={biomarkers}
        open={true}
        onOpenChange={(open) => {
          if (!open && onClose) onClose();
        }}
        onNavigate={onNavigate}
      />
    );
  }

  // On desktop, show as a panel
  if (!biomarker) {
    return <BiomarkerDetailPanelEmpty className={className} />;
  }

  return <BiomarkerDetailPanel biomarker={biomarker} className={className} />;
}

function getStatusConfig(status: BiomarkerStatus) {
  const { t } = useLocale();

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
        title: t("biomarkerDetail.greatJob"),
        description: t("biomarkerDetail.greatJobDescription"),
      };
    case "NORMAL":
      return {
        label: t("biomarkerDetail.inRange"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-inrange-bg))] text-[hsl(var(--status-inrange-text))]`,
        bgClass: "bg-[hsl(var(--status-inrange-bg))]",
        tagIcon: <InRangeTagIcon />,
        title: t("biomarkerDetail.normal"),
        description: t("biomarkerDetail.lookingGoodDescription"),
      };
    case "HIGH":
      return {
        label: t("biomarkerDetail.high"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-attention-bg))] text-[hsl(var(--status-attention-text))]`,
        bgClass: "bg-[hsl(var(--status-attention-bg))]",
        tagIcon: <HighTagIcon />,
        title: t("biomarkerDetail.aboveRange"),
        description: t("biomarkerDetail.aboveRangeDescription"),
      };
    case "LOW":
      return {
        label: t("biomarkerDetail.low"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-attention-bg))] text-[hsl(var(--status-attention-text))]`,
        bgClass: "bg-[hsl(var(--status-attention-bg))]",
        tagIcon: <LowTagIcon />,
        title: t("biomarkerDetail.belowRange"),
        description: t("biomarkerDetail.belowRangeDescription"),
      };
    default:
      return {
        label: t("biomarkerDetail.noRange"),
        badgeClass: `${badgeBase} bg-[hsl(var(--status-nodata-bg))] text-[hsl(var(--status-nodata-text))]`,
        bgClass: "bg-[hsl(var(--status-nodata-bg))]",
        tagIcon: <NoDataTagIcon />,
        title: t("biomarkerDetail.noRange"),
        description: t("biomarkerDetail.noRangeDescription"),
      };
  }
}
