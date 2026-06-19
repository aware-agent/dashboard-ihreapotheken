import { BiomarkerStatus } from '@/types/results';
import highIcon from '@/assets/status-icons/high.svg';
import lowIcon from '@/assets/status-icons/low.svg';
import inRangeIcon from '@/assets/status-icons/in_range.svg';
import optimalIcon from '@/assets/status-icons/optimal.svg';

interface StatusIndicatorIconProps {
  status: BiomarkerStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicatorIcon({ status, size = 'md', className }: StatusIndicatorIconProps) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  const getIconSrc = () => {
    switch (status) {
      case 'OPTIMAL':
        return optimalIcon;
      case 'NORMAL':
        return inRangeIcon;
      case 'HIGH':
        return highIcon;
      case 'LOW':
        return lowIcon;
      default:
        return null;
    }
  };

  const iconSrc = getIconSrc();
  if (!iconSrc) return null;

  return (
    <img 
      src={iconSrc} 
      alt={status} 
      className={`${sizeClasses} ${className || ''}`}
    />
  );
}

// Absolute positioned variant for overlays on biomarker icons
interface StatusIndicatorOverlayProps {
  status: BiomarkerStatus;
  position?: 'bottom-right' | 'bottom-left';
}

export function StatusIndicatorOverlay({ status, position = 'bottom-right' }: StatusIndicatorOverlayProps) {
  const positionClasses = position === 'bottom-right' 
    ? '-bottom-0.5 -right-0.5' 
    : '-bottom-0.5 -left-0.5';
  
  const getIconSrc = () => {
    switch (status) {
      case 'OPTIMAL':
        return optimalIcon;
      case 'NORMAL':
        return inRangeIcon;
      case 'HIGH':
        return highIcon;
      case 'LOW':
        return lowIcon;
      default:
        return null;
    }
  };

  const iconSrc = getIconSrc();
  if (!iconSrc) return null;

  return (
    <div className={`absolute ${positionClasses}`}>
      <img 
        src={iconSrc} 
        alt={status} 
        className="w-5 h-5"
      />
    </div>
  );
}
