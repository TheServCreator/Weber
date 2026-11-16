// Editing layer on the live page: in-place text, popovers, hover tools for
// images and links. Ported from the Top Stovyklos editor.

import { $, $$, ICON, setPath, normText, toast } from './ui.js';
import { openPopover, closePopover } from './popover.js';

// ctx: { st() → editor state | null, updateCount(), focusSection(id),
//        popoverCtx, pickImage(path) }
let ctx;
let toolsTarget = null;

const inUi = (t) => t.closest && t.closest('.tse-ui');
const syncTwins = (el, value) => {
  $$(`[data-edit="${CSS.escape(el.dataset.edit)}"]`).forEach((twin) => { if (twin !== el) twin.textContent = value; });
};

export function bindPage(ctx_) {
  ctx = ctx_;

  document.addEventListener('click', (e) => {
    const t = e.target;
    const st = ctx.st();
    if (!st || inUi(t)) return;
    if (st.mode !== 'edit') {
      // Preview: site links are "/#route" — keep them inside /redaktorius.
      const a = t.closest('a[href]');
      const href = a && a.getAttribute('href');
      if (href === '/' || href?.startsWith('/#')) { e.preventDefault(); location.hash = href.slice(2); }
      return;
    }
    const panelEl = t.closest('[data-edit-panel]');
    if (panelEl) {
      e.preventDefault();
      e.stopPropagation();
      ctx.focusSection(panelEl.dataset.editPanel);
      return;
    }
    const popupEl = t.closest('[data-edit-mode="popup"]');
    if (popupEl) {
      e.preventDefault();
      e.stopPropagation();
      hideTools();
      openPopover(popupEl, ctx.popoverCtx);
      return;
    }
    if (t.closest('a')) e.preventDefault();
  }, true);

  // Text selection inside a carousel must not start a slide drag.
  const guard = (e) => {
    const st = ctx.st();
    if (st && st.mode === 'edit' && e.target.closest && e.target.closest('[data-edit]:not([data-edit-mode])')) e.stopPropagation();
  };
  document.addEventListener('mousedown', guard, true);
  document.addEventListener('touchstart', guard, { capture: true, passive: true });

  document.addEventListener('input', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit]');
    const st = ctx.st();
    if (!el || !st || inUi(el)) return;
    const value = el.textContent.replace(/\s*\n\s*/g, ' ');
    setPath(st.draft, el.dataset.edit, value);
    syncTwins(el, value);
    ctx.updateCount();
  });

  // Capture phase: Enter/Escape finish editing, and arrow keys must reach the
  // caret, not the carousel's own keyboard navigation.
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit][contenteditable]');
    if (!el) return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); el.blur(); }
    e.stopPropagation();
  }, true);

  document.addEventListener('paste', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit][contenteditable]');
    if (!el) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  });

  document.addEventListener('drop', (e) => {
    if (e.target.closest && e.target.closest('[data-edit][contenteditable]')) e.preventDefault();
  });

  document.addEventListener('focusout', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit][contenteditable]');
    const st = ctx.st();
    if (!el || !st) return;
    const value = normText(el.textContent);
    if (el.textContent !== value) el.textContent = value;
    setPath(st.draft, el.dataset.edit, value);
    syncTwins(el, value);
    ctx.updateCount();
  });

  // Reservations are never sent from the editor.
  document.addEventListener('submit', (e) => {
    if (inUi(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('Redaktoriuje rezervacijos forma nesiunčiama — tai tik peržiūra.', 'warn');
  }, true);

  // Hover tools for images and container links.
  document.addEventListener('pointerover', (e) => {
    const st = ctx.st();
    if (!st || st.mode !== 'edit' || e.pointerType === 'touch') return;
    if (inUi(e.target)) return;
    showToolsFor(e.target);
  });
  document.addEventListener('click', (e) => {
    // Touch devices: a tap on an image/card shows the tools.
    const st = ctx.st();
    if (!st || st.mode !== 'edit' || inUi(e.target)) return;
    if (!e.target.closest('[data-edit]:not([data-edit-mode])')) showToolsFor(e.target);
  });
  window.addEventListener('scroll', () => hideTools(), { passive: true });
  window.addEventListener('resize', () => { hideTools(); closePopover(); });
}

function showToolsFor(t) {
  const img = t.closest('[data-edit-img]')
    || t.closest('.carousel__slide, .brand-logo-link, .extras-wide-item, .extra-card-top')?.querySelector('[data-edit-img]');
  const link = t.closest('[data-edit-link]:not([data-edit-mode])');
  if (!img && !link) return hideTools();
  const anchor = (img && (img.closest('.carousel__slide') || img)) || link;
  if (toolsTarget && toolsTarget.img === img && toolsTarget.link === link) return;
  toolsTarget = { img, link };

  $$('.tse-hl').forEach((el) => el.classList.remove('tse-hl'));
  (img || link).classList.add('tse-hl');

  const tools = $('.tse-tools');
  tools.innerHTML = `
    ${img ? `<button type="button" data-tool="img">${ICON.img}<span>Keisti nuotrauką</span></button>` : ''}
    ${link ? `<button type="button" data-tool="link">${ICON.link}<span>Nuoroda</span></button>` : ''}`;
  tools.hidden = false;
  const r = anchor.getBoundingClientRect();
  // Keep the toolbar below the sticky site header so it never covers its texts.
  const headerBottom = $('.header')?.getBoundingClientRect().bottom || 56;
  if (r.bottom < headerBottom + 40) return hideTools();
  const top = Math.max(r.top + 10, headerBottom + 10);
  tools.style.top = `${Math.min(top, window.innerHeight - 50)}px`;
  tools.style.left = `${Math.max(8, Math.min(r.left + 10, window.innerWidth - tools.offsetWidth - 8))}px`;
  const imgBtn = $('[data-tool="img"]', tools);
  const linkBtn = $('[data-tool="link"]', tools);
  if (imgBtn) imgBtn.onclick = () => { hideTools(); ctx.pickImage(img.dataset.editImg); };
  if (linkBtn) linkBtn.onclick = () => { hideTools(); openPopover(link, ctx.popoverCtx); };
}

export function hideTools() {
  toolsTarget = null;
  const tools = $('.tse-tools');
  if (tools) tools.hidden = true;
  $$('.tse-hl').forEach((el) => el.classList.remove('tse-hl'));
}
