import { Link } from "@tanstack/react-router";
import { Calendar, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import BookAppointmentBg from "@/assets/book-appointment-bg.jpg";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

interface ActionsEmptyStateProps {
  type: "no-results" | "profile-incomplete";
}

export function ActionsEmptyState({ type }: ActionsEmptyStateProps) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  if (type === "profile-incomplete") {
    return (
      <Card className="border-0 shadow-none rounded-2xl bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="body-md text-muted-foreground">
            {t("actions.completeProfileForActions")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // no-results state
  return (
    <Card className="border-0 shadow-none rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${BookAppointmentBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
        </div>
        <div className="p-6 -mt-20 relative z-10 text-center">
          <h3 className="title-md text-foreground mb-2">
            {t("actions.noResultsTitle") || "Get Personalized Actions"}
          </h3>
          <p className="body-sm text-muted-foreground mb-6">
            {t("actions.noResultsForActions")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="gap-2 rounded-xl"
              disabled={isUserShopUrlLoading}
            >
              <a
                href={userShopUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar className="h-4 w-4" />
                {t("common.bookTest")}
              </a>
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-xl">
              <Link to="/uploads">
                <Upload className="h-4 w-4" />
                {t("common.uploadResults")}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
