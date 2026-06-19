import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import actionsIcon from "@/assets/whats-next/actions-icon.png";
import pdfIcon from "@/assets/whats-next/pdf-icon.png";
import doctorImage from "@/assets/whats-next/doctor-image.png";

interface WhatsNextSectionProps {
  resultId?: string;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
  className?: string;
}

export function WhatsNextSection({
  resultId,
  onDownloadPdf,
  isDownloading = false,
  className,
}: WhatsNextSectionProps) {
  const { t } = useLocale();

  return (
    <section className={className}>
      <h2 className="title-md text-foreground mb-4">{t("whatsNext.title")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Explore Actions Card */}
        <div className="relative bg-white rounded-2xl p-6 overflow-hidden flex flex-col">
          <div className="pr-24">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("whatsNext.exploreActions")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("whatsNext.exploreActionsDesc")}
            </p>
          </div>

          <div className="mt-3">
            <Link to="/actions">
              <Button className="bg-foreground hover:bg-foreground/90 text-background text-sm font-bold px-4 rounded-lg h-8">
                {t("whatsNext.checkYourPlan")}
              </Button>
            </Link>
          </div>

          {/* Actions Icon */}
          <img
            src={actionsIcon}
            alt=""
            className="absolute top-4 right-2 w-20 h-20 object-contain"
          />
        </div>

        {/* Download Results Card */}
        <div className="relative bg-white rounded-2xl p-6 overflow-hidden flex flex-col">
          <div className="pr-24">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("whatsNext.downloadResults")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("whatsNext.downloadResultsDesc")}
            </p>
          </div>

          <div className="mt-3">
            <Button
              className="bg-foreground hover:bg-foreground/90 text-background text-sm font-bold px-4 rounded-lg h-8 w-fit"
              onClick={onDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("whatsNext.downloading")}
                </>
              ) : (
                t("whatsNext.downloadPdf")
              )}
            </Button>
          </div>

          {/* PDF Icon */}
          <img
            src={pdfIcon}
            alt=""
            className="absolute top-4 right-2 w-20 h-20 object-contain"
          />
        </div>

        {/* Ask a Doctor Card */}
        {/* <div 
          className="relative rounded-2xl p-6 overflow-hidden flex flex-col"
          style={{ backgroundColor: '#3B9FAF' }}
        >
          <div className="relative z-10 pr-24">
            <h3 className="text-xl font-semibold text-white mb-2">{t('whatsNext.askDoctor')}</h3>
            <p className="text-sm text-white/80">
              {t('whatsNext.askDoctorDesc')}
            </p>
          </div>
          
          <div className="mt-3 relative z-10">
            <Button 
              className="bg-white hover:bg-white/90 text-foreground text-sm font-bold px-4 rounded-lg h-8 w-fit border-0"
            >
              {t('whatsNext.seeHowItWorks')}
            </Button>
          </div>
          
          <img 
            src={doctorImage} 
            alt="" 
            className="absolute top-0 right-0 h-[140px] w-auto object-contain object-right-top"
          />
        </div> */}
      </div>
    </section>
  );
}
