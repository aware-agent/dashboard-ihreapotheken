import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale } from "@/hooks/useLocale";
import { getBiomarkerIcon } from "@/lib/biomarkerIcons";
import { EXTERNAL_URLS } from "@/config/urls";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import type { BffGroupedActionItem } from "@/types/actions";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

interface TestPackageDetailDrawerProps {
  testPackage: BffGroupedActionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Biomarker row item
function BiomarkerRow({
  code,
  name,
  onClick,
}: {
  code: string;
  name: string;
  onClick?: () => void;
}) {
  const icon = getBiomarkerIcon(code);

  return (
    <button
      className="flex items-center gap-3 w-full py-3 text-left hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
        {icon ? (
          <img src={icon} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">{code.charAt(0)}</span>
        )}
      </div>
      <span className="title-sm text-foreground flex-1">{name}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

export function TestPackageDetailDrawer({
  testPackage,
  open,
  onOpenChange,
}: TestPackageDetailDrawerProps) {
  const { t } = useLocale();
  const isMobile = useIsMobile();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();
  if (!testPackage) return null;

  // Extract data - these may come from API
  const biomarkers = (testPackage as any).biomarkers || [];
  const triggeringBiomarkers = testPackage.triggeringBiomarkers || [];
  const testName = testPackage.title;
  const testDescription = testPackage.description;
  const testImage = testPackage.image;
  const biomarkerCount = biomarkers.length || triggeringBiomarkers.length || 0;

  // Get background color based on package type (could be customized based on API)
  const bgColor = "bg-pink-100"; // Default pink for heart-related tests

  const handleBookNow = () => {
    window.open(userShopUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Hero section with icon */}
      <div
        className={`relative h-[280px] -mx-6 -mt-6 md:mx-0 md:mt-0 md:rounded-t-xl ${bgColor} flex items-center justify-center`}
      >
        {testImage ? (
          <img
            src={testImage}
            alt={testName}
            className="h-48 w-auto object-contain"
          />
        ) : (
          <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
            <span className="text-5xl">🫀</span>
          </div>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-full h-10 w-10"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{testName}</h2>
            {testDescription && (
              <p className="body-md text-muted-foreground mt-2">
                {testDescription}
              </p>
            )}
          </div>

          {/* Why this recommendation */}
          {triggeringBiomarkers.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <span className="body-md text-foreground underline">
                  {t("actionDetail.whyThisRecommendation")}
                </span>
                <div className="flex -space-x-2">
                  {triggeringBiomarkers
                    .slice(0, 3)
                    .map((code: string, idx: number) => {
                      const icon = getBiomarkerIcon(code);
                      return icon ? (
                        <img
                          key={idx}
                          src={icon}
                          alt=""
                          className="w-8 h-8 rounded-full border-2 border-background"
                        />
                      ) : (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-amber-100 border-2 border-background flex items-center justify-center"
                        >
                          <span className="text-xs">●</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Biomarkers in this test */}
          {(biomarkers.length > 0 || biomarkerCount > 0) && (
            <div>
              <h3 className="title-md text-foreground mb-4">
                {t("actionDetail.biomarkersInTest")}
              </h3>
              <div className="divide-y divide-border">
                {biomarkers.length > 0
                  ? biomarkers.map((biomarker: any, idx: number) => (
                      <BiomarkerRow
                        key={idx}
                        code={biomarker.code || biomarker}
                        name={biomarker.name || biomarker}
                      />
                    ))
                  : // Fallback to triggering biomarkers
                    triggeringBiomarkers.map((code: string, idx: number) => (
                      <BiomarkerRow key={idx} code={code} name={code} />
                    ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Fixed bottom CTA */}
      <div className="p-6 pt-4 border-t border-border bg-background">
        <Button
          disabled={isUserShopUrlLoading}
          className="w-full h-14 rounded-xl bg-[#2F2F2F] hover:bg-[#2F2F2F]/90 text-white text-lg font-medium"
          onClick={handleBookNow}
        >
          {t("actionDetail.bookNow")}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] px-6">{content}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{testName}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
