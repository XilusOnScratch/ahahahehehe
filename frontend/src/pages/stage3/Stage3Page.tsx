import React, { useState, useEffect, useRef } from 'react';
import Sparkles from 'react-sparkle';
import HTMLFlipBook from 'react-pageflip';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { saveStage3Progress, loadStage3Progress, clearStage3Progress, completeStage, STAGES } from '../../lib/storage';
import { setFavicon } from '../../lib/favicon';

const TILE_SIZE = 36; // pixels per tile
const GRID_WIDTH = 24;
const GRID_HEIGHT = 16;

// Define room areas with unique shapes (list of tile coordinates)
interface Room {
  id: string;
  name: string;
  tiles: { x: number; y: number }[];
  labelPos: { x: number; y: number };
}

// Hallway tiles (walkable paths connecting rooms) - ONE entrance per room
const hallwayTiles: { x: number; y: number }[] = [
  // Main vertical corridor on left (shifted)
  { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 },
  { x: 6, y: 7 }, { x: 6, y: 8 }, { x: 6, y: 9 }, { x: 6, y: 10 },
  // Horizontal main corridor
  { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
  { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 }, { x: 16, y: 6 },
  // Second row for main corridor
  { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
  { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 16, y: 7 },
  // Vertical corridor on right
  { x: 16, y: 3 }, { x: 16, y: 4 }, { x: 16, y: 5 },
  { x: 16, y: 7 }, { x: 16, y: 7 },
  // Connection to kitchen (single entrance)
  { x: 5, y: 3 },
  // Connection to bedroom (single entrance)
  { x: 5, y: 10 },
  // Connection to living room (single entrance from bottom)
  { x: 10, y: 5 },
  // Connection to library (single entrance from top)
  { x: 12, y: 7 }, { x: 12, y: 8 }, { x: 12, y: 9 },
  // Connection to attic (hallway lead-up)
  { x: 15, y: 7 }, { x: 16, y: 7 },
  // Connection to secret room (single entrance)
  { x: 17, y: 2 }, { x: 18, y: 2 },
];

const rooms: Room[] = [
  {
    id: 'kitchen',
    name: 'kitchen',
    tiles: [
      { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 3, y: 2 }, { x: 4, y: 2 },
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 3, y: 5 }, { x: 4, y: 5 },
    ],
    labelPos: { x: 4, y: 3.5 },
  },
  {
    id: 'bedroom',
    name: 'bedroom',
    tiles: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 },
      { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 },
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 },
      /* 2x2 removed from bottom left: (0,10),(1,10),(0,11),(1,11) */
      { x: 2, y: 10 }, { x: 3, y: 10 }, { x: 4, y: 10 },
      { x: 2, y: 11 }, { x: 3, y: 11 }, { x: 4, y: 11 },
    ],
    labelPos: { x: 4, y: 11.5 },
  },
  {
    id: 'living',
    name: 'living room',
    tiles: [
      { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 1 }, { x: 12, y: 1 },
      { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 }, { x: 12, y: 2 },
      { x: 8, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 }, { x: 12, y: 3 },
      { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 12, y: 4 },
    ],
    labelPos: { x: 10.5, y: 3.5 },
  },
  {
    id: 'library',
    name: 'library',
    tiles: [
      { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 },
      { x: 9, y: 10 }, { x: 10, y: 10 }, { x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }, { x: 15, y: 10 },
      { x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 }, { x: 14, y: 11 }, { x: 15, y: 11 },
      { x: 9, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 }, { x: 12, y: 12 }, { x: 13, y: 12 }, { x: 14, y: 12 }, { x: 15, y: 12 },
      { x: 9, y: 13 }, { x: 10, y: 13 }, { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 }, { x: 15, y: 13 },
      { x: 9, y: 14 }, { x: 10, y: 14 }, { x: 11, y: 14 }, { x: 12, y: 14 }, { x: 13, y: 14 }, { x: 14, y: 14 }, { x: 15, y: 14 },
    ],
    labelPos: { x: 9.9, y: 9.4 },
  },
  {
    id: 'attic',
    name: 'to the attic',
    tiles: [
      { x: 17, y: 7 }, { x: 18, y: 7 }, { x: 19, y: 7 }, { x: 20, y: 7 }, { x: 21, y: 7 }, { x: 22, y: 7 }
    ],
    labelPos: { x: 19.5, y: 7.5 },
  },
  {
    id: 'secret',
    name: 'secret room',
    tiles: [
      { x: 19, y: 1 }, { x: 20, y: 1 },
      { x: 19, y: 2 }, { x: 20, y: 2 },
    ],
    labelPos: { x: 20, y: 2 },
  },
];

// Items definition
interface Item {
  id: string;
  name: string;
  type: 'key' | 'gold-key' | 'rusty-gold-key' | 'cutter' | 'cookie' | 'bcookie' | 'tile' | 'letter';
  x: number;
  y: number;
  location: 'house' | 'attic';
  color: string;
}

const INITIAL_ITEMS: Item[] = [
  // { id: 'k1', name: 'key', type: 'key', x: 1, y: 2, location: 'house', color: '#C0C0C0' }, // REMOVED kitchen key
  // { id: 'k2', name: 'key', type: 'key', x: 2, y: 10, location: 'house', color: '#C0C0C0' }, // REMOVED bedroom key
  // { id: 'k4', name: 'key', type: 'key', x: 12, y: 10, location: 'house', color: '#C0C0C0' }, // library (shifted)
  // { id: 'k5', name: 'key', type: 'key', x: 14, y: 8, location: 'house', color: '#C0C0C0' }, // hallway bottom right
  // { id: 'k5', name: 'key', type: 'key', x: 14, y: 8, location: 'house', color: '#C0C0C0' }, // hallway bottom right
  // { id: 'k5', name: 'key', type: 'key', x: 14, y: 8, location: 'house', color: '#C0C0C0' }, // hallway bottom right
  { id: 't1', name: 'tile', type: 'tile', x: 12, y: 10, location: 'attic', color: '#8B4513' }, // hidden tile
];

// Living room Key (obtained via penguin passcode)
const LIVING_ROOM_KEY: Item = { id: 'k3', name: 'key', type: 'key', x: 0, y: 0, location: 'house', color: '#C0C0C0' };

// Attic Map Definitions
const ATTIC_TILES: { x: number; y: number }[] = [];
for (let x = 8; x <= 12; x++) {
  for (let y = 6; y <= 10; y++) {
    ATTIC_TILES.push({ x, y });
  }
}
const CLOSET_TILES: { x: number; y: number }[] = [
  { x: 10, y: 6 }
];
// Connect closet to attic
const ATTIC_CONNECTION = { x: 10, y: 6 };

// Create sets for fast lookup
const createTileKey = (x: number, y: number) => `${x},${y}`;

// Living room special objects (table + penguin)
const LIVING_TABLE_TILES: { x: number; y: number }[] = [
  { x: 10, y: 2 },
  { x: 11, y: 2 },
];
// Penguin in top-left corner of the living room
const LIVING_PENGUIN_TILE = { x: 9, y: 2 };

// Oven in kitchen (top two squares)
const KITCHEN_OVEN_TILES = [
  { x: 3, y: 1 },
  { x: 4, y: 1 },
];

// Cat in hallway (shifted)
const BEDROOM_CAT_TILE = { x: 14, y: 6 };

// TV in bedroom (to the right of the bed, vertical)
const BEDROOM_TV_TILES = [
  { x: 4, y: 7 },
  { x: 4, y: 8 },
];

// Bed in bedroom (top left corner, 2x2)
const BEDROOM_BED_POS = { x: 0, y: 7 };

const KITCHEN_WINDOW_POS = { x: 3, y: 4.5 };
const BEDROOM_WINDOW_POS = { x: 0.5, y: 9 };
const KITCHEN_DECOR_POS = { x: 3.5, y: 5 };

// Library shelves (2x1 each)
const LIBRARY_SHELVES = [
  { id: 'shelf1', x: 14, y: 13 }, // Bottom right, one up (relative to new bottom)
  { id: 'shelf2', x: 12, y: 13 }, // Left of shelf1
  { id: 'shelf3', x: 14, y: 11 }, // Two up from shelf1
  { id: 'shelf4', x: 12, y: 11 }, // Two up from shelf2
];

const LIBRARY_SIDE_SHELVES = [
  { id: 'side1', x: 9, y: 12 }, // 1x2
  { id: 'side2', x: 9, y: 10 }, // 1x2
];

const LIBRARY_JUKEBOX_POS = { x: 9, y: 14 };

const CLOSET_DIALOGUE = [
  "*click*",
  "the closet unlocks.",
  "theres a letter inside. open."
];

// House maps
const hallwaySet = new Set(hallwayTiles.map(t => createTileKey(t.x, t.y)));
const roomTileMap = new Map<string, Room>();
const roomTileSets = new Map<string, Set<string>>();

rooms.forEach(room => {
  const tileSet = new Set<string>();
  room.tiles.forEach(tile => {
    const key = createTileKey(tile.x, tile.y);
    roomTileMap.set(key, room);
    tileSet.add(key);
  });
  roomTileSets.set(room.id, tileSet);
});

// Attic maps
const atticTileSet = new Set(ATTIC_TILES.map(t => createTileKey(t.x, t.y)));
const closetTileSet = new Set(CLOSET_TILES.map(t => createTileKey(t.x, t.y)));

// House obstacles (non-walkable tiles inside rooms)
const houseObstacleTileSet = new Set<string>([
  ...LIVING_TABLE_TILES.map(t => createTileKey(t.x, t.y)),
  createTileKey(LIVING_PENGUIN_TILE.x, LIVING_PENGUIN_TILE.y),
  ...KITCHEN_OVEN_TILES.map(t => createTileKey(t.x, t.y)),
  createTileKey(BEDROOM_CAT_TILE.x, BEDROOM_CAT_TILE.y),
  ...BEDROOM_TV_TILES.map(t => createTileKey(t.x, t.y)),

  createTileKey(15, 9), // Library Plant (shifted)
  createTileKey(0, 9),  // Bedroom Plant
  // Library Shelves
  ...LIBRARY_SHELVES.flatMap(s => [createTileKey(s.x, s.y), createTileKey(s.x + 1, s.y)]),
  ...LIBRARY_SIDE_SHELVES.flatMap(s => [createTileKey(s.x, s.y), createTileKey(s.x, s.y + 1)]),
  createTileKey(4, 5), // Kitchen decor obstacle
  createTileKey(LIBRARY_JUKEBOX_POS.x, LIBRARY_JUKEBOX_POS.y),
]);

