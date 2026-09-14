/**
 * Snapbox Studio — Korean Photobooth Application
 * Redesigned for chic Korean Studio Kiosk aesthetic:
 * 2-column balanced layout, floating camera dock, film roll track,
 * 3D strip preview, modal picker overlays, 300 DPI Export & MediaPipe AI.
 */

// ==================== APPLICATION STATE ====================
const state = {
  layout: '4', // '1', '2', '3', '4', '4-grid', '6', '8', '9'
  filter: 'none',
  frame: 'photoism-navy',
  customFrameUrl: null,
  background: 'none',
  customBgUrl: null,
  customBgImg: null,
  aiSegmentation: true,
  soundEnabled: true,
  countdownTime: 5,
  mirror: true,
  beautySmooth: true,
  zoom: 1.0,
  caption: '✦ SNAPBOX MEMORIES ✦',
  showDate: true,
  showLogo: true,
  stickers: [], // { id, emoji, x, y }

  // Photo Pool & Slot System
  photoPool: [], // array of { id, src, timestamp }
  slotAssignments: [], // array of photo IDs assigned to each slot [id0, id1, ...]
  activeSlotIndex: 0, // slot currently selected to receive a photo

  stream: null,
  busy: false,
  isAiReady: false
};

// ==================== PRESET DATA ====================
const layoutsConfig = [
  { id: '1', label: '1 ẢNH', sub: 'Polaroid', count: 1, cols: 1 },
  { id: '2', label: '2 ẢNH', sub: 'Dọc đôi', count: 2, cols: 1 },
  { id: '3', label: '3 ẢNH', sub: 'Dải ba', count: 3, cols: 1 },
  { id: '4', label: '4 ẢNH', sub: 'Dải 2x6"', count: 4, cols: 1 },
  { id: '4-grid', label: '4 Ô', sub: 'Lưới vuông', count: 4, cols: 2 },
  { id: '6', label: '6 ẢNH', sub: 'Lưới 2x3', count: 6, cols: 2 },
  { id: '8', label: '8 ẢNH', sub: 'Dải kép 2x4', count: 8, cols: 2 },
  { id: '9', label: '9 ẢNH', sub: 'Grid 3x3', count: 9, cols: 3 }
];

const framesConfig = [
  { id: 'ai-trung-thu', label: 'AI Trung Thu 🌕', category: 'vietnam', color: '#112A50', textLight: true, hasGraphics: true, artwork: 'assets/frames/trung-thu.png' },
  { id: 'ai-graduation', label: 'AI Tốt Nghiệp 🎓', category: 'event', color: '#063A7A', textLight: true, hasGraphics: true, artwork: 'assets/frames/graduation.png' },
  { id: 'ai-womens-day', label: 'AI 8 Tháng 3 🌸', category: 'event', color: '#EBA1A9', hasGraphics: true, artwork: 'assets/frames/womens-day.png' },
  { id: 'ai-tet-an-vui', label: 'AI Tết An Vui 🏮', category: 'vietnam', color: '#A71916', textLight: true, hasGraphics: true, artwork: 'assets/frames/tet-an-vui.png' },
  { id: 'ai-hoi-an', label: 'AI Hội An Lantern 🏮', category: 'vietnam', color: '#B66D10', hasGraphics: true, artwork: 'assets/frames/hoi-an-lantern.png' },
  { id: 'ai-scrapbook', label: 'AI Good Times 📒', category: 'pinterest', color: '#4B9DB0', hasGraphics: true, artwork: 'assets/frames/scrapbook-good-times.png' },
  // ORIGINAL AI ARTWORK — optimized for the 4-photo 2x6 strip
  { id: 'ai-birthday-cherry', label: 'AI Birthday Cherry 🍒', category: 'ai-art', color: '#F58BA5', hasGraphics: true, artwork: 'assets/frames/birthday-cherry.png' },
  { id: 'ai-couple-rose', label: 'AI Love Letter 🌹', category: 'ai-art', color: '#661A1D', textLight: true, hasGraphics: true, artwork: 'assets/frames/couple-rose.png' },
  { id: 'ai-wedding-gold', label: 'AI Our Forever ✦', category: 'ai-art', color: '#D3B36A', hasGraphics: true, artwork: 'assets/frames/wedding-gold.png' },
  { id: 'ai-kpop-neon', label: 'AI Main Character ✨', category: 'ai-art', color: '#AF3BEE', textLight: true, hasGraphics: true, artwork: 'assets/frames/kpop-neon.png' },
  // 0. PINTEREST TRENDING GRAPHIC FRAMES 🌟 (Nơ Coquette, Scrapbook Washi, Vé máy bay, Chibi Bear, Phim cổ)
  { id: 'pin-coquette-bow', label: 'Coquette Ribbon 🎀', category: 'pinterest', color: '#FFF0F5', hasGraphics: true },
  { id: 'pin-scrapbook-washi', label: 'Washi Scrapbook 📑', category: 'pinterest', color: '#FDFBF7', hasGraphics: true },
  { id: 'pin-korean-butter-bear', label: 'Chibi Butter Bear 🧸', category: 'pinterest', color: '#FFFBEB', hasGraphics: true },
  { id: 'pin-flight-boarding-pass', label: 'Boarding Pass ✈️', category: 'pinterest', color: '#F8FAFC', hasGraphics: true },
  { id: 'pin-vintage-cinema', label: 'Cinema Ticket 🎟️', category: 'pinterest', color: '#FEF3C7', hasGraphics: true },
  { id: 'pin-y2k-cyberstar', label: 'Y2K Cyber Star 💿', category: 'pinterest', color: '#0F172A', textLight: true, hasGraphics: true },
  { id: 'pin-tet-vietnam', label: 'Tết Giáp Thìn 🏮', category: 'pinterest', color: '#7F1D1D', textLight: true, hasGraphics: true },
  { id: 'pin-saigon-retro', label: 'Sài Gòn Vintage 📸', category: 'pinterest', color: '#D97706', textLight: true, hasGraphics: true },
  { id: 'pin-hanoi-vintage', label: 'Hà Nội Phố Cổ ☕', category: 'pinterest', color: '#451A03', textLight: true, hasGraphics: true },
  { id: 'pin-birthday-party', label: 'Birthday Celebration 🎂', category: 'pinterest', color: '#FF70A6', textLight: true, hasGraphics: true },
  { id: 'pin-love-polaroid', label: 'Love Letter & Kiss 💋', category: 'pinterest', color: '#FFF1F2', hasGraphics: true },
  { id: 'pin-black-film-35mm', label: '35mm Film Roll 🎞️', category: 'pinterest', color: '#111827', textLight: true, hasGraphics: true },

  // 1. VIỆT NAM ƠI 🇻🇳 (Bản sắc văn hóa, Trống Đồng, Cờ đỏ sao vàng, Phố cổ, Sen hồng)
  { id: 'vn-co-do-sao-vang', label: 'Cờ Đỏ Sao Vàng', category: 'vietnam', color: '#DA251D', textLight: true },
  { id: 'vn-dong-son', label: 'Trống Đồng Cổ', category: 'vietnam', color: '#5A3D28', textLight: true },
  { id: 'vn-hanoi-autumn', label: 'Hà Nội Mùa Thu', category: 'vietnam', color: '#E5A93C' },
  { id: 'vn-saigon-retro', label: 'Sài Gòn 1980s', category: 'vietnam', color: '#DDA834' },
  { id: 'vn-lotus-pink', label: 'Sen Hồng Đồng Tháp', category: 'vietnam', color: '#FF8DA1', textLight: true },
  { id: 'vn-hoi-an-lantern', label: 'Hội An Đèn Lồng', category: 'vietnam', color: '#D97706', textLight: true },
  { id: 'vn-bat-trang-blue', label: 'Gốm Sứ Men Lam', category: 'vietnam', color: '#F8FAFC' },
  { id: 'vn-tho-cam-tay-bac', label: 'Thổ Cẩm Sapa', category: 'vietnam', color: '#991B1B', textLight: true },
  { id: 'vn-ca-phe-sua', label: 'Cà Phê Sữa Đá', category: 'vietnam', color: '#3E2723', textLight: true },
  { id: 'vn-ao-dai-lua', label: 'Lụa Tơ Hà Đông', category: 'vietnam', color: '#0D9488', textLight: true },

  // 0.1 VÒNG QUANH THẾ GIỚI 🌍 (Tokyo, Seoul, Paris, New York, London, v.v.)
  { id: 'world-japan-sakura', label: 'Tokyo Sakura 🇯🇵', category: 'world', color: '#FFF1F2' },
  { id: 'world-korea-hanbok', label: 'Seoul Hanbok 🇰🇷', category: 'world', color: '#FAFAF9' },
  { id: 'world-paris-chic', label: 'Parisian Chic 🇫🇷', category: 'world', color: '#FAF8F5' },
  { id: 'world-ny-metro', label: 'New York Taxi 🇺🇸', category: 'world', color: '#09090B', textLight: true },
  { id: 'world-london-tartan', label: 'Royal Tartan 🇬🇧', category: 'world', color: '#991B1B', textLight: true },
  { id: 'world-santorini', label: 'Santorini Blue 🇬🇷', category: 'world', color: '#0284C7', textLight: true },
  { id: 'world-bangkok-gold', label: 'Bangkok Gold 🇹🇭', category: 'world', color: '#B45309', textLight: true },
  { id: 'world-rio-carnival', label: 'Rio Carnival 🇧🇷', category: 'world', color: '#15803D', textLight: true },
  { id: 'world-amalfi-lemon', label: 'Amalfi Lemon 🇮🇹', category: 'world', color: '#FEF08A' },
  { id: 'world-swiss-alps', label: 'Swiss Alps 🇨🇭', category: 'world', color: '#DC2626', textLight: true },

  // 1. K-STUDIO (Phong cách chuỗi studio Hàn Quốc: Photoism, Haru Film, Monomansion, Life4Cuts)
  { id: 'photoism-navy', label: 'Photoism Navy', category: 'k-studio', color: '#1B2430', textLight: true },
  { id: 'haru-sky', label: 'Haru Sky Blue', category: 'k-studio', color: '#B3DCF5' },
  { id: 'monomansion-oat', label: 'Monomansion Oat', category: 'k-studio', color: '#F1E9DE' },
  { id: 'butter-yellow', label: 'Butter Cream', category: 'k-studio', color: '#FFF3B0' },
  { id: 'sage-green', label: 'Sage Green', category: 'k-studio', color: '#C8D6AF' },
  { id: 'espresso', label: 'Espresso Warm', category: 'k-studio', color: '#4A3B32', textLight: true },
  { id: 'studio-white', label: 'Clean Studio', category: 'k-studio', color: '#FFFFFF' },
  { id: 'charcoal-noir', label: 'Charcoal Noir', category: 'k-studio', color: '#1F2022', textLight: true },
  { id: 'dusty-rose', label: 'Dusty Rose', category: 'k-studio', color: '#E8B4B8' },
  { id: 'lavender-haze', label: 'Lavender Haze', category: 'k-studio', color: '#D6C7E2' },
  { id: 'matcha-milk', label: 'Matcha Milk', category: 'k-studio', color: '#D8E2DC' },

  // 2. Y2K & CYBER AESTHETIC (Năm 2000, Kim loại, Phản quang, Neon)
  { id: 'y2k-chrome', label: 'Silver Chrome', category: 'y2k', color: '#CBD5E1' },
  { id: 'glitter-pink', label: 'Glitter Pink', category: 'y2k', color: '#FF70A6' },
  { id: 'bubblegum-y2k', label: 'Bubblegum Pop', category: 'y2k', color: '#FF99C8' },
  { id: 'cyber-matrix', label: 'Cyber Matrix', category: 'y2k', color: '#0D1117', textLight: true },
  { id: 'cyber-punk', label: 'Cyber Neon', category: 'y2k', color: '#180B2B', textLight: true },
  { id: 'cd-holo', label: 'CD Hologram', category: 'y2k', color: '#A5F3FC' },
  { id: 'angel-wings', label: 'Angel Baby', category: 'y2k', color: '#CFE0F2' },
  { id: 'tribal-metal', label: 'Tribal Metal', category: 'y2k', color: '#2D3748', textLight: true },

  // 3. FILM & RETRO (Kodak, Fuji, Dải film 35mm, Polaroid, CineStill)
  { id: 'kodak-gold', label: 'Kodak Gold 200', category: 'film', color: '#F6B924' },
  { id: 'fuji-superia', label: 'Fuji Superia', category: 'film', color: '#106B4A', textLight: true },
  { id: 'sprocket-35mm', label: '35mm Film Reel', category: 'film', color: '#18181B', textLight: true },
  { id: 'cinestill-800', label: 'CineStill 800T', category: 'film', color: '#224859', textLight: true },
  { id: 'polaroid-vintage', label: '1970s Polaroid', category: 'film', color: '#EFE7DA' },
  { id: 'polaroid-rainbow', label: 'Polaroid OneStep', category: 'film', color: '#FDFBF7' },
  { id: 'denim-wash', label: 'Washed Denim', category: 'film', color: '#3A6073', textLight: true },
  { id: 'classic-bw-film', label: 'Agfa B&W Film', category: 'film', color: '#27272A', textLight: true },
  { id: 'retro-arcade', label: 'Arcade 1984', category: 'film', color: '#1E1233', textLight: true },

  // 4. CUTE & KAWAII (Anime, Pastel, Hoa quả, Gingham)
  { id: 'strawberry-milk', label: 'Strawberry Gingham', category: 'cute', color: '#FFB5C5' },
  { id: 'daisy-flower', label: 'Daisy Garden', category: 'cute', color: '#D4ECC5' },
  { id: 'sweet-heart', label: 'Sweet Heart', category: 'cute', color: '#FF6B8B' },
  { id: 'cloud-dream', label: 'Pastel Cloud', category: 'cute', color: '#BAE6FD' },
  { id: 'cherry-blossom', label: 'Cherry Blossom', category: 'cute', color: '#FCE7F3' },
  { id: 'lemon-sherbet', label: 'Lemon Sherbet', category: 'cute', color: '#FEF08A' },
  { id: 'boba-milk-tea', label: 'Boba Milk Tea', category: 'cute', color: '#E8D5C4' },
  { id: 'manga-halftone', label: 'Manga Comic', category: 'cute', color: '#F4F4F5' },
  { id: 'kitty-paw', label: 'Cute Kitty', category: 'cute', color: '#FEE2E2' },

  // 5. EVENT & PARTY (Sinh nhật, Tiệc tùng, Đám cưới, Halloween, Noel)
  { id: 'birthday-party', label: 'Birthday Confetti', category: 'event', color: '#FF6B4A', textLight: true },
  { id: 'golden-wedding', label: 'Royal Wedding', category: 'event', color: '#FCF8ED' },
  { id: 'neon-disco', label: 'Neon Disco 80s', category: 'event', color: '#100720', textLight: true },
  { id: 'love-cupid', label: 'Valentine Cupid', category: 'event', color: '#E11D48', textLight: true },
  { id: 'christmas-plaid', label: 'Merry Christmas', category: 'event', color: '#14532D', textLight: true },
  { id: 'midnight-spooky', label: 'Spooky Halloween', category: 'event', color: '#31144D', textLight: true },
  { id: 'luxury-gold-noir', label: 'Gala Black Gold', category: 'event', color: '#0F0F14', textLight: true },
  { id: 'fireworks-nye', label: 'New Year Fireworks', category: 'event', color: '#1C1938', textLight: true },

  // 6. K-POP IDOL (Photocard, Borahae, Album concepts)
  { id: 'borahae-purple', label: 'Borahae Violet', category: 'kpop', color: '#6D28D9', textLight: true },
  { id: 'prism-holo', label: 'Photocard Prism', category: 'kpop', color: '#E0F2FE' },
  { id: 'blackpink-style', label: 'Pink & Black', category: 'kpop', color: '#18181B', textLight: true },
  { id: 'candy-pop', label: 'Candy Pop Idol', category: 'kpop', color: '#F472B6', textLight: true },
  { id: 'galaxy-nebula', label: 'Galaxy Universe', category: 'kpop', color: '#1E1B4B', textLight: true }
];

