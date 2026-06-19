import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ExternalLink } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

type FeatureName = "dashboard" | "bioAge" | "wearables" | "companion";

interface ProFeatureGateProps {
  isMember: boolean;
  isLoading?: boolean;
  placeholder: ReactNode;
  children: ReactNode;
  featureName?: FeatureName;
}

export function ProFeatureGate({
  isMember,
  isLoading = false,
  placeholder,
  children,
  featureName = "dashboard",
}: ProFeatureGateProps) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  // Show children for members
  if (isMember && !isLoading) {
    return <>{children}</>;
  }

  // Get localized strings based on feature name
  const headline = t(`proFeature.${featureName}.headline` as any);
  const subtext = t(`proFeature.${featureName}.subtext` as any);
  const upgradeButton = t("proFeature.upgradeButton" as any);

  // Show gated placeholder for non-members
  return (
    <div className="relative">
      {/* Placeholder content - blurred and non-interactive */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="opacity-60 grayscale">{placeholder}</div>
      </div>

      {/* Overlay with upsell */}
      <div className="absolute inset-0 flex items-start justify-center bg-background/40">
        <Card className="w-full max-w-md mx-4 shadow-xl">
          <CardContent className="p-8 text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Crown className="h-8 w-8 text-primary" />
            </div>

            {/* Headline */}
            <h2 className="title-lg text-foreground mb-3">{headline}</h2>

            {/* Subtext */}
            <p className="body-sm text-muted-foreground mb-6">{subtext}</p>

            {/* CTA */}
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a
                href={userShopUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {upgradeButton}
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