// Book page component for react-pageflip (requires ref)
const BookPage = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; pageNum?: number; isLeft?: boolean }
>(({ children, pageNum, isLeft }, ref) => (
  <div
    ref={ref}
    className="w-full h-full bg-[#F5EEE6] flex flex-col justify-between p-6 relative"
    style={{ border: '1px solid #A69076' }}
  >
    <div className="flex-1 flex flex-col justify-center">{children}</div>
    {pageNum != null && (
      <span className={`text-[#5a4a3a] font-serif text-[10px] opacity-70 absolute bottom-4 ${isLeft ? 'left-4' : 'right-4'}`}>
        {pageNum}
      </span>
    )}
  </div>
));

const isWalkable = (x: number, y: number, location: 'house' | 'attic', hasGoldKey: boolean, catIsGone: boolean, isBridgeFixed: boolean): boolean => {
  const key = createTileKey(x, y);

  if (location === 'attic') {
    // Attic walkability
    if (atticTileSet.has(key)) return true;
    if (closetTileSet.has(key)) {
      return hasGoldKey; // Only clickable/walkable if won? Usually handled by interaction not walking?
      // Let's say you can walk in if you have Key
    }
    return false;
  }

  // House walkability
  if (x === 16 && y === 2) return isBridgeFixed; // The Gap depends on bridge state (shifted)
  if (key === createTileKey(BEDROOM_CAT_TILE.x, BEDROOM_CAT_TILE.y) && catIsGone) return true;
  if (houseObstacleTileSet.has(key)) return false;
  return hallwaySet.has(key) || roomTileMap.has(key);
};

const getRoomAt = (x: number, y: number): Room | null => {
  return roomTileMap.get(createTileKey(x, y)) || null;
};

const getTileBorders = (room: Room, x: number, y: number) => {
  const tileSet = roomTileSets.get(room.id)!;
  return {
    top: !tileSet.has(createTileKey(x, y - 1)),
    bottom: !tileSet.has(createTileKey(x, y + 1)),
    left: !tileSet.has(createTileKey(x - 1, y)),
    right: !tileSet.has(createTileKey(x + 1, y)),
  };
};

