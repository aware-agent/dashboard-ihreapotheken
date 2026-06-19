import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import awareCompanionIcon from "@/assets/aware-companion-button-icon.png";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { env } from "@/config/urls";

interface AskCompanionButtonProps {
  prompt?: string;
  context?: string;
  contextType?: "healthZone" | "biomarker" | "general" | "bioAge";
  contextId?: string;
  contextData?: unknown;
  className?: string;
}

export function AskCompanionButton({
  context,
  contextType = "general",
  contextId,
  contextData,
  className,
}: AskCompanionButtonProps) {
  if (!env.VITE_COMPANION_ENABLED) {
    return null;
  }

  const navigate = useNavigate();
  const { t } = useLocale();

  const handleClick = () => {
    const params = new URLSearchParams();

    // Only pass contextType and contextId - prompt will be generated in Companion
    if (contextType !== "general") {
      params.set("contextType", contextType);
    }
    if (contextId) {
      params.set("contextId", contextId);
    }
    if (context) {
      params.set("contextName", context);
    }
    // Pass simplified contextData with only essential fields
    if (contextData && typeof contextData === "object") {
      const simplified = {
        id: (contextData as Record<string, unknown>).id,
        name: (contextData as Record<string, unknown>).name,
        value: (contextData as Record<string, unknown>).value,
        valueText: (contextData as Record<string, unknown>).valueText,
        unit: (contextData as Record<string, unknown>).unit,
        range: (contextData as Record<string, unknown>).range,
        biomarkerStatus: (contextData as Record<string, unknown>)
          .biomarkerStatus,
      };
      params.set("contextData", JSON.stringify(simplified));
    }

    const queryString = params.toString();
    navigate(`/companion${queryString ? `?${queryString}` : ""}`);
  };

  const getTooltipText = () => {
    if (contextType === "bioAge") {
      return t("companionButton.tooltipBioAge");
    }
    if (contextType === "healthZone") {
      return t("companionButton.tooltipHealthZone").replace(
        "{name}",
        context || "",
      );
    }
    if (contextType === "biomarker") {
      return t("companionButton.tooltipBiomarker").replace(
        "{name}",
        context || "",
      );
    }
    return t("companionButton.tooltipGeneral");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleClick} className={cn(className)}>
            <div className="flex items-center gap-2 bg-black hover:bg-black/90 transition-colors rounded-xl pl-1 pr-3 py-1">
              <img
                src={awareCompanionIcon}
                alt=""
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-white font-medium text-sm">
                {t("companionButton.askAwareCompanion")}
              </span>
              <img src={ArrowRightIcon} alt="" className="w-4 h-4" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
