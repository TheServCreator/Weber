// Maps the DOM that app.js renders back to content.json paths.
//
// Stovyklos emits data-edit-* from its renderer; Weber's renderer lives in the
// visitor bundle, so we tag the rendered DOM here instead and the visitor
// bundle carries no editor code. Every selector below mirrors a template in
// src/app.js — if a template changes, update the matching block.
//
//   data-edit="path"         text, edited in place (or in a popover with mode)
//   data-edit-mode="popup"   edit in a small dialog instead of in place
//   data-edit-kind="tel|email"  validation for the popover text field
//   data-edit-link="path"    URL, edited via the hover toolbar / popover
//   data-edit-img="path"     image, replaced via the hover toolbar
//   data-edit-panel="id"     click opens that side-panel section (prices)

import { $, $$ } from './ui.js';

// Mirrors SOCIAL_ICONS in app.js: links for other platforms are not rendered,
// so they must be skipped when matching rendered links to content indexes.
const RENDERED_SOCIALS = ['facebook', 'instagram', 'tiktok'];

function mark(el, attrs) {
  if (!el) return;
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) el.setAttribute(k === 'text' ? 'data-edit' : `data-edit-${k}`, v);
  }
}
const text = (el, path) => mark(el, { text: path });

// Mixed-content elements ("Teirautis telefonu: +370…", quoted testimonials,
// name + price heading) get the value wrapped in its own span so only the
// content itself becomes editable.
function wrapValue(el, path, value) {
  if (!el || !value) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const i = node.data.indexOf(value);
    if (i === -1) continue;
    const hit = node.splitText(i);
    hit.splitText(value.length);
    const span = document.createElement('span');
    hit.replaceWith(span);
    span.appendChild(hit);
    text(span, path);
    return;
  }
}

function header(c) {
  text($('.header-tagline-text'), 'header.tagline');
  wrapValue($('.header-phone'), 'header.phone', c.header.phone);
  mark($('.nav-register'), { text: 'header.buttonText', mode: 'popup' });
}

function home(c) {
  $$('.hero-section .carousel__slide').forEach((slide, i) => {
    const p = `hero.slides.${i}`;
    text($('.slide-title', slide), `${p}.title`);
    text($('.slide-sub', slide), `${p}.sub`);
    mark($('img.slide-img', slide), { img: `${p}.image` });
  });

  $$('.grid-top > a.card').forEach((card, i) => {
    const p = `partyCards.${i}`;
    mark(card, { link: `${p}.link` });
    text($('.card-title', card), `${p}.title`);
    text($('.card-hint', card), `${p}.hint`);
    $$('.carousel__slide img', card).forEach((img, j) => mark(img, { img: `${p}.images.${j}.image` }));
  });

  $$('.extras-wide-item').forEach((item, i) => {
    const p = `pramogos.${i}`;
    mark($('img', item), { img: `${p}.image` });
    text($('.extras-wide-label', item), `${p}.name`);
    text($('.extras-wide-price', item), `${p}.priceNote`);
  });

  $$('.packages-grid .package-card').forEach((card, i) => {
    const p = `packages.${i}`;
    text($('.package-name', card), `${p}.name`);
    text($('.package-hint', card), `${p}.hint`);
    // Prices follow a fixed format; they are edited as numbers in the panel.
    mark($('.package-price', card), { panel: 'packages' });
  });

  $$('.testimonials-grid .testimonial-card').forEach((card, i) => {
    const p = `testimonials.${i}`;
    wrapValue($('.testimonial-text', card), `${p}.text`, c.testimonials[i]?.text);
    text($('.testimonial-author', card), `${p}.author`);
  });

  const contact = $('#contact.contact-section');
  if (contact) {
    const [phone, email] = $$('.contact-link', contact);
    mark(phone, { text: 'contact.phone', mode: 'popup', kind: 'tel' });
    mark(email, { text: 'contact.email', mode: 'popup', kind: 'email' });
    mark($('.reg-btn', contact), { text: 'contact.reserveButtonText', mode: 'popup' });
  }

  $$('.brands-grid .brand-col').forEach((col, i) => {
    const p = `brandsFooter.${i}`;
    mark($('.brand-logo-link', col), { link: `${p}.link` });
    mark($('.brand-logo-img', col), { img: `${p}.logo` });
    const shown = (c.brandsFooter[i]?.socials || [])
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => s.url && RENDERED_SOCIALS.includes(s.platform));
    $$('.brand-social-link', col).forEach((a, j) => {
      if (shown[j]) mark(a, { link: `${p}.socials.${shown[j].idx}.url` });
    });
  });

  // The credit line (WebSprendimas.lt backlink) is deliberately not editable.
  text($('.site-copyright'), 'footer.copyright');
}

function packagesPage(c) {
  $$('.packages-detail-grid .package-detail').forEach((box, i) => {
    const p = `packages.${i}`;
    text($('h3', box), `${p}.name`);
    mark($('.package-detail-price', box), { panel: 'packages' });
    // Lists are cumulative (see cumulativeContents in app.js): item k of
    // package i may belong to an earlier package.
    const paths = c.packages.slice(0, i + 1)
      .flatMap((pkg, j) => pkg.contents.map((_, k) => `packages.${j}.contents.${k}`));
    $$('li', box).forEach((li, k) => { if (paths[k]) text(li, paths[k]); });
  });
}

function extrasPage(c) {
  $$('.extras-grid-new .extra-card').forEach((card, i) => {
    const p = `pramogos.${i}`;
    mark($('img', card), { img: `${p}.image` });
    wrapValue($('.extra-card-name', card), `${p}.name`, c.pramogos[i]?.name);
    text($('.extra-card-price', card), `${p}.priceNote`);
    text($('.extra-card-body', card), `${p}.description`);
  });
}

function reservationPages() {
  const phone = $('.phone-note a');
  mark(phone, { text: 'contact.phone', mode: 'popup', kind: 'tel' });
  $$('.reservation-notice').forEach((el) => text(el, 'contact.notice'));
}

export function annotate(content) {
  header(content);
  home(content);
  packagesPage(content);
  extrasPage(content);
  reservationPages();
}
