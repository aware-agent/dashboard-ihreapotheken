import type { BioAgeData } from "@/types/bioAge";
import { BioAgeGauge } from "@/components/shared/BioAgeGauge";
import { useLocale } from "@/hooks/useLocale";
import { formatShortDate } from "@/lib/dateUtils";

interface BioAgeSummaryProps {
  data: BioAgeData["bioAge"];
  size?: "default" | "large";
  className?: string;
}

export function BioAgeSummary({
  data,
  size = "default",
  className,
}: BioAgeSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <BioAgeGauge
        bioAge={data.bioAge}
        chronologicalAge={data.ageAtBloodDraw}
        size={size}
        showDescription={true}
      />

      {/* Test date */}
      <p className="caption-sm text-muted-foreground mt-2">
        {t("common.tested")} {formatShortDate(data.dateOfBloodDraw, locale)}
      </p>
    </div>
  );
}
