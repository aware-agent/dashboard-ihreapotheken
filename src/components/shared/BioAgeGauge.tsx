import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { formatNumber } from "@/lib/dateUtils";

interface BioAgeGaugeProps {
  bioAge: number;
  chronologicalAge: number;
  minAge?: number;
  maxAge?: number;
  size?: "default" | "large";
  showDescription?: boolean;
  className?: string;
}

export function BioAgeGauge({
  bioAge,
  chronologicalAge,
  minAge: providedMinAge,
  maxAge: providedMaxAge,
  size = "default",
  showDescription = true,
  className = "",
}: BioAgeGaugeProps) {
  const { t, locale } = useLocale();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Calculate dynamic min/max if not provided
  const difference = chronologicalAge - bioAge;
  const isYounger = difference > 0;
  const absDifference = Math.abs(difference);

  // Center chronological age on gauge with ±15 year range
  const minAge = providedMinAge ?? chronologicalAge - 15;
  const maxAge = providedMaxAge ?? chronologicalAge + 15;

  // SVG parameters - scale based on size
  const scale = size === "large" ? 1.4 : 1;
  const width = 140 * scale;
  const height = 80 * scale;
  const centerX = width / 2;
  const centerY = 65 * scale;
  const radius = 55 * scale;
  const strokeWidth = 12 * scale;

  // Calculate angles (180 = left, 0 = right)
  const ageRange = maxAge - minAge;
  const bioAgeAngle = 180 - ((bioAge - minAge) / ageRange) * 180;
  const calendarAgeAngle = 180 - ((chronologicalAge - minAge) / ageRange) * 180;

  // Convert angle to coordinates
  const angleToCoord = (angle: number, r: number = radius) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(rad),
      y: centerY - r * Math.sin(rad),
    };
  };

  // Positions
  const bioAgePos = angleToCoord(bioAgeAngle);
  const calendarAgePos = angleToCoord(calendarAgeAngle);
  const leftPos = angleToCoord(180);
  const rightPos = angleToCoord(0);

  // Calculate arc length for animation
  const arcAngle = Math.abs(calendarAgeAngle - bioAgeAngle);
  const arcLength = (arcAngle / 180) * Math.PI * radius;

  // Arc color based on whether younger or older
  const arcColor = isYounger
    ? "hsl(var(--hm-optimal200))"
    : "hsl(var(--hm-moderaterisk200))";

  // Determine arc direction
  const arcPath = isYounger
    ? `M ${bioAgePos.x} ${bioAgePos.y} A ${radius} ${radius} 0 0 1 ${calendarAgePos.x} ${calendarAgePos.y}`
    : `M ${calendarAgePos.x} ${calendarAgePos.y} A ${radius} ${radius} 0 0 1 ${bioAgePos.x} ${bioAgePos.y}`;

  const fontSize = size === "large" ? "data-xl" : "data-xl";
  const subtextSize = size === "large" ? "text-base" : "text-sm";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Age Display */}
      <p className={`${subtextSize} text-muted-foreground mb-2`}>
        {t("bioAgeWidget.yourBioAgeIs")}
      </p>

      <motion.div
        className="text-center mb-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className={`${fontSize} text-[#2F2F2F]`}>
          {formatNumber(bioAge, locale, 1)}
        </span>
      </motion.div>

      {/* Summary text */}
      {showDescription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`px-2.5 py-0.5 rounded-sm mb-3 ${
            isYounger ? "bg-[#F0F0F0]" : "bg-[#FFF3EC]"
          }`}
        >
          <span
            className={`${subtextSize} font-medium tabular-nums ${
              isYounger ? "text-[#2F2F2F]" : "text-[#C2410C]"
            }`}
          >
            {isYounger ? "-" : "+"}
            {formatNumber(absDifference, locale, 1)}{" "}
            {isYounger
              ? t("bioAgeWidget.yearsYounger")
              : t("bioAgeWidget.yearsOlder")}
          </span>
        </motion.div>
      )}

      {/* Gauge */}
      <div className="flex justify-center">
        <svg
          width={width}
          height={height + 20 * scale}
          viewBox={`0 0 ${width} ${height + 20 * scale}`}
          className="overflow-visible"
        >
          {/* Background arc (light gray) */}
          <path
            d={`M ${leftPos.x} ${leftPos.y} A ${radius} ${radius} 0 0 1 ${rightPos.x} ${rightPos.y}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored arc from bio age to calendar age - animated */}
          <motion.path
            d={arcPath}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: isYounger ? -arcLength : arcLength }}
            animate={
              isAnimating
                ? { strokeDashoffset: 0 }
                : { strokeDashoffset: isYounger ? -arcLength : arcLength }
            }
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Dark cap at bio age end */}
          <motion.circle
            cx={bioAgePos.x}
            cy={bioAgePos.y}
            r={6 * scale}
            fill="hsl(var(--foreground))"
            initial={{ opacity: 0, scale: 0 }}
            animate={
              isAnimating ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
            }
            transition={{ duration: 0.4, delay: 1.1, ease: "easeOut" }}
          />

          {/* Tick line at calendar age */}
          <motion.line
            x1={calendarAgePos.x}
            y1={calendarAgePos.y + strokeWidth / 2}
            x2={calendarAgePos.x}
            y2={leftPos.y + 4 * scale}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5 * scale}
            initial={{ opacity: 0 }}
            animate={isAnimating ? { opacity: 0.6 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          />

          {/* Calendar age number */}
          <motion.text
            x={calendarAgePos.x}
            y={leftPos.y + 18 * scale}
            textAnchor="middle"
            className={`${
              size === "large" ? "text-base" : "text-sm"
            } font-semibold fill-foreground`}
            initial={{ opacity: 0 }}
            animate={isAnimating ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {chronologicalAge}
          </motion.text>

          {/* Min age label */}
          <text
            x={leftPos.x}
            y={leftPos.y + 18 * scale}
            textAnchor="middle"
            className={`${
              size === "large" ? "text-sm" : "text-xs"
            } fill-muted-foreground`}
          >
            {minAge}
          </text>

          {/* Max age label */}
          <text
            x={rightPos.x}
            y={rightPos.y + 18 * scale}
            textAnchor="middle"
            className={`${
              size === "large" ? "text-sm" : "text-xs"
            } fill-muted-foreground`}
          >
            {maxAge}
          </text>
        </svg>
      </div>

      {/* Chronological age reference */}
      {showDescription && (
        <p className="text-xs text-muted-foreground mt-2">
          {t("bioAgeWidget.vsChronologicalAge")} {chronologicalAge}
        </p>
      )}
    </div>
  );
}
