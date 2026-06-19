import { useLocale } from "@/hooks/useLocale";
import { Sparkles } from "lucide-react";

export function CompanionWidget() {
  const { t } = useLocale();

  return (
    <div className="relative rounded-3xl overflow-hidden group" style={{ minHeight: '280px' }}>
      <div className="absolute inset-0">
        <img src="/hero-hands.jpg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)' }} />
      </div>
      <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: '280px' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#a8d97a' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            {t("companionWidget.title")}
          </span>
        </div>

        <div>
          <p style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '28px', fontWeight: 400, fontStyle: 'italic', color: 'white', lineHeight: 1.35, marginBottom: '24px' }}>
            Deine persönliche<br />Gesundheitsanalyse.
          </p>
          <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium backdrop-blur-sm cursor-not-allowed" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }}>
            {t("common.comingSoon")}
          </button>
        </div>
      </div>
    </div>
  );
}
