import { Link } from "@tanstack/react-router";
import { useBioAge } from "@/hooks/useBioAge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/hooks/useLocale";
import { ArrowUpRight } from "lucide-react";

export function BioAgeWidget() {
  const { data, isLoading } = useBioAge();
  const { t } = useLocale();

  if (isLoading) {
    return <div className="rounded-3xl overflow-hidden" style={{ minHeight: '280px' }}><Skeleton className="w-full h-full" /></div>;
  }

  if (!data) {
    return (
      <div className="relative rounded-3xl overflow-hidden group" style={{ minHeight: '280px' }}>
        <div className="absolute inset-0">
          <img src="/hero-flower-field.avif" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%)' }} />
        </div>
        <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: '280px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            {t("nav.bioAge")}
          </span>
          <div>
            <p style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '28px', fontWeight: 400, fontStyle: 'italic', color: 'white', lineHeight: 1.3, marginBottom: '20px' }}>
              Entdecke dein<br />biologisches Alter.
            </p>
            <Link to="/bio-age">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors backdrop-blur-sm cursor-pointer">
                Mehr erfahren <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const diff = Math.abs(data.ageAtBloodDraw - data.bioAge);
  const isYounger = data.ageAtBloodDraw > data.bioAge;

  return (
    <div className="relative rounded-3xl overflow-hidden group" style={{ minHeight: '280px' }}>
      <div className="absolute inset-0">
        <img src="/hero-flower-field.avif" alt="" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.60) 100%)' }} />
      </div>
      <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: '280px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
          {t("nav.bioAge")}
        </span>

        <div>
          <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '80px', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.04em', color: 'white' }}>
            {data.bioAge}<span style={{ fontSize: '28px', opacity: 0.5 }}> J.</span>
          </div>
          {isYounger && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full" style={{ background: 'rgba(101,179,46,0.85)', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>↑ {diff.toFixed(1)} Jahre jünger als dein Alter</span>
            </div>
          )}
        </div>

        <Link to="/bio-age">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors backdrop-blur-sm cursor-pointer">
            Details ansehen <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
