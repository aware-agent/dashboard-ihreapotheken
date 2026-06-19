import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/hooks/useLocale';
import type { WearableSummaryPeriod } from '@/types/wearables';

interface PeriodSelectorProps {
  value: WearableSummaryPeriod;
  onChange: (value: WearableSummaryPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useLocale();

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as WearableSummaryPeriod)}>
      <TabsList className="h-8">
        <TabsTrigger value="biweekly" className="text-xs px-3 h-6">
          {t('wearables.biweekly')}
        </TabsTrigger>
        <TabsTrigger value="monthly" className="text-xs px-3 h-6">
          {t('wearables.monthly')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
