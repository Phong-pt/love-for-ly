// Entry point
const START_DATE = new Date(2020, 5, 28, 0, 0, 0); // 28/06/2020 (month 5 = June)

const els = {
  typing: document.getElementById('intro-typing'),
  music: /** @type {HTMLAudioElement} */ (document.getElementById('bg-music')),
  musicToggle: document.getElementById('music-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  timer: document.getElementById('love-timer'),
  motd: document.getElementById('motd'),
  timeline: document.getElementById('timeline'),
  form: document.getElementById('memory-form'),
  addMemoryBtn: document.getElementById('add-memory-btn'),
  memoryPanel: document.getElementById('memory-panel'),
  memoryCancel: document.getElementById('memory-cancel'),
  openDiary: document.getElementById('open-diary'),
  diaryModal: document.getElementById('diary-modal'),
  diaryEditor: document.getElementById('diary-editor'),
  diaryCode: document.getElementById('diary-code'),
  diaryDate: document.getElementById('diary-date'),
  diaryPassword: document.getElementById('diary-password'),
  diaryUnlock: document.getElementById('diary-unlock'),
  diaryLock: document.getElementById('diary-lock'),
  diaryClose: document.getElementById('diary-close'),
  diaryLoadList: document.getElementById('diary-load-list'),
  diaryList: document.getElementById('diary-list'),
  formDate: document.getElementById('mem-date'),
  formTitle: document.getElementById('mem-title'),
  formPhoto: /** @type {HTMLInputElement} */ (document.getElementById('mem-photo')),
  formDesc: document.getElementById('mem-desc'),
  chatToggle: document.getElementById('chat-toggle'),
  chatPanel: document.getElementById('chat-panel'),
  chatLog: document.getElementById('chat-log'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  heartLayer: document.getElementById('heart-layer'),
  cloudStatus: document.getElementById('cloud-status'),
  cloudReload: document.getElementById('cloud-reload'),
  chatVisibility: document.getElementById('chat-visibility'),
  specialPopup: document.getElementById('special-popup'),
  specialText: document.getElementById('special-text'),
  specialClose: document.getElementById('special-close'),
  threeCanvas: /** @type {HTMLCanvasElement} */ (document.getElementById('three-canvas')),
  threeFallback: document.getElementById('three-fallback'),
};

// 1) Intro typing text
const introText = 'Website này Phạm Thế Phong viết để dành tặng cho người yêu — Vũ Hoàng Ly 💖\nMỗi dòng chữ, mỗi bông hoa, mỗi kỷ niệm đều là những điều anh muốn lưu giữ mãi.';
async function typeText(el, text, speed = 26) {
  el.textContent = '';
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await new Promise(r => setTimeout(r, speed));
  }
}

// 2) Music control
let musicEnabled = false;
els.musicToggle?.addEventListener('click', async () => {
  if (!musicEnabled) {
    try { await els.music.play(); musicEnabled = true; els.musicToggle.textContent = 'Tắt nhạc'; }
    catch { /* autoplay blocked */ }
  } else { els.music.pause(); musicEnabled = false; els.musicToggle.textContent = 'Bật nhạc'; }
});

// 3) Day/Night auto and manual toggle
function applyDayNightByTime() {
  const hour = new Date().getHours();
  const shouldNight = hour >= 19 || hour < 6;
  document.body.classList.toggle('night', shouldNight);
  ensureStarsLayer();
}
function ensureStarsLayer() {
  let stars = document.querySelector('.stars');
  if (!stars) {
    stars = document.createElement('div');
    stars.className = 'stars';
    document.body.appendChild(stars);
  }
}
els.themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('night');
  ensureStarsLayer();
});

