const els = {
  status: document.getElementById('album-status'),
  code: document.getElementById('album-code'),
  pass: document.getElementById('album-pass'),
  file: document.getElementById('album-file'),
  upload: document.getElementById('album-upload'),
  track: document.getElementById('track'),
};

let cloud = null;
async function initCloud() {
  try {
    const cfg = await import('./assets/firebase-config.js');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js');
    const { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    let cloudinaryCfg = null; try { cloudinaryCfg = (await import('./assets/cloudinary-config.js')).cloudinaryConfig; } catch {}
    const app = initializeApp(cfg.firebaseConfig);
    const db = getFirestore(app);
    cloud = {
      async list(code) {
        const q = query(collection(db, 'album'), where('code','==',code), orderBy('createdAt','desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      },
      async add({ code, url }) {
        await addDoc(collection(db,'album'), { code, url, createdAt: serverTimestamp() });
      },
      async uploadToCloudinary(file) {
        const form = new FormData();
        const dataUrl = await fileToDataUrl(file);
        form.append('file', dataUrl);
        form.append('upload_preset', cloudinaryCfg.uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCfg.cloudName}/upload`, { method:'POST', body: form });
        const json = await res.json();
        return json.secure_url;
      }
    };
    els.status.textContent = 'Album: Firestore + Cloudinary';
  } catch {
    els.status.textContent = 'Album: Cloud chưa bật';
  }
}

function showSlides(items) {
  els.track.innerHTML = '';
  for (const it of items) {
    const slide = document.createElement('div');
    slide.className = 'slide';
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = it.url;
    slide.appendChild(img);
    els.track.appendChild(slide);
  }
}

els.upload.addEventListener('click', () => els.file.click());
els.file.addEventListener('change', async () => {
  const code = (els.code.value || '').trim();
  if (!cloud) return alert('Chưa bật cloud');
  if (!code) return alert('Nhập Mã album');
  const pass = els.pass.value;
  if (pass !== (localStorage.getItem('album-pass-'+code) || pass)) {
    // lần đầu lưu pass vào local để không hỏi lại trong phiên (chỉ trên máy up)
    localStorage.setItem('album-pass-'+code, pass);
  }
  if (!pass) return alert('Nhập mật khẩu upload');
  const f = els.file.files[0]; if (!f) return;
  try {
    const url = await cloud.uploadToCloudinary(f);
    await cloud.add({ code, url });
    alert('Đã tải lên');
    const list = await cloud.list(code);
    showSlides(list);
  } catch { alert('Upload thất bại'); }
});

els.code.addEventListener('change', async () => {
  const code = (els.code.value || '').trim();
  if (!cloud || !code) return;
  const list = await cloud.list(code);
  showSlides(list);
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

initCloud();


