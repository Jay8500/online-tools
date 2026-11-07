/** Pieces (own drawings, viewBox 0 0 100 100) and the coach's lines for the chess tool. */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type CoachLang = 'te' | 'en';

const BASE = 'M22 88H78a4 4 0 0 0 4-4V80a6 6 0 0 0-6-6H24a6 6 0 0 0-6 6v4a4 4 0 0 0 4 4z';
const COLLAR = (y: number) => `M30 ${y}H70a3.5 3.5 0 0 1 0 7H30a3.5 3.5 0 0 1 0-7z`;
const FLARE = (y: number) => `M35 ${y}C35 ${y + 3} 31 72 27 74H73C69 72 65 ${y + 3} 65 ${y}z`;
const BALL = (x: number, y: number, r: number) => `M${x} ${y - r}a${r} ${r} 0 1 1 0 ${2 * r}a${r} ${r} 0 1 1 0-${2 * r}z`;

/** `d` = filled body, `det` = detail lines drawn on top. */
export const PIECE_SVG: Record<PieceType, { d: string; det: string }> = {
  p: { d: `${BASE}${BALL(50, 28, 12)}${COLLAR(42)}M41 49C41 59 34 66 30 74H70C66 66 59 59 59 49z`, det: '' },
  r: { d: `${BASE}M27 14H36V21H42V14H58V21H64V14H73V31Q73 36 68 36H32Q27 36 27 31ZM33 36H67L64 63H36Z${COLLAR(63)}`, det: 'M33 30H67' },
  b: { d: `${BASE}${BALL(50, 14, 6)}M50 21C63 30 67 41 65 50C63 57 57 60 50 60C43 60 37 57 35 50C33 41 37 30 50 21Z${COLLAR(59)}${FLARE(66)}`, det: 'M56 31L46 43' },
  n: { d: `${BASE}M30 74C29 63 36 57 43 50C36 53 29 55 23 53C17 51 15 45 19 40L34 26C36 20 40 16 45 14L47 5L54 13C69 17 77 32 77 48C77 60 73 68 71 74Z`, det: 'M57 19C65 27 69 39 67 57M44 27a1 1 0 1 0 .1 0' },
  q: {
    d: `${BASE}M18 28L30 62H70L82 28L68 46L66 24L58 44L50 18L42 44L34 24L32 46Z${BALL(18, 26, 5)}${BALL(34, 22, 5)}${BALL(50, 14, 5)}${BALL(66, 22, 5)}${BALL(82, 26, 5)}${COLLAR(61)}${FLARE(68)}`,
    det: '',
  },
  k: { d: `${BASE}M46 5h8v6h6v7h-6v8h-8v-8h-6v-7h6zM50 27C30 27 21 40 26 52L32 62H68L74 52C79 40 70 27 50 27Z${COLLAR(61)}${FLARE(68)}`, det: 'M30 48C43 44 57 44 70 48' },
};

