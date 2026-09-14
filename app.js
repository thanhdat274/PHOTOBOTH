/**
 * Snapbox Studio — Korean Photobooth Application
 * Core features: Multi-shot photo pool, interactive slot assignment,
 * continuous shooting & retake, AI Selfie Segmentation, 300 DPI Export,
 * sound synthesis, custom frames, stickers & QR sharing.
 */

// ==================== APPLICATION STATE ====================
const state = {
  layout: '4', // '1', '2', '3', '4', '4-grid', '6', '8', '9'
  filter: 'none',
  frame: 'pink',
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
  { id: 'pink', label: 'Hồng Pastel', category: 'cute', color: '#ffc4cf' },
  { id: 'blue', label: 'Xanh Baby', category: 'cute', color: '#b9ddf8' },
  { id: 'lilac', label: 'Tím Lilac', category: 'cute', color: '#d8b4fe' },
  { id: 'cherry', label: 'Cherry', category: 'cute', color: '#ffb6c9' },
  { id: 'lemon', label: 'Lemon Butter', category: 'cute', color: '#fef08a' },
  { id: 'cloud', label: 'Cloud Blue', category: 'cute', color: '#bae6fd' },
  { id: 'heart', label: 'Sweet Heart', category: 'cute', color: '#fb7185' },
  { id: 'daisy', label: 'Bơ Daisy', category: 'cute', color: '#d9f99d' },
  { id: 'film', label: 'Classic Film', category: 'film', color: '#262626', textLight: true },
  { id: 'dark', label: 'Noir Black', category: 'film', color: '#171717', textLight: true },
  { id: 'denim', label: 'Blue Denim', category: 'film', color: '#3b82f6', textLight: true },
  { id: 'kodak', label: 'Kodak Red', category: 'film', color: '#facc15' },
  { id: 'oat', label: 'Be Kem Hàn', category: 'aesthetic', color: '#f3ece3' },
  { id: 'sage', label: 'Xanh Sage', category: 'aesthetic', color: '#d1e7dd' },
  { id: 'rose-gold', label: 'Rose Gold', category: 'aesthetic', color: '#fbcfe8' },
  { id: 'marble', label: 'White Clean', category: 'aesthetic', color: '#ffffff' },
  { id: 'neon', label: 'Neon Cyber', category: 'event', color: '#09090b', textLight: true },
  { id: 'wedding', label: 'Golden Wedding', category: 'event', color: '#fffbeb' },
  { id: 'party', label: 'Party Confetti', category: 'event', color: '#f97316', textLight: true },
  { id: 'spooky', label: 'Midnight Spooky', category: 'event', color: '#312e81', textLight: true },
  { id: 'holo', label: 'Holographic', category: 'kpop', color: '#a5f3fc' },
  { id: 'kpop-purple', label: 'Idol Purple', category: 'kpop', color: '#581c87', textLight: true }
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
const zoomRange = document.querySelector('#zoomRange');
const zoomValue = document.querySelector('#zoomValue');
const mirrorToggle = document.querySelector('#mirrorToggle');
const clearStickersBtn = document.querySelector('#clearStickersBtn');

// Canvas for AI segmentation
const segCanvas = document.createElement('canvas');
const segCtx = segCanvas.getContext('2d');

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
    shotStatus.textContent = 'Camera đã sẵn sàng! Tạo dáng tự tin rồi bấm Chụp nào ✦';
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

// Khởi tạo hoặc cập nhật kích thước mảng slots khi đổi layout
function syncSlotAssignments() {
  const targetCount = getTargetSlotCount();
  const newAssignments = new Array(targetCount).fill(null);

  // Giữ lại các ảnh đã gán trước đó nếu còn hợp lệ
  for (let i = 0; i < targetCount; i++) {
    if (state.slotAssignments[i] && state.photoPool.some(p => p.id === state.slotAssignments[i])) {
      newAssignments[i] = state.slotAssignments[i];
    }
  }

  state.slotAssignments = newAssignments;

  // Nếu còn ô trống và trong kho có ảnh chưa dùng -> tự động điền tiếp
  autoFillEmptySlots();

  // Đảm bảo activeSlotIndex nằm trong phạm vi hợp lệ
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

  // Thu thập các ảnh chưa được gán
  const assignedIds = new Set(state.slotAssignments.filter(Boolean));
  let poolIdx = 0;

  for (let slot = 0; slot < targetCount; slot++) {
    if (!state.slotAssignments[slot]) {
      // Tìm ảnh đầu tiên trong kho chưa được gán vào ô nào
      while (poolIdx < poolPhotos.length && assignedIds.has(poolPhotos[poolIdx].id)) {
        poolIdx++;
      }
      if (poolIdx < poolPhotos.length) {
        state.slotAssignments[slot] = poolPhotos[poolIdx].id;
        assignedIds.add(poolPhotos[poolIdx].id);
        poolIdx++;
      } else {
        // Nếu đã dùng hết ảnh khác nhau, lặp lại ảnh trong kho
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
    slotRequirementAlert.innerHTML = `
      <span>💡 Khung <b>${layoutCfg.label}</b> cần <b>${targetCount}</b> ảnh (kho hiện có ${poolCount} ảnh). Bạn có thể bấm <b>Chụp thêm ${needed} ảnh</b> nhé!</span>
    `;
    // Gợi ý số ảnh chụp cho đợt tiếp
    if ([1, 4, 6, 8, 10].includes(needed)) {
      shotsPerBatchSelect.value = String(needed);
      updateShootButtonLabel();
    }
  } else {
    slotRequirementAlert.hidden = true;
  }
}

// Render kho ảnh đã chụp
function renderPhotoPool() {
  poolCounter.textContent = `Đã chụp: ${state.photoPool.length} ảnh`;

  if (!state.photoPool.length) {
    photoPoolGrid.innerHTML = `
      <div class="empty-pool-hint">
        <span>📷</span> Chưa có ảnh nào. Hãy bấm <b>Bắt đầu chụp</b> để lưu nhiều kiểu pose dáng vào đây nhé!
      </div>
    `;
    return;
  }

  photoPoolGrid.innerHTML = state.photoPool.map((p, idx) => {
    // Kiểm tra ảnh này đang nằm ở slot nào
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
}

// Render dải ảnh theo từng ô (Slots)
function updateStripPreview() {
  const targetCount = getTargetSlotCount();

  stripPreview.className = `strip frame-${state.frame} layout-${state.layout}`;
  if (state.frame === 'custom' && state.customFrameUrl) {
    stripPreview.style.backgroundImage = `url('${state.customFrameUrl}')`;
    stripPreview.style.backgroundSize = 'cover';
  } else {
    stripPreview.style.backgroundImage = 'none';
  }

  // Cập nhật trạng thái slot indicator
  if (state.activeSlotIndex !== null && state.activeSlotIndex < targetCount) {
    slotStatusIndicator.textContent = `✦ Đang chọn Ô ${state.activeSlotIndex + 1} (Bấm ảnh trong kho để gán)`;
    slotStatusIndicator.style.background = 'var(--pink-soft)';
    slotStatusIndicator.style.color = 'var(--pink)';
  } else {
    slotStatusIndicator.textContent = 'Bấm vào ô để chọn ảnh';
    slotStatusIndicator.style.background = '#f1f5f9';
    slotStatusIndicator.style.color = '#64748b';
  }

  // Render slots HTML
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

  // Ngày giờ và stickers
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const stickersHtml = state.stickers.map(s => `
    <span class="placed-sticker" style="left:${s.x}%; top:${s.y}%; transform: translate(-50%, -50%);">${s.emoji}</span>
  `).join('');

  stripPreview.innerHTML = `
    <div class="strip-header">SNAPBOX STUDIO</div>
    <div class="strip-photos">${slotsHtml}</div>
    <div class="strip-footer">
      <div class="strip-caption">${escapeHtml(state.caption)}</div>
      ${state.showDate ? `<div class="strip-meta">${dateStr} • ${timeStr}</div>` : ''}
      ${state.showLogo ? `<div class="strip-meta">✦ LIFE 4 CUTS SEOUL ✦</div>` : ''}
    </div>
    <div class="strip-stickers-layer">${stickersHtml}</div>
  `;

  // Kiểm tra điều kiện bật nút tải ảnh (ít nhất 1 ảnh đã chọn)
  const filledCount = state.slotAssignments.filter(Boolean).length;
  const canExport = filledCount > 0;
  downloadBtn.disabled = !canExport;
  qrBtn.disabled = !canExport;
  printBtn.disabled = !canExport;
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

  const z = state.zoom;
  const sw = w / z;
  const sh = h / z;
  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;

  ctx.drawImage(liveCanvas, sx, sy, sw, sh, 0, 0, w, h);

  if (state.beautySmooth) {
    ctx.globalAlpha = 0.12;
    ctx.filter = 'blur(4px)';
    ctx.drawImage(liveCanvas, sx, sy, sw, sh, 0, 0, w, h);
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

// Chụp theo số lượng (Batch shooting)
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
    
    // Thêm vào kho ảnh (Photo Pool)
    state.photoPool.push(newPhoto);

    // Tự động gán vào ô trống nếu có
    const emptyIndex = state.slotAssignments.findIndex(id => id === null);
    if (emptyIndex !== -1) {
      state.slotAssignments[emptyIndex] = newPhoto.id;
      // Chuyển active slot sang ô trống kế tiếp
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

// Cập nhật label nút chụp
function updateShootButtonLabel() {
  const count = shotsPerBatchSelect.value;
  const isFirstTime = state.photoPool.length === 0;
  const actionText = isFirstTime ? 'BẮT ĐẦU CHỤP' : 'CHỤP THÊM';
  shootBtn.querySelector('span').textContent = `${actionText} (${count} TẤM)`;
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
  const frameCfg = framesConfig.find(f => f.id === state.frame);
  const frameColor = frameCfg ? frameCfg.color : '#ffc4cf';

  if (state.frame === 'custom' && state.customFrameUrl) {
    const customImg = await loadImage(state.customFrameUrl);
    ctx.drawImage(customImg, 0, 0, canvasW, canvasH);
  } else {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (state.frame === 'film') {
      ctx.lineWidth = 14; ctx.strokeStyle = '#eab308';
      ctx.strokeRect(10, 10, canvasW - 20, canvasH - 20);
    } else if (state.frame === 'neon') {
      ctx.lineWidth = 12; ctx.strokeStyle = '#a855f7';
      ctx.strokeRect(8, 8, canvasW - 16, canvasH - 16);
    }
  }

  // 2. Header
  ctx.fillStyle = frameCfg && frameCfg.textLight ? '#ffffff' : '#1f1a2e';
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
      // Empty placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(x, y, cellW, cellH);
    }
  }

  // 4. Footer & Caption
  const footerY = canvasH - bottomPad + 45;
  ctx.fillStyle = frameCfg && frameCfg.textLight ? '#ffffff' : '#1f1a2e';
  ctx.font = 'bold 26px "Nunito", sans-serif';
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
      colorDark: '#1f1a2e',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrcodeBox.innerHTML = '<p>Đang tải QR code...</p>';
  }
  qrModal.hidden = false;
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

  // 1. Chọn layout khung
  document.querySelector('#layoutPicker').addEventListener('click', e => {
    const btn = e.target.closest('[data-layout]');
    if (!btn || state.busy) return;
    state.layout = btn.dataset.layout;
    renderLayoutPicker();
    syncSlotAssignments();
  });

  // 2. Chọn frame & tabs
  document.querySelector('.frame-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-category]');
    if (!tab) return;
    document.querySelectorAll('.frame-tabs button').forEach(t => t.classList.toggle('active', t === tab));
    renderFramePicker(tab.dataset.category);
  });

  document.querySelector('#framePicker').addEventListener('click', e => {
    const swatch = e.target.closest('[data-frame]');
    if (!swatch) return;
    state.frame = swatch.dataset.frame;
    document.querySelectorAll('#framePicker .frame-swatch').forEach(s => s.classList.toggle('active', s === swatch));
    updateStripPreview();
  });

  // Tải khung riêng
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

  // 3. Chọn bộ lọc màu
  document.querySelector('#filterPicker').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    document.querySelectorAll('#filterPicker .filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    cameraViewport.className = `camera-viewport filter-${state.filter} ${state.mirror ? 'mirrored' : ''}`;
  });

  // 4. Chọn nền ảo & AI
  document.querySelector('.bg-category-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-cat]');
    if (!tab) return;
    document.querySelectorAll('.bg-category-tabs .bg-tab').forEach(t => t.classList.toggle('active', t === tab));
    renderBackgroundPicker(tab.dataset.cat);
  });

  document.querySelector('#backgroundPicker').addEventListener('click', e => {
    const swatch = e.target.closest('[data-bg]');
    if (!swatch) return;
    state.background = swatch.dataset.bg;
    document.querySelectorAll('#backgroundPicker .bg-swatch').forEach(s => s.classList.toggle('active', s === swatch));
    aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
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
        aiStatusBadge.classList.remove('off');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  aiSegToggle.addEventListener('change', e => {
    state.aiSegmentation = e.target.checked;
    aiStatusBadge.classList.toggle('off', !state.aiSegmentation || state.background === 'none');
  });

  // 5. Cài đặt camera & đếm ngược
  document.querySelector('#timerSelector').addEventListener('click', e => {
    const btn = e.target.closest('[data-time]');
    if (!btn) return;
    state.countdownTime = Number(btn.dataset.time);
    document.querySelectorAll('#timerSelector .timer-btn').forEach(b => b.classList.toggle('active', b === btn));
  });

  mirrorToggle.addEventListener('change', e => {
    state.mirror = e.target.checked;
    cameraViewport.classList.toggle('mirrored', state.mirror);
  });

  document.querySelector('#beautySmoothToggle').addEventListener('change', e => {
    state.beautySmooth = e.target.checked;
  });

  zoomRange.addEventListener('input', e => {
    state.zoom = Number(e.target.value);
    zoomValue.value = `${state.zoom.toFixed(1)}×`;
    cameraViewport.style.setProperty('--digital-zoom', state.zoom);
  });

  // 6. Chụp theo đợt hoặc chụp 1 tấm
  shotsPerBatchSelect.addEventListener('change', updateShootButtonLabel);
  
  shootBtn.addEventListener('click', () => {
    const count = Number(shotsPerBatchSelect.value) || 4;
    startShootingSequence(count);
  });

  shootSingleBtn.addEventListener('click', () => {
    startShootingSequence(1);
  });

  // 7. Kho ảnh đã chụp (Photo Pool) click handlers
  photoPoolGrid.addEventListener('click', e => {
    // Xóa ảnh khỏi kho
    const delBtn = e.target.closest('[data-delete-id]');
    if (delBtn) {
      e.stopPropagation();
      const delId = delBtn.dataset.deleteId;
      state.photoPool = state.photoPool.filter(p => p.id !== delId);
      // Gỡ khỏi slots nếu có dùng
      state.slotAssignments = state.slotAssignments.map(id => id === delId ? null : id);
      renderPhotoPool();
      updateStripPreview();
      updateRequirementAlert();
      return;
    }

    // Bấm vào ảnh để gán vào activeSlotIndex
    const card = e.target.closest('[data-photo-id]');
    if (!card) return;
    const photoId = card.dataset.photoId;

    const targetCount = getTargetSlotCount();
    if (state.activeSlotIndex !== null && state.activeSlotIndex < targetCount) {
      state.slotAssignments[state.activeSlotIndex] = photoId;
      
      // Tự động chuyển active slot sang ô trống kế tiếp (nếu có)
      const nextEmpty = state.slotAssignments.findIndex((id, idx) => id === null && idx > state.activeSlotIndex);
      if (nextEmpty !== -1) {
        state.activeSlotIndex = nextEmpty;
      } else {
        const anyEmpty = state.slotAssignments.findIndex(id => id === null);
        state.activeSlotIndex = anyEmpty !== -1 ? anyEmpty : (state.activeSlotIndex + 1) % targetCount;
      }
    } else {
      // Nếu chưa chọn slot nào, gán vào ô trống đầu tiên
      const firstEmpty = state.slotAssignments.findIndex(id => id === null);
      if (firstEmpty !== -1) {
        state.slotAssignments[firstEmpty] = photoId;
        state.activeSlotIndex = firstEmpty;
      } else {
        // Gán vào slot 0
        state.slotAssignments[0] = photoId;
        state.activeSlotIndex = 0;
      }
    }

    updateStripPreview();
    renderPhotoPool();
  });

  // 8. Tương tác từng ô (Slots) trên dải ảnh
  stripPreview.addEventListener('click', e => {
    // Gỡ ảnh khỏi ô
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

    // Bấm vào ô để kích hoạt (Active)
    const slotEl = e.target.closest('[data-slot-index]');
    if (!slotEl) return;
    state.activeSlotIndex = Number(slotEl.dataset.slotIndex);
    updateStripPreview();
  });

  // Tự động điền ảnh
  autoFillBtn.addEventListener('click', autoFillAllSlots);

  // 9. Trang trí chữ kỷ niệm, ngày tháng, logo
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

  // 10. Âm thanh & Xóa làm lại từ đầu
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggleBtn.classList.toggle('active', state.soundEnabled);
    soundToggleBtn.innerHTML = state.soundEnabled 
      ? '<span class="icon">🔊</span> Âm thanh: Bật'
      : '<span class="icon">🔇</span> Âm thanh: Tắt';
  });

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

  // 11. Nút xuất ảnh, QR & Print
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
      aria-label="Khung ${f.label}">
    </button>
  `).join('');

  if (state.customFrameUrl) {
    html = `
      <button class="frame-swatch frame-custom ${state.frame === 'custom' ? 'active' : ''}" 
        data-frame="custom" 
        data-label="Khung riêng" 
        style="background-image: url('${state.customFrameUrl}')">
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
}

window.addEventListener('DOMContentLoaded', initApp);
