// ─── /redaktorius — visual editor ───────────────────────────────────────────
// Loaded on demand from app.js only on the /redaktorius route. Swaps the
// bundled content for the latest content.json from GitHub, re-renders the real
// page through app.js's own router, tags it with data-edit-* (annotate.js)
// and saves via /api/admin/save, which commits to GitHub → Cloudflare Pages
// rebuilds. Ported from the Top Stovyklos editor (season/schedule removed).

import './editor.css';
import {
  $, $$, h, clone, getPath, setPath, debounce, api, toast, ICON, confirmDialog,
  chooseImage, blobToBase64,
} from './ui.js';
import { annotate } from './annotate.js';
import { createPanel } from './panel.js';
import { pathLabel } from './strings.js';
import { closePopover } from './popover.js';
import { bindPage, hideTools } from './page.js';
import { validate, openSaveDialog } from './save.js';

const PLAINTEXT = (() => {
  const d = document.createElement('div');
  d.setAttribute('contenteditable', 'plaintext-only');
  return d.contentEditable === 'plaintext-only';
})();

let hooks; // { content, router, renderHeader } from app.js
let st;    // editor state
let panel;

// ── Entry ───────────────────────────────────────────────────────────────────
export async function startEditor(h_) {
  hooks = h_;
  document.documentElement.classList.add('ts-editor');
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.querySelector('meta[name="robots"]')?.remove();
  document.head.appendChild(robots);
  document.title = 'Redaktorius — Top Gimtadieniai';

  try {
    await api('GET', '/session');
    await boot();
  } catch (err) {
    showLogin(err.status === 401 ? '' : err.message);
  }
}

// ── Login ───────────────────────────────────────────────────────────────────
function showLogin(notice) {
  document.documentElement.classList.add('ts-locked');
  const wrap = document.createElement('div');
  wrap.className = 'tse-login tse-ui';
  wrap.innerHTML = `
    <form class="tse-login-card" novalidate>
      <h1>Redaktorius</h1>
      <p class="tse-muted">Top Gimtadieniai svetainės turinio valdymas</p>
      <label class="tse-field">
        <span>Slaptažodis</span>
        <input type="password" name="password" autocomplete="current-password" required autofocus>
      </label>
      <div class="tse-login-error" role="alert">${h(notice || '')}</div>
      <button class="tse-btn tse-btn--primary tse-btn--block" type="submit">Prisijungti</button>
    </form>`;
  document.body.appendChild(wrap);
  const form = $('form', wrap);
  const input = $('input', wrap);
  const error = $('.tse-login-error', wrap);
  const btn = $('button', wrap);
  setTimeout(() => input.focus(), 50);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.value) { error.textContent = 'Įveskite slaptažodį.'; input.focus(); return; }
    btn.disabled = true;
    btn.textContent = 'Jungiamasi…';
    error.textContent = '';
    try {
      await api('POST', '/login', { password: input.value });
      wrap.classList.add('is-leaving');
      await boot();
      wrap.remove();
      document.documentElement.classList.remove('ts-locked');
    } catch (err) {
      error.textContent = err.message;
      form.classList.remove('is-shaking');
      void form.offsetWidth;
      form.classList.add('is-shaking');
      input.select();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Prisijungti';
    }
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function boot() {
  let data;
  try {
    data = await api('GET', '/content');
  } catch (err) {
    if (err.status === 401) throw err;
    // Signed in but GitHub not reachable/configured — explain and stop.
    document.documentElement.classList.remove('ts-locked');
    $('.tse-login')?.remove();
    fatal(err.message);
    return;
  }
  document.documentElement.classList.remove('ts-locked');
  $('.tse-login')?.remove();

  // app.js renders from the object it imported, so the draft IS that object:
  // replace its keys in place and the site's own renderers show the draft.
  replaceContent(data.content);
  st = {
    orig: clone(data.content),
    draft: hooks.content,
    shas: data.shas,
    images: new Map(), // public path → { blob, url, repoPath, saved }
    mode: 'edit',
    saving: false,
  };

  wrapRouter();
  buildChrome();
  bindPage({
    st: () => st,
    updateCount,
    focusSection: (id) => panel.focusSection(id),
    pickImage,
    popoverCtx: {
      get: (path) => getPath(st.draft, path),
      apply: (pairs) => {
        pairs.forEach(([path, value]) => setPath(st.draft, path, value));
        rerender();
        updateCount();
      },
    },
  });
  rerender();
  panel.render();
  updateCount();
  window.addEventListener('beforeunload', (e) => {
    if (changes().length) { e.preventDefault(); e.returnValue = ''; }
  });
}

function replaceContent(next) {
  const c = hooks.content;
  Object.keys(c).forEach((k) => delete c[k]);
  Object.assign(c, next);
}

