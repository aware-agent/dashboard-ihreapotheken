import { Info } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale } from "@/hooks/useLocale";

export function ActionsInfoDrawer() {
  const isMobile = useIsMobile();
  const { t } = useLocale();

  const content = (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {t("actions.aboutActionsDescription")}
      </p>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works">
          <AccordionTrigger className="text-left">
            {t("actions.howItWorks")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("actions.howItWorksDescription")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="personalization">
          <AccordionTrigger className="text-left">
            {t("actions.howAreRecommendationsPersonalized")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("actions.howAreRecommendationsPersonalizedDescription")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="evidence">
          <AccordionTrigger className="text-left">
            {t("actions.areRecommendationsEvidenceBased")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("actions.areRecommendationsEvidenceBasedDescription")}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-xs text-muted-foreground pt-4 border-t">
        {t("actions.disclaimer")}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
            <span className="sr-only">{t("actions.aboutActions")}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-6 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>{t("actions.whatIsActions")}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
          <span className="sr-only">{t("actions.aboutActions")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("actions.whatIsActions")}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
