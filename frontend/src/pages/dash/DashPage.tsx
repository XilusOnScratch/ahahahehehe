import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isStageCompleted, STAGES, resetProgress } from '../../lib/storage';

function DashPage() {
  const navigate = useNavigate();
  const isWordHuntCompleted = isStageCompleted(STAGES.WORDHUNT);
  const isStage2Completed = isStageCompleted(STAGES.STAGE2);
  const isStage3Completed = isStageCompleted(STAGES.STAGE3);

  // Calculate completed stars count
  const completedStarsCount = useMemo(() => {
    let count = 0;
    if (isWordHuntCompleted) count++;
    if (isStage2Completed) count++;
    if (isStage3Completed) count++;
    return count;
  }, [isWordHuntCompleted, isStage2Completed, isStage3Completed]);

  // Dynamic background and text colors based on stars
  const { bgGradient, textColor, textColorLight } = useMemo(() => {
    if (completedStarsCount === 0) {
      return {
        bgGradient: 'bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50',
        textColor: 'text-pink-300',
        textColorLight: 'text-pink-200'
      };
    } else if (completedStarsCount === 1) {
      return {
        bgGradient: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50',
        textColor: 'text-purple-300',
        textColorLight: 'text-purple-200'
      };
    } else {
      return {
        bgGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50', // Softer blue background
        textColor: 'text-[#a6dbeb]',
        textColorLight: 'text-[#a6dbeb]/70'
      };
    }
  }, [completedStarsCount]);

  return (
    <motion.div
      className={`flex flex-col items-center justify-center min-h-screen ${bgGradient} font-serif px-6 transition-colors duration-1000`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="text-center space-y-12"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 100
        }}
      >
        {/* Welcome Message */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className={`text-6xl font-serif ${textColor} mb-2 transition-colors duration-1000`}>welcome, ahana.</h1>
          <p className={`text-2xl ${textColorLight} transition-colors duration-1000`}>hehe</p>
        </motion.div>

        {/* Stars (1=wordhunt, 2=stage2 minigames, 3=stage3 placeholder) */}
        <div className="space-y-3">
          <motion.div
            className="flex gap-6 justify-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {[1, 2, 3].map((star) => {
              const isFilled = (star === 1 && isWordHuntCompleted) || (star === 2 && isStage2Completed) || (star === 3 && isStage3Completed);
              const stagePath = star === 1 ? '/stage1' : star === 2 ? '/stage2' : '/stage3';
              const isUnlocked = star === 1 || (star === 2 && isWordHuntCompleted) || (star === 3 && isWordHuntCompleted && isStage2Completed);

              return (
                <motion.div
                  key={star}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + star * 0.1 }}
                  className={isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  onClick={() => {
                    if (isUnlocked) {
                      // If it's stage 2 and completed, pass reset: true to restart
                      if (star === 2 && isStage2Completed) {
                        navigate(stagePath, { state: { reset: true } });
                      } else {
                        navigate(stagePath);
                      }
                    }
                  }}
                  whileHover={isUnlocked ? { scale: 1.15 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill={isFilled ? (completedStarsCount === 0 ? "rgb(251, 207, 232)" : completedStarsCount === 1 ? "rgb(216, 180, 254)" : "#a6dbeb") : "none"}
                    stroke={completedStarsCount === 0 ? "rgb(251, 207, 232)" : completedStarsCount === 1 ? "rgb(216, 180, 254)" : "#a6dbeb"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-colors duration-1000 ${completedStarsCount === 0 ? 'text-pink-200' : completedStarsCount === 1 ? 'text-purple-200' : ''}`}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

      </motion.div>


    </motion.div>
  );
}

export default DashPage;