function fatal(message) {
  const box = document.createElement('div');
  box.className = 'tse-login tse-ui';
  box.innerHTML = `<div class="tse-login-card"><h1>Redaktorius</h1><p class="tse-login-error">${h(message)}</p>
    <button class="tse-btn tse-btn--ghost-dark tse-btn--block" type="button">Atsijungti</button></div>`;
  $('button', box).addEventListener('click', logout);
  document.body.appendChild(box);
}

// ── Rendering (through app.js's router) ─────────────────────────────────────
let keepScroll = null;

function wrapRouter() {
  const router = hooks.router;
  const original = router.handleRoute.bind(router);
  router.handleRoute = () => {
    const slides = $$('.carousel').map((c) => $$('.carousel__dots button', c).findIndex((b) => b.classList.contains('is-active')));
    original();
    // handleRoute builds carousels and reveal animations in a setTimeout(0);
    // adjust the fresh DOM before it runs: no autoplay, no fade-in flicker.
    $$('.carousel').forEach((c) => { c.dataset.autoplay = 'false'; });
    $$('[data-reveal]').forEach((el) => el.removeAttribute('data-reveal'));
    setTimeout(() => afterRender(keepScroll !== null ? slides : []), 0);
  };
}

function afterRender(slides) {
  annotate(st.draft);
  $$('.carousel').forEach((c, i) => {
    if (slides[i] > 0) $$('.carousel__dots button', c)[slides[i]]?.click();
  });
  showPendingImages();
  applyMode();
  if (keepScroll !== null) { window.scrollTo(0, keepScroll); keepScroll = null; }
}

function rerender() {
  keepScroll = window.scrollY;
  hooks.renderHeader();
  hooks.router.handleRoute();
}
const renderSoon = debounce(rerender, 350);

function showPendingImages() {
  if (!st.images.size) return;
  $$('img').forEach((img) => {
    const pending = st.images.get(img.getAttribute('src'));
    if (pending) img.src = pending.url;
  });
}

function applyMode() {
  const editing = st.mode === 'edit';
  document.documentElement.classList.toggle('ts-mode-edit', editing);
  document.documentElement.classList.toggle('ts-mode-preview', !editing);
  $$('[data-edit]').forEach((el) => {
    if (el.dataset.editMode === 'popup' || !editing) {
      el.removeAttribute('contenteditable');
      return;
    }
    el.setAttribute('contenteditable', PLAINTEXT ? 'plaintext-only' : 'true');
    el.spellcheck = true;
  });
  $$('[data-edit-img]').forEach((img) => { img.draggable = !editing; });
}

// ── Change tracking ─────────────────────────────────────────────────────────
const itemName = (v) => (v && typeof v === 'object' ? v.title || v.name || v.label || v.image || '…' : String(v));
const listSummary = (arr) => `${arr.length}: ${arr.map(itemName).join(' · ')}`;

function diffInto(a, b, path, out) {
  if (Array.isArray(a) && Array.isArray(b)) {
    const sameItems = a.length === b.length
      && JSON.stringify(a.map((x) => JSON.stringify(x)).sort()) === JSON.stringify(b.map((x) => JSON.stringify(x)).sort());
    // Added / removed / reordered items: one readable line instead of a
    // field-by-field cascade caused by shifted indexes.
    if (a.length !== b.length || (sameItems && JSON.stringify(a) !== JSON.stringify(b))) {
      out.push({ path, label: `${pathLabel(path)} (sąrašas)`, old: listSummary(a), new: listSummary(b) });
      return;
    }
  }
  const isObj = (v) => v && typeof v === 'object';
  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) diffInto(a[k], b[k], path ? `${path}.${k}` : k, out);
    return;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path, label: pathLabel(path), old: a, new: b });
}

function changes() {
  if (!st) return [];
  const out = [];
  diffInto(st.orig, st.draft, '', out);
  return out;
}

const updateCount = debounce(() => {
  const n = changes().length;
  const el = $('.tse-count');
  if (!el) return;
  el.textContent = String(n);
  el.closest('.tse-status').classList.toggle('has-changes', n > 0);
  $('.tse-save').disabled = n === 0 || st.saving;
  panel.sync();
}, 120);

function commit(path, value, render = false) {
  setPath(st.draft, path, value);
  if (render) renderSoon();
  updateCount();
}

// ── Images ──────────────────────────────────────────────────────────────────
async function stageImage() {
  try {
    const img = await chooseImage();
    if (!img) return null;
    st.images.set(img.publicPath, img);
    toast(`Nuotrauka paruošta (${Math.round(img.blob.size / 1024)} KB). Ji bus įkelta paspaudus „Išsaugoti“.`, 'ok');
    return img.publicPath;
  } catch (err) {
    toast(err.message, 'error', 6000);
    return null;
  }
}

async function pickImage(path) {
  const publicPath = await stageImage();
  if (!publicPath) return;
  setPath(st.draft, path, publicPath);
  rerender();
  panel.render();
  updateCount();
}

const imageSrc = (path) => st.images.get(path)?.url || path;

