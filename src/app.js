import content from './data/content.json';

(() => {
  const prefersReduced = () => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  };

  const PACKAGE_ICONS = {
    bronze: '<path d="M8 3h8M8 3l3.2 6M16 3l-3.2 6"/><circle cx="12" cy="14.5" r="5.5"/>',
    silver: '<circle cx="12" cy="9" r="5.5"/><path d="M9 13.5 7.5 21l4.5-2.5L16.5 21 15 13.5"/>',
    gold: '<path d="M4 17 3 8l5.5 4L12 5l3.5 7L21 8l-1 9z"/><path d="M5 20.5h14"/>',
    diamond: '<path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18"/><path d="M12 21 7.5 9M12 21l4.5-12"/>'
  };

  const PACKAGE_BORDER_COLORS = {
    bronze: '#c9803a',
    silver: '#9aa7b5',
    gold: '#f2b01e',
    diamond: '#4fc3f7'
  };

  const PARTY_CARD_META = [
    { cssClass: 'card-bricks4kidz', interval: 3000, ariaLabel: 'Bricks4Kidz carousel' },
    { cssClass: 'card-medical', interval: 3500, ariaLabel: 'Medical school carousel' },
    { cssClass: 'card-teddy', interval: 3200, ariaLabel: 'Teddy bears carousel' }
  ];

  const EXTRA_BG_CLASSES = ['extra-bg-1', 'extra-bg-2', 'extra-bg-3', 'extra-bg-4', 'extra-bg-5', 'extra-bg-6'];

  const SOCIAL_ICONS = {
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.2a2.6 2.6 0 0 1-2.6 2.56 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.78.12v-3.3a5.9 5.9 0 0 0-.78-.05A5.83 5.83 0 0 0 3.9 15.2 5.83 5.83 0 0 0 9.75 21a5.83 5.83 0 0 0 5.85-5.8V9.01a7.53 7.53 0 0 0 4.4 1.4V7.24a4.3 4.3 0 0 1-3.4-1.42z"/></svg>'
  };

  const SOCIAL_LABELS = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

  // Kaina rašoma skliaustuose („Pinjata (30 EUR)"), pastaba — po brūkšnio
  // („Veidų piešimas — arba tatuiruotės (nemokama)").
  const priceNoteSuffix = (priceNote) => (/^\d/.test(priceNote) ? `(${priceNote})` : `— ${priceNote}`);

  const linkAttrs = (href) => (/^https?:\/\//.test(href) ? ' target="_blank" rel="noreferrer"' : '');

  class SimpleCarousel {
    constructor(root) {
      this.root = root;
      this.track = root.querySelector('.carousel__track');
      this.slides = Array.from(root.querySelectorAll('.carousel__slide'));
      this.prevBtn = root.querySelector('.carousel__btn--prev');
      this.nextBtn = root.querySelector('.carousel__btn--next');
      this.dotsWrap = root.querySelector('.carousel__dots');
      this.bar = root.querySelector('.carousel__bar');

      this.index = 0;
      this.isDragging = false;
      this.startX = 0;
      this.currentX = 0;
      this.startTranslate = 0;
      this.width = 0;

      this.autoplay = root.dataset.autoplay === 'true' && !prefersReduced();
      this.intervalMs = Number(root.dataset.interval || 4000);
      this.timer = null;
      this.raf = null;
      this.progressStart = 0;

      this._buildDots();
      this._bind();
      this._measure();
      this.goTo(0, false);
      this._start();
    }

    _measure() {
      this.width = this.root.getBoundingClientRect().width;
    }

    _buildDots() {
      if (!this.dotsWrap) return;
      this.dotsWrap.innerHTML = '';
      this.dots = this.slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.goTo(i);
        });
        this.dotsWrap.appendChild(b);
        return b;
      });
    }

    _setActiveDot() {
      if (!this.dots) return;
      this.dots.forEach((d, i) => d.classList.toggle('is-active', i === this.index));
    }

    _translateFor(index) {
      return -index * this.width;
    }

    goTo(index, animate = true) {
      this._measure();
      this.index = (index + this.slides.length) % this.slides.length;
      this.track.style.transition = animate ? 'transform 420ms ease' : 'none';
      this.track.style.transform = `translateX(${this._translateFor(this.index)}px)`;
      this._setActiveDot();
      this._resetProgress();
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }

    _stopTimers() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    _resetProgress() {
      if (!this.bar || !this.autoplay) return;
      this.progressStart = performance.now();
      this.bar.style.transform = 'scaleX(0)';
    }

    _tickProgress = () => {
      if (!this.bar || !this.autoplay) return;
      const now = performance.now();
      const p = Math.min(1, (now - this.progressStart) / this.intervalMs);
      this.bar.style.transform = `scaleX(${p})`;
      this.raf = requestAnimationFrame(this._tickProgress);
    };

    _start() {
      this._stopTimers();
      if (!this.autoplay) return;
      this._resetProgress();
      this.raf = requestAnimationFrame(this._tickProgress);
      this.timer = setInterval(() => { this.next(); }, this.intervalMs);
    }

    _pause() { this._stopTimers(); }

    _bind() {
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation(); this.prev(); this._start();
        });
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation(); this.next(); this._start();
        });
      }

      this.root.addEventListener('mouseenter', () => this._pause());
      this.root.addEventListener('mouseleave', () => this._start());

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this._pause();
        else this._start();
      });

      window.addEventListener('resize', () => {
        const prevIndex = this.index;
        this._measure();
        this.goTo(prevIndex, false);
      });

      const onDown = (e) => {
        this.isDragging = true;
        this._pause();
        this.track.style.transition = 'none';
        this.startX = (e.touches ? e.touches[0].clientX : e.clientX);
        this.currentX = this.startX;
        const m = /translateX\(([-0-9.]+)px\)/.exec(this.track.style.transform || '');
        this.startTranslate = m ? Number(m[1]) : this._translateFor(this.index);
      };

      const onMove = (e) => {
        if (!this.isDragging) return;
        this.currentX = (e.touches ? e.touches[0].clientX : e.clientX);
        const dx = this.currentX - this.startX;
        this.track.style.transform = `translateX(${this.startTranslate + dx}px)`;
      };

      const onUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        const dx = this.currentX - this.startX;
        const threshold = Math.min(120, this.width * 0.18);
        if (dx > threshold) this.prev();
        else if (dx < -threshold) this.next();
        else this.goTo(this.index);
        this._start();
      };

      this.root.addEventListener('mousedown', onDown);
      this.root.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      this.root.addEventListener('touchstart', onDown, { passive: true });
      this.root.addEventListener('touchmove', onMove, { passive: true });
      this.root.addEventListener('touchend', onUp);

      this.root.tabIndex = 0;
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); this._start(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); this._start(); }
      });
    }
  }

  function renderHeader() {
    const taglineEl = document.querySelector('.header-tagline-text');
    if (taglineEl) taglineEl.textContent = content.header.tagline;

    const phoneEl = document.querySelector('.header-phone');
    if (phoneEl) phoneEl.innerHTML = `<span class="header-phone-label">Teirautis telefonu:</span> ${content.header.phone}`;

    const registerEl = document.querySelector('.nav-register');
    if (registerEl) registerEl.textContent = content.header.buttonText;
  }

  function renderHeroSlides() {
    return content.hero.slides.map((slide) => {
      // blurFill: nuotrauka rodoma visa, neapkirpta, o šonai užpildomi
      // padidinta ir neryškia tos pačios nuotraukos kopija.
      const bg = slide.blurFill
        ? `<img src="${slide.image}" alt="" aria-hidden="true" class="slide-img-bg">`
        : '';
      const pos = !slide.blurFill && slide.objectPosition
        ? ` style="object-position:${slide.objectPosition}"`
        : '';
      return `
            <div class="carousel__slide${slide.blurFill ? ' carousel__slide--blurfill' : ''}">
              ${bg}<img src="${slide.image}" alt="${slide.alt}" class="slide-img"${pos}>
              <div class="slide-overlay"><div class="slide-title">${slide.title}</div><div class="slide-sub">${slide.sub}</div></div>
            </div>`;
    }).join('');
  }

  function renderPartyCards() {
    return content.partyCards.map((card, i) => {
      const meta = PARTY_CARD_META[i];
      return `
          <a class="card ${meta.cssClass}" href="${card.link}"${linkAttrs(card.link)}>
            <div class="card-title">${card.title}</div>
            <div class="card-carousel-wrap">
              <div class="carousel carousel--card" data-autoplay="true" data-interval="${meta.interval}" aria-label="${meta.ariaLabel}">
                <button class="carousel__btn carousel__btn--prev" aria-label="Previous slide">&#8249;</button>
                <button class="carousel__btn carousel__btn--next" aria-label="Next slide">&#8250;</button>
                <div class="carousel__viewport">
                  <div class="carousel__track">
                    ${card.images.map((img) => `<div class="carousel__slide"><img src="${img.image}" alt="${img.alt}" class="slide-img"></div>`).join('')}
                  </div>
                </div>
                <div class="carousel__dots" aria-label="Carousel pagination"></div>
              </div>
            </div>
            <div class="card-hint">${card.hint}</div>
          </a>`;
    }).join('');
  }

  function renderPramogosStrip() {
    return content.pramogos.map((p) => `
                <div class="extras-wide-item">
                  <img src="${p.image}" alt="${p.name}" class="extras-wide-img" loading="lazy">
                  <div class="extras-wide-label">${p.name}</div>
                  ${p.priceNote ? `<div class="extras-wide-price">${p.priceNote}</div>` : ''}
                </div>`).join('');
  }

  function renderPackagesGrid() {
    return content.packages.map((pkg) => `
        <a href="/#birthday-packages" class="package-card package-${pkg.key}" aria-label="${pkg.name} gimtadienio paketas">
          <div class="package-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PACKAGE_ICONS[pkg.key]}</svg>
          </div>
          <div class="package-name">${pkg.name}</div>
          ${pkg.price ? `<div class="package-price">${pkg.price}</div>` : ''}
          <div class="package-hint">${pkg.hint}</div>
        </a>`).join('');
  }

  function renderTestimonials() {
    return content.testimonials.map((t) => `
        <div class="testimonial-card">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">"${t.text}"</p>
          <div class="testimonial-author">${t.author}</div>
        </div>`).join('');
  }

  function renderBrandsFooter() {
    return content.brandsFooter.map((brand) => `
        <div class="brand-col">
          <a href="${brand.link}"${linkAttrs(brand.link)} class="brand-logo-link">
            <img src="${brand.logo}" alt="${brand.logoAlt}" class="brand-logo-img">
          </a>
          <div class="brand-social-links">
            ${brand.socials.filter((s) => s.url && SOCIAL_ICONS[s.platform]).map((s) => `<a href="${s.url}"${linkAttrs(s.url)} class="brand-social-link" aria-label="${brand.logoAlt} ${SOCIAL_LABELS[s.platform]}">
              ${SOCIAL_ICONS[s.platform]}
              <span>${SOCIAL_LABELS[s.platform]}</span>
            </a>`).join('')}
          </div>
        </div>`).join('');
  }

  function renderFooterCredit() {
    const f = content.footer;
    return `
        <div class="site-credits">
          <div class="site-copyright">${f.copyright}</div>
          <div class="site-credit-line">${f.creditPrefix} <a href="${f.creditUrl}" target="_blank" rel="noreferrer">${f.creditLinkText}</a> ${f.creditSuffix}</div>
        </div>`;
  }

  function renderCityOptions() {
    return content.cities.map((c) => `<option value="${c.value}">${c.label}</option>`).join('');
  }

  function renderThemeOptions() {
    return content.themes.map((group) => `
                  <optgroup label="${group.brand}">
                    ${group.themes.map((t) => `<option value="${t}">${t}</option>`).join('')}
                  </optgroup>`).join('');
  }

  function renderPramogosCheckboxes() {
    return content.pramogos.map((p) => `
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="${p.name}"> <span>${p.name}${p.priceNote ? ` <span class="checkbox-price">${priceNoteSuffix(p.priceNote)}</span>` : ''}</span></label>`).join('');
  }

  function renderPaketasOptions() {
    return content.packages.map((pkg) => `<option value="${pkg.name}">${pkg.price ? `${pkg.name} — ${pkg.price}` : pkg.name}</option>`).join('');
  }

  // Kiekvienas paketas rodo PILNĄ sąrašą: JSON'e laikomi tik unikalūs punktai,
  // o čia jie sudedami kaskadiškai su visais ankstesnių paketų punktais.
  function cumulativeContents(index) {
    return content.packages.slice(0, index + 1).flatMap((pkg) => pkg.contents);
  }

  function renderPackagesDetailGrid() {
    return content.packages.map((pkg, i) => `
            <div class="package-detail" style="border-color:${PACKAGE_BORDER_COLORS[pkg.key]}">
              <div class="package-detail-head package-${pkg.key}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PACKAGE_ICONS[pkg.key]}</svg>
                <h3>${pkg.name}</h3>
                ${pkg.price ? `<div class="package-detail-price">${pkg.price}</div>` : ''}
              </div>
              <div class="package-detail-plus">Į paketą įeina:</div>
              <ul>
                ${cumulativeContents(i).map((c) => `<li>${c}</li>`).join('')}
              </ul>
            </div>`).join('');
  }

  function collectPramogos(form) {
    return Array.from(form.querySelectorAll('input[name="pramogos"]:checked'))
      .map((el) => el.value)
      .join(', ');
  }

  async function submitReservationForm(form) {
    const successEl = form.querySelector('.form-success');
    const payload = Object.fromEntries(new FormData(form).entries());
    if (form.querySelector('input[name="pramogos"]')) {
      payload.pramogos = collectPramogos(form);
    }
    // El. paštu siunčiamas pilnas miesto pavadinimas su adresu, ne sistemos raktas.
    const city = content.cities.find((c) => c.value === payload.city);
    if (city) payload.city = city.label;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Nepavyko išsiųsti registracijos.');
      }
      form.reset();
      if (successEl) {
        successEl.classList.remove('is-error');
        successEl.textContent = '✅ Ačiū! Rezervacija gauta. Laukite patvirtinimo el. paštu.';
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      if (successEl) {
        successEl.classList.add('is-error');
        successEl.textContent = `⚠️ ${err.message}`;
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function renderExtrasGrid() {
    return content.pramogos.map((p, i) => `
            <div class="extra-card">
              <div class="extra-card-top ${EXTRA_BG_CLASSES[i]}">
                <img src="${p.image}" alt="${p.name}" class="extra-card-img" loading="lazy">
                <h3 class="extra-card-name">${p.name}${p.priceNote ? `<span class="extra-card-price">${p.priceNote}</span>` : ''}</h3>
              </div>
              <div class="extra-card-body">${p.description}</div>
            </div>`).join('');
  }

  class PageRouter {
    constructor() {
      this.container = document.querySelector('.container');
      window.addEventListener('hashchange', () => this.handleRoute());
      renderHeader();
      this.handleRoute();
    }

    handleRoute() {
      const hash = window.location.hash.slice(1) || '';

      if (hash === 'contact') {
        this.showSignupPage();
      } else if (hash === 'teddy-birthdays') {
        this.showTeddyPage();
      } else if (hash === 'birthday-extras') {
        this.showExtrasPage();
      } else if (hash === 'birthday-packages') {
        this.showPackagesPage();
      } else {
        this.showHomePage();
      }

      setTimeout(() => {
        document.querySelectorAll('.carousel').forEach((el) => new SimpleCarousel(el));

        document.querySelectorAll('[data-reveal]').forEach((el) => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(10px)';
          el.style.transition = 'opacity 800ms cubic-bezier(0.4, 0, 0.2, 1), transform 800ms cubic-bezier(0.4, 0, 0.2, 1)';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });

        // Teddy form handler
        const teddyForm = document.querySelector('.teddy-form');
        if (teddyForm) {
          teddyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReservationForm(teddyForm);
          });
        }

        // Generic form handler
        const signupForm = document.querySelector('.signup-form:not(.teddy-form)');
        if (signupForm) {
          signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReservationForm(signupForm);
          });
        }
      }, 0);
    }

    showHomePage() {
      this.container.innerHTML = `
    <!-- HERO full width -->
    <section class="hero-section" data-reveal style="--d:100ms">
      <div class="carousel" data-autoplay="true" data-interval="4000" aria-label="Hero carousel">
        <button class="carousel__btn carousel__btn--prev" aria-label="Previous slide">&#8249;</button>
        <button class="carousel__btn carousel__btn--next" aria-label="Next slide">&#8250;</button>
        <div class="carousel__viewport">
          <div class="carousel__track">${renderHeroSlides()}
          </div>
        </div>
        <div class="carousel__progress" aria-hidden="true"><div class="carousel__bar"></div></div>
        <div class="carousel__dots" aria-label="Carousel pagination"></div>
      </div>
    </section>

    <!-- PARTY OPTIONS -->
    <section class="parties-section" data-reveal style="--d:160ms">
      <div class="inner-wrap">

        <!-- Top row: 3 cards -->
        <div class="grid-top">${renderPartyCards()}
        </div>

        <!-- Bottom row: full-width extras -->
        <div class="grid-bottom">
          <div class="extras-block">
            <h2 class="h2 h2--red">Šventės pramogos</h2>
            <p class="extras-block-sub">Pasirink pramogą ir padaryk šventę dar įsimintinesnę.</p>
            <div class="card card-extras card-extras-wide card--static">
              <div class="extras-wide-content">${renderPramogosStrip()}
              </div>
            </div>
            <div class="extras-block-note">gali būti taikomas papildomas mokestis</div>
          </div>
        </div>

      </div>
    </section>

    <!-- BIRTHDAY PACKAGES -->
    <section class="packages-section inner-wrap" data-reveal style="--d:200ms">
      <h2 class="h2">Gimtadienio paketai</h2>
      <div class="packages-grid">${renderPackagesGrid()}
      </div>
      <div class="packages-cta">
        <a href="/#birthday-packages" class="reg-btn">Pasirink gimtadienio paketą</a>
      </div>
    </section>

    <!-- TESTIMONIALS (no heading) -->
    <section class="testimonials-section inner-wrap" data-reveal style="--d:240ms">
      <div class="testimonials-grid">${renderTestimonials()}
      </div>
    </section>

    <!-- CONTACT – horizontal -->
    <section id="contact" class="contact-section inner-wrap" data-reveal style="--d:280ms">
      <div class="contact-horizontal">
        <div class="contact-label">Susisiekite su mumis</div>
        <div class="contact-sep"></div>
        <div class="contact-item"><strong>Telefonas:</strong> <a href="tel:${content.contact.phone.replace(/\s+/g, '')}" class="contact-link">${content.contact.phone}</a></div>
        <div class="contact-sep"></div>
        <div class="contact-item"><strong>El. paštas:</strong> <a href="mailto:${content.contact.email}" class="contact-link">${content.contact.email}</a></div>
        <a href="/#contact" class="reg-btn">${content.contact.reserveButtonText}</a>
      </div>
    </section>

    <!-- BRANDS / LOGOS FOOTER -->
    <section class="brands-section inner-wrap" data-reveal style="--d:320ms">
      <div class="brands-grid">${renderBrandsFooter()}
      </div>${renderFooterCredit()}
    </section>
      `;
    }

    showSignupPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2">Gimtadienio Rezervacija</h2>
          <div class="phone-note">Teirautis telefonu: <a href="tel:${content.contact.phone.replace(/\s+/g, '')}">${content.contact.phone}</a></div>
          <div class="signup-wrapper">
            <form class="signup-form" name="gimtadienis-registracija" method="POST">
              <input type="hidden" name="form-name" value="gimtadienis-registracija">
              <div class="form-group">
                <label for="name">Vardas</label>
                <input type="text" id="name" name="name" required>
              </div>
              <div class="form-group">
                <label for="email">El. paštas</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-group">
                <label for="phone">Telefonas</label>
                <input type="tel" id="phone" name="phone">
              </div>
              <div class="form-group">
                <label for="city">Miestas</label>
                <select id="city" name="city" required>
                  <option value="">Pasirinkite miestą</option>${renderCityOptions()}
                </select>
              </div>
              <div class="form-group">
                <label for="date">Gimtadienio Data</label>
                <input type="date" id="date" name="date" required>
              </div>
              <div class="form-group">
                <label for="guests">Svečių Skaičius</label>
                <input type="number" id="guests" name="guests" min="1" required>
              </div>
              <div class="form-group">
                <label>Pageidaujamos pramogos <span class="label-note">(gali būti taikomas papildomas mokestis)</span></label>
                <div class="checkbox-group">${renderPramogosCheckboxes()}
                </div>
              </div>
              <div class="form-group">
                <label for="tema">Tema</label>
                <select id="tema" name="tema" required>
                  <option value="" disabled selected>Pasirinkite temą</option>${renderThemeOptions()}
                </select>
              </div>
              <div class="form-group">
                <label for="paketas">Gimtadienio paketas</label>
                <select id="paketas" name="paketas">
                  <option value="">Pasirinkite paketą</option>
                  ${renderPaketasOptions()}
                </select>
              </div>
              <div class="reservation-notice">${content.contact.notice}</div>
              <button type="submit" class="reg-btn" style="width:100%;margin-top:8px">Rezervuoti</button>
              <div class="form-success"></div>
            </form>
            <div class="signup-image-wrap">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2F981c188440564f9ca66e89daf788983d?format=webp&width=800" alt="Birthday party" class="signup-image">
            </div>
          </div>
        </section>
      `;
    }

    showTeddyPage() {
      this.container.innerHTML = `
        <div class="teddy-page">

          <!-- Pastel hero banner -->
          <div class="teddy-page-hero" data-reveal style="--d:80ms">
            <!-- Scattered stars -->
            <div class="teddy-star" style="width:18px;height:18px;top:18%;left:8%"></div>
            <div class="teddy-star" style="width:12px;height:12px;top:30%;left:18%"></div>
            <div class="teddy-star" style="width:20px;height:20px;top:10%;left:35%"></div>
            <div class="teddy-star" style="width:10px;height:10px;top:55%;left:42%"></div>
            <div class="teddy-star" style="width:14px;height:14px;top:22%;left:55%"></div>
            <div class="teddy-star" style="width:16px;height:16px;top:15%;right:25%"></div>
            <div class="teddy-star" style="width:11px;height:11px;top:40%;right:18%"></div>

            <div class="teddy-hero-left">
              <div class="teddy-hero-tagline">ĮKVĖPK<br>MUMS<br>GYVYBĘ</div>
            </div>
            <div class="teddy-hero-bear">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2Fb1c4d2db544a48c6a3d2e75974aa9b70?format=webp&width=600" alt="Meškučiai" class="teddy-hero-bear-img">
            </div>
          </div>

          <!-- Pink sub-strip -->
          <div class="teddy-pink-strip">
            <span class="teddy-pink-strip-dot">&#9733;</span>
            <span class="teddy-pink-strip-text">Gimtadienio šventėje</span>
            <span class="teddy-pink-strip-dot">&#9733;</span>
            <span class="teddy-pink-strip-text">Renginyje</span>
            <span class="teddy-pink-strip-dot">&#9733;</span>
            <span class="teddy-pink-strip-text">Susibūrime</span>
            <span class="teddy-pink-strip-dot">&#9733;</span>
          </div>

          <div class="teddy-content">
            <a href="/" class="teddy-back-link">&#8592; Grįžti į pradžią</a>

            <!-- Logo -->
            <div class="teddy-logo-section" data-reveal style="--d:100ms">
              <img src="/logos/meskuciai.jpeg" alt="Meškučiai – Sukurk mus!" class="teddy-logo-img">
              <p class="teddy-logo-tagline">Kiekvienas vaikas ateina su savo pliušiniu draugu – ir išeina su nauja istorija</p>
            </div>

            <!-- Feature cards -->
            <div class="teddy-cards-grid" data-reveal style="--d:140ms">
              <div class="teddy-card">
                <div class="teddy-card-icon teddy-card-icon-1">
                  <img src="/logos/meskuciai.jpeg" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
                </div>
                <h3>Teminės Dekoracijos</h3>
                <p>Meškučių tema su spalvingomis dekoracijomis, sukuriančiomis nepakartojamą atmosferą kiekvienam vaikui.</p>
              </div>
              <div class="teddy-card">
                <div class="teddy-card-icon teddy-card-icon-2">
                  <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=60&h=60&fit=crop&auto=format" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
                </div>
                <h3>Interaktyvūs Žaidimai</h3>
                <p>Žaidimai su pliušinukais, kūrybinės veiklos ir smagūs konkursai kiekvienam šventės dalyviui.</p>
              </div>
              <div class="teddy-card">
                <div class="teddy-card-icon teddy-card-icon-3">
                  <img src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=60&h=60&fit=crop&auto=format" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
                </div>
                <h3>Šventinis Pyragas</h3>
                <p>Specialiai pagamintas pyragas su meškučio figūra – tikras šventės centras, kuris džiugins visus.</p>
              </div>
              <div class="teddy-card">
                <div class="teddy-card-icon teddy-card-icon-4">
                  <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=60&h=60&fit=crop&auto=format" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">
                </div>
                <h3>Dovanėlės Svečiams</h3>
                <p>Kiekvienas svečias išeina su atminimėliu – maža meškučio istorija, kurią pasisineša namo.</p>
              </div>
            </div>

            <!-- Form + image -->
            <div class="signup-wrapper" data-reveal style="--d:180ms">
              <div class="teddy-form-wrap">
                <div class="teddy-form-title">Rezervacija</div>
                <form class="signup-form teddy-form" name="meskuciai-registracija" method="POST">
                  <input type="hidden" name="form-name" value="meskuciai-registracija">
                  <div class="form-group">
                    <label for="t-name">Vaiko vardas</label>
                    <input type="text" id="t-name" name="name" required>
                  </div>
                  <div class="form-group">
                    <label for="t-email">Tėvelių el. paštas</label>
                    <input type="email" id="t-email" name="email" required>
                  </div>
                  <div class="form-group">
                    <label for="t-phone">Telefonas</label>
                    <input type="tel" id="t-phone" name="phone" required>
                  </div>
                  <div class="form-group">
                    <label for="t-city">Miestas</label>
                    <select id="t-city" name="city" required>
                      <option value="">Pasirinkite miestą</option>${renderCityOptions()}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="t-date">Pageidaujama data</label>
                    <input type="date" id="t-date" name="date" required>
                  </div>
                  <div class="form-group">
                    <label for="t-guests">Vaikų skaičius</label>
                    <input type="number" id="t-guests" name="guests" min="1" required>
                  </div>
                  <div class="form-group">
                    <label for="t-comments">Komentarai / pageidavimai</label>
                    <input type="text" id="t-comments" name="comments" placeholder="Pvz., vaiko amžius, tema...">
                  </div>
                  <div class="reservation-notice">${content.contact.notice}</div>
                  <button type="submit" class="teddy-submit-btn">Rezervuoti</button>
                  <div class="form-success"></div>
                </form>
              </div>
              <div class="teddy-form-img">
                <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2Fa9fb08ffa873450893193bd4b7ff5587?format=webp&width=800" alt="Meškučių šventė">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    showPackagesPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2" style="margin:0">Gimtadienio paketai</h2>

          <div style="margin: 0 0 20px;">
            <a href="/" class="reg-btn" style="display: inline-flex; width: auto; margin-top: 0;">
                ← Grįžti į pradžią
            </a>
          </div>

          <p class="description">Pasirink šventės paketą pagal savo norus — nuo klasikinės šventės iki „viskas įskaičiuota". Kiekvienoje šventėje laukia privati erdvė, edukatorius ir pilna pramogų programa.</p>

          <div class="packages-detail-grid">${renderPackagesDetailGrid()}
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">Rezervuoti šventę</a>
          </div>
        </section>
      `;
    }

    showExtrasPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2" style="margin:0;color: #E8181A;">Šventės Pramogos</h2>

          <div style="margin: 0 0 20px;">
            <a href="/" class="reg-btn" style="display: inline-flex; width: auto; margin-top: 0;">
                ← Grįžti į pradžią
            </a>
          </div>

          <div class="extras-hero">
            <div class="extras-hero-text">Sukurk šventę, kurią visi prisimins!<br><span style="font-size:0.55em;font-weight:700;opacity:.9">Pasirink iš mūsų spalvingų pramogų kolekcijos</span></div>
          </div>

          <div class="extras-grid-new">${renderExtrasGrid()}
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">Registruokis ir pasirink pramogas</a>
          </div>
        </section>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (!prefersReduced()) {
      requestAnimationFrame(() => {
        body.classList.remove('preload');
        body.classList.add('loaded');
      });
    } else {
      body.classList.remove('preload');
      body.classList.add('loaded');
    }

    new PageRouter();
  });
})();
