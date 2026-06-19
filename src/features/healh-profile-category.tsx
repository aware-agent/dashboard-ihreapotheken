import { useReducer, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { PageLayout } from "@/components/PageLayout";
import { HealthProfileQuestion } from "@/components/actions/HealthProfileQuestion";
import { HealthProfileSuccess } from "@/components/actions/HealthProfileSuccess";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/useLocale";
import {
  useHealthProfileQuestions,
  useUserHealthProfile,
  useSaveHealthProfile,
} from "@/hooks/useHealthProfile";
import type {
  HealthProfileCategory,
  HealthProfileAnswer,
} from "@/types/healthProfile";
import { usePageTracking } from "@/hooks/usePageTracking";

type ViewState = "categories" | "questions" | "success";

type HealthProfileState = {
  viewState: ViewState;
  selectedCategory: HealthProfileCategory | null;
  currentQuestionIndex: number;
  localAnswers: HealthProfileAnswer[];
  shouldNavigateToCategories: boolean;
};

type HealthProfileAction =
  | {
      type: "SET_LOCAL_ANSWERS";
      payload: HealthProfileAnswer[];
    }
  | {
      type: "SELECT_CATEGORY";
      payload: HealthProfileCategory;
    }
  | {
      type: "ADVANCE_OR_COMPLETE";
    }
  | {
      type: "RESET_TO_CATEGORIES";
    }
  | {
      type: "RESET_AND_REQUEST_NAVIGATION";
    }
  | {
      type: "CLEAR_NAVIGATION_REQUEST";
    };

const initialState: HealthProfileState = {
  viewState: "categories",
  selectedCategory: null,
  currentQuestionIndex: 0,
  localAnswers: [],
  shouldNavigateToCategories: false,
};

const healthProfileReducer = (
  state: HealthProfileState,
  action: HealthProfileAction,
): HealthProfileState => {
  switch (action.type) {
    case "SET_LOCAL_ANSWERS":
      return {
        ...state,
        localAnswers: action.payload,
      };
    case "SELECT_CATEGORY":
      return {
        ...state,
        viewState: "questions",
        selectedCategory: action.payload,
        currentQuestionIndex: 0,
        shouldNavigateToCategories: false,
      };
    case "ADVANCE_OR_COMPLETE":
      if (
        state.selectedCategory &&
        state.currentQuestionIndex < state.selectedCategory.questions.length - 1
      ) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
        };
      }

      return {
        ...state,
        viewState: "success",
      };
    case "RESET_TO_CATEGORIES":
      return {
        ...state,
        viewState: "categories",
        selectedCategory: null,
        currentQuestionIndex: 0,
        shouldNavigateToCategories: false,
      };
    case "RESET_AND_REQUEST_NAVIGATION":
      return {
        ...state,
        viewState: "categories",
        selectedCategory: null,
        currentQuestionIndex: 0,
        shouldNavigateToCategories: true,
      };
    case "CLEAR_NAVIGATION_REQUEST":
      return {
        ...state,
        shouldNavigateToCategories: false,
      };
    default:
      return state;
  }
};

// Map of valid return paths
const RETURN_PATHS: Record<string, { path: string; label: string }> = {
  profile: { path: "/profile", label: "healthProfile.backToProfile" },
  actions: { path: "/actions", label: "healthProfile.backToActions" },
};

