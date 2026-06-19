import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import { isRefreshing } from "@/lib/qcErrorHandler";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
  compact = false,
}: ErrorStateProps) {
  const { t } = useLocale();

  const displayTitle = title ?? t("errors.somethingWentWrong");
  const displayMessage = message ?? t("errors.couldNotLoadData");

  if (isRefreshing) {
    // don't show error state while refreshing token
    return null;
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive",
          className,
        )}
      >
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{displayMessage}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-destructive/30", className)}>
      <CardContent className="py-12 text-center">
        <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {displayTitle}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {displayMessage}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
