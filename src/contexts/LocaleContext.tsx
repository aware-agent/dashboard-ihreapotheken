import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  translations,
  getNestedValue,
  type Locale,
  type TranslationKey,
} from "@/locales";
import { usersApi } from "@/api/users";
import { useUserProfile, userKeys } from "@/hooks/useUser";
import { toast } from "@/hooks/use-toast";
import { setLocaleGetter } from "@/api/client";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  isChanging: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

// Detect browser locale
function detectBrowserLocale(): Locale {
  const browserLang = navigator.language.split("-")[0].toUpperCase();
  if (browserLang === "DE") return "DE";
  return "EN";
}

// Get initial locale from localStorage or browser - used for immediate API client setup
function getInitialLocale(): Locale {
  const stored = localStorage.getItem("aware-locale") as Locale | null;
  if (stored && (stored === "EN" || stored === "DE")) {
    return stored;
  }
  return detectBrowserLocale();
}

// Initialize locale getter immediately (before any component renders)
// This ensures API calls have the correct locale even before LocaleProvider mounts
setLocaleGetter(getInitialLocale);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  // Initialize locale from localStorage or browser detection first (sync, no hooks)
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  // These hooks are now called after initial state is set
  const { data: user } = useUserProfile();
  const queryClient = useQueryClient();

  // Update locale getter when locale changes
  useEffect(() => {
    setLocaleGetter(() => locale);
  }, [locale]);

  // Sync locale when user profile loads
  useEffect(() => {
    if (user?.language) {
      const userLocale = user.language as Locale;
      if (userLocale === "EN" || userLocale === "DE") {
        setLocaleState(userLocale);
        localStorage.setItem("aware-locale", userLocale);
      }
    }
  }, [user?.language]);

  // Mutation for updating language on the server
  const updateLanguageMutation = useMutation({
    mutationFn: (newLocale: Locale) =>
      usersApi.updateSettings({ language: newLocale }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (_, previousLocale) => {
      // Revert on error
      setLocaleState(previousLocale);
      localStorage.setItem("aware-locale", previousLocale);
      toast({
        title: getNestedValue(translations[locale], "common.error"),
        description: getNestedValue(
          translations[locale],
          "errors.failedToUpdateLanguage",
        ),
        variant: "destructive",
      });
    },
  });

  // Set locale with optimistic update and API sync
  // No need to invalidate queries - each language has its own cache key
  const setLocale = useCallback(
    (newLocale: Locale) => {
      const previousLocale = locale;

      // Optimistic update
      setLocaleState(newLocale);
      localStorage.setItem("aware-locale", newLocale);

      // Sync to API if user is authenticated
      if (user) {
        updateLanguageMutation.mutate(newLocale, {
          onError: () => {
            // Revert handled in mutation onError
            setLocaleState(previousLocale);
            localStorage.setItem("aware-locale", previousLocale);
          },
        });
      }
    },
    [locale, user, updateLanguageMutation],
  );

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      const translation = getNestedValue(translations[locale], key);
      if (translation === key) {
        // Fallback to English if not found in current locale
        return getNestedValue(translations.EN, key);
      }
      return translation;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isChanging: updateLanguageMutation.isPending,
    }),
    [locale, setLocale, t, updateLanguageMutation.isPending],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);

  // Fail-safe: during HMR or early initialization, the Provider can be
  // temporarily unavailable. Returning a safe default prevents a blank screen.
  if (!context) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        "useLocaleContext used without LocaleProvider; falling back to default locale.",
      );
    }

    const fallbackLocale = getInitialLocale();
    return {
      locale: fallbackLocale,
      setLocale: (next: Locale) => {
        localStorage.setItem("aware-locale", next);
        setLocaleGetter(() => next);
      },
      t: (key: TranslationKey) => {
        const translation = getNestedValue(translations[fallbackLocale], key);
        if (translation === key) return getNestedValue(translations.EN, key);
        return translation;
      },
      isChanging: false,
    } satisfies LocaleContextValue;
  }

  return context;
}
