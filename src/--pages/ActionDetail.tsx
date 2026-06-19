import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Info, ChevronRight } from 'lucide-react';
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
import { useActions } from '@/hooks/useActions';
import { useResults } from '@/hooks/useResults';
import { normalizeActionsResponse } from '@/types/actions';
import type { BffGroupedActionItem } from '@/types/actions';
import type { BiomarkerResult } from '@/types/results';

// Note on servings drawer component
function ServingsNoteDrawer({ 
  open, 
  onOpenChange, 
  content: noteContent 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  content?: string;
}) {
  const { t } = useLocale();
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-4">
      <p className="body-md text-muted-foreground">
        {noteContent || t('actionDetail.servingsNoteContent')}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-6 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>{t('actionDetail.servingsNote')}</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('actionDetail.servingsNote')}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// Why this recommendation drawer - shows triggering biomarkers
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
    // Remove status indicators like * or # from the code
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

// Food item component (with large images)
function FoodItem({ item }: { item: { title: string; description?: string; image?: string } }) {
  // Parse description to extract amount and frequency
  const lines = item.description?.split('\n') || [];
  
  return (
    <div className="flex gap-4 py-3">
      {item.image && (
        <div className="w-[120px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="title-sm text-foreground">{item.title}</h4>
        {lines.map((line, idx) => (
          <p key={idx} className="caption-md text-muted-foreground">{line}</p>
        ))}
      </div>
    </div>
  );
}

// Good to know item component (with small inline icons)
function GoodToKnowItem({ item }: { item: { title: string; description?: string; image?: string } }) {
  return (
    <div className="flex gap-3 py-3">
      {item.image && (
        <div className="w-6 h-6 flex-shrink-0 mt-0.5">
          <img src={item.image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="title-sm text-foreground">{item.title}</h4>
        {item.description && (
          <p className="body-sm text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  );
}

// Tip/Watch item component with image
function WatchItem({ item }: { item: { title: string; description?: string; image?: string } }) {
  return (
    <div className="flex gap-4 py-4">
      {item.image && (
        <div className="w-[120px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="title-sm text-foreground mb-1">{item.title}</h4>
        {item.description && <p className="body-sm text-muted-foreground">{item.description}</p>}
      </div>
    </div>
  );
}

// Scientific reference item - matches mobile app design
function ReferenceItem({ item }: { item: { title: string; tags?: string[]; url?: string; createdAt?: string } }) {
  // Extract year from createdAt
  const year = item.createdAt ? new Date(item.createdAt).getFullYear().toString() : '';
  const journal = item.tags?.[0] || '';
  
  const content = (
    <div className="bg-card rounded-2xl p-4 w-full border border-border">
      <p className="body-sm text-foreground line-clamp-3 mb-4">{item.title}</p>
      <div className="flex items-center justify-between">
        {year && <span className="caption-md text-muted-foreground">{year}</span>}
        {journal && (
          <span className="caption-md text-primary font-medium px-3 py-1 bg-primary/10 rounded-full">{journal}</span>
        )}
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  
  return content;
}

// References list - vertical stack like mobile app
function ReferencesList({ references }: { references: any[] }) {
  const { t } = useLocale();

  if (references.length === 0) return null;

  return (
    <div>
      <h3 className="title-md text-foreground mb-4">{t('actionDetail.scientificReferences')}</h3>
      <div className="space-y-3">
        {references.map((ref: any, idx: number) => (
          <ReferenceItem key={idx} item={ref} />
        ))}
      </div>
    </div>
  );
}

export default function ActionDetail() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { actionId } = useParams<{ actionId: string }>();
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [showServingsNote, setShowServingsNote] = useState(false);
  const [servingsNoteContent, setServingsNoteContent] = useState<string | undefined>();
  const [showWhyRecommendation, setShowWhyRecommendation] = useState(false);

  // Fetch data to find the action
  const { data: resultsData } = useResults();
  const latestResult = resultsData?.results?.[0];
  const latestResultId = latestResult?.id;
  const allBiomarkers = latestResult?.biomarkers || [];
  const { data: actionsData } = useActions(latestResultId, {
    enabled: !!latestResultId
  });

  // Find the action from the API response
  const actionCategories = actionsData ? normalizeActionsResponse(actionsData) : [];
  let action: BffGroupedActionItem | null = null;

  for (const category of actionCategories) {
    const found = category.actions.find(a => a.code === actionId || a._rawItem?.code === actionId);
    if (found && found._rawItem) {
      action = found._rawItem;
      break;
    }
  }

  if (!action) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.notFound')}</p>
      </div>
    );
  }

  // Parse lists from API structure
  const lists = action.lists || [];
  
  // Extract sections based on list type/title
  const benefitsList = lists.find((l: any) => l.title === 'Benefits');
  const benefits = benefitsList?.items?.map((item: any) => item.description) || [];
  
  // "Good to know" section for supplements (uses small icons, not large images)
  const goodToKnowList = lists.find((l: any) => l.title === 'Good to know');
  const goodToKnowItems = goodToKnowList?.items || [];
  const goodToKnowInfo = goodToKnowList?.info;
  
  const whatToEatList = lists.find((l: any) => 
    l.title === 'What to eat' || 
    l.title === 'Workouts for you' || 
    l.title === 'Success strategies' ||
    l.type === 'IMAGE'
  );
  const whatToEat = whatToEatList?.items || [];
  const whatToEatInfo = whatToEatList?.info;
  const whatToEatTip = whatToEatList?.tip;
  
  const thingsToWatchList = lists.find((l: any) => l.title === 'Things to watch for');
  const thingsToWatch = thingsToWatchList?.items || [];
  
  const references = action.references || [];
  const triggeringBiomarkers = action.triggeringBiomarkers || [];

  // Determine the section title based on action type
  const getSectionTitle = () => {
    if (whatToEatList?.title) return whatToEatList.title;
    return t('actions.whatToEat');
  };

  const foodsToShow = showAllFoods ? whatToEat : whatToEat.slice(0, 4);
  const hasMoreFoods = whatToEat.length > 4;

  const handleShowServingsNote = () => {
    setServingsNoteContent(whatToEatInfo?.description);
    setShowServingsNote(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image - smart sizing for desktop to avoid low quality appearance */}
      {action.image && (
        <div className="relative w-full lg:flex lg:justify-center lg:bg-muted/30">
          <div className="relative h-[280px] sm:h-[320px] lg:h-[300px] w-full lg:max-w-4xl">
            <img 
              src={action.image} 
              alt={action.title} 
              className="w-full h-full object-cover lg:rounded-b-2xl"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-full h-10 w-10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Back button if no hero image */}
        {!action.image && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        )}

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{action.title}</h1>
          {action.description && (
            <p className="body-md text-muted-foreground mt-2">{action.description}</p>
          )}
        </div>

        {/* Why this recommendation - clickable card */}
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
                        <span className="text-xs font-medium">{cleanCode.charAt(0)}</span>
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

        {/* Benefits */}
        {benefits.length > 0 && (
          <div>
            <h3 className="title-md text-foreground mb-4">{t('actionDetail.benefits')}</h3>
            <div className="space-y-4">
              {benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-bg-green50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-foundation-green700" />
                  </div>
                  <p className="body-md text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {benefits.length > 0 && (whatToEat.length > 0 || goodToKnowItems.length > 0) && <Separator />}

        {/* Good to know section - for supplements (small icons) */}
        {goodToKnowItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="title-md text-foreground">{goodToKnowList?.title || t('actionDetail.goodToKnow')}</h3>
              {goodToKnowInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setServingsNoteContent(goodToKnowInfo.description);
                    setShowServingsNote(true);
                  }}
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {goodToKnowItems.map((item: any, idx: number) => (
                <GoodToKnowItem key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {goodToKnowItems.length > 0 && whatToEat.length > 0 && <Separator />}

        {/* What to eat / Workouts / Success strategies */}
        {whatToEat.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="title-md text-foreground">{getSectionTitle()}</h3>
              {whatToEatInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleShowServingsNote}
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <div className="divide-y divide-border">
              {foodsToShow.map((item: any, idx: number) => (
                <FoodItem key={idx} item={item} />
              ))}
            </div>
            {hasMoreFoods && (
              <Button
                variant="outline"
                className="w-full mt-3 rounded-xl bg-muted/50"
                onClick={() => setShowAllFoods(!showAllFoods)}
              >
                {showAllFoods ? t('common.showLess') : t('common.showMore')}
                {showAllFoods ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        )}

        {/* Tip section with lightbulb icon */}
        {whatToEatTip && (
          <>
            <div className="flex gap-3 pt-2">
              {whatToEatTip.image ? (
                <img src={whatToEatTip.image} alt="" className="w-6 h-6 flex-shrink-0" />
              ) : (
                <span className="text-xl flex-shrink-0">💡</span>
              )}
              <div className="flex-1">
                <h4 className="title-sm text-foreground mb-1">{whatToEatTip.title}</h4>
                <p className="body-sm text-muted-foreground">{whatToEatTip.description}</p>
              </div>
            </div>
          </>
        )}

        {/* Things to watch for */}
        {thingsToWatch.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="title-md text-foreground mb-4">{t('actionDetail.thingsToWatchFor')}</h3>
              <div className="space-y-2">
                {thingsToWatch.map((item: any, idx: number) => (
                  <WatchItem key={idx} item={item} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Scientific references list */}
        {references.length > 0 && (
          <>
            <Separator />
            <ReferencesList references={references} />
          </>
        )}
      </div>

      <ServingsNoteDrawer 
        open={showServingsNote} 
        onOpenChange={setShowServingsNote}
        content={servingsNoteContent}
      />
      
      <WhyRecommendationDrawer
        open={showWhyRecommendation}
        onOpenChange={setShowWhyRecommendation}
        triggeringBiomarkers={triggeringBiomarkers}
        allBiomarkers={allBiomarkers}
      />
    </div>
  );
}