const HealthProfileCategory = () => {
  const navigate = useNavigate();
  const { category: categoryParam = undefined } = useParams({ strict: false });

  const { toast } = useToast();
  const { t } = useLocale();
  const { referrer } = usePageTracking();

  const referrerPath = referrer
    ? new URL(referrer).pathname.split("/").filter(Boolean)
    : [];
  const returnTo = referrerPath[0] || "actions";
  const returnConfig = RETURN_PATHS[returnTo] || RETURN_PATHS.actions;

  // Data fetching
  const {
    data: categories,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useHealthProfileQuestions();
  const { data: userProfile, isLoading: isLoadingProfile } =
    useUserHealthProfile();
  const saveProfileMutation = useSaveHealthProfile();

  // Local state
  const [state, dispatch] = useReducer(healthProfileReducer, initialState);
  const {
    viewState,
    selectedCategory,
    currentQuestionIndex,
    localAnswers,
    shouldNavigateToCategories,
  } = state;

  // Sync local answers with server data
  useEffect(() => {
    if (userProfile?.healthProfile) {
      dispatch({
        type: "SET_LOCAL_ANSWERS",
        payload: userProfile.healthProfile,
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!shouldNavigateToCategories) {
      return;
    }

    if (viewState !== "categories" || selectedCategory !== null) {
      return;
    }

    navigate({ to: "/actions/health-profile" });
    dispatch({ type: "CLEAR_NAVIGATION_REQUEST" });
  }, [navigate, selectedCategory, shouldNavigateToCategories, viewState]);

  // Handle URL param for direct category access
  useEffect(() => {
    if (categoryParam !== undefined && categories) {
      const category = categories.find((c) => c.code === categoryParam);
      if (category) {
        dispatch({ type: "SELECT_CATEGORY", payload: category });
      }
    }
  }, [categoryParam, categories]);

  const isLoading = isLoadingQuestions || isLoadingProfile;
  const answers = localAnswers;

  const handleSelectCategory = (category: HealthProfileCategory) => {
    dispatch({ type: "SELECT_CATEGORY", payload: category });
    navigate({ to: `/actions/health-profile/${category.code}` });
  };

  const handleAnswer = async (answer: HealthProfileAnswer) => {
    // Update local answers
    const updatedAnswers = [...localAnswers];
    const existingIndex = updatedAnswers.findIndex(
      (a) => a.code === answer.code,
    );

    if (existingIndex >= 0) {
      updatedAnswers[existingIndex] = answer;
    } else {
      updatedAnswers.push(answer);
    }

    dispatch({ type: "SET_LOCAL_ANSWERS", payload: updatedAnswers });

    // Save to server
    const isNew =
      !userProfile?.healthProfile || userProfile.healthProfile.length === 0;

    try {
      await saveProfileMutation.mutateAsync({
        data: { healthProfile: updatedAnswers },
        isNew,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("errors.failedToSave"),
        description: t("errors.couldNotSaveChanges"),
      });
    }

    // Move to next question or complete
    dispatch({ type: "ADVANCE_OR_COMPLETE" });
  };

  const handleSkip = () => {
    dispatch({ type: "ADVANCE_OR_COMPLETE" });
  };

  const handleClose = () => {
    dispatch({ type: "RESET_AND_REQUEST_NAVIGATION" });
  };

  const handleSuccessContinue = () => {
    handleClose();
  };

  const handleBack = () => {
    navigate({ to: returnConfig.path });
  };

  if (isLoading) {
    return (
      <PageLayout title="">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (!categories || categories.length === 0 || questionsError) {
    return (
      <PageLayout title="">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {questionsError
              ? "Failed to load health profile questions."
              : "No health profile questions available."}
          </p>
        </div>
      </PageLayout>
    );
  }

  // Animation variants for view transitions
  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (viewState === "success") {
    return (
      <PageLayout title="">
        <AnimatePresence mode="wait">
          <motion.div
            key="success"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <HealthProfileSuccess onContinue={handleSuccessContinue} />
          </motion.div>
        </AnimatePresence>
      </PageLayout>
    );
  }

  if (viewState === "questions" && selectedCategory) {
    return (
      <PageLayout title="">
        <AnimatePresence mode="wait">
          <motion.div
            key="questions"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <HealthProfileQuestion
              question={selectedCategory.questions[currentQuestionIndex]}
              categoryCode={selectedCategory.code}
              currentIndex={currentQuestionIndex}
              totalQuestions={selectedCategory.questions.length}
              existingAnswer={answers.find(
                (a) =>
                  a.code ===
                  selectedCategory.questions[currentQuestionIndex].code,
              )}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              onClose={handleClose}
            />
          </motion.div>
        </AnimatePresence>
      </PageLayout>
    );
  }
};
export default HealthProfileCategory;
