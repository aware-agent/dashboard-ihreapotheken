import { cn } from "@/lib/utils";
import { ResultType } from "@/types/results";
import { useLocale } from "@/hooks/useLocale";

interface ResultTypeBadgeProps {
  type: ResultType;
  className?: string;
}

const AwareIcon = () => (
  <svg
    width="18"
    height="16"
    viewBox="0 0 18 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.54216 2.9974C7.13533 1.34198 4.65289 1.14046 2.99748 2.54728C1.26912 4.0161 1.13777 6.63836 2.71071 8.27253L2.75785 8.3215C3.19518 8.77586 3.91803 8.78966 4.37239 8.35233C4.82674 7.915 4.84055 7.19215 4.40322 6.73779L4.35608 6.68882C3.69635 6.0034 3.75143 4.90355 4.47636 4.28749C5.17069 3.69742 6.21189 3.78195 6.80195 4.47628L7.79009 5.63902L9.5303 4.16014L8.54216 2.9974Z"
      fill="url(#paint0_radial_51_535)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.2972 10.5998L13.7558 6.53009C14.3262 5.85882 14.2445 4.85219 13.5732 4.28172C12.902 3.71125 11.8953 3.79297 11.3249 4.46424L7.86628 8.53396C7.29581 9.20524 7.37753 10.2119 8.0488 10.7823C8.72007 11.3528 9.72671 11.2711 10.2972 10.5998ZM15.0523 2.54133C13.4198 1.154 10.9718 1.35274 9.58447 2.9852L6.12589 7.05492C4.73856 8.68739 4.93729 11.1354 6.56976 12.5227C8.20222 13.9101 10.6502 13.7113 12.0376 12.0789L15.4961 8.00914C16.8835 6.37667 16.6847 3.92865 15.0523 2.54133Z"
      fill="url(#paint1_linear_51_535)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.9678 6.9326L9.0045 3.44867L6.04121 6.9326C4.63737 8.5831 4.83846 11.0581 6.49037 12.4608C7.2216 13.0817 8.11453 13.3884 9.0045 13.3942C9.89447 13.3884 10.7874 13.0817 11.5186 12.4608C13.1705 11.0581 13.3716 8.5831 11.9678 6.9326ZM9.0045 11.0849C9.36646 11.0792 9.72397 10.9542 10.022 10.7012C10.7012 10.1244 10.7839 9.10666 10.2067 8.42797L9.0045 7.01458L7.80232 8.42798C7.22506 9.10666 7.30775 10.1244 7.98702 10.7012C8.28503 10.9542 8.64254 11.0792 9.0045 11.0849Z"
      fill="url(#paint2_linear_51_535)"
    />
    <defs>
      <radialGradient
        id="paint0_radial_51_535"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(-4.91879 4.04043 5.11676 3.41752 8.50052 3.9811)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#BA83FA" />
        <stop offset="0.489583" stopColor="#FF88BD" />
        <stop offset="1" stopColor="#FFD660" />
      </radialGradient>
      <linearGradient
        id="paint1_linear_51_535"
        x1="11.312"
        y1="6.52989"
        x2="14.6918"
        y2="2.38508"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#B97CFF" />
        <stop offset="0.382862" stopColor="#66A9FF" />
        <stop offset="0.878905" stopColor="#5EFFB2" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_51_535"
        x1="9.01215"
        y1="13.3293"
        x2="6.70655"
        y2="3.94874"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#878BF1" />
        <stop offset="0.641672" stopColor="#BB82FF" />
        <stop offset="0.96875" stopColor="#E876DB" />
      </linearGradient>
    </defs>
  </svg>
);

const UploadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
  >
    <path
      opacity="0.28"
      d="M4.34045 4.6466C4.99829 3.09131 6.53833 2 8.33325 2C9.99299 2 11.4348 2.93311 12.1627 4.30335C12.3205 4.60044 12.3994 4.74899 12.4421 4.80725C12.5088 4.89818 12.4871 4.87397 12.5699 4.95049C12.623 4.99951 12.773 5.10256 13.0731 5.30863C14.0355 5.9695 14.6666 7.07771 14.6666 8.33333C14.6666 9.21975 14.352 10.0327 13.8285 10.6667M4.34045 4.6466C4.33012 4.67104 4.32 4.69559 4.3101 4.72026M4.34045 4.6466C4.33031 4.67058 4.32039 4.69466 4.31067 4.71885L4.3101 4.72026M4.3101 4.72026C4.11001 5.21884 3.99992 5.76323 3.99992 6.33333M4.3101 4.72026C4.09514 5.25534 3.98762 5.52295 3.93595 5.60314C3.83474 5.76023 3.91043 5.67023 3.77301 5.79687C3.70281 5.86157 3.38735 6.05682 2.75658 6.44724C1.90233 6.97598 1.33325 7.92153 1.33325 9C1.33325 9.61672 1.51934 10.19 1.83843 10.6667"
      stroke="#828185"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.6666 10.4203C10.0024 9.61806 9.23088 8.89432 8.37016 8.26549C8.1494 8.10421 7.85044 8.10421 7.62968 8.26549C6.76895 8.89432 5.99744 9.61806 5.33325 10.4203M7.99992 14V8.15109"
      stroke="#828185"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function ResultTypeBadge({ type, className }: ResultTypeBadgeProps) {
  const { t } = useLocale();
  const isAwareTest = type === "LAB";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[6px] px-2 py-1 rounded-full text-xs font-medium bg-foundation-manganese text-foreground",
        className,
      )}
    >
      {isAwareTest ? (
        <>
          <AwareIcon />
          {t("common.awareTest")}
        </>
      ) : (
        <>
          <UploadIcon />
          {t("common.uploaded")}
        </>
      )}
    </span>
  );
}
