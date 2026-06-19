import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import type { SuggestedPrompt } from '@/types/companion';
import type { ResultsResponse } from '@/types/results';
import {
  ClipboardList,
  AlertTriangle,
  Target,
  TrendingUp,
  TrendingDown,
  GitCompare,
  PieChart,
  ShieldAlert,
  Eye,
  Stethoscope,
  ListChecks,
} from 'lucide-react';
import { useMemo } from 'react';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: SuggestedPrompt) => void;
  className?: string;
  resultsData?: ResultsResponse;
}

const iconMap: Record<string, React.ElementType> = {
  'clipboard-list': ClipboardList,
  'alert-triangle': AlertTriangle,
  'target': Target,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'git-compare': GitCompare,
  'pie-chart': PieChart,
  'shield-alert': ShieldAlert,
  'eye': Eye,
  'stethoscope': Stethoscope,
  'list-checks': ListChecks,
};

export function SuggestedPrompts({ onSelectPrompt, className, resultsData }: SuggestedPromptsProps) {
  const { t } = useLocale();
  
  // Build localized prompts
  const localizedPrompts: SuggestedPrompt[] = useMemo(() => [
    // Results Overview
    {
      text: t('companion.prompts.explainLatestResults'),
      icon: "clipboard-list",
      category: t('companion.categories.resultsOverview'),
      contextType: "general",
      contextName: "Latest Results",
    },
    {
      text: t('companion.prompts.reviewOutOfRange'),
      icon: "alert-triangle",
      category: t('companion.categories.resultsOverview'),
      contextType: "general",
      contextName: "Latest Results",
    },
    {
      text: t('companion.prompts.identifyFocusAreas'),
      icon: "target",
      category: t('companion.categories.resultsOverview'),
      contextType: "general",
      contextName: "Latest Results",
    },
    // Trends & Patterns
    {
      text: t('companion.prompts.trendingPositively'),
      icon: "trending-up",
      category: t('companion.categories.trendsPatterns'),
      contextType: "general",
      contextName: "Latest Results",
      requiresMultipleResults: true,
    },
    {
      text: t('companion.prompts.trendingNegatively'),
      icon: "trending-down",
      category: t('companion.categories.trendsPatterns'),
      contextType: "general",
      contextName: "Latest Results",
      requiresMultipleResults: true,
    },
    {
      text: t('companion.prompts.whatChanged'),
      icon: "git-compare",
      category: t('companion.categories.trendsPatterns'),
      contextType: "general",
      contextName: "Latest Results",
    },
    // Deep Insights
    {
      text: t('companion.prompts.clusterThemes'),
      icon: "pie-chart",
      category: t('companion.categories.deepInsights'),
      contextType: "general",
      contextName: "Latest Results",
    },
    {
      text: t('companion.prompts.biggestRisk'),
      icon: "shield-alert",
      category: t('companion.categories.deepInsights'),
      contextType: "general",
      contextName: "Latest Results",
    },
    {
      text: t('companion.prompts.closestAttention'),
      icon: "eye",
      category: t('companion.categories.deepInsights'),
      contextType: "general",
      contextName: "Latest Results",
    },
    // Doctor & Lifestyle
    {
      text: t('companion.prompts.doctorQuestions'),
      icon: "stethoscope",
      category: t('companion.categories.doctorLifestyle'),
      contextType: "general",
      contextName: "Latest Results",
    },
    {
      text: t('companion.prompts.lifestyleFactors'),
      icon: "list-checks",
      category: t('companion.categories.doctorLifestyle'),
      contextType: "general",
      contextName: "Latest Results",
    },
  ], [t]);

  // Filter prompts based on requirements (e.g., multiple results needed)
  const availableResultsCount = resultsData?.results?.length || 0;
  const filteredPrompts = localizedPrompts.filter((prompt) => {
    // Hide prompts that require multiple results if user has less than 2 results
    if (prompt.requiresMultipleResults && availableResultsCount < 2) {
      return false;
    }
    return true;
  });

  // Group prompts by category
  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, SuggestedPrompt[]>);

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedPrompts).map(([category, prompts]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {category}
          </h3>
          <div className="grid gap-3">
            {prompts.map((prompt) => {
              return (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => onSelectPrompt(prompt)}
                  className="group p-4 text-left bg-card rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-sm text-foreground leading-relaxed">
                    {prompt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
