import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CountingNumber } from '../../components/ui/shadcn-io/counting-number';
import { completeStage, STAGES, isStageCompleted, saveWordHuntScore, getWordHuntScore } from '../../lib/storage';
import { setFavicon } from '../../lib/favicon';

// Hardcoded grid letters: poncsatrrtiasedu (left to right, top to bottom)
const GRID_LETTERS = ["q", "l", "p", "s", "a", "a", "h", "s", "e", "t", "l", "e", "h", "t", "f", "f"];
const GRID_SIZE = 4;
const TIME_LIMIT = 90; // seconds
const TARGET_SCORE = 13000;

// Scoring system
const getScore = (wordLength: number): number => {
  if (wordLength < 3) return 0;
  if (wordLength === 3) return 100;
  if (wordLength === 4) return 400;
  if (wordLength === 5) return 800;
  if (wordLength === 6) return 1400;
  if (wordLength === 7) return 1800;
  return 2200; // 8 or more letters
};

const DICTIONARY = new Set([
  'pathless', 'heatless', 'shtetls', 'spathes', 'hatless', 'healths', 'lathes', 'palate', 'shelta', 'shtetl', 'shales', 'spales', 'spathe', 'althea', 'selahs', 'heaths', 'health',
  'lapse', 'laths', 'lathe', 'latte', 'pales', 'paths', 'plate', 'shelf', 'shale', 'shalt', 'spale', 'spate', 'splat', 'alpha', 'alate', 'ataps', 'hales', 'selah', 'slaps', 'slate', 'tales', 'theft', 'teals', 'elate', 'heath', 'heaps', 'heals', 'heths', 'teths', 'theta', 'flaps', 'flesh',
  'laps', 'lath', 'late', 'phat', 'pals', 'pale', 'path', 'pate', 'plat', 'shes', 'shat', 'spat', 'spae', 'alps', 'alae', 'aahs', 'aals', 'atap', 'apse', 'ales', 'alef', 'heft', 'haps', 'hale', 'half', 'halt', 'hath', 'hate', 'haet', 'self', 'slap', 'slat', 'eath', 'eths', 'tala', 'taps', 'tale', 'thae', 'teal', 'teth', 'less', 'left', 'heal', 'heat', 'heap', 'heth', 'teat', 'flap', 'flat', 'fehs', 'fess', 'felt',
  'qat', 'lap', 'lat', 'pht', 'pal', 'pah', 'pat', 'she', 'sha', 'spa', 'alp', 'ala', 'aal', 'aah', 'att', 'ate', 'ahs', 'als', 'ale', 'alt', 'hes', 'hap', 'hat', 'hae', 'sel', 'eat', 'eta', 'eth', 'tae', 'tap', 'the', 'tea', 'tet', 'ess', 'eff', 'eft', 'els', 'elf', 'het', 'feh'
]);


interface Cell {
  row: number;
  col: number;
  letter: string;
}

function WordHuntPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Check if already completed
  const alreadyCompleted = isStageCompleted(STAGES.WORDHUNT);
  const [showCompletedOverlay, setShowCompletedOverlay] = useState(false);

  // Set favicon for Stage 1
  useEffect(() => {
    setFavicon(1);
  }, []);

  // Load saved score if completed
  useEffect(() => {
    if (alreadyCompleted) {
      const savedScore = getWordHuntScore();
      setScore(savedScore);
      setGameOver(true);
      setHasWon(true);
      setShowCompletedOverlay(true);
    }
  }, [alreadyCompleted]);

  const retryStage = () => {
    // Reset game state but keep completion status
    setTimeLeft(TIME_LIMIT);
    setScore(0);
    setFoundWords([]);
    setCurrentWord('');
    setSelectedCells([]);
    setIsMouseDown(false);
    setGameOver(false);
    setHasWon(false);
    setShowCompletedOverlay(false);
  };

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setHasWon(score >= TARGET_SCORE);
    }
  }, [timeLeft, gameOver, score]);

  // Get adjacent cells (8 directions)
  const getAdjacentCells = useCallback((index: number): number[] => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const adjacent: number[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
          adjacent.push(newRow * GRID_SIZE + newCol);
        }
      }
    }
    return adjacent;
  }, []);

  // Handle cell selection
  const handleCellEnter = useCallback((index: number) => {
    if (!isMouseDown || gameOver) return;

    const lastSelected = selectedCells[selectedCells.length - 1];

    // Check if this cell is adjacent to the last selected cell
    if (selectedCells.length === 0 || getAdjacentCells(lastSelected).includes(index)) {
      // Allow going back a letter (if clicking on the second-to-last cell)
      if (selectedCells.length > 1 && index === selectedCells[selectedCells.length - 2]) {
        const newSelected = selectedCells.slice(0, -1);
        setSelectedCells(newSelected);
        const word = newSelected.map(i => GRID_LETTERS[i]).join('');
        setCurrentWord(word);
      }
      // Check if cell is already selected (prevent other duplicates)
      else if (!selectedCells.includes(index)) {
        const newSelected = [...selectedCells, index];
        setSelectedCells(newSelected);

        const word = newSelected.map(i => GRID_LETTERS[i]).join('');
        setCurrentWord(word);
      }
    }
  }, [isMouseDown, gameOver, selectedCells, getAdjacentCells]);

  const handleMouseDown = (index: number) => {
    if (gameOver) return;
    setIsMouseDown(true);
    setSelectedCells([index]);
    setCurrentWord(GRID_LETTERS[index]);
  };

  const handleMouseUp = () => {
    if (!isMouseDown || gameOver) return;
    setIsMouseDown(false);

    // Validate word
    if (currentWord.length >= 3 && DICTIONARY.has(currentWord.toLowerCase()) && !foundWords.includes(currentWord.toLowerCase())) {
      const wordScore = getScore(currentWord.length);
      setScore(prev => prev + wordScore);
      setFoundWords(prev => [...prev, currentWord.toLowerCase()]);

      // Check if target score reached
      if (score + wordScore >= TARGET_SCORE) {
        const finalScore = score + wordScore;
        setHasWon(true);
        setGameOver(true);
        // Save completion and score to localStorage
        completeStage(STAGES.WORDHUNT);
        saveWordHuntScore(finalScore);
      }
    }

    setSelectedCells([]);
    setCurrentWord('');
  };

  const skipStage = () => {
    completeStage(STAGES.WORDHUNT);
    saveWordHuntScore(TARGET_SCORE);
    navigate('/dash');
  };

  const resetGame = () => {
    // Don't allow reset if already completed
    if (alreadyCompleted) {
      return;
    }
    setTimeLeft(TIME_LIMIT);
    setScore(0);
    setFoundWords([]);
    setCurrentWord('');
    setSelectedCells([]);
    setIsMouseDown(false);
    setGameOver(false);
    setHasWon(false);
  };

  // Get cell position for SVG line drawing
  const getCellPosition = (index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const cellSize = 64; // w-16 = 64px
    const gap = 8; // gap-2 = 8px
    const x = col * (cellSize + gap) + cellSize / 2;
    const y = row * (cellSize + gap) + cellSize / 2;
    return { x, y };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 font-serif px-6 py-8 relative">
      {/* Completed Overlay */}
      {showCompletedOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-50/95 via-pink-50/95 to-purple-50/95 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-2xl"
          >
            <div className="text-6xl mb-2">🌟</div>
            <h2 className="text-3xl font-serif text-pink-300">completed!</h2>
            <p className="text-xl text-pink-200 mb-4">Final Score: {score}</p>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={retryStage}
                className="bg-pink-200 text-pink-300 rounded-xl py-3 px-8 text-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry Stage
              </motion.button>
              <motion.button
                onClick={() => navigate('/dash')}
                className="bg-pink-300 text-white rounded-xl py-3 px-8 text-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Dashboard
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Header */}
      <div className="text-center mb-6 relative w-full">
        <motion.button
          onClick={() => navigate('/dash')}
          className="absolute left-0 bg-white/70 backdrop-blur-sm text-pink-300 rounded-lg p-2 hover:bg-white/90 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </motion.button>
        <h1 className="text-4xl font-serif text-pink-300 mb-2">word hunt</h1>
      </div>

      {/* Timer and Score */}
      <div className="flex gap-8 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
          <div className="text-sm text-pink-300">time</div>
          <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-pink-300'}`}>
            {timeLeft}s
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
          <div className="text-sm text-pink-300">score</div>
          <div className="text-3xl font-bold text-pink-300">
            <CountingNumber
              number={score}
              inView={true}
              transition={{ stiffness: 200, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Current Word - Fixed height container */}
      <div className="h-12 mb-4 flex items-center justify-center">
        {currentWord && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl px-6 py-3"
          >
            <div className="text-lg text-pink-300">{currentWord}</div>
          </motion.div>
        )}
      </div>

      {/* Grid with SVG overlay for connections */}
      <div className="relative mb-6">
        {/* SVG lines for connecting letters */}
        {selectedCells.length > 1 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '280px', height: '280px' }}
          >
            {selectedCells.slice(0, -1).map((cell, idx) => {
              const nextCell = selectedCells[idx + 1];
              const start = getCellPosition(cell);
              const end = getCellPosition(nextCell);
              return (
                <line
                  key={`${cell}-${nextCell}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgb(251, 207, 232)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        )}

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-4 gap-2 relative select-none"
          style={{ touchAction: 'none' }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {GRID_LETTERS.map((letter, index) => {
            const isSelected = selectedCells.includes(index);
            return (
              <motion.div
                key={index}
                className={`
                  w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-bold cursor-pointer relative z-10 select-none
                  ${isSelected
                    ? 'bg-pink-300 text-white'
                    : 'bg-white/70 backdrop-blur-sm text-pink-300 hover:bg-white/90'
                  }
                `}
                onMouseDown={() => handleMouseDown(index)}
                onMouseEnter={() => handleCellEnter(index)}
                onTouchStart={() => handleMouseDown(index)}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  const element = document.elementFromPoint(touch.clientX, touch.clientY);
                  if (element) {
                    const cellIndex = parseInt(element.getAttribute('data-index') || '-1');
                    if (cellIndex >= 0) handleCellEnter(cellIndex);
                  }
                }}
                onTouchEnd={handleMouseUp}
                data-index={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {letter.toUpperCase()}
              </motion.div>
            );
          })}
        </div>
      </div>


      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={resetGame}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-serif text-pink-300 mb-4">
                {hasWon ? 'yay gjgj' : '⏰ time\'s up!'}
              </h2>
              <p className="text-xl text-pink-200 mb-2">ur def ahana</p>
              <p className="text-lg text-pink-200 mb-6">
                {hasWon
                  ? `🌟`
                  : `:(`
                }
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                {hasWon && (
                  <motion.button
                    onClick={() => {
                      setTimeLeft(TIME_LIMIT);
                      setScore(0);
                      setFoundWords([]);
                      setCurrentWord('');
                      setSelectedCells([]);
                      setGameOver(false);
                      setHasWon(false);
                    }}
                    className=" text-pink-300 rounded-xl p-3"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="play again"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </motion.button>
                )}
                {!hasWon && (
                  <motion.button
                    onClick={resetGame}
                    className="bg-pink-300 text-white rounded-xl py-3 px-8 text-lg font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    play again
                  </motion.button>
                )}
                <motion.button
                  onClick={() => navigate('/dash')}
                  className="bg-pink-200 text-pink-300 rounded-xl py-3 px-8 text-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  dashboard
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WordHuntPage;

