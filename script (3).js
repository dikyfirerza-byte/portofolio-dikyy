(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => { if (/^proyek\/[\w.-]+\.html$/.test(u)) return u; try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };

  /* ---------- Penyimpanan lokal (hanya di browser ini) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('dky_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('dky_' + k, JSON.stringify(v)); return true; } catch { toast('Penyimpanan browser penuh, coba foto yang lebih kecil.'); return false; } },
    del(k) { try { localStorage.removeItem('dky_' + k); } catch {} }
  };

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3800);
  }

  /* ---------- Navbar ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  const links = $$('#menu a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));
  }

  /* ---------- Reveal saat scroll ---------- */
  function observeReveal() {
    const els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    els.forEach(e => io.observe(e));
  }
  observeReveal();

  /* ---------- Efek: kanvas partikel ---------- */
  const cv = $('#bg'), cx = cv.getContext('2d');
  let W, H, pts = [], raf = 0, mouse = { x: -999, y: -999 };
  function sizeCanvas() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
    const n = W < 700 ? 34 : Math.min(85, Math.floor(W / 17));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .4 }));
  }
  function frame() {
    cx.clearRect(0, 0, W, H);
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 12100) { const d = Math.sqrt(d2) || 1; p.x += dx / d * 1.4; p.y += dy / d * 1.4; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fillStyle = 'rgba(205,205,218,.55)'; cx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 14400) { cx.strokeStyle = `rgba(160,160,175,${(1 - Math.sqrt(d2) / 120) * .28})`; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
    }
    raf = requestAnimationFrame(frame);
  }
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener('mouseout', () => { mouse.x = mouse.y = -999; });
  addEventListener('resize', () => { if (fx) sizeCanvas(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (fx && !raf) frame();
  });

  /* ---------- Efek ketik pada tagline ---------- */
  const words = ['Web Development', 'Python', 'UI/UX', 'Sistem Informasi'];
  const typed = $('#typed'); let wi = 0, ci = words[0].length, del = false, typeT;
  function typeLoop() {
    if (!fx) return;
    const w = words[wi];
    typed.textContent = w.slice(0, ci);
    if (!del && ci === w.length) { del = true; typeT = setTimeout(typeLoop, 1400); return; }
    if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; }
    ci += del ? -1 : 1;
    typeT = setTimeout(typeLoop, del ? 40 : 85);
  }

  /* ---------- Tombol efek / edit ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fx = store.get('fx', !reduce);
  const fxBtn = $('#fxBtn');
  function applyFx() {
    document.body.classList.toggle('no-fx', !fx);
    fxBtn.setAttribute('aria-pressed', fx);
    cancelAnimationFrame(raf); raf = 0; clearTimeout(typeT);
    if (fx) { sizeCanvas(); frame(); typeLoop(); }
    else { cx.clearRect(0, 0, cv.width, cv.height); typed.textContent = words[0]; }
  }
  fxBtn.addEventListener('click', () => { fx = !fx; store.set('fx', fx); applyFx(); toast(fx ? 'Animasi dinyalakan' : 'Animasi dimatikan (lebih ringan)'); });
  applyFx();


  /* ---------- Foto profil ---------- */
  const photoImg = $('#profilePhoto'), photoWrap = $('#photoWrap');
  photoImg.addEventListener('load', () => photoWrap.classList.remove('empty'));
  photoImg.addEventListener('error', () => photoWrap.classList.add('empty'));
  photoImg.src ='assets/foto1.png';

  /* ---------- Koleksi: proyek, kegiatan, galeri ---------- */
  const wolfIcon = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#wolf"/></svg>';
  const thumb = img => `<div class="thumb">${img ? `<img src="${img}" alt="" loading="lazy">` : wolfIcon}</div>`;
  const delBtn = () => '';
  const fmtDate = d => { if (!d) return ''; const x = new Date(d + 'T00:00:00'); return isNaN(x) ? '' : x.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); };

  const collections = {
    projects: {
      list: '#projectList', empty: '#projectEmpty',
      // Proyek bawaan. Tambahkan proyek tetap lain di sini jika mau.
      defaults: [{
        id: 'd-web', title: 'Website Portofolio Pribadi',
        desc: 'Website profil pribadi responsif dengan animasi serigala hitam, pemutar musik, dan galeri. Dibuat dengan HTML, CSS, dan JavaScript di VS Code.',
        tags: 'HTML, CSS, JavaScript', link: 'https://github.com/dikyfirerza-byte', img: ''
      }, {
        id: 'd-login', title: 'Halaman Login',
        desc: 'Halaman login responsif dengan form email/username dan kata sandi, opsi ingat saya, serta tautan daftar. Dibuat dengan HTML dan CSS.',
        tags: 'HTML, CSS, Form', link: 'proyek/login.html', demo: 'login', img: ''
      }, {
        id: 'd-flappy', title: 'Game Flappy Bird',
        desc: 'Game Flappy Bird yang bisa dimainkan lewat tombol Spasi atau klik layar, lengkap dengan skor dan skor terbaik. Dibuat dengan HTML Canvas dan JavaScript.',
        tags: 'HTML, CSS, JavaScript, Canvas', link: 'proyek/flappy-bird.html', demo: 'flappy', img: ''
      }, {
        id: 'd-kalkulator', title: 'Kalkulator (Python Tkinter)',
        desc: 'Aplikasi kalkulator desktop dengan antarmuka grafis Tkinter: layar angka, tombol 0-9, operator + - * /, dan tombol hapus (C). Dibuat dengan Python; demo web-nya meniru tampilan aslinya.',
        tags: 'Python, Tkinter, GUI', link: '', demo: 'kalkulator', code: 'kalkulator', img: ''
      }],
      card(it, def) {
        const link = safeUrl(it.link);
        const code = it.code && window.CODES && window.CODES[it.code];
        const demo = it.demo && window.DEMOS && window.DEMOS[it.demo];
        const tags = (it.tags || '').split(',').map(t => t.trim()).filter(Boolean);
        return `<article class="item reveal">${delBtn(it, def)}${thumb(it.img)}<div class="body">
          <h4>${esc(it.title)}</h4><p>${esc(it.desc)}</p>
          ${tags.length ? `<div class="tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
          ${demo && code ? `<div class="acts"><button class="go demo-btn" type="button" data-demo="${esc(it.demo)}" data-title="${esc(it.title)}">Buka demo &rarr;</button><button class="go code-btn" type="button" data-code="${esc(it.code)}" data-title="${esc(it.title)}">Lihat kode &rarr;</button></div>`
            : code ? `<button class="go code-btn" type="button" data-code="${esc(it.code)}" data-title="${esc(it.title)}">Lihat kode &rarr;</button>`
            : demo ? `<button class="go demo-btn" type="button" data-demo="${esc(it.demo)}" data-title="${esc(it.title)}">Buka demo &rarr;</button>`
            : link ? `<a class="go" href="${esc(link)}" target="_blank" rel="noopener">Buka proyek &rarr;</a>` : ''}</div></article>`;
      }
    },
    kegiatan: {
      list: '#kegiatanList', empty: '#kegiatanEmpty', defaults: [],
      card(it, def) {
        const link = safeUrl(it.link);
        const meta = [it.speaker && 'Narasumber: ' + esc(it.speaker), fmtDate(it.date)].filter(Boolean).join(' &middot; ');
        return `<article class="item reveal">${delBtn(it, def)}${thumb(it.img)}<div class="body">
          ${meta ? `<span class="meta">${meta}</span>` : ''}<h4>${esc(it.title)}</h4>
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
          ${link ? `<a class="go" href="${esc(link)}" target="_blank" rel="noopener">Buka materi &rarr;</a>` : ''}</div></article>`;
      }
    },
    galeri: {
      list: '#galeriList', empty: '#galeriEmpty', defaults: [],
      card(it, def) {
        return `<figure class="shot reveal" data-src="${esc(it.img)}" data-cap="${esc(it.caption || it.cat)}">${delBtn(it, def)}
          <img src="${esc(it.img)}" alt="${esc(it.caption || 'Foto dokumentasi')}" loading="lazy">
          <figcaption><small>${esc(it.cat)}</small>${esc(it.caption)}</figcaption></figure>`;
      }
    }
  };

  function renderCol(key) {
    const c = collections[key];
    const all = c.defaults.map(d => [d, true]);
    $(c.list).innerHTML = all.map(([it, def]) => c.card(it, def)).join('');
    $(c.empty).hidden = all.length > 0;
  }
  function renderAll() { Object.keys(collections).forEach(renderCol); observeReveal(); }

  Object.values(collections).forEach(c => {
    $(c.list).addEventListener('click', e => {
      const d = e.target.closest('.demo-btn');
      if (d) { openDemo(d.dataset.demo, d.dataset.title); return; }
      const cb = e.target.closest('.code-btn');
      if (cb) { openCode(cb.dataset.code, cb.dataset.title); return; }
      const shot = e.target.closest('.shot');
      if (shot) { const lb = $('#lightbox'); $('img', lb).src = shot.dataset.src; $('p', lb).textContent = shot.dataset.cap; lb.showModal(); }
    });
  });
  /* ---------- Demo proyek (jendela pop-up) ---------- */
  const dlg = $('#demoDlg'), demoFrame = $('#demoFrame');
  function openDemo(id, title) {
    const b64 = window.DEMOS && window.DEMOS[id]; if (!b64) { toast('Demo tidak ditemukan'); return; }
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    $('#demoTitle').textContent = title;
    demoFrame.srcdoc = new TextDecoder().decode(bytes);
    dlg.showModal();
  }
  demoFrame.addEventListener('load', () => { try { demoFrame.contentWindow.focus(); } catch {} });
  const closeDemo = () => { dlg.close(); demoFrame.srcdoc = ''; };
  $('#demoClose').addEventListener('click', closeDemo);
  dlg.addEventListener('cancel', () => { demoFrame.srcdoc = ''; });
  $('#lbClose').addEventListener('click', () => $('#lightbox').close());
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.close(); });
  renderAll();

  /* ---------- Form kontak ---------- */
  $('#contactForm').addEventListener('click', e => {
    const b = e.target.closest('[data-send]'); if (!b) return;
    const f = $('#contactForm').elements, name = f.name.value.trim(), msg = f.msg.value.trim(), mail = f.email.value.trim();
    if (!name || !msg) { toast('Isi nama dan pesan dulu ya'); return; }
    if (b.dataset.send === 'wa') {
      const t = `Halo Diky, saya ${name}.\n\n${msg}` + (mail ? `\n\nEmail saya: ${mail}` : '');
      window.open('https://wa.me/6283152472776?text=' + encodeURIComponent(t), '_blank', 'noopener');
    } else {
      const body = `${msg}\n\nDari: ${name}` + (mail ? ` (${mail})` : '');
      location.href = 'mailto:dikyfirerza@gmail.com?subject=' + encodeURIComponent('Pesan dari ' + name + ' (portofolio)') + '&body=' + encodeURIComponent(body);
    }
  });

  /* ---------- Lihat kode (proyek Python) ---------- */
  const codeDlg = $('#codeDlg');
  let codeCur = { id: '', text: '' };
  function openCode(id, title) {
    const text = window.CODES && window.CODES[id];
    if (!text) { toast('Kode tidak ditemukan'); return; }
    codeCur = { id, text };
    $('#codeTitle').textContent = title;
    $('#codeBody').textContent = text;
    codeDlg.showModal();
  }
  $('#codeClose').addEventListener('click', () => codeDlg.close());
  codeDlg.addEventListener('click', e => { if (e.target === codeDlg) codeDlg.close(); });
  $('#codeCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(codeCur.text); toast('Kode disalin'); }
    catch { toast('Gagal menyalin, blok kodenya lalu salin manual'); }
  });
  $('#codeDl').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([codeCur.text], { type: 'text/x-python' }));
    a.download = codeCur.id + '.py'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* ---------- Musik ---------- */
  // Lagu bawaan untuk SEMUA pengunjung: taruh file mp3 di folder yang sama dengan HTML ini,
  // lalu tulis namanya di sini (huruf besar/kecil harus sama persis).
  const SITE_TRACKS = [
    { name: 'Musik 1', src: 'musik1.mp3' }
    // , { name: 'Lagu lain', src: 'lagu2.mp3' }
  ];
  // Lagu yang diunggah lewat tombol "Unggah lagu" disimpan di IndexedDB (hanya di browser ini).

  const AUDIO_RE = /\.(mp3|m4a|wav|ogg|oga|opus|aac|flac|weba|webm|mp4)$/i;
  const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', weba: 'audio/webm', webm: 'audio/webm' };
  const mimeOf = f => (f.type && f.type.startsWith('audio/')) ? f.type : (MIME[(f.name.split('.').pop() || '').toLowerCase()] || 'audio/mpeg');

  const bgm = $('#bgm'), musicBtn = $('#musicBtn'), vol = $('#vol');
  const panel = $('#playlist'), listBtn = $('#listBtn'), trackUl = $('#trackList'), nowEl = $('#nowPlaying');
  let tracks = [], cur = -1, dbp = null;

  vol.value = store.get('vol', 0.5);
  bgm.volume = +vol.value;
  vol.addEventListener('input', () => { bgm.volume = +vol.value; store.set('vol', +vol.value); });

  /* Unggah musik: true = semua pengunjung boleh menambah lagu (tersimpan di browser masing-masing),
     false = tombol unggah disembunyikan kecuali di browser pemilik (buka alamat dengan #owner). */
  const PUBLIK_BOLEH_UNGGAH = true;
  if (location.hash === '#owner' || location.hash === '#visitor') {
    store.set('owner', location.hash === '#owner');
    history.replaceState(null, '', location.pathname + location.search);
  }
  const owner = PUBLIK_BOLEH_UNGGAH || store.get('owner', false) === true;
  $('#ownerTools').hidden = !owner;

  /* IndexedDB */
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB tidak tersedia'));
      const rq = indexedDB.open('dky_music', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    return dbp;
  }
  const tx = (mode, fn) => openDB().then(db => new Promise((res, rej) => {
    const t = db.transaction('tracks', mode), r = fn(t.objectStore('tracks'));
    t.oncomplete = () => res(r.result);
    t.onerror = t.onabort = () => rej(t.error);
  }));

  /* Daftar lagu */
  function renderList() {
    const playing = !bgm.paused;
    trackUl.innerHTML = tracks.length ? tracks.map((t, i) =>
      `<li class="${i === cur ? 'on' : ''}${t.missing ? ' miss' : ''}">
        <button type="button" class="tk" data-i="${i}"><span aria-hidden="true">${i === cur && playing ? '&#9654;' : '&#9835;'}</span>
          <span class="nm">${esc(t.name)}</span>${t.missing ? '<small>file tidak ditemukan</small>' : ''}</button>
        ${t.builtin || !owner ? '' : `<button type="button" class="rm" data-rm="${i}" aria-label="Hapus lagu">&times;</button>`}</li>`
    ).join('') : '<li class="empty muted small">Belum ada lagu.</li>';
  }

  function setTrack(i) {
    cur = i;
    bgm.src = tracks[i].url;
    bgm.loop = tracks.length === 1;
    nowEl.textContent = tracks[i].name;
    renderList();
  }
  function play(i = cur < 0 ? 0 : cur) {
    if (!tracks.length) { if (owner) openPanel(true); toast(owner ? 'Belum ada lagu. Unggah file musik dulu.' : 'Belum ada lagu.'); return; }
    if (i !== cur || !bgm.getAttribute('src')) setTrack(i);
    bgm.play().catch(err => {
      if (err && err.name === 'NotAllowedError') toast('Browser memblokir pemutaran. Tekan tombol Musik lagi.');
      else { if (tracks[cur] && tracks[cur].builtin) { tracks[cur].missing = true; renderList(); } toast('Lagu tidak bisa diputar. File tidak ditemukan atau formatnya tidak didukung.'); }
    });
  }
  function step(d) {
    if (tracks.length < 2) { if (cur >= 0) bgm.currentTime = 0; return; }
    let n = cur;
    for (let k = 0; k < tracks.length; k++) {
      n = (n + d + tracks.length) % tracks.length;
      if (!tracks[n].missing) { play(n); return; }
    }
  }

  musicBtn.addEventListener('click', () => { if (!bgm.paused) bgm.pause(); else play(); });
  $('#prevBtn').addEventListener('click', () => step(-1));
  $('#nextBtn').addEventListener('click', () => step(1));
  bgm.addEventListener('play', () => { musicBtn.setAttribute('aria-pressed', true); renderList(); });
  bgm.addEventListener('pause', () => { musicBtn.setAttribute('aria-pressed', false); renderList(); });
  bgm.addEventListener('ended', () => step(1));
  bgm.addEventListener('error', () => {
    if (cur >= 0 && tracks[cur] && tracks[cur].builtin) { tracks[cur].missing = true; renderList(); }
  });

  trackUl.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { removeTrack(+rm.dataset.rm); return; }
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const i = +b.dataset.i;
    if (i === cur && !bgm.paused) bgm.pause(); else play(i);
  });

  async function removeTrack(i) {
    const t = tracks[i];
    if (!t || t.builtin || !confirm('Hapus lagu ini?')) return;
    if (t.id != null) { try { await tx('readwrite', s => s.delete(t.id)); } catch {} }
    URL.revokeObjectURL(t.url);
    const wasCur = i === cur;
    tracks.splice(i, 1);
    if (i < cur) cur--;
    if (wasCur) {
      bgm.pause(); bgm.removeAttribute('src'); bgm.load(); cur = -1; nowEl.textContent = '\u2014';
      if (tracks.length) setTrack(Math.min(i, tracks.length - 1));
    }
    bgm.loop = tracks.length === 1;
    renderList();
  }

  /* Unggah */
  $('#songInput').addEventListener('change', e => {
    if (!owner) return;
    const files = [...e.target.files].filter(f => (f.type && f.type.startsWith('audio/')) || AUDIO_RE.test(f.name));
    e.target.value = '';
    if (!files.length) { toast('File harus berupa audio (mp3, m4a, wav, ogg).'); return; }
    const added = files.map(f => {
      const blob = new Blob([f], { type: mimeOf(f) });
      return { id: null, name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(blob), blob };
    });
    const first = tracks.length;
    tracks.push(...added);
    play(first);                       // langsung putar (masih dalam aksi klik pengguna)
    toast(files.length > 1 ? files.length + ' lagu ditambahkan' : 'Memutar: ' + added[0].name);
    Promise.all(added.map(async t => {
      t.id = await tx('readwrite', s => s.add({ name: t.name, blob: t.blob, added: Date.now() }));
      delete t.blob;
    })).catch(() => toast('Lagu bisa diputar, tapi tidak bisa disimpan permanen di browser ini (mode privat?).'));
  });

  /* Panel daftar lagu */
  function openPanel(open) {
    panel.hidden = !open;
    listBtn.setAttribute('aria-expanded', open);
  }
  listBtn.addEventListener('click', () => openPanel(panel.hidden));
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#playlist, #listBtn')) openPanel(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) openPanel(false); });

  /* Mulai: lagu bawaan + lagu tersimpan */
  tracks = SITE_TRACKS.map(t => ({ name: t.name, url: t.src, builtin: true }));
  tracks.filter(t => t.builtin).forEach(t => {         // cek apakah file bawaan benar-benar ada
    const a = new Audio(); a.preload = 'metadata';
    a.addEventListener('error', () => { t.missing = true; renderList(); }, { once: true });
    a.src = t.url;
  });
  renderList();
  if (owner) tx('readonly', s => s.getAll()).then(saved => {
    saved.forEach(r => tracks.push({ id: r.id, name: r.name, url: URL.createObjectURL(r.blob) }));
    bgm.loop = tracks.length === 1;
    renderList();
  }).catch(() => {});
})();