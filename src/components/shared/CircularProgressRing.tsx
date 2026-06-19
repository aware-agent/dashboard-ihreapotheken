import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface RingSegment {
  value: number;
  color: string;
  label?: string;
}

interface CircularProgressRingProps {
  segments: RingSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * CircularProgressRing displays segments as overlays on a grey background.
 * - Grey background = always full circle (represents total)
 * - Green segment = in-range/optimal (starts at top, goes clockwise)
 * - Yellow segment = out-of-range (starts where green ends)
 * 
 * Segments are rendered in reverse order so later segments appear on top,
 * creating a layered effect where green shows first, then yellow overlays.
 */
export function CircularProgressRing({
  segments,
  total,
  size = 180,
  strokeWidth = 14,
  centerContent,
  animated = true,
  className,
  onClick,
}: CircularProgressRingProps) {
  const [animatedSegments, setAnimatedSegments] = useState<number[]>(
    animated ? segments.map(() => 0) : segments.map(s => (s.value / total) * 100)
  );

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedSegments(segments.map(s => (s.value / total) * 100));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [segments, total, animated]);

  // Calculate cumulative percentages for layered segments
  // First segment (green/in-range) starts at 0
  // Second segment (yellow/out-of-range) starts where first ends
  let cumulativeOffset = 0;
  const segmentElements = segments.map((segment, index) => {
    const percentage = animatedSegments[index];
    
    // Skip rendering segments with zero value to avoid rounded linecap artifacts
    if (segment.value === 0 || percentage === 0) {
      return null;
    }
    
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += (percentage / 100) * circumference;

    return (
      <circle
        key={index}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={segment.color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    );
  }).filter(Boolean);

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'relative',
        onClick && 'cursor-pointer group',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        {/* Background circle - always full, represents total */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#EAE8F4"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
        />
        {/* Segment circles - rendered in order, layered on top of background */}
        {segmentElements}
      </svg>
      {/* Center content */}
      {centerContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerContent}
        </div>
      )}
    </Wrapper>
  );
}
