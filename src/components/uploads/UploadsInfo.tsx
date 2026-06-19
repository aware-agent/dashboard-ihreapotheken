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

export function UploadsInfo() {
  const isMobile = useIsMobile();
  const { t } = useLocale();

  const content = (
    <div className="space-y-6">
      <p className="text-muted-foreground mt-2">{t("uploads.initialInfo")}</p>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="fileFormats">
          <AccordionTrigger className="text-left">
            {t("uploads.fileFormats")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("uploads.fileFormatDescription")}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fileSize">
          <AccordionTrigger className="text-left">
            {t("uploads.fileSize")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("uploads.fileSizeDescription")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="unitsAndReferenceRanges">
          <AccordionTrigger className="text-left">
            {t("uploads.unitsAndReferenceRanges")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("uploads.unitsAndReferenceRangesDescription")}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="officialSources">
          <AccordionTrigger className="text-left">
            {t("uploads.officialSources")}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {t("uploads.officialSourcesDescription")}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
            <span className="sr-only">{t("uploads.initialInfo")}</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-6 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle></DrawerTitle>
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
          <span className="sr-only">{t("uploads.initialInfo")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">
          {t("uploads.initialInfo")}
        </DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
