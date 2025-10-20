// Entry point
const START_DATE = new Date(2023, 10, 20); // month is 0-based (11 = Nov). Provided example uses 2023-11-20

const els = {
  typing: document.getElementById('intro-typing'),
  music: /** @type {HTMLAudioElement} */ (document.getElementById('bg-music')),
  musicToggle: document.getElementById('music-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  timer: document.getElementById('love-timer'),
  motd: document.getElementById('motd'),
  timeline: document.getElementById('timeline'),
  form: document.getElementById('memory-form'),
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
  const minutes = Math.floor(diffMs / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes - days * 24 * 60) / 60);
  const mins = minutes % 60;
  els.timer.textContent = `Chúng ta đã bên nhau được ${days} ngày ${hours} giờ ${mins} phút 💞`;
  if (mins === 0 && hours === 0) pulseTitle();
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
/** @typedef {{ id:string; date:string; title:string; desc:string; photoData?:string }} Memory */
/** @returns {Memory[]} */
function readMemories() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
/** @param {Memory[]} data */
function writeMemories(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function renderTimeline() {
  const data = readMemories().sort((a,b) => (a.date > b.date ? -1 : 1));
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
    photoData = await readFileAsDataUrl(els.formPhoto.files[0]);
  }
  if (!date || !title) return;
  const record = { id: crypto.randomUUID(), date, title, desc, photoData };
  const data = readMemories();
  data.push(record);
  writeMemories(data);
  els.form.reset();
  renderTimeline();
});
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 7) Chatbot (rule-based)
const rules = [
  { q: /anh yêu em/i, a: 'Anh yêu em hơn cả thế giới này 💕' },
  { q: /hôm nay.*buồn/i, a: 'Đừng buồn nữa nhé, có anh ở đây 🥺' },
  { q: /nhớ em/i, a: 'Anh nhớ em nhiều lắm, Ly ơi 💞' },
  { q: /xin chào|hello|hi/i, a: 'Chào em yêu ✨' },
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
    els.specialText.textContent = text;
    els.specialPopup.removeAttribute('hidden');
  }
}
els.specialClose?.addEventListener('click', () => els.specialPopup.setAttribute('hidden', ''));

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
  applyDayNightByTime();
  typeText(els.typing, introText, 26);
  updateMotd();
  updateTimer();
  setInterval(updateTimer, 1000 * 30);
  renderTimeline();
  maybeSpecial();
  initThreeLily();
});


