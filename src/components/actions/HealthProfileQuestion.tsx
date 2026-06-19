import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, type Easing } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import type {
  HealthProfileQuestion as QuestionType,
  HealthProfileAnswer,
} from "@/types/healthProfile";
import { toast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/useLocale";

interface HealthProfileQuestionProps {
  question: QuestionType;
  categoryCode: string;
  currentIndex: number;
  totalQuestions: number;
  existingAnswer?: HealthProfileAnswer;
  onAnswer: (answer: HealthProfileAnswer) => void;
  onSkip: () => void;
  onClose: () => void;
}

const easeOut: Easing = [0.16, 1, 0.3, 1];

// Animation variants for question transitions
const questionVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const optionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.3,
      ease: easeOut,
    },
  }),
};

export function HealthProfileQuestion({
  question,
  categoryCode,
  currentIndex,
  totalQuestions,
  existingAnswer,
  onAnswer,
  onSkip,
  onClose,
}: HealthProfileQuestionProps) {
  const { t } = useLocale();
  const [selectedValue, setSelectedValue] = useState<
    string | number | boolean | null
  >(existingAnswer?.value ?? null);
  const [inputValue, setInputValue] = useState<string>(
    existingAnswer?.value?.toString() ?? "",
  );

  // Reset state when question changes
  useEffect(() => {
    setSelectedValue(existingAnswer?.value ?? null);
    setInputValue(existingAnswer?.value?.toString() ?? "");
  }, [question.code, existingAnswer]);

  const isNumberType =
    question.type === "NUMBER_DECIMAL" || question.type === "NUMBER_INTEGER";

  const handleContinue = () => {
    if (isNumberType) {
      const numValue = parseFloat(inputValue);
      if (
        !isNaN(numValue) &&
        question?.input?.min &&
        question?.input?.max &&
        numValue >= question?.input?.min &&
        numValue <= question?.input?.max
      ) {
        onAnswer({ code: question.code, value: numValue });
      } else {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("common.valueOutOfRange")
            .replace("{min}", question?.input?.min?.toString() ?? "0")
            .replace("{max}", question?.input?.max?.toString() ?? "0"),
        });
      }
    } else {
      onAnswer({ code: question.code, value: selectedValue });
    }
  };

  const isAnswered = isNumberType
    ? inputValue.trim() !== "" && !isNaN(parseFloat(inputValue))
    : selectedValue !== null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)] max-w-xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="text-sm font-medium text-muted-foreground">
          {currentIndex + 1}/{totalQuestions}
        </span>

        <button
          onClick={onSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-foreground rounded-full"
          initial={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
          animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* White container for question content */}
      <div className="bg-white rounded-2xl p-6 flex-1">
        {/* Question content with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.code}
            variants={questionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            {/* Category icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CategoryIcon categoryCode={categoryCode} size="md" />
            </motion.div>

            {/* Question text */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <h2 className="text-lg font-semibold text-foreground">
                {question.title}
              </h2>
              {question.description && (
                <p className="text-sm text-muted-foreground">
                  {question.description}
                </p>
              )}
            </motion.div>

            {/* Answer options */}
            <div className="space-y-3 pt-2">
              {isNumberType ? (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="relative">
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        question.input?.hint
                          ? String(question.input.hint)
                          : `Enter value`
                      }
                      min={question.input?.min}
                      max={question.input?.max}
                      className="pr-12 h-12 text-base border border-[#b8e094]"
                      autoFocus
                    />
                    {question.input?.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {question.input.unit}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                question.input?.options?.map((option, index) => (
                  <motion.button
                    key={String(option.value)}
                    custom={index}
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    onClick={() => setSelectedValue(option.value)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full p-4 rounded-xl text-left font-medium transition-colors duration-200 border",
                      selectedValue === option.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background border-[#b8e094] hover:bg-muted/30",
                    )}
                  >
                    {option.label}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <motion.div
        className="pt-6 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Button
          onClick={handleContinue}
          disabled={!isAnswered}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-base transition-all duration-200",
            isAnswered
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Continue
        </Button>
      </motion.div>
    </div>
  );
}
