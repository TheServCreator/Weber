// Weber side panel: package prices, package contents, hero carousel,
// pramogos and contacts. Only keys that already exist in content.json are
// exposed — the panel never creates new sections.

import { $, $$, h, ICON, getPath, clean, normText, confirmDialog, toast } from './ui.js';

// Current content.json format: "I–IV 220 EUR / V–VII 240 EUR" (en dashes).
const PRICE_RE = /^I–IV\s+(\d+(?:[.,]\d{1,2})?)\s*EUR\s*\/\s*V–VII\s+(\d+(?:[.,]\d{1,2})?)\s*EUR$/;
const NUM_RE = /^\d{1,5}(?:,\d{1,2})?$/;
// app.js EXTRA_BG_CLASSES has six card colours; a 7th card would render bare.
const MAX_PRAMOGOS = 6;

const PAGES = [
  ['', 'Pradžia'], ['birthday-packages', 'Paketai'], ['birthday-extras', 'Pramogos'],
  ['contact', 'Rezervacija'], ['teddy-birthdays', 'Meškučiai'],
];

export const parsePrice = (s) => { const m = PRICE_RE.exec(String(s || '').trim()); return m ? [m[1], m[2]] : null; };
const formatPrice = (a, b) => `I–IV ${a} EUR / V–VII ${b} EUR`;

// "220" → "220", "220.5" → "220,50", "0" / "abc" → null
function normNum(v) {
  const s = String(v).trim().replace('.', ',');
  if (!NUM_RE.test(s) || Number(s.replace(',', '.')) <= 0) return null;
  const [int, dec] = s.split(',');
  return dec === undefined ? String(Number(int)) : `${Number(int)},${dec.padEnd(2, '0')}`;
}

const field = (label, path, value, { area = false, type = '', attrs = '' } = {}) => `
  <label class="tse-field"><span>${label}</span>${area
    ? `<textarea rows="3" data-bind="${path}">${h(value)}</textarea>`
    : `<input${type ? ` type="${type}"` : ''} data-bind="${path}" value="${h(value)}"${attrs}>`}</label>`;

const rowTools = (list, i, len, canDelete = true) => `
  <div class="tse-row-tools">
    <button type="button" class="tse-icon-btn" data-act="move" data-list="${list}" data-i="${i}" data-dir="-1" aria-label="Perkelti aukštyn"${i === 0 ? ' disabled' : ''}>${ICON.up}</button>
    <button type="button" class="tse-icon-btn" data-act="move" data-list="${list}" data-i="${i}" data-dir="1" aria-label="Perkelti žemyn"${i === len - 1 ? ' disabled' : ''}>${ICON.down}</button>
    ${canDelete ? `<button type="button" class="tse-icon-btn tse-icon-btn--danger" data-act="del" data-list="${list}" data-i="${i}" aria-label="Ištrinti">${ICON.trash}</button>` : ''}
  </div>`;

const section = (id, title, body) => `
  <details class="tse-card tse-sec" data-sec="${id}">
    <summary><h3>${title}</h3></summary>
    <div class="tse-sec-body">${body}</div>
  </details>`;

