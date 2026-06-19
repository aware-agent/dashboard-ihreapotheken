import { ChevronRight } from 'lucide-react';
import { motion, type Easing } from 'framer-motion';
import { CategoryIcon } from './CategoryIcon';
import { cn } from '@/lib/utils';
import type { HealthProfileCategory, HealthProfileAnswer } from '@/types/healthProfile';
import { calculateCategoryProgress } from '@/hooks/useHealthProfile';

interface HealthProfileCategoriesProps {
  categories: HealthProfileCategory[];
  answers: HealthProfileAnswer[];
  onSelectCategory: (category: HealthProfileCategory) => void;
}

const easeOut: Easing = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
};

export function HealthProfileCategories({
  categories,
  answers,
  onSelectCategory,
}: HealthProfileCategoriesProps) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map((category) => {
          const { answered, total } = calculateCategoryProgress(category, answers);
          const isComplete = answered === total && total > 0;

          return (
            <motion.div key={category.code} variants={itemVariants}>
              <div
                className="flex items-center gap-4 p-4 rounded-xl border border-[#b8e094] bg-transparent cursor-pointer transition-all duration-200 hover:bg-muted/30 group"
                onClick={() => onSelectCategory(category)}
              >
                {/* Category Icon */}
                <CategoryIcon categoryCode={category.code} size="sm" />

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="body-md font-medium text-foreground">{category.title}</h3>
                </div>

                {/* Progress Badge - green when complete, grey otherwise */}
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  isComplete 
                    ? "bg-hm-optimal50 text-hm-optimal200" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {answered}/{total}
                </div>

                {/* Chevron */}
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
