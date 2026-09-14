/**
 * Snapbox Studio — Korean Photobooth Application
 * Redesigned for chic Korean Studio Kiosk aesthetic:
 * 2-column balanced layout, floating camera dock, film roll track,
 * 3D strip preview, modal picker overlays, 300 DPI Export & MediaPipe AI.
 */

import { FilesetResolver, ImageSegmenter } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';

// ==================== APPLICATION STATE ====================
const state = {
  layout: '3', // '1', '2', '3', '4', '4-grid', '6', '8', '9'
  filter: 'none',
  frame: 'polaroid-onestep',
  customFrameUrl: null,
  background: 'none',
  customBgUrl: null,
  customBgImg: null,
  aiSegmentation: true,
  soundEnabled: true,
  countdownTime: 5,
  mirror: true,
  facingMode: 'user', // 'user' = camera trước, 'environment' = camera sau
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
// Professional booth print geometry: landscape photo wells are normally 3:2.
// Export canvases below map to 300 DPI paper sizes (2x6, 4x6 and 6x8 inches).
const PHOTO_ASPECT_RATIO = 3 / 2;

const layoutsConfig = [
  { id: '1', label: '1 ẢNH', sub: 'Ảnh 4x6"', count: 1, cols: 1, preview: { width: 300, gap: 8, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1200, height: 1800, padX: 60, topPad: 120, bottomPad: 240, gap: 30 } },
  { id: '2', label: '2 ẢNH', sub: 'Đôi 4x6"', count: 2, cols: 1, preview: { width: 300, gap: 8, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1200, height: 1800, padX: 60, topPad: 90, bottomPad: 240, gap: 30 } },
  { id: '3', label: '3 ẢNH', sub: 'Dải ba 4x6"', count: 3, cols: 1, preview: { width: 300, gap: 8, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1200, height: 1800, padX: 210, topPad: 60, bottomPad: 120, gap: 30 } },
  { id: '4', label: '4 ẢNH', sub: 'Dải 2x6"', count: 4, cols: 1, preview: { width: 300, gap: 8, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 600, height: 1800, padX: 30, topPad: 54, bottomPad: 234, gap: 24 } },
  { id: '4-grid', label: '4 Ô', sub: 'Lưới 4x6"', count: 4, cols: 2, preview: { width: 360, gap: 7, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1200, height: 1800, padX: 45, topPad: 150, bottomPad: 870, gap: 30 } },
  { id: '6', label: '6 ẢNH', sub: 'Lưới 4x6"', count: 6, cols: 2, preview: { width: 360, gap: 6, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1200, height: 1800, padX: 45, topPad: 120, bottomPad: 480, gap: 30 } },
  { id: '8', label: '8 ẢNH', sub: 'Lưới 6x8"', count: 8, cols: 2, preview: { width: 360, gap: 6, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1800, height: 2400, padX: 120, topPad: 80, bottomPad: 188, gap: 36 } },
  { id: '9', label: '9 ẢNH', sub: 'Grid 6x8"', count: 9, cols: 3, preview: { width: 480, gap: 5, slotAspect: PHOTO_ASPECT_RATIO }, export: { width: 1800, height: 2400, padX: 90, topPad: 180, bottomPad: 1060, gap: 30 } }
];

const framesConfig = [
  // White instant camera + 35mm film strip (based on the user's reference)
  {
    id: 'polaroid-onestep-film',
    label: 'OneStep Film Strip',
    category: 'film',
    color: '#151515',
    hasGraphics: true,
    assets: {
      '1': 'assets/frames/polaroid-onestep-film-1.png',
      '2': 'assets/frames/polaroid-onestep-film-2.png',
      '3': 'assets/frames/polaroid-onestep-film.png',
      '4': 'assets/frames/polaroid-onestep-film-4.png'
    },
    textLight: true
  },
  {
    id: 'onestep-burgundy-bloom',
    label: 'OneStep Burgundy Bloom',
    category: 'pinterest',
    color: '#780016',
    hasGraphics: true,
    // Use the responsive frame renderer until every raster overlay has matching
    // 3:2 print wells. This prevents a camera image from being forced into a
    // portrait/square hole or being cropped.
    assets: { '2': 'assets/frames/onestep-burgundy-bloom-2-16x9.png' },
    textLight: true
  },
  // 🎀 Khung Polaroid OneStep (Ảnh bạn vừa tải lên)
  {
    id: 'polaroid-onestep',
    label: 'Polaroid OneStep 🎀',
    category: 'pinterest',
    color: '#3C070F',
    hasGraphics: true,
    textLight: true
  },
  { id: 'ai-trung-thu', label: 'AI Trung Thu 🌕', category: 'vietnam', color: '#112A50', textLight: true, hasGraphics: true, artwork: 'assets/frames/trung-thu.png', layouts: ['4'] },
  { id: 'ai-graduation', label: 'AI Tốt Nghiệp 🎓', category: 'event', color: '#063A7A', textLight: true, hasGraphics: true, artwork: 'assets/frames/graduation.png', layouts: ['4'] },
  { id: 'ai-womens-day', label: 'AI 8 Tháng 3 🌸', category: 'event', color: '#EBA1A9', hasGraphics: true, artwork: 'assets/frames/womens-day.png', layouts: ['4'] },
  { id: 'ai-tet-an-vui', label: 'AI Tết An Vui 🏮', category: 'vietnam', color: '#A71916', textLight: true, hasGraphics: true, artwork: 'assets/frames/tet-an-vui.png', layouts: ['4'] },
  { id: 'ai-hoi-an', label: 'AI Hội An Lantern 🏮', category: 'vietnam', color: '#B66D10', hasGraphics: true, artwork: 'assets/frames/hoi-an-lantern.png', layouts: ['4'] },
  { id: 'ai-scrapbook', label: 'AI Good Times 📒', category: 'pinterest', color: '#4B9DB0', hasGraphics: true, artwork: 'assets/frames/scrapbook-good-times.png', layouts: ['4'] },
  // ORIGINAL AI ARTWORK — optimized for the 4-photo 2x6 strip
  { id: 'ai-birthday-cherry', label: 'AI Birthday Cherry 🍒', category: 'ai-art', color: '#F58BA5', hasGraphics: true, artwork: 'assets/frames/birthday-cherry.png', layouts: ['4'] },
  { id: 'ai-couple-rose', label: 'AI Love Letter 🌹', category: 'ai-art', color: '#661A1D', textLight: true, hasGraphics: true, artwork: 'assets/frames/couple-rose.png', layouts: ['4'] },
  { id: 'ai-wedding-gold', label: 'AI Our Forever ✦', category: 'ai-art', color: '#D3B36A', hasGraphics: true, artwork: 'assets/frames/wedding-gold.png', layouts: ['4'] },
  { id: 'ai-kpop-neon', label: 'AI Main Character ✨', category: 'ai-art', color: '#AF3BEE', textLight: true, hasGraphics: true, artwork: 'assets/frames/kpop-neon.png', layouts: ['4'] },
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
  { id: 'galaxy-nebula', label: 'Galaxy Universe', category: 'kpop', color: '#1E1B4B', textLight: true },

  // 7. PINTEREST TRENDING GRAPHIC FRAMES — thêm (chibi, coquette, y2k glitch...)
  { id: 'pin-90s-camcorder', label: '90s Camcorder 📼', category: 'pinterest', color: '#09090B', textLight: true },
  { id: 'pin-bunny-daisy', label: 'Bunny & Daisy 🐰', category: 'pinterest', color: '#ECFDF5' },
  { id: 'pin-cherry-sweet', label: 'Cherry Sweet 🍒', category: 'pinterest', color: '#FFF1F2' },
  { id: 'pin-coquette-pearl', label: 'Coquette Pearl 🦢', category: 'pinterest', color: '#FFF5F7' },
  { id: 'pin-gothic-heart', label: 'Gothic Heart 🖤', category: 'pinterest', color: '#09090B', textLight: true },
  { id: 'pin-korean-comic', label: 'Korean Comic 💬', category: 'pinterest', color: '#FFFFFF' },
  { id: 'pin-matcha-cafe', label: 'Matcha Café 🍵', category: 'pinterest', color: '#D8E2DC' },
  { id: 'pin-mermaid-pearl', label: 'Mermaid Pearl 🧜‍♀️', category: 'pinterest', color: '#CCFBF1' },
  { id: 'pin-y2k-matrix-glitch', label: 'Y2K Matrix Glitch 🟢', category: 'pinterest', color: '#09090B', textLight: true },

  // 8. TREND RADAR 2026 (Internet aesthetic trends)
  { id: 'trend-2016-rewind', label: '2016 Rewind 📻', category: 'trend-2026', color: '#58C8E8', textLight: true },
  { id: 'trend-aliencore', label: 'Aliencore 👽', category: 'trend-2026', color: '#B7F255' },
  { id: 'trend-cafe-camcorder', label: 'Cafe Camcorder ☕', category: 'trend-2026', color: '#A76A45', textLight: true },
  { id: 'trend-chrome-heart', label: 'Chrome Heart 🤍', category: 'trend-2026', color: '#8B95A7' },
  { id: 'trend-cool-blue', label: 'Cool Blue ❄️', category: 'trend-2026', color: '#EFFFFF' },
  { id: 'trend-coquette-lace', label: 'Coquette Lace 🎀', category: 'trend-2026', color: '#FFF0F5' },
  { id: 'trend-dark-academia', label: 'Dark Academia 📚', category: 'trend-2026', color: '#231811', textLight: true },
  { id: 'trend-frutiger-aero', label: 'Frutiger Aero 💧', category: 'trend-2026', color: '#8EF3FF' },
  { id: 'trend-funhaus', label: 'Funhaus 🎪', category: 'trend-2026', color: '#F8D448' },
  { id: 'trend-glitchy-glam', label: 'Glitchy Glam ⚡', category: 'trend-2026', color: '#170724', textLight: true },
  { id: 'trend-jelly-pop', label: 'Jelly Pop 🍬', category: 'trend-2026', color: '#FF86B4', textLight: true },
  { id: 'trend-mystic-tarot', label: 'Mystic Tarot 🔮', category: 'trend-2026', color: '#6F4BB4', textLight: true },
  { id: 'trend-neodeco', label: 'Neo Deco 🏛️', category: 'trend-2026', color: '#111C25', textLight: true },
  { id: 'trend-opera-night', label: 'Opera Night 🎭', category: 'trend-2026', color: '#CFA755', textLight: true },
  { id: 'trend-poetcore', label: 'Poetcore 🖋️', category: 'trend-2026', color: '#F5F0E7' },
  { id: 'trend-racing-core', label: 'Racing Core 🏁', category: 'trend-2026', color: '#E53636', textLight: true },
  { id: 'trend-shoujo-manga', label: 'Shoujo Manga 🌸', category: 'trend-2026', color: '#FFE0EF' },
  { id: 'trend-wilderkind', label: 'Wilderkind 🌲', category: 'trend-2026', color: '#315D3D', textLight: true },

  // 9. LỄ HỘI VIỆT NAM (Ngày lễ, kỷ niệm)
  { id: 'vn-childrens-day', label: 'Quốc Tế Thiếu Nhi 🎈', category: 'viet-holiday', color: '#55B7E8', textLight: true },
  { id: 'vn-dien-bien', label: 'Điện Biên Phủ', category: 'viet-holiday', color: '#456B34', textLight: true },
  { id: 'vn-family-day', label: 'Ngày Gia Đình VN 👨‍👩‍👧', category: 'viet-holiday', color: '#F59F4F' },
  { id: 'vn-gio-to-hung-vuong', label: 'Giỗ Tổ Hùng Vương', category: 'viet-holiday', color: '#684125', textLight: true },
  { id: 'vn-ho-chi-minh-birthday', label: 'Sinh Nhật Bác Hồ', category: 'viet-holiday', color: '#B7CC8A' },
  { id: 'vn-labor-day', label: 'Quốc Tế Lao Động 🛠️', category: 'viet-holiday', color: '#C81E35', textLight: true },
  { id: 'vn-martyrs-day', label: 'Ngày Thương Binh Liệt Sĩ', category: 'viet-holiday', color: '#43161C', textLight: true },
  { id: 'vn-mid-autumn', label: 'Tết Trung Thu 🌕', category: 'viet-holiday', color: '#172B5E', textLight: true },
  { id: 'vn-reunification-day', label: 'Ngày Thống Nhất 30/4', category: 'viet-holiday', color: '#DA251D', textLight: true },
  { id: 'vn-teachers-day', label: 'Ngày Nhà Giáo VN 🍎', category: 'viet-holiday', color: '#315D77', textLight: true },
  { id: 'vn-tet-nguyen-dan', label: 'Tết Nguyên Đán 🧧', category: 'viet-holiday', color: '#B3132B', textLight: true },
  { id: 'vn-womens-day', label: 'Ngày Phụ Nữ VN 20/10 🌷', category: 'viet-holiday', color: '#FFE5EE' },
  { id: 'vn-xuan-que-huong', label: 'Xuân Quê Hương 🌸', category: 'viet-holiday', color: '#F9CBD7' },
  { id: 'vn-army-day', label: 'Ngày Thành Lập QĐND', category: 'viet-holiday', color: '#456B34', textLight: true },
  { id: 'vn-giong-festival', label: 'Hội Gióng', category: 'viet-holiday', color: '#684125', textLight: true },
  { id: 'vn-national-day', label: 'Quốc Khánh 2/9 🇻🇳', category: 'viet-holiday', color: '#DA251D', textLight: true },
  { id: 'vn-august-revolution', label: 'Cách Mạng Tháng Tám', category: 'viet-holiday', color: '#DA251D', textLight: true },

  // 10. DU LỊCH VIỆT NAM (Các điểm đến nổi bật)
  { id: 'vn-can-tho', label: 'Cần Thơ Miền Tây 🚤', category: 'viet-travel', color: '#8E9F46', textLight: true },
  { id: 'vn-da-lat', label: 'Đà Lạt Ngàn Hoa 🌸', category: 'viet-travel', color: '#A9C3A6', textLight: true },
  { id: 'vn-da-nang', label: 'Đà Nẵng Biển Xanh 🌊', category: 'viet-travel', color: '#63D6ED', textLight: true },
  { id: 'vn-ha-giang', label: 'Hà Giang Cao Nguyên Đá', category: 'viet-travel', color: '#97C66A', textLight: true },
  { id: 'vn-ha-long', label: 'Hạ Long Kỳ Quan ⛰️', category: 'viet-travel', color: '#51D3D1', textLight: true },
  { id: 'vn-hanoi', label: 'Hà Nội Nghìn Năm', category: 'viet-travel', color: '#4E3025', textLight: true },
  { id: 'vn-hanoi-hoan-kiem', label: 'Hồ Gươm Hà Nội', category: 'viet-travel', color: '#B45309', textLight: true },
  { id: 'vn-ho-chi-minh-city', label: 'Sài Gòn Năng Động 🏙️', category: 'viet-travel', color: '#E76F51', textLight: true },
  { id: 'vn-hoi-an-lantern-fest', label: 'Lễ Hội Đèn Lồng Hội An 🏮', category: 'viet-travel', color: '#7F351B', textLight: true },
  { id: 'vn-hue', label: 'Huế Mộng Mơ', category: 'viet-travel', color: '#412454', textLight: true },
  { id: 'vn-hue-festival', label: 'Festival Huế', category: 'viet-travel', color: '#39204E', textLight: true },
  { id: 'vn-ly-son', label: 'Lý Sơn Đảo Tỏi', category: 'viet-travel', color: '#4BBDAE', textLight: true },
  { id: 'vn-moc-chau', label: 'Mộc Châu Cao Nguyên 🌿', category: 'viet-travel', color: '#D9ECD3' },
  { id: 'vn-mui-ne', label: 'Mũi Né Đồi Cát 🏖️', category: 'viet-travel', color: '#E58C35', textLight: true },
  { id: 'vn-phong-nha', label: 'Phong Nha Kẻ Bàng', category: 'viet-travel', color: '#7DB596', textLight: true },
  { id: 'vn-phu-quoc', label: 'Phú Quốc Đảo Ngọc 🏝️', category: 'viet-travel', color: '#F5D775', textLight: true },
  { id: 'vn-phu-quoc-sunset', label: 'Phú Quốc Hoàng Hôn', category: 'viet-travel', color: '#EA580C', textLight: true },
  { id: 'vn-phu-yen', label: 'Phú Yên Hoa Vàng', category: 'viet-travel', color: '#F0C74B' },
  { id: 'vn-saigon-cho-lon', label: 'Sài Gòn Chợ Lớn', category: 'viet-travel', color: '#991B1B', textLight: true },
  { id: 'vn-sapa', label: 'Sapa Mây Núi ⛰️', category: 'viet-travel', color: '#78964B', textLight: true },
  { id: 'vn-tay-nguyen-gong', label: 'Tây Nguyên Cồng Chiêng 🥁', category: 'viet-travel', color: '#451A03', textLight: true },
  { id: 'vn-vung-tau', label: 'Vũng Tàu Biển Gọi', category: 'viet-travel', color: '#6ED3E2', textLight: true },
  { id: 'vn-chau-doc', label: 'Châu Đốc An Giang', category: 'viet-travel', color: '#8E9F46', textLight: true },
  { id: 'vn-nha-trang', label: 'Nha Trang Biển Xanh 🌊', category: 'viet-travel', color: '#63D6ED', textLight: true },
  { id: 'vn-quy-nhon', label: 'Quy Nhơn Biển Gọi', category: 'viet-travel', color: '#63D6ED', textLight: true },
  { id: 'vn-mai-chau', label: 'Mai Châu Hòa Bình', category: 'viet-travel', color: '#97C66A', textLight: true },
  { id: 'vn-ninh-binh', label: 'Ninh Bình Tràng An', category: 'viet-travel', color: '#97C66A', textLight: true },
  { id: 'vn-cat-ba', label: 'Cát Bà Đảo Ngọc', category: 'viet-travel', color: '#51D3D1', textLight: true },
  { id: 'vn-con-dao', label: 'Côn Đảo Bình Yên', category: 'viet-travel', color: '#4BBDAE', textLight: true },
  { id: 'vn-da-lat-flower', label: 'Đà Lạt Festival Hoa', category: 'viet-travel', color: '#F9CBD7' },
  { id: 'vn-hoi-an', label: 'Hội An Phố Cổ 🏮', category: 'viet-travel', color: '#7F351B', textLight: true }
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
const switchCamBtn = document.querySelector('#switchCamBtn');
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

// ==================== MEDIAPIPE IMAGE SEGMENTER (GPU-ACCELERATED) ====================
// Bản mới của MediaPipe (tasks-vision) hỗ trợ delegate: 'GPU' để chạy suy luận AI
// qua WebGL trên card đồ họa thật, thay vì chỉ chạy CPU/WASM như bản Selfie
// Segmentation cũ. WASM runtime và model được ghim cùng phiên bản @1.0.1 để
// đảm bảo tương thích giữa JS API và file wasm tải về.
const TASKS_VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const SELFIE_SEGMENTER_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

let imageSegmenter = null;
let segmenterDelegate = null;

function createSegmenter(vision, delegate) {
  return ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: SELFIE_SEGMENTER_MODEL_URL,
      delegate
    },
    runningMode: 'VIDEO',
    outputCategoryMask: false,
    outputConfidenceMasks: true
  });
}

