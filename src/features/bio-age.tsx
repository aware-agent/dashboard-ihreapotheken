import { Clock, Info, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import BioAgeEmptyIcon from "@/assets/bio-age-empty-icon.svg";
import BookAppointmentBg from "@/assets/book-appointment-bg.jpg";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import {
  BioAgeContributionChart,
  BioAgeProgressChart,
  BioAgeSummary,
} from "@/components/bio-age";
import { PageLayout } from "@/components/PageLayout";
import { AskCompanionButton } from "@/components/shared";
import { ProFeatureGate } from "@/components/shared/ProFeatureGate";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBioAge, useBioAgeHistory } from "@/hooks/useBioAge";
import { useLocale } from "@/hooks/useLocale";
import { useUserProfile } from "@/hooks/useUser";
import { formatNumber } from "@/lib/dateUtils";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { useSearchParams } from "@/hooks/useSearchParams";

// Placeholder for non-members
function BioAgePlaceholder() {
  return (
    <div className="space-y-6">
      {/* Tabs placeholder */}
      <div className="w-full max-w-md mx-auto">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bio Age Card Placeholder */}
        <Card className="border border-border/40">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
            <Skeleton className="w-32 h-32 rounded-full mb-6" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-6" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>

        {/* Key Factors Placeholder */}
        <Card className="border border-border/40">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section Placeholder */}
      <Card className="border border-border/40">
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/30"
              >
                <Skeleton className="h-5 w-5 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Shared empty state component for Bio Age tabs
function BioAgeEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <Card>
      <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
        <img src={BioAgeEmptyIcon} alt="" className="w-14 h-14 mb-6" />
        <h3 className="title-lg text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          {message}
        </p>
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-lg bg-cover bg-center py-8 px-14 flex justify-center"
            style={{ backgroundImage: `url(${BookAppointmentBg})` }}
          >
            <a
              href={userShopUrl.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg font-medium px-4 py-1 text-base bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90 transition-all"
            >
              <span>{t("common.bookTest")}</span>
              <img src={ArrowRightIcon} alt="" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Overview Tab Content
function OverviewTabContent({ hasData }: { hasData: boolean }) {
  const { data: bioAgeData } = useBioAge();
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Bio Age Card - Empty State with Book Test CTA */}
          <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <svg
                width="56"
                height="56"
                viewBox="0 0 52 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-6"
                aria-label="Discover Your Bio Age"
                role="img"
              >
                <circle cx="26" cy="26" r="26" fill="#E2F2FF" />
                <g opacity="0.28">
                  <path
                    d="M30 21C30 23.2091 28.2091 25 26 25C23.7909 25 22 23.2091 22 21C22 18.7909 23.7909 17 26 17C28.2091 17 30 18.7909 30 21Z"
                    fill="#2F2F2F"
                  />
                  <path
                    d="M31 35.3193C31.4 35.3193 35 33.375 35 30.6528C35 29.2918 33.8 28.3365 32.6 28.3196C32 28.3111 31.4 28.514 31 29.0973C30.6 28.514 29.9896 28.3196 29.4 28.3196C28.2 28.3196 27 29.2918 27 30.6528C27 33.375 30.6 35.3193 31 35.3193Z"
                    fill="#2F2F2F"
                  />
                  <path
                    d="M22 29H24.1875V29.2368C24.0661 29.6788 24 30.1519 24 30.6528C24 32.1612 24.5441 33.4302 25.2266 34.4315V35H20C18.8954 35 18 34.1046 18 33C18 30.7909 19.7909 29 22 29Z"
                    fill="#2F2F2F"
                  />
                </g>
                <path
                  d="M24.4023 35H20C18.8954 35 18 34.1046 18 33C18 30.7909 19.7909 29 22 29H23.2148M30 21C30 23.2091 28.2091 25 26 25C23.7909 25 22 23.2091 22 21C22 18.7909 23.7909 17 26 17C28.2091 17 30 18.7909 30 21ZM31 35.3193C30.6 35.3193 27 33.375 27 30.6528C27 29.2918 28.2 28.3196 29.4 28.3196C29.9896 28.3196 30.6 28.514 31 29.0973C31.4 28.514 32 28.3111 32.6 28.3196C33.8 28.3365 35 29.2918 35 30.6528C35 33.375 31.4 35.3193 31 35.3193Z"
                  stroke="#2F2F2F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="title-lg text-foreground mb-2">
                {t("bioAge.discoverBioAge")}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {t("bioAge.discoverBioAgeDesc")}
              </p>
              <div
                className="rounded-lg bg-cover bg-center py-8 px-14 flex justify-center"
                style={{ backgroundImage: `url(${BookAppointmentBg})` }}
              >
                <a
                  href={userShopUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg font-medium px-4 py-1 text-base bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90 transition-all"
                >
                  <span>{t("common.bookTest")}</span>
                  <img src={ArrowRightIcon} alt="" className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* What is Biological Age? */}
          <WhatIsBioAgeCard />
        </div>

        <HowToImproveSection />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bio Age Summary */}
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
            {bioAgeData && <BioAgeSummary data={bioAgeData} size="large" />}
          </CardContent>
        </Card>

        {/* What is Biological Age? */}
        <WhatIsBioAgeCard />
      </div>

      <HowToImproveSection />
    </div>
  );
}

