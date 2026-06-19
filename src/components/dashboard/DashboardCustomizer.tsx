import {
  Settings2,
  Check,
  X,
  RotateCcw,
  GripVertical,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  WidgetConfig,
  SectionConfig,
  SectionId,
  DashboardWidgets,
} from "@/hooks/useDashboardPreferences";
import { useLocale } from "@/hooks/useLocale";

interface SortableSectionProps {
  sectionId: SectionId;
  config: SectionConfig;
  editMode: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableSection({
  sectionId,
  config,
  editMode,
  onToggle,
  children,
  className,
}: SortableSectionProps) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId, disabled: !editMode });

  const style = {
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  // Get localized section label
  const getSectionLabel = (id: SectionId): string => {
    return t(`dashboard.sectionLabels.${id}`);
  };

  if (!editMode && !config.visible) {
    return null;
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      animate={{
        x: transform ? transform.x : 0,
        y: transform ? transform.y : 0,
        scale: isDragging ? 1.01 : 1,
        opacity: isDragging ? 0.9 : config.visible || !editMode ? 1 : 0.3,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
        mass: 0.8,
      }}
      className={cn(
        "relative group",
        editMode &&
          "p-6 -m-4 rounded-2xl border-2 border-dashed border-foundation-magnesium400/40",
        editMode && !config.visible && "opacity-30",
        className,
      )}
    >
      {editMode && (
        <>
          {/* Section label */}
          <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-foundation-magnesium400 text-white text-xs rounded-full font-medium">
            {getSectionLabel(sectionId)}
          </div>

          {/* Toggle visibility button */}
          <div className="absolute -top-3 right-4 z-10">
            <button
              onClick={onToggle}
              className={cn(
                "p-1.5 rounded-full transition-colors border",
                config.visible
                  ? "bg-hm-highlow100 hover:bg-hm-highlow200 border-hm-highlow200 text-white"
                  : "bg-hm-optimal100 hover:bg-hm-optimal200 border-hm-optimal200 text-white",
              )}
              title={
                config.visible
                  ? t("dashboard.hideSection")
                  : t("dashboard.showSection")
              }
            >
              {config.visible ? (
                <Minus className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Drag handle */}
          <motion.div
            {...attributes}
            {...listeners}
            className="absolute top-1/2 -left-2 -translate-y-1/2 z-10 p-1.5 bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing transition-all border border-border opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </>
      )}

      <div className={cn(editMode && !config.visible && "pointer-events-none")}>
        {children}
      </div>
    </motion.div>
  );
}

interface SortableWidgetProps {
  widgetId: keyof DashboardWidgets;
  config: WidgetConfig;
  editMode: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableWidget({
  widgetId,
  config,
  editMode,
  onToggle,
  children,
  className,
}: SortableWidgetProps) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId, disabled: !editMode });

  const style = {
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  // Get localized widget label
  const getWidgetLabel = (id: keyof DashboardWidgets): string => {
    return t(`dashboard.widgetLabels.${id}`);
  };

  if (!editMode && !config.visible) {
    return null;
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      animate={{
        x: transform ? transform.x : 0,
        y: transform ? transform.y : 0,
        scale: isDragging ? 1.02 : 1,
        opacity: isDragging ? 0.8 : config.visible || !editMode ? 1 : 0.3,
        boxShadow: isDragging
          ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
          : "0 0 0 0 rgb(0 0 0 / 0)",
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
        mass: 0.8,
      }}
      className={cn(
        "relative group h-full",
        editMode && "ring-2 ring-dashed ring-primary/30 rounded-xl",
        className,
      )}
    >
      {editMode && (
        <>
          {/* Widget label overlay */}
          <div className="absolute -top-2.5 left-3 z-10 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium">
            {getWidgetLabel(widgetId)}
          </div>

          {/* Toggle visibility button */}
          <div className="absolute -top-2.5 right-3 z-10">
            <button
              onClick={onToggle}
              className={cn(
                "p-1 rounded-full transition-colors border",
                config.visible
                  ? "bg-hm-highlow100 hover:bg-hm-highlow200 border-hm-highlow200 text-white"
                  : "bg-hm-optimal100 hover:bg-hm-optimal200 border-hm-optimal200 text-white",
              )}
              title={
                config.visible
                  ? t("dashboard.hideWidget")
                  : t("dashboard.showWidget")
              }
            >
              {config.visible ? (
                <Minus className="h-2.5 w-2.5" />
              ) : (
                <Plus className="h-2.5 w-2.5" />
              )}
            </button>
          </div>

          {/* Drag handle */}
          <motion.div
            {...attributes}
            {...listeners}
            className="absolute top-1/2 -left-2 -translate-y-1/2 z-10 p-1 bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing transition-all border border-border opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </motion.div>
        </>
      )}

      <div
        className={cn(
          "h-full",
          editMode && !config.visible && "pointer-events-none",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}

interface DashboardEditToolbarProps {
  editMode: boolean;
  onEnterEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function DashboardEditToolbar({
  editMode,
  onEnterEdit,
  onSave,
  onCancel,
  onReset,
}: DashboardEditToolbarProps) {
  const { t } = useLocale();

  if (!editMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEnterEdit}
        className="gap-2 hover:bg-muted hover:border-border hover:text-foreground"
      >
        <Settings2 className="h-4 w-4" />
        {t("dashboard.customize")}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 flex-wrap w-full sm:w-auto"
    >
      {/* Edit mode indicator - hidden on mobile, shown on desktop */}
      <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-foundation-manganese rounded-full">
        <div className="w-2 h-2 rounded-full bg-foundation-magnesium400 animate-pulse" />
        <span className="text-xs font-medium text-foundation-magnesium400">
          {t("dashboard.editMode")}
        </span>
      </div>

      {/* Mobile: Compact layout with all controls */}
      <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-between sm:justify-start w-full sm:w-auto">
        {/* Left side: Edit indicator on mobile */}
        <div className="flex sm:hidden items-center gap-1 px-3 py-1.5 bg-foundation-manganese rounded-full shrink-0">
          <div className="w-2 h-2 rounded-full bg-foundation-magnesium400 animate-pulse" />
          <span className="text-xs font-medium text-foundation-magnesium400">
            {t("dashboard.editMode")}
          </span>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1 text-muted-foreground hover:bg-muted h-8 px-2 sm:px-3"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("dashboard.reset")}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-1 text-muted-foreground hover:bg-muted h-8 px-2 sm:px-3"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common.cancel")}</span>
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            className="gap-1 bg-foundation-magnesium400 hover:bg-foundation-magnesium400/90 text-white h-8 px-3"
          >
            <Check className="h-3.5 w-3.5" />
            {t("common.save")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Legacy exports
export function EditableWidgetWrapper(props: any) {
  return <SortableWidget {...props} />;
}

export function DashboardCustomizer() {
  return null;
}