async function initMediaPipe() {
  try {
    const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_URL);
    try {
      imageSegmenter = await createSegmenter(vision, 'GPU');
      segmenterDelegate = 'GPU';
    } catch (gpuErr) {
      console.warn('Không khởi tạo được AI tách nền bằng GPU, chuyển sang CPU:', gpuErr);
      imageSegmenter = await createSegmenter(vision, 'CPU');
      segmenterDelegate = 'CPU';
    }
    state.isAiReady = true;
    aiStatusBadge.textContent = `AI SEGMENTATION ON (${segmenterDelegate})`;
    aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
  } catch (err) {
    console.warn('Could not init MediaPipe:', err);
    aiStatusBadge.textContent = 'STANDBY';
    aiStatusBadge.classList.add('off');
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

let segBusy = false;
let renderLoopStarted = false;
let hasMask = false;
// Canvas nhỏ giữ mask đúng độ phân giải AI trả về (thường nhỏ hơn video nhiều,
// vd 256x256) — dựng kênh alpha từ mảng confidence đã làm mượt rồi để canvas tự
// phóng to lúc vẽ, rẻ hơn nhiều so với lặp từng pixel ở độ phân giải video đầy đủ.
const rawMaskCanvas = document.createElement('canvas');
const rawMaskCtx = rawMaskCanvas.getContext('2d');
// Mảng lưu giá trị confidence đã làm mượt theo thời gian (exponential moving average)
// tính trực tiếp trên số liệu, không qua canvas alpha-blend — vì blend qua canvas
// (globalAlpha + source-over) chỉ có thể LÀM TĂNG alpha tích lũy dần, không bao giờ
// giảm lại được khi tín hiệu mới yếu đi, gây ra vệt mờ "dính" lại vĩnh viễn ở vùng
// nền/viền từng có nhiễu nhẹ. Làm mượt trên mảng số thì tăng/giảm đúng theo tín hiệu thật.
let smoothedValues = null;

function handleSegmentationResult(result) {
  const confMask = result.confidenceMasks && result.confidenceMasks[0];
  if (!confMask) return;
  const mw = confMask.width;
  const mh = confMask.height;
  const values = confMask.getAsFloat32Array();

  if (!smoothedValues || smoothedValues.length !== values.length) {
    smoothedValues = new Float32Array(values);
  } else {
    const smoothingFactor = 0.55; // trọng số khung hình mới; càng nhỏ càng mượt nhưng trễ hơn
    for (let i = 0; i < values.length; i++) {
      smoothedValues[i] += (values[i] - smoothedValues[i]) * smoothingFactor;
    }
  }

  if (rawMaskCanvas.width !== mw || rawMaskCanvas.height !== mh) {
    rawMaskCanvas.width = mw;
    rawMaskCanvas.height = mh;
  }
  const imgData = rawMaskCtx.createImageData(mw, mh);
  const px = imgData.data;
  for (let i = 0; i < smoothedValues.length; i++) {
    const v = smoothedValues[i];
    const alpha = v <= 0 ? 0 : v >= 1 ? 255 : (v * 255) | 0;
    const o = i * 4;
    px[o] = 255;
    px[o + 1] = 255;
    px[o + 2] = 255;
    px[o + 3] = alpha;
  }
  rawMaskCtx.putImageData(imgData, 0, 0);
  hasMask = true;
}

function startRenderLoop() {
  if (renderLoopStarted) return;
  renderLoopStarted = true;
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
      // Không giới hạn cứng 33ms/lần nữa — chỉ chặn gọi chồng (segBusy) để engine GPU
      // chạy hết công suất thật của nó. Cập nhật càng dày, mask trung bình theo thời
      // gian càng bám sát viền thật hơn (giống kiểu temporal supersampling).
      if (state.aiSegmentation && state.background !== 'none' && imageSegmenter && !segBusy) {
        segBusy = true;
        try {
          imageSegmenter.segmentForVideo(video, Math.round(now), result => {
            handleSegmentationResult(result);
            segBusy = false;
          });
        } catch (err) {
          console.warn('Lỗi tách nền AI:', err);
          segBusy = false;
        }
      }

      liveCtx.save();
      liveCtx.clearRect(0, 0, vw, vh);

      if (state.aiSegmentation && state.background !== 'none' && hasMask) {
        drawBackgroundToContext(liveCtx, vw, vh, state.background);

        segCtx.save();
        segCtx.clearRect(0, 0, vw, vh);
        segCtx.filter = getCssFilterString(state.filter);
        segCtx.drawImage(video, 0, 0, vw, vh);
        segCtx.filter = 'none';

        segCtx.globalCompositeOperation = 'destination-in';
        segCtx.filter = 'contrast(4.5) blur(1.5px)';
        segCtx.drawImage(rawMaskCanvas, 0, 0, vw, vh);
        segCtx.filter = 'none';
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
    const cached = bgImageCache[bgConfig.url];
    if (cached === 'loading') {
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 0, w, h);
    } else if (cached) {
      ctx.drawImage(cached, 0, 0, w, h);
    } else {
      bgImageCache[bgConfig.url] = 'loading';
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgImageCache[bgConfig.url] = img; };
      img.onerror = () => { delete bgImageCache[bgConfig.url]; };
      img.src = bgConfig.url;
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// ==================== CAMERA INITIALIZATION ====================
let videoInputDevices = []; // danh sách camera thật (deviceId) sau khi có quyền
let currentCameraIndex = 0;

function buildVideoConstraints() {
  // Nếu đã liệt kê được nhiều camera thật (PC nhiều webcam, hoặc mobile), ưu tiên chọn theo deviceId
  // vì facingMode không đáng tin cậy trên desktop (webcam desktop không khai báo trước/sau).
  const chosenDevice = videoInputDevices[currentCameraIndex];
  if (chosenDevice) {
    return {
      deviceId: { exact: chosenDevice.deviceId },
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 }
    };
  }
  return {
    facingMode: state.facingMode,
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 }
  };
}

