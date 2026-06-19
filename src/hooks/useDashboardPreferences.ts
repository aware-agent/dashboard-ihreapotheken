import { useCallback, useState } from 'react';

export type SectionId =
  | 'featureWidgets'
  | 'healthZones'
  | 'insights'
  // | 'wearableData'
  | 'quickActions'
  | 'articles';

export type WearableMetricId = 'heart-rate' | 'steps' | 'calories' | 'sleep' | 'hrv' | 'hydration';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

export interface SectionConfig {
  id: SectionId;
  visible: boolean;
  order: number;
}

export interface DashboardWidgets {
  healthStats: boolean;
  bioAge: boolean;
  companion: boolean;
  wearables: boolean;
}

export interface DashboardPreferences {
  sections: Record<SectionId, SectionConfig>;
  featureWidgets: Record<keyof DashboardWidgets, WidgetConfig>;
  wearableMetrics: Record<WearableMetricId, WidgetConfig>;
}

const STORAGE_KEY = 'dashboard-preferences-v5';

// Legacy static labels - kept for backwards compatibility
// Now translations are used via t('dashboard.sectionLabels.xxx') and t('dashboard.widgetLabels.xxx')
// export const SECTION_LABELS: Record<SectionId, string> = {
//   featureWidgets: 'Feature Widgets',
//   healthZones: 'Health Zones',
//   insights: 'Personalized Insights',
//   wearableData: 'Wearable Data',
//   quickActions: 'Quick Actions',
//   articles: 'Recommended Articles',
// };

// export const WIDGET_LABELS: Record<keyof DashboardWidgets, string> = {
//   healthStats: 'Health Stats',
//   bioAge: 'Bio Age',
//   companion: 'AI Companion',
//   wearables: 'Wearables',
// };

// export const WEARABLE_METRIC_IDS: WearableMetricId[] = [
//   'heart-rate', 'steps', 'calories', 'sleep', 'hrv', 'hydration'
// ];

const DEFAULT_SECTIONS: Record<SectionId, SectionConfig> = {
  featureWidgets: { id: 'featureWidgets', visible: true, order: 0 },
  healthZones: { id: 'healthZones', visible: true, order: 1 },
  insights: { id: 'insights', visible: true, order: 2 },
  // wearableData: { id: 'wearableData', visible: true, order: 3 }, // CANT USE FF HERE
  quickActions: { id: 'quickActions', visible: true, order: 4 },
  articles: { id: 'articles', visible: true, order: 5 },
};

const DEFAULT_FEATURE_WIDGETS: Record<keyof DashboardWidgets, WidgetConfig> = {
  healthStats: { id: 'healthStats', visible: true, order: 0 },
  bioAge: { id: 'bioAge', visible: true, order: 1 },
  companion: { id: 'companion', visible: true, order: 2 },
  wearables: { id: 'wearables', visible: true, order: 3 },
};

const DEFAULT_WEARABLE_METRICS: Record<WearableMetricId, WidgetConfig> = {
  'heart-rate': { id: 'heart-rate', visible: true, order: 0 },
  'steps': { id: 'steps', visible: true, order: 1 },
  'calories': { id: 'calories', visible: true, order: 2 },
  'sleep': { id: 'sleep', visible: true, order: 3 },
  'hrv': { id: 'hrv', visible: true, order: 4 },
  'hydration': { id: 'hydration', visible: true, order: 5 },
};

const DEFAULT_PREFERENCES: DashboardPreferences = {
  sections: DEFAULT_SECTIONS,
  featureWidgets: DEFAULT_FEATURE_WIDGETS,
  wearableMetrics: DEFAULT_WEARABLE_METRICS,
};

