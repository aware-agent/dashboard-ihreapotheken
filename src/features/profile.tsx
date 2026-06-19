import { useUserProfile } from "@/hooks/useUser";

import {
  useHealthProfileQuestions,
  useUserHealthProfile,
  calculateOverallProgress,
} from "@/hooks/useHealthProfile";
import { useLocale } from "@/hooks/useLocale";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMediumDate } from "@/lib/dateUtils";
import { PageLayout } from "@/components/PageLayout";
import { HealthProfileCard } from "@/components/actions/HealthProfileCard";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { ExternalLink } from "lucide-react";
import { env } from "@/config/urls";
// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information Card */}
        <Card className="border-0 rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="py-4 border-b border-border/30 last:border-0"
              >
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Membership & Credits Card */}
        <Card className="border-0 rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-44 mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="py-4 border-b border-border/30 last:border-0"
              >
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account Details Card */}
        <Card className="border-0 rounded-2xl md:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-36 mb-6" />
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="py-4 border-b border-border/30 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:pr-6"
                >
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  badge?: boolean;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  isAwarePro?: boolean;
}

function InfoRow({
  label,
  value,
  badge,
  badgeVariant = "secondary",
  isAwarePro,
}: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="py-4 border-b border-border/30 last:border-0">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {isAwarePro ? (
        <span
          className="text-base font-semibold"
          style={{
            background:
              "linear-gradient(90deg, #FFC970 0%, #FF88BD 26.92%, #8E8AF2 62.02%, #729EFA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AwarePro
        </span>
      ) : badge ? (
        <Badge variant={badgeVariant} className="mt-0.5">
          {value}
        </Badge>
      ) : (
        <p className="text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}

export default function Profile() {
  const { data: user, isLoading, error } = useUserProfile();
  const { t, locale } = useLocale();

  // Health profile data
  const { data: categories, isLoading: isLoadingQuestions } =
    useHealthProfileQuestions();
  const { data: userHealthProfile, isLoading: isLoadingHealthProfile } =
    useUserHealthProfile();

  const fullName = user
    ? [user.givenName, user.familyName].filter(Boolean).join(" ") || "User"
    : "";
  const userInitials = user
    ? `${user.givenName?.charAt(0) || ""}${user.familyName?.charAt(0) || ""}`.toUpperCase() ||
      "U"
    : "";
  const userAge = user ? calculateAge(user.dateOfBirth) : null;
  const isMember = user?.activeMembershipInfo?.isMember;
  const subscriptionEnd = user?.activeMembershipInfo?.subscriptionEndDate;
  const credits = user?.activeMembershipInfo?.credits || [];
  const scanCredits = credits.find((c) => c.serviceName === "scan");

  // Calculate health profile progress
  const healthProfileProgress =
    categories && userHealthProfile
      ? calculateOverallProgress(
          categories,
          userHealthProfile.healthProfile || [],
        )
      : 0;
  const isHealthProfileLoading = isLoadingQuestions || isLoadingHealthProfile;

  const paymentUrl = env.VITE_STRIPE_MEMBERSHIP_URL;

  if (error || (!isLoading && !user)) {
    return (
      <PageLayout title={t("profile.title")} subtitle={t("profile.subtitle")}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("profile.unableToLoad")}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      isLoading={isLoading}
      loadingSkeleton={<ProfileSkeleton />}
    >
      {user && (
        <>
          {/* Profile Header with Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-accent/20 shadow-lg">
              <AvatarImage
                src={user.avatarUrl || user.profilePicture || undefined}
                alt={fullName}
              />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {fullName}
                </h2>
                {isMember && (
                  <span
                    className="text-base font-bold"
                    style={{
                      background:
                        "linear-gradient(90deg, #FFC970 0%, #FF88BD 26.92%, #8E8AF2 62.02%, #729EFA 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    AwarePro
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {user.subtitle ||
                  `${user.sex?.toLowerCase() === "male" ? t("profile.male") : user.sex?.toLowerCase() === "female" ? t("profile.female") : ""}, ${userAge} ${t("profile.yearsOld")}`}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card className="border-0 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("profile.personalInfo")}
                </h3>
                <InfoRow label={t("profile.email")} value={user.email} />
                <InfoRow label={t("profile.phone")} value={user.mobileNumber} />
                <InfoRow
                  label={t("profile.dateOfBirth")}
                  value={
                    user.dateOfBirth
                      ? formatMediumDate(user.dateOfBirth, locale)
                      : null
                  }
                />
                {/* Language Selector Row */}
                <div className="py-4 border-b border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("profile.language")}
                  </p>
                  <LanguageSelector className="-ml-2" />
                </div>
                <InfoRow
                  label={t("profile.sex")}
                  value={
                    user.sex
                      ? user.sex.toLowerCase() === "male"
                        ? t("profile.male")
                        : user.sex.toLowerCase() === "female"
                          ? t("profile.female")
                          : user.sex.charAt(0) + user.sex.slice(1).toLowerCase()
                      : null
                  }
                />
              </CardContent>
            </Card>

            {/* Membership & Credits */}
            <Card className="border-0 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("profile.membershipCredits")}
                </h3>
                <InfoRow
                  label={t("profile.status")}
                  value={isMember ? "AwarePro" : t("profile.freePlan")}
                  badge={!isMember}
                  badgeVariant="secondary"
                  isAwarePro={isMember}
                />
                {subscriptionEnd && (
                  <InfoRow
                    label={t("profile.accessUntil")}
                    value={formatMediumDate(subscriptionEnd, locale)}
                  />
                )}
                {isMember && (
                  <div className="py-4 border-b border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("profile.manageSubscription")}
                    </p>

                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {t("profile.viewBillingDetails")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
                {scanCredits && (
                  <InfoRow
                    label={t("profile.scanCredits")}
                    value={
                      scanCredits.max === -1
                        ? t("profile.unlimited")
                        : `${scanCredits.max - scanCredits.used} ${t("profile.of")} ${scanCredits.max} ${t("profile.remaining")}`
                    }
                  />
                )}
                <InfoRow
                  label={t("profile.currency")}
                  value={user.preferredCurrency}
                />
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card className="border-0 rounded-2xl md:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("profile.accountDetails")}
                </h3>
                <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="py-4 border-b border-border/30 sm:border-b-0 sm:border-r sm:border-r-border/30 sm:pr-6">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("profile.memberSince")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatMediumDate(user.createdAt, locale)}
                    </p>
                  </div>
                  <div className="py-4 border-b border-border/30 sm:border-b-0 sm:border-r sm:border-r-border/30 sm:pr-6 lg:px-6">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("profile.signUpMethod")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {user.signUpMethod?.charAt(0) +
                        user.signUpMethod?.slice(1).toLowerCase()}
                    </p>
                  </div>
                  <div className="py-4 lg:pl-6">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("profile.hasPerformedScan")}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {user.hasPerformedScan
                        ? t("common.yes")
                        : t("profile.notYet")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Profile Card */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t("profile.healthProfile")}
              </h3>
              <HealthProfileCard
                progress={healthProfileProgress}
                isLoading={isHealthProfileLoading}
                returnTo="profile"
              />
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