// 4) Love Timer
function updateTimer() {
  const now = new Date();
  const diffMs = now.getTime() - START_DATE.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const remMins = minutes % 60;
  const remSecs = seconds % 60;
  els.timer.textContent = `Chúng ta đã bên nhau được ${days} ngày ${remHours} giờ ${remMins} phút ${remSecs} giây 💞`;
  if (remSecs === 0 && remMins === 0 && remHours === 0) pulseTitle();
}
function pulseTitle() {
  const node = document.querySelector('.title .sparkle');
  if (!node) return;
  node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-in-out' });
}

// 5) Daily message of the day
const messages = [
  'Hôm nay trời hồng như má em 💗',
  'Anh nhớ em, Ly ơi 💞',
  'Chúc em một ngày nhẹ như cánh hoa ly 🌸',
  'Mỗi ngày bên em là một điều kỳ diệu ✨',
  'Anh yêu em hơn cả thế giới này 💕',
];
function updateMotd() {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const pick = messages[dayIndex % messages.length];
  els.motd.textContent = pick;
}

// 6) Timeline with localStorage
const STORAGE_KEY = 'love-for-ly:timeline';
const DIARY_KEY = 'love-for-ly:diary';
let cloud = null; // will hold Firebase helpers if available
/** @typedef {{ id:string; date:string; title:string; desc:string; photoData?:string }} Memory */
/** @returns {Memory[]} */
function readMemories() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
/** @param {Memory[]} data */
function writeMemories(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
async function cloudInitIfAvailable() {
  // If assets/firebase-config.js exists and exports firebaseConfig, enable cloud sync
  try {
    const cfg = await import('./assets/firebase-config.js');
    if (!cfg?.firebaseConfig) return;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
    const { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    let storageApi = null;
    try {
      storageApi = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js');
    } catch {}
    // Optional Cloudinary config (free tier)
    let cloudinaryCfg = null;
    try { cloudinaryCfg = (await import('./assets/cloudinary-config.js')).cloudinaryConfig; } catch {}
    const app = initializeApp(cfg.firebaseConfig);
    const db = getFirestore(app);
    const st = storageApi ? storageApi.getStorage(app) : null;
    cloud = {
      async listMemories() {
        const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      async addMemory({ date, title, desc, photoData }) {
        let photoUrl = '';
        if (photoData) {
          if (cloudinaryCfg) {
            // Upload to Cloudinary unsigned preset (often free tier)
            const form = new FormData();
            form.append('file', photoData);
            form.append('upload_preset', cloudinaryCfg.uploadPreset);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCfg.cloudName}/upload`, { method: 'POST', body: form });
            const json = await res.json();
            photoUrl = json.secure_url || '';
          } else if (st && storageApi) {
            const key = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
            const r = storageApi.ref(st, key);
            await storageApi.uploadString(r, photoData, 'data_url');
            photoUrl = await storageApi.getDownloadURL(r);
          }
        }
        await addDoc(collection(db, 'memories'), { date, title, desc, photoUrl, createdAt: serverTimestamp() });
      },
      async addDiary({ code, date, cipher }) {
        await addDoc(collection(db, 'diaries'), { code, date, cipher, createdAt: serverTimestamp() });
      },
      async listDiariesByCode(code) {
        // Avoid composite index requirement: filter by code only, sort client-side
        const qy = query(collection(db, 'diaries'), where('code','==',code));
        const snap = await getDocs(qy);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return rows.sort((a,b) => {
          const ta = (a.createdAt && a.createdAt.toMillis) ? a.createdAt.toMillis() : new Date(a.date||0).getTime();
          const tb = (b.createdAt && b.createdAt.toMillis) ? b.createdAt.toMillis() : new Date(b.date||0).getTime();
          return tb - ta;
        });
      },
    };
    els.cloudStatus && (els.cloudStatus.textContent = cloudinaryCfg ? 'Đồng bộ: Firestore + Cloudinary' : (st ? 'Đồng bộ: Firestore + Storage' : 'Đồng bộ: Firestore (không ảnh cloud)'));
  } catch {
    // No cloud config found; stay local-only
    els.cloudStatus && (els.cloudStatus.textContent = 'Đồng bộ: localStorage');
  }
}
async function renderTimeline() {
  const localData = readMemories();
  let data = localData;
  if (cloud) {
    try {
      const cloudItems = await cloud.listMemories();
      // Prefer cloud completely if available
      data = cloudItems.map(m => ({ id: m.id, date: m.date, title: m.title, desc: m.desc, photoData: m.photoUrl || '' }));
    } catch (e) {
      console.warn('Cloud fetch failed, using local data', e);
    }
  }
  data = data.sort((a,b) => (a.date > b.date ? -1 : 1));
  els.timeline.innerHTML = '';
  for (const m of data) {
    const item = document.createElement('article');
    item.className = 'memory-item';
    item.tabIndex = 0;
    const date = document.createElement('div');
    date.className = 'memory-date';
    date.textContent = new Date(m.date).toLocaleDateString('vi-VN');
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'memory-title';
    title.textContent = m.title;
    const desc = document.createElement('p');
    desc.className = 'memory-desc';
    desc.textContent = m.desc || '';
    content.appendChild(title);
    content.appendChild(desc);
    item.appendChild(date);
    item.appendChild(content);
    if (m.photoData) {
      const mediaWrap = document.createElement('div');
      mediaWrap.className = 'memory-media';
      const img = document.createElement('img');
      img.className = 'memory-photo';
      img.src = m.photoData;
      img.alt = m.title;
      mediaWrap.appendChild(img);
      item.appendChild(mediaWrap);
    }
    item.addEventListener('mouseenter', () => item.animate([{ boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }, { boxShadow: '0 12px 28px rgba(255,51,102,0.25)' }], { duration: 300, fill: 'forwards' }));
    els.timeline.appendChild(item);
  }
}
els.form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = els.formDate.value;
  const title = els.formTitle.value.trim();
  const desc = els.formDesc.value.trim();
  let photoData = '';
  if (els.formPhoto.files && els.formPhoto.files[0]) {
    photoData = await readAndCompressImage(els.formPhoto.files[0], { maxSize: 1024, quality: 0.7 });
  }
  if (!date || !title) return;
  const record = { id: crypto.randomUUID(), date, title, desc, photoData };
  const data = readMemories();
  data.push(record);
  try {
    writeMemories(data);
    showToast('Đã lưu kỷ niệm 💖');
  } catch (err) {
    showToast('Không lưu được: ảnh quá lớn hoặc bộ nhớ trình duyệt đầy. Hãy chọn ảnh nhỏ hơn.');
    // revert push on failure
    data.pop();
  }
  // Also attempt to sync to cloud
  if (cloud) {
    try { await cloud.addMemory(record); } catch { showToast('Không đồng bộ được lên cloud (tạm thời).'); }
  }
  els.form.reset();
  renderTimeline();
});
async function readAndCompressImage(file, { maxSize = 1024, quality = 0.8 } = {}) {
  // If not an image, return empty
  if (!file || !file.type.startsWith('image/')) return '';
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return await fileToDataUrl(file); // fallback
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.round(bitmap.width * scale);
  const targetH = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  const type = file.type.includes('png') ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(type, quality);
  try { bitmap.close && bitmap.close(); } catch {}
  return dataUrl;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Toast notification
function showToast(message) {
  let host = document.getElementById('toast-host');
  if (!host) { host = document.createElement('div'); host.id = 'toast-host'; host.style.position = 'fixed'; host.style.bottom = '16px'; host.style.left = '50%'; host.style.transform = 'translateX(-50%)'; host.style.zIndex = '100'; host.style.display = 'grid'; host.style.gap = '8px'; document.body.appendChild(host); }
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.background = '#ff3366';
  toast.style.color = '#fff';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity .2s ease, transform .2s ease';
  host.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(-4px)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(0)'; setTimeout(() => toast.remove(), 200); }, 2400);
}

// 7) Chatbot (rule-based)
const rules = [
  { q: /(ai viết bot|ai tạo bot|bot.*ai làm)/i, a: 'Phạm Thế Phong tự tay viết tặng Vũ Hoàng Ly 💖' },
  { q: /(bạn yêu ai|bot yêu ai|yêu ai nhất)/i, a: 'Trái tim này thuộc về Vũ Hoàng Ly mãi mãi 💘' },
  { q: /(anh có yêu em không|anh yêu em không|anh có yêu ly không)/i, a: 'Anh yêu em hơn cả thế giới này 💕' },
  { q: /(em có yêu anh không|em có yêu ảnh không)/i, a: 'Em yêu anh chứ! Vì anh luôn dịu dàng và chân thành ✨' },
  { q: /(hôm nay.*buồn|em buồn|mệt quá)/i, a: 'Đừng buồn nữa nhé, có anh ở đây ôm em nè 🥺💗' },
  { q: /(nhớ em|anh nhớ em|nhơ em)/i, a: 'Anh nhớ em nhiều lắm, Ly ơi 💞' },
  { q: /(nhớ anh|em nhớ anh)/i, a: 'Anh ở đây nè, lúc nào cũng cạnh em 🤗' },
  { q: /(chúc ngủ ngon|ngủ ngon)/i, a: 'Ngủ thật ngon nhé cô gái của anh 🌙💤' },
  { q: /(chúc buổi sáng|buổi sáng vui vẻ|good morning)/i, a: 'Buổi sáng hồng như má em! Chúc em một ngày dịu dàng 🌷' },
  { q: /(xin chào|hello|hi|chào)/i, a: 'Chào em yêu ✨ Anh đây!' },
  { q: /(yêu|love)/i, a: 'Yêu em ngập tràn, như hoa ly nở rộ 💐' },
];
function reply(text) {
  for (const r of rules) if (r.q.test(text)) return r.a;
  return 'Anh luôn ở đây để lắng nghe em 💗';
}
function appendMsg(kind, text) {
  const div = document.createElement('div');
  div.className = `msg ${kind}`;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}
els.chatToggle?.addEventListener('click', () => {
  const isHidden = els.chatPanel.hasAttribute('hidden');
  if (isHidden) els.chatPanel.removeAttribute('hidden'); else els.chatPanel.setAttribute('hidden', '');
});
els.chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  appendMsg('user', text);
  setTimeout(() => appendMsg('bot', reply(text)), 250);
  els.chatInput.value = '';
});

// 8) Click hearts
window.addEventListener('click', (e) => {
  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.textContent = '❤';
  heart.style.left = e.clientX + 'px';
  heart.style.top = e.clientY + 'px';
  heart.style.fontSize = (14 + Math.random() * 14) + 'px';
  els.heartLayer.appendChild(heart);
  setTimeout(() => heart.remove(), 1400);
});

// 9) Special dates
function maybeSpecial() {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const isValentine = day === 14 && month === 2;
  const isWomenVN = day === 20 && month === 10;
  const isWomenWorld = day === 8 && month === 3;
  const lyBirthday = false; // set later if known
  let text = '';
  if (isValentine) text = 'Chúc mừng Valentine 14/2 💘 — Anh yêu em nhiều lắm!';
  else if (isWomenWorld) text = 'Mừng 8/3 🌹 — Chúc cô gái xinh đẹp của anh luôn rực rỡ!';
  else if (isWomenVN) text = 'Chúc mừng ngày 20/10, cô gái xinh đẹp của anh 🌹 — Anh yêu em nhiều lắm!';
  else if (lyBirthday) text = 'Chúc mừng sinh nhật em yêu 🎂✨';
  if (text) {
    try { if (window.confettiBurst) window.confettiBurst(); } catch {}
    // Popup đã được loại bỏ: chỉ hiển thị confetti, không mở hộp thoại
  }
}
// Popup đã bỏ, không cần handler đóng

// 10) Three.js lily (deferred, graceful fallback)
async function initThreeLily() {
  try {
    const [THREE, { GLTFLoader }] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'),
      import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js'),
    ]);
    const renderer = new THREE.WebGLRenderer({ canvas: els.threeCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(els.threeCanvas.clientWidth, els.threeCanvas.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, els.threeCanvas.clientWidth / els.threeCanvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 3.2);
    const light = new THREE.PointLight(0xffffff, 1.2, 100);
    light.position.set(2, 3, 4);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    scene.add(light);
    const loader = new GLTFLoader();
    loader.load('assets/flower.glb', (gltf) => {
      const model = gltf.scene;
      model.rotation.y = 0.3;
      scene.add(model);
      function animate() {
        model.rotation.y += 0.003;
        light.intensity = 1.1 + Math.sin(performance.now() / 900) * 0.1;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();
    }, undefined, () => {
      els.threeFallback.removeAttribute('hidden');
    });
    window.addEventListener('resize', () => {
      const w = els.threeCanvas.clientWidth, h = els.threeCanvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    });
    els.threeCanvas.addEventListener('click', () => {
      // bloom-like pulse
      els.threeCanvas.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }], { duration: 500, easing: 'ease-in-out' });
    });
  } catch (e) {
    els.threeFallback.removeAttribute('hidden');
  }
}

// 11) Sparkle on title hover
const titleSpan = document.querySelector('.title .sparkle');
titleSpan?.addEventListener('mousemove', (e) => {
  const rect = titleSpan.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
  const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
  titleSpan.style.textShadow = `${-x}px ${y}px 18px rgba(255,51,102,0.5)`;
});
titleSpan?.addEventListener('mouseleave', () => { titleSpan.style.textShadow = ''; });

// 12) Init all
window.addEventListener('DOMContentLoaded', async () => {
  await cloudInitIfAvailable();
  // Force-remove legacy special popup if any cached markup still exists
  const legacyPopup = document.getElementById('special-popup');
  if (legacyPopup) legacyPopup.remove();

  applyDayNightByTime();
  typeText(els.typing, introText, 26);
  updateMotd();
  updateTimer();
  setInterval(updateTimer, 1000);
  renderTimeline();
  maybeSpecial();
  initThreeLily();
  els.cloudReload?.addEventListener('click', () => renderTimeline());
  // Chatbot visibility toggle uses the 'hidden' attribute to avoid CSS conflicts
  const chatBox = document.getElementById('chatbot');
  if (chatBox && els.chatVisibility) {
    // init label
    els.chatVisibility.textContent = chatBox.hasAttribute('hidden') ? 'Hiện Chatbot' : 'Ẩn Chatbot';
    els.chatVisibility.addEventListener('click', () => {
      const isHidden = chatBox.hasAttribute('hidden');
      if (isHidden) chatBox.removeAttribute('hidden'); else chatBox.setAttribute('hidden', '');
      els.chatVisibility.textContent = isHidden ? 'Ẩn Chatbot' : 'Hiện Chatbot';
    });
  }
  // If the header button isn't present (cache/deploy cũ), add một nút nổi
  if (!els.cloudReload) {
    const fab = document.createElement('button');
    fab.id = 'cloud-reload-fab';
    fab.textContent = 'Đồng bộ';
    fab.className = 'btn';
    fab.style.position = 'fixed';
    fab.style.right = '16px';
    fab.style.bottom = '84px';
    fab.style.zIndex = '60';
    document.body.appendChild(fab);
    fab.addEventListener('click', async () => {
      await renderTimeline();
      showToast('Đã tải lại từ cloud');
    });
  }
  // Toggle add memory panel
  els.addMemoryBtn?.addEventListener('click', () => els.memoryPanel?.classList.toggle('hidden'));
  els.memoryCancel?.addEventListener('click', () => els.memoryPanel?.classList.add('hidden'));

  // Diary modal toggle
  els.openDiary?.addEventListener('click', () => els.diaryModal?.classList.remove('hidden'));
  els.diaryClose?.addEventListener('click', () => els.diaryModal?.classList.add('hidden'));
  els.diaryUnlock?.addEventListener('click', async () => {
    const pass = els.diaryPassword.value;
    const enc = localStorage.getItem(DIARY_KEY);
    if (!enc) { els.diaryEditor.value = ''; showToast('Chưa có nhật ký.'); return; }
    try { els.diaryEditor.value = await decryptDiary(enc, pass); showToast('Đã mở nhật ký'); }
    catch { showToast('Mật khẩu sai hoặc dữ liệu hỏng'); }
  });
  els.diaryLock?.addEventListener('click', async () => {
    const pass = els.diaryPassword.value;
    if (!pass) { showToast('Nhập mật khẩu để khóa'); return; }
    const text = els.diaryEditor.value;
    const enc = await encryptDiary(text, pass);
    localStorage.setItem(DIARY_KEY, enc);
    showToast('Đã khóa & lưu nhật ký');
    // Optional cloud save: need code and date
    if (cloud && els.diaryCode.value) {
      const date = els.diaryDate.value || new Date().toISOString().slice(0,10);
      try { await cloud.addDiary({ code: els.diaryCode.value.trim(), date, cipher: enc }); showToast('Đã đồng bộ nhật ký'); } catch {}
    }
  });
  // Load diary list by code
  els.diaryLoadList?.addEventListener('click', async () => {
    if (!cloud) { showToast('Chưa bật cloud'); return; }
    const code = els.diaryCode.value.trim();
    if (!code) { showToast('Nhập mã nhật ký'); return; }
    try {
      const entries = await cloud.listDiariesByCode(code);
      els.diaryList.innerHTML = '';
      for (const d of entries) {
        const item = document.createElement('div');
        item.className = 'diary-item';
        item.textContent = `${d.date || ''} — ghi chú`;
        item.addEventListener('click', async () => {
          const pass = els.diaryPassword.value;
          if (!pass) { showToast('Nhập mật khẩu để mở'); return; }
          try { els.diaryEditor.value = await decryptDiary(d.cipher, pass); showToast('Đã mở từ cloud'); }
          catch { showToast('Mật khẩu sai'); }
        });
        els.diaryList.appendChild(item);
      }
      if (!entries.length) showToast('Chưa có trang nào');
    } catch { showToast('Không tải được danh sách'); }
  });
});

// Fallback event delegation in case elements were not present at bind time (e.g., cached HTML)
document.addEventListener('click', (e) => {
  const t = /** @type {HTMLElement} */ (e.target);
  if (!t) return;
  if (t.id === 'add-memory-btn') {
    const panel = document.getElementById('memory-panel');
    panel && panel.classList.toggle('hidden');
  }
  if (t.id === 'memory-cancel') {
    const panel = document.getElementById('memory-panel');
    panel && panel.classList.add('hidden');
  }
  if (t.id === 'open-diary') {
    const modal = document.getElementById('diary-modal');
    modal && modal.classList.remove('hidden');
  }
  if (t.id === 'diary-close') {
    const modal = document.getElementById('diary-modal');
    modal && modal.classList.add('hidden');
  }
});

// Diary crypto using AES-GCM
async function encryptDiary(plainText, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
  const out = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  out.set(salt, 0); out.set(iv, salt.length); out.set(new Uint8Array(cipher), salt.length + iv.length);
  return btoa(String.fromCharCode(...out));
}
async function decryptDiary(b64, password) {
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = bin.slice(0,16); const iv = bin.slice(16, 28); const data = bin.slice(28);
  const enc = new TextEncoder(); const dec = new TextDecoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(plain);
}


