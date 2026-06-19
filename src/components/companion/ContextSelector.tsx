import { useState, useMemo } from 'react';
import { ChevronDown, X, Check, Search, FlaskConical } from 'lucide-react';
import ResultsIcon from '@/assets/nav-icons/Results-nonactive.svg';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useResults } from '@/hooks/useResults';
import { useHealthZones } from '@/hooks/useHealthZones';
import { useLocale } from '@/hooks/useLocale';
import { formatShortDate } from '@/lib/dateUtils';
import type { ChatContext } from '@/types/companion';
import { cn } from '@/lib/utils';
import { getBiomarkerIcon } from '@/lib/biomarkerIcons';

export interface ContextOption {
  type: 'latestResults' | 'healthZone' | 'biomarker';
  id?: string;
  name: string;
  iconUrl?: string;
  biomarkerCode?: string;
}

interface ContextSelectorProps {
  selectedContext: ChatContext | null;
  onContextChange: (context: ChatContext | null) => void;
  className?: string;
}

export function ContextSelector({
  selectedContext,
  onContextChange,
  className,
}: ContextSelectorProps) {
  const { data: resultsData } = useResults();
  const { data: healthZonesData } = useHealthZones();
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const latestResult = resultsData?.results?.[0];
  const healthZones = healthZonesData?.healthZones || [];

  // Build context options
  const allContextOptions: ContextOption[] = useMemo(() => {
    const options: ContextOption[] = [];

    // Latest Results option
    if (latestResult) {
      options.push({
        type: 'latestResults',
        id: latestResult.id,
        name: `${t('companion.latestResults')} (${formatShortDate(latestResult.date, locale)})`,
      });
    }

    // Health Zone options - use zone icon from API
    healthZones.forEach((zone) => {
      options.push({
        type: 'healthZone',
        id: zone.id,
        name: zone.name,
        iconUrl: zone.icon,
      });
    });

    // Biomarker options (from latest result) - show ALL biomarkers
    if (latestResult?.biomarkers) {
      // Sort: prioritize out-of-range biomarkers, then alphabetically
      const sortedBiomarkers = [...latestResult.biomarkers].sort((a, b) => {
        const aOutOfRange = a.biomarkerStatus === 'HIGH' || a.biomarkerStatus === 'LOW';
        const bOutOfRange = b.biomarkerStatus === 'HIGH' || b.biomarkerStatus === 'LOW';
        if (aOutOfRange && !bOutOfRange) return -1;
        if (!aOutOfRange && bOutOfRange) return 1;
        return a.name.localeCompare(b.name);
      });

      sortedBiomarkers.forEach((biomarker) => {
        options.push({
          type: 'biomarker',
          id: biomarker.id,
          name: biomarker.name,
          biomarkerCode: biomarker.code,
        });
      });
    }

    return options;
  }, [latestResult, healthZones]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allContextOptions;
    }

    const query = searchQuery.toLowerCase().trim();
    return allContextOptions.filter((option) =>
      option.name.toLowerCase().includes(query)
    );
  }, [allContextOptions, searchQuery]);

  // Group filtered options by type
  const groupedOptions = useMemo(() => {
    const groups: Record<string, ContextOption[]> = {
      latestResults: [],
      healthZone: [],
      biomarker: [],
    };

    filteredOptions.forEach((option) => {
      groups[option.type].push(option);
    });

    return groups;
  }, [filteredOptions]);

  const handleSelectContext = (option: ContextOption) => {
    if (selectedContext && selectedContext.type === option.type && selectedContext.id === option.id) {
      // Deselect if already selected
      onContextChange(null);
    } else {
      // Build context based on option type
      let context: ChatContext | null = null;

      if (option.type === 'latestResults' && latestResult) {
        // Send all biomarkers from latest result
        context = {
          type: 'general',
          id: latestResult.id,
          name: 'Latest Results',
          data: {
            result: {
              id: latestResult.id,
              date: latestResult.date,
            },
            biomarkers: latestResult.biomarkers?.map((b) => ({
              id: b.id,
              name: b.name,
              code: b.code,
              value: b.value,
              valueText: b.valueText,
              unit: b.unit,
              range: b.range,
              biomarkerStatus: b.biomarkerStatus,
              optimalRange: b.optimalRange,
            })) || [],
          },
        };
      } else if (option.type === 'healthZone' && option.id) {
        const zone = healthZones.find((z) => z.id === option.id);
        if (zone && latestResult) {
          // Get biomarkers for this health zone from latest result
          const biomarkerCodes = zone.knownBiomarkers?.map((b) => b.code) || [];
          const healthZoneBiomarkers = (latestResult.biomarkers || []).filter((b) =>
            biomarkerCodes.includes(b.code)
          );

          context = {
            type: 'healthZone',
            id: zone.id,
            name: zone.name,
            data: {
              healthZone: {
                id: zone.id,
                name: zone.name,
                icon: zone.icon,
                description: zone.description,
              },
              biomarkers: healthZoneBiomarkers.map((b) => ({
                id: b.id,
                name: b.name,
                code: b.code,
                value: b.value,
                valueText: b.valueText,
                unit: b.unit,
                range: b.range,
                biomarkerStatus: b.biomarkerStatus,
                optimalRange: b.optimalRange,
              })),
              latestResultDate: latestResult.date,
            },
          };
        }
      } else if (option.type === 'biomarker' && option.id) {
        const biomarker = latestResult?.biomarkers?.find((b) => b.id === option.id);
        if (biomarker) {
          context = {
            type: 'biomarker',
            id: biomarker.id,
            name: biomarker.name,
            data: {
              id: biomarker.id,
              name: biomarker.name,
              code: biomarker.code,
              value: biomarker.value,
              valueText: biomarker.valueText,
              unit: biomarker.unit,
              range: biomarker.range,
              biomarkerStatus: biomarker.biomarkerStatus,
              optimalRange: biomarker.optimalRange,
            },
          };
        }
      }

      onContextChange(context);
    }
    setIsOpen(false);
    setSearchQuery(''); // Clear search when selecting
  };

  const getContextDisplayName = () => {
    if (!selectedContext) return null;
    return selectedContext.name || 'Selected Context';
  };

  const isSelected = (option: ContextOption) => {
    return (
      selectedContext &&
      selectedContext.type === option.type &&
      selectedContext.id === option.id
    );
  };

  return (
    <div className={cn('flex items-center gap-2 flex-1 min-w-0', className)}>
      {selectedContext && (
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium shrink-0"
        >
          <span className="truncate max-w-[140px]">{getContextDisplayName()}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onContextChange(null);
            }}
            className="hover:bg-muted/80 rounded-full p-0.5 -mr-1 transition-colors"
            aria-label="Remove context"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSearchQuery(''); // Clear search when closing
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={selectedContext ? "secondary" : "outline"}
            size="sm"
            className="h-8 px-3 text-xs shrink-0"
          >
            <img src={ResultsIcon} alt="" className="h-3.5 w-3.5 mr-1.5" />
            {selectedContext ? 'Change' : 'Add Context'}
            <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2 overflow-x-hidden">
          <div className="pb-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search context..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm w-full"
                autoFocus
                onKeyDown={(e) => {
                  // Prevent dropdown from closing on Escape if there's search text
                  if (e.key === 'Escape' && searchQuery) {
                    e.stopPropagation();
                    setSearchQuery('');
                  }
                }}
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden pt-2">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? 'No results found' : 'No context available'}
              </div>
            ) : (
              <>
                {/* Group by type */}
                {['latestResults', 'healthZone', 'biomarker'].map((type, groupIndex) => {
                  const optionsOfType = groupedOptions[type];
                  if (!optionsOfType || optionsOfType.length === 0) return null;

                  const typeLabels = {
                    latestResults: 'Latest Results',
                    healthZone: 'Health Zones',
                    biomarker: 'Biomarkers',
                  };

                  // Check if this is not the first visible group
                  const previousTypes = ['latestResults', 'healthZone', 'biomarker'].slice(0, groupIndex);
                  const hasPreviousContent = previousTypes.some(t => groupedOptions[t]?.length > 0);

                  return (
                    <div key={type} className="overflow-x-hidden">
                      {hasPreviousContent && (
                        <div className="border-t border-border/50 my-2" />
                      )}
                      <div className="text-xs text-muted-foreground px-2 py-1.5 font-medium truncate">
                        {typeLabels[type as keyof typeof typeLabels]} ({optionsOfType.length})
                      </div>
                      {optionsOfType.map((option) => {
                        // Get the appropriate icon
                        let iconSrc: string | undefined;
                        if (option.type === 'healthZone' && option.iconUrl) {
                          iconSrc = option.iconUrl;
                        } else if (option.type === 'biomarker' && option.biomarkerCode) {
                          iconSrc = getBiomarkerIcon(option.biomarkerCode) || getBiomarkerIcon(option.name);
                        }

                        return (
                          <DropdownMenuItem
                            key={`${option.type}-${option.id}`}
                            onClick={() => handleSelectContext(option)}
                            className="flex items-center justify-between px-2 min-w-0 overflow-x-hidden"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                              {option.type === 'latestResults' ? (
                                <img src={ResultsIcon} alt="" className="w-5 h-5 shrink-0" />
                              ) : iconSrc ? (
                                <img 
                                  src={iconSrc} 
                                  alt="" 
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <FlaskConical className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <span className="truncate text-sm min-w-0">{option.name}</span>
                            </div>
                            {isSelected(option) && (
                              <Check className="h-4 w-4 text-foreground shrink-0 ml-2" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
