import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { completeStage, STAGES, saveStage2Progress, loadStage2Progress, clearStage2Progress } from '../../lib/storage';
import { setFavicon } from '../../lib/favicon';

// Minigame flow: button → flappy → typing → memory. "Stage" = dash star (wordhunt, stage2, stage3).
type MinigameView = 'stage2' | 'stage3-flappy' | 'stage4-typing' | 'stage5-memory';

function ButtonPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Current stage state
  const [currentStage, setCurrentStage] = useState<MinigameView>('stage2');

  // ==================== STAGE 2 STATE ====================
  const texts = useRef<string[]>([
    'welcome back', 'ur goal is to click the button EXACTLY 100 times', 'yay gjgj u did it!', 'yay gjgj u did it!', 'yay gjgj u did it!', 'yay gjgj u did it!', 'yay gjgj u did it!', 'u can go now', 'why are u still clicking me', 'stop clicking me', 'shoo',
    'meanie', 'im being bullied :(', '.', '.', 'stop', 'why are u still here', 'okay bye', 'okay bye',
    'okay bye', 'okay bye', 'okay bye', 'okay bye', 'okay bye', ':(((',
    '.', 'why', '.', 'okay fine jk u arent done yet hehe', 'alr im making it harder', 'hehe', 'hehehe', 'hehehehe', 'wow ok', ' ', ':(', 'HEHE', 'ok fine ill stop', 'JKK HAHAHAHAHA', 'ok fine', 'look behind u', 'hehe made u look',
    '.', '.', 'RUNNN', ':(', 'ok im gonna hide hehe', 'stage complete', 'jk', 'get ready'
  ]);
  const GOAL_CLICKS = 100;
  const CELEBRATION_TEXT_START_INDEX = 2;
  const [clicks, setClicks] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [faint, setFaint] = useState(false);
  const [buttonSize, setButtonSize] = useState<'medium' | 'small' | 'tiny' | 'micro'>('medium');
  const [buttonMode, setButtonMode] = useState<'single' | 'two-fake' | 'grid-5x5' | 'grid-10x4' | 'hide'>('single');
  const [fakeButtonPositions, setFakeButtonPositions] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [realButtonIndex, setRealButtonIndex] = useState(0);
  const [hideClickCount, setHideClickCount] = useState(0);
  const [runClickCount, setRunClickCount] = useState(0);
  const [fakeClickCount, setFakeClickCount] = useState(0);

  const btnSize = useRef<{ w: number; h: number }>({ w: 100, h: 100 });
  const defaultBtnSize = { w: 100, h: 100 };
  const smallBtnSize = { w: 50, h: 50 };
  const tinyBtnSize = { w: 10, h: 10 };
  const microBtnSize = { w: 35, h: 35 };
  const totalText = texts.current.length;
  const wildDistance = 250;
  const GRID_MARGIN = 40;
  const hideRuns = 15;

  const flappyTexts = useRef<string[]>([
    'hello',
    'ur the button now',
    'space or click',
    '',
    '',
    'weeeee',
    'ur doing great!',
    'wait... SPEED UP',
    'hehe faster',
    'EVEN FASTER',
    'ok that was mean',
    'slowing down...',
    'jk MAXIMUM SPEED',
    'how r u alive',
    'impressive...',
    'ok ok u win',
    'score 20 to pass',
    'almost there!',
    'ayyy gj',
    'onto typing...'
  ]);
  const [flappyY, setFlappyY] = useState(300);
  const [flappyVelocity, setFlappyVelocity] = useState(0);
  const [pipes, setPipes] = useState<Array<{ x: number; gapY: number; id: number; passed: boolean }>>([]);
  const [flappyScore, setFlappyScore] = useState(0);
  const [flappyGameOver, setFlappyGameOver] = useState(false);
  const [flappyStarted, setFlappyStarted] = useState(false);
  const [flappyTextIndex, setFlappyTextIndex] = useState(0);
  const [pipeSpeed, setPipeSpeed] = useState(3);
  const [pipeGap, setPipeGap] = useState(180);
  const FLAPPY_GOAL = 20;
  const FLAPPY_SIZE = 50;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -10;
  const PIPE_WIDTH = 60;

  // ==================== STAGE 4 TYPING STATE ====================
  // ==================== STAGE 4 TYPING STATE ====================
  const targetParagraph = `"Yeah." He nods, scratching his quill against the parchment as he begins
to take notes. "That has to be it. You missed it."
I blink, forcing my hand through the motions of writing about a battle
I've analyzed dozens of times with my father. Liam's right. That's the only
possible explanation. Our clearance isn't high enough, or maybe they
haven't finished gathering all the information needed to form an accurate
report.
Or it had to have been marked classified. I just missed it.`;

  const [typedText, setTypedText] = useState('');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [typingEndTime, setTypingEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [typingPhase, setTypingPhase] = useState<'start' | 'active' | 'result'>('start');
  const [typingResultState, setTypingResultState] = useState<'success' | 'fail-speed' | 'fail-accuracy' | null>(null);

  // ==================== STAGE 5 MEMORY STATE ====================
  const MEMORY_GOAL = 4;
  const [memoryPhase, setMemoryPhase] = useState<'watch' | 'repeat' | 'result'>('watch');
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [currentShowIndex, setCurrentShowIndex] = useState(-1);
  const [memoryScore, setMemoryScore] = useState(0);
  const [memoryLevel, setMemoryLevel] = useState(1);
  const [memorySpeed, setMemorySpeed] = useState(800);
  const [memorySuccess, setMemorySuccess] = useState(false);
  const [memoryFail, setMemoryFail] = useState(false);
  const [gridSize] = useState(4);
  const [buttonPositions, setButtonPositions] = useState<Array<{ x: number; y: number }>>([]);
  const [gameComplete, setGameComplete] = useState(false);

  // ==================== STAGE 2 FUNCTIONS ====================
  const getCurrentBtnSize = () => {
    if (buttonSize === 'micro') return microBtnSize;
    if (buttonSize === 'tiny') return tinyBtnSize;
    if (buttonSize === 'small') return smallBtnSize;
    return defaultBtnSize;
  };

  const clamp = useCallback((x: number, y: number, sizeOverride?: { w: number; h: number }) => {
    const container = containerRef.current;
    if (!container) return { x, y };
    const size = sizeOverride || getCurrentBtnSize();
    const rect = container.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - size.w);
    const maxY = Math.max(0, rect.height - size.h);
    return { x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) };
  }, [buttonSize]);

  const generateRandomPosition = useCallback((sizeOverride?: { w: number; h: number }) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const size = sizeOverride || getCurrentBtnSize();
    const rect = container.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - size.w);
    const maxY = Math.max(0, rect.height - size.h);
    return {
      x: Math.random() * maxX,
      y: Math.random() * maxY
    };
  }, [buttonSize]);

  const generateGridPositions = useCallback((rows: number, cols: number) => {
    const container = containerRef.current;
    if (!container) return [];
    const rect = container.getBoundingClientRect();
    const size = getCurrentBtnSize();
    const positions: Array<{ x: number; y: number; id: number }> = [];

    const availableWidth = rect.width - (GRID_MARGIN * 2) - size.w;
    const availableHeight = rect.height - (GRID_MARGIN * 2) - size.h;
    const cellSize = Math.min(availableWidth / (cols - 1), availableHeight / (rows - 1));
    const gridWidth = cellSize * (cols - 1);
    const gridHeight = cellSize * (rows - 1);
    const startX = (rect.width - gridWidth - size.w) / 2;
    const startY = (rect.height - gridHeight - size.h) / 2;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        positions.push({
          x: startX + (j * cellSize),
          y: startY + (i * cellSize),
          id: i * cols + j
        });
      }
    }
    return positions;
  }, [buttonSize]);

  const centerButton = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const size = getCurrentBtnSize();
    const centerX = (rect.width - size.w) / 2;
    const centerY = (rect.height - size.h) / 2;
    setPos(clamp(centerX, centerY));
  }, [clamp, buttonSize]);

  useEffect(() => {
    if (currentStage === 'stage2') {
      centerButton();
    }
  }, [centerButton, currentStage]);

  // Set favicon for Stage 2
  useEffect(() => {
    setFavicon(2);
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = loadStage2Progress();
    if (savedProgress) {
      setClicks(savedProgress.clicks);
      setTextIndex(savedProgress.textIndex);
      setCurrentStage(savedProgress.currentStage);
      if (savedProgress.hideClickCount) setHideClickCount(savedProgress.hideClickCount);
      if (savedProgress.runClickCount) setRunClickCount(savedProgress.runClickCount);
      if (savedProgress.fakeClickCount) setFakeClickCount(savedProgress.fakeClickCount);
    }
  }, []);

  // Auto-save progress whenever key state changes
  useEffect(() => {
    if (clicks > 0 || textIndex > 0 || currentStage !== 'stage2') {
      saveStage2Progress({
        clicks,
        textIndex,
        currentStage,
        hideClickCount,
        runClickCount,
        fakeClickCount
      });
    }
  }, [clicks, textIndex, currentStage, hideClickCount, runClickCount, fakeClickCount]);


  // Handle special text phases for Stage 2
  useEffect(() => {
    if (currentStage !== 'stage2') return;

    const currentText = texts.current[textIndex];

    if (currentText === 'alr im making it harder') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      centerButton();
    } else if (currentText === 'hehe' && textIndex === 30) {
      setButtonSize('small');
      btnSize.current = smallBtnSize;
      centerButton();
    } else if (currentText === 'hehehe' && textIndex === 31) {
      setButtonSize('tiny');
      btnSize.current = tinyBtnSize;
      centerButton();
    } else if (currentText === 'hehehe' && textIndex === 32) {
      setButtonSize('micro');
      btnSize.current = microBtnSize;
      centerButton();
    } else if (currentText === 'hehe wb noww') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('two-fake');
      centerButton();
      setFakeClickCount(0);
      const positions = [];
      const centerPos = { x: pos.x, y: pos.y };
      for (let i = 0; i < 3; i++) {
        if (i === 1) {
          positions.push({ ...centerPos, id: i });
        } else {
          positions.push({ ...generateRandomPosition(), id: i });
        }
      }
      setFakeButtonPositions(positions);
      setRealButtonIndex(1);
    } else if (currentText === ':(' && textIndex === 35) {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('single');
      centerButton();
    } else if (currentText === 'HEHE') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('grid-5x5');
      const positions = generateGridPositions(5, 5);
      setFakeButtonPositions(positions);
      const newRealIndex = Math.floor(Math.random() * 25);
      setRealButtonIndex(newRealIndex);
      if (positions[newRealIndex]) {
        setPos(positions[newRealIndex]);
      }
    } else if (currentText === 'ok fine ill stop') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('single');
      centerButton();
    } else if (currentText === 'JKK HAHAHAHAHA') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('grid-10x4');
      const positions = generateGridPositions(4, 10);
      setFakeButtonPositions(positions);
      const newRealIndex = Math.floor(Math.random() * 40);
      setRealButtonIndex(newRealIndex);
      if (positions[newRealIndex]) {
        setPos(positions[newRealIndex]);
      }
    } else if (currentText === 'ok fine') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('single');
      centerButton();
    } else if (currentText === 'ok im gonna hide hehe') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('hide');
      setHideClickCount(0);
      const initialPos = generateRandomPosition();
      setPos(initialPos);
    } else if (currentText === 'RUNNN') {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('single');
      setFaint(false);
      setRunClickCount(0); // Reset run counter
    } else if (currentText === 'stage complete') {
      // Transition to stage 3 after a delay
      setTimeout(() => {
        setCurrentStage('stage3-flappy');
      }, 2000);
    } else if (textIndex <= 26 || (textIndex > 30 && buttonMode === 'single')) {
      setButtonSize('medium');
      btnSize.current = defaultBtnSize;
      setButtonMode('single');
    }
  }, [textIndex, generateRandomPosition, generateGridPositions, clamp, centerButton, currentStage, buttonMode]);

  const handleFakeClick = useCallback(() => {
    // Fake buttons do nothing
  }, []);

  const handleRealClick = useCallback(() => {
    if (currentStage !== 'stage2') return;

    setClicks(prev => {
      const next = prev + 1;
      const currentText = texts.current[textIndex];

      if (buttonMode === 'hide') {
        setHideClickCount(prevHide => {
          const newHideCount = prevHide + 1;
          if (newHideCount < hideRuns) {
            const newPos = generateRandomPosition();
            setPos(newPos);
            return newHideCount;
          } else {
            if (textIndex < totalText - 1) {
              setTextIndex(prevIdx => prevIdx + 1);
            }
            setButtonMode('single');
            return 0;
          }
        });
        return next;
      }

      if (buttonMode === 'two-fake') {
        const fakeLimit = 5; // Do this for 5 clicks
        setFakeClickCount(prevFake => {
          const newFake = prevFake + 1;
          if (newFake < fakeLimit) {
            // Randomize positions and real button
            const positions = [];
            for (let i = 0; i < 3; i++) {
              positions.push({ ...generateRandomPosition(), id: i });
            }
            const realIdx = Math.floor(Math.random() * 3);
            setFakeButtonPositions(positions);
            setRealButtonIndex(realIdx);
            setPos(positions[realIdx]);
            return newFake;
          } else {
            // Done with fake phase
            if (textIndex < totalText - 1) {
              setTextIndex(prevIdx => prevIdx + 1);
            }
            // Next text will handle button mode via useEffect
            return 0;
          }
        });
        return next;
      }

      if (next < GOAL_CLICKS) {
        const newIndex = next === 1 ? 0 : Math.min(next - 1, CELEBRATION_TEXT_START_INDEX - 1);
        setTextIndex(newIndex);
      } else if (next === GOAL_CLICKS) {
        setTextIndex(CELEBRATION_TEXT_START_INDEX);
      } else {
        const clicksAfterGoal = next - GOAL_CLICKS;
        const newIndex = CELEBRATION_TEXT_START_INDEX + clicksAfterGoal;
        if (newIndex < totalText) {
          setTextIndex(newIndex);
        } else {
          setTextIndex(totalText - 1);
        }
      }

      if (currentText === 'RUNNN') {
        setRunClickCount(prevRun => {
          const newRunCount = prevRun + 1;
          if (newRunCount <= 10) {
            // Move bit by bit for 10 clicks
            setPos(p => {
              const dx = (Math.random() - 0.5) * 20; // Small movements
              const dy = (Math.random() - 0.5) * 20;
              return clamp(p.x + dx, p.y + dy);
            });
            return newRunCount;
          }
          return prevRun; // Stop after 10 clicks
        });
      }

      if (buttonMode === 'grid-5x5') {
        const positions = generateGridPositions(5, 5);
        setFakeButtonPositions(positions);
        const newRealIndex = Math.floor(Math.random() * 25);
        setRealButtonIndex(newRealIndex);
        if (positions[newRealIndex]) {
          setPos(positions[newRealIndex]);
        }
      } else if (buttonMode === 'grid-10x4') {
        const positions = generateGridPositions(4, 10);
        setFakeButtonPositions(positions);
        const newRealIndex = Math.floor(Math.random() * 40);
        setRealButtonIndex(newRealIndex);
        if (positions[newRealIndex]) {
          setPos(positions[newRealIndex]);
        }
      }

      return next;
    });
  }, [textIndex, buttonMode, clamp, generateRandomPosition, generateGridPositions, currentStage]);

  const renderButton = (position: { x: number; y: number }, isReal: boolean, index?: number) => {
    const size = getCurrentBtnSize();
    const buttonStyle = {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.w}px`,
      height: `${size.h}px`,
      userSelect: 'none' as const,
    };

    const isHideMode = buttonMode === 'hide' && isReal;
    return (
      <motion.button
        key={index !== undefined ? `btn-${index}` : 'main-btn'}
        onClick={isReal ? handleRealClick : handleFakeClick}
        className={`${faint && isReal
          ? 'bg-white/20 text-purple-300/30'
          : isReal
            ? 'bg-purple-400/70 text-purple-300 hover:bg-purple-400/90'
            : 'bg-purple-400/70 text-purple-300 hover:bg-purple-400/90'} 
          ${isHideMode ? 'opacity-10' : ''}
          backdrop-blur-sm rounded-full text-lg font-medium shadow-sm absolute select-none flex items-center justify-center`}
        style={buttonStyle}
        whileHover={isReal ? { scale: 1.05 } : {}}
        whileTap={isReal ? { scale: 0.95 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      />
    );
  };

  const getCurrentText = () => {
    if (buttonMode === 'hide' && hideClickCount < hideRuns) {
      return 'ok im gonna hide hehe';
    }
    if (clicks < GOAL_CLICKS) {
      const cappedIndex = Math.min(textIndex, CELEBRATION_TEXT_START_INDEX - 1);
      return cappedIndex < totalText ? texts.current[cappedIndex] : '';
    }
    if (textIndex >= totalText - 1) {
      return faint ? '...' : 'run!!';
    }
    return textIndex < totalText ? texts.current[textIndex] : '';
  };

  // ==================== STAGE 3 FLAPPY BIRD FUNCTIONS ====================

  // Flappy bird physics
  useEffect(() => {
    if (currentStage !== 'stage3-flappy' || !flappyStarted || flappyGameOver) return;

    const gameLoop = setInterval(() => {
      // Apply gravity
      setFlappyVelocity(v => Math.min(v + GRAVITY, 12));
      setFlappyY(y => {
        const newY = y + flappyVelocity;
        // Check floor/ceiling collision
        if (newY < 0 || newY > 550) {
          setFlappyGameOver(true);
          return y;
        }
        return newY;
      });

      // Move pipes
      setPipes(prevPipes => {
        const newPipes = prevPipes
          .map(pipe => ({ ...pipe, x: pipe.x - pipeSpeed }))
          .filter(pipe => pipe.x > -PIPE_WIDTH);

        // Check for score
        newPipes.forEach(pipe => {
          if (!pipe.passed && pipe.x < 100) {
            pipe.passed = true;
            setFlappyScore(s => {
              const newScore = s + 1;
              // Update text based on score
              if (newScore === 3) setFlappyTextIndex(5);
              if (newScore === 5) setFlappyTextIndex(6);
              if (newScore === 8) { setFlappyTextIndex(7); setPipeSpeed(4); }
              if (newScore === 10) { setFlappyTextIndex(8); setPipeSpeed(5); }
              if (newScore === 12) { setFlappyTextIndex(9); setPipeSpeed(6); }
              if (newScore === 14) { setFlappyTextIndex(10); setPipeSpeed(4); setPipeGap(200); }
              if (newScore === 16) { setFlappyTextIndex(12); setPipeSpeed(7); setPipeGap(150); }
              if (newScore === 18) setFlappyTextIndex(14);
              if (newScore >= FLAPPY_GOAL) {
                setFlappyTextIndex(18);
                setTimeout(() => {
                  setCurrentStage('stage4-typing');
                }, 2000);
              }
              return newScore;
            });
          }
        });

        // Check collision with pipes
        newPipes.forEach(pipe => {
          if (pipe.x < 150 && pipe.x > 50) {
            const buttonTop = flappyY;
            const buttonBottom = flappyY + FLAPPY_SIZE;
            const gapTop = pipe.gapY;
            const gapBottom = pipe.gapY + pipeGap;

            if (buttonTop < gapTop || buttonBottom > gapBottom) {
              setFlappyGameOver(true);
            }
          }
        });

        return newPipes;
      });
    }, 20);

    return () => clearInterval(gameLoop);
  }, [currentStage, flappyStarted, flappyGameOver, flappyVelocity, pipeSpeed, pipeGap, flappyY]);

  // Spawn pipes
  useEffect(() => {
    if (currentStage !== 'stage3-flappy' || !flappyStarted || flappyGameOver) return;

    const spawnPipe = setInterval(() => {
      setPipes(prev => [...prev, {
        x: 900,
        gapY: Math.random() * 300 + 50,
        id: Date.now(),
        passed: false
      }]);
    }, 2000);

    return () => clearInterval(spawnPipe);
  }, [currentStage, flappyStarted, flappyGameOver]);

  const flappyJump = useCallback(() => {
    if (currentStage !== 'stage3-flappy') return;
    if (flappyGameOver) {
      // Reset game
      setFlappyY(300);
      setFlappyVelocity(0);
      setPipes([]);
      setFlappyScore(0);
      setFlappyGameOver(false);
      setFlappyTextIndex(0);
      setPipeSpeed(3);
      setPipeGap(180);
      return;
    }
    if (!flappyStarted) {
      setFlappyStarted(true);
      setFlappyTextIndex(3);
    }
    setFlappyVelocity(JUMP_FORCE);
  }, [currentStage, flappyGameOver, flappyStarted]);

  // Keyboard handler for flappy
  useEffect(() => {
    if (currentStage !== 'stage3-flappy') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flappyJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStage, flappyJump]);

  // ==================== STAGE 4 TYPING FUNCTIONS ====================

  // Calculate WPM and Accuracy
  const calculateStats = useCallback(() => {
    if (!typingStartTime) return;
    const now = Date.now();
    const timeInMinutes = (now - typingStartTime) / 60000;

    // WPM = (characters / 5) / minutes
    const validChars = typedText.length;
    const currentWpm = Math.round((validChars / 5) / timeInMinutes);

    // Accuracy
    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetParagraph[i]) correctChars++;
    }
    const currentAccuracy = typedText.length > 0
      ? Math.round((correctChars / typedText.length) * 100)
      : 100;

    setWpm(currentWpm);
    setAccuracy(currentAccuracy);
  }, [typedText, typingStartTime, targetParagraph]);

  // Update stats periodically while active
  useEffect(() => {
    if (typingPhase !== 'active') return;
    const statsInterval = setInterval(calculateStats, 1000);
    return () => clearInterval(statsInterval);
  }, [typingPhase, calculateStats]);

  // Keyboard handler for typing
  useEffect(() => {
    if (currentStage !== 'stage4-typing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent defaults for some keys to keep focus
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && e.target === document.body) {
        e.preventDefault();
      }

      if (typingPhase === 'result') {
        // If failed, press any key to restart (except if completed success logic already ran and moved on)
        if (typingResultState && typingResultState !== 'success') {
          // Reset
          setTypedText('');
          setTypingStartTime(null);
          setTypingEndTime(null);
          setWpm(0);
          setAccuracy(100);
          setTypingPhase('start');
          setTypingResultState(null);
        }
        return;
      }

      // Ignore modifiers
      if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Enter') return;

      if (e.key === 'Backspace') {
        setTypedText(prev => prev.slice(0, -1));
        return;
      }

      // Start timer on first char
      if (typingPhase === 'start') {
        setTypingStartTime(Date.now());
        setTypingPhase('active');
      }

      // Add char
      // We want to allow all printable chars corresponding to the paragraph
      // Basic check: just append the key if it's length 1 or Enter (which might be needed for newlines if standard text area behavior is mimicked, but strict typing tests usually ignore Enter or treat it as specific char)
      // Since our paragraph has newlines, we should handle 'Enter' as '\n'

      let charToAdd = e.key;
      if (e.key === 'Enter') charToAdd = '\n';

      // Only add if we haven't finished text
      if (typedText.length < targetParagraph.length) {
        setTypedText(prev => prev + charToAdd);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStage, typingPhase, typedText, targetParagraph, typingResultState]);

  // Check for completion
  useEffect(() => {
    if (typingPhase === 'active' && typedText.length === targetParagraph.length) {
      // Finished
      setTypingPhase('result');
      setTypingEndTime(Date.now());

      // Final stats calculation
      if (typingStartTime) {
        const now = Date.now();
        const timeInMinutes = (now - typingStartTime) / 60000;
        const validChars = typedText.length;
        const finalWpm = Math.round((validChars / 5) / timeInMinutes);

        let correctChars = 0;
        for (let i = 0; i < typedText.length; i++) {
          if (typedText[i] === targetParagraph[i]) correctChars++;
        }
        const finalAccuracy = Math.round((correctChars / typedText.length) * 100);

        setWpm(finalWpm);
        setAccuracy(finalAccuracy);

        if (finalWpm >= 70 && finalAccuracy >= 85) {
          setTypingResultState('success');
          setTimeout(() => {
            setCurrentStage('stage5-memory');
          }, 2000);
        } else if (finalWpm < 70) {
          setTypingResultState('fail-speed');
        } else {
          setTypingResultState('fail-accuracy');
        }
      }
    }
  }, [typedText, targetParagraph, typingPhase, typingStartTime]);

  // ==================== STAGE 5 MEMORY FUNCTIONS ====================

  // Generate button positions for memory game
  useEffect(() => {
    if (currentStage !== 'stage5-memory') return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const buttonSizeM = 80;
    const padding = 40;
    const availableWidth = rect.width - padding * 2 - buttonSizeM;
    const availableHeight = rect.height - 200 - buttonSizeM;

    const positions = [];
    const cols = 2;
    const rows = 2;
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    for (let i = 0; i < gridSize; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: padding + col * cellWidth + cellWidth / 2 - buttonSizeM / 2 + 100,
        y: 150 + row * cellHeight + cellHeight / 2 - buttonSizeM / 2,
      });
    }
    setButtonPositions(positions);
  }, [currentStage, gridSize]);

  // Generate new pattern - level 1 = 4, level 2 = 5, level 3 = 6, level 4 = 7
  const generatePattern = useCallback(() => {
    const patternLength = 3 + memoryLevel;
    const newPattern = [];
    for (let i = 0; i < patternLength; i++) {
      newPattern.push(Math.floor(Math.random() * gridSize));
    }
    setPattern(newPattern);
    setPlayerInput([]);
    setMemoryPhase('watch');
    setCurrentShowIndex(-1);
  }, [memoryLevel, gridSize]);

  // Initialize memory game
  useEffect(() => {
    if (currentStage === 'stage5-memory' && pattern.length === 0) {
      generatePattern();
    }
  }, [currentStage, generatePattern, pattern.length]);

  // Show pattern animation
  useEffect(() => {
    if (currentStage !== 'stage5-memory' || memoryPhase !== 'watch' || pattern.length === 0) return;

    let index = 0;
    const showNext = () => {
      if (index < pattern.length) {
        setCurrentShowIndex(index);
        index++;
        setTimeout(() => {
          setCurrentShowIndex(-1);
          setTimeout(showNext, memorySpeed / 4);
        }, memorySpeed);
      } else {
        setMemoryPhase('repeat');
      }
    };

    setTimeout(showNext, 500);
  }, [currentStage, memoryPhase, pattern, memorySpeed]);

  const handleMemoryClick = useCallback((index: number) => {
    if (memoryPhase !== 'repeat' || currentStage !== 'stage5-memory') return;

    const newInput = [...playerInput, index];
    setPlayerInput(newInput);

    const currentTarget = pattern[newInput.length - 1];

    if (index !== currentTarget) {
      setMemoryFail(true);
      setTimeout(() => setMemoryFail(false), 500);
      setMemoryPhase('result');
      setTimeout(() => generatePattern(), 1500);
      return;
    }

    if (newInput.length === pattern.length) {
      setMemorySuccess(true);
      setTimeout(() => setMemorySuccess(false), 500);
      setMemoryScore(prev => prev + pattern.length);
      setMemoryPhase('result');

      const nextLevel = memoryLevel + 1;
      setMemoryLevel(nextLevel);

      if (nextLevel > MEMORY_GOAL) {
        setGameComplete(true);
        completeStage(STAGES.STAGE2);
        // setTimeout(() => navigate('/dash'), 1500); // Wait for manual click
      } else {
        setTimeout(() => generatePattern(), 1000);
      }
    }
  }, [memoryPhase, playerInput, pattern, memoryLevel, generatePattern, currentStage, navigate]);

  // ==================== RENDER ====================

  const currentTextStage2 = getCurrentText();

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen font-serif select-none overflow-hidden ${currentStage === 'stage2' ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50' :
        currentStage === 'stage3-flappy' ? 'bg-[#f3e8ff]' :
          currentStage === 'stage4-typing' ? 'bg-[#c4b8b0]' :
            'bg-[#e8d4f0]'
        }`}
      style={{ userSelect: 'none' }}
      onClick={currentStage === 'stage3-flappy' ? flappyJump : undefined}
    >
      {/* ==================== STAGE 2 RENDER ==================== */}
      {currentStage === 'stage2' && (
        <>
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="text-purple-300 text-2xl font-medium text-center bg-white px-4 py-2 rounded-lg pointer-events-none">
              {currentTextStage2}
            </div>
            {clicks > 0 && clicks < GOAL_CLICKS && (
              <div className="text-purple-200 text-lg mt-4 text-center bg-white px-3 py-1 rounded-lg pointer-events-none">
                {clicks} / {GOAL_CLICKS}
              </div>
            )}

          </div>

          {buttonMode === 'single' && renderButton(pos, true)}

          {buttonMode === 'two-fake' && (
            <>
              {fakeButtonPositions.map((p, idx) =>
                renderButton(p, idx === realButtonIndex, idx)
              )}
            </>
          )}

          {buttonMode === 'grid-5x5' && (
            <>
              {fakeButtonPositions.map((p, idx) =>
                renderButton(p, idx === realButtonIndex, idx)
              )}
            </>
          )}

          {buttonMode === 'grid-10x4' && (
            <>
              {fakeButtonPositions.map((p, idx) =>
                renderButton(p, idx === realButtonIndex, idx)
              )}
            </>
          )}

          {buttonMode === 'hide' && renderButton(pos, true)}
        </>
      )}

      {/* ==================== STAGE 3 FLAPPY RENDER ==================== */}
      {currentStage === 'stage3-flappy' && (
        <>
          {/* Clouds background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { w: 120, h: 50, top: 40 },
              { w: 160, h: 45, top: 160 },
              { w: 100, h: 55, top: 280 },
              { w: 140, h: 40, top: 80 },
              { w: 110, h: 50, top: 320 },
            ].map((cloud, i) => (
              <motion.div
                key={i}
                className="absolute bg-white/35 rounded-full"
                style={{
                  width: cloud.w,
                  height: cloud.h,
                  top: cloud.top,
                  left: -200,
                }}
                animate={{ x: [0, 1200] }}
                transition={{ duration: 25 + i * 2, repeat: Infinity, repeatDelay: 4 + i, delay: i * 2 }}
              />
            ))}
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 z-[10] h-12 bg-[#d8b4fe]" />

          {/* Pipes */}
          {pipes.map(pipe => (
            <React.Fragment key={pipe.id}>
              {/* Top pipe */}
              <div
                className="absolute bg-gradient-to-r from-[#fefce8] to-[#faefd7]"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.gapY,
                  borderRadius: '0 0 8px 8px',
                }}
              />
              {/* Bottom pipe */}
              <div
                className="absolute bg-gradient-to-r from-[#fefce8] to-[#faefd7]"
                style={{
                  left: pipe.x,
                  top: pipe.gapY + pipeGap,
                  width: PIPE_WIDTH,
                  height: 600 - pipe.gapY - pipeGap,
                  borderRadius: '8px 8px 0 0',
                }}
              />
            </React.Fragment>
          ))}

          {/* The Button (Player) */}
          <motion.div
            className="absolute bg-purple-300 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
            style={{
              left: 100,
              top: flappyY,
              width: FLAPPY_SIZE,
              height: FLAPPY_SIZE,
            }}
            animate={{
              rotate: Math.min(Math.max(flappyVelocity * 3, -30), 90),
            }}
          >
          </motion.div>

          {/* Score */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 text-white text-6xl font-bold drop-shadow-lg z-50">
            {flappyScore}
          </div>

          {/* Text display */}
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
            <motion.div
              key={flappyTextIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-2xl font-medium text-center bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl"
            >
              {flappyTexts.current[flappyTextIndex]}
            </motion.div>
          </div>

          {/* Start/Game Over overlay */}
          {(!flappyStarted || flappyGameOver) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-40">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white/90 backdrop-blur-md rounded-2xl p-8 text-center relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStage('stage4-typing');
                  }}
                  className="absolute top-2 right-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-500 px-2 py-1 rounded"
                >
                  Skip
                </button>
                <div className="text-6xl mb-4">{flappyGameOver ? '' : ''}</div>
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {flappyGameOver ? ':(' : ''}
                </div>
                {flappyGameOver && (
                  <div className="text-gray-600 mb-4">Score: {flappyScore}</div>
                )}
                <div className="text-gray-500">
                  {flappyGameOver ? 'click to retry' : 'click or press space to start'}
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}

      {/* ==================== STAGE 4 TYPING RENDER ==================== */}
      {/* ==================== STAGE 4 TYPING RENDER ==================== */}
      {currentStage === 'stage4-typing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <div className="bg-white/50 backdrop-blur-md rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative">

            {/* Header / Stats */}
            <div className="flex justify-between items-center mb-6 text-gray-700 font-medium">
              <div className="text-xl">
                {typingPhase === 'start' ? 'Start typing to begin...' : 'Type the text below:'}
              </div>
              <div className="flex gap-6">
                <div>WPM: {wpm}</div>
                <div>ACC: {accuracy}%</div>
              </div>
            </div>

            {/* Paragraph Display */}
            <div className="text-2xl leading-relaxed font-mono whitespace-pre-wrap select-none" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
              {targetParagraph.split('').map((char, index) => {
                let colorClass = 'text-gray-400'; // Pending
                let bgClass = 'bg-transparent';

                if (index < typedText.length) {
                  const typedChar = typedText[index];
                  if (typedChar === char) {
                    colorClass = 'text-green-600'; // Correct
                  } else {
                    colorClass = 'text-red-500'; // Incorrect
                    bgClass = 'bg-red-100';
                  }
                } else if (index === typedText.length) {
                  bgClass = 'bg-blue-200 animate-pulse'; // Cursor
                }

                return (
                  <span key={index} className={`${colorClass} ${bgClass} transition-colors duration-75`}>
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Result Overlay */}
            <AnimatePresence>
              {typingPhase === 'result' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center text-center z-10"
                >
                  {typingResultState === 'success' && (
                    <>
                      <div className="text-6xl mb-4">✨</div>
                      <div className="text-3xl font-bold text-green-600 mb-2">nice</div>
                    </>
                  )}

                  {typingResultState === 'fail-speed' && (
                    <>
                      <div className="text-6xl mb-4">🐢</div>
                      <div className="text-3xl font-bold text-red-500 mb-2">too slow smhhh</div>
                    </>
                  )}

                  {typingResultState === 'fail-accuracy' && (
                    <>
                      <div className="text-3xl font-bold text-amber-500 mb-2">bad accuracy</div>
                      <div className="text-gray-600 mb-6">u need at least 85%</div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}

      {/* ==================== STAGE 5 MEMORY RENDER ==================== */}
      {currentStage === 'stage5-memory' && (
        <>
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full bg-white/5"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>

          {/* Success/Fail flash */}
          <AnimatePresence>
            {memorySuccess && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-green-500 pointer-events-none z-40" />}
            {memoryFail && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-500 pointer-events-none z-40" />}
          </AnimatePresence>

          {/* Memory buttons - fully circular, same pink as button minigame */}
          <div className="relative w-full h-full">
            {buttonPositions.map((bpos, index) => {
              const isActive = currentShowIndex >= 0 && pattern[currentShowIndex] === index;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleMemoryClick(index)}
                  className="absolute rounded-full transition-all duration-100 bg-purple-400/70"
                  style={{
                    left: bpos.x,
                    top: bpos.y,
                    width: 80,
                    height: 80,
                    boxShadow: isActive ? '0 0 40px #f9a8d4, 0 0 80px #f9a8d4' : '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                  animate={{ scale: isActive ? 1.2 : 1 }}
                  whileHover={{ scale: memoryPhase === 'repeat' ? 1.05 : 1 }}
                  whileTap={{ scale: memoryPhase === 'repeat' ? 0.95 : 1 }}
                  disabled={memoryPhase !== 'repeat'}
                />
              );
            })}
          </div>

          {/* Game complete overlay */}
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full text-center mx-4"
              >
                <h2 className="text-3xl font-serif text-purple-300 mb-4">
                  yay gjgj
                </h2>
                <p className="text-xl text-purple-200 mb-2">ur def naman</p> {/* Should be ahana */}
                <p className="text-lg text-purple-200 mb-6">
                  🌟
                </p>
                <motion.button
                  onClick={() => navigate('/dash')}
                  className="bg-purple-300 text-white rounded-xl py-3 px-8 text-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  dashboard
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </>
      )}

      {/* Back button (all stages) */}
      <motion.button
        onClick={() => navigate('/dash')}
        className={`fixed left-4 top-4 backdrop-blur-sm rounded-lg p-2 hover:bg-white/20 transition-colors select-none z-50 ${currentStage === 'stage2' ? 'bg-purple-200/90 text-purple-800' : 'bg-white/10 text-white/80'
          }`}
        style={{ userSelect: 'none' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        back
      </motion.button>

      {/* Skip stage (testing) */}
      <motion.button
        onClick={() => {
          completeStage(STAGES.STAGE2);
          navigate('/dash');
        }}
        className="fixed right-4 top-4 backdrop-blur-sm rounded-lg px-3 py-2 text-sm bg-amber-200/90 text-amber-900 hover:bg-amber-300/90 transition-colors select-none z-50"
        style={{ userSelect: 'none' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Skip stage (testing)
      </motion.button>

    </div>
  );
}

export default ButtonPage;