// ── Chrome: top bar + side panel ────────────────────────────────────────────
function buildChrome() {
  const bar = document.createElement('div');
  bar.className = 'tse-topbar tse-ui';
  bar.innerHTML = `
    <div class="tse-brand">${ICON.pen}<span>Redaktorius</span></div>
    <div class="tse-status" aria-live="polite">Neišsaugoti pakeitimai: <b class="tse-count">0</b></div>
    <div class="tse-actions">
      <button class="tse-btn tse-btn--ghost tse-preview" type="button" title="Peržiūrėti be redagavimo žymių">${ICON.eye}<span>Peržiūrėti</span></button>
      <button class="tse-btn tse-btn--primary tse-save" type="button" disabled>${ICON.save}<span>Išsaugoti</span></button>
      <button class="tse-btn tse-btn--ghost tse-logout" type="button" title="Atsijungti">${ICON.out}<span>Atsijungti</span></button>
      <button class="tse-btn tse-btn--ghost tse-panel-toggle" type="button" aria-label="Nustatymai" title="Nustatymai">${ICON.panel}</button>
    </div>`;
  document.body.appendChild(bar);

  $('.tse-preview', bar).addEventListener('click', togglePreview);
  $('.tse-save', bar).addEventListener('click', startSave);
  $('.tse-logout', bar).addEventListener('click', async () => {
    if (changes().length && !(await confirmDialog('Atsijungti?', 'Neišsaugoti pakeitimai bus prarasti.', 'Atsijungti'))) return;
    logout();
  });
  $('.tse-panel-toggle', bar).addEventListener('click', () => togglePanel());

  panel = createPanel({
    draft: () => st.draft,
    commit,
    structural: () => { rerender(); panel.render(); updateCount(); },
    imageSrc,
    stageImage,
    pickImage,
    togglePanel,
    discard,
  });
  document.body.appendChild(panel.el);
  togglePanel(window.innerWidth >= 1100);

  const tools = document.createElement('div');
  tools.className = 'tse-tools tse-ui';
  tools.hidden = true;
  document.body.appendChild(tools);
}

function togglePanel(force) {
  const open = force ?? !document.documentElement.classList.contains('ts-panel-open');
  document.documentElement.classList.toggle('ts-panel-open', open);
  $('.tse-panel-toggle')?.classList.toggle('is-active', open);
}

function togglePreview() {
  st.mode = st.mode === 'edit' ? 'preview' : 'edit';
  const btn = $('.tse-preview');
  btn.classList.toggle('is-active', st.mode === 'preview');
  btn.innerHTML = (st.mode === 'preview' ? ICON.pen : ICON.eye) + `<span>${st.mode === 'preview' ? 'Redaguoti' : 'Peržiūrėti'}</span>`;
  hideTools();
  closePopover();
  if (document.activeElement?.closest?.('[data-edit]')) document.activeElement.blur();
  applyMode();
  if (st.mode === 'preview') togglePanel(false);
  toast(st.mode === 'preview' ? 'Peržiūra: taip svetainė atrodys lankytojams (dar neišsaugota).' : 'Grįžote į redagavimą.');
}

async function discard() {
  if (!changes().length) { toast('Nėra neišsaugotų pakeitimų.'); return; }
  if (!(await confirmDialog('Atmesti visus pakeitimus?', 'Grąžinsime paskutinę išsaugotą versiją.', 'Atmesti', true))) return;
  replaceContent(clone(st.orig));
  rerender();
  panel.render();
  updateCount();
  toast('Pakeitimai atmesti.');
}

async function logout() {
  try { await api('POST', '/logout'); } catch { /* cookie may already be gone */ }
  st = null;
  location.reload();
}

// ── Save ────────────────────────────────────────────────────────────────────
function usedImages() {
  const json = JSON.stringify(st.draft);
  return [...st.images.entries()].filter(([path, v]) => !v.saved && json.includes(`"${path}"`));
}

function startSave() {
  const list = changes();
  if (!list.length) { toast('Nėra ką išsaugoti.'); return; }
  openSaveDialog({
    list,
    problems: [...panel.errors(), ...validate(st.draft)],
    imageCount: usedImages().length,
    save: () => save(list),
    reload: () => { st = null; location.reload(); },
  });
}

async function save(list) {
  st.saving = true;
  try {
    const imgs = usedImages();
    const images = await Promise.all(imgs.map(async ([, v]) => ({ path: v.repoPath, data: await blobToBase64(v.blob) })));
    const res = await api('POST', '/save', {
      base: st.shas,
      content: st.draft,
      images,
      summary: list.map((c) => c.label).slice(0, 8).join('; '),
    });
    st.orig = clone(st.draft);
    if (res.shas.content) st.shas.content = res.shas.content;
    imgs.forEach(([, v]) => { v.saved = true; });
  } finally {
    st.saving = false;
    updateCount();
  }
}
