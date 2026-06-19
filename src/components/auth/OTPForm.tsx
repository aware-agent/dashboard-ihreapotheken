import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLogin, useChallenge } from "@/hooks/useAuth";
import { isApiError } from "@/types/api";
import { Loader2, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { useCookies } from "@/hooks/useCookies";
import { AUTH_COOKIE_KEYS } from "@/lib/cookies";

interface OTPFormProps {
  email: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onBack: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export function OTPForm({ email, onSuccess, onError, onBack }: OTPFormProps) {
  const { t } = useLocale();
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const loginMutation = useLogin();
  const challengeMutation = useChallenge();
  const { setCookie } = useCookies();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = () => {
    if (otp.length !== OTP_LENGTH) return;

    loginMutation.mutate(
      { username: email, otp },
      {
        onSuccess: (tokens) => {
          if (tokens.userExists) {
            setCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN, tokens.access_token);
            setCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
            setCookie(
              AUTH_COOKIE_KEYS.EXPIRES_AT,
              tokens.expires_in.toString(),
            );
            onSuccess();
          } else {
            onError(t("common.pleaseCreateAnAccount"));
          }
        },
        onError: (error) => {
          setOtp(""); // Clear OTP on error
          if (isApiError(error)) {
            onError(error.message);
          } else {
            onError(t("common.invalidVerificationCode"));
          }
        },
      },
    );
  };

  const handleResend = () => {
    if (resendTimer > 0) return;

    challengeMutation.mutate(
      { username: email, connection: "email" },
      {
        onSuccess: () => {
          setResendTimer(RESEND_COOLDOWN);
          setOtp("");
        },
        onError: (error) => {
          if (isApiError(error)) {
            onError(error.message);
          } else {
            onError(t("common.failedToResendCode"));
          }
        },
      },
    );
  };

  const isLoading = loginMutation.isPending || challengeMutation.isPending;

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("common.back")}
      </button>

      {/* Email indicator */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-hm-optimal50 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-hm-optimal200" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-muted-foreground text-sm">
            {t("common.weSentAVerificationCodeTo")}
          </p>
          <div className="flex items-center justify-center gap-2 text-foreground font-medium">
            <Mail className="w-4 h-4 text-muted-foreground" />
            {email}
          </div>
        </div>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
        >
          <InputOTPGroup className="gap-3">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="w-12 h-14 text-xl font-semibold border-2 border-border bg-background hover:border-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg transition-all"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerify}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all"
        disabled={otp.length !== OTP_LENGTH || isLoading}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendTimer > 0 || isLoading}
          className={`text-sm font-medium transition-colors ${
            resendTimer > 0
              ? "text-muted-foreground cursor-not-allowed"
              : "text-primary hover:text-primary/80"
          }`}
        >
          {resendTimer > 0 ? (
            <span className="flex items-center justify-center gap-1">
              Resend code in{" "}
              <span className="font-semibold tabular-nums">{resendTimer}s</span>
            </span>
          ) : challengeMutation.isPending ? (
            "Sending..."
          ) : (
            "Didn't receive a code? Resend"
          )}
        </button>
      </div>
    </div>
  );
}