export function createPanel(ctx) {
  const el = document.createElement('aside');
  el.className = 'tse-panel tse-ui';
  el.setAttribute('aria-label', 'Redaktoriaus nustatymai');
  el.innerHTML = `
    <div class="tse-panel-head">
      <h2>Nustatymai</h2>
      <button class="tse-icon-btn tse-panel-close" type="button" aria-label="Uždaryti">${ICON.x}</button>
    </div>
    <div class="tse-panel-body"></div>`;
  const body = $('.tse-panel-body', el);
  const open = new Set(['pages', 'prices']);

  // ── Sections ──────────────────────────────────────────────────────────────
  const pagesHtml = () => `
    <div class="tse-pages">${PAGES.map(([hash, label]) => `
      <button type="button" data-act="page" data-page="${hash}" aria-pressed="${location.hash.slice(1) === hash}">${label}</button>`).join('')}
    </div>
    <p class="tse-help">Atidaro puslapį redagavimui (nuorodos puslapyje redaguojant neveikia).</p>`;

  const pricesHtml = (c) => `
    <table class="tse-prices">
      <thead><tr><th>Paketas</th><th>I–IV</th><th>V–VII</th></tr></thead>
      <tbody>${c.packages.map((p, i) => {
        const v = parsePrice(p.price);
        const cell = (tier) => `<td><div class="tse-price"><input inputmode="decimal" data-price="${i}" data-tier="${tier}" value="${h(v ? v[tier] : '')}" aria-label="${h(p.name)}, ${tier ? 'V–VII' : 'I–IV'}"><em>€</em></div></td>`;
        return `<tr><th scope="row">${h(p.name)}</th>${cell(0)}${cell(1)}</tr>${v ? '' : `
          <tr><td colspan="3" class="tse-price-warn">Dabartinė kaina „${h(p.price)}“ neatitinka formato — įrašykite abi kainas.</td></tr>`}`;
      }).join('')}</tbody>
    </table>
    <div class="tse-price-error" role="alert"></div>
    <p class="tse-help">Tik skaičiai, pvz. <b>220</b> arba <b>220,50</b>. Kortelėse rodoma „I–IV 220 EUR / V–VII 240 EUR“.</p>`;

  const contentsHtml = (c) => `
    <p class="tse-help tse-help--top">Kiekvienas paketas apima ir visų ankstesnių paketų punktus — čia rašykite tik tai, kas prisideda.</p>
    ${c.packages.map((pkg, i) => `
      <div class="tse-item">
        ${field('Paketo pavadinimas', `packages.${i}.name`, pkg.name)}
        <div class="tse-list">${pkg.contents.map((item, k) => `
          <div class="tse-list-row">
            <input data-bind="packages.${i}.contents.${k}" value="${h(item)}" aria-label="${h(pkg.name)}, punktas ${k + 1}">
            ${rowTools(`packages.${i}.contents`, k, pkg.contents.length)}
          </div>`).join('')}
        </div>
        <button type="button" class="tse-link-btn" data-act="add-item" data-list="packages.${i}.contents">+ Pridėti punktą</button>
      </div>`).join('')}`;

  const heroHtml = (c) => {
    const slides = c.hero.slides;
    return `${slides.map((s, i) => {
      const p = `hero.slides.${i}`;
      return `
      <div class="tse-item">
        <div class="tse-item-head">
          <img class="tse-thumb" src="${h(ctx.imageSrc(s.image))}" alt="">
          <b>Skaidrė ${i + 1}</b>
          ${rowTools('hero.slides', i, slides.length, slides.length > 1)}
        </div>
        <button type="button" class="tse-btn tse-btn--soft tse-btn--sm tse-btn--block" data-act="img" data-path="${p}.image">${ICON.img}<span>Keisti nuotrauką</span></button>
        ${field('Antraštė', `${p}.title`, s.title)}
        ${field('Paantraštė', `${p}.sub`, s.sub)}
        ${field('Nuotraukos aprašymas (neregintiesiems ir „Google“)', `${p}.alt`, s.alt)}
        <label class="tse-check"><input type="checkbox" data-bind="${p}.blurFill"${s.blurFill ? ' checked' : ''}> Rodyti visą nuotrauką (šonai užpildomi sulieta kopija)</label>
        ${s.blurFill ? '' : field('Nuotraukos fokusas', `${p}.objectPosition`, s.objectPosition, { attrs: ' placeholder="pvz. center 30%"' })}
      </div>`;
    }).join('')}
    <button type="button" class="tse-btn tse-btn--soft tse-btn--block" data-act="add-slide">${ICON.plus}<span>Pridėti skaidrę</span></button>`;
  };

  const pramogosHtml = (c) => `${c.pramogos.map((p, i) => `
    <div class="tse-item">
      <div class="tse-item-head">
        <img class="tse-thumb tse-thumb--contain" src="${h(ctx.imageSrc(p.image))}" alt="">
        <b>${h(p.name) || `Pramoga ${i + 1}`}</b>
        ${rowTools('pramogos', i, c.pramogos.length)}
      </div>
      <button type="button" class="tse-btn tse-btn--soft tse-btn--sm tse-btn--block" data-act="img" data-path="pramogos.${i}.image">${ICON.img}<span>Keisti nuotrauką</span></button>
      ${field('Pavadinimas', `pramogos.${i}.name`, p.name)}
      ${field('Kainos pastaba', `pramogos.${i}.priceNote`, p.priceNote, { attrs: ' placeholder="pvz. (30 EUR)"' })}
      ${field('Aprašymas', `pramogos.${i}.description`, p.description, { area: true })}
    </div>`).join('')}
    ${c.pramogos.length < MAX_PRAMOGOS
      ? `<button type="button" class="tse-btn tse-btn--soft tse-btn--block" data-act="add-pramoga">${ICON.plus}<span>Pridėti pramogą</span></button>`
      : `<p class="tse-help">Daugiausia ${MAX_PRAMOGOS} pramogos — tiek spalvų numato dizainas.</p>`}`;

  const contactsHtml = (c) => `
    ${field('Telefonas viršutinėje juostoje', 'header.phone', c.header.phone, { type: 'tel' })}
    ${field('Telefonas (kontaktai ir rezervacija)', 'contact.phone', c.contact.phone, { type: 'tel' })}
    ${field('El. paštas', 'contact.email', c.contact.email, { type: 'email' })}
    <h4 class="tse-subhead">Miestai ir adresai rezervacijos formoje</h4>
    ${c.cities.map((city, i) => field(`Pasirinkimas ${i + 1}`, `cities.${i}.label`, city.label)).join('')}
    <p class="tse-help">Vilniuje — du adresai, todėl jie rodomi kaip atskiri pasirinkimai. Šis tekstas siunčiamas ir rezervacijos laiške.</p>`;

  function render() {
    const c = ctx.draft();
    $$('details[data-sec]', body).forEach((d) => (d.open ? open.add(d.dataset.sec) : open.delete(d.dataset.sec)));
    const scroll = body.scrollTop;
    body.innerHTML = `
      ${section('pages', 'Puslapis', pagesHtml())}
      ${section('prices', 'Paketai ir kainos', pricesHtml(c))}
      ${section('contents', 'Paketų turinys', contentsHtml(c))}
      ${section('hero', 'Pagrindinė karuselė', heroHtml(c))}
      ${section('pramogos', 'Pramogos', pramogosHtml(c))}
      ${section('contacts', 'Kontaktai', contactsHtml(c))}
      <section class="tse-card tse-card--quiet">
        <h3>Patarimai</h3>
        <ul class="tse-tips">
          <li>Spustelėkite tekstą puslapyje — jį galima keisti vietoje.</li>
          <li>Užvedus ant nuotraukos ar kortelės atsiranda mygtukai <b>Keisti nuotrauką</b> ir <b>Nuoroda</b>.</li>
          <li>Mygtukai, telefonas ir el. paštas atsidaro mažame lange.</li>
          <li>Pakeitimai matomi tik jums, kol nepaspaudžiate <b>Išsaugoti</b>.</li>
        </ul>
        <button class="tse-link-btn tse-link-btn--danger" type="button" data-act="discard">Atmesti visus pakeitimus</button>
      </section>`;
    $$('details[data-sec]', body).forEach((d) => { d.open = open.has(d.dataset.sec); });
    body.scrollTop = scroll;
  }

  // Page edits (inline text) → refresh the panel unless the user is typing in it.
  function sync() {
    if (el.contains(document.activeElement) && document.activeElement !== document.body) return;
    render();
  }

  function focusSection(id) {
    ctx.togglePanel(true);
    const d = $(`details[data-sec="${id}"]`, body);
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ block: 'start', behavior: 'smooth' });
    $('input', d)?.focus({ preventScroll: true });
  }

  const errors = () => ($$('[data-price][aria-invalid="true"]', body).length
    ? ['Paketų kainos: pataisykite raudonai pažymėtus laukelius.'] : []);

  // ── Events ────────────────────────────────────────────────────────────────
  function onPrice(input) {
    const i = Number(input.dataset.price);
    const cells = $$(`[data-price="${i}"]`, body);
    const vals = cells.map((c) => normNum(c.value));
    cells.forEach((c, k) => c.setAttribute('aria-invalid', String(c.value.trim() !== '' && vals[k] === null)));
    if (vals.every((v) => v !== null)) ctx.commit(`packages.${i}.price`, formatPrice(vals[0], vals[1]), true);
    $('.tse-price-error', body).textContent = $$('[data-price][aria-invalid="true"]', body).length
      ? 'Kaina turi būti teigiamas skaičius, pvz. 220 arba 220,50.' : '';
  }

  body.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.price !== undefined) return onPrice(t);
    if (!t.dataset.bind) return;
    let value = t.type === 'checkbox' ? t.checked : clean(t.value);
    // Rendered into style="object-position:…": allow only position keywords/units.
    if (t.dataset.bind.endsWith('.objectPosition')) value = value.replace(/[^a-z0-9%.\s-]/gi, '');
    ctx.commit(t.dataset.bind, value, true);
    if (t.type === 'checkbox') render();
  });

  body.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.dataset.bind || t.type === 'checkbox') return;
    const value = normText(t.value);
    if (t.value !== value) t.value = value;
    ctx.commit(t.dataset.bind, value, true);
  });

  body.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = ctx.draft();
    const list = b.dataset.list && getPath(c, b.dataset.list);
    const i = Number(b.dataset.i);
    switch (b.dataset.act) {
      case 'page':
        location.hash = b.dataset.page;
        if (window.innerWidth < 1100) ctx.togglePanel(false);
        return;
      case 'move': {
        const j = i + Number(b.dataset.dir);
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        return ctx.structural();
      }
      case 'del': {
        const isItem = b.dataset.list.includes('.contents');
        if (!isItem && !(await confirmDialog('Ištrinti?', 'Elementas bus pašalintas iš svetainės, kai išsaugosite.', 'Ištrinti', true))) return;
        list.splice(i, 1);
        return ctx.structural();
      }
      case 'add-item':
        list.push('');
        ctx.structural();
        $(`[data-bind="${b.dataset.list}.${list.length - 1}"]`, body)?.focus();
        return;
      case 'img':
        await ctx.pickImage(b.dataset.path);
        return;
      case 'add-slide': {
        const image = await ctx.stageImage();
        if (!image) return;
        c.hero.slides.push({ image, alt: '', objectPosition: '', blurFill: false, title: '', sub: '' });
        ctx.structural();
        return toast('Skaidrė pridėta karuselės gale. Įrašykite antraštę ir aprašymą.', 'ok');
      }
      case 'add-pramoga': {
        if (c.pramogos.length >= MAX_PRAMOGOS) return;
        const image = await ctx.stageImage();
        if (!image) return;
        c.pramogos.push({ name: 'Nauja pramoga', description: '', image, priceNote: '' });
        ctx.structural();
        return toast('Pramoga pridėta. Įrašykite pavadinimą ir aprašymą.', 'ok');
      }
      case 'discard':
        return ctx.discard();
      default:
    }
  });

  $('.tse-panel-close', el).addEventListener('click', () => ctx.togglePanel(false));
  window.addEventListener('hashchange', () => {
    $$('[data-act="page"]', body).forEach((btn) => btn.setAttribute('aria-pressed', String(location.hash.slice(1) === btn.dataset.page)));
  });

  return { el, render, sync, focusSection, errors };
}
