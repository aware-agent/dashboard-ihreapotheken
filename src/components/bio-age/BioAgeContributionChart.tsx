import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/hooks/useLocale";
import { formatNumber } from "@/lib/dateUtils";
import { useResults } from "@/hooks/useResults";

interface ContributionItem {
  biomarkerName: string;
  value: number;
  unit: string;
  contribution: number;
}

interface BioAgeContributionChartProps {
  resultId: string;
  contributions: ContributionItem[];
  className?: string;
}
export function BioAgeContributionChart({
  resultId,
  contributions,
  className,
}: BioAgeContributionChartProps) {
  const { data: resultsData } = useResults();
  const { locale, t } = useLocale();

  // Build maps of biomarker code/name -> id from results
  const biomarkerMaps = useMemo(() => {
    const codeToId = new Map<string, string>();
    const nameToId = new Map<string, string>();

    if (resultsData?.results) {
      const result = resultsData.results.find((r) => r.id === resultId);
      if (result) {
        for (const biomarker of result.biomarkers) {
          codeToId.set(biomarker.code, biomarker.id);
          codeToId.set(biomarker.code.toLowerCase(), biomarker.id);
          codeToId.set(biomarker.code.toUpperCase(), biomarker.id);
          // Also store without special characters (e.g., "MCV*" -> "mcv")
          const cleanCode = biomarker.code
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase();
          codeToId.set(cleanCode, biomarker.id);

          // Store by name (for fallback matching)
          nameToId.set(biomarker.name.toLowerCase(), biomarker.id);
        }
      }
      // // Go through all results to find biomarker IDs
      // for (const result of resultsData.results) {
      //   for (const biomarker of result.biomarkers) {
      //     // Store by code (various formats)
      //     codeToId.set(biomarker.code, biomarker.id);
      //     codeToId.set(biomarker.code.toLowerCase(), biomarker.id);
      //     codeToId.set(biomarker.code.toUpperCase(), biomarker.id);
      //     // Also store without special characters (e.g., "MCV*" -> "mcv")
      //     const cleanCode = biomarker.code
      //       .replace(/[^a-zA-Z0-9]/g, "")
      //       .toLowerCase();
      //     codeToId.set(cleanCode, biomarker.id);

      //     // Store by name (for fallback matching)
      //     nameToId.set(biomarker.name.toLowerCase(), biomarker.id);
      //   }
      // }
    }
    return { codeToId, nameToId };
  }, [resultsData]);

  const sortedContributions = contributions;

  // Find max absolute value for scaling
  const maxAbsValue = useMemo(() => {
    return Math.max(...contributions.map((c) => Math.abs(c.contribution)), 1);
  }, [contributions]);

  // Get biomarker ID from code or name
  const getBiomarkerId = (biomarkerName: string): string | null => {
    const { codeToId, nameToId } = biomarkerMaps;

    // Try exact code match first
    if (codeToId.has(biomarkerName)) return codeToId.get(biomarkerName)!;

    // Try lowercase/uppercase
    if (codeToId.has(biomarkerName.toLowerCase()))
      return codeToId.get(biomarkerName.toLowerCase())!;
    if (codeToId.has(biomarkerName.toUpperCase()))
      return codeToId.get(biomarkerName.toUpperCase())!;

    // Try cleaned code (remove underscores, etc.)
    const cleanCode = biomarkerName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (codeToId.has(cleanCode)) return codeToId.get(cleanCode)!;

    // Fallback to name matching
    if (nameToId.has(biomarkerName.toLowerCase()))
      return nameToId.get(biomarkerName.toLowerCase())!;

    return null;
  };

  return (
    <div className={className}>
      {/* Axis labels */}
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="caption-md text-hm-optimal200">
          ← {t("bioAge.younger")}
        </span>
        <span className="caption-md text-hm-moderaterisk200">
          {t("bioAge.older")} →
        </span>
      </div>

      {/* Contribution rows */}
      <div className="space-y-3">
        {sortedContributions.map((item) => {
          const isYounger = item.value > 0;
          const barWidth = (Math.abs(item.value) / maxAbsValue) * 100;
          const formattedValue = `${formatNumber(Math.abs(item.value), locale, 2)}`;
          const biomarkerId = getBiomarkerId(String(item.biomarkerName));

          const content = (
            <>
              {/* Biomarker name */}
              <span className="body-md font-medium text-foreground w-28 shrink-0 whitespace-nowrap">
                {t(
                  `bioAge.${item.biomarkerName.toUpperCase().replace(/[^a-zA-Z0-9]/g, "")}`,
                )}
              </span>

              {/* Bar container with center axis */}
              <div className="flex-1 flex items-center">
                {/* Left side (younger/negative) */}
                <div className="flex-1 flex justify-end">
                  {isYounger && (
                    <div
                      className="h-3 rounded-full bg-hm-optimal100"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>

                {/* Center axis line */}
                <div className="w-px h-5 bg-border mx-1 shrink-0" />

                {/* Right side (older/positive) */}
                <div className="flex-1 flex justify-start">
                  {!isYounger && (
                    <div
                      className="h-3 rounded-full bg-hm-moderaterisk100"
                      style={{ width: `${barWidth}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Contribution value */}
              <span
                className={`caption-md font-bold w-16 text-right shrink-0 ${
                  isYounger ? "text-hm-optimal200" : "text-hm-moderaterisk200"
                }`}
              >
                {formattedValue}
              </span>
            </>
          );

          // If we have a biomarker ID, make it a link
          if (biomarkerId) {
            return (
              <Link
                key={item.biomarkerName}
                to="/biomarkers/$id"
                params={{ id: biomarkerId }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {content}
              </Link>
            );
          }

          // Otherwise, render as non-clickable div
          return (
            <div
              key={item.biomarkerName}
              className="w-full flex items-center gap-3 p-2 rounded-lg"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
