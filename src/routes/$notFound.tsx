import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { useCookies } from "@/hooks/useCookies";

export const Route = createFileRoute("/$notFound")({
  component: NotFound,
});

function NotFound() {
  const location = useRouterState({ select: (s) => s.location });
  const { isAuthenticated } = useCookies();
  const { t } = useLocale();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-sodium via-background to-bg-magnesium50 flex items-center justify-center p-6">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-foundation-magnesium400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-foundation-blue700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[180px] font-bold leading-none text-foundation-selenium/30 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-foundation-magnesium400 to-foundation-blue700 flex items-center justify-center shadow-lg">
              <Search className="w-10 h-10 text-text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="title-lg text-foreground mb-3">
          {t("common.pageNotFound")}
        </h2>
        <p className="body-lg text-muted-foreground mb-8 max-w-md mx-auto">
          {t("common.pageNotFoundDescription")}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 min-w-[160px]">
            <Link to={isAuthenticated() ? "/dashboard" : "/"}>
              {isAuthenticated() ? (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  {t("common.goToDashboard")}
                </>
              ) : (
                <>
                  <Home className="w-4 h-4" />
                  {t("common.goHome")}
                </>
              )}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 min-w-[160px]"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
