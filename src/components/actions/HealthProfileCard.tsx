import { ChevronRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";

interface HealthProfileCardProps {
  progress: number;
  isLoading?: boolean;
  className?: string;
  /** Where to return after completing the health profile flow */
  returnTo?: "actions" | "profile";
}

export function HealthProfileCard({
  progress,
  isLoading,
  className,
  returnTo = "actions",
}: HealthProfileCardProps) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const isComplete = progress === 100;

  const handleClick = () => {
    // const fromParam = returnTo !== "actions" ? `?from=${returnTo}` : "";
    navigate({ to: `/actions/health-profile` });
  };

  if (isLoading) {
    return (
      <Card className={cn("border-0 shadow-none", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-0 shadow-none cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group",
        className,
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Circular Progress Ring */}
          <ProgressRing progress={progress} size={64} strokeWidth={5} />

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="title-sm text-foreground">
              {isComplete
                ? t("healthProfile.yourProfile") || "Your health profile"
                : t("healthProfile.completeProfile") ||
                  "Complete your health profile"}
            </h3>
            <p className="caption-md text-muted-foreground">
              {isComplete
                ? t("healthProfile.viewOrUpdate") ||
                  "View or update your answers"
                : t("healthProfile.completeDesc") ||
                  "The more we know, the more we can tailor your plan to your needs."}
            </p>
          </div>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Simple progress ring for this card
function ProgressRing({
  progress,
  size,
  strokeWidth,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--hm-optimal100))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Center percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{progress}%</span>
      </div>
    </div>
  );
}
