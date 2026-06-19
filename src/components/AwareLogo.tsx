import { cn } from "@/lib/utils";

interface AwareLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "gradient" | "mono";
}

const sizeMap = {
  sm: { width: 24, height: 40 },
  md: { width: 32, height: 52 },
  lg: { width: 40, height: 66 },
  xl: { width: 48, height: 80 },
  xxl: { width: 64, height: 104 },
};

export function AwareLogo({ className, size = "md" }: AwareLogoProps) {
  const { width, height } = sizeMap[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 -14 15 50"
      fill="none"
      className={cn(className)}
    >
      <g clipPath="url(#clip0_1_1738)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.6028 3.49721C8.79989 1.37577 5.61862 1.11752 3.49718 2.92038C1.28227 4.80268 1.11395 8.16315 3.12969 10.2574L3.19009 10.3201C3.75054 10.9024 4.67688 10.9201 5.25915 10.3596C5.84141 9.79917 5.8591 8.87283 5.29865 8.29056L5.23824 8.22781C4.39279 7.34944 4.46339 5.93996 5.39238 5.15047C6.28217 4.3943 7.61649 4.50262 8.37266 5.39241L9.63897 6.88248L11.8691 4.98728L10.6028 3.49721Z"
          fill="url(#paint0_radial_1_1738)"
        ></path>
        <path
          d="M12.8515,13.2383 L17.2832,8.02344 C18.0142,7.16329 17.9095,5.87342 17.0493,5.14243 C16.1892,4.41145 14.8993,4.51616 14.1683,5.37631 L9.73657,10.5911 C9.00559,11.4513 9.1103,12.7412 9.97045,13.4722 C10.8306,14.2031 12.1205,14.0984 12.8515,13.2383 M18.9445,2.91234 C16.8527,1.13466 13.7159,1.38931 11.9382,3.48111 L7.50648,8.69594 C5.72881,10.7877 5.98345,13.9246 8.07525,15.7022 C10.167,17.4799 13.3039,17.2253 15.0816,15.1335 L19.5133,9.91864 C21.291,7.82685 21.0363,4.69002 18.9445,2.91234 "
          fillRule="evenodd"
          fill="url(#paint1_linear_1_1738)"
          clipRule="evenodd"
        ></path>
        <path
          d="M14.9922,8.53926 L11.1952,4.07504 L7.39808,8.53926 C5.59924,10.6542 5.85692,13.8256 7.97362,15.6229 C8.9106,16.418501 10.0548,16.811501 11.1952,16.819 C12.3355,16.811501 13.4797,16.418501 14.4167,15.6229 C16.5334,13.8256 16.7911,10.6542 14.9922,8.53926 M11.1952,13.8599 C11.659,13.8526 12.1171,13.6925 12.4989,13.3682 C13.3693,12.6292 13.4753,11.325 12.7356,10.4554 L11.1952,8.6443 L9.65473,10.4554 C8.91504,11.325 9.021,12.6292 9.89139,13.3682 C10.2733,13.6925 10.7314,13.8526 11.1952,13.8599 "
          fillRule="evenodd"
          fill="url(#paint2_linear_1_1738)"
          clipRule="evenodd"
        ></path>
      </g>
      <defs>
        <radialGradient
          id="paint0_radial_1_1738"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(-6.30349 5.17786 6.55719 4.3796 10.5494 4.75783)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#BA83FA"></stop>
          <stop offset="0.489583" stopColor="#FF88BD"></stop>
          <stop offset="1" stopColor="#FFD660"></stop>
        </radialGradient>
        <linearGradient
          id="paint1_linear_1_1738"
          x1="14.1518"
          y1="8.02318"
          x2="18.4826"
          y2="2.71213"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B97CFF"></stop>
          <stop offset="0.382862" stopColor="#66A9FF"></stop>
          <stop offset="0.878905" stopColor="#5EFFB2"></stop>
        </linearGradient>
        <linearGradient
          id="paint2_linear_1_1738"
          x1="11.205"
          y1="16.7359"
          x2="8.25063"
          y2="4.71581"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#878BF1"></stop>
          <stop offset="0.641672" stopColor="#BB82FF"></stop>
          <stop offset="0.96875" stopColor="#E876DB"></stop>
        </linearGradient>
        <clipPath id="clip0_1_1738">
          <rect width={width} height={height} fill="white"></rect>
        </clipPath>
      </defs>
    </svg>
  );
}
