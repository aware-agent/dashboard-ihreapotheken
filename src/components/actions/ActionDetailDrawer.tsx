import { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Info, ExternalLink } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocale } from '@/hooks/useLocale';
import { getBiomarkerIcon } from '@/lib/biomarkerIcons';
import type { BffGroupedActionItem } from '@/types/actions';

interface ActionDetailDrawerProps {
  action: BffGroupedActionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Note on servings drawer component
function ServingsNoteDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useLocale();
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-4">
      <p className="body-md text-muted-foreground">
        {t('actionDetail.servingsNoteContent')}
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

// Food item component
function FoodItem({ item }: { item: { title: string; description?: string; image?: string; amount?: string; frequency?: string } }) {
  return (
    <div className="flex gap-4 py-3">
      {item.image && (
        <div className="w-[100px] h-[70px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="title-sm text-foreground">{item.title}</h4>
        {item.amount && <p className="caption-md text-muted-foreground">{item.amount}</p>}
        {item.frequency && <p className="caption-md text-muted-foreground">{item.frequency}</p>}
      </div>
    </div>
  );
}

// Tip item component
function TipItem({ item }: { item: { title: string; description?: string; image?: string; icon?: string } }) {
  return (
    <div className="flex gap-4 py-4">
      {item.image ? (
        <div className="w-[100px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : item.icon ? (
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{item.icon}</span>
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <h4 className="title-sm text-foreground mb-1">{item.title}</h4>
        {item.description && <p className="body-sm text-muted-foreground">{item.description}</p>}
      </div>
    </div>
  );
}

// Scientific reference item
function ReferenceItem({ item }: { item: { title: string; year?: string; journal?: string; url?: string } }) {
  return (
    <div className="bg-card rounded-2xl p-4 min-w-[280px] max-w-[320px] flex-shrink-0 snap-start">
      <p className="body-sm text-foreground line-clamp-3 mb-3">{item.title}</p>
      <div className="flex items-center justify-between">
        {item.year && <span className="caption-md text-muted-foreground">{item.year}</span>}
        {item.journal && (
          <span className="caption-md text-primary font-medium">{item.journal}</span>
        )}
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary caption-md">
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      )}
    </div>
  );
}

export function ActionDetailDrawer({ action, open, onOpenChange }: ActionDetailDrawerProps) {
  const { t } = useLocale();
  const isMobile = useIsMobile();
  const [showAllFoods, setShowAllFoods] = useState(false);
  const [showServingsNote, setShowServingsNote] = useState(false);

  if (!action) return null;

  // Extract data from action - these fields may come from API
  const benefits = (action as any).benefits || [];
  const whatToEat = (action as any).whatToEat || (action as any).lists?.find((l: any) => l.type === 'eat')?.items || [];
  const whatToLimit = (action as any).whatToLimit || (action as any).lists?.find((l: any) => l.type === 'limit')?.items || [];
  const tips = (action as any).tips || [];
  const thingsToWatch = (action as any).thingsToWatch || [];
  const references = (action as any).references || [];
  const triggeringBiomarkers = action.triggeringBiomarkers || [];

  const foodsToShow = showAllFoods ? whatToEat : whatToEat.slice(0, 4);
  const hasMoreFoods = whatToEat.length > 4;

  const content = (
    <div className="flex flex-col h-full">
      {/* Hero image */}
      {action.image && (
        <div className="relative h-[300px] -mx-6 -mt-6 md:mx-0 md:mt-0 md:rounded-t-xl overflow-hidden">
          <img src={action.image} alt={action.title} className="w-full h-full object-cover" />
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
      )}

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{action.title}</h2>
            {action.description && (
              <p className="body-md text-muted-foreground mt-2">{action.description}</p>
            )}
          </div>

          {/* Why this recommendation */}
          {triggeringBiomarkers.length > 0 && (
            <div className="bg-card rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="body-md text-foreground underline">{t('actionDetail.whyThisRecommendation')}</span>
                <div className="flex -space-x-2">
                  {triggeringBiomarkers.slice(0, 3).map((code: string, idx: number) => {
                    const icon = getBiomarkerIcon(code);
                    return icon ? (
                      <img key={idx} src={icon} alt="" className="w-8 h-8 rounded-full border-2 border-background" />
                    ) : (
                      <div key={idx} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs">{code.charAt(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Benefits */}
          {benefits.length > 0 && (
            <div>
              <h3 className="title-md text-foreground mb-4">{t('actionDetail.benefits')}</h3>
              <div className="space-y-3">
                {benefits.map((benefit: string, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-bg-green50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-foundation-green700" />
                    </div>
                    <p className="body-md text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {benefits.length > 0 && (whatToEat.length > 0 || tips.length > 0) && <Separator />}

          {/* What to eat */}
          {whatToEat.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="title-md text-foreground">{t('actions.whatToEat')}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowServingsNote(true)}
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {foodsToShow.map((item: any, idx: number) => (
                  <FoodItem key={idx} item={item} />
                ))}
              </div>
              {hasMoreFoods && (
                <Button
                  variant="outline"
                  className="w-full mt-3 rounded-xl"
                  onClick={() => setShowAllFoods(!showAllFoods)}
                >
                  {showAllFoods ? t('common.showLess') : t('common.showMore')}
                  {showAllFoods ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              )}
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💡</span>
                  <h3 className="title-md text-foreground">{action.title.split(' ')[0]}</h3>
                </div>
                {tips.map((tip: any, idx: number) => (
                  <div key={idx} className="mb-4">
                    <h4 className="title-sm text-foreground mb-1">{tip.title || tip}</h4>
                    {tip.description && <p className="body-sm text-muted-foreground">{tip.description}</p>}
                  </div>
                ))}
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
                    <TipItem key={idx} item={item} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Scientific references */}
          {references.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="title-md text-foreground mb-4">{t('actionDetail.scientificReferences')}</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
                  {references.map((ref: any, idx: number) => (
                    <ReferenceItem key={idx} item={ref} />
                  ))}
                </div>
                {/* Pagination dots */}
                {references.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {references.slice(0, Math.min(3, references.length)).map((_: any, idx: number) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${idx === 0 ? 'w-4 bg-foreground' : 'w-1.5 bg-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <ServingsNoteDrawer open={showServingsNote} onOpenChange={setShowServingsNote} />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] px-6">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{action.title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
