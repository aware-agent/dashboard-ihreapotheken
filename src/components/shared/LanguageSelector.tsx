import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useLocale, type Locale } from '@/hooks/useLocale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Import flag icons
import enFlag from '@/assets/flags/en.png';
import deFlag from '@/assets/flags/de.png';

interface LanguageOption {
  code: Locale;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'EN', name: 'English', flag: enFlag },
  { code: 'DE', name: 'Deutsch', flag: deFlag },
];

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({ className, compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, isChanging } = useLocale();
  const [open, setOpen] = useState(false);

  const currentLanguage = languages.find(l => l.code === locale) || languages[0];

  const handleSelect = (code: Locale) => {
    if (code !== locale) {
      setLocale(code);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg transition-colors hover:bg-muted",
            compact ? "px-2 py-1.5" : "px-3 py-2",
            className
          )}
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <img 
              src={currentLanguage.flag} 
              alt={currentLanguage.name} 
              className="h-5 w-5 rounded-sm object-cover"
            />
          )}
          {!compact && (
            <>
              <span className="text-sm font-medium">{currentLanguage.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <div className="flex flex-col">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-muted",
                locale === lang.code && "bg-muted font-medium"
              )}
            >
              <img 
                src={lang.flag} 
                alt={lang.name} 
                className="h-5 w-5 rounded-sm object-cover"
              />
              <span className="flex-1 text-left font-medium">{lang.name}</span>
              {locale === lang.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
