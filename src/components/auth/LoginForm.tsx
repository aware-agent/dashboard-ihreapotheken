import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChallenge } from "@/hooks/useAuth";
import { isApiError } from "@/types/api";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

// Email validation schema
const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters");

interface LoginFormProps {
  onSuccess: (email: string) => void;
  onError: (message: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const challengeMutation = useChallenge();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setValidationError(result.error.errors[0].message);
      return;
    }

    // Send OTP challenge
    challengeMutation.mutate(
      { username: email, connection: "email" },
      {
        onSuccess: () => {
          onSuccess(email);
        },
        onError: (error) => {
          if (isApiError(error)) {
            onError(error.message);
          } else {
            onError("Failed to send verification code. Please try again.");
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-foreground font-medium text-sm">
          Email address
        </Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-12 bg-background border-2 border-border hover:border-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={challengeMutation.isPending}
          />
        </div>
        {validationError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
            {validationError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all group"
        disabled={challengeMutation.isPending}
      >
        {challengeMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending code...
          </>
        ) : (
          <>
            {t("common.continue")}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}