const backgroundsConfig = [
  { id: 'none', label: 'Gốc (Phòng thật)', category: 'all' },
  { id: 'pastel-pink', label: 'Hồng Studio', category: 'solid', fill: '#ffccd5' },
  { id: 'pastel-blue', label: 'Xanh Mây', category: 'solid', fill: '#bae6fd' },
  { id: 'pastel-mint', label: 'Bạc Hà', category: 'solid', fill: '#a7f3d0' },
  { id: 'pastel-cream', label: 'Be Studio', category: 'solid', fill: '#fef3c7' },
  { id: 'studio-white', label: 'Trắng Sáng', category: 'solid', fill: '#f8fafc' },
  { id: 'studio-black', label: 'Đen Sang Trọng', category: 'solid', fill: '#0f172a' },
  { id: 'sunset', label: 'Sunset Glow', category: 'gradient', grad: 'linear-gradient(135deg, #fb7185, #f43f5e, #fda4af)' },
  { id: 'neon-dream', label: 'Neon Dream', category: 'gradient', grad: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { id: 'ocean-breeze', label: 'Biển Pastel', category: 'gradient', grad: 'linear-gradient(135deg, #38bdf8, #818cf8)' },
  { id: 'aurora', label: 'Cực Quang', category: 'gradient', grad: 'linear-gradient(135deg, #34d399, #60a5fa, #c084fc)' },
  { id: 'scene-cafe', label: 'Quán Cafe', category: 'scene', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80' },
  { id: 'scene-sky', label: 'Mây Hồng Hoàng Hôn', category: 'scene', url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1000&auto=format&fit=crop&q=80' },
  { id: 'scene-street', label: 'Phố Tokyo Retro', category: 'scene', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80' }
];

const bgImageCache = {};

// ==================== DOM ELEMENTS ====================
const video = document.querySelector('#video');
const liveCanvas = document.querySelector('#liveCanvas');
const liveCtx = liveCanvas.getContext('2d');
const cameraViewport = document.querySelector('#cameraViewport');
const placeholder = document.querySelector('#cameraPlaceholder');
const countdownEl = document.querySelector('#countdown');
const shootBtn = document.querySelector('#shootBtn');
const shootSingleBtn = document.querySelector('#shootSingleBtn');
const shotsPerBatchSelect = document.querySelector('#shotsPerBatchSelect');
const enableCamBtn = document.querySelector('#enableCamBtn');
const stripPreview = document.querySelector('#stripPreview');
const shotStatus = document.querySelector('#shotStatus');
const poolCounter = document.querySelector('#poolCounter');
const photoPoolGrid = document.querySelector('#photoPoolGrid');
const autoFillBtn = document.querySelector('#autoFillBtn');
const slotStatusIndicator = document.querySelector('#slotStatusIndicator');
const slotRequirementAlert = document.querySelector('#slotRequirementAlert');
const slotRequirementText = document.querySelector('#slotRequirementText');
const downloadBtn = document.querySelector('#downloadBtn');
const qrBtn = document.querySelector('#qrBtn');
const printBtn = document.querySelector('#printBtn');
const exportCanvas = document.querySelector('#exportCanvas');
const qrModal = document.querySelector('#qrModal');
const closeQrModal = document.querySelector('#closeQrModal');
const qrcodeBox = document.querySelector('#qrcodeBox');
const soundToggleBtn = document.querySelector('#soundToggleBtn');
const clearAllBtn = document.querySelector('#clearAllBtn');
const aiStatusBadge = document.querySelector('#aiStatusBadge');
const aiSegToggle = document.querySelector('#aiSegToggle');
const captionInput = document.querySelector('#captionInput');
const showDateToggle = document.querySelector('#showDateToggle');
const showLogoToggle = document.querySelector('#showLogoToggle');
const customFrameInput = document.querySelector('#customFrameInput');
const customBgInput = document.querySelector('#customBgInput');
const mirrorToggle = document.querySelector('#mirrorToggle');
const beautySmoothToggle = document.querySelector('#beautySmoothToggle');
const clearStickersBtn = document.querySelector('#clearStickersBtn');

// Modals elements
const filterModal = document.querySelector('#filterModal');
const openFilterModalBtn = document.querySelector('#openFilterModalBtn');
const closeFilterModal = document.querySelector('#closeFilterModal');
const activeFilterLabel = document.querySelector('#activeFilterLabel');

const bgModal = document.querySelector('#bgModal');
const openBgModalBtn = document.querySelector('#openBgModalBtn');
const closeBgModal = document.querySelector('#closeBgModal');
const activeBgLabel = document.querySelector('#activeBgLabel');

// Canvas for AI segmentation
const segCanvas = document.createElement('canvas');
const segCtx = segCanvas.getContext('2d');

function refreshLucideIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// ==================== WEB AUDIO SYNTHESIZER ====================
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep(freq = 800, duration = 0.12) {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playShutterSound() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Shutter open
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Shutter close
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(900, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.13);
    gain2.gain.setValueAtTime(0.4, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.14);
  } catch (e) {}
}

// ==================== MEDIAPIPE SELFIE SEGMENTATION ====================
let selfieSegmentation = null;
let segmentationResults = null;

function initMediaPipe() {
  if (typeof SelfieSegmentation === 'undefined') {
    aiStatusBadge.textContent = 'STANDBY';
    aiStatusBadge.classList.add('off');
    return;
  }
  try {
    selfieSegmentation = new SelfieSegmentation({
      locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });
    selfieSegmentation.setOptions({ modelSelection: 1 });
    selfieSegmentation.onResults(results => {
      segmentationResults = results;
      state.isAiReady = true;
      aiStatusBadge.textContent = 'AI SEGMENTATION ON';
      aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
    });
  } catch (err) {
    console.warn('Could not init MediaPipe:', err);
  }
}

// ==================== RENDER VIDEO & AI BACKGROUND LOOP ====================
function getCssFilterString(filterKey) {
  switch (filterKey) {
    case 'k-beauty': return 'brightness(1.06) contrast(1.03) saturate(1.15)';
    case 'vintage': return 'sepia(0.32) contrast(1.1) brightness(0.95) saturate(0.85)';
    case 'bw': return 'grayscale(1) contrast(1.25) brightness(1.05)';
    case 'warm': return 'sepia(0.2) saturate(1.3) hue-rotate(-8deg) brightness(1.04)';
    case 'cyber': return 'saturate(1.45) hue-rotate(240deg) contrast(1.15)';
    default: return 'none';
  }
}

let lastSegTime = 0;
function startRenderLoop() {
  function render() {
    if (video.readyState >= 2) {
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;

      if (liveCanvas.width !== vw || liveCanvas.height !== vh) {
        liveCanvas.width = vw;
        liveCanvas.height = vh;
        segCanvas.width = vw;
        segCanvas.height = vh;
      }

      const now = performance.now();
      if (state.aiSegmentation && state.background !== 'none' && selfieSegmentation && (now - lastSegTime > 33)) {
        lastSegTime = now;
        selfieSegmentation.send({ image: video }).catch(() => {});
      }

      liveCtx.save();
      liveCtx.clearRect(0, 0, vw, vh);

      if (state.aiSegmentation && state.background !== 'none' && segmentationResults && segmentationResults.segmentationMask) {
        drawBackgroundToContext(liveCtx, vw, vh, state.background);

        segCtx.save();
        segCtx.clearRect(0, 0, vw, vh);
        segCtx.filter = getCssFilterString(state.filter);
        segCtx.drawImage(video, 0, 0, vw, vh);
        segCtx.filter = 'none';

        segCtx.globalCompositeOperation = 'destination-in';
        segCtx.drawImage(segmentationResults.segmentationMask, 0, 0, vw, vh);
        segCtx.restore();

        liveCtx.drawImage(segCanvas, 0, 0, vw, vh);
      } else {
        liveCtx.filter = getCssFilterString(state.filter);
        liveCtx.drawImage(video, 0, 0, vw, vh);
        liveCtx.filter = 'none';
      }

      liveCtx.restore();
    }
    requestAnimationFrame(render);
  }
  render();
}

function drawBackgroundToContext(ctx, w, h, bgId) {
  if (bgId === 'none') return;
  if (bgId === 'custom' && state.customBgImg) {
    ctx.drawImage(state.customBgImg, 0, 0, w, h);
    return;
  }
  const bgConfig = backgroundsConfig.find(b => b.id === bgId);
  if (!bgConfig) {
    ctx.fillStyle = '#ffccd5';
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bgConfig.fill) {
    ctx.fillStyle = bgConfig.fill;
    ctx.fillRect(0, 0, w, h);
  } else if (bgConfig.grad) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    if (bgId === 'sunset') {
      grad.addColorStop(0, '#fb7185'); grad.addColorStop(0.5, '#f43f5e'); grad.addColorStop(1, '#fda4af');
    } else if (bgId === 'neon-dream') {
      grad.addColorStop(0, '#a855f7'); grad.addColorStop(1, '#ec4899');
    } else if (bgId === 'ocean-breeze') {
      grad.addColorStop(0, '#38bdf8'); grad.addColorStop(1, '#818cf8');
    } else if (bgId === 'aurora') {
      grad.addColorStop(0, '#34d399'); grad.addColorStop(0.5, '#60a5fa'); grad.addColorStop(1, '#c084fc');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (bgConfig.url) {
    if (bgImageCache[bgConfig.url]) {
      ctx.drawImage(bgImageCache[bgConfig.url], 0, 0, w, h);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgConfig.url;
      img.onload = () => { bgImageCache[bgConfig.url] = img; };
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// ==================== CAMERA INITIALIZATION ====================
async function startCamera() {
  if (state.stream) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 }
      },
      audio: false
    });
    state.stream = stream;
    video.srcObject = stream;
    await new Promise(resolve => {
      video.onloadedmetadata = () => video.play().then(resolve);
    });
    placeholder.hidden = true;
    shotStatus.textContent = 'Camera đã sẵn sàng! Tạo dáng tự tin rồi bấm Bắt đầu chụp ✦';
    startRenderLoop();
  } catch (err) {
    console.error('Lỗi camera:', err);
    shotStatus.textContent = 'Không thể mở camera — Vui lòng cấp quyền camera trong trình duyệt.';
    placeholder.hidden = false;
  }
}

// ==================== PHOTO POOL & SLOTS MANAGEMENT ====================
function getTargetSlotCount() {
  const layoutCfg = layoutsConfig.find(l => l.id === state.layout) || layoutsConfig[3];
  return layoutCfg.count;
}

function syncSlotAssignments() {
  const targetCount = getTargetSlotCount();
  const newAssignments = new Array(targetCount).fill(null);

  for (let i = 0; i < targetCount; i++) {
    if (state.slotAssignments[i] && state.photoPool.some(p => p.id === state.slotAssignments[i])) {
      newAssignments[i] = state.slotAssignments[i];
    }
  }

  state.slotAssignments = newAssignments;
  autoFillEmptySlots();

  if (state.activeSlotIndex >= targetCount) {
    const firstEmpty = state.slotAssignments.findIndex(id => id === null);
    state.activeSlotIndex = firstEmpty !== -1 ? firstEmpty : 0;
  }

  updateRequirementAlert();
  updateStripPreview();
  renderPhotoPool();
}

function autoFillEmptySlots() {
  const targetCount = getTargetSlotCount();
  const poolPhotos = state.photoPool;
  if (!poolPhotos.length) return;

  const assignedIds = new Set(state.slotAssignments.filter(Boolean));
  let poolIdx = 0;

  for (let slot = 0; slot < targetCount; slot++) {
    if (!state.slotAssignments[slot]) {
      while (poolIdx < poolPhotos.length && assignedIds.has(poolPhotos[poolIdx].id)) {
        poolIdx++;
      }
      if (poolIdx < poolPhotos.length) {
        state.slotAssignments[slot] = poolPhotos[poolIdx].id;
        assignedIds.add(poolPhotos[poolIdx].id);
        poolIdx++;
      } else {
        const fallbackIdx = slot % poolPhotos.length;
        state.slotAssignments[slot] = poolPhotos[fallbackIdx].id;
      }
    }
  }
}

function autoFillAllSlots() {
  const targetCount = getTargetSlotCount();
  if (!state.photoPool.length) {
    shotStatus.textContent = 'Kho ảnh đang trống! Hãy chụp vài tấm trước nhé.';
    return;
  }
  for (let i = 0; i < targetCount; i++) {
    const p = state.photoPool[i % state.photoPool.length];
    state.slotAssignments[i] = p ? p.id : null;
  }
  updateStripPreview();
  renderPhotoPool();
  shotStatus.textContent = '✦ Đã tự động điền ảnh vào tất cả các ô!';
}

function updateRequirementAlert() {
  const targetCount = getTargetSlotCount();
  const poolCount = state.photoPool.length;
  const layoutCfg = layoutsConfig.find(l => l.id === state.layout) || layoutsConfig[3];

  if (poolCount < targetCount) {
    const needed = targetCount - poolCount;
    slotRequirementAlert.hidden = false;
    if (slotRequirementText) {
      slotRequirementText.innerHTML = `Khung <b>${layoutCfg.label}</b> cần <b>${targetCount}</b> ảnh (kho có ${poolCount}). Bấm <b>Chụp thêm ${needed} ảnh</b> nhé!`;
    }
    if ([1, 4, 6, 8, 10].includes(needed)) {
      shotsPerBatchSelect.value = String(needed);
      updateShootButtonLabel();
    }
  } else {
    slotRequirementAlert.hidden = true;
  }
  refreshLucideIcons();
}

function renderPhotoPool() {
  poolCounter.textContent = `${state.photoPool.length} ảnh`;

  if (!state.photoPool.length) {
    photoPoolGrid.innerHTML = `
      <div class="empty-roll-placeholder">
        <i data-lucide="images" class="w-6 h-6 text-stone-300 mb-1"></i>
        <p>Chưa có bức ảnh nào trong kho.</p>
        <small>Bấm nút <b>Bắt đầu chụp</b> ở trên để chụp nhiều tư thế lưu vào đây!</small>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  photoPoolGrid.innerHTML = state.photoPool.map((p, idx) => {
    const usedInSlots = state.slotAssignments
      .map((id, sIdx) => id === p.id ? `Ô ${sIdx + 1}` : null)
      .filter(Boolean);

    const isUsed = usedInSlots.length > 0;

    return `
      <div class="pool-photo-card ${isUsed ? 'selected-in-slot' : ''}" data-photo-id="${p.id}" title="Bấm để đưa vào ô đang chọn">
        <img src="${p.src}" alt="Ảnh ${idx + 1}" />
        <span class="pool-badge">#${idx + 1}</span>
        ${isUsed ? `<span class="pool-used-tag">${usedInSlots.join(', ')}</span>` : ''}
        <button class="pool-delete-btn" data-delete-id="${p.id}" title="Xóa ảnh này khỏi kho">✕</button>
      </div>
    `;
  }).join('');
  refreshLucideIcons();
}

function getFrameGraphicOverlayHtml(frameId) {
  if (frameId === 'pin-coquette-bow') {
    return `
      <div class="decor-ribbon-top">
        <svg viewBox="0 0 100 36" class="decor-svg"><path fill="#FF69B4" d="M50 18 c-8-12 -25-15 -35-5 c-10 10 -4 24 15 15 c8 -4 15 -8 20 -10 c5 2 12 6 20 10 c19 9 25 -5 15 -15 c-10 -10 -27 -7 -35 5 z"/><circle cx="50" cy="18" r="4.5" fill="#FF1493"/><path d="M47 20 c-4 7 -9 14 -17 15 c-1.5 0 -1.5 -1.5 0 -3 c5 -4 10 -10 14 -14 z M53 20 c4 7 9 14 17 15 c1.5 0 1.5 -1.5 0 -3 c-5 -4 -10 -10 -14 -14 z" fill="#FF69B4"/></svg>
      </div>
      <div class="decor-bow-footer">
        <span class="coquette-tag">✦ sweet darling ♡ my pretty girl ✦</span>
      </div>
    `;
  } else if (frameId === 'pin-scrapbook-washi') {
    return `
      <div class="washi-tape washi-top-left"></div>
      <div class="washi-tape washi-bottom-right"></div>
      <div class="decor-postal-stamp">
        <div class="stamp-inner">PARIS 1998<br/>AIR MAIL</div>
      </div>
      <div class="decor-paperclip">📎</div>
    `;
  } else if (frameId === 'pin-korean-butter-bear') {
    return `
      <div class="decor-bear-header">
        <span class="bear-doodle-text">★ happy day with you ♡ ★</span>
      </div>
      <div class="decor-bear-footer">
        <svg viewBox="0 0 80 50" class="decor-svg mx-auto"><circle cx="28" cy="15" r="8" fill="#F59E0B"/><circle cx="52" cy="15" r="8" fill="#F59E0B"/><circle cx="28" cy="15" r="4" fill="#FEF3C7"/><circle cx="52" cy="15" r="4" fill="#FEF3C7"/><ellipse cx="40" cy="28" rx="22" ry="18" fill="#FBBF24"/><circle cx="34" cy="24" r="2.5" fill="#18181B"/><circle cx="46" cy="24" r="2.5" fill="#18181B"/><ellipse cx="40" cy="30" rx="6" ry="4" fill="#FFFBEB"/><circle cx="40" cy="29" r="2" fill="#78350F"/><circle cx="28" cy="31" r="3.5" fill="#FDA4AF"/><circle cx="52" cy="31" r="3.5" fill="#FDA4AF"/></svg>
      </div>
    `;
  } else if (frameId === 'pin-flight-boarding-pass') {
    return `
      <div class="boarding-header">
        <span class="flight-icon">✈️</span>
        <span class="flight-title">BOARDING PASS • SEOUL ➔ VIETNAM</span>
      </div>
      <div class="boarding-footer">
        <div class="barcode-svg">
          <svg viewBox="0 0 160 24" class="w-full h-4"><rect width="4" height="24" fill="#000"/><rect x="7" width="2" height="24" fill="#000"/><rect x="12" width="6" height="24" fill="#000"/><rect x="22" width="3" height="24" fill="#000"/><rect x="28" width="5" height="24" fill="#000"/><rect x="36" width="2" height="24" fill="#000"/><rect x="42" width="7" height="24" fill="#000"/><rect x="52" width="3" height="24" fill="#000"/><rect x="58" width="5" height="24" fill="#000"/><rect x="66" width="2" height="24" fill="#000"/><rect x="72" width="8" height="24" fill="#000"/><rect x="83" width="3" height="24" fill="#000"/><rect x="90" width="6" height="24" fill="#000"/><rect x="100" width="3" height="24" fill="#000"/><rect x="106" width="5" height="24" fill="#000"/><rect x="115" width="2" height="24" fill="#000"/><rect x="120" width="7" height="24" fill="#000"/><rect x="130" width="4" height="24" fill="#000"/><rect x="138" width="6" height="24" fill="#000"/><rect x="148" width="3" height="24" fill="#000"/><rect x="154" width="6" height="24" fill="#000"/></svg>
        </div>
        <div class="boarding-meta">GATE 07 • SEAT 01A • CLASS: BESTIES</div>
      </div>
    `;
  } else if (frameId === 'pin-vintage-cinema') {
    return `
      <div class="cinema-header">
        <span class="cinema-title">★ ADMIT ONE • CINEMA TICKET ★</span>
      </div>
      <div class="ticket-notch notch-left"></div>
      <div class="ticket-notch notch-right"></div>
      <div class="cinema-footer">
        <span class="ticket-number">NO. 198926 • POPCORN MEMORIES</span>
      </div>
    `;
  } else if (frameId === 'pin-y2k-cyberstar') {
    return `
      <div class="cyber-header">
        <span class="cyber-star-icon">✦</span>
        <span class="cyber-title">2000s CYBER ANGEL</span>
        <span class="cyber-star-icon">✦</span>
      </div>
      <div class="cyber-footer">
        <span class="cyber-meta">EST. 2000 • Y2K ARCHIVE</span>
      </div>
    `;
  } else if (frameId === 'pin-tet-vietnam') {
    return `
      <div class="tet-header">
        <span class="tet-icon">🌸</span>
        <span class="tet-title">VẠN SỰ NHƯ Ý • XUÂN GIÁP THÌN</span>
        <span class="tet-icon">🏮</span>
      </div>
      <div class="tet-footer">
        <span class="tet-lucky">🧧 CHÚC MỪNG NĂM MỚI • TẾT VIỆT NAM 🧧</span>
      </div>
    `;
  } else if (frameId === 'pin-saigon-retro') {
    return `
      <div class="saigon-header">
        <div class="saigon-badge">TIỆM CHỤP HÌNH BẾN THÀNH</div>
      </div>
      <div class="saigon-footer">
        <div class="saigon-stamp">BƯU ĐIỆN SÀI GÒN • 1980</div>
      </div>
    `;
  } else if (frameId === 'pin-hanoi-vintage') {
    return `
      <div class="hanoi-header">
        <span class="hanoi-title">✦ KÝ ỨC HÀ NỘI 36 PHỐ PHƯỜNG ✦</span>
      </div>
      <div class="hanoi-footer">
        <span class="hanoi-meta">☕ CÀ PHÊ PHIN • MÙA HOA SỮA</span>
      </div>
    `;
  } else if (frameId === 'pin-birthday-party') {
    return `
      <div class="bday-header">
        <span class="bday-icon">🎂</span>
        <span class="bday-title">★ HAPPY BIRTHDAY ★</span>
        <span class="bday-icon">🎉</span>
      </div>
      <div class="bday-footer">
        <span class="bday-meta">MAKE A WISH ✦ BEST MEMORIES</span>
      </div>
    `;
  } else if (frameId === 'pin-love-polaroid') {
    return `
      <div class="love-header">
        <span class="kiss-mark">💋</span>
        <span class="love-title">My Favorite Person ♡</span>
      </div>
      <div class="love-footer">
        <span class="love-script">forever & always with you</span>
      </div>
    `;
  } else if (frameId === 'pin-black-film-35mm') {
    return `
      <div class="film-35-header">
        <span>KODAK PORTRA 400</span>
        <span>SAFETY FILM</span>
      </div>
      <div class="film-sprockets-left"></div>
      <div class="film-sprockets-right"></div>
      <div class="film-35-footer">
        <span>36 EXP</span>
        <span>▶ 01A • 02A • 03A • 04A</span>
        <span>ISO 400</span>
      </div>
    `;
  }
  return '';
}

function updateStripPreview() {
  const targetCount = getTargetSlotCount();

  // 1. Clear any inline background overrides so all CSS frame classes apply cleanly
  stripPreview.style.removeProperty('background');
  stripPreview.style.removeProperty('background-color');
  stripPreview.style.removeProperty('background-image');
  stripPreview.style.removeProperty('background-size');
  stripPreview.style.removeProperty('background-position');

  // 2. Apply frame and layout classes
  stripPreview.className = `strip frame-${state.frame} layout-${state.layout}`;

  // 3. Find current frame configuration
  const frameCfg = framesConfig.find(f => f.id === state.frame) || framesConfig[0];
  if (frameCfg && frameCfg.textLight) {
    stripPreview.classList.add('frame-text-light');
  }

  // 4. Handle custom PNG frame
  if (state.frame === 'custom' && state.customFrameUrl) {
    stripPreview.style.setProperty('background-image', `url('${state.customFrameUrl}')`, 'important');
    stripPreview.style.setProperty('background-size', 'cover', 'important');
    stripPreview.style.setProperty('background-position', 'center', 'important');
  }
  if (frameCfg && frameCfg.artwork) {
    stripPreview.style.setProperty('background-image', `url('${frameCfg.artwork}')`, 'important');
    stripPreview.style.setProperty('background-size', 'cover', 'important');
    stripPreview.style.setProperty('background-position', 'center', 'important');
    stripPreview.classList.add('ai-artwork-frame');
  }

  // 5. Update live UI indicators (Header & Camera)
  const currentFrameLabel = document.querySelector('#currentFrameLabel');
  const activeFrameDot = document.querySelector('#activeFrameDot');
  const cameraFrameName = document.querySelector('#cameraFrameName');
  const cameraFrameDot = document.querySelector('#cameraFrameDot');

  const frameLabelText = state.frame === 'custom' ? 'Khung riêng PNG' : (frameCfg ? frameCfg.label : 'Photoism Navy');
  const frameDotColor = state.frame === 'custom' ? '#FF416C' : (frameCfg ? (frameCfg.color || '#1B2430') : '#1B2430');

  if (currentFrameLabel) currentFrameLabel.textContent = frameLabelText;
  if (activeFrameDot) activeFrameDot.style.backgroundColor = frameDotColor;
  if (cameraFrameName) cameraFrameName.textContent = frameLabelText;
  if (cameraFrameDot) cameraFrameDot.style.backgroundColor = frameDotColor;

  if (state.activeSlotIndex !== null && state.activeSlotIndex < targetCount) {
    slotStatusIndicator.textContent = `✦ Đang chọn Ô ${state.activeSlotIndex + 1} (Bấm ảnh trong kho)`;
    slotStatusIndicator.style.background = 'var(--studio-pink-soft)';
    slotStatusIndicator.style.color = 'var(--studio-pink)';
  } else {
    slotStatusIndicator.textContent = 'Bấm vào ô để chọn ảnh';
    slotStatusIndicator.style.background = '#F4EEF9';
    slotStatusIndicator.style.color = '#795290';
  }

  const slotsHtml = state.slotAssignments.map((photoId, idx) => {
    const photo = state.photoPool.find(p => p.id === photoId);
    const isActive = idx === state.activeSlotIndex;

    if (photo) {
      return `
        <div class="strip-slot filled-slot ${isActive ? 'active-slot' : ''}" data-slot-index="${idx}">
          <img src="${photo.src}" alt="Slot ${idx + 1}" />
          <span class="slot-index-tag">Ô ${idx + 1}</span>
          <button class="slot-remove-btn" data-remove-slot="${idx}" title="Gỡ ảnh khỏi ô này">✕</button>
        </div>
      `;
    } else {
      return `
        <div class="strip-slot empty-slot ${isActive ? 'active-slot' : ''}" data-slot-index="${idx}">
          <span class="slot-plus">+</span>
          <span>Ô ${idx + 1}</span>
        </div>
      `;
    }
  }).join('');

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const stickersHtml = state.stickers.map(s => `
    <span class="placed-sticker" style="left:${s.x}%; top:${s.y}%; transform: translate(-50%, -50%);">${s.emoji}</span>
  `).join('');

  const graphicsHtml = getFrameGraphicOverlayHtml(state.frame);

  stripPreview.innerHTML = `
    <div class="strip-header">SNAPBOX STUDIO</div>
    <div class="strip-photos">${slotsHtml}</div>
    <div class="strip-footer">
      <div class="strip-caption">${escapeHtml(state.caption)}</div>
      ${state.showDate ? `<div class="strip-meta">${dateStr} • ${timeStr}</div>` : ''}
      ${state.showLogo ? `<div class="strip-meta">✦ LIFE 4 CUTS SEOUL ✦</div>` : ''}
    </div>
    ${graphicsHtml ? `<div class="strip-decor-layer">${graphicsHtml}</div>` : ''}
    <div class="strip-stickers-layer">${stickersHtml}</div>
  `;

  const filledCount = state.slotAssignments.filter(Boolean).length;
  const canExport = filledCount > 0;
  downloadBtn.disabled = !canExport;
  qrBtn.disabled = !canExport;
  printBtn.disabled = !canExport;
  refreshLucideIcons();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== SHOOTING LOGIC ====================
function captureCurrentFrame() {
  const c = document.createElement('canvas');
  const w = liveCanvas.width || 1280;
  const h = liveCanvas.height || 720;
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  if (state.mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(liveCanvas, 0, 0, w, h);

  if (state.beautySmooth) {
    ctx.globalAlpha = 0.12;
    ctx.filter = 'blur(4px)';
    ctx.drawImage(liveCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
  }

  return c.toDataURL('image/jpeg', 0.95);
}

function triggerFlashEffect() {
  cameraViewport.classList.remove('flashing');
  void cameraViewport.offsetWidth;
  cameraViewport.classList.add('flashing');
  setTimeout(() => cameraViewport.classList.remove('flashing'), 350);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function startShootingSequence(numShots = 1) {
  await startCamera();
  if (!state.stream || state.busy) return;

  state.busy = true;
  shootBtn.disabled = true;
  shootSingleBtn.disabled = true;

  for (let i = 0; i < numShots; i++) {
    shotStatus.textContent = numShots === 1 
      ? 'Chuẩn bị chụp thêm 1 tấm… Cười lên nào! ✦'
      : `Đang chụp tấm ${i + 1}/${numShots}… Tạo dáng nhé! ✦`;

    for (let sec = state.countdownTime; sec > 0; sec--) {
      countdownEl.textContent = sec;
      playBeep(sec === 1 ? 1000 : 750, 0.12);
      await sleep(1000);
    }

    countdownEl.textContent = '✦';
    playShutterSound();
    triggerFlashEffect();

    const shotData = captureCurrentFrame();
    const newPhoto = {
      id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      src: shotData,
      timestamp: Date.now()
    };
    
    state.photoPool.push(newPhoto);

    const emptyIndex = state.slotAssignments.findIndex(id => id === null);
    if (emptyIndex !== -1) {
      state.slotAssignments[emptyIndex] = newPhoto.id;
      const nextEmpty = state.slotAssignments.findIndex(id => id === null);
      state.activeSlotIndex = nextEmpty !== -1 ? nextEmpty : 0;
    }

    renderPhotoPool();
    updateStripPreview();
    updateRequirementAlert();

    await sleep(650);
  }

  countdownEl.textContent = '';
  shotStatus.textContent = '🎉 Đã lưu vào kho ảnh! Bạn có thể chọn ảnh vào từng ô hoặc chụp thêm.';
  shootBtn.disabled = false;
  shootSingleBtn.disabled = false;
  state.busy = false;
}

function updateShootButtonLabel() {
  const count = shotsPerBatchSelect.value;
  const isFirstTime = state.photoPool.length === 0;
  const actionText = isFirstTime ? 'BẮT ĐẦU CHỤP' : 'CHỤP THÊM';
  shootBtn.querySelector('strong').textContent = `${actionText} (${count} TẤM)`;
}

function drawCustomFramePattern(ctx, w, h, frameCfg) {
  const id = frameCfg ? frameCfg.id : 'photoism-navy';
  const baseColor = frameCfg ? (frameCfg.color || '#1B2430') : '#1B2430';

  // Base background fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  if (id === 'photoism-navy') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  } else if (id === 'y2k-chrome') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#CBD5E1');
    grad.addColorStop(0.3, '#F8FAFC');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(0.75, '#F1F5F9');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  } else if (id === 'cd-holo' || id === 'prism-holo') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#A5F3FC');
    grad.addColorStop(0.25, '#C4B5FD');
    grad.addColorStop(0.5, '#FBCFE8');
    grad.addColorStop(0.75, '#FEF08A');
    grad.addColorStop(1, '#6EE7B7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (id === 'borahae-purple') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#4C1D95');
    grad.addColorStop(0.5, '#6D28D9');
    grad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (id === 'kodak-gold') {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, h - 26, w, 26);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, 14);
  } else if (id === 'sprocket-35mm') {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFF';
    const holeW = 16, holeH = 26, holeRadius = 4;
    const count = Math.floor(h / 45);
    for (let i = 0; i < count; i++) {
      const y = 20 + i * 45;
      roundRect(ctx, 12, y, holeW, holeH, holeRadius);
      roundRect(ctx, w - 12 - holeW, y, holeW, holeH, holeRadius);
    }
  } else if (id === 'polaroid-rainbow') {
    const colors = ['#EF4444', '#F97316', '#FBBF24', '#10B981', '#06B6D4'];
    const stripeW = w / colors.length;
    colors.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(idx * stripeW, h - 16, stripeW, 16);
    });
  } else if (id === 'strawberry-milk') {
    ctx.fillStyle = '#FFE4E8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 120, 150, 0.18)';
    const size = 30;
    for (let x = 0; x < w; x += size * 2) {
      ctx.fillRect(x, 0, size, h);
    }
    for (let y = 0; y < h; y += size * 2) {
      ctx.fillRect(0, y, w, size);
    }
  } else if (id === 'golden-wedding') {
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(22, 22, w - 44, h - 44);
  } else if (id === 'cyber-punk' || id === 'neon-disco') {
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  } else if (id === 'vn-co-do-sao-vang') {
    ctx.fillStyle = '#DA251D';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    drawStar(ctx, w / 2, 45, 5, 16, 7, '#FFFF00');
    drawStar(ctx, w / 2, h - 45, 5, 14, 6, '#FFFF00');
  } else if (id === 'vn-dong-son') {
    ctx.fillStyle = '#5A3D28';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(212, 163, 89, 0.25)';
    ctx.lineWidth = 3;
    const cx = w / 2, cy = h / 2;
    for (let r = 60; r < Math.max(w, h); r += 45) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, w - 28, h - 28);
  } else if (id === 'vn-saigon-retro') {
    ctx.fillStyle = '#DDA834';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#E0533C';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  } else if (id === 'vn-lotus-pink') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFB6C1');
    grad.addColorStop(0.4, '#FF8DA1');
    grad.addColorStop(1, '#FF6584');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4E878C';
    ctx.fillRect(0, h - 18, w, 18);
  } else if (id === 'vn-hanoi-autumn') {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#F4C430');
    grad.addColorStop(0.5, '#E5A93C');
    grad.addColorStop(1, '#C87D25');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, w - 28, h - 28);
  } else if (id === 'world-ny-metro') {
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  } else if (id === 'world-london-tartan') {
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
    for (let x = 0; x < w; x += 40) ctx.fillRect(x, 0, 20, h);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    for (let y = 0; y < h; y += 40) ctx.fillRect(0, y, w, 20);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  } else if (id === 'world-paris-chic') {
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(30, 58, 138, 0.15)';
    for (let y = 0; y < h; y += 24) ctx.fillRect(0, y, w, 6);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, h - 16, w, 16);
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  } else if (id === 'world-korea-hanbok') {
    ctx.fillStyle = '#FAFAF9';
    ctx.fillRect(0, 0, w, h);
    const hanbokColors = ['#EF4444', '#FBBF24', '#FFFFFF', '#3B82F6', '#18181B'];
    const barW = w / hanbokColors.length;
    hanbokColors.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(idx * barW, h - 20, barW, 20);
    });
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(0, 0, w, 10);
  } else if (id === 'world-santorini') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0284C7');
    grad.addColorStop(0.7, '#0369A1');
    grad.addColorStop(0.7, '#FFFFFF');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  } else if (id === 'pin-coquette-bow') {
    ctx.fillStyle = '#FFF0F5';
    ctx.fillRect(0, 0, w, h);
    // Draw delicate lace border
    ctx.strokeStyle = 'rgba(255, 105, 180, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    // Draw top ribbon bow
    drawRibbonBow(ctx, w / 2, 38, 22, '#FF69B4');
    // Draw bottom ribbon bow
    drawRibbonBow(ctx, w / 2, h - 38, 18, '#FF69B4');
  } else if (id === 'pin-scrapbook-washi') {
    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, w, h);
    // Washi tape 1 (top-left)
    drawWashiTape(ctx, 35, 30, 80, 20, -12, 'rgba(255, 182, 193, 0.7)');
    // Washi tape 2 (bottom-right)
    drawWashiTape(ctx, w - 45, h - 45, 80, 20, 15, 'rgba(176, 224, 230, 0.7)');
    // Postmark stamp
    drawPostmark(ctx, w - 60, 45, 28, '#C2410C');
  } else if (id === 'pin-korean-butter-bear') {
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    // Draw cute chibi bear at footer
    drawChibiBear(ctx, w / 2, h - 42, 26);
    drawStar(ctx, 35, 30, 5, 8, 4, '#F59E0B');
    drawStar(ctx, w - 35, 30, 5, 8, 4, '#F59E0B');
  } else if (id === 'pin-flight-boarding-pass') {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, w, h);
    // Boarding pass header
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(10, 10, w - 20, 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✈ BOARDING PASS • SEOUL ➔ VIETNAM', w / 2, 32);
    // Barcode at bottom
    drawBarcode(ctx, w / 2, h - 40, w - 60, 24);
  } else if (id === 'pin-vintage-cinema') {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    // Draw star decorations
    drawStar(ctx, 30, 32, 5, 10, 5, '#B45309');
    drawStar(ctx, w - 30, 32, 5, 10, 5, '#B45309');
  } else if (id === 'pin-y2k-cyberstar') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    drawStar(ctx, w / 2, 32, 4, 18, 4, '#E0F2FE');
    drawStar(ctx, w / 2, h - 35, 4, 16, 4, '#E0F2FE');
  } else if (id === 'pin-tet-vietnam') {
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    // Draw yellow blossoms
    drawStar(ctx, 30, 32, 5, 12, 6, '#FBBF24');
    drawStar(ctx, w - 30, 32, 5, 12, 6, '#FBBF24');
    drawStar(ctx, 30, h - 32, 5, 12, 6, '#FBBF24');
    drawStar(ctx, w - 30, h - 32, 5, 12, 6, '#FBBF24');
  } else if (id === 'pin-saigon-retro') {
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);
  } else if (id === 'pin-hanoi-vintage') {
    ctx.fillStyle = '#451A03';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, w - 28, h - 28);
  } else if (id === 'pin-birthday-party') {
    ctx.fillStyle = '#FF70A6';
    ctx.fillRect(0, 0, w, h);
    // Draw pastel confetti
    const confettiColors = ['#FEF08A', '#A7F3D0', '#BAE6FD', '#DDD6FE', '#FFFFFF'];
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      const cx = 20 + ((i * 37) % (w - 40));
      const cy = 20 + ((i * 73) % (h - 40));
      ctx.fillRect(cx, cy, 5, 5);
    }
  } else if (id === 'pin-love-polaroid') {
    ctx.fillStyle = '#FFF1F2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    drawKissMark(ctx, w - 45, 35, 16, '#E11D48');
  } else if (id === 'pin-black-film-35mm') {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    const holeW = 14, holeH = 22, holeR = 3;
    const count = Math.floor(h / 38);
    for (let i = 0; i < count; i++) {
      const y = 16 + i * 38;
      roundRect(ctx, 8, y, holeW, holeH, holeR);
      roundRect(ctx, w - 8 - holeW, y, holeW, holeH, holeR);
    }
    // Film numbers
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('▶ 01A', 26, 36);
    ctx.fillText('▶ 02A', 26, h / 2);
    ctx.fillText('▶ 03A', 26, h - 26);
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function drawRibbonBow(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  // Left loop
  ctx.bezierCurveTo(cx - 5, cy, cx - size, cy - size * 0.7, cx - size * 0.9, cy);
  ctx.bezierCurveTo(cx - size * 0.8, cy + size * 0.7, cx - 5, cy, cx - 2, cy);
  // Right loop
  ctx.bezierCurveTo(cx + 5, cy, cx + size, cy - size * 0.7, cx + size * 0.9, cy);
  ctx.bezierCurveTo(cx + size * 0.8, cy + size * 0.7, cx + 5, cy, cx + 2, cy);
  ctx.fill();
  // Center knot
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#E11D48';
  ctx.fill();
  // Ribbons
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 3);
  ctx.quadraticCurveTo(cx - size * 0.5, cy + size * 0.6, cx - size * 0.7, cy + size);
  ctx.moveTo(cx + 3, cy + 3);
  ctx.quadraticCurveTo(cx + size * 0.5, cy + size * 0.6, cx + size * 0.7, cy + size);
  ctx.stroke();
  ctx.restore();
}

function drawWashiTape(ctx, cx, cy, w, h, angleDeg, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  // Jagged serrated edges
  ctx.fillStyle = '#FDFBF7';
  for (let y = -h / 2; y < h / 2; y += 4) {
    ctx.fillRect(-w / 2 - 1, y, 2, 2);
    ctx.fillRect(w / 2 - 1, y, 2, 2);
  }
  ctx.restore();
}

function drawPostmark(ctx, cx, cy, radius, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PARIS', cx, cy - 3);
  ctx.fillText('AIR MAIL', cx, cy + 7);
  ctx.restore();
}

function drawChibiBear(ctx, cx, cy, size) {
  ctx.save();
  // Ears
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(cx - size * 0.55, cy - size * 0.45, size * 0.28, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.55, cy - size * 0.45, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.65, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(cx - size * 0.22, cy - size * 0.05, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.22, cy - size * 0.05, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Snout
  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.15, size * 0.22, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.1, 2, 0, Math.PI * 2);
  ctx.fill();
  // Cheeks
  ctx.fillStyle = '#FDA4AF';
  ctx.beginPath();
  ctx.arc(cx - size * 0.38, cy + size * 0.1, 4, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.38, cy + size * 0.1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBarcode(ctx, cx, cy, width, height) {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  const startX = cx - width / 2;
  const bars = [3, 1, 4, 2, 5, 1, 3, 2, 6, 1, 2, 4, 1, 3, 5, 2, 1, 4, 2, 3, 6, 1, 3, 2, 4];
  let curX = startX;
  bars.forEach((bw, i) => {
    if (i % 2 === 0) {
      ctx.fillRect(curX, cy, bw * 1.5, height);
    }
    curX += bw * 2.2;
  });
  ctx.restore();
}

function drawKissMark(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  // Upper lip
  ctx.moveTo(cx - size, cy);
  ctx.quadraticCurveTo(cx - size * 0.4, cy - size * 0.6, cx, cy - size * 0.2);
  ctx.quadraticCurveTo(cx + size * 0.4, cy - size * 0.6, cx + size, cy);
  ctx.quadraticCurveTo(cx, cy - size * 0.1, cx - size, cy);
  // Lower lip
  ctx.moveTo(cx - size * 0.8, cy + 2);
  ctx.quadraticCurveTo(cx, cy + size * 0.8, cx + size * 0.8, cy + 2);
  ctx.quadraticCurveTo(cx, cy + size * 0.2, cx - size * 0.8, cy + 2);
  ctx.fill();
  ctx.restore();
}

// ==================== HIGH RESOLUTION STRIP EXPORT (300 DPI) ====================
async function generateHighResStrip() {
  const layoutCfg = layoutsConfig.find(l => l.id === state.layout) || layoutsConfig[3];
  const assignedPhotos = state.slotAssignments.map(id => state.photoPool.find(p => p.id === id)).filter(Boolean);
  if (!assignedPhotos.length) return null;

  const cols = layoutCfg.cols;
  const rows = Math.ceil(layoutCfg.count / cols);

  let canvasW = 900;
  let canvasH = 1800;

  if (state.layout === '1') { canvasW = 1000; canvasH = 1250; }
  else if (state.layout === '4-grid') { canvasW = 1200; canvasH = 1400; }
  else if (state.layout === '6') { canvasW = 1200; canvasH = 1600; }
  else if (state.layout === '8') { canvasW = 1200; canvasH = 1800; }
  else if (state.layout === '9') { canvasW = 1350; canvasH = 1550; }

  exportCanvas.width = canvasW;
  exportCanvas.height = canvasH;
  const ctx = exportCanvas.getContext('2d');

  // 1. Frame background
  const frameCfg = framesConfig.find(f => f.id === state.frame) || framesConfig[0];

  if (state.frame === 'custom' && state.customFrameUrl) {
    const customImg = await loadImage(state.customFrameUrl);
    ctx.drawImage(customImg, 0, 0, canvasW, canvasH);
  } else {
    drawCustomFramePattern(ctx, canvasW, canvasH, frameCfg);
  }

  // 2. Header
  ctx.fillStyle = frameCfg && frameCfg.textLight ? '#ffffff' : '#181424';
  ctx.font = 'bold 22px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SNAPBOX STUDIO', canvasW / 2, 45);

  // 3. Grid slots calculation
  const padX = 50;
  const topPad = 65;
  const bottomPad = 130;
  const gap = 20;

  const availW = canvasW - padX * 2 - gap * (cols - 1);
  const cellW = availW / cols;
  const availH = canvasH - topPad - bottomPad - gap * (rows - 1);
  const cellH = availH / rows;

  for (let i = 0; i < layoutCfg.count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (cellW + gap);
    const y = topPad + row * (cellH + gap);

    const photoId = state.slotAssignments[i];
    const photoObj = state.photoPool.find(p => p.id === photoId);

    if (photoObj) {
      const img = await loadImage(photoObj.src);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.restore();
      drawImageProp(ctx, img, x, y, cellW, cellH);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(x, y, cellW, cellH);
    }
  }

  // 4. Footer & Caption
  const footerY = canvasH - bottomPad + 45;
  ctx.fillStyle = frameCfg && frameCfg.textLight ? '#ffffff' : '#181424';
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.caption || '✦ SNAPBOX MEMORIES ✦', canvasW / 2, footerY);

  const now = new Date();
  const dateText = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  ctx.font = '500 16px "DM Mono", monospace';
  ctx.globalAlpha = 0.8;
  if (state.showDate) {
    ctx.fillText(dateText, canvasW / 2, footerY + 30);
  }
  if (state.showLogo) {
    ctx.font = 'bold 14px "DM Mono", monospace';
    ctx.fillText('✦ LIFE 4 CUTS • PHOTOISM ✦', canvasW / 2, footerY + 54);
  }
  ctx.globalAlpha = 1.0;

  // 5. Stickers
  for (const s of state.stickers) {
    const sx = (s.x / 100) * canvasW;
    const sy = (s.y / 100) * canvasH;
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji, sx, sy);
  }

  return exportCanvas.toDataURL('image/png', 1.0);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageProp(ctx, img, x, y, w, h) {
  const imgW = img.width;
  const imgH = img.height;
  const r = Math.min(w / imgW, h / imgH);
  let nw = imgW * r, nh = imgH * r;
  let cx = 1, cy = 1;
  if (nw < w) cx = w / nw;
  if (Math.abs(cx - 1) < 1e-14 && nh < h) cy = h / nh;
  nw *= Math.max(cx, cy);
  nh *= Math.max(cx, cy);

  let ar = 1; if (nw > w) ar = (nw - w) / 2;
  let br = 1; if (nh > h) br = (nh - h) / 2;
  ctx.drawImage(img, ar / (nw / imgW), br / (nh / imgH), imgW - (ar * 2) / (nw / imgW), imgH - (br * 2) / (nh / imgH), x, y, w, h);
}

// ==================== EXPORT & SHARING ACTIONS ====================
async function downloadStrip() {
  const dataUrl = await generateHighResStrip();
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.download = `snapbox-${state.layout}cuts-${Date.now()}.png`;
  a.href = dataUrl;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function openQrModal() {
  const dataUrl = await generateHighResStrip();
  if (!dataUrl) return;
  qrcodeBox.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrcodeBox, {
      text: window.location.href,
      width: 170,
      height: 170,
      colorDark: '#16131F',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrcodeBox.innerHTML = '<p>Đang tải QR code...</p>';
  }
  qrModal.hidden = false;
  refreshLucideIcons();
}

async function printStrip() {
  const dataUrl = await generateHighResStrip();
  if (!dataUrl) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>In ảnh Photobooth</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
          img { max-height: 96vh; max-width: 96vw; object-fit: contain; }
          @media print { body { margin: 0; } img { width: 100%; height: auto; } }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print(); window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ==================== EVENT HANDLERS & SETUP ====================
function setupEventListeners() {
  enableCamBtn.addEventListener('click', startCamera);

  // Tabs switching in Preview Column
  document.querySelectorAll('.customizer-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.customizer-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      let paneId = '#tabContentLayout';
      if (targetTab === 'caption') paneId = '#tabContentCaption';
      if (targetTab === 'export') paneId = '#tabContentExport';
      
      const targetPane = document.querySelector(paneId);
      if (targetPane) targetPane.classList.add('active');
      refreshLucideIcons();
    });
  });

  // Modal: Filter Selector
  openFilterModalBtn.addEventListener('click', () => {
    filterModal.hidden = false;
    refreshLucideIcons();
  });
  closeFilterModal.addEventListener('click', () => {
    filterModal.hidden = true;
  });

  document.querySelector('#filterPicker').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    document.querySelectorAll('#filterPicker .filter-card').forEach(b => b.classList.toggle('active', b === btn));
    cameraViewport.className = `camera-screen filter-${state.filter} ${state.mirror ? 'mirrored' : ''}`;
    
    const filterNames = {
      'none': 'Màu: Tự nhiên',
      'k-beauty': 'Màu: ✨ K-Beauty',
      'vintage': 'Màu: 🎞 Film 90s',
      'bw': 'Màu: 🖤 Noir B&W',
      'warm': 'Màu: 🍑 Warm Peach',
      'cyber': 'Màu: 💜 Cyberpunk'
    };
    if (activeFilterLabel) activeFilterLabel.textContent = filterNames[state.filter] || 'Bộ lọc';
    filterModal.hidden = true;
  });

  // Modal: Background Selector
  openBgModalBtn.addEventListener('click', () => {
    bgModal.hidden = false;
    refreshLucideIcons();
  });
  closeBgModal.addEventListener('click', () => {
    bgModal.hidden = true;
  });

  document.querySelector('#backgroundPicker').addEventListener('click', e => {
    const swatch = e.target.closest('[data-bg]');
    if (!swatch) return;
    state.background = swatch.dataset.bg;
    document.querySelectorAll('#backgroundPicker .bg-swatch').forEach(s => s.classList.toggle('active', s === swatch));
    aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
    
    const bgCfg = backgroundsConfig.find(b => b.id === state.background);
    if (activeBgLabel) {
      activeBgLabel.textContent = bgCfg ? `Nền: ${bgCfg.label.split(' ')[0]}` : 'Phông nền';
    }
    bgModal.hidden = true;
  });

  document.querySelector('.bg-category-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-cat]');
    if (!tab) return;
    document.querySelectorAll('.bg-category-tabs button').forEach(t => t.classList.toggle('active', t === tab));
    renderBackgroundPicker(tab.dataset.cat);
  });

  customBgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.customBgUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        state.customBgImg = img;
        state.background = 'custom';
        renderBackgroundPicker();
        if (activeBgLabel) activeBgLabel.textContent = 'Nền: Tự tải';
        aiStatusBadge.classList.remove('off');
        bgModal.hidden = true;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  aiSegToggle.addEventListener('change', e => {
    state.aiSegmentation = e.target.checked;
    aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
  });

  // Layout selection
  document.querySelector('#layoutPicker').addEventListener('click', e => {
    const btn = e.target.closest('[data-layout]');
    if (!btn || state.busy) return;
    state.layout = btn.dataset.layout;
    renderLayoutPicker();
    syncSlotAssignments();
  });

  // Frame selection & categories
  document.querySelector('.frame-filter-chips').addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    document.querySelectorAll('.frame-filter-chips button').forEach(t => t.classList.toggle('active', t === tab));
    renderFramePicker(tab.dataset.category);
  });

  document.querySelector('#framePicker').addEventListener('click', e => {
    const swatch = e.target.closest('[data-frame]');
    if (!swatch) return;
    state.frame = swatch.dataset.frame;
    document.querySelectorAll('#framePicker .frame-swatch').forEach(s => s.classList.toggle('active', s === swatch));
    
    // Trigger quick tactile visual feedback on preview
    stripPreview.classList.add('frame-changing');
    setTimeout(() => stripPreview.classList.remove('frame-changing'), 180);

    updateStripPreview();
  });

  customFrameInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.customFrameUrl = ev.target.result;
      state.frame = 'custom';
      renderFramePicker();
      updateStripPreview();
    };
    reader.readAsDataURL(file);
  });

  // Timer chips
  document.querySelector('#timerSelector').addEventListener('click', e => {
    const btn = e.target.closest('[data-time]');
    if (!btn) return;
    state.countdownTime = Number(btn.dataset.time);
    document.querySelectorAll('#timerSelector .timer-chip').forEach(b => b.classList.toggle('active', b === btn));
  });

  mirrorToggle.addEventListener('change', e => {
    state.mirror = e.target.checked;
    cameraViewport.classList.toggle('mirrored', state.mirror);
  });

  beautySmoothToggle.addEventListener('change', e => {
    state.beautySmooth = e.target.checked;
  });

  // Shoot batch & buttons
  shotsPerBatchSelect.addEventListener('change', updateShootButtonLabel);
  
  shootBtn.addEventListener('click', () => {
    const count = Number(shotsPerBatchSelect.value) || 4;
    startShootingSequence(count);
  });

  shootSingleBtn.addEventListener('click', () => {
    startShootingSequence(1);
  });

  // Photo Pool Card Clicks
  photoPoolGrid.addEventListener('click', e => {
    const delBtn = e.target.closest('[data-delete-id]');
    if (delBtn) {
      e.stopPropagation();
      const delId = delBtn.dataset.deleteId;
      state.photoPool = state.photoPool.filter(p => p.id !== delId);
      state.slotAssignments = state.slotAssignments.map(id => id === delId ? null : id);
      renderPhotoPool();
      updateStripPreview();
      updateRequirementAlert();
      return;
    }

    const card = e.target.closest('[data-photo-id]');
    if (!card) return;
    const photoId = card.dataset.photoId;

    const targetCount = getTargetSlotCount();
    if (state.activeSlotIndex !== null && state.activeSlotIndex < targetCount) {
      state.slotAssignments[state.activeSlotIndex] = photoId;
      const nextEmpty = state.slotAssignments.findIndex((id, idx) => id === null && idx > state.activeSlotIndex);
      if (nextEmpty !== -1) {
        state.activeSlotIndex = nextEmpty;
      } else {
        const anyEmpty = state.slotAssignments.findIndex(id => id === null);
        state.activeSlotIndex = anyEmpty !== -1 ? anyEmpty : (state.activeSlotIndex + 1) % targetCount;
      }
    } else {
      const firstEmpty = state.slotAssignments.findIndex(id => id === null);
      if (firstEmpty !== -1) {
        state.slotAssignments[firstEmpty] = photoId;
        state.activeSlotIndex = firstEmpty;
      } else {
        state.slotAssignments[0] = photoId;
        state.activeSlotIndex = 0;
      }
    }

    updateStripPreview();
    renderPhotoPool();
  });

  // Slot clicks on strip preview
  stripPreview.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove-slot]');
    if (removeBtn) {
      e.stopPropagation();
      const slotIdx = Number(removeBtn.dataset.removeSlot);
      state.slotAssignments[slotIdx] = null;
      state.activeSlotIndex = slotIdx;
      updateStripPreview();
      renderPhotoPool();
      return;
    }

    const slotEl = e.target.closest('[data-slot-index]');
    if (!slotEl) return;
    state.activeSlotIndex = Number(slotEl.dataset.slotIndex);
    updateStripPreview();
  });

  autoFillBtn.addEventListener('click', autoFillAllSlots);

  // Caption, date, logo
  captionInput.addEventListener('input', e => {
    state.caption = e.target.value;
    updateStripPreview();
  });

  showDateToggle.addEventListener('change', e => {
    state.showDate = e.target.checked;
    updateStripPreview();
  });

  showLogoToggle.addEventListener('change', e => {
    state.showLogo = e.target.checked;
    updateStripPreview();
  });

  // Stickers
  document.querySelector('#stickerPalette').addEventListener('click', e => {
    const btn = e.target.closest('[data-sticker]');
    if (!btn) return;
    state.stickers.push({
      id: Date.now(),
      emoji: btn.dataset.sticker,
      x: Math.floor(20 + Math.random() * 60),
      y: Math.floor(15 + Math.random() * 70)
    });
    updateStripPreview();
  });

  clearStickersBtn.addEventListener('click', () => {
    state.stickers = [];
    updateStripPreview();
  });

  // Sound toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggleBtn.classList.toggle('active', state.soundEnabled);
    soundToggleBtn.innerHTML = state.soundEnabled 
      ? '<i data-lucide="volume-2" class="w-4 h-4"></i><span>Âm thanh</span>'
      : '<i data-lucide="volume-x" class="w-4 h-4"></i><span>Âm thanh: Tắt</span>';
    refreshLucideIcons();
  });

  // Clear all
  clearAllBtn.addEventListener('click', () => {
    if (state.photoPool.length && !confirm('Bạn có chắc muốn xóa toàn bộ ảnh đã chụp để bắt đầu lại từ đầu?')) {
      return;
    }
    state.photoPool = [];
    state.slotAssignments = new Array(getTargetSlotCount()).fill(null);
    state.activeSlotIndex = 0;
    state.stickers = [];
    updateShootButtonLabel();
    renderPhotoPool();
    updateStripPreview();
    updateRequirementAlert();
    shotStatus.textContent = 'Đã xóa toàn bộ ảnh. Hãy tạo dáng và bấm Bắt đầu chụp nhé ✦';
  });

  // Export, QR, Print
  downloadBtn.addEventListener('click', downloadStrip);
  qrBtn.addEventListener('click', openQrModal);
  printBtn.addEventListener('click', printStrip);
  closeQrModal.addEventListener('click', () => { qrModal.hidden = true; });
  document.querySelector('#downloadFromModal').addEventListener('click', downloadStrip);
}

// ==================== RENDERING PICKERS ====================
function renderLayoutPicker() {
  const container = document.querySelector('#layoutPicker');
  container.innerHTML = layoutsConfig.map(l => `
    <button class="layout-option ${l.id === state.layout ? 'active' : ''}" data-layout="${l.id}">
      <strong>${l.label}</strong>
      <small>${l.sub}</small>
    </button>
  `).join('');
}

function renderFramePicker(category = 'all') {
  const container = document.querySelector('#framePicker');
  const filtered = framesConfig.filter(f => category === 'all' || f.category === category);
  
  let html = filtered.map(f => `
    <button class="frame-swatch frame-${f.id} ${f.id === state.frame ? 'active' : ''}" 
      data-frame="${f.id}" 
      data-label="${f.label}" 
      title="${f.label}"
      aria-label="Khung ${f.label}">
    </button>
  `).join('');

  if (state.customFrameUrl) {
    html = `
      <button class="frame-swatch frame-custom ${state.frame === 'custom' ? 'active' : ''}" 
        data-frame="custom" 
        data-label="Khung riêng" 
        title="Khung riêng PNG của bạn"
        style="background-image: url('${state.customFrameUrl}') !important; background-size: cover !important;">
      </button>
    ` + html;
  }

  container.innerHTML = html;
}

function renderBackgroundPicker(category = 'all') {
  const container = document.querySelector('#backgroundPicker');
  const filtered = backgroundsConfig.filter(b => category === 'all' || b.category === category || b.id === 'none');

  let html = filtered.map(b => {
    let style = '';
    if (b.fill) style = `background-color: ${b.fill};`;
    else if (b.grad) style = `background-image: ${b.grad};`;
    else if (b.url) style = `background-image: url('${b.url}'); background-size: cover;`;

    return `
      <button class="bg-swatch ${b.id === state.background ? 'active' : ''}" 
        data-bg="${b.id}" 
        title="${b.label}" 
        style="${style}">
      </button>
    `;
  }).join('');

  if (state.customBgUrl) {
    html = `
      <button class="bg-swatch ${state.background === 'custom' ? 'active' : ''}" 
        data-bg="custom" 
        title="Ảnh nền tự tải" 
        style="background-image: url('${state.customBgUrl}'); background-size: cover;">
      </button>
    ` + html;
  }

  container.innerHTML = html;
}

// ==================== APP INITIALIZATION ====================
function initApp() {
  renderLayoutPicker();
  renderFramePicker();
  renderBackgroundPicker();
  syncSlotAssignments();
  setupEventListeners();
  updateShootButtonLabel();
  initMediaPipe();
  startCamera();
  refreshLucideIcons();
}

window.addEventListener('DOMContentLoaded', initApp);
