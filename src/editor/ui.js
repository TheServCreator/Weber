// Shared editor helpers: DOM shortcuts, API client, toasts, dialogs, image
// preparation. Ported from the Top Stovyklos editor; no Weber-specific logic.

export const API = '/api/admin';
export const MAX_IMAGE = 1024 * 1024;

export const clone = (v) => JSON.parse(JSON.stringify(v));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// app.js interpolates content.json into HTML and attributes (alt="…",
// value="…") without escaping, so "<" would become markup and a straight
// quote would break an attribute on the live site. Strip / convert them at
// the source; straight quotes become Lithuanian „…“ quotes.
export const clean = (v) => String(v ?? '')
  .replace(/[<>]/g, '')
  .replace(/"([^"]*)"/g, '„$1“')
  .replace(/"/g, '“');

export const normText = (v) => clean(v)
  .replace(/[   ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const stripDiacritics = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setPath(obj, path, value) {
  const keys = String(path).split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k, i) => {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  });
  o[keys[keys.length - 1]] = value;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export async function api(method, path, body) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Serveris nepasiekiamas. Patikrinkite interneto ryšį.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw Object.assign(new Error(data.error || `Klaida (${res.status}).`), { status: res.status, data });
  }
  return data;
}

export function toast(message, kind = 'info', ms = 4200) {
  let wrap = $('.tse-toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'tse-toasts tse-ui';
    wrap.setAttribute('role', 'status');
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `tse-toast tse-toast--${kind}`;
  el.textContent = message;
  wrap.appendChild(el);
  while (wrap.children.length > 3) wrap.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 300); }, ms);
}

const svg = (w, body, sw = 2) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const ICON = {
  pen: svg(18, '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  eye: svg(17, '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  save: svg(17, '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  out: svg(17, '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'),
  panel: svg(18, '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>'),
  img: svg(15, '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  link: svg(15, '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  x: svg(18, '<path d="M18 6 6 18M6 6l12 12"/>', 2.2),
  trash: svg(16, '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  plus: svg(16, '<path d="M12 5v14M5 12h14"/>', 2.2),
  up: svg(16, '<path d="m18 15-6-6-6 6"/>'),
  down: svg(16, '<path d="m6 9 6 6 6-6"/>'),
};

// ── Dialogs ─────────────────────────────────────────────────────────────────
export function modal(html, { wide = false, onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'tse-modal tse-ui';
  wrap.innerHTML = `<div class="tse-dialog${wide ? ' tse-dialog--wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  document.documentElement.classList.add('ts-modal-open');
  requestAnimationFrame(() => wrap.classList.add('is-in'));
  const close = () => {
    wrap.classList.remove('is-in');
    setTimeout(() => {
      wrap.remove();
      if (!$('.tse-modal')) document.documentElement.classList.remove('ts-modal-open');
    }, 180);
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && wrap === $$('.tse-modal').pop()) close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  $$('[data-close]', wrap).forEach((b) => b.addEventListener('click', close));
  return { el: wrap, close };
}

export function confirmDialog(title, text, okLabel, danger = false) {
  return new Promise((resolve) => {
    let answered = false;
    const m = modal(`
      <div class="tse-dialog-head"><h2>${h(title)}</h2></div>
      <div class="tse-dialog-body"><p>${h(text)}</p></div>
      <div class="tse-dialog-foot">
        <button class="tse-btn tse-btn--ghost-dark" type="button" data-close>Atšaukti</button>
        <button class="tse-btn ${danger ? 'tse-btn--danger' : 'tse-btn--primary'}" type="button" data-ok>${h(okLabel)}</button>
      </div>`, { onClose: () => { if (!answered) resolve(false); } });
    $('[data-ok]', m.el).addEventListener('click', () => { answered = true; resolve(true); m.close(); });
    $('[data-ok]', m.el).focus();
  });
}

// ── Images ──────────────────────────────────────────────────────────────────
// Resolves to { blob, publicPath, repoPath, url } or null when cancelled.
export function chooseImage() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(null);
      try {
        toast('Ruošiama nuotrauka…');
        const blob = await prepareImage(file);
        const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/gif' ? 'gif' : blob.type === 'image/png' ? 'png' : 'jpg';
        const base = stripDiacritics(file.name.replace(/\.[^.]+$/, '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'nuotrauka';
        const name = `${base}-${Date.now().toString(36)}.${ext}`;
        resolve({ blob, url: URL.createObjectURL(blob), publicPath: `/images/${name}`, repoPath: `public/images/${name}` });
      } catch (err) {
        reject(err);
      }
    });
    input.click();
  });
}

async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Tinka tik JPG, PNG, WebP arba GIF nuotraukos.');
  if (file.type === 'image/gif') {
    if (file.size > MAX_IMAGE) throw new Error('GIF failas per didelis (daugiausia 1 MB).');
    return file;
  }
  if (file.size > 25 * 1024 * 1024) throw new Error('Failas per didelis (daugiausia 25 MB).');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Nepavyko nuskaityti nuotraukos.');
  }
  let scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const q of [0.86, 0.76, 0.66]) {
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', q));
      if (blob && blob.type !== 'image/webp') {
        // No WebP encoder (older Safari): keep the original if it is small enough.
        if (file.size <= MAX_IMAGE) return file;
        const jpg = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
        if (jpg && jpg.size <= MAX_IMAGE) return jpg;
        continue;
      }
      if (blob && blob.size <= MAX_IMAGE) return blob;
    }
    scale *= 0.75;
  }
  throw new Error('Nepavyko sumažinti nuotraukos iki 1 MB.');
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
