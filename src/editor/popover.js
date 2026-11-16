// Small dialog for buttons, phone, e-mail and links (text + URL).
// Ported from the Top Stovyklos editor; seasonal-link handling removed.

import { $, h, normText } from './ui.js';
import { pathLabel } from './strings.js';

// Rendered into href="…" unescaped by app.js, so quotes/spaces/brackets are
// rejected rather than stored.
const URL_RE = /^(https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*|#[^\s"'<>]*)$/i;
const PHONE_RE = /^\+?[\d\s()-]{6,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function closePopover() {
  $('.tse-popover')?.remove();
}

// ctx: { get(path) → value, apply([[path, value], …]) }
export function openPopover(el, ctx) {
  closePopover();
  const textPath = el.dataset.edit;
  const linkPath = el.dataset.editLink;
  const kind = el.dataset.editKind || '';
  const textLabel = kind === 'tel' ? 'Telefonas' : kind === 'email' ? 'El. paštas' : 'Tekstas';
  const help = kind === 'tel' ? 'Skambinimo nuoroda atsinaujins automatiškai.'
    : kind === 'email' ? 'El. laiško nuoroda atsinaujins automatiškai.'
      : !linkPath ? 'Mygtuko nuoroda nekeičiama — jis veda į rezervacijos formą.' : '';

  const pop = document.createElement('div');
  pop.className = 'tse-popover tse-ui';
  pop.setAttribute('role', 'dialog');
  pop.innerHTML = `
    <form>
      <div class="tse-popover-title">${h(pathLabel(textPath || linkPath).split(' › ')[0])}</div>
      ${textPath ? `<label class="tse-field"><span>${textLabel}</span><input name="text"${kind ? ` type="${kind}"` : ''} value="${h(ctx.get(textPath))}"></label>` : ''}
      ${linkPath ? `<label class="tse-field"><span>Nuoroda (URL)</span><input name="link" type="url" placeholder="https://" value="${h(ctx.get(linkPath))}"></label>` : ''}
      ${help ? `<p class="tse-help">${help}</p>` : ''}
      <div class="tse-popover-error" role="alert"></div>
      <div class="tse-popover-actions">
        ${linkPath ? '<a class="tse-link-btn tse-test-link" target="_blank" rel="noreferrer">Atidaryti ↗</a>' : '<span></span>'}
        <div>
          <button type="button" class="tse-btn tse-btn--ghost-dark tse-btn--sm" data-cancel>Atšaukti</button>
          <button type="submit" class="tse-btn tse-btn--primary tse-btn--sm">Pritaikyti</button>
        </div>
      </div>
    </form>`;
  document.body.appendChild(pop);

  const r = el.getBoundingClientRect();
  const w = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const headerBottom = Math.max(64, $('.header')?.getBoundingClientRect().bottom || 0);
  let top;
  if (r.height > 160) top = Math.max(r.top, headerBottom) + 56; // big cards: inside, under the toolbar
  else if (r.bottom + 10 + ph < window.innerHeight) top = r.bottom + 10;
  else top = r.top - ph - 10;
  pop.style.left = `${Math.max(8, Math.min(r.left + (r.height > 160 ? 10 : 0), window.innerWidth - w - 8))}px`;
  pop.style.top = `${Math.max(64, Math.min(top, window.innerHeight - ph - 8))}px`;

  const form = $('form', pop);
  const textInput = $('[name="text"]', pop);
  const linkInput = $('[name="link"]', pop);
  const testLink = $('.tse-test-link', pop);
  const syncTest = () => { if (testLink) testLink.href = linkInput.value; };
  syncTest();
  linkInput?.addEventListener('input', syncTest);
  $('input', pop)?.focus();

  $('[data-cancel]', pop).addEventListener('click', closePopover);
  pop.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('.tse-popover-error', pop);
    const out = [];
    if (textInput) {
      const v = normText(textInput.value);
      if (!v) { err.textContent = 'Laukelis negali būti tuščias.'; return; }
      if (kind === 'tel' && !PHONE_RE.test(v)) { err.textContent = 'Neteisingas telefono numeris.'; return; }
      if (kind === 'email' && !EMAIL_RE.test(v)) { err.textContent = 'Neteisingas el. pašto adresas.'; return; }
      out.push([textPath, v]);
    }
    if (linkInput) {
      const v = linkInput.value.trim();
      if (!URL_RE.test(v)) { err.textContent = 'Nuoroda turi prasidėti https:// (be tarpų ir kabučių).'; return; }
      out.push([linkPath, v]);
    }
    closePopover();
    ctx.apply(out);
  });
  setTimeout(() => {
    const away = (e) => {
      if (!pop.isConnected) return document.removeEventListener('mousedown', away, true);
      if (!pop.contains(e.target)) { closePopover(); document.removeEventListener('mousedown', away, true); }
    };
    document.addEventListener('mousedown', away, true);
  });
}
