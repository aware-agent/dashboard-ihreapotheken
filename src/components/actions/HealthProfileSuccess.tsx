import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HealthProfileSuccessProps {
  onContinue: () => void;
}

export function HealthProfileSuccess({ onContinue }: HealthProfileSuccessProps) {
  // Auto-continue after 2 seconds
  setTimeout(onContinue, 2000);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-hm-optimal100/20 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-hm-optimal200" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        Thanks for updating your health profile.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground"
      >
        Your recommendations are now more personalized.
      </motion.p>
    </div>
  );
}
