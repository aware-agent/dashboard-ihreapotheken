import { Activity, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardSummary } from '@/types/biomarkers';
import { formatDate } from '@/lib/biomarkerUtils';
import { useLocale } from '@/hooks/useLocale';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Markers',
      value: summary.totalMarkers,
      icon: Activity,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'In Range',
      value: summary.inRangeCount,
      icon: CheckCircle,
      iconColor: 'text-[hsl(var(--hm-optimal))]',
      bgColor: 'bg-[hsl(var(--hm-optimal)/0.1)]',
    },
    {
      title: 'Needs Attention',
      value: summary.needsAttentionCount,
      icon: AlertTriangle,
      iconColor: 'text-[hsl(var(--hm-highlow))]',
      bgColor: 'bg-[hsl(var(--hm-highlow)/0.1)]',
    },
    {
      title: 'Last Test',
      value: formatDate(summary.lastTestDate),
      icon: Calendar,
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-xl font-semibold text-foreground">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
