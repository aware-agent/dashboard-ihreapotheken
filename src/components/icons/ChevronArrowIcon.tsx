import * as React from "react";
import { cn } from "@/lib/utils";

interface ChevronArrowIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const ChevronArrowIcon = ({ size = 24, className, ...props }: ChevronArrowIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    {...props}
  >
    <path
      d="M16 8.13867C17.4619 9.20073 18.7713 10.4457 19.8942 11.8408C20.0353 12.016 20.0353 12.2613 19.8942 12.4365C18.7713 13.8316 17.4619 15.0766 16 16.1387"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
