// Save flow: validation, change list (old → new), confirmation, success.

import { $, h, ICON, modal, normText } from './ui.js';

const PHONE_RE = /^\+?[\d\s()-]{6,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const short = (v) => {
  if (v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Taip' : 'Ne';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 140 ? `${s.slice(0, 137)}…` : s || '(tuščia)';
};

// Blocks a save that would publish a broken page or unusable contacts.
export function validate(c) {
  const out = [];
  if (!c.hero.slides.length) out.push('Karuselėje turi būti bent viena skaidrė.');
  c.hero.slides.forEach((s, i) => { if (!s.image) out.push(`Karuselės skaidrė ${i + 1}: trūksta nuotraukos.`); });
  c.packages.forEach((p, i) => {
    if (!normText(p.name)) out.push(`Paketas ${i + 1}: tuščias pavadinimas.`);
    p.contents.forEach((item, k) => { if (!normText(item)) out.push(`${p.name || `Paketas ${i + 1}`}: tuščias ${k + 1} punktas.`); });
  });
  c.pramogos.forEach((p, i) => { if (!normText(p.name)) out.push(`Pramoga ${i + 1}: tuščias pavadinimas.`); });
  c.cities.forEach((city, i) => { if (!normText(city.label)) out.push(`Miestas ${i + 1}: tuščias pavadinimas.`); });
  if (!PHONE_RE.test(c.header.phone)) out.push('Viršutinės juostos telefonas neteisingas.');
  if (!PHONE_RE.test(c.contact.phone)) out.push('Kontaktų telefonas neteisingas.');
  if (!EMAIL_RE.test(c.contact.email)) out.push('Neteisingas el. pašto adresas.');
  return out;
}

// opts: { list: changes, problems: [string], imageCount, save: async () => void, reload() }
export function openSaveDialog({ list, problems, imageCount, save, reload }) {
  const m = modal(`
    <div class="tse-dialog-head">
      <h2>Išsaugoti pakeitimus</h2>
      <button class="tse-icon-btn" type="button" data-close aria-label="Uždaryti">${ICON.x}</button>
    </div>
    <div class="tse-dialog-body">
      <p class="tse-muted">Patikrinkite pakeitimus. Išsaugojus svetainė atsinaujins per ~1–2 min.</p>
      ${problems.length ? `<div class="tse-save-error">Prieš išsaugant pataisykite:<ul>${problems.map((p) => `<li>${h(p)}</li>`).join('')}</ul></div>` : ''}
      <div class="tse-changes">
        ${list.map((c) => `
          <div class="tse-change">
            <div class="tse-change-label">${h(c.label)}</div>
            <div class="tse-change-vals"><span class="tse-old">${h(short(c.old))}</span><span class="tse-arrow">→</span><span class="tse-new">${h(short(c.new))}</span></div>
          </div>`).join('')}
      </div>
      ${imageCount ? `<p class="tse-help">Bus įkelta nuotraukų: ${imageCount} (public/images/).</p>` : ''}
      <div class="tse-save-error tse-save-status" role="alert"></div>
    </div>
    <div class="tse-dialog-foot">
      <button class="tse-btn tse-btn--ghost-dark" type="button" data-close>Atšaukti</button>
      <button class="tse-btn tse-btn--primary" type="button" data-confirm${problems.length ? ' disabled' : ''}>${ICON.save}<span>Patvirtinti ir išsaugoti</span></button>
    </div>`);
  const btn = $('[data-confirm]', m.el);
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    $('span', btn).textContent = 'Saugoma…';
    try {
      await save();
      m.close();
      savedBanner();
    } catch (err) {
      const box = $('.tse-save-status', m.el);
      box.innerHTML = `${h(err.message)}${err.status === 409 ? ' <button class="tse-link-btn" type="button" data-reload>Perkrauti puslapį</button>' : ''}`;
      $('[data-reload]', box)?.addEventListener('click', reload);
      btn.disabled = false;
      $('span', btn).textContent = 'Bandyti dar kartą';
    }
  });
}

function savedBanner() {
  const m = modal(`
    <div class="tse-dialog-body tse-success">
      <div class="tse-success-icon">✓</div>
      <h2>Išsaugota.</h2>
      <p>Svetainė atsinaujins per ~1–2 min.</p>
      <button class="tse-btn tse-btn--primary" type="button" data-close>Gerai</button>
    </div>`);
  $('[data-close]', m.el).focus();
}
