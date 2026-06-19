import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import awareActionsIcon from "@/assets/3d-action-icon.png";

import {
  type ActionCardItem,
  ActionCarousel,
} from "@/components/actions/ActionCarousel";
import { ActionsEmptyState } from "@/components/actions/ActionsEmptyState";
import { ActionsInfoDrawer } from "@/components/actions/ActionsInfoDrawer";
import { HealthProfileCard } from "@/components/actions/HealthProfileCard";
import { ErrorState } from "@/components/ErrorState";
import { PageLayout } from "@/components/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useActions } from "@/hooks/useActions";
import {
  calculateOverallProgress,
  useHealthProfileQuestions,
  useUserHealthProfile,
} from "@/hooks/useHealthProfile";
import { useLocale } from "@/hooks/useLocale";
import { useResults } from "@/hooks/useResults";
import { formatMediumDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import {
  type BffActionCategory,
  mapActionToCardItem,
  normalizeActionsResponse,
} from "@/types/actions";

// Cache for loaded images
const loadedImages = new Set<string>();

// Loading image component with blur effect
function LoadingImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const alreadyLoaded = loadedImages.has(src);
  const [isLoaded, setIsLoaded] = useState(alreadyLoaded);

  const handleLoad = () => {
    loadedImages.add(src);
    setIsLoaded(true);
  };

  if (alreadyLoaded) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute inset-0 rounded-lg overflow-hidden transition-opacity duration-500",
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100",
          className,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-border/60 via-muted/80 to-border/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]" />
      </div>

      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-700 ease-out",
          isLoaded
            ? "opacity-100 blur-0 scale-100"
            : "opacity-0 blur-md scale-[1.02]",
          className,
        )}
        onLoad={handleLoad}
      />

      <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
    </div>
  );
}

export default function Actions() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();

  // Fetch health profile data
  const { data: categories, isLoading: isLoadingQuestions } =
    useHealthProfileQuestions();
  const { data: userProfile, isLoading: isLoadingProfile } =
    useUserHealthProfile();

  // Fetch results to get latest result ID and date
  const { data: resultsData, isLoading: isLoadingResults } = useResults();

  // Calculate health profile progress
  const healthProfileProgress =
    categories && userProfile
      ? calculateOverallProgress(categories, userProfile.healthProfile || [])
      : 0;

  const isProfileComplete = healthProfileProgress === 100;
  const latestResult = resultsData?.results?.[0];
  const latestResultId = latestResult?.id;
  const latestResultDate = latestResult?.date;

  // Fetch actions from BFF - only when profile is complete and we have a result ID
  const {
    data: actionsData,
    isLoading: isLoadingActions,
    error: actionsError,
    refetch: refetchActions,
  } = useActions(latestResultId, {
    enabled: isProfileComplete && !!latestResultId,
  });

  const isHealthProfileLoading = isLoadingQuestions || isLoadingProfile;
  const isDataLoading =
    isLoadingResults ||
    (isProfileComplete && latestResultId && isLoadingActions);

  // Normalize API response to categories format
  const actionCategories: BffActionCategory[] = actionsData
    ? normalizeActionsResponse(actionsData)
    : [];

  // Handle action card click - navigate to detail page
  const handleActionClick = (item: ActionCardItem, categoryId: string) => {
    if (!item.id) return;

    if (categoryId === "test_packages") {
      navigate({ to: `/actions/test-packages/${item.id}` });
    } else {
      navigate({ to: `/actions/${item.id}` });
    }
  };

  // Show loading state
  if (isDataLoading) {
    return (
      <PageLayout title="">
        <ActionsHeader />
        <ActionsSkeleton />
      </PageLayout>
    );
  }

  // Show error state for actions fetch
  if (actionsError && isProfileComplete && latestResultId) {
    return (
      <PageLayout title="">
        <ActionsHeader />
        <ErrorState
          title={t("errors.somethingWentWrong")}
          message={t("actions.couldNotLoadActions")}
          onRetry={() => refetchActions()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="">
      {/* Header with icon and title */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LoadingImage
              src={awareActionsIcon}
              alt=""
              className="w-[100px] h-[110px] md:w-[123px] md:h-[134px]"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Aware <span className="text-[#D32F2F]">Actions</span>
              </h1>
              {latestResultDate && (
                <p className="body-md text-muted-foreground">
                  {formatMediumDate(latestResultDate, locale)}
                </p>
              )}
            </div>
          </div>
          <ActionsInfoDrawer />
        </div>
      </div>

      {/* Health Profile Card - always show */}
      <div className="mb-6">
        <HealthProfileCard
          progress={healthProfileProgress}
          isLoading={isHealthProfileLoading}
        />
      </div>

      {/* Content based on state */}
      {!isProfileComplete ? (
        // Profile incomplete state
        <ActionsEmptyState type="profile-incomplete" />
      ) : !latestResultId ? (
        // No results state
        <ActionsEmptyState type="no-results" />
      ) : actionCategories.length === 0 ? (
        // No actions returned from API
        <div className="text-center py-12">
          <p className="body-md text-muted-foreground">
            {t("actions.noActionsYet")}
          </p>
          <p className="caption-md text-muted-foreground mt-2">
            {t("actions.noActionsDesc")}
          </p>
        </div>
      ) : (
        // Action categories with carousels
        <div className="space-y-8">
          {actionCategories.map((category) => (
            <ActionCarousel
              key={category.id}
              title={getCategoryDisplayName(category.name, t)}
              categoryId={category.id}
              items={category.actions.map(mapActionToCardItem)}
              onItemClick={handleActionClick}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

// Helper to get localized category name
function getCategoryDisplayName(
  name: string,
  t: (key: string) => string,
): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("diet") || normalized.includes("food")) {
    return t("actions.diets");
  }
  if (
    normalized.includes("workout") ||
    normalized.includes("training") ||
    normalized.includes("exercise")
  ) {
    return t("actions.workouts");
  }
  if (normalized.includes("lifestyle")) {
    return t("actions.lifestyleHabits");
  }
  if (normalized.includes("supplement")) {
    return t("actions.supplements");
  }
  if (normalized.includes("test") || normalized.includes("package")) {
    return t("actions.testPackages");
  }

  return name;
}

// Header component for error state
function ActionsHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={awareActionsIcon}
            alt=""
            className="w-[100px] h-[110px] md:w-[123px] md:h-[134px]"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Aware <span className="text-[#D32F2F]">Actions</span>
            </h1>
          </div>
        </div>
        <ActionsInfoDrawer />
      </div>
    </div>
  );
}

// Skeleton Loader
function ActionsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-[100px] h-[110px] rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      {/* Health profile card skeleton */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      {/* Category sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex-shrink-0 w-[280px]">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4 mt-3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
