import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/_auth/actions/test-packages/$packageId')({
  component: TestPackageDetail,
});
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/hooks/useLocale';
import { useIsMobile } from '@/hooks/use-mobile';
import { getBiomarkerIcon } from '@/lib/biomarkerIcons';
import { BookTestButton } from '@/components/shared/BookTestButton';
import { useActions } from '@/hooks/useActions';
import { useResults } from '@/hooks/useResults';
import { useUserProfile } from '@/hooks/useUser';
import { usePackages } from '@/hooks/usePackages';
import { normalizeActionsResponse } from '@/types/actions';
import { getPackagesFromResponse } from '@/types/packages';
import type { BffGroupedActionItem } from '@/types/actions';
import type { BiomarkerResult } from '@/types/results';
import type { KnownBiomarker } from '@/types/packages';

// Biomarker row item
function BiomarkerRow({ code, name, onClick }: { code: string; name: string; onClick?: () => void }) {
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

// Why this recommendation drawer
function WhyRecommendationDrawer({
  open,
  onOpenChange,
  triggeringBiomarkers,
  allBiomarkers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggeringBiomarkers: string[];
  allBiomarkers: BiomarkerResult[];
}) {
  const { t } = useLocale();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Match triggering biomarker codes to actual biomarker data
  const matchedBiomarkers = triggeringBiomarkers.map(code => {
    const cleanCode = code.replace(/[*#]/g, '');
    return allBiomarkers.find(b => 
      b.code?.toUpperCase() === cleanCode.toUpperCase() ||
      b.name?.toUpperCase().includes(cleanCode.toUpperCase())
    );
  }).filter(Boolean) as BiomarkerResult[];

  const content = (
    <div className="space-y-6">
      <p className="body-md text-muted-foreground">
        {t('actionDetail.whyThisRecommendationDescription')}
      </p>
      
      <Separator />
      
      <div>
        <h3 className="title-md text-foreground mb-2">{t('actionDetail.yourBiomarkers')}</h3>
        <p className="body-sm text-muted-foreground mb-4">
          {t('actionDetail.yourBiomarkersDescription')}
        </p>
        
        <div className="space-y-2">
          {matchedBiomarkers.map((biomarker, idx) => {
            const icon = getBiomarkerIcon(biomarker.code || biomarker.name);
            return (
              <button
                key={idx}
                onClick={() => {
                  onOpenChange(false);
                  if (biomarker.id) {
                    navigate(`/biomarkers/${biomarker.id}`);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  {icon ? (
                    <img src={icon} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-sm font-medium text-amber-600">
                      {(biomarker.code || biomarker.name)?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="title-sm text-foreground">{biomarker.name}</p>
                </div>
                <div className="text-right mr-2">
                  <p className="title-sm text-foreground">{biomarker.value}</p>
                  <p className="caption-md text-muted-foreground">{biomarker.unit}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
          
          {matchedBiomarkers.length === 0 && triggeringBiomarkers.length > 0 && (
            <div className="space-y-2">
              {triggeringBiomarkers.map((code, idx) => {
                const cleanCode = code.replace(/[*#]/g, '');
                const icon = getBiomarkerIcon(cleanCode);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                      {icon ? (
                        <img src={icon} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-sm font-medium text-amber-600">
                          {cleanCode.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="title-sm text-foreground">{cleanCode}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-6 pb-8 max-h-[85vh]">
          <DrawerHeader className="px-0">
            <DrawerTitle>{t('actionDetail.whyThisRecommendation')}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('actionDetail.whyThisRecommendation')}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

export default function TestPackageDetail() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { packageId } = Route.useParams();
  const [showWhyRecommendation, setShowWhyRecommendation] = useState(false);

  // Fetch user to get preferredFacilityId
  const { data: user } = useUserProfile();
  const facilityId = user?.preferredFacilityId;
  
  // Fetch packages to get biomarkers
  const { data: packagesData } = usePackages(facilityId);

  // Fetch data to find the test package
  const { data: resultsData } = useResults();
  const latestResult = resultsData?.results?.[0];
  const latestResultId = latestResult?.id;
  const allBiomarkers = latestResult?.biomarkers || [];
  const { data: actionsData } = useActions(latestResultId, {
    enabled: !!latestResultId
  });

  // Find the test package from the API response
  const actionCategories = actionsData ? normalizeActionsResponse(actionsData) : [];
  const testPackagesCategory = actionCategories.find(c => c.id === 'test_packages');
  const foundAction = testPackagesCategory?.actions.find(a => a.code === packageId || a._rawItem?.code === packageId);
  const testPackage: BffGroupedActionItem | null = foundAction?._rawItem || null;
  
  // Find matching package from packages API to get biomarkers list
  const packageCode = testPackage?.packageCode || testPackage?.code?.replace('P0', 'P');
  const packages = packagesData ? getPackagesFromResponse(packagesData) : [];
  const matchingPackage = packages.find(p => 
    p.packageCode === packageCode || 
    p.packageCode === testPackage?.packageCode ||
    p.packageName?.toLowerCase() === testPackage?.title?.toLowerCase()
  );
  const packageBiomarkers: KnownBiomarker[] = matchingPackage?.knownBiomarkers || [];

  if (!testPackage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.notFound')}</p>
      </div>
    );
  }

  // Extract data
  const triggeringBiomarkers = testPackage.triggeringBiomarkers || [];
  const testName = testPackage.title;
  const testDescription = testPackage.description;
  const testImage = testPackage.image;
  
  // Get background color based on package code
  const getBackgroundColor = (code: string) => {
    const colors: Record<string, string> = {
      'P01': 'bg-pink-100',
      'P02': 'bg-blue-100',
      'P03': 'bg-green-100',
      'P04': 'bg-amber-100',
      'HH': 'bg-pink-100',
    };
    return colors[code] || colors[packageCode || ''] || 'bg-pink-100';
  };
  
  const bgColor = getBackgroundColor(testPackage.code);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero section with icon - constrained height on desktop */}
      <div className={`relative h-[280px] sm:h-[320px] lg:h-[400px] lg:max-h-[40vh] w-full ${bgColor} flex items-center justify-center`}>
        {testImage ? (
          <img src={testImage} alt={testName} className="h-48 lg:h-56 w-auto object-contain" />
        ) : (
          <div className="w-32 h-32 bg-white/30 rounded-full flex items-center justify-center">
            <span className="text-5xl">🫀</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-full h-10 w-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{testName}</h1>
          {testDescription && (
            <p className="body-md text-muted-foreground mt-2">{testDescription}</p>
          )}
        </div>

        {/* Why this recommendation - clickable */}
        {triggeringBiomarkers.length > 0 && (
          <button
            onClick={() => setShowWhyRecommendation(true)}
            className="w-full bg-card rounded-2xl p-4 border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <span className="body-md text-foreground underline">{t('actionDetail.whyThisRecommendation')}</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {triggeringBiomarkers.slice(0, 3).map((code: string, idx: number) => {
                    const cleanCode = code.replace(/[*#]/g, '');
                    const icon = getBiomarkerIcon(cleanCode);
                    return icon ? (
                      <img key={idx} src={icon} alt="" className="w-8 h-8 rounded-full border-2 border-background" />
                    ) : (
                      <div key={idx} className="w-8 h-8 rounded-full bg-amber-100 border-2 border-background flex items-center justify-center">
                        <span className="text-xs">●</span>
                      </div>
                    );
                  })}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </button>
        )}

        <Separator />

        {/* Biomarkers in this test - from packages API */}
        {packageBiomarkers.length > 0 && (
          <div>
            <h3 className="title-md text-foreground mb-4">{t('actionDetail.biomarkersInTest')}</h3>
            <div className="divide-y divide-border">
              {packageBiomarkers.filter(b => !b.hidden).map((biomarker, idx) => (
                <BiomarkerRow 
                  key={idx} 
                  code={biomarker.code} 
                  name={biomarker.name}
                  onClick={() => {
                    // Navigate to biomarker detail if we have a uuid
                    if (biomarker.uuid) {
                      navigate(`/biomarkers/${biomarker.uuid}`);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="sticky bottom-0 p-6 pt-4 border-t border-border bg-background">
        <div className="max-w-2xl mx-auto">
          <BookTestButton fullWidth size="lg" />
        </div>
      </div>
      
      {/* Why recommendation drawer */}
      <WhyRecommendationDrawer
        open={showWhyRecommendation}
        onOpenChange={setShowWhyRecommendation}
        triggeringBiomarkers={triggeringBiomarkers}
        allBiomarkers={allBiomarkers}
      />
    </div>
  );
}
