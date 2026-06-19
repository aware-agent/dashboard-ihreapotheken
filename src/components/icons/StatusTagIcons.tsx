import { cn } from '@/lib/utils';

interface StatusIconProps {
  className?: string;
}

export function OptimalTagIcon({ className }: StatusIconProps) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M8.6 2C9.02675 5.35769 10.3537 7.42786 14 8C10.5401 8.54289 9.04673 10.4851 8.6 14C8.15327 10.4851 6.65989 8.54289 3.2 8C6.65989 7.45711 8.15327 5.51487 8.6 2Z" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M3.8 2C3.96539 3.00408 4.56767 3.62996 5.6 3.8C4.56767 3.97004 3.96539 4.59592 3.8 5.6C3.63461 4.59592 3.03233 3.97004 2 3.8C3.00408 3.63461 3.62996 3.03233 3.8 2Z" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InRangeTagIcon({ className }: StatusIconProps) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M5.99845 6.66504V7.33171M9.99845 6.66504V7.33171M5.61792 9.66504C6.22289 10.2822 7.06593 10.665 7.9984 10.665C8.93086 10.665 9.7739 10.2822 10.3789 9.66504M7.99844 14.0984C4.6295 14.0984 1.89844 11.3674 1.89844 7.99844C1.89844 4.6295 4.6295 1.89844 7.99844 1.89844C11.3674 1.89844 14.0984 4.6295 14.0984 7.99844C14.0984 11.3674 11.3674 14.0984 7.99844 14.0984Z" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HighTagIcon({ className }: StatusIconProps) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M4 6.551C5.03704 5.14873 6.24852 3.88928 7.60379 2.80374C7.72005 2.71062 7.86002 2.66406 8 2.66406M12 6.551C10.963 5.14873 9.75148 3.88928 8.39621 2.80374C8.27995 2.71062 8.13998 2.66406 8 2.66406M8 2.66406V13.3307" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LowTagIcon({ className }: StatusIconProps) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M4 9.4438C5.03704 10.8461 6.24852 12.1055 7.60379 13.191C7.72005 13.2842 7.86002 13.3307 8 13.3307M12 9.4438C10.963 10.8461 9.75148 12.1055 8.39621 13.191C8.27995 13.2842 8.13998 13.3307 8 13.3307M8 13.3307L8 2.66406" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NoDataTagIcon({ className }: StatusIconProps) {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <path 
        d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" 
        stroke="currentColor" 
        strokeWidth="1.33333" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