export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          sections: { ...DEFAULT_SECTIONS, ...parsed.sections },
          featureWidgets: { ...DEFAULT_FEATURE_WIDGETS, ...parsed.featureWidgets },
          wearableMetrics: { ...DEFAULT_WEARABLE_METRICS, ...parsed.wearableMetrics },
        };
      }
    } catch (e) {
      console.error('Failed to parse dashboard preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<DashboardPreferences | null>(null);

  const workingPreferences = pendingChanges || preferences;

  const enterEditMode = useCallback(() => {
    setPendingChanges({
      sections: { ...preferences.sections },
      featureWidgets: { ...preferences.featureWidgets },
      wearableMetrics: { ...preferences.wearableMetrics },
    });
    setEditMode(true);
  }, [preferences]);

  const exitEditMode = useCallback((save: boolean) => {
    if (save && pendingChanges) {
      setPreferences(pendingChanges);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingChanges));
      } catch (e) {
        console.error('Failed to save dashboard preferences:', e);
      }
    }
    setPendingChanges(null);
    setEditMode(false);
  }, [pendingChanges]);

  const toggleSection = useCallback((sectionId: SectionId) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...prev.sections[sectionId],
            visible: !prev.sections[sectionId].visible,
          },
        },
      };
    });
  }, [editMode]);

  const toggleWidget = useCallback((widgetId: keyof DashboardWidgets) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        featureWidgets: {
          ...prev.featureWidgets,
          [widgetId]: {
            ...prev.featureWidgets[widgetId],
            visible: !prev.featureWidgets[widgetId].visible,
          },
        },
      };
    });
  }, [editMode]);

  const toggleWearableMetric = useCallback((metricId: WearableMetricId) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        wearableMetrics: {
          ...prev.wearableMetrics,
          [metricId]: {
            ...prev.wearableMetrics[metricId],
            visible: !prev.wearableMetrics[metricId].visible,
          },
        },
      };
    });
  }, [editMode]);

  const reorderSections = useCallback((activeId: string, overId: string) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;

      const sectionList = Object.values(prev.sections).sort((a, b) => a.order - b.order);
      const activeIndex = sectionList.findIndex(s => s.id === activeId);
      const overIndex = sectionList.findIndex(s => s.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const [movedSection] = sectionList.splice(activeIndex, 1);
      sectionList.splice(overIndex, 0, movedSection);

      const updatedSections = { ...prev.sections };
      sectionList.forEach((section, index) => {
        updatedSections[section.id] = { ...section, order: index };
      });

      return { ...prev, sections: updatedSections };
    });
  }, [editMode]);

  const reorderFeatureWidgets = useCallback((activeId: string, overId: string) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;

      const widgetList = Object.values(prev.featureWidgets).sort((a, b) => a.order - b.order);
      const activeIndex = widgetList.findIndex(w => w.id === activeId);
      const overIndex = widgetList.findIndex(w => w.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const [movedWidget] = widgetList.splice(activeIndex, 1);
      widgetList.splice(overIndex, 0, movedWidget);

      const updatedWidgets = { ...prev.featureWidgets };
      widgetList.forEach((widget, index) => {
        updatedWidgets[widget.id as keyof DashboardWidgets] = { ...widget, order: index };
      });

      return { ...prev, featureWidgets: updatedWidgets };
    });
  }, [editMode]);

  const reorderWearableMetrics = useCallback((activeId: string, overId: string) => {
    if (!editMode) return;
    setPendingChanges((prev) => {
      if (!prev) return prev;

      const metricList = Object.values(prev.wearableMetrics).sort((a, b) => a.order - b.order);
      const activeIndex = metricList.findIndex(m => m.id === activeId);
      const overIndex = metricList.findIndex(m => m.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const [movedMetric] = metricList.splice(activeIndex, 1);
      metricList.splice(overIndex, 0, movedMetric);

      const updatedMetrics = { ...prev.wearableMetrics };
      metricList.forEach((metric, index) => {
        updatedMetrics[metric.id as WearableMetricId] = { ...metric, order: index };
      });

      return { ...prev, wearableMetrics: updatedMetrics };
    });
  }, [editMode]);

  const resetToDefaults = useCallback(() => {
    if (!editMode) return;
    setPendingChanges(DEFAULT_PREFERENCES);
  }, [editMode]);

  const getOrderedSections = useCallback(() => {
    return Object.values(workingPreferences.sections).sort((a, b) => a.order - b.order);
  }, [workingPreferences]);

  const getOrderedFeatureWidgets = useCallback(() => {
    return Object.values(workingPreferences.featureWidgets).sort((a, b) => a.order - b.order);
  }, [workingPreferences]);

  const getOrderedWearableMetrics = useCallback(() => {
    return Object.values(workingPreferences.wearableMetrics).sort((a, b) => a.order - b.order);
  }, [workingPreferences]);

  const isSectionVisible = useCallback((sectionId: SectionId) => {
    return workingPreferences.sections[sectionId]?.visible ?? true;
  }, [workingPreferences]);

  const isWidgetVisible = useCallback((widgetId: keyof DashboardWidgets) => {
    return workingPreferences.featureWidgets[widgetId]?.visible ?? true;
  }, [workingPreferences]);

  const isWearableMetricVisible = useCallback((metricId: WearableMetricId) => {
    return workingPreferences.wearableMetrics[metricId]?.visible ?? true;
  }, [workingPreferences]);

  const getWidgetConfig = useCallback((widgetId: keyof DashboardWidgets) => {
    return workingPreferences.featureWidgets[widgetId];
  }, [workingPreferences]);

  const getSectionConfig = useCallback((sectionId: SectionId) => {
    return workingPreferences.sections[sectionId];
  }, [workingPreferences]);

  const getWearableMetricConfig = useCallback((metricId: WearableMetricId) => {
    return workingPreferences.wearableMetrics[metricId];
  }, [workingPreferences]);

  return {
    preferences: workingPreferences,
    editMode,
    enterEditMode,
    exitEditMode,
    toggleSection,
    toggleWidget,
    toggleWearableMetric,
    reorderSections,
    reorderFeatureWidgets,
    reorderWearableMetrics,
    resetToDefaults,
    getOrderedSections,
    getOrderedFeatureWidgets,
    getOrderedWearableMetrics,
    isSectionVisible,
    isWidgetVisible,
    isWearableMetricVisible,
    getWidgetConfig,
    getSectionConfig,
    getWearableMetricConfig,
  };
}