function Stage3Page() {
  const navigate = useNavigate();

  // Game State
  const [location, setLocation] = useState<'house' | 'attic'>('house');
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [showLockPopup, setShowLockPopup] = useState(false);

  // Player position
  const [playerX, setPlayerX] = useState(8);
  const [playerY, setPlayerY] = useState(6);

  // Inventory
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [inventory, setInventory] = useState<Item[]>([]);

  // Current room and message
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [fullText, setFullText] = useState('you wake up in a strange place...');
  const [textIndex, setTextIndex] = useState(0);

  // Living room: table popup (typewriter) and penguin dialogue/passcode popup
  const TABLE_MESSAGE = "u find an old, peculiar piece of paper on the table. open.";
  const hasPengyKey = inventory.some(i => i.id === 'k3');
  const hasRustyKey = inventory.some(i => i.type === 'rusty-gold-key');
  const PENGUIN_DIALOG = hasRustyKey
    ? [
      "oh a rusty key! ive got just the thing",
      "*woooosh ✨*",
      "[insert electrolysis reaction here]",
      "here's your key! good as new"
    ]
    : hasPengyKey
      ? ["what's ur fav compound? mine is Fe₂O₃"]
      : [
        'hello. im pengy.',
        'heard ur looking for something?',
        'give me the code i seek and the key shall be yours.',
      ];

  const [showTablePopup, setShowTablePopup] = useState(false);
  const [tableTypewriterText, setTableTypewriterText] = useState('');
  const [tableTypewriterIndex, setTableTypewriterIndex] = useState(0);

  const [showPenguinPopup, setShowPenguinPopup] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [penguinDialogIndex, setPenguinDialogIndex] = useState(0);
  const [penguinDialogText, setPenguinDialogText] = useState('');
  const [penguinDialogCharIndex, setPenguinDialogCharIndex] = useState(0);

  // Oven states
  const [showOvenPopup, setShowOvenPopup] = useState(false);
  const [ovenPhase, setOvenPhase] = useState<'unlock' | 'baking'>('unlock');
  const [ovenUnlockInput, setOvenUnlockInput] = useState('');
  const [bakingCount, setBakingCount] = useState(1);
  const [isOvenOpen, setIsOvenOpen] = useState(false);

  // Cat states
  const [showCatPopup, setShowCatPopup] = useState(false);
  const [catDialogIndex, setCatDialogIndex] = useState(0);
  const [catIsGone, setCatIsGone] = useState(false);
  const [catDialogue, setCatDialogue] = useState<string[]>([]);
  const [isBcookieFeeding, setIsBcookieFeeding] = useState(false);
  const [catDialogText, setCatDialogText] = useState('');
  const [catDialogCharIndex, setCatDialogCharIndex] = useState(0);

  // Secret Room Bridge
  const [isBridgeFixed, setIsBridgeFixed] = useState(false);

  // Cat sleeping animation (Z's)
  const [catZSequenceIndex, setCatZSequenceIndex] = useState(0);
  const catZSequence = [0, 1, 2, 3, 2, 1]; // Pattern: 0→1→2→3→2→1→repeat
  const catZCount = catZSequence[catZSequenceIndex];

  // Drop confirmation
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [itemToDrop, setItemToDrop] = useState<string | null>(null);

  // TV State
  const [showTvPopup, setShowTvPopup] = useState(false);
  const [isTvLoading, setIsTvLoading] = useState(false);
  const [tvSearchQuery, setTvSearchQuery] = useState('');
  const [tvSearchResult, setTvSearchResult] = useState<'none' | 'found' | null>(null);

  // Plant State
  const [showPlantPopup, setShowPlantPopup] = useState(false);
  const [plantTypewriterText, setPlantTypewriterText] = useState('');
  const [plantTypewriterIndex, setPlantTypewriterIndex] = useState(0);

  // Closet & Letter Logic
  const [showClosetPopup, setShowClosetPopup] = useState(false);
  const [closetDialogText, setClosetDialogText] = useState('');
  const [closetDialogIndex, setClosetDialogIndex] = useState(0);
  const [closetDialogCharIndex, setClosetDialogCharIndex] = useState(0);

  const [activeClosetDialogue, setActiveClosetDialogue] = useState<string[]>(CLOSET_DIALOGUE);
  const [showLetterPopup, setShowLetterPopup] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    if (showLetterPopup) {
      const updateTime = () => {
        const start = new Date('2026-02-23T00:00:00');
        const now = new Date();
        const diff = Math.max(0, now.getTime() - start.getTime());
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setCurrentTimeStr(`${d} days, ${h} hours, ${m} mins, ${s} secs`);
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [showLetterPopup]);

  const LETTER_CONTENT = (import.meta.env.VITE_LETTER_CONTENT || "").replace(/\\n/g, '\n').replace('[time]', currentTimeStr);

  const [isJukeboxPlaying, setIsJukeboxPlaying] = useState(false);
  const [jukeboxNotes, setJukeboxNotes] = useState<{ id: number; offset: number }[]>([]);

  // Audio Refs
  const jukeboxAudioRef = useRef<HTMLAudioElement | null>(null);

  const playJukebox = () => {
    if (!jukeboxAudioRef.current) {
      jukeboxAudioRef.current = new Audio('/opalite.mp3');
      jukeboxAudioRef.current.loop = false;
      // Also stop when audio ends
      jukeboxAudioRef.current.onended = () => setIsJukeboxPlaying(false);
    }

    if (jukeboxAudioRef.current.paused) {
      jukeboxAudioRef.current.play().catch(e => console.error("Audio playback failed", e));
      setFullText("the jupbox is playing.");
      setIsJukeboxPlaying(true);
    } else {
      jukeboxAudioRef.current.pause();
      setFullText("the jupbox paused.");
      setIsJukeboxPlaying(false);
    }
    setTextIndex(0);
  };

  // Music notes effect
  useEffect(() => {
    if (!isJukeboxPlaying) {
      setJukeboxNotes([]);
      return;
    }

    const interval = setInterval(() => {
      const noteId = Date.now();
      setJukeboxNotes(prev => [...prev, { id: noteId, offset: (Math.random() - 0.5) * 20 }]);

      // Auto-remove note after 2 seconds
      setTimeout(() => {
        setJukeboxNotes(prev => prev.filter(n => n.id !== noteId));
      }, 2000);
    }, 800);

    return () => clearInterval(interval);
  }, [isJukeboxPlaying]);

  const bookRef = useRef<any>(null);

  // Shelf State
  const [showShelfModalId, setShowShelfModalId] = useState<string | null>(null);
  const [bookPage, setBookPage] = useState(1);
  const [bookInput, setBookInput] = useState('');

  // Debounce movement
  const canMove = useRef(true);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [hasCaptured, setHasCaptured] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("error accessing camera:", err);
      setCameraMessage("couldnt access camera :(");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setHasCaptured(true);
    setCameraMessage("analyzing reflection...");
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    if (video) video.pause(); // Freeze the video

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 image data
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const response = await fetch('https://aha-backend-ph63.onrender.com/api/ai/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64Image }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = (data.analysisResult || "").toLowerCase().trim();

      console.log('AI Response:', aiResponse);

      if (aiResponse.includes('yes')) {
        setCameraMessage("found it!");
        if (!inventory.some(i => i.id === 'cutter')) {
          setInventory(prev => [...prev, {
            id: 'cutter',
            name: 'cutter',
            type: 'cutter',
            x: 0,
            y: 0,
            location: 'house',
            color: '#ff0000'
          }]);
          setFullText("you find a cookie cutter!");
          setTextIndex(0);
        }
        setTimeout(() => {
          setShowCamera(false);
          stopCamera();
        }, 1500);
      } else {
        setCameraMessage(aiResponse || "didn't find what i was looking for");
        setTimeout(() => {
          setCameraMessage("");
          setHasCaptured(false);
          if (videoRef.current) videoRef.current.play();
        }, 6000);
      }
    } catch (err) {
      console.error("AI error:", err);
      setCameraMessage("something went wrong with the proxy...");
      setTimeout(() => {
        setCameraMessage("");
      }, 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCamera]);

  // Sparkle effect for new items
  const [activeSparkles, setActiveSparkles] = useState<Record<string, boolean>>({});
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const prevInventoryRef = useRef<Item[]>(inventory);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Ignore changes effectively immediately after mount (loading from storage)
    if (Date.now() - mountTime.current < 1000) {
      prevInventoryRef.current = inventory;
      return;
    }

    const currentCounts = inventory.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prevCounts = prevInventoryRef.current.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.keys(currentCounts).forEach(type => {
      if ((currentCounts[type] || 0) > (prevCounts[type] || 0)) {
        // Trigger sparkle
        if (timeoutRefs.current[type]) {
          clearTimeout(timeoutRefs.current[type]);
        }
        setActiveSparkles(prev => ({ ...prev, [type]: true }));
        timeoutRefs.current[type] = setTimeout(() => {
          setActiveSparkles(prev => ({ ...prev, [type]: false }));
        }, 2000);
      }
    });

    prevInventoryRef.current = inventory;
  }, [inventory]);

  const handleReset = () => {
    clearStage3Progress();
    setLocation('house');
    setPlayerX(8);
    setPlayerY(6);
    setInventory([]);
    setItems(INITIAL_ITEMS);
    setFullText('you wake up in a strange place...');
    setTextIndex(0);
    setCurrentRoom(null);
    setIsOvenOpen(false);
    setOvenPhase('unlock');
    setCatIsGone(false);
    setIsBridgeFixed(false);
    setBookPage(1);
    setBookInput('');
    setHasCaptured(false);
    setIsFlashActive(false);
  };

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadStage3Progress();
    if (saved) {
      setLocation(saved.location);
      setPlayerX(saved.playerX);
      setPlayerY(saved.playerY);
      setInventory(saved.inventory);

      // Merge new static items (like the tile) if they don't exist in save
      const allSavedItemIds = new Set([...saved.items.map((i: Item) => i.id), ...saved.inventory.map((i: Item) => i.id)]);
      const missingItems = INITIAL_ITEMS.filter(i => {
        if (i.id === 't1' && saved.isBridgeFixed) return false;
        return !allSavedItemIds.has(i.id);
      });

      setItems([...saved.items, ...missingItems]);

      setCatIsGone(saved.catIsGone || false);
      setIsOvenOpen(saved.isOvenOpen ?? false);
      setIsBridgeFixed(saved.isBridgeFixed || false);
      setBookPage(saved.bookPage || 1);
    }
  }, []);

  // Set favicon for Stage 3
  useEffect(() => {
    setFavicon(3);
  }, []);

  // Auto-save whenever key state changes
  useEffect(() => {
    // Only save if it's not the initial state or if some progress has been made
    // (Picking up an item or moving)
    const isInitialItems = JSON.stringify(items) === JSON.stringify(INITIAL_ITEMS);
    const hasProgress = inventory.length > 0 || !isInitialItems || playerX !== 8 || playerY !== 6 || location !== 'house';

    if (hasProgress) {
      saveStage3Progress({
        location,
        playerX,
        playerY,
        inventory,
        items,
        catIsGone,
        isOvenOpen,
        isBridgeFixed: isBridgeFixed,
        bookPage
      });
    }
  }, [location, playerX, playerY, inventory, items, catIsGone, isOvenOpen, isBridgeFixed, bookPage]);

  // Furniture generator
  const getFurniture = (room: Room) => {
    if (room.id === 'secret') return [];

    const furniture = [];
    for (let i = 0; i < room.tiles.length; i++) {
      const tile = room.tiles[i];

      // Skip TV tiles
      if (BEDROOM_TV_TILES.some(t => t.x === tile.x && t.y === tile.y)) continue;

      const seed = (tile.x * 1234 + tile.y * 5678 + room.id.length * 90 + room.name.charCodeAt(0)) % 100;
      if (seed < 25) {
        const sizeMod = (seed % 3) * 2;
        furniture.push({
          x: tile.x, y: tile.y,
          widthMod: sizeMod, heightMod: sizeMod,
          offsetX: (seed % 5) * 2, offsetY: (seed % 3) * 2
        });
      }
    }
    return furniture;
  };

  // Typewriter effect
  useEffect(() => {
    if (textIndex < fullText.length) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [textIndex, fullText]);

  // Table popup typewriter
  useEffect(() => {
    if (!showTablePopup) return;
    if (tableTypewriterIndex === 0) {
      setTableTypewriterText('');
    }
    if (tableTypewriterIndex < TABLE_MESSAGE.length) {
      const timer = setTimeout(() => {
        setTableTypewriterText(prev => prev + TABLE_MESSAGE[tableTypewriterIndex]);
        setTableTypewriterIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showTablePopup, tableTypewriterIndex]);

  // Penguin dialogue typewriter (per-sentence)
  useEffect(() => {
    if (!showPenguinPopup) return;
    const currentSentence = PENGUIN_DIALOG[penguinDialogIndex] ?? '';

    if (penguinDialogCharIndex === 0) {
      setPenguinDialogText('');
    }

    if (penguinDialogCharIndex < currentSentence.length) {
      const timer = setTimeout(() => {
        setPenguinDialogText(prev => prev + currentSentence[penguinDialogCharIndex]);
        setPenguinDialogCharIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showPenguinPopup, penguinDialogIndex, penguinDialogCharIndex]);

  // Cat dialogue typewriter
  useEffect(() => {
    if (!showCatPopup) return;
    const currentSentence = catDialogue[catDialogIndex] ?? '';

    if (catDialogCharIndex === 0) {
      setCatDialogText('');
    }

    if (catDialogCharIndex < currentSentence.length) {
      const timer = setTimeout(() => {
        setCatDialogText(prev => prev + currentSentence[catDialogCharIndex]);
        setCatDialogCharIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showCatPopup, catDialogIndex, catDialogCharIndex, catDialogue]);

  // Cat sleeping Z animation (1→2→3→2→1→repeat)
  useEffect(() => {
    if (catIsGone) return;

    const timer = setInterval(() => {
      setCatZSequenceIndex(prev => (prev + 1) % catZSequence.length);
    }, 800); // Change every 800ms

    return () => clearInterval(timer);
  }, [catIsGone, catZSequence.length]);

  // Reset table typewriter when opening popup
  const openTablePopup = () => {
    setTableTypewriterIndex(0);
    setTableTypewriterText('');
    setShowTablePopup(true);
  };

  const openPenguinPopup = () => {
    setPasscodeInput('');
    setPasscodeError('');
    setPenguinDialogIndex(0);
    setPenguinDialogCharIndex(0);
    setPenguinDialogText('');
    setShowPenguinPopup(true);
  };

  const submitPasscode = () => {
    if (passcodeInput === '1') {
      if (!inventory.some(i => i.id === 'k3')) {
        setInventory(prev => [...prev, LIVING_ROOM_KEY]);
        setFullText(`you found a ${LIVING_ROOM_KEY.name}!`);
        setTextIndex(0);
      }
      setShowPenguinPopup(false);
    } else {
      setPasscodeError('wrong passcode.');
    }
  };

  const openOvenPopup = () => {
    setOvenUnlockInput('');
    setOvenPhase(isOvenOpen ? 'baking' : 'unlock');
    setShowOvenPopup(true);
  };

  const handleOvenUnlock = () => {
    if (ovenUnlockInput === '😛') {
      setIsOvenOpen(true);
      setOvenPhase('baking');
    }
  };

  const bakeCookies = () => {
    if (!isOvenOpen) return;
    const hasCutter = inventory.some(i => i.type === 'cutter');
    const newItems: Item[] = [];
    for (let i = 0; i < bakingCount; i++) {
      newItems.push({
        id: `cookie-${Date.now()}-${i}`,
        name: hasCutter ? 'butterfly cookie' : 'cookie',
        type: hasCutter ? 'bcookie' : 'cookie',
        x: 0,
        y: 0,
        location: 'house',
        color: hasCutter ? '#B19470' : '#8B4513'
      });
    }
    setInventory(prev => [...prev, ...newItems]);
    setIsOvenOpen(false); // Lock it again!
    setShowOvenPopup(false);
    setFullText(`baked x${bakingCount} ${hasCutter ? 'butterfly cookies' : 'cookies'}!`);
    setTextIndex(0);
  };

  const openCatDialogue = () => {
    const bcookie = inventory.find(i => i.type === 'bcookie');
    const cookie = inventory.find(i => i.type === 'cookie');

    if (bcookie) {
      setCatDialogue([
        "om nom nom",
        "YUMMY TYSM",
        "*the cat gets up, leaving behind a key...*"
      ]);
      setCatDialogIndex(0);
      setCatDialogCharIndex(0);
      setCatDialogText('');
      setIsBcookieFeeding(true);
      setShowCatPopup(true);
      // Remove one bcookie
      setInventory(prev => {
        const idx = prev.findIndex(i => i.id === bcookie.id);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      });
    } else if (cookie) {
      setCatDialogue(["yum"]);
      setCatDialogIndex(0);
      setCatDialogCharIndex(0);
      setCatDialogText('');
      setIsBcookieFeeding(false);
      setShowCatPopup(true);
      // Remove one cookie
      setInventory(prev => {
        const idx = prev.findIndex(i => i.id === cookie.id);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      });
    } else {
      setCatDialogue(["meow"]);
      setCatDialogIndex(0);
      setCatDialogCharIndex(0);
      setCatDialogText('');
      setIsBcookieFeeding(false);
      setShowCatPopup(true);
    }
  };


  const handleTvSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tvSearchQuery.trim()) return;

    setIsTvLoading(true);
    setTvSearchResult(null);

    setTimeout(() => {
      setIsTvLoading(false);
      if (tvSearchQuery.trim().toLowerCase() === 'naruto') {
        setTvSearchResult('found');
        // Spawn key if not already spawned
        if (!items.some(i => i.id === 'tv-key') && !inventory.some(i => i.id === 'tv-key')) {
          const newKey: Item = {
            id: 'tv-key',
            name: 'key',
            type: 'key',
            x: 1, // Top right of bed (visual)
            y: 8,
            location: 'house',
            color: '#C0C0C0'
          };
          setItems(prev => [...prev, newKey]);
        }
      } else {
        setTvSearchResult('none');
      }
    }, 1500);
  };

  // Plant Popup
  const PLANT_MESSAGE = "01110100011010000110010101110010011001010010011101110011001000000110000100100000011010110110010101111001001011000010000001100010011101010111010000100000011010010111010001110011001000000110100001101001011001000110010001100101011011100010000001101111011011100010000001110100011010000110010100100000011011100110010101111000011101000010000001110011011101000110000101100111011001010010000001101000011001010110100001100101001000000110011101101100";
  useEffect(() => {
    if (!showPlantPopup) return;
    if (plantTypewriterIndex === 0) setPlantTypewriterText('');

    if (plantTypewriterIndex < PLANT_MESSAGE.length) {
      const timer = setTimeout(() => {
        setPlantTypewriterText(prev => prev + PLANT_MESSAGE[plantTypewriterIndex]);
        setPlantTypewriterIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showPlantPopup, plantTypewriterIndex]);

  const openPlantPopup = () => {
    setPlantTypewriterIndex(0);
    setPlantTypewriterText('');
    setShowPlantPopup(true);
  };

  // Closet typewriter
  useEffect(() => {
    if (!showClosetPopup) return;
    const currentSentence = activeClosetDialogue[closetDialogIndex] ?? '';

    if (closetDialogCharIndex === 0) setClosetDialogText('');

    if (closetDialogCharIndex < currentSentence.length) {
      const timer = setTimeout(() => {
        setClosetDialogText(prev => prev + currentSentence[closetDialogCharIndex]);
        setClosetDialogCharIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showClosetPopup, closetDialogIndex, closetDialogCharIndex, activeClosetDialogue]);



  const activePopup = showTablePopup || showPenguinPopup || showOvenPopup || showCatPopup || showCamera || showLockPopup || showDropConfirm || showTvPopup || showPlantPopup || showClosetPopup || showLetterPopup || !!showShelfModalId;

  const handleItemDrop = (e: React.MouseEvent, type: string) => {
    e.preventDefault(); // Prevent default context menu
    if (type === 'key' || type === 'gold-key' || type === 'letter' || type === 'tile') return;

    setItemToDrop(type);
    setShowDropConfirm(true);
  };

  const confirmDrop = () => {
    if (!itemToDrop) return;

    setInventory(prev => prev.filter(i => i.type !== itemToDrop));

    setShowDropConfirm(false);
    setItemToDrop(null);
  };

  // Update message when entering a room (House only)
  useEffect(() => {
    if (location !== 'house') return;

    // Check for Bed
    const isOnBed =
      playerX >= BEDROOM_BED_POS.x && playerX < BEDROOM_BED_POS.x + 2 &&
      playerY >= BEDROOM_BED_POS.y && playerY < BEDROOM_BED_POS.y + 2;

    if (isOnBed) {
      if (fullText !== "zzzz... ok stop pretending to sleep now.") {
        setFullText("zzzz... ok stop pretending to sleep now.");
        setTextIndex(0);
      }
      return;
    }

    const room = getRoomAt(playerX, playerY);
    // If we entered a new room OR we just stepped off the bed (text is still zzzz...)
    if (room && (room.id !== currentRoom?.id || fullText.startsWith("zzzz"))) {
      setCurrentRoom(room);
      const silverKeys = inventory.filter(i => i.type === 'key').length;
      const message = room.id === 'secret'
        ? "a secret room...it feels like there was something here, before the developer hid it."
        : room.id === 'attic'
          ? (silverKeys >= 5 ? "the attic path is open." : "the door to the attic is locked. you need 5 keys.")
          : `you entered the ${room.name}.`;

      setFullText(message);
      setTextIndex(0);

      // Auto-show popup if entering attic zone without keys
      if (room.id === 'attic' && inventory.filter(i => i.type === 'key').length < 5) {
        setShowLockPopup(true);
      } else {
        setShowLockPopup(false);
      }
    } else if (!room && currentRoom) {
      setCurrentRoom(null);
      setFullText("you're walking through the hallway...");
      setTextIndex(0);
      setShowLockPopup(false);
    }
  }, [playerX, playerY, currentRoom, location, inventory, fullText]);

  // Check for item pickup
  useEffect(() => {
    const itemIndex = items.findIndex(i => i.x === playerX && i.y === playerY && i.location === location);
    if (itemIndex !== -1) {
      const item = items[itemIndex];
      setInventory(prev => [...prev, item]);
      setItems(prev => prev.filter((_, i) => i !== itemIndex));
      setFullText(`you found a ${item.name}!`);
      setTextIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerX, playerY, location]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent movement if any popup is open
      if (activePopup) return;

      if (!canMove.current || fadeState === 'out') return;

      let newX = playerX;
      let newY = playerY;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') newY--;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') newY++;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') newX--;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') newX++;
      else return;

      e.preventDefault();

      // House -> Attic Door Logic
      if (location === 'house') {
        const room = getRoomAt(newX, newY);
        if (room?.id === 'attic') {
          const silverKeys = inventory.filter(i => i.type === 'key').length;
          if (silverKeys < 5) {
            setFullText("the attic door is locked. you need all 5 keys.");
            setTextIndex(0);
            setShowLockPopup(true);
            setTimeout(() => setShowLockPopup(false), 2000);
            return;
          }

          // If we reach the end of the 6x1 hallway
          if (newX === 22 && newY === 7) {
            setFadeState('out');
            setTimeout(() => {
              setLocation('attic');
              setPlayerX(10);
              setPlayerY(9);
              setFadeState('in');
              setFullText("you've entered the attic. there's a locked closet.");
              setTextIndex(0);
            }, 1000);
            return;
          }
        }
      }

      // Attic Logic: Closet & Back Door
      if (location === 'attic') {
        // Back to House (Any tile on left side)
        if (newX === 8) {
          setFadeState('out');
          setTimeout(() => {
            setLocation('house');
            setPlayerX(19);
            setPlayerY(7); // Outside attic in house (shifted)
            setFadeState('in');
            setFullText("you're back in the hallway.");
            setTextIndex(0);
          }, 1000);
          return;
        }

        // Check if trying to enter closet
        const isCloset = closetTileSet.has(createTileKey(newX, newY));
        if (isCloset) {
          const hasGold = inventory.some(i => i.type === 'gold-key');
          const hasRusty = inventory.some(i => i.type === 'rusty-gold-key');
          if (hasRusty && !hasGold) {
            setActiveClosetDialogue(["*click*", "the key seems to be rusty..."]);
            setClosetDialogIndex(0);
            setClosetDialogCharIndex(0);
            setClosetDialogText('');
            setShowClosetPopup(true);
            return;
          }
          if (!hasGold) {
            setFullText("the closet is locked. it needs a special key.");
            setTextIndex(0);
            return;
          } else {
            setActiveClosetDialogue(CLOSET_DIALOGUE);
            // Start closet dialogue
            setClosetDialogIndex(0);
            setClosetDialogCharIndex(0);
            setClosetDialogText('');
            setShowClosetPopup(true);
            return;
          }
        }
      }

      // Check walkability
      const hasGold = inventory.some(i => i.type === 'gold-key');
      const hasTile = inventory.some(i => i.type === 'tile');

      // Check for gap specifically
      if (location === 'house' && newX === 16 && newY === 2) {
        if (!isBridgeFixed) {
          if (hasTile) {
            // Place tile
            setIsBridgeFixed(true);
            setInventory(prev => prev.filter(i => i.type !== 'tile'));
            setFullText("you placed the tile. the path is fixed.");
            setTextIndex(0);
            return; // Block move to show placement
          } else {
            setFullText("the path is blocked with a void in the floor.");
            setTextIndex(0);
            return; // Block move
          }
        }
        // If bridge IS fixed, isWalkable will handle it (return true)
      }

      if (isWalkable(newX, newY, location, hasGold, catIsGone, isBridgeFixed)) {
        canMove.current = false;
        setPlayerX(newX);
        setPlayerY(newY);

        // Interactions by touching (1-tile radius, orthogonal only) in the living room
        if (location === 'house') {
          const nearPenguin =
            Math.abs(newX - LIVING_PENGUIN_TILE.x) +
            Math.abs(newY - LIVING_PENGUIN_TILE.y) === 1;
          const nearTable = LIVING_TABLE_TILES.some(
            t =>
              Math.abs(newX - t.x) + Math.abs(newY - t.y) === 1
          );

          // Kitchen window logic (mirror): touching tiles
          const nearWindow = (newX === Math.floor(KITCHEN_WINDOW_POS.x) && (newY === 4 || newY === 5)) ||
            (newX === Math.floor(BEDROOM_WINDOW_POS.x) && (newY === 9 || newY === 10));

          const nearOven = KITCHEN_OVEN_TILES.some(
            t => Math.abs(newX - t.x) + Math.abs(newY - t.y) === 1
          );

          const nearCat = Math.abs(newX - BEDROOM_CAT_TILE.x) + Math.abs(newY - BEDROOM_CAT_TILE.y) === 1;

          const nearTv = BEDROOM_TV_TILES.some(
            t => Math.abs(newX - t.x) + Math.abs(newY - t.y) === 1
          );

          if (nearPenguin) {
            openPenguinPopup();
          }
          if (nearTable) {
            openTablePopup();
          }
          if (nearWindow) {
            setFullText("you stare back at your reflection in the window");
            setTextIndex(0);
            setShowCamera(true);
            setCameraMessage("");
          }
          if (nearOven) {
            openOvenPopup();
          }
          if (nearCat && !catIsGone) {
            openCatDialogue();
          }
          if (nearTv) {
            setShowTvPopup(true);
            setTvSearchQuery('');
            setTvSearchResult(null);
          }

          // Plant proximity (15, 9) (shifted)
          const nearPlant = Math.abs(newX - 15) + Math.abs(newY - 9) === 1;
          if (nearPlant) {
            openPlantPopup();
          }

          // Jukebox proximity
          const nearJukebox = newX === LIBRARY_JUKEBOX_POS.x + 1 && newY === LIBRARY_JUKEBOX_POS.y;
          const wasNearJukebox = playerX === LIBRARY_JUKEBOX_POS.x + 1 && playerY === LIBRARY_JUKEBOX_POS.y;
          if (nearJukebox && !wasNearJukebox) {
            playJukebox();
          }
        }

        setTimeout(() => (canMove.current = true), 100); // 100ms debounce
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerX, playerY, location, inventory, fadeState, activePopup, catIsGone, isBridgeFixed]);

  // Devtools helper
  useEffect(() => {
    (window as any).secretroom = {
      spawnGoldKey: () => {
        const secretRoom = rooms.find(r => r.id === 'secret');
        if (!secretRoom) return;

        // Find tiles in the secret room that the player isn't currently standing on
        const availableTiles = secretRoom.tiles.filter(t =>
          !(t.x === playerX && t.y === playerY && location === 'house')
        );

        if (availableTiles.length === 0) {
          console.log("No available tiles in the secret room!");
          return;
        }

        const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];

        setItems(prev => {
          if (prev.some(i => i.type === 'rusty-gold-key' || i.type === 'gold-key')) return prev;
          return [...prev, {
            id: 'bk',
            name: 'rusty gold key',
            type: 'rusty-gold-key',
            x: randomTile.x,
            y: randomTile.y,
            location: 'house',
            color: '#FFD700'
          }];
        });
        console.log(`rusty gold key spawned`);
      }
    };
    return () => { delete (window as any).secretroom; };
  }, [playerX, playerY, location, setItems]);

  // Render variables
  const mapWidth = GRID_WIDTH * TILE_SIZE;
  const mapHeight = GRID_HEIGHT * TILE_SIZE;

  return (
    <motion.div
      className="relative min-h-screen font-serif overflow-hidden"
      animate={{ opacity: fadeState === 'in' ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: location === 'house' ? `
          repeating-linear-gradient(
            -45deg,
            #E8DFD0 0px,
            #E8DFD0 6px,
            #F0E8DC 6px,
            #F0E8DC 12px
          )
        ` : '#2a2a2a', // Dark background for attic
      }}
    >
      <div className="absolute top-4 right-4 flex gap-4 z-50">

        <motion.button
          onClick={() => navigate('/dash')}
          className="text-sm font-medium text-[#8B7355] hover:scale-105 transition-transform"
        >
          ← back to dash
        </motion.button>
      </div>

      <div className="flex items-center justify-center min  -h-screen pb-24">
        <div style={{ width: mapWidth, height: mapHeight, position: 'relative' }}>

          {/* HOUSE MAP RENDERING */}
          {location === 'house' && (
            <>
              {hallwayTiles.map((tile, i) => (
                <img
                  key={i}
                  src="/hallway_tile.png"
                  alt=""
                  className="absolute object-cover"
                  style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
                />
              ))}

              {/* Gap Fix Tile */}
              {isBridgeFixed && (
                <img
                  src="/hallway_tile.png"
                  alt="fixed path"
                  className="absolute object-cover"
                  style={{ left: 16 * TILE_SIZE, top: 2 * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
                />
              )}

              {rooms.map(room => {
                // ... Room rendering logic same as before but using getTileBorders
                const isActive = currentRoom?.id === room.id;
                const furniture = getFurniture(room);
                return (
                  <React.Fragment key={room.id}>
                    {room.tiles.map((tile, idx) => {
                      const borders = getTileBorders(room, tile.x, tile.y);
                      const isActive = currentRoom?.id === room.id; // re-declare to be safe or use above
                      const borderColor = isActive ? '#5a4a3a' : '#A69076';
                      // ... detailed border rendering
                      return (
                        <div key={`t-${idx}`} className={`absolute box-border ${room.id === 'secret' ? 'bg-[#2e2e2c]' : 'bg-[#F5EEE6]'}`}
                          style={{
                            left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE,
                            width: TILE_SIZE, height: TILE_SIZE,
                            borderTop: borders.top ? `2px solid ${borderColor}` : 'none',
                            borderBottom: borders.bottom ? `2px solid ${borderColor}` : 'none',
                            borderLeft: borders.left ? `2px solid ${borderColor}` : 'none',
                            borderRight: borders.right ? `2px solid ${borderColor}` : 'none',
                          }} />
                      );
                    })}
                    {/* Label */}
                    <div
                      className="absolute pointer-events-none flex items-center justify-center z-10"
                      style={{
                        left: room.labelPos.x * TILE_SIZE, top: room.labelPos.y * TILE_SIZE,
                        transform: 'translate(-50%, -50%)', maxWidth: '90px', textAlign: 'center', lineHeight: 1.1
                      }}>
                      <span className={`font-semibold text-[11px] ${room.id === 'secret' ? 'text-[#dbd0c4]' : 'text-[rgba(90,74,58,0.5)]'}`}>
                        {room.name}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Living room: table (rectangle) and penguin */}
              <div
                className="absolute z-30 border-2 border-[#cab9a7] bg-[#dbd0c4] rounded-sm flex items-center justify-center"
                style={{
                  left: LIVING_TABLE_TILES[0].x * TILE_SIZE + 4,
                  top: LIVING_TABLE_TILES[0].y * TILE_SIZE + 4,
                  width: 2 * TILE_SIZE - 8,
                  height: TILE_SIZE - 8,
                }}
                title="table"
              >
                <img src="/paper.png" alt="paper" className="absolute left-1 w-4 h-4 object-contain opacity-80" style={{ transform: 'rotate(-15deg)' }} />
              </div>
              <div
                className="absolute z-30 hover:opacity-90 transition-opacity"
                style={{
                  left: LIVING_PENGUIN_TILE.x * TILE_SIZE,
                  top: LIVING_PENGUIN_TILE.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
                title="pengy"
              >
                <img src="/peng.png" alt="pengy" className="w-full h-full p-1 object-contain pointer-events-none" />
              </div>

              {/* Kitchen Window */}
              <div
                className="absolute z-30"
                style={{
                  left: KITCHEN_WINDOW_POS.x * TILE_SIZE - 5,
                  top: KITCHEN_WINDOW_POS.y * TILE_SIZE,
                  width: 20,
                  height: 1.5 * TILE_SIZE,
                }}
              >
                <img src="/window.png" alt="window" className="w-full h-full object-contain" />
              </div>

              {/* Kitchen decorative rect */}
              <div
                className="absolute z-10 border-2 border-[#cab9a7] bg-[#dbd0c4] rounded-sm pointer-events-none"
                style={{
                  left: KITCHEN_DECOR_POS.x * TILE_SIZE,
                  top: KITCHEN_DECOR_POS.y * TILE_SIZE + 6,
                  width: 1.5 * TILE_SIZE - 6,
                  height: TILE_SIZE - 12,
                }}
              />

              {/* Oven */}
              <div
                className="absolute z-30 group cursor-pointer"
                style={{
                  left: KITCHEN_OVEN_TILES[0].x * TILE_SIZE,
                  top: KITCHEN_OVEN_TILES[0].y * TILE_SIZE,
                  width: 2 * TILE_SIZE,
                  height: TILE_SIZE,
                }}
              >
                <img src="/oven.png" alt="oven" className="w-full h-full object-cover p-1" />
              </div>

              {/* TV */}
              <div
                className="absolute z-30"
                style={{
                  left: BEDROOM_TV_TILES[0].x * TILE_SIZE - 4,
                  top: BEDROOM_TV_TILES[0].y * TILE_SIZE,
                  width: 2 * TILE_SIZE,
                  height: 2.5 * TILE_SIZE,
                }}
              >
                <img
                  src="/tv.png"
                  alt="tv"
                  className="w-full h-full object-contain pointer-events-none scale-[2.2]"
                  style={{ transform: 'rotate(-90deg)' }}
                />
              </div>

              {/* Bed */}
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  left: BEDROOM_BED_POS.x * TILE_SIZE,
                  top: BEDROOM_BED_POS.y * TILE_SIZE,
                  width: 2 * TILE_SIZE,
                  height: 2 * TILE_SIZE,
                }}
              >
                <img
                  src="/bed.png"
                  alt="bed"
                  className="w-full h-full object-contain"
                  style={{ transform: 'rotate(-90deg)' }}
                />
              </div>

              {/* Decorative Bedroom Furniture */}
              <div
                className="absolute z-10 border-2 border-[#cab9a7] bg-[#dbd0c4] rounded-sm pointer-events-none"
                style={{
                  left: 0 * TILE_SIZE + 6,
                  top: 9 * TILE_SIZE + 6,
                  width: 2 * TILE_SIZE - 12,
                  height: TILE_SIZE - 12,
                }}
              >
                <img
                  src="/plant.png"
                  alt="plant"
                  className="absolute left-1 w-6 h-6 object-contain p-0.5"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>

              {/* Bedroom Window */}
              <div
                className="absolute z-30"
                style={{
                  left: BEDROOM_WINDOW_POS.x * TILE_SIZE,
                  top: BEDROOM_WINDOW_POS.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: 2 * TILE_SIZE,
                }}
              >
                <img
                  src="/window.png"
                  alt="window"
                  className="w-full h-full object-contain"
                  style={{ transform: 'rotate(90deg)' }}
                />
              </div>

              {/* Cat */}
              {!catIsGone && (
                <div
                  className="absolute z-30"
                  style={{
                    left: BEDROOM_CAT_TILE.x * TILE_SIZE,
                    top: BEDROOM_CAT_TILE.y * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                  }}
                >
                  <motion.img
                    src="/cat.png"
                    alt="cat"
                    className="w-full h-full object-contain p-1"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  {/* Sleeping Z's - top right of cat */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      right: -4,
                      top: 0,
                    }}
                  >
                    {catZCount >= 1 && (
                      <div className="text-white text-xs font-bold" style={{ position: 'absolute', right: 0, top: 2 }}>z</div>
                    )}
                    {catZCount >= 2 && (
                      <div className="text-white text-xs font-bold" style={{ position: 'absolute', right: 4, top: -2 }}>z</div>
                    )}
                    {catZCount >= 3 && (
                      <div className="text-white text-xs font-bold" style={{ position: 'absolute', right: 8, top: 6 }}>z</div>
                    )}
                  </div>
                </div>
              )}
              {/* Plant */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: 15 * TILE_SIZE,
                  top: 9 * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
                title="plant"
              >
                <img src="/plant.png" alt="plant" className="w-full h-full object-contain p-0.5" />
              </div>

              {/* Library Shelves */}
              {LIBRARY_SHELVES.map(shelf => {
                const isBelow = playerY === shelf.y + 1 && (playerX === shelf.x || playerX === shelf.x + 1) && location === 'house';
                return (
                  <React.Fragment key={shelf.id}>
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: shelf.x * TILE_SIZE,
                        top: shelf.y * TILE_SIZE,
                        width: 2 * TILE_SIZE,
                        height: TILE_SIZE,
                      }}
                      title="bookshelf"
                    >
                      <img src="/shelf_front.png" alt="bookshelf" className="w-full h-full object-cover" />
                    </div>

                    {isBelow && !showShelfModalId && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        className="absolute z-50 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-[#A69076] cursor-pointer hover:bg-white transition-colors"
                        style={{
                          left: (shelf.x + 1) * TILE_SIZE,
                          top: shelf.y * TILE_SIZE - 12,
                        }}
                        onClick={() => setShowShelfModalId(shelf.id)}
                      >
                        <span className="text-[9px] font-bold text-[#5a4a3a]">interact</span>
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Jukebox */}
              <div
                className="absolute z-30"
                style={{
                  left: LIBRARY_JUKEBOX_POS.x * TILE_SIZE,
                  top: LIBRARY_JUKEBOX_POS.y * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
                title="jupbox"
              >
                <img
                  src="/jupbox.png"
                  alt="jupbox"
                  className="w-full h-full object-cover p-0.5 rounded-lg shadow-sm"
                />

                {/* Music Notes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                  {jukeboxNotes.map(note => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0.8, y: 0, x: 0 }}
                      animate={{
                        opacity: 0,
                        y: 40 + Math.random() * 20,
                        x: note.offset,
                        rotate: note.offset > 0 ? 15 : -15
                      }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="absolute text-black font-bold select-none"
                      style={{
                        left: '50%',
                        fontSize: '14px',
                        textShadow: '0 0 3px rgba(0,0,0,0.5)'
                      }}
                    >
                      {['♪', '♫', '♬', '♩'][Math.floor(note.id % 4)]}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Library Side Shelves */}
              {LIBRARY_SIDE_SHELVES.map(shelf => {
                const isRight = playerX === shelf.x + 1 && (playerY === shelf.y || playerY === shelf.y + 1) && location === 'house';
                return (
                  <React.Fragment key={shelf.id}>
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: shelf.x * TILE_SIZE,
                        top: shelf.y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: 2 * TILE_SIZE,
                      }}
                      title="bookshelf"
                    >
                      <img src="/shelf_side.png" alt="bookshelf" className="w-full h-full object-cover" />
                    </div>

                    {isRight && !showShelfModalId && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        className="absolute z-50 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-[#A69076] cursor-pointer hover:bg-white transition-colors"
                        style={{
                          left: shelf.x * TILE_SIZE + TILE_SIZE / 2,
                          top: shelf.y * TILE_SIZE - 12,
                        }}
                        onClick={() => setShowShelfModalId(shelf.id)}
                      >
                        <span className="text-[9px] font-bold text-[#5a4a3a]">interact</span>
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* ATTIC MAP RENDERING */}
          {location === 'attic' && (
            <>
              {ATTIC_TILES.map((tile, i) => (
                <div key={`at-${i}`} className="absolute bg-[#4a4a4a]"
                  style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />
              ))}
              {CLOSET_TILES.map((tile, i) => (
                <div key={`cl-${i}`} className="absolute bg-[#3a2a2a] border border-[#5a4a3a]"
                  style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }} />
              ))}

              <div className="absolute text-white/50 text-[11px] font-semibold pointer-events-none z-10"
                style={{ left: 10.5 * TILE_SIZE, top: 5.8 * TILE_SIZE, transform: 'translate(-50%, -50%)' }}>
                closet
              </div>
              <div className="absolute text-white/50 text-[11px] font-semibold pointer-events-none z-10"
                style={{ left: 10.5 * TILE_SIZE, top: 8.5 * TILE_SIZE, transform: 'translate(-50%, -50%)' }}>
                attic
              </div>
            </>
          )}

          {/* ITEMS ON GROUND */}
          {items.filter(i => i.location === location).map(item => (
            <motion.div
              key={item.id}
              className="absolute flex items-center justify-center z-20"
              style={{ left: item.x * TILE_SIZE, top: item.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              {item.type === 'key' ? (
                <img
                  src="/key.png"
                  alt={item.name}
                  className="w-5 h-5 object-contain drop-shadow-sm"
                />
              ) : item.type === 'gold-key' ? (
                <img
                  src="/gold_key.png"
                  alt={item.name}
                  className="w-5 h-5 object-contain drop-shadow-sm"
                />
              ) : item.type === 'rusty-gold-key' ? (
                <img
                  src="/rusty_golden_key.png"
                  alt={item.name}
                  className="w-5 h-5 object-contain drop-shadow-sm"
                />
              ) : item.type === 'tile' ? (
                <img
                  src="/hallway_tile.png"
                  alt={item.name}
                  className="w-6 h-6 object-cover drop-shadow-sm"
                  style={{ borderRadius: 2 }}
                />
              ) : (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    border: '2px solid white',
                    boxShadow: '0 0 5px rgba(255,255,255,0.5)',
                  }}
                />
              )}
            </motion.div>
          ))}

          {/* LOCK POPUP INDICATOR */}
          {showLockPopup && location === 'house' && (
            <div className="absolute z-40 bg-white/90 p-2 rounded shadow-lg border border-[#A69076]"
              style={{
                left: 19.5 * TILE_SIZE, // Over attic entrance (shifted)
                top: 6 * TILE_SIZE,
                transform: 'translate(-50%, -100%)'
              }}>
              <div className="text-[10px] text-[#5a4a3a] font-bold mb-1 text-center">locked</div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 border border-[#5a4a3a] flex items-center justify-center bg-[#F5EEE6]">
                    {i < inventory.filter(k => k.type === 'key').length && (
                      <img src="/key.png" alt="key" className="w-3.5 h-3.5 object-contain" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TABLE POPUP (typewriter + open link to chem.pdf) */}
          {showTablePopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTablePopup(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-mono text-lg min-h-[2em]">
                  {tableTypewriterIndex < TABLE_MESSAGE.length ? (
                    <>
                      {tableTypewriterText}
                      <span className="inline-block w-2 h-5 ml-0.5 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
                    </>
                  ) : (
                    <>u find an old, peculiar piece of paper on the table. <a href="/chem.pdf" download className="text-[#6B5B4F] underline font-semibold hover:text-[#8B7355]">open</a>.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* PENGUIN POPUP (dialogue with per-sentence typewriter, then passcode) */}
          {showPenguinPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPenguinPopup(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-medium mb-3 min-h-[2.5em]">
                  {penguinDialogText}
                  {penguinDialogCharIndex < (PENGUIN_DIALOG[penguinDialogIndex]?.length ?? 0) && (
                    <span className="inline-block w-2 h-5 ml-0.5 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
                  )}
                </p>
                <div className="flex items-center justify-between mb-3">
                  {penguinDialogIndex < PENGUIN_DIALOG.length - 1 &&
                    penguinDialogCharIndex >= (PENGUIN_DIALOG[penguinDialogIndex]?.length ?? 0) && (
                      <button
                        onClick={() => {
                          setPenguinDialogIndex(i => i + 1);
                          setPenguinDialogCharIndex(0);
                          setPenguinDialogText('');
                        }}
                        className="flex items-center gap-1 text-sm text-[#6B5B4F] hover:text-[#5a4a3a]"
                      >
                        <span>➜</span>
                      </button>
                    )}
                </div>

                {!hasPengyKey && !hasRustyKey && penguinDialogIndex === PENGUIN_DIALOG.length - 1 &&
                  penguinDialogCharIndex >= (PENGUIN_DIALOG[penguinDialogIndex]?.length ?? 0) && (
                    <>
                      <input
                        type="number"
                        value={passcodeInput}
                        onChange={e => {
                          setPasscodeInput(e.target.value);
                          setPasscodeError('');
                        }}
                        onKeyDown={e => e.key === 'Enter' && submitPasscode()}
                        className="w-full border-2 border-[#A69076] rounded px-3 py-2 text-[#5a4a3a] font-mono"
                        placeholder="123456"
                        autoFocus
                      />
                      {passcodeError && <p className="text-red-600 text-sm mt-2">{passcodeError}</p>}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={submitPasscode}
                          className="px-4 py-2 bg-[#6B5B4F] text-[#F5EEE6] rounded hover:bg-[#5a4a3a]"
                        >
                          submit
                        </button>
                        <button
                          onClick={() => setShowPenguinPopup(false)}
                          className="px-4 py-2 text-[#8B7355] hover:underline"
                        >
                          cancel
                        </button>
                      </div>
                    </>
                  )}

                {hasRustyKey && penguinDialogIndex === PENGUIN_DIALOG.length - 1 && penguinDialogCharIndex >= (PENGUIN_DIALOG[penguinDialogIndex]?.length ?? 0) && (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        // Replace rusty key with gold key
                        setInventory(prev => {
                          const idx = prev.findIndex(i => i.type === 'rusty-gold-key');
                          if (idx === -1) return prev;
                          const copy = [...prev];
                          copy[idx] = {
                            id: 'gold-key-fixed',
                            name: 'gold key',
                            type: 'gold-key',
                            x: 0,
                            y: 0,
                            location: 'house',
                            color: '#FFD700'
                          };
                          return copy;
                        });
                        setFullText("you got a gold key!");
                        setTextIndex(0);
                        setShowPenguinPopup(false);
                      }}
                      className="px-4 py-2 bg-[#6B5B4F] text-[#F5EEE6] rounded hover:bg-[#5a4a3a]"
                    >
                      keep.
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAMERA POPUP */}
          {showCamera && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowCamera(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowCamera(false)}
                  className="absolute top-2 right-4 text-2xl text-[#8B7355] hover:text-[#5a4a3a]"
                >
                  x
                </button>
                <h2 className="text-[#5a4a3a] font-mono text-xl mb-4 text-center">window</h2>
                <div className="relative aspect-video bg-black overflow-hidden border-2 border-[#A69076]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${hasCaptured ? 'hidden' : 'block'}`}
                  />
                  <canvas
                    ref={canvasRef}
                    className={`w-full h-full object-cover ${hasCaptured ? 'block' : 'hidden'}`}
                  />

                  {/* Flash Effect */}
                  <AnimatePresence>
                    {isFlashActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white z-20"
                      />
                    )}
                  </AnimatePresence>

                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <div className="w-8 h-8 border-4 border-[#F5EEE6] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {cameraMessage && (
                  <p className="mt-4 text-center text-[#5a4a3a] font-mono text-sm font-semibold">
                    {cameraMessage}
                  </p>
                )}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleCapture}
                    disabled={isAnalyzing}
                    className="px-8 py-3 bg-[#6B5B4F] text-[#F5EEE6] rounded-full font-mono text-lg hover:bg-[#5a4a3a] disabled:opacity-50 transition-all shadow-lg active:scale-95"
                  >
                    {isAnalyzing ? 'analyzing...' : 'capture'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PLAYER - Snappy movement (no transition for position) */}
          <div className="absolute flex items-center justify-center pointer-events-none z-30 transition-none"
            style={{
              left: playerX * TILE_SIZE + (TILE_SIZE - 18) / 2,
              top: playerY * TILE_SIZE + (TILE_SIZE - 18) / 2,
              width: 18,
              height: 18,
              transition: 'none' // Ensure no smoothing
            }}
          >
            <svg
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="#ffaeb6ff"
              style={{ filter: 'drop-shadow(0 0 5px rgba(249, 168, 212, 0.8))' }}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="#ffaeb6ff"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </div>

          {/* Oven Popup */}
          {showOvenPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowOvenPopup(false)}>
              <div className="bg-[#FAF9F6] border-2 border-[#8B7355] p-8 max-w-sm shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                {ovenPhase === 'unlock' ? (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-serif text-[#5a4a3a] text-center pb-2">the oven is locked.</h2>
                    <input
                      type="text"
                      value={ovenUnlockInput}
                      onChange={e => setOvenUnlockInput(e.target.value)}
                      className="w-full px-4 py-2 bg-transparent focus:outline-none text-[#5a4a3a] text-center text-xl font-mono"
                      placeholder="..."
                      onKeyDown={e => e.key === 'Enter' && handleOvenUnlock()}
                    />
                    <div className="flex flex-col items-center">
                      <p className="text-transparent text-[8px]">it requires an emoji.</p>
                      <button
                        onClick={handleOvenUnlock}
                        className="mt-4 px-6 py-2 bg-[#8B7355] text-white rounded-full hover:bg-[#6B5B4F] transition-colors"
                      >
                        confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-serif text-[#5a4a3a] text-center">quantity</h2>
                    <div className="flex items-center justify-center gap-8">
                      <button
                        onClick={() => setBakingCount(Math.max(1, bakingCount - 1))}
                        className="w-20 h-12 flex items-center justify-center bg-orange-950 rounded-md text-2xl text-orange-200 hover:bg-[#8B7355] hover:text-white transition-all shadow-md active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-4xl font-mono font-bold text-[#5a4a3a] min-w-[3ch] text-center">
                        {bakingCount}
                      </span>
                      <button
                        onClick={() => setBakingCount(bakingCount + 1)}
                        className="w-20 h-12 flex items-center justify-center bg-orange-950 rounded-md text-2xl text-orange-200 hover:bg-[#8B7355] hover:text-white transition-all shadow-md active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={bakeCookies}
                        className="px-10 py-3 bg-[#F5EEE6] text-[#5a4a3a] border-2 border-[#8B7355] rounded-full font-serif text-xl hover:bg-[#E8DFD0] transition-colors shadow-lg active:scale-95"
                      >
                        bake
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cat Dialogue Popup */}
          {showCatPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCatPopup(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-medium mb-3 min-h-[2.5em]">
                  {catDialogText}
                  {catDialogCharIndex < (catDialogue[catDialogIndex]?.length ?? 0) && (
                    <span className="inline-block w-2 h-5 ml-0.5 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
                  )}
                </p>
                <div className="flex items-center justify-between mt-4">
                  {catDialogCharIndex >= (catDialogue[catDialogIndex]?.length ?? 0) && (
                    <button
                      onClick={() => {
                        if (catDialogIndex < catDialogue.length - 1) {
                          setCatDialogIndex(i => i + 1);
                          setCatDialogCharIndex(0);
                          setCatDialogText('');
                        } else {
                          if (isBcookieFeeding && catDialogIndex === catDialogue.length - 1) {
                            setCatIsGone(true);
                            const newKey: Item = {
                              id: 'k1-spawned',
                              name: 'key',
                              type: 'key',
                              x: BEDROOM_CAT_TILE.x,
                              y: BEDROOM_CAT_TILE.y,
                              location: 'house',
                              color: '#C0C0C0'
                            };
                            setItems(prev => [...prev, newKey]);
                          }
                          setShowCatPopup(false);
                        }
                      }}
                      className="flex items-center gap-1 text-sm text-[#6B5B4F] hover:text-[#5a4a3a]"
                    >
                      <span>➜</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* TV Popup */}
          {showTvPopup && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowTvPopup(false)}>
              <div className="text-white font-mono text-xl mb-4" onClick={e => e.stopPropagation()}>tv</div>
              <div
                className="bg-[#141414] w-[800px] h-[500px] overflow-hidden flex flex-col relative shadow-2xl border border-[#333]"
                onClick={e => e.stopPropagation()}
              >
                {/* Navbar */}
                <div className="h-16 flex items-center px-8 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10 gap-8">
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/017/396/814/non_2x/netflix-mobile-application-logo-free-png.png"
                    alt="Logo"
                    className="h-8 object-contain"
                  />
                  <div className="flex gap-4 text-sm text-[#e5e5e5] font-sans font-light opacity-80 pointer-events-none select-none">
                    <span>home</span>
                    <span>tv shows</span>
                    <span>movies</span>
                    <span>new & popular</span>
                    <span>my list</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center mt-12 bg-[#141414] text-white">
                  <form onSubmit={handleTvSearch} className="w-full max-w-lg relative mb-12">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={tvSearchQuery}
                        onChange={e => setTvSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-[#333] rounded-sm leading-5 bg-black text-white placeholder-gray-500 focus:outline-none focus:bg-[#141414] focus:border-white transition-colors duration-150 sm:text-sm"
                        placeholder="titles, people, genres"
                        autoFocus
                      />
                    </div>
                  </form>

                  {/* Results Display */}
                  <div className="text-center min-h-[100px]">
                    {isTvLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {tvSearchResult === 'none' && (
                          <div className="text-[#666] text-lg font-light">
                            <span>no results found. </span>
                            <a href="/troubleshoot" className="text-[#666] hover:text-gray-400">troubleshoot.</a>
                          </div>
                        )}

                        {tvSearchResult === 'found' && (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-xl font-light text-[#e5e5e5] mb-2">
                              <span>1 result found</span>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4a38bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div className="text-sm text-[#666]">
                              (check the bedroom)
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowTvPopup(false)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white text-xl z-50"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Plant Popup */}
          {showPlantPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPlantPopup(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-medium min-h-[1.5em] mb-4 break-all">
                  {plantTypewriterText}
                  <span className="inline-block w-2 h-5 ml-0.5 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
                </p>
              </div>
            </div>
          )}

          {/* Closet Dialogue Popup */}
          {showClosetPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowClosetPopup(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-medium mb-3 min-h-[2.5em]">
                  {closetDialogIndex < activeClosetDialogue.length - 1 || closetDialogCharIndex < (activeClosetDialogue[closetDialogIndex]?.length ?? 0) ? (
                    <>
                      {closetDialogText}
                      {closetDialogCharIndex < (activeClosetDialogue[closetDialogIndex]?.length ?? 0) && (
                        <span className="inline-block w-2 h-5 ml-0.5 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
                      )}
                    </>
                  ) : (
                    <>
                      {activeClosetDialogue === CLOSET_DIALOGUE ? (
                        <>
                          theres a letter inside. {' '}
                          <button
                            onClick={() => {
                              setShowClosetPopup(false);
                              setShowLetterPopup(true);
                            }}
                            className="text-[#6B5B4F] underline font-semibold hover:text-[#8B7355]"
                          >
                            open
                          </button>
                          .
                        </>
                      ) : (
                        <span>the key seems to be rusty...</span>
                      )}
                    </>
                  )}
                </p>
                <div className="flex items-center justify-between mb-3">
                  {closetDialogIndex < activeClosetDialogue.length - 1 &&
                    closetDialogCharIndex >= (activeClosetDialogue[closetDialogIndex]?.length ?? 0) && (
                      <button
                        onClick={() => {
                          setClosetDialogIndex(i => i + 1);
                          setClosetDialogCharIndex(0);
                          setClosetDialogText('');
                        }}
                        className="flex items-center gap-1 text-sm text-[#6B5B4F] hover:text-[#5a4a3a]"
                      >
                        <span>➜</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Letter Popup */}
          {showLetterPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-none" onClick={() => setShowLetterPopup(false)}>
              <div
                className="bg-[#F5EEE6] border-2 border-[#A69076] p-8 max-w-lg shadow-2xl relative transition-none max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
                style={{
                  minHeight: '400px',
                  backgroundImage: 'repeating-linear-gradient(#F5EEE6 0px, #F5EEE6 24px, #E8DFD0 25px)',
                  lineHeight: '25px'
                }}
              >
                <div className="font-mono text-[#5a4a3a] text-xs md:text-sm whitespace-pre-wrap">
                  {LETTER_CONTENT}
                </div>
                {!inventory.some(i => i.type === 'letter') && (
                  <div className="mt-20 flex justify-end">
                    <button
                      onClick={() => {
                        setInventory(prev => [...prev, {
                          id: 'letter-1',
                          name: 'letter',
                          type: 'letter',
                          x: 0,
                          y: 0,
                          location: 'house',
                          color: '#fff'
                        }]);
                        setShowLetterPopup(false);
                      }}
                      className="text-[#6B5B4F] hover:text-[#8B7355] text-[11px]"
                    >
                      keep.
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowLetterPopup(false)}
                  className="absolute top-4 right-4 text-[#8B7355] hover:text-[#5a4a3a]"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Drop Confirmation Popup */}
          {showDropConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDropConfirm(false)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-6 max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="text-[#5a4a3a] font-medium mb-4 text-center">drop this item?</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={confirmDrop}
                    className="px-6 py-2 bg-[#8B7355] text-[#F5EEE6] rounded hover:bg-[#6B5B4F] transition-colors"
                  >
                    yes
                  </button>
                  <button
                    onClick={() => setShowDropConfirm(false)}
                    className="px-6 py-2 bg-[#A69076] text-[#F5EEE6] rounded hover:bg-[#8B7355] transition-colors"
                  >
                    no
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Shelf Modal */}
          {showShelfModalId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShelfModalId(null)}>
              <div className="bg-[#F5EEE6] border-2 border-[#A69076] p-4 w-full max-w-2xl shadow-xl relative min-h-[360px] flex flex-col" onClick={e => e.stopPropagation()}>
                {showShelfModalId === 'shelf1' && !inventory.some(i => i.id === 'k4') ? (
                  <div className="flex flex-col h-full flex-1 min-h-[340px]">
                    <div className="text-[#5a4a3a] font-serif text-sm text-center mb-4 border-b border-[#A69076]/30 pb-2">
                      a book
                    </div>
                    <div className="flex-1 min-h-[300px] relative" style={{ overflow: 'hidden' }}>
                      <HTMLFlipBook
                        ref={bookRef}
                        width={280}
                        height={320}
                        size="fixed"
                        minWidth={100}
                        maxWidth={2000}
                        minHeight={100}
                        maxHeight={2000}
                        startPage={0}
                        flippingTime={700}
                        useMouseEvents={false}
                        drawShadow={true}
                        showCover={false}
                        usePortrait={true}
                        startZIndex={0}
                        autoSize={true}
                        maxShadowOpacity={1}
                        mobileScrollSupport={true}
                        clickEventForward={false}
                        swipeDistance={30}
                        showPageCorners={false}
                        disableFlipByClick={true}
                        className="mx-auto"
                        style={{}}
                        onInit={(e: { object: { turnToPage: (n: number) => void } }) => {
                          const targetPage = bookPage === 2 ? 2 : bookPage === 3 ? 4 : bookPage === 4 ? 6 : 0;
                          if (targetPage > 0) e.object.turnToPage(targetPage);
                        }}
                      >
                        {/* Spread 1: empty left | content 1 */}
                        <BookPage pageNum={1} isLeft><span className="opacity-0">.</span></BookPage>
                        <BookPage pageNum={2}>
                          <div className="flex flex-col items-start gap-3 w-full">
                            <span className="text-[#8b7355] text-[11px] font-mono leading-relaxed">
                              first letter of the last 9
                            </span>
                            <div className="h-7 w-full" />
                          </div>
                        </BookPage>
                        {/* Spread 2: empty left | content 2 */}
                        <BookPage pageNum={3} isLeft><span className="opacity-0">.</span></BookPage>
                        <BookPage pageNum={4}>
                          <div className="flex flex-col items-start gap-4 w-full">
                            <p className="text-[#8b7355] text-[11px] font-serif leading-relaxed italic">
                              &quot;Through analyzing the remembered elements of our dreams, Freud said that the unconscious elements would be revealed to our conscious mind&quot;
                              (IM SO SORRY BTW 😭😭)
                            </p>
                            <div className="h-7 w-full" />
                          </div>
                        </BookPage>
                        {/* Spread 3: empty left | content 3 - frame 356, chip */}
                        <BookPage pageNum={5} isLeft><span className="opacity-0">.</span></BookPage>
                        <BookPage pageNum={6}>
                          <div className="flex flex-col items-start gap-3 w-full">
                            <span className="text-[#8b7355] text-[11px] font-mono leading-relaxed">
                              frame 356
                            </span>
                            <div className="h-7 w-full" />
                          </div>
                        </BookPage>
                        {/* Spread 4: empty left | content 4 - key */}
                        <BookPage pageNum={7} isLeft><span className="opacity-0">.</span></BookPage>
                        <BookPage pageNum={8}>
                          <div className="flex flex-col items-center gap-4 w-full">
                            <p className="text-[#5a4a3a] font-serif text-xs md:text-sm italic leading-relaxed text-center">
                              is this what ur looking for perchance?
                            </p>
                            <div className="h-16 w-full" />
                          </div>
                        </BookPage>
                      </HTMLFlipBook>
                      {/* Input overlay - outside flipbook so it never loses focus or gets recreated */}
                      <div className="absolute inset-0 z-10 pointer-events-none flex justify-center items-center">
                        <div className="w-[560px] h-[320px] flex pointer-events-none" style={{ maxWidth: '100%' }}>
                          <div className="flex-1 pointer-events-none" />
                          <div className="w-[280px] flex flex-col justify-center px-6 pointer-events-auto">
                            {bookPage === 1 && (
                              <input
                                key="input-1"
                                type="text"
                                value={bookInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBookInput(val);
                                  if (val.toLowerCase().trim() === 'munchkins') {
                                    const pf = bookRef.current?.pageFlip?.();
                                    if (pf) {
                                      pf.flipNext('bottom');
                                      setBookPage(2);
                                      setBookInput('');
                                    } else {
                                      setBookPage(2);
                                      setBookInput('');
                                    }
                                  }
                                }}
                                autoFocus
                                className="bg-transparent border-none outline-none text-[#5a4a3a] font-serif text-sm py-1 w-full"
                              />
                            )}
                            {bookPage === 2 && (
                              <input
                                key="input-2"
                                type="text"
                                value={bookInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBookInput(val);
                                  if (val.toLowerCase().trim() === 'sleeeeeepy') {
                                    const pf = bookRef.current?.pageFlip?.();
                                    if (pf) {
                                      pf.flipNext('bottom');
                                      setBookPage(3);
                                      setBookInput('');
                                    } else {
                                      setBookPage(3);
                                      setBookInput('');
                                    }
                                  }
                                }}
                                autoFocus
                                className="bg-transparent border-none outline-none text-[#5a4a3a] font-serif text-sm py-1 w-full"
                              />
                            )}
                            {bookPage === 3 && (
                              <input
                                key="input-3"
                                type="text"
                                value={bookInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBookInput(val);
                                  if (val.toLowerCase().trim() === 'chip') {
                                    const pf = bookRef.current?.pageFlip?.();
                                    if (pf) {
                                      pf.flipNext('bottom');
                                      setBookPage(4);
                                      setBookInput('');
                                    } else {
                                      setBookPage(4);
                                      setBookInput('');
                                    }
                                  }
                                }}
                                autoFocus
                                className="bg-transparent border-none outline-none text-[#5a4a3a] font-serif text-sm py-1 w-full"
                              />
                            )}
                            {bookPage === 4 && (
                              <div className="flex flex-col items-center gap-4 w-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!inventory.some(i => i.id === 'k4')) {
                                      setInventory(prev => [...prev, {
                                        id: 'k4',
                                        name: 'key',
                                        type: 'key',
                                        x: 0,
                                        y: 0,
                                        location: 'house',
                                        color: '#C0C0C0'
                                      }]);
                                    }
                                    setShowShelfModalId(null);
                                  }}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  <img src="/key.png" alt="key" className="w-10 h-10 object-contain" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[300px]">
                    <p className="text-[#5a4a3a] font-serif text-xs md:text-sm text-center italic leading-relaxed">
                      you look up at the towering shelf of books, most of them out of reach (cause ur tiny ehehe)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TEXT BOX & INVENTORY */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[rgba(245,238,230,0.98)] border-t-[3px] border-[#A69076]">
        <div className="max-w-4xl mx-auto flex gap-4">
          {/* Text Area */}
          <div className="flex-1">
            <p className="text-lg font-medium font-mono text-[#5a4a3a] min-h-[28px]">
              {fullText.slice(0, textIndex)}
              <span className="inline-block w-2 h-5 ml-1 bg-[#6B5B4F] animate-[blink_0.8s_infinite] align-text-bottom" />
            </p>
          </div>

          {/* Inventory Area */}
          <div className="w-64 border-l border-[#A69076] pl-4">
            <h3 className="text-xs uppercase text-[#8B7355] font-bold mb-2 tracking-wider">inventory</h3>
            <div className="grid grid-cols-6 gap-2">
              {(() => {
                const grouped = inventory.reduce((acc, item) => {
                  const key = item.type;
                  if (!acc[key]) acc[key] = { ...item, count: 0 };
                  acc[key].count++;
                  return acc;
                }, {} as Record<string, Item & { count: number }>);

                return Object.values(grouped).map((item, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 border border-[#A69076] bg-[#F5EEE6] rounded flex items-center justify-center relative group cursor-pointer"
                    onContextMenu={(e) => handleItemDrop(e, item.type)}
                    onClick={() => {
                      if (item.type === 'letter') {
                        setShowLetterPopup(true);
                      }
                    }}
                  >
                    {activeSparkles[item.type] && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        <Sparkles
                          color={['#705f00ff', '#250505ff']}
                          count={10}
                          minSize={6}
                          maxSize={12}
                          overflowPx={5}
                          fadeOutSpeed={20}
                          flicker={false}
                        />
                      </div>
                    )}
                    {item.type === 'key' ? (
                      <img src="/key.png" alt={item.name} className="w-4 h-4 object-contain" />
                    ) : item.type === 'gold-key' ? (
                      <img src="/gold_key.png" alt={item.name} className="w-4 h-4 object-contain" />
                    ) : item.type === 'rusty-gold-key' ? (
                      <img src="/rusty_golden_key.png" alt={item.name} className="w-4 h-4 object-contain" />
                    ) : item.type === 'cutter' ? (
                      <img src="/cutter.png" alt={item.name} className="w-5 h-5 object-contain" />
                    ) : item.type === 'cookie' ? (
                      <img src="/cookie.png" alt={item.name} className="w-6 h-6 object-contain" />
                    ) : item.type === 'bcookie' ? (
                      <img src="/bcookie.png" alt={item.name} className="w-6 h-6 object-contain" />
                    ) : item.type === 'letter' ? (
                      <img src="/paper.png" alt={item.name} className="w-6 h-6 object-contain" />
                    ) : item.type === 'tile' ? (
                      <img src="/hallway_tile.png" alt={item.name} className="w-6 h-6 object-cover rounded-[2px]" />
                    ) : (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                        }}
                      />
                    )}
                    {item.count > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-[#8B7355] text-white text-[8px] px-1 rounded-full font-bold">
                        x{item.count}
                      </div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-[#5a4a3a] text-[#F5EEE6] text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="font-bold">{item.name} {item.count > 1 ? `(x${item.count})` : ''}</div>
                      {item.type !== 'key' && item.type !== 'gold-key' && item.type !== 'letter' && item.type !== 'tile' && (
                        <div className="text-[8px] opacity-70">Right-click to drop</div>
                      )}
                    </div>
                  </div>
                ));
              })()}
              {[...Array(Math.max(0, 6 - Object.keys(inventory.reduce((acc, i) => { acc[i.type] = true; return acc; }, {} as any)).length))].map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8 border border-[#A69076]/30 bg-[#F5EEE6]/50 rounded flex items-center justify-center" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      `}</style>
    </motion.div >
  );
}

export default Stage3Page;
