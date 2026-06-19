import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { OTPForm } from "@/components/auth/OTPForm";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/useLocale";
import { LoginStep } from "@/types/auth";
import { useCookies } from "@/hooks/useCookies";
import ihreapothekenLogo from "@/assets/ihreapotheken-apotheke-logo.svg";
import { FlaskConical, TrendingUp, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: FlaskConical, labelKey: "landing.personalizedInsights", descKey: "landing.personalizedInsightsDesc" },
  { icon: TrendingUp, labelKey: "landing.trackProgress", descKey: "landing.monitorYourBiomarkersOverTime" },
  { icon: ShieldCheck, labelKey: "landing.biomarkerInsights", descKey: "landing.getActionableHealthRecommendations" },
];

const Auth = () => {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const { isAuthenticated } = useCookies();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (isAuthenticated()) navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated(), navigate]);

  const handleEmailSuccess = (e: string) => {
    setEmail(e);
    setStep("otp");
    toast({ title: t("toast.codeSent"), description: t("toast.checkEmailForCode") });
  };

  const handleOTPSuccess = () => {
    toast({ title: t("toast.welcomeBack"), description: t("toast.successfullySignedIn") });
    navigate({ to: "/dashboard", replace: true });
  };

  const handleError = (msg: string) =>
    toast({ variant: "destructive", title: t("common.error"), description: msg });

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col bg-[#FFF5F5] border-r border-[#FECDD3]">
        {/* Top bar */}
        <div className="h-1 bg-[#D32F2F]" />

        <div className="flex flex-col flex-1 p-10">
          {/* Logo */}
          <img src={ihreapothekenLogo} alt="IhreApotheken" className="h-7 w-auto object-left object-contain mb-16" />

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#D32F2F] mb-4">
              {t("landing.aiPoweredInsights")}
            </p>
            <h1 className="text-3xl font-medium text-[#2F2F2F] leading-snug mb-4">
              {t("landing.yourHealthInsights")}<br />
              <span className="text-[#D32F2F]">{t("landing.allInOnePlace")}</span>
            </h1>
            <p className="text-[#787878] text-sm leading-relaxed mb-10 max-w-xs">
              {t("landing.trackYourBiomarkers")}
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, labelKey, descKey }) => (
                <div key={labelKey} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FDEAEA] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#D32F2F]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2F2F2F]">{t(labelKey)}</p>
                    <p className="text-xs text-[#787878] mt-0.5 leading-relaxed">{t(descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#b0b0b0]">© {currentYear} IhreApotheken. {t("landing.allRightsReserved")}</p>
        </div>
      </div>

      {/* ── Right: Auth form ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center py-8 border-b border-[#f0f0f0]">
          <img src={ihreapothekenLogo} alt="IhreApotheken" className="h-7" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-medium text-[#2F2F2F] mb-1.5">
                {step === "email" ? t("landing.welcomeBack") : t("landing.enterVerificationCode")}
              </h2>
              <p className="text-sm text-[#787878]">
                {step === "email"
                  ? t("landing.signInToAccessYourHealthDashboard")
                  : t("landing.weSentAVerificationCodeTo")}
              </p>
            </div>

            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6">
              {step === "email" ? (
                <LoginForm onSuccess={handleEmailSuccess} onError={handleError} />
              ) : (
                <OTPForm email={email} onSuccess={handleOTPSuccess} onError={handleError} onBack={() => { setStep("email"); setEmail(""); }} />
              )}
            </div>

            <p className="text-xs text-[#b0b0b0] text-center mt-6">
              © {currentYear} IhreApotheken
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