async function startCamera() {
  if (state.stream) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: buildVideoConstraints(),
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
    await refreshVideoInputDevices();
  } catch (err) {
    console.error('Lỗi camera:', err);
    shotStatus.textContent = 'Không thể mở camera — Vui lòng cấp quyền camera trong trình duyệt.';
    placeholder.hidden = false;
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }
  video.srcObject = null;
}

async function switchCamera() {
  if (!state.stream || state.busy) return;
  if (videoInputDevices.length > 1) {
    currentCameraIndex = (currentCameraIndex + 1) % videoInputDevices.length;
  } else {
    // Không có danh sách deviceId (hiếm) — thử đổi facingMode như phương án dự phòng
    state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
  }
  state.mirror = state.facingMode === 'user' && currentCameraIndex === 0;
  mirrorToggle.checked = state.mirror;
  cameraViewport.classList.toggle('mirrored', state.mirror);
  stopCamera();
  shotStatus.textContent = 'Đang đổi camera...';
  await startCamera();
}

async function refreshVideoInputDevices() {
  try {
    if (!navigator.mediaDevices.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoInputDevices = devices.filter(d => d.kind === 'videoinput');
    if (switchCamBtn) switchCamBtn.hidden = videoInputDevices.length < 2;
  } catch (err) {
    // Không xác định được số camera — ẩn nút đổi cam để tránh gây nhầm lẫn
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
  const layoutCfg = layoutsConfig.find(l => l.id === state.layout) || layoutsConfig[3];

  // 1. Clear any inline background overrides so all CSS frame classes apply cleanly
  stripPreview.style.removeProperty('background');
  stripPreview.style.removeProperty('background-color');
  stripPreview.style.removeProperty('background-image');
  stripPreview.style.removeProperty('background-size');
  stripPreview.style.removeProperty('background-position');

  // 2. Apply frame and layout classes
  stripPreview.className = `strip frame-${state.frame} layout-${state.layout}`;
  stripPreview.style.setProperty('--layout-width', `${layoutCfg.preview.width}px`);
  stripPreview.style.setProperty('--layout-cols', layoutCfg.cols);
  stripPreview.style.setProperty('--layout-gap', `${layoutCfg.preview.gap}px`);
  stripPreview.style.setProperty('--layout-slot-aspect', layoutCfg.preview.slotAspect);

  // 3. Find current frame configuration
  const frameCfg = framesConfig.find(f => f.id === state.frame) || framesConfig[0];
  if (frameCfg && frameCfg.textLight) {
    stripPreview.classList.add('frame-text-light');
  }

  // 4. Handle custom PNG frame or dynamic asset frame
  const currentLayoutAsset = frameCfg && frameCfg.assets && frameCfg.assets[state.layout];
  const currentAssetSpec = currentLayoutAsset
    ? (FRAME_ASSET_SPECS[`${frameCfg.id}:${state.layout}`] || FRAME_ASSET_SPECS[state.layout])
    : null;
  const currentArtworkSpec = frameCfg && frameCfg.artwork
    ? ARTWORK_FRAME_SPECS[`${frameCfg.id}:${state.layout}`]
    : null;
  const currentFrameSpec = fitFrameSpecToPhotoAspect(currentAssetSpec || currentArtworkSpec);
  if (currentLayoutAsset) {
    stripPreview.classList.add('has-asset-frame');
  } else {
    stripPreview.classList.remove('has-asset-frame');
  }
  stripPreview.classList.toggle('has-positioned-asset', Boolean(currentFrameSpec));
  stripPreview.classList.toggle('has-positioned-artwork', Boolean(currentArtworkSpec));
  if (currentFrameSpec) {
    stripPreview.style.setProperty('padding', '0', 'important');
    stripPreview.style.setProperty('border', '0', 'important');
  } else {
    stripPreview.style.removeProperty('padding');
    stripPreview.style.removeProperty('border');
  }
  if (currentArtworkSpec) {
    stripPreview.style.setProperty('--artwork-aspect', `${currentArtworkSpec.size[0]} / ${currentArtworkSpec.size[1]}`);
  } else {
    stripPreview.style.removeProperty('--artwork-aspect');
  }

  if (state.frame === 'custom' && state.customFrameUrl) {
    stripPreview.style.setProperty('background-image', `url('${state.customFrameUrl}')`, 'important');
    stripPreview.style.setProperty('background-size', '100% 100%', 'important');
    stripPreview.style.setProperty('background-position', 'center', 'important');
  }
  if (frameCfg && frameCfg.artwork && (!frameCfg.layouts || frameCfg.layouts.includes(state.layout))) {
    stripPreview.style.setProperty('background-image', `url('${frameCfg.artwork}')`, 'important');
    stripPreview.style.setProperty('background-size', 'cover', 'important');
    stripPreview.style.setProperty('background-position', 'center', 'important');
    stripPreview.classList.add('ai-artwork-frame');
  } else if (frameCfg && frameCfg.artwork) {
    // A fixed 4-cut artwork gets a responsive, same-theme frame on other layouts.
    stripPreview.classList.add('adaptive-ai-frame', `adaptive-${frameCfg.id}`);
    stripPreview.style.setProperty('--adaptive-accent', frameCfg.color || '#795290');
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
    const assetSlot = currentFrameSpec && currentFrameSpec.slots[idx];
    const assetVars = assetSlot
      ? `--asset-slot-x:${(assetSlot[0] / currentFrameSpec.size[0]) * 100}%;--asset-slot-y:${(assetSlot[1] / currentFrameSpec.size[1]) * 100}%;--asset-slot-w:${(assetSlot[2] / currentFrameSpec.size[0]) * 100}%;--asset-slot-h:${(assetSlot[3] / currentFrameSpec.size[1]) * 100}%;`
      : '';
    const assetPosition = assetVars ? `style="${assetVars}"` : '';

    if (photo) {
      return `
        <div class="strip-slot filled-slot ${isActive ? 'active-slot' : ''}" data-slot-index="${idx}" style="${assetVars}">
          <img src="${photo.src}" alt="Slot ${idx + 1}" />
          <span class="slot-index-tag">Ô ${idx + 1}</span>
          <button class="slot-remove-btn" data-remove-slot="${idx}" title="Gỡ ảnh khỏi ô này">✕</button>
        </div>
      `;
    } else {
      return `
        <div class="strip-slot empty-slot ${isActive ? 'active-slot' : ''}" data-slot-index="${idx}" ${assetPosition}>
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
  const assetOverlayHtml = currentLayoutAsset
    ? `<img class="strip-frame-asset-overlay" src="${currentLayoutAsset}" alt="${escapeHtml(frameCfg ? frameCfg.label : 'Frame')}" />`
    : '';

  stripPreview.innerHTML = `
    <div class="strip-header">SNAPBOX STUDIO</div>
    <div class="strip-photos">${slotsHtml}</div>
    <div class="strip-footer">
      <div class="strip-caption">${escapeHtml(state.caption)}</div>
      ${state.showDate ? `<div class="strip-meta">${dateStr} • ${timeStr}</div>` : ''}
      ${state.showLogo ? `<div class="strip-meta">✦ LIFE 4 CUTS SEOUL ✦</div>` : ''}
    </div>
    ${assetOverlayHtml}
    ${graphicsHtml ? `<div class="strip-decor-layer">${graphicsHtml}</div>` : ''}
    <div class="strip-stickers-layer">${stickersHtml}</div>
  `;

  const filledCount = state.slotAssignments.filter(Boolean).length;
  const canExport = filledCount > 0;
  downloadBtn.disabled = !canExport;
  qrBtn.disabled = !canExport;
  printBtn.disabled = !canExport;
  updateActiveFrameHeroCard(frameCfg);
  fitStripToViewport();
  // The strip width/aspect animates for 250ms when switching layouts. Measure
  // again after that transition so wide grids (especially 3x3) stay contained.
  requestAnimationFrame(fitStripToViewport);
  window.setTimeout(fitStripToViewport, 280);
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

function drawImageCover(ctx, img, x, y, w, h) {
  const r = Math.max(w / img.width, h / img.height);
  const nw = img.width * r, nh = img.height * r;
  const dx = x + (w - nw) / 2, dy = y + (h - nh) / 2;
  ctx.drawImage(img, dx, dy, nw, nh);
}

function fitFrameSpecToPhotoAspect(spec) {
  if (!spec) return null;
  return {
    size: spec.size,
    slots: spec.slots.map(([x, y, width, height]) => {
      const fittedWidth = Math.min(width, height * PHOTO_ASPECT_RATIO);
      const fittedHeight = fittedWidth / PHOTO_ASPECT_RATIO;
      return [
        x + (width - fittedWidth) / 2,
        y + (height - fittedHeight) / 2,
        fittedWidth,
        fittedHeight
      ];
    })
  };
}

// Corner flourishes matching each themed frame, used only when the PNG artwork/asset for the
// current layout isn't available and we fall back to a drawn (non-raster) version of the theme.
const ADAPTIVE_FRAME_GLYPHS = {
  'ai-tet-an-vui': '🏮 ✦ 🏮',
  'ai-hoi-an': '🏮 ✦ 🏮',
  'ai-trung-thu': '🌕 🏮 🐇',
  'ai-graduation': '🎓 ✦ 🎓',
  'ai-womens-day': '🌸 ♡ 🌸',
  'ai-birthday-cherry': '🍒 ♡ 🍓',
  'ai-couple-rose': '🌹 ♡ 🌹',
  'ai-wedding-gold': '✦ ♡ ✦',
  'ai-kpop-neon': '★ ✦ ★',
  'ai-scrapbook': '★ ☺ ♡',
  'polaroid-onestep-film': '▭ ▭ ▭',
  'onestep-burgundy-bloom': '✿ ✦ ✿'
};

function drawAdaptiveThemedFrame(ctx, w, h, frameCfg) {
  const accent = (frameCfg && frameCfg.color) || '#795290';
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, shadeColor(accent, -0.28));
  grad.addColorStop(1, accent);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const borderInset = Math.max(6, Math.round(w * 0.016));
  ctx.strokeStyle = shadeColor(accent, 0.45);
  ctx.lineWidth = Math.max(3, Math.round(w * 0.006));
  ctx.strokeRect(borderInset, borderInset, w - borderInset * 2, h - borderInset * 2);

  const glyphs = (frameCfg && ADAPTIVE_FRAME_GLYPHS[frameCfg.id]) || '✦ ✦ ✦';
  const glyphSize = Math.max(16, Math.round(w * 0.045));
  ctx.font = `${glyphSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(glyphs, borderInset + 8, borderInset + glyphSize + 4);
  ctx.textAlign = 'right';
  ctx.fillText(glyphs, w - borderInset - 8, h - borderInset - 10);
  ctx.textAlign = 'left';
}

function shadeColor(hex, percent) {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const mix = (channel) => {
    const target = percent < 0 ? 0 : 255;
    return Math.round(channel + (target - channel) * Math.abs(percent));
  };
  r = mix(r); g = mix(g); b = mix(b);
  return `rgb(${r}, ${g}, ${b})`;
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

const FRAME_ASSET_SPECS = {
  // The transparent film windows are measured from the OneStep Film Strip artwork.
  'polaroid-onestep-film:1': { size: [1024, 1536], slots: [[118, 678, 788, 490]] },
  'polaroid-onestep-film:2': { size: [1024, 1536], slots: [[178, 322, 668, 458], [178, 872, 668, 456]] },
  'polaroid-onestep-film:3': { size: [780, 2014], slots: [[206, 536, 398, 404], [206, 980, 398, 400], [208, 1420, 396, 402]] },
  'polaroid-onestep-film:4': { size: [1024, 1536], slots: [[382, 326, 260, 260], [382, 626, 260, 260], [382, 926, 260, 260], [382, 1224, 260, 260]] },
  'onestep-burgundy-bloom:3': { size: [844, 1864], slots: [[241, 519, 393, 286], [241, 846, 393, 344], [241, 1230, 393, 334]] },
  'onestep-burgundy-bloom:1': { size: [954, 1648], slots: [[287, 464, 413, 894]] },
  // Measured from the transparent 16:9 windows in the rebuilt 2-cut artwork.
  'onestep-burgundy-bloom:2': { size: [941, 1672], slots: [[157, 554, 628, 380], [157, 995, 628, 405]] },
  'onestep-burgundy-bloom:4': { size: [1024, 1536], slots: [[144, 483, 348, 346], [535, 483, 344, 346], [144, 891, 348, 359], [535, 891, 344, 359]] },
  'onestep-burgundy-bloom:6': { size: [1024, 1536], slots: [[257, 420, 238, 288], [531, 420, 237, 288], [257, 745, 238, 281], [531, 745, 237, 281], [257, 1060, 238, 278], [531, 1060, 237, 278]] },
  'onestep-burgundy-bloom:8': { size: [844, 1863], slots: [[195, 472, 200, 241], [449, 472, 200, 241], [195, 757, 200, 241], [449, 757, 200, 241], [195, 1042, 200, 241], [449, 1042, 200, 241], [195, 1327, 200, 241], [449, 1327, 200, 241]] },
  'onestep-burgundy-bloom:9': { size: [1024, 1536], slots: [[157, 482, 211, 219], [406, 482, 211, 219], [655, 482, 211, 219], [157, 746, 211, 219], [406, 746, 211, 219], [655, 746, 211, 219], [157, 1010, 211, 219], [406, 1010, 211, 219], [655, 1010, 211, 219]] },
  '1': { size: [900, 1100], slots: [[80, 150, 740, 740]] },
  '2': { size: [760, 1360], slots: [[60, 150, 640, 490], [60, 670, 640, 490]] },
  '3': { size: [720, 1860], slots: [[193, 521, 407, 337], [193, 901, 407, 338], [193, 1283, 407, 338]] },
  '4': { size: [700, 2300], slots: [[60, 140, 580, 445], [60, 615, 580, 445], [60, 1090, 580, 445], [60, 1565, 580, 445]] },
  '4-grid': { size: [1160, 1320], slots: [[65, 140, 500, 480], [595, 140, 500, 480], [65, 650, 500, 480], [595, 650, 500, 480]] },
  '6': { size: [1160, 1750], slots: [[65, 140, 500, 440], [595, 140, 500, 440], [65, 610, 500, 440], [595, 610, 500, 440], [65, 1080, 500, 440], [595, 1080, 500, 440]] },
  '8': { size: [1160, 2150], slots: [[65, 140, 500, 410], [595, 140, 500, 410], [65, 580, 500, 410], [595, 580, 500, 410], [65, 1020, 500, 410], [595, 1020, 500, 410], [65, 1460, 500, 410], [595, 1460, 500, 410]] },
  '9': { size: [1350, 1480], slots: [[60, 140, 393, 370], [476, 140, 393, 370], [892, 140, 393, 370], [60, 540, 393, 370], [476, 540, 393, 370], [892, 540, 393, 370], [60, 940, 393, 370], [476, 940, 393, 370], [892, 940, 393, 370]] }
};

const ARTWORK_FRAME_SPECS = {
  'ai-trung-thu:4': { size: [724, 2172], slots: [[124, 348, 476, 340], [124, 732, 476, 344], [124, 1120, 476, 340], [124, 1504, 476, 344]] },
  'ai-graduation:4': { size: [725, 2170], slots: [[108, 248, 512, 352], [108, 648, 508, 352], [108, 1048, 508, 348], [108, 1448, 508, 348]] },
  'ai-womens-day:4': { size: [724, 2172], slots: [[72, 248, 580, 372], [72, 680, 580, 372], [72, 1112, 580, 372], [72, 1544, 580, 352]] },
  'ai-tet-an-vui:4': { size: [724, 2172], slots: [[128, 232, 468, 364], [128, 644, 468, 372], [128, 1064, 468, 372], [128, 1484, 468, 372]] },
  'ai-hoi-an:4': { size: [724, 2172], slots: [[160, 292, 408, 348], [160, 676, 408, 348], [160, 1064, 408, 348], [160, 1448, 408, 348]] },
  'ai-scrapbook:4': { size: [724, 2172], slots: [[172, 216, 380, 396], [172, 640, 380, 396], [172, 1064, 380, 396], [176, 1484, 372, 392]] },
  'ai-birthday-cherry:4': { size: [725, 2170], slots: [[104, 240, 516, 380], [104, 656, 516, 384], [104, 1076, 516, 380], [104, 1492, 516, 384]] },
  'ai-couple-rose:4': { size: [724, 2172], slots: [[76, 140, 568, 388], [80, 600, 564, 388], [76, 1064, 568, 384], [76, 1528, 568, 384]] },
  'ai-wedding-gold:4': { size: [725, 2170], slots: [[120, 220, 484, 376], [120, 640, 484, 376], [120, 1064, 484, 376], [120, 1488, 484, 380]] },
  'ai-kpop-neon:4': { size: [724, 2172], slots: [[112, 312, 500, 312], [112, 672, 500, 308], [112, 1032, 500, 308], [112, 1388, 500, 312]] }
};

// ==================== HIGH RESOLUTION STRIP EXPORT (300 DPI) ====================
async function generateHighResStrip() {
  const layoutCfg = layoutsConfig.find(l => l.id === state.layout) || layoutsConfig[3];
  const assignedPhotos = state.slotAssignments.map(id => state.photoPool.find(p => p.id === id)).filter(Boolean);
  if (!assignedPhotos.length) return null;

  const frameCfg = framesConfig.find(f => f.id === state.frame) || framesConfig[0];
  const hasAssetFrame = frameCfg && frameCfg.assets && frameCfg.assets[state.layout];
  const assetSpec = hasAssetFrame
    ? fitFrameSpecToPhotoAspect(FRAME_ASSET_SPECS[`${frameCfg.id}:${state.layout}`] || FRAME_ASSET_SPECS[state.layout])
    : null;
  const artworkSpec = frameCfg && frameCfg.artwork
    ? fitFrameSpecToPhotoAspect(ARTWORK_FRAME_SPECS[`${frameCfg.id}:${state.layout}`])
    : null;

  if (assetSpec) {
    const canvasW = assetSpec.size[0];
    const canvasH = assetSpec.size[1];
    exportCanvas.width = canvasW;
    exportCanvas.height = canvasH;
    const ctx = exportCanvas.getContext('2d');

    // 1. Solid background color matching frame
    ctx.fillStyle = frameCfg.color || '#1B2430';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Draw user photos inside cutouts
    for (let i = 0; i < assetSpec.slots.length; i++) {
      const [sx, sy, sw, sh] = assetSpec.slots[i];
      const photoId = state.slotAssignments[i];
      const photoObj = state.photoPool.find(p => p.id === photoId);
      if (photoObj) {
        const img = await loadImage(photoObj.src);
        drawImageProp(ctx, img, sx, sy, sw, sh);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(sx, sy, sw, sh);
      }
    }

    // 3. Draw high-res overlay artwork on top
    const overlayImg = await loadImage(frameCfg.assets[state.layout]);
    ctx.drawImage(overlayImg, 0, 0, canvasW, canvasH);

    // 4. Draw stickers
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

  if (artworkSpec) {
    const [canvasW, canvasH] = artworkSpec.size;
    exportCanvas.width = canvasW;
    exportCanvas.height = canvasH;
    const ctx = exportCanvas.getContext('2d');
    const artwork = await loadImage(frameCfg.artwork);
    ctx.drawImage(artwork, 0, 0, canvasW, canvasH);

    for (let i = 0; i < artworkSpec.slots.length; i++) {
      const [x, y, width, height] = artworkSpec.slots[i];
      const photo = state.photoPool.find(item => item.id === state.slotAssignments[i]);
      if (photo) {
        drawImageCover(ctx, await loadImage(photo.src), x, y, width, height);
      }
    }

    for (const sticker of state.stickers) {
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.emoji, (sticker.x / 100) * canvasW, (sticker.y / 100) * canvasH);
    }
    return exportCanvas.toDataURL('image/png', 1.0);
  }

  const cols = layoutCfg.cols;
  const rows = Math.ceil(layoutCfg.count / cols);
  const exportCfg = layoutCfg.export;
  const canvasW = exportCfg.width;
  const canvasH = exportCfg.height;

  exportCanvas.width = canvasW;
  exportCanvas.height = canvasH;
  const ctx = exportCanvas.getContext('2d');

  // 1. Frame background
  if (state.frame === 'custom' && state.customFrameUrl) {
    const customImg = await loadImage(state.customFrameUrl);
    ctx.drawImage(customImg, 0, 0, canvasW, canvasH);
  } else if (frameCfg && frameCfg.artwork && (!frameCfg.layouts || frameCfg.layouts.includes(state.layout))) {
    // The frame's designed layout: draw its painted artwork full-bleed, same as the live preview.
    const artImg = await loadImage(frameCfg.artwork);
    drawImageCover(ctx, artImg, 0, 0, canvasW, canvasH);
  } else if (frameCfg && frameCfg.artwork) {
    // Any other layout: keep the same theme via a matching drawn frame instead of losing it.
    drawAdaptiveThemedFrame(ctx, canvasW, canvasH, frameCfg);
  } else if (frameCfg && frameCfg.assets && !hasAssetFrame) {
    // A raster-asset frame with no PNG for this layout: same adaptive fallback.
    drawAdaptiveThemedFrame(ctx, canvasW, canvasH, frameCfg);
  } else {
    drawCustomFramePattern(ctx, canvasW, canvasH, frameCfg);
  }

  // 2. Header
  ctx.fillStyle = frameCfg && frameCfg.textLight ? '#ffffff' : '#181424';
  ctx.font = 'bold 22px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SNAPBOX STUDIO', canvasW / 2, 45);

  // 3. Grid slots calculation
  const { padX, topPad, bottomPad, gap } = exportCfg;

  const availW = canvasW - padX * 2 - gap * (cols - 1);
  const cellW = availW / cols;
  const cellH = cellW / PHOTO_ASPECT_RATIO;

  for (let i = 0; i < layoutCfg.count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (cellW + gap);
    const y = topPad + row * (cellH + gap);

    const photoId = state.slotAssignments[i];
    const photoObj = state.photoPool.find(p => p.id === photoId);

    if (photoObj) {
      const img = await loadImage(photoObj.src);
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
  // Keep canvas exports consistent with CSS object-fit: cover/object-position: center.
  drawImageCover(ctx, img, x, y, w, h);
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
  if (switchCamBtn) switchCamBtn.addEventListener('click', switchCamera);

  // Tabs switching: Chữ & Sticker / Xuất ảnh & In
  document.querySelectorAll('.customizer-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.customizer-tabs .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      const paneId = targetTab === 'export' ? '#tabContentExport' : '#tabContentCaption';
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
    renderFramePicker();
    syncSlotAssignments();
  });

  // Bật/tắt lọc khung theo bố cục đang chọn
  const frameLayoutFilterToggleBtn = document.querySelector('#frameLayoutFilterToggleBtn');
  if (frameLayoutFilterToggleBtn) {
    frameLayoutFilterToggleBtn.addEventListener('click', () => {
      frameLayoutFilterEnabled = !frameLayoutFilterEnabled;
      renderFramePicker();
    });
  }

  // Frame search in Tab 1
  const frameSearchInput = document.querySelector('#frameSearchInput');
  const clearFrameSearchBtn = document.querySelector('#clearFrameSearchBtn');

  if (frameSearchInput) {
    frameSearchInput.addEventListener('input', e => {
      const val = e.target.value;
      if (clearFrameSearchBtn) clearFrameSearchBtn.hidden = !val;
      renderFramePicker(currentFrameCategory, val);
    });
  }

  if (clearFrameSearchBtn) {
    clearFrameSearchBtn.addEventListener('click', () => {
      if (frameSearchInput) {
        frameSearchInput.value = '';
        frameSearchInput.focus();
      }
      clearFrameSearchBtn.hidden = true;
      renderFramePicker(currentFrameCategory, '');
    });
  }

  // Frame selection & categories in Tab 1
  const frameFilterChips = document.querySelector('.frame-filter-chips');
  if (frameFilterChips) {
    frameFilterChips.addEventListener('click', e => {
      const tab = e.target.closest('[data-category]');
      if (!tab) return;
      document.querySelectorAll('.frame-filter-chips button').forEach(t => t.classList.toggle('active', t === tab));
      renderFramePicker(tab.dataset.category, frameSearchInput ? frameSearchInput.value : '');
    });
  }

  document.querySelector('#framePicker').addEventListener('click', e => {
    const swatch = e.target.closest('[data-frame]');
    if (!swatch) return;
    selectFrame(swatch.dataset.frame);
  });

  // Modal Frame Browser
  const frameModal = document.querySelector('#frameModal');
  const openFrameModalBtn = document.querySelector('#openFrameModalBtn');
  const heroExpandBtn = document.querySelector('#heroExpandBtn');
  const closeFrameModal = document.querySelector('#closeFrameModal');
  const modalFrameSearchInput = document.querySelector('#modalFrameSearchInput');
  const clearModalFrameSearchBtn = document.querySelector('#clearModalFrameSearchBtn');

  function openFrameModal() {
    if (!frameModal) return;
    frameModal.hidden = false;
    currentModalCategory = currentFrameCategory;
    currentModalSearchTerm = '';
    if (modalFrameSearchInput) modalFrameSearchInput.value = '';
    if (clearModalFrameSearchBtn) clearModalFrameSearchBtn.hidden = true;
    document.querySelectorAll('.modal-frame-chips button').forEach(t => {
      t.classList.toggle('active', t.dataset.modalCategory === currentModalCategory);
    });
    renderModalFramePicker(currentModalCategory, '');
  }

  if (openFrameModalBtn) openFrameModalBtn.addEventListener('click', openFrameModal);
  if (heroExpandBtn) heroExpandBtn.addEventListener('click', openFrameModal);
  if (closeFrameModal) closeFrameModal.addEventListener('click', () => { frameModal.hidden = true; });

  if (frameModal) {
    frameModal.addEventListener('click', e => {
      if (e.target === frameModal) frameModal.hidden = true;
    });
  }

  const modalFrameChips = document.querySelector('.modal-frame-chips');
  if (modalFrameChips) {
    modalFrameChips.addEventListener('click', e => {
      const tab = e.target.closest('[data-modal-category]');
      if (!tab) return;
      document.querySelectorAll('.modal-frame-chips button').forEach(t => t.classList.toggle('active', t === tab));
      renderModalFramePicker(tab.dataset.modalCategory, modalFrameSearchInput ? modalFrameSearchInput.value : '');
    });
  }

  if (modalFrameSearchInput) {
    modalFrameSearchInput.addEventListener('input', e => {
      const val = e.target.value;
      if (clearModalFrameSearchBtn) clearModalFrameSearchBtn.hidden = !val;
      renderModalFramePicker(currentModalCategory, val);
    });
  }

  if (clearModalFrameSearchBtn) {
    clearModalFrameSearchBtn.addEventListener('click', () => {
      if (modalFrameSearchInput) {
        modalFrameSearchInput.value = '';
        modalFrameSearchInput.focus();
      }
      clearModalFrameSearchBtn.hidden = true;
      renderModalFramePicker(currentModalCategory, '');
    });
  }

  const modalFramePicker = document.querySelector('#modalFramePicker');
  if (modalFramePicker) {
    modalFramePicker.addEventListener('click', e => {
      const card = e.target.closest('[data-frame]');
      if (!card) return;
      selectFrame(card.dataset.frame);
      if (frameModal) frameModal.hidden = true;
    });
  }

  // Toggle Strip Fit View Mode
  const toggleStripFitBtn = document.querySelector('#toggleStripFitBtn');
  const stripViewport = document.querySelector('#stripViewport');
  if (toggleStripFitBtn && stripViewport) {
    toggleStripFitBtn.addEventListener('click', () => {
      const isFit = stripViewport.classList.toggle('fit-mode');
      toggleStripFitBtn.classList.toggle('active', isFit);
      const span = toggleStripFitBtn.querySelector('span');
      if (span) span.textContent = isFit ? 'Vừa khung' : '100% Gốc';
      fitStripToViewport();
    });
  }

  window.addEventListener('resize', fitStripToViewport);

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
let currentFrameCategory = 'all';
let currentFrameSearchTerm = '';
let currentModalCategory = 'all';
let currentModalSearchTerm = '';
// Mặc định chỉ hiện khung có thiết kế hợp với bố cục đang chọn (ẩn bớt khung AI
// bị khóa cứng vào 1 bố cục khác) — người dùng có thể bấm "Hiện tất cả" để tắt lọc.
let frameLayoutFilterEnabled = true;

function getCategoryBadgeLabel(cat) {
  const map = {
    'vietnam': '🇻🇳 Việt Nam',
    'pinterest': '✨ Pinterest',
    'world': '🌍 Thế Giới',
    'k-studio': '🇰🇷 K-Studio',
    'y2k': '⚡ Y2K Cyber',
    'film': '🎞 Retro Film',
    'cute': '🎀 Kawaii Cute',
    'event': '🎉 Tiệc & Kỷ niệm',
    'kpop': '💿 K-Pop Idol',
    'viet-holiday': '🎊 Lễ hội VN',
    'viet-travel': '🧳 Du lịch VN',
    'trend-2026': '🔥 Trend 2026',
    'all': 'Tất cả'
  };
  return map[cat] || cat;
}

function getLayoutMiniIcon(id) {
  switch (id) {
    case '1':
      return `<span class="layout-mini-icon"><i class="cell" style="width:12px; height:14px;"></i></span>`;
    case '2':
      return `<span class="layout-mini-icon" style="flex-direction:column; gap:1.5px;"><i class="cell" style="width:12px; height:6px;"></i><i class="cell" style="width:12px; height:6px;"></i></span>`;
    case '3':
      return `<span class="layout-mini-icon" style="flex-direction:column; gap:1px;"><i class="cell" style="width:11px; height:3.5px;"></i><i class="cell" style="width:11px; height:3.5px;"></i><i class="cell" style="width:11px; height:3.5px;"></i></span>`;
    case '4':
      return `<span class="layout-mini-icon" style="flex-direction:column; gap:1px;"><i class="cell" style="width:9px; height:2.5px;"></i><i class="cell" style="width:9px; height:2.5px;"></i><i class="cell" style="width:9px; height:2.5px;"></i><i class="cell" style="width:9px; height:2.5px;"></i></span>`;
    case '4-grid':
      return `<span class="layout-mini-icon" style="display:grid; grid-template-columns:1fr 1fr; gap:1.5px;"><i class="cell" style="width:6px; height:6px;"></i><i class="cell" style="width:6px; height:6px;"></i><i class="cell" style="width:6px; height:6px;"></i><i class="cell" style="width:6px; height:6px;"></i></span>`;
    case '6':
      return `<span class="layout-mini-icon" style="display:grid; grid-template-columns:1fr 1fr; gap:1px;"><i class="cell" style="width:6px; height:4px;"></i><i class="cell" style="width:6px; height:4px;"></i><i class="cell" style="width:6px; height:4px;"></i><i class="cell" style="width:6px; height:4px;"></i><i class="cell" style="width:6px; height:4px;"></i><i class="cell" style="width:6px; height:4px;"></i></span>`;
    case '8':
      return `<span class="layout-mini-icon" style="display:grid; grid-template-columns:1fr 1fr; gap:1px;"><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i><i class="cell" style="width:6px; height:3px;"></i></span>`;
    case '9':
      return `<span class="layout-mini-icon" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1px;"><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i><i class="cell" style="width:4px; height:4px;"></i></span>`;
    default:
      return '';
  }
}

function renderLayoutPicker() {
  const container = document.querySelector('#layoutPicker');
  if (!container) return;
  container.innerHTML = layoutsConfig.map(l => `
    <button class="layout-option ${l.id === state.layout ? 'active' : ''}" data-layout="${l.id}">
      ${getLayoutMiniIcon(l.id)}
      <strong>${l.label}</strong>
      <small>${l.sub}</small>
    </button>
  `).join('');
  updateLayoutFrameHint();
}

// Khung có "artwork" (ảnh nền cố định) chỉ khớp đúng các bố cục liệt kê trong
// f.layouts (mặc định là mọi bố cục nếu không khai báo). Khung có "assets" (PNG
// riêng từng bố cục) chỉ khớp bố cục nào có key tương ứng. Khung màu/hoa văn CSS
// thuần (không artwork/assets) luôn khớp mọi bố cục vì tự vẽ lại theo tỉ lệ.
function frameSupportsLayout(frameCfg, layoutId) {
  if (!frameCfg) return true;
  if (frameCfg.artwork) return !frameCfg.layouts || frameCfg.layouts.includes(layoutId);
  if (frameCfg.assets) return Boolean(frameCfg.assets[layoutId]);
  return true;
}

// Trả về danh sách nhãn bố cục mà khung có thiết kế riêng, hoặc null nếu khung
// khớp mọi bố cục (không giới hạn).
function getFrameNativeLayoutLabels(frameCfg) {
  if (!frameCfg) return null;
  let ids = null;
  if (frameCfg.artwork) ids = frameCfg.layouts || null;
  else if (frameCfg.assets) ids = Object.keys(frameCfg.assets);
  if (!ids) return null;
  return ids.map(id => (layoutsConfig.find(l => l.id === id) || {}).label || id);
}

function updateLayoutFrameHint() {
  const hintEl = document.querySelector('#layoutFrameHint');
  if (!hintEl) return;
  const frameCfg = framesConfig.find(f => f.id === state.frame);
  if (state.frame === 'custom' || !frameCfg || frameSupportsLayout(frameCfg, state.layout)) {
    hintEl.hidden = true;
    return;
  }
  const nativeLabels = getFrameNativeLayoutLabels(frameCfg);
  const nativeText = nativeLabels && nativeLabels.length ? `bố cục <b>${nativeLabels.join(', ')}</b>` : 'bố cục khác';
  hintEl.hidden = false;
  hintEl.innerHTML = `💡 Khung <b>${escapeHtml(frameCfg.label)}</b> chỉ có thiết kế gốc riêng cho ${nativeText} — ở bố cục này, khung sẽ dùng bản nền cùng tông màu thay thế.`;
}

function updateFrameLayoutFilterBar(hiddenCount) {
  const bar = document.querySelector('#frameLayoutFilterBar');
  const textEl = document.querySelector('#frameLayoutFilterText');
  const toggleBtn = document.querySelector('#frameLayoutFilterToggleBtn');
  if (!bar || !textEl || !toggleBtn) return;

  const layoutLabel = (layoutsConfig.find(l => l.id === state.layout) || {}).label || state.layout;

  if (frameLayoutFilterEnabled) {
    if (hiddenCount > 0) {
      bar.hidden = false;
      textEl.textContent = `Đã ẩn ${hiddenCount} khung không hỗ trợ bố cục "${layoutLabel}"`;
      toggleBtn.textContent = 'Hiện tất cả';
    } else {
      bar.hidden = true;
    }
  } else {
    bar.hidden = false;
    textEl.textContent = 'Đang hiện tất cả khung (kể cả khung không hỗ trợ bố cục này)';
    toggleBtn.textContent = 'Lọc theo bố cục';
  }
}

function renderFramePicker(category = currentFrameCategory, searchTerm = currentFrameSearchTerm) {
  currentFrameCategory = category;
  currentFrameSearchTerm = (searchTerm || '').trim().toLowerCase();

  const container = document.querySelector('#framePicker');
  if (!container) return;

  const categoryAndSearchFiltered = framesConfig.filter(f => {
    const matchCategory = (category === 'all' || f.category === category);
    if (!matchCategory) return false;
    if (!currentFrameSearchTerm) return true;
    const labelLower = (f.label || '').toLowerCase();
    const idLower = (f.id || '').toLowerCase();
    const catLower = getCategoryBadgeLabel(f.category).toLowerCase();
    return labelLower.includes(currentFrameSearchTerm) || idLower.includes(currentFrameSearchTerm) || catLower.includes(currentFrameSearchTerm);
  });

  // Lọc bớt khung không có thiết kế cho bố cục đang chọn (bật mặc định, có thể tắt).
  const hiddenByLayoutCount = frameLayoutFilterEnabled
    ? categoryAndSearchFiltered.filter(f => !frameSupportsLayout(f, state.layout)).length
    : 0;
  const filtered = frameLayoutFilterEnabled
    ? categoryAndSearchFiltered.filter(f => frameSupportsLayout(f, state.layout))
    : categoryAndSearchFiltered;

  updateFrameLayoutFilterBar(hiddenByLayoutCount);

  let html = '';

  // Custom frame if uploaded
  if (state.customFrameUrl && (category === 'all' || !currentFrameSearchTerm || 'khung riêng png'.includes(currentFrameSearchTerm))) {
    const isCustomActive = state.frame === 'custom';
    html += `
      <button type="button" class="frame-swatch frame-swatch-card frame-custom ${isCustomActive ? 'active' : ''}"
        data-frame="custom"
        data-label="Khung riêng PNG"
        title="Khung riêng PNG do bạn tải lên"
        aria-label="Khung riêng PNG">
        <div class="frame-thumb-box" style="background-image: url('${state.customFrameUrl}') !important; background-size: cover !important;">
          ${isCustomActive ? '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>' : ''}
        </div>
        <div class="frame-card-meta">
          <span class="frame-card-name">Khung riêng PNG</span>
          <span class="frame-card-cat">Tùy biến</span>
        </div>
      </button>
    `;
  }

  if (filtered.length === 0 && !html) {
    const suggestTurnOffFilter = frameLayoutFilterEnabled && hiddenByLayoutCount > 0;
    container.innerHTML = `
      <div class="frame-empty-search">
        <i data-lucide="search-x" class="w-8 h-8 mx-auto text-stone-300 mb-1.5"></i>
        <p>Không tìm thấy khung ảnh nào</p>
        <small>${suggestTurnOffFilter
          ? 'Danh mục này chỉ có khung không hỗ trợ bố cục đang chọn — bấm "Hiện tất cả" ở trên để xem.'
          : 'Thử tìm với từ khóa khác như "Tết", "Y2K", "Film", "Rose"...'}</small>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  html += filtered.map(f => {
    const thumbnailAsset = f.assets && (f.assets[state.layout] || f.assets['4']);
    const isActive = f.id === state.frame;
    const bgStyle = thumbnailAsset
      ? `--frame-asset-thumbnail: url('${thumbnailAsset}');`
      : (f.color ? `background-color: ${f.color};` : '');

    return `
      <button type="button" class="frame-swatch frame-swatch-card frame-${f.id} ${thumbnailAsset ? 'has-asset-thumbnail' : ''} ${isActive ? 'active' : ''}"
        data-frame="${f.id}"
        data-label="${escapeHtml(f.label)}"
        title="${escapeHtml(f.label)}"
        aria-label="Khung ${escapeHtml(f.label)}">
        <div class="frame-thumb-box ${thumbnailAsset ? 'has-asset-thumbnail' : ''}" style="${bgStyle}">
          ${!thumbnailAsset ? `
            <div class="sim-strip-slots">
              <div class="sim-slot"></div>
              <div class="sim-slot"></div>
              <div class="sim-slot"></div>
            </div>
          ` : ''}
          ${isActive ? '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>' : ''}
        </div>
        <div class="frame-card-meta">
          <span class="frame-card-name">${escapeHtml(f.label)}</span>
          <span class="frame-card-cat">${getCategoryBadgeLabel(f.category)}</span>
          ${f.layouts ? `<span class="frame-layout-lock" title="Khung này chỉ có thiết kế gốc riêng cho bố cục liệt kê, các bố cục khác dùng bản nền cùng tông màu">🔒 ${f.layouts.map(id => (layoutsConfig.find(l => l.id === id) || {}).label || id).join(', ')}</span>` : ''}
        </div>
      </button>
    `;
  }).join('');

  container.innerHTML = html;
  refreshLucideIcons();
}

function renderModalFramePicker(category = currentModalCategory, searchTerm = currentModalSearchTerm) {
  currentModalCategory = category;
  currentModalSearchTerm = (searchTerm || '').trim().toLowerCase();

  const container = document.querySelector('#modalFramePicker');
  const countEl = document.querySelector('#modalFrameCount');
  if (!container) return;

  const filtered = framesConfig.filter(f => {
    const matchCategory = (category === 'all' || f.category === category);
    if (!matchCategory) return false;
    if (!currentModalSearchTerm) return true;
    const labelLower = (f.label || '').toLowerCase();
    const idLower = (f.id || '').toLowerCase();
    const catLower = getCategoryBadgeLabel(f.category).toLowerCase();
    return labelLower.includes(currentModalSearchTerm) || idLower.includes(currentModalSearchTerm) || catLower.includes(currentModalSearchTerm);
  });

  if (countEl) {
    countEl.textContent = `${filtered.length} mẫu hiển thị`;
  }

  let html = '';

  if (state.customFrameUrl && (category === 'all' || !currentModalSearchTerm || 'khung riêng png'.includes(currentModalSearchTerm))) {
    const isCustomActive = state.frame === 'custom';
    html += `
      <div class="modal-frame-card ${isCustomActive ? 'active' : ''}" data-frame="custom">
        <div class="modal-frame-thumb" style="background-image: url('${state.customFrameUrl}') !important; background-size: cover !important;">
          ${isCustomActive ? '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>' : ''}
        </div>
        <strong class="modal-frame-name">Khung riêng PNG</strong>
        <span class="modal-frame-cat">Tùy biến</span>
      </div>
    `;
  }

  if (filtered.length === 0 && !html) {
    container.innerHTML = `
      <div class="frame-empty-search" style="grid-column: 1 / -1;">
        <i data-lucide="search-x" class="w-10 h-10 mx-auto text-stone-300 mb-2"></i>
        <p>Không tìm thấy mẫu khung nào với từ khóa "${escapeHtml(currentModalSearchTerm)}"</p>
        <small>Thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm</small>
      </div>
    `;
    refreshLucideIcons();
    return;
  }

  html += filtered.map(f => {
    const thumbnailAsset = f.assets && (f.assets[state.layout] || f.assets['4']);
    const isActive = f.id === state.frame;
    const bgStyle = thumbnailAsset
      ? `--frame-asset-thumbnail: url('${thumbnailAsset}');`
      : (f.color ? `background-color: ${f.color};` : '');

    return `
      <div class="modal-frame-card ${isActive ? 'active' : ''}" data-frame="${f.id}">
        <div class="modal-frame-thumb ${thumbnailAsset ? 'has-asset-thumbnail' : ''}" style="${bgStyle}">
          ${!thumbnailAsset ? `
            <div class="sim-strip-slots">
              <div class="sim-slot"></div>
              <div class="sim-slot"></div>
              <div class="sim-slot"></div>
            </div>
          ` : ''}
          ${isActive ? '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>' : ''}
        </div>
        <strong class="modal-frame-name">${escapeHtml(f.label)}</strong>
        <span class="modal-frame-cat">${getCategoryBadgeLabel(f.category)}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
  refreshLucideIcons();
}

function updateActiveFrameHeroCard(frameCfg) {
  const thumbEl = document.querySelector('#heroFrameThumb');
  const nameEl = document.querySelector('#heroFrameName');
  const catEl = document.querySelector('#heroFrameCategory');
  if (!thumbEl || !nameEl) return;

  if (state.frame === 'custom' && state.customFrameUrl) {
    thumbEl.style.backgroundImage = `url('${state.customFrameUrl}')`;
    thumbEl.style.backgroundColor = 'transparent';
    thumbEl.innerHTML = '';
    nameEl.textContent = 'Khung riêng PNG';
    if (catEl) catEl.textContent = 'Tùy biến';
    return;
  }

  const f = frameCfg || framesConfig.find(item => item.id === state.frame) || framesConfig[0];
  const thumbnailAsset = f.assets && (f.assets[state.layout] || f.assets['4']);

  if (thumbnailAsset) {
    thumbEl.style.backgroundImage = `url('${thumbnailAsset}')`;
    thumbEl.style.backgroundColor = 'transparent';
    thumbEl.innerHTML = '';
  } else {
    thumbEl.style.backgroundImage = 'none';
    thumbEl.style.backgroundColor = f.color || '#1B2430';
    thumbEl.innerHTML = `
      <div class="sim-strip-slots" style="width:60%; height:70%;">
        <div class="sim-slot" style="height:26%;"></div>
        <div class="sim-slot" style="height:26%;"></div>
      </div>
    `;
  }

  nameEl.textContent = f.label;
  if (catEl) catEl.textContent = getCategoryBadgeLabel(f.category);
}

function selectFrame(frameId) {
  state.frame = frameId;
  // Không tự động đổi bố cục người dùng đang chọn nữa (trước đây khung có
  // preferredLayout sẽ âm thầm ép đổi bố cục, gây bất ngờ). Giờ chỉ cập nhật
  // gợi ý nếu khung này chưa có thiết kế riêng cho bố cục hiện tại.
  renderLayoutPicker();

  // Update swatches in main tab
  document.querySelectorAll('#framePicker .frame-swatch').forEach(s => {
    const isTarget = s.dataset.frame === frameId;
    s.classList.toggle('active', isTarget);
    const existingBadge = s.querySelector('.frame-active-badge');
    if (isTarget) {
      if (!existingBadge) {
        const thumb = s.querySelector('.frame-thumb-box');
        if (thumb) thumb.insertAdjacentHTML('beforeend', '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>');
      }
    } else {
      if (existingBadge) existingBadge.remove();
    }
  });

  // Update swatches in modal if open
  document.querySelectorAll('#modalFramePicker .modal-frame-card').forEach(s => {
    const isTarget = s.dataset.frame === frameId;
    s.classList.toggle('active', isTarget);
    const existingBadge = s.querySelector('.frame-active-badge');
    if (isTarget) {
      if (!existingBadge) {
        const thumb = s.querySelector('.modal-frame-thumb');
        if (thumb) thumb.insertAdjacentHTML('beforeend', '<span class="frame-active-badge"><i data-lucide="check" class="w-2.5 h-2.5"></i> Đang chọn</span>');
      }
    } else {
      if (existingBadge) existingBadge.remove();
    }
  });

  // Trigger quick tactile visual feedback on preview
  stripPreview.classList.add('frame-changing');
  setTimeout(() => stripPreview.classList.remove('frame-changing'), 180);

  updateStripPreview();
  refreshLucideIcons();
}

function fitStripToViewport() {
  const viewport = document.querySelector('#stripViewport');
  const stripWrapper = document.querySelector('#stripWrapper');
  const strip = document.querySelector('#stripPreview');
  if (!viewport || !stripWrapper || !strip) return;

  if (!viewport.classList.contains('fit-mode')) {
    stripWrapper.style.transform = 'none';
    return;
  }

  // Fit the complete print in both directions. Layout 9 is wider than the
  // preview column, so height-only fitting clipped its third column.
  const viewportStyle = getComputedStyle(viewport);
  const availableW = viewport.clientWidth
    - parseFloat(viewportStyle.paddingLeft)
    - parseFloat(viewportStyle.paddingRight);
  const availableH = viewport.clientHeight
    - parseFloat(viewportStyle.paddingTop)
    - parseFloat(viewportStyle.paddingBottom);
  const stripW = strip.offsetWidth;
  const stripH = strip.offsetHeight;
  const scale = Math.min(1, availableW / stripW, availableH / stripH);

  if (scale < 1 && availableW > 150 && availableH > 150) {
    stripWrapper.style.transform = `scale(${scale.toFixed(3)})`;
  } else {
    stripWrapper.style.transform = 'none';
  }
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
  // Bind controls before any rendering/media work that may fail independently.
  // This keeps layout and frame selection usable even when an optional icon,
  // camera, or third-party AI dependency is unavailable.
  setupEventListeners();
  syncSlotAssignments();
  updateShootButtonLabel();
  initMediaPipe();
  startCamera();
  refreshLucideIcons();
}

window.addEventListener('DOMContentLoaded', initApp);
