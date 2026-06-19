// BFF Actions API Response Types

// Individual action item from BFF API
export interface BffAction {
  code: string;
  category: string; // e.g., 'diet', 'workout', 'lifestyle', 'supplement'
  title: string;
  description?: string;
  imageUrl?: string;
  details?: {
    dosage?: string;
    timing?: string;
    frequency?: string;
    duration?: string;
    intensity?: 'low' | 'moderate' | 'high';
    tips?: string[];
    type?: 'eat' | 'limit';
    emoji?: string;
    evidenceRating?: number;
    benefit?: string;
  };
  triggeringIndicators?: Array<{
    code: string;
    name: string;
    status: string;
  }>;
  // Preserve full raw item data for detail views
  _rawItem?: BffGroupedActionItem;
}

// Action category grouping from API
export interface BffActionCategory {
  id: string;
  name: string; // Display name like "Diets", "Workouts", "Lifestyle habits"
  actions: BffAction[];
}

// Complete actions API response
export interface BffActionsResponse {
  categories: BffActionCategory[];
  // Legacy support for health areas if API returns them
  healthAreas?: BffHealthArea[];
  actions?: BffAction[];
}

/**
 * Newer grouped response shape observed from the BFF.
 * Example: { default: false, diets: [...], workouts: [...], supplements: [...], lifestyle_changes: [...] }
 */
export interface BffGroupedActionsResponse {
  default?: boolean;
  diets?: BffGroupedActionItem[];
  workouts?: BffGroupedActionItem[];
  supplements?: BffGroupedActionItem[];
  lifestyle_changes?: BffGroupedActionItem[];
  test_packages?: BffGroupedActionItem[];
  // forward-compat for any additional groups
  [key: string]: unknown;
}

export interface BffGroupedActionItem {
  code: string;
  packageCode?: string | null;
  image?: string;
  title: string;
  description?: string;
  tags?: string[];
  triggeringIndicators?: unknown[];
  triggeringBiomarkers?: string[];
  lists?: Array<{
    title?: string;
    type?: string;
    items: Array<{
      title?: string;
      description?: string;
      image?: string;
      amount?: string;
      frequency?: string;
      icon?: string;
    }>;
    info?: {
      title?: string;
      description?: string;
    };
    tip?: {
      image?: string;
      title?: string;
      description?: string;
    };
  }>;
  references?: Array<{
    title: string;
    tags?: string[];
    url?: string;
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
  }>;
  benefits?: string[];
  tips?: Array<{ title: string; description?: string }> | string[];
  whatToEat?: Array<{ title: string; image?: string; amount?: string; frequency?: string }>;
  whatToLimit?: Array<{ title: string; image?: string; amount?: string; frequency?: string }>;
  thingsToWatch?: Array<{ title: string; description?: string; image?: string }>;
  biomarkers?: Array<{ code: string; name: string }>;
}

// Health area summary from BFF API (legacy/alternative format)
export interface BffHealthArea {
  id: string;
  name: string;
  description: string;
  score: number;
  status: 'on-target' | 'outside-target';
  actionCount: number;
}

// Mapped types for UI components
export interface MappedHealthArea {
  id: string;
  name: string;
  description: string;
  score: number;
  recommendationCount: number;
  status: 'on-target' | 'outside-target';
}

// UI card item for carousels
export interface ActionCardItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  // Preserve raw data for detail views
  rawData?: BffGroupedActionItem;
}

// Transform BffAction to ActionCardItem for carousel display
export function mapActionToCardItem(action: BffAction): ActionCardItem {
  return {
    id: action.code,
    title: action.title,
    description: action.description,
    imageUrl: action.imageUrl,
    category: action.category,
    rawData: action._rawItem,
  };
}

// Transform BffActionCategory to carousel-ready format
export function mapCategoryToCarouselItems(category: BffActionCategory): ActionCardItem[] {
  return category.actions.map(mapActionToCardItem);
}

// Transform BffHealthArea to the format expected by existing UI components
export function mapHealthAreaToUI(area: BffHealthArea): MappedHealthArea {
  return {
    id: area.id,
    name: area.name,
    description: area.description,
    score: area.score,
    recommendationCount: area.actionCount,
    status: area.status,
  };
}

// Transform array of health areas
export function mapHealthAreasToUI(areas: BffHealthArea[]): MappedHealthArea[] {
  return areas.map(mapHealthAreaToUI);
}

// Normalize API response to always have categories format
export function normalizeActionsResponse(
  response: BffActionsResponse | BffGroupedActionsResponse
): BffActionCategory[] {
  // New grouped response (diets/workouts/...) -> categories
  if (isGroupedActionsResponse(response)) {
    const groupOrder: Array<keyof BffGroupedActionsResponse> = [
      'diets',
      'workouts',
      'lifestyle_changes',
      'supplements',
      'test_packages',
    ];

    const displayNames: Record<string, string> = {
      diets: 'Diets',
      workouts: 'Workouts',
      lifestyle_changes: 'Lifestyle habits',
      supplements: 'Supplements',
      test_packages: 'Test packages',
    };

    return groupOrder
      .flatMap((key) => {
        const items = response[key];
        if (!Array.isArray(items) || items.length === 0) return [];

        const actions: BffAction[] = items
          .filter((it): it is BffGroupedActionItem => !!it && typeof it === 'object')
          .map((it) => ({
            code: it.code,
            category: String(key),
            title: it.title,
            description: it.description,
            imageUrl: it.image,
            // Preserve full item data for detail views
            _rawItem: it,
          }));

        return [
          {
            id: String(key),
            name: displayNames[String(key)] || String(key),
            actions,
          } satisfies BffActionCategory,
        ];
      });
  }

  // If response already has categories, use them
  if ('categories' in response && response.categories && response.categories.length > 0) {
    return response.categories;
  }

  // If response has flat actions array, group by category
  if ('actions' in response && response.actions && response.actions.length > 0) {
    const categoryMap = new Map<string, BffAction[]>();
    
    for (const action of response.actions) {
      const categoryKey = action.category || 'other';
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, []);
      }
      categoryMap.get(categoryKey)!.push(action);
    }

    // Convert to category objects with display names
    const categoryNames: Record<string, string> = {
      diet: 'Diets',
      diets: 'Diets',
      food: 'Diets',
      workout: 'Workouts',
      workouts: 'Workouts',
      training: 'Workouts',
      exercise: 'Workouts',
      lifestyle: 'Lifestyle habits',
      supplement: 'Supplements',
      supplements: 'Supplements',
      other: 'Other',
    };

    return Array.from(categoryMap.entries()).map(([key, actions]) => ({
      id: key,
      name: categoryNames[key.toLowerCase()] || key,
      actions,
    }));
  }

  return [];
}

function isGroupedActionsResponse(
  response: BffActionsResponse | BffGroupedActionsResponse
): response is BffGroupedActionsResponse {
  if (!response || typeof response !== 'object') return false;
  // detect by presence of any known grouped keys
  return (
    'diets' in response ||
    'workouts' in response ||
    'supplements' in response ||
    'lifestyle_changes' in response ||
    'test_packages' in response
  );
}
