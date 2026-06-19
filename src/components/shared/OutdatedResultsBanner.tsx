import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestTube, Clock } from "lucide-react";
import { differenceInMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { useLocale } from "@/hooks/useLocale";

interface OutdatedResultsBannerProps {
  lastTestDate: string | Date;
  className?: string;
}

export function OutdatedResultsBanner({
  lastTestDate,
  className,
}: OutdatedResultsBannerProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  const date = new Date(lastTestDate);
  const monthsAgo = differenceInMonths(new Date(), date);
  const { t } = useLocale();

  // Only show if results are 6+ months old
  if (monthsAgo < 6) {
    return null;
  }

  return (
    <Card
      className={cn("border border-[#c0d8ec] bg-[#FDEAEA]", className)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-[#b8e094]">
              <Clock className="h-5 w-5 text-[#5a7a8a]" />
            </div>
            <div>
              <p className="caption-md text-foreground">
                {t("common.yourResultsAreALittleOutOfDate")}
              </p>
              <p className="body-sm text-muted-foreground">
                {t("common.yourLastTestWas").replace("{monthsAgo}", String(monthsAgo))}
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-[#2F2F2F] hover:bg-[#2F2F2F]/90 text-white shrink-0"
          >
            <a
              href={userShopUrl.toString()}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {t("common.bookTest")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline variant for tighter spaces
interface OutdatedResultsInlineProps {
  lastTestDate: string | Date;
  className?: string;
}

export function OutdatedResultsInline({
  lastTestDate,
  className,
}: OutdatedResultsInlineProps) {
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  const date = new Date(lastTestDate);
  const monthsAgo = differenceInMonths(new Date(), date);

  // Only show if results are 6+ months old
  if (monthsAgo < 6) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-[#b8e094] border border-[#b8e094]",
        className,
      )}
    >
      <Clock className="h-4 w-4 text-[#5a7a8a] shrink-0" />
      <span className="body-sm text-[#5a7a8a] flex-1">
        Results are {monthsAgo} months old
      </span>
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="text-[#5a7a8a] hover:text-[#2F2F2F] hover:bg-[#b8e094] h-7 px-2"
      >
        <a
          href={userShopUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book test
        </a>
      </Button>
    </div>
  );
}
