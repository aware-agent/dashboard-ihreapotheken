import { Link } from "@tanstack/react-router";
import { useLocale } from "@/hooks/useLocale";
import IhreApothekenLogoSvg from "@/assets/ihreapotheken-apotheke-logo.svg";
import { useUserShopUrl } from "@/hooks/useUserShopUrl";
import { useCookies } from "@/hooks/useCookies";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, FlaskConical, TrendingUp, ShieldCheck, ChevronRight } from "lucide-react";

const Index = () => {
  const { isAuthenticated, clearAuthCookies } = useCookies();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { url: userShopUrl } = useUserShopUrl();

  const handleSignOut = () => {
    clearAuthCookies();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e8e8e8]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[68px]">
          <img src={IhreApothekenLogoSvg} alt="IhreApotheken" className="h-6" />
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                <Link to="/dashboard">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#D32F2F] hover:bg-[#f0fae8] transition-colors">
                    {t("landing.dashboard")}
                  </button>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#b0b0b0] hover:text-[#787878] hover:bg-[#f7f7f7] transition-colors"
                >
                  {t("landing.signOut")}
                </button>
              </>
            ) : (
              <Link to="/login">
                <button className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#D32F2F] text-white hover:bg-[#58a026] transition-colors">
                  {t("landing.signIn")}
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-[68px] relative overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Background photo */}
        <div className="absolute inset-0">
          <img src="/hero-lakeside.jpg" alt="" className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.1) 100%)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium mb-6 border border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
              {t("landing.aiPoweredInsights")}
            </div>
            <h1 className="font-['Lora'] text-5xl md:text-6xl font-normal text-white leading-[1.1] tracking-tight mb-5">
              {t("landing.heroTitle")}<br />
              <em className="text-[#a8d97a]">{t("landing.heroTitleHighlight")}</em>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              {t("landing.heroDescription")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={isAuthenticated() ? "/dashboard" : "/login"}>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D32F2F] text-white font-semibold hover:bg-[#58a026] transition-colors text-sm">
                  {isAuthenticated() ? t("landing.viewDashboard") : t("landing.logIn")}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href={userShopUrl.toString()} target="_blank" rel="noopener noreferrer">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition-colors text-sm backdrop-blur-sm">
                  {t("landing.bookATest")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Strip ── */}
      <section className="border-t border-[#f0f0f0] bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D32F2F] mb-10">
            {t("landing.understandHealth")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureItem
              icon={<FlaskConical className="w-5 h-5 text-[#D32F2F]" />}
              title={t("landing.personalizedInsights")}
              description={t("landing.personalizedInsightsDesc")}
            />
            <FeatureItem
              icon={<TrendingUp className="w-5 h-5 text-[#D32F2F]" />}
              title={t("landing.trackProgress")}
              description={t("landing.trackProgressDesc")}
            />
            <FeatureItem
              icon={<ShieldCheck className="w-5 h-5 text-[#D32F2F]" />}
              title={t("landing.biomarkerInsights")}
              description={t("landing.biomarkerInsightsDesc")}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="bg-[#D32F2F]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-medium text-white mb-1">{t("landing.bookATest")}</h2>
            <p className="text-white/70 text-sm">{t("landing.unlockHealthInsights")}</p>
          </div>
          <a href={userShopUrl.toString()} target="_blank" rel="noopener noreferrer">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#D32F2F] font-semibold hover:bg-[#f0fae8] transition-colors text-sm shrink-0">
              {t("common.getStarted")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e8e8e8] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={IhreApothekenLogoSvg} alt="IhreApotheken" className="h-4" />
            <span className="text-[#b0b0b0] text-xs">
              © {new Date().getFullYear()} IhreApotheken. {t("landing.allRightsReserved")}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to={locale === "EN" ? "https://www.aware.app/en/privacy-policy" : "https://www.aware.app/de/datenschutzbestimmungen"}
              className="text-xs text-[#b0b0b0] hover:text-[#D32F2F] transition-colors"
            >
              {t("landing.privacyPolicy")}
            </Link>
            <Link
              to={locale === "EN" ? "https://www.aware.app/en/terms-and-conditions" : "https://www.aware.app/de/bedingungen-und-konditionen"}
              className="text-xs text-[#b0b0b0] hover:text-[#D32F2F] transition-colors"
            >
              {t("landing.termsOfService")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#FDEAEA] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#2F2F2F] mb-1">{title}</h3>
        <p className="text-sm text-[#787878] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default Index;