// What is Biological Age card
function WhatIsBioAgeCard() {
  const { t } = useLocale();
  const paragraphs = t("bioAge.whatIsBioAgeDesc").split("\n\n");

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-serif font-normal text-2xl text-[#2F2F2F] mb-4">
          {t("bioAge.whatIsBioAge")}
        </h3>
        <div className="space-y-4 text-muted-foreground text-sm">
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index.toString()}`}>{paragraph}</p>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          <span className="font-bold">{t("bioAge.scientificBasis")}</span>{" "}
          {t("bioAge.paperDate")}{" "}
          <a
            href={t("bioAge.paperLink")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t("bioAge.paperText")}
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

// How to Improve section
function HowToImproveSection() {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <h3 className="font-serif font-normal text-2xl text-[#2F2F2F]">{t("bioAge.howToImprove")}</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#FDEAEA]">
              <Clock className="h-[18px] w-[18px] text-[#5a7a8a]" />
            </div>
            <h4 className="font-serif font-normal text-[#2F2F2F]">
              {t("bioAge.sleepQuality")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("bioAge.sleepQualityDesc")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#FDEAEA]">
              <TrendingUp className="h-[18px] w-[18px] text-[#5a7a8a]" />
            </div>
            <h4 className="font-serif font-normal text-[#2F2F2F]">
              {t("bioAge.exercise")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("bioAge.exerciseDesc")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[#c0d8ec] shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#FDEAEA]">
              <Info className="h-[18px] w-[18px] text-[#5a7a8a]" />
            </div>
            <h4 className="font-serif font-normal text-[#2F2F2F]">
              {t("bioAge.nutrition")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("bioAge.nutritionDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Breakdown Tab Content
function BreakdownTabContent({ hasData }: { hasData: boolean }) {
  const { data: bioAgeData } = useBioAge();
  const { locale, t } = useLocale();

  if (!hasData || !bioAgeData) {
    return (
      <BioAgeEmptyState
        title={t("bioAge.breakdownNotAvailable")}
        message={t("bioAge.breakdownNotAvailableDesc")}
      />
    );
  }

  const isYounger = bioAgeData.bioAge < bioAgeData.yearsOld;
  const absDifference = Math.abs(bioAgeData.bioAge - bioAgeData.yearsOld);

  return (
    <div className="space-y-6">
      {/* Contribution Chart with Summary Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <BioAgeSummary data={bioAgeData} size="default" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-serif font-normal text-2xl text-[#2F2F2F] mb-2">
                {t("bioAge.biomarkersYounger")}{" "}
                <span
                  className={
                    isYounger ? "text-hm-optimal200" : "text-hm-moderaterisk200"
                  }
                >
                  {formatNumber(absDifference, locale, 1)}{" "}
                  {isYounger
                    ? t("bioAge.yearsYounger")
                    : t("bioAge.yearsOlder")}
                </span>
              </h3>
              <p className="body-sm text-muted-foreground">
                {t("bioAge.basedOn")}{" "}
                {formatNumber(bioAgeData.yearsOld, locale, 0)}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-serif font-normal text-xl text-[#2F2F2F] mb-4">
            {t("bioAge.contributingBiomarkers")}
          </h3>
          <p className="body-sm text-muted-foreground mb-6">
            {t("bioAge.contributionChartDesc")}
          </p>
          <BioAgeContributionChart
            resultId={bioAgeData.resultId}
            contributions={Object.entries(bioAgeData.breakDown).map(
              ([key, value]) => ({
                biomarkerName: key,
                value: value,
                unit: "",
                contribution: value,
              }),
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Progress Tab Content
function ProgressTabContent({ hasData }: { hasData: boolean }) {
  const { data: historyData, isLoading } = useBioAgeHistory();
  const { t } = useLocale();

  if (!hasData) {
    return (
      <BioAgeEmptyState
        title={t("bioAge.trackYourProgress")}
        message={t("bioAge.trackYourProgressDesc")}
      />
    );
  }

  const progressData = historyData ?? [];
  return <BioAgeProgressChart data={progressData} isLoading={isLoading} />;
}

// Main Bio Age content
function BioAgeContent({
  companionButton,
}: {
  companionButton: React.ReactNode | undefined;
}) {
  const { data: bioAgeData, isLoading: bioAgeLoading } = useBioAge();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = ["overview", "breakdown", "progress"] as const;
  type TabValue = (typeof validTabs)[number];

  const tabParam = searchParams.tab as
    | "overview"
    | "breakdown"
    | "progress"
    | undefined;
  const currentTab: TabValue =
    tabParam && validTabs.includes(tabParam) ? tabParam : "overview";

  const handleTabChange = (value: string) => {
    if (value === "overview") {
      // Remove tab param for default tab to keep URL clean
      setSearchParams({ tab: "overview" });
    } else {
      setSearchParams({ tab: value });
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="inline-flex h-11 rounded-xl bg-transparent p-1 gap-1 mb-6">
        <TabsTrigger
          value="overview"
          className="rounded-lg px-4 text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background transition-all"
        >
          {t("bioAge.overview")}
        </TabsTrigger>
        <TabsTrigger
          value="breakdown"
          className="rounded-lg px-4 text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background transition-all"
        >
          {t("bioAge.breakdown")}
        </TabsTrigger>
        <TabsTrigger
          value="progress"
          className="rounded-lg px-4 text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-background transition-all"
        >
          {t("bioAge.yourProgress")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTabContent
          hasData={!bioAgeLoading && bioAgeData !== undefined}
        />
      </TabsContent>

      <TabsContent value="breakdown">
        <BreakdownTabContent
          hasData={!bioAgeLoading && bioAgeData !== undefined}
        />
      </TabsContent>

      <TabsContent value="progress">
        <ProgressTabContent
          hasData={!bioAgeLoading && bioAgeData !== undefined}
        />
      </TabsContent>
    </Tabs>
  );
}

export default function BioAge() {
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: bioAgeData, isLoading: bioAgeLoading } = useBioAge();
  const { t } = useLocale();
  const isMember = user?.activeMembershipInfo?.isMember ?? false;

  // Prepare context data for companion - only biomarkers that make user older
  const companionContextData =
    !bioAgeLoading && bioAgeData !== undefined
      ? {
          bioAge: bioAgeData?.bioAge,
          chronologicalAge: bioAgeData?.yearsOld,
          difference: bioAgeData?.ageAcceleration,
          // negativeContributions: Object.entries(bioAgeData.breakDown)
          //   .filter(([_, value]) => value < 0)
          //   .map(([key, value]) => ({
          //     biomarkerName: key,
          //     value: value,
          //     unit: "",
          //     contribution: Math.abs(value),
          //   })),
        }
      : undefined;

  // Header action button - only show when user has bio age data
  const headerAction =
    isMember && !bioAgeLoading && bioAgeData !== undefined ? (
      <AskCompanionButton
        contextType="bioAge"
        context={t("nav.bioAge")}
        contextData={companionContextData}
      />
    ) : undefined;

  return (
    <PageLayout
      title={t("bioAge.title")}
      subtitle={t("bioAge.subtitle")}
      headerActions={headerAction}
      isLoading={userLoading}
      loadingSkeleton={<BioAgePlaceholder />}
    >
      <ProFeatureGate
        isMember={isMember}
        isLoading={userLoading}
        placeholder={<BioAgePlaceholder />}
        featureName="bioAge"
      >
        <BioAgeContent companionButton={headerAction} />
      </ProFeatureGate>
    </PageLayout>
  );
}
