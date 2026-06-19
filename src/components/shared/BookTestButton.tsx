import { useLocale } from "@/hooks/useLocale";
import ArrowRightIcon from "@/assets/nav-icons/arrow-right.svg";
import { cn } from "@/lib/utils";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";

interface BookTestButtonProps {
  className?: string;
  fullWidth?: boolean;
  size?: "default" | "lg";
}

export function BookTestButton({
  className,
  fullWidth = false,
  size = "default",
}: BookTestButtonProps) {
  const { t } = useLocale();
  const { url: userShopUrl, isLoading: isUserShopUrlLoading } =
    useUserShopUrl();

  return (
    <a
      href={userShopUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90",
        size === "lg" ? "h-14 px-6 text-lg" : "px-4 py-2 text-base",
        fullWidth && "w-full",
        className,
      )}
    >
      <span className="whitespace-nowrap">{t("nav.bookTest")}</span>
      <img src={ArrowRightIcon} alt="" className="shrink-0 h-4 w-4" />
    </a>
  );
}
