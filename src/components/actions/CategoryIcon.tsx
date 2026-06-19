import { User, Utensils, Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  categoryCode: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { iconColor: string; bgColor: string; Icon: React.ElementType }
> = {
  personal: {
    iconColor: '#8E8AF2',
    bgColor: '#EDE8FD',
    Icon: User,
  },
  nutrition: {
    iconColor: '#F59E0B',
    bgColor: '#FEF3C7',
    Icon: Utensils,
  },
  lifestyle: {
    iconColor: '#10B981',
    bgColor: '#D1FAE5',
    Icon: Activity,
  },
  medical: {
    iconColor: '#3B82F6',
    bgColor: '#DBEAFE',
    Icon: Heart,
  },
};

const SIZE_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const ICON_SIZES = {
  sm: 18,
  md: 22,
  lg: 28,
};

export function CategoryIcon({ categoryCode, size = 'md', className }: CategoryIconProps) {
  const config = CATEGORY_CONFIG[categoryCode] || CATEGORY_CONFIG.personal;
  const { Icon, iconColor, bgColor } = config;

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center flex-shrink-0',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      <Icon size={ICON_SIZES[size]} style={{ color: iconColor }} />
    </div>
  );
}
