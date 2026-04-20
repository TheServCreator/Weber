(() => {
  const prefersReduced = () => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  };

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
        b.setAttribute('aria-label', `Skaidrė ${i + 1}`);
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
          e.preventDefault(); e.stopPropagation();
          this.prev(); this._start();
        });
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          this.next(); this._start();
        });
      }

      this.root.addEventListener('mouseenter', () => this._pause());
      this.root.addEventListener('mouseleave', () => this._start());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this._pause(); else this._start();
      });
      window.addEventListener('resize', () => {
        const prev = this.index;
        this._measure();
        this.goTo(prev, false);
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

  class PageRouter {
    constructor() {
      this.container = document.querySelector('.container');
      this.originalContent = this.container.innerHTML;
      window.addEventListener('hashchange', () => this.handleRoute());
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
      } else {
        this.showHomePage();
      }

      setTimeout(() => {
        document.querySelectorAll('.carousel').forEach((el) => new SimpleCarousel(el));
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(10px)';
          el.style.transition = 'opacity 800ms cubic-bezier(0.4,0,0.2,1),transform 800ms cubic-bezier(0.4,0,0.2,1)';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });
      }, 0);
    }

    showHomePage() {
      this.container.innerHTML = this.originalContent;
    }

    showSignupPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d:140ms">
          <h2 class="h2 green">Gimtadienio Registracija</h2>
          <div class="signup-wrapper">
            <div class="signup-form">
              <div class="form-group">
                <label for="name">Vardas</label>
                <input type="text" id="name" name="name" required placeholder="Jūsų vardas">
              </div>
              <div class="form-group">
                <label for="email">El. paštas</label>
                <input type="email" id="email" name="email" required placeholder="el.pastas@example.com">
              </div>
              <div class="form-group">
                <label for="phone">Telefonas</label>
                <input type="tel" id="phone" name="phone" placeholder="+370 000 00000">
              </div>
              <div class="form-group">
                <label for="city">Miestas</label>
                <select id="city" name="city" required>
                  <option value="">Pasirinkite miestą</option>
                  <option value="vilnius">Vilnius</option>
                  <option value="kaunas">Kaunas</option>
                  <option value="klaipeda">Klaipėda</option>
                </select>
              </div>
              <div class="form-group">
                <label for="date">Gimtadienio data</label>
                <input type="date" id="date" name="date" required>
              </div>
              <div class="form-group">
                <label for="guests">Svečių skaičius</label>
                <input type="number" id="guests" name="guests" min="1" required placeholder="10">
              </div>
              <div class="form-group">
                <label for="party-type">Šventės tipas</label>
                <select id="party-type" name="party-type" required>
                  <option value="">Pasirinkite šventės tipą</option>
                  <option value="bricks4kidz">Bricks4Kidz</option>
                  <option value="medical">Little Medical School</option>
                  <option value="teddy">Meškučiai – Sukurk Mus</option>
                  <option value="extras">Gimtadienio Papildai</option>
                </select>
              </div>
              <button type="button" class="reg-btn" style="width:100%;margin-top:8px">Registruotis</button>
            </div>
            <div class="signup-image-wrap">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2F981c188440564f9ca66e89daf788983d?format=webp&width=800" alt="Gimtadienio šventė" class="signup-image">
            </div>
          </div>
        </section>
      `;
    }

    showTeddyPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap teddy-page" data-reveal style="--d:140ms">

          <div class="teddy-hero">
            <div class="teddy-hero-stars"></div>
            <div class="teddy-hero-content">
              <img src="/logos/meskuciai.jpg" alt="Meškučiai" class="teddy-hero-logo">
              <h1 class="teddy-hero-title">Įkvėpk Mums Gyvybę</h1>
              <p class="teddy-hero-sub">Gimtadienio šventėje &nbsp;·&nbsp; Renginyje &nbsp;·&nbsp; Susibūrime</p>
            </div>
          </div>

          <div class="teddy-banner-strip">
            Sukurk savo unikalų meškutį — prikimšk, aprenk, pavadink ir išnesk namo!
          </div>

          <h2 class="h2" style="color:#7a4e8c;font-family:Nunito,sans-serif">Apie Meškučius</h2>
          <p class="description">
            Meškučiai — tai ypatinga kūrybinė veikla, kurios metu kiekvienas vaikas pats sukuria savo
            pliušinį draugą. Pasirink, prikimšk, aprenk ir paskirk vardą — gimsta naujas draugas!
            Tobulas gimtadienio prisiminimas, kurį vaikas parsineš namo.
          </p>

          <div class="teddy-steps">
            <div class="teddy-step">
              <div class="teddy-step-num">1</div>
              <h4>Pasirink</h4>
              <p>Pasirink savo mėgstamą meškučio ar gyvūnėlio formą</p>
            </div>
            <div class="teddy-step">
              <div class="teddy-step-num">2</div>
              <h4>Prikimšk</h4>
              <p>Pats prikimšk savo draugą minkštu pūku ir įdėk širdelę</p>
            </div>
            <div class="teddy-step">
              <div class="teddy-step-num">3</div>
              <h4>Aprenk</h4>
              <p>Pasirink kostiumą ir papuošk savo unikalų kūrinį</p>
            </div>
            <div class="teddy-step">
              <div class="teddy-step-num">4</div>
              <h4>Pavadink</h4>
              <p>Suteik vardą ir išduok metrikus savo naujam draugui</p>
            </div>
          </div>

          <h2 class="h2" style="color:#7a4e8c;font-family:Nunito,sans-serif">Kodėl Meškučiai?</h2>

          <div class="teddy-grid">
            <div class="teddy-feature">
              <div class="teddy-feature-icon-bg" style="background:linear-gradient(135deg,#a8d8ea,#d4b8e8)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a3060" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <h3>Nepamirštama dovana</h3>
              <p>Kiekvienas vaikas parsineša namo paties sukurtą meškutį — unikalų ir mylimą</p>
            </div>
            <div class="teddy-feature">
              <div class="teddy-feature-icon-bg" style="background:linear-gradient(135deg,#f9b7d0,#ffd6e8)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a3060" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <h3>Džiaugsmas visiems</h3>
              <p>Tinkama 3–12 metų vaikams, žaismingas ir kūrybiškas procesas</p>
            </div>
            <div class="teddy-feature">
              <div class="teddy-feature-icon-bg" style="background:linear-gradient(135deg,#c8f0d8,#a8d8ea)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2a6040" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h3>Unikalus patyrimas</h3>
              <p>Vaikų sukurti meškučiai yra visiškai unikalūs — niekur kitur tokio nerasite</p>
            </div>
            <div class="teddy-feature">
              <div class="teddy-feature-icon-bg" style="background:linear-gradient(135deg,#fff3b0,#ffd6a5)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7a5000" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>Grupinė veikla</h3>
              <p>Puikiai tinka gimtadieniams, mokyklos renginiams ir šeimų susibūrimams</p>
            </div>
          </div>

          <div class="teddy-cta">
            <p style="color:#5a3a7a;font-weight:700;font-size:16px;margin:0 0 16px">
              Norite surengti Meškučių šventę? Susisiekite su mumis!
            </p>
            <a href="https://www.facebook.com/profile.php?id=100064280611950" target="_blank" rel="noreferrer" class="teddy-reg-btn">
              Susisiekite per Facebook
            </a>
            &nbsp;&nbsp;
            <a href="/#contact" class="teddy-reg-btn" style="background:linear-gradient(135deg,#00aa44,#007a30)">
              Registruotis
            </a>
          </div>

        </section>
      `;
    }

    showExtrasPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d:140ms">
          <h2 class="h2 red">Gimtadienio Papildai</h2>
          <p class="description">Padarykite savo šventę dar geresnę su šiais nuostabiais papildais!</p>

          <div class="extras-hero">
            <div class="extras-hero-text">Sukurk šventę, kurią visi prisimins!<br><span style="font-size:0.55em;font-family:Nunito,sans-serif;font-weight:700;opacity:.9">Pasirink iš mūsų spalvingų papildų kolekcijos</span></div>
          </div>

          <div class="extras-grid-new">
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop" alt="Animatorius">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Animatorius</h3></div>
              </div>
              <div class="extra-card-body">Profesionalus animatorius, kuris vedė šventę ir žaidimų programą nuo pradžios iki pabaigos.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop" alt="Balionų dekoracija">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Balionų Dekoracija</h3></div>
              </div>
              <div class="extra-card-body">Nuostabūs balionų dekoracijos, figūros ir kompozicijos, kurios nustebins kiekvieną.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&auto=format&fit=crop" alt="Fotosesija">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Fotosesija</h3></div>
              </div>
              <div class="extra-card-body">Profesionali fotosesija su redakcija — nepamirštami prisiminimai visam gyvenimui.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop" alt="Dekoruotas pyragas">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Dekoruotas Pyragas</h3></div>
              </div>
              <div class="extra-card-body">Specialiai pagamintas ir dekoruotas pyragas pagal pasirinktą šventės temą.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop" alt="Dovanų paketai">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Dovanų Paketai</h3></div>
              </div>
              <div class="extra-card-body">Specialiai paruošti dovanų paketai kiekvienam svečiui — su siurprizais viduje.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top">
                <img src="https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?w=600&auto=format&fit=crop" alt="Pinata">
                <div class="extra-card-overlay"><h3 class="extra-card-name">Piñata</h3></div>
              </div>
              <div class="extra-card-body">Spalvinga piñata, pilna saldžių dovanų ir surprizų. Garantuotas smagumas visiems.</div>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">Pasirinkti Papildus</a>
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
