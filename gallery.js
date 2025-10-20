const els = {
  status: document.getElementById('album-status'),
  code: document.getElementById('album-code'),
  load: document.getElementById('album-load'),
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
        // Avoid composite index: filter by code only, sort client-side
        const q = query(collection(db, 'album'), where('code','==',code));
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return rows.sort((a,b) => {
          const ta = (a.createdAt && a.createdAt.toMillis) ? a.createdAt.toMillis() : new Date().getTime();
          const tb = (b.createdAt && b.createdAt.toMillis) ? b.createdAt.toMillis() : new Date().getTime();
          return tb - ta;
        });
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
    localStorage.setItem('album-pass-'+code, pass);
  }
  if (!pass) return alert('Nhập mật khẩu upload');
  const f = els.file.files[0]; if (!f) return;
  
  els.upload.textContent = 'Đang upload...';
  els.upload.disabled = true;
  
  try {
    // Step 1: Upload to Cloudinary
    els.status.textContent = 'Album: Đang upload ảnh...';
    const url = await cloud.uploadToCloudinary(f);
    
    // Step 2: Save to Firestore
    els.status.textContent = 'Album: Đang lưu thông tin...';
    await cloud.add({ code, url });
    
    // Step 3: Reload album
    els.status.textContent = 'Album: Đang tải lại...';
    const list = await cloud.list(code);
    showSlides(list);
    
    alert('Upload thành công!');
    els.status.textContent = `Album: ${list.length} ảnh`;
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload thất bại: ' + (err.message || 'Lỗi không xác định'));
    els.status.textContent = 'Album: Upload thất bại';
  } finally {
    els.upload.textContent = 'Upload ảnh';
    els.upload.disabled = false;
  }
});

// Load album button
els.load.addEventListener('click', async () => {
  const code = (els.code.value || '').trim();
  if (!cloud || !code) return alert('Nhập mã album');
  try {
    const list = await cloud.list(code);
    showSlides(list);
    els.status.textContent = `Album: ${list.length} ảnh`;
  } catch { 
    els.status.textContent = 'Album: Lỗi tải';
    alert('Không tải được album');
  }
});

// Auto-load on Enter key
els.code.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    els.load.click();
  }
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


