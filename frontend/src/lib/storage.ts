// Game progress and authentication management

const STORAGE_KEYS = {
  AUTHENTICATED: 'authenticated',
  COMPLETED_STAGES: 'completedStages',
  CURRENT_STAGE: 'currentStage',
  WORDHUNT_SCORE: 'wordhuntScore',
  STAGE2_PROGRESS: 'stage2Progress',
  STAGE3_PROGRESS: 'stage3Progress',
  PIN_AUTHENTICATED: 'pinAuthenticated'
};

export interface GameProgress {
  authenticated: boolean;
  completedStages: string[];
  currentStage: number;
}

// Initialize and get game progress
export const getGameProgress = (): GameProgress => {
  const stored = localStorage.getItem(STORAGE_KEYS.COMPLETED_STAGES);
  const authenticated = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';

  return {
    authenticated,
    completedStages: stored ? JSON.parse(stored) : [],
    currentStage: authenticated ? 1 : 0
  };
};

// Mark authentication as complete
export const setAuthenticated = (value: boolean) => {
  localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, value.toString());
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';
};

// Check if pin is authenticated
export const isPinAuthenticated = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.PIN_AUTHENTICATED) === 'true';
};

// Set pin authentication
export const setPinAuthenticated = (value: boolean) => {
  localStorage.setItem(STORAGE_KEYS.PIN_AUTHENTICATED, value.toString());
};

// Mark a stage as completed
export const completeStage = (stageName: string) => {
  const progress = getGameProgress();
  if (!progress.completedStages.includes(stageName)) {
    progress.completedStages.push(stageName);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_STAGES, JSON.stringify(progress.completedStages));
  }
};

// Check if a stage is completed
export const isStageCompleted = (stageName: string): boolean => {
  const progress = getGameProgress();
  return progress.completedStages.includes(stageName);
};

// Save WordHunt score
export const saveWordHuntScore = (score: number) => {
  localStorage.setItem(STORAGE_KEYS.WORDHUNT_SCORE, score.toString());
};

// Get WordHunt score
export const getWordHuntScore = (): number => {
  const score = localStorage.getItem(STORAGE_KEYS.WORDHUNT_SCORE);
  return score ? parseInt(score, 10) : 0;
};

// Reset all progress (for testing or logout)
export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
  localStorage.removeItem(STORAGE_KEYS.PIN_AUTHENTICATED);
  localStorage.removeItem(STORAGE_KEYS.COMPLETED_STAGES);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_STAGE);
  localStorage.removeItem(STORAGE_KEYS.WORDHUNT_SCORE);
  localStorage.removeItem(STORAGE_KEYS.STAGE2_PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.STAGE3_PROGRESS);
};

// Stage names for reference (each "stage" = main star on dash: wordhunt, stage2, stage3, …)
export const STAGES = {
  WORDHUNT: 'wordhunt',
  STAGE2: 'stage2',
  STAGE3: 'stage3',
} as const;

// Get the first incomplete stage
export const getFirstIncompleteStage = (): string | null => {
  const stageOrder = [STAGES.WORDHUNT, STAGES.STAGE2, STAGES.STAGE3];
  const progress = getGameProgress();

  for (const stage of stageOrder) {
    if (!progress.completedStages.includes(stage)) {
      return stage;
    }
  }

  // All stages completed
  return null;
};

// Stage 2 Progress Management
export type MinigameView = 'stage2' | 'stage3-flappy' | 'stage4-typing' | 'stage5-memory';

export interface Stage2Progress {
  clicks: number;
  textIndex: number;
  currentStage: MinigameView;
  hideClickCount?: number;
  runClickCount?: number;
  fakeClickCount?: number;
}

// Save Stage 2 progress
export const saveStage2Progress = (progress: Stage2Progress) => {
  localStorage.setItem(STORAGE_KEYS.STAGE2_PROGRESS, JSON.stringify(progress));
};

// Load Stage 2 progress
export const loadStage2Progress = (): Stage2Progress | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.STAGE2_PROGRESS);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Clear Stage 2 progress (when stage is completed)
export const clearStage2Progress = () => {
  localStorage.removeItem(STORAGE_KEYS.STAGE2_PROGRESS);
};

// Stage 3 Progress Management
export interface Stage3Progress {
  location: 'house' | 'attic';
  playerX: number;
  playerY: number;
  inventory: any[]; // Using any[] to avoid circular dependency if possible, or just re-define Item interface locally in Stage3Page
  items: any[];
  catIsGone?: boolean;
  isOvenOpen?: boolean;
  isBridgeFixed?: boolean;
  bookPage?: number;
}

export const saveStage3Progress = (progress: Stage3Progress) => {
  localStorage.setItem(STORAGE_KEYS.STAGE3_PROGRESS, JSON.stringify(progress));
};

export const loadStage3Progress = (): Stage3Progress | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.STAGE3_PROGRESS);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearStage3Progress = () => {
  localStorage.removeItem(STORAGE_KEYS.STAGE3_PROGRESS);
};