export const PIECE_VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const PIECE_NAME: Record<CoachLang, Record<PieceType, string>> = {
  te: { p: 'బంటు (Pawn)', n: 'గుర్రం (Knight)', b: 'బిషప్ (Bishop)', r: 'రూక్ (Rook)', q: 'మంత్రి (Queen)', k: 'రాజు (King)' },
  en: { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' },
};

/** How each piece moves — shown when the player picks it up. */
export const PIECE_TIP: Record<CoachLang, Record<PieceType, string>> = {
  te: {
    p: 'ముందుకు ఒక గడి. మొదటిసారి రెండు గడులు వెళ్లొచ్చు. కొట్టేది మాత్రం అడ్డంగా (diagonal). చివరి వరుసకు చేరితే మంత్రి అవుతుంది!',
    n: '"L" ఆకారంలో కదులుతుంది: రెండు గడులు ఒక వైపు, ఒక గడి పక్కకు. వేరే పావుల మీదుగా దూకగలిగేది ఇదొక్కటే.',
    b: 'అడ్డంగా (diagonal) ఎంత దూరమైనా వెళ్తుంది. ఎప్పుడూ తన రంగు గడుల్లోనే ఉంటుంది.',
    r: 'నేరుగా — ముందుకు, వెనక్కి, పక్కలకు ఎంత దూరమైనా. ఆట చివర్లో చాలా బలమైనది.',
    q: 'రూక్ + బిషప్ కలిపి: నేరుగా, అడ్డంగా ఎంత దూరమైనా. బోర్డులో అత్యంత బలమైన పావు — జాగ్రత్తగా కాపాడండి.',
    k: 'ఏ వైపైనా ఒక గడి. రాజును కాపాడటమే ఆట! చెక్‌లో ఉంటే ముందు దాన్ని తప్పించాలి.',
  },
  en: {
    p: 'Moves one square forward — two on its first move. It captures only diagonally. Reach the last row and it becomes a Queen!',
    n: 'Moves in an "L": two squares one way, then one to the side. The only piece that can jump over others.',
    b: 'Moves diagonally, as far as it likes. It always stays on squares of its own colour.',
    r: 'Moves straight — forward, back or sideways, as far as it likes. Very strong in the endgame.',
    q: 'Rook + Bishop together: straight or diagonal, any distance. The strongest piece, so keep it safe.',
    k: 'Moves one square in any direction. Protecting the King is the whole game! If it is in check, fix that first.',
  },
};

/** Everything else the coach says. `{p}` = a piece name, `{sq}` = a square, `{n}` = points. */
export const COACH: Record<CoachLang, Record<string, string>> = {
  te: {
    start: 'చెస్ నేర్చుకుందాం! మీ పావును తాకితే అది ఎలా కదులుతుందో ఇక్కడ చెప్తాను. వెళ్లగలిగే గడులు చుక్కలతో కనిపిస్తాయి.',
    yourTurn: 'మీ వంతు',
    thinking: 'కంప్యూటర్ ఆలోచిస్తోంది…',
    youTook: 'బాగుంది! మీరు {p}ను కొట్టారు (+{n}).',
    theyTook: 'జాగ్రత్త — కంప్యూటర్ మీ {p}ను కొట్టింది. ఆ పావును ఎవరూ కాపాడటం లేదేమో చూడండి.',
    castle: 'క్యాస్లింగ్! రాజు సురక్షితంగా పక్కకు, రూక్ బయటికి — మొదట్లో ఇది మంచి అలవాటు.',
    promote: 'బంటు చివరికి చేరి మంత్రి అయ్యింది! 👑',
    youCheck: 'చెక్ పెట్టారు! ♚',
    inCheck: 'మీ రాజు చెక్‌లో ఉంది — ముందు దాన్ని కాపాడండి.',
    hint: 'సూచన 💡 మీ {p}ను {sq}కు పంపండి.',
    hintTake: 'సూచన 💡 మీ {p}తో {sq}లో ఉన్న పావును కొట్టొచ్చు.',
    undo: 'వెనక్కి వెళ్లాం. ఈసారి ఇంకో మంచి ఎత్తు ఆలోచించండి.',
    win: 'మీరు గెలిచారు! 🎉',
    winSub: 'సూపర్! తర్వాతి లెవెల్ ప్రయత్నించండి.',
    lose: 'చెక్‌మేట్',
    loseSub: 'కంప్యూటర్ గెలిచింది. Undo చేసి మళ్లీ ప్రయత్నించండి.',
    draw: 'డ్రా',
    drawSub: 'ఎవరూ గెలవలేదు.',
    stalemate: 'స్టేల్‌మేట్ — కదలడానికి గడులు లేవు, కానీ చెక్ కూడా లేదు. అందుకే డ్రా.',
    resumed: 'మీ పాత ఆట కొనసాగుతోంది. కొత్తది కావాలంటే New నొక్కండి.',
  },
  en: {
    start: "Let's learn chess! Tap one of your pieces and I'll tell you how it moves. The squares it can go to show as dots.",
    yourTurn: 'Your turn',
    thinking: 'Computer is thinking…',
    youTook: 'Nice! You took a {p} (+{n}).',
    theyTook: 'Careful — the computer took your {p}. Check whether that piece was protected.',
    castle: 'Castling! The King tucks away safely and the Rook comes out — a good habit early on.',
    promote: 'Your pawn reached the end and became a Queen! 👑',
    youCheck: 'Check! ♚',
    inCheck: 'Your King is in check — protect it first.',
    hint: 'Hint 💡 Move your {p} to {sq}.',
    hintTake: 'Hint 💡 Your {p} can take the piece on {sq}.',
    undo: 'Took the move back. Try a better idea this time.',
    win: 'You won! 🎉',
    winSub: 'Great game! Try the next level.',
    lose: 'Checkmate',
    loseSub: 'The computer won. Tap Undo and try again.',
    draw: 'Draw',
    drawSub: 'Nobody won.',
    stalemate: 'Stalemate — no legal move, but no check either. So it is a draw.',
    resumed: 'Your last game is back. Tap New for a fresh one.',
  },
};
