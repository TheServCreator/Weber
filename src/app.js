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
        b.setAttribute('aria-label', `Go to slide ${i + 1}`);
        b.addEventListener('click', (e) => {
          // prevent anchor navigation when carousel is inside <a>
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

      this.timer = setInterval(() => {
        this.next();
      }, this.intervalMs);
    }

    _pause() {
      this._stopTimers();
    }

    _bind() {
      // Buttons
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.prev();
          this._start();
        });
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.next();
          this._start();
        });
      }

      // Hover pause
      this.root.addEventListener('mouseenter', () => this._pause());
      this.root.addEventListener('mouseleave', () => this._start());

      // Tab hidden pause
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this._pause();
        else this._start();
      });

      // Resize
      window.addEventListener('resize', () => {
        const prevIndex = this.index;
        this._measure();
        this.goTo(prevIndex, false);
      });

      // Swipe/drag
      const onDown = (e) => {
        this.isDragging = true;
        this._pause();
        this.track.style.transition = 'none';
        this.startX = (e.touches ? e.touches[0].clientX : e.clientX);
        this.currentX = this.startX;
        // current translate
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

      // Keyboard
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

      // Re-initialize carousels
      setTimeout(() => {
        document.querySelectorAll('.carousel').forEach((el) => new SimpleCarousel(el));

        // Trigger reveal animations
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      }, 0);
    }

    showHomePage() {
      this.container.innerHTML = this.originalContent;
    }

    showSignupPage() {
      this.container.innerHTML = `
        <section class="section" data-reveal style="--d: 140ms">
          <h2 class="h2">Gimtadienio Registracija</h2>
          <div class="signup-wrapper">
            <form class="signup-form">
              <div class="form-group">
                <label for="name">Vardo</label>
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
                  <option value="">Pasirinkite miestą</option>
                  <option value="vilnius">Vilnius</option>
                  <option value="kaunas">Kaunas</option>
                  <option value="klaipeda">Klaipėda</option>
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
                <label for="party-type">Pageidaujama Šventės Tipas</label>
                <select id="party-type" name="party-type" required>
                  <option value="">Pasirinkite šventės tipą</option>
                  <option value="bricks4kidz">Bricks4Kidz</option>
                  <option value="medical">Little Medical School</option>
                  <option value="teddy">Plūšinės Gyvūnų Šventė</option>
                  <option value="extras">Gimtadienio Papildai</option>
                </select>
              </div>
              <button type="submit" class="submit-btn">Registruotis</button>
            </form>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2F981c188440564f9ca66e89daf788983d?format=webp&width=800&height=1200" alt="Birthday party" class="signup-image">
          </div>
        </section>
      `;
    }

    showTeddyPage() {
      this.container.innerHTML = `
        <section class="section" data-reveal style="--d: 140ms">
          <h2 class="h2">Plūšinės Gyvūnų Šventė</h2>
          <p class="description">Pagal temą su jūsų mėgiamais plūšiniais žaisliukais! Kiekvienas svečias gali atnešti savo plūšinį draugą.</p>

          <div class="features-grid">
            <div class="feature-card feature-green">
              <h3>Teminės Dekorācijos</h3>
              <p>Plūšinių žaisliukų tema su spalvingomis dekoracijomis</p>
            </div>
            <div class="feature-card feature-blue">
              <h3>Interaktyvūs Žaidimai</h3>
              <p>Žaidimai su plūšiniais žaisliukais ir prašmatūs konkursai</p>
            </div>
            <div class="feature-card feature-red">
              <h3>Šventingas Pyragas</h3>
              <p>Specialiai pagamintas pyragas su plūšinio žaislo figūra</p>
            </div>
            <div class="feature-card feature-yellow">
              <h3>Dovanos ir Liuks</h3>
              <p>Kiekvienas svečias gauna specialią dovaną su šventės logotipu</p>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="signup-btn">Užsiregistruoti Dabar</a>
          </div>
        </section>
      `;
    }

    showExtrasPage() {
      this.container.innerHTML = `
        <section class="section" data-reveal style="--d: 140ms">
          <h2 class="h2">Gimtadienio Papildai</h2>
          <p class="description">Padarykite jūsų šventę dar geresnę su šiais nuostabiais papildais!</p>

          <div class="extras-grid">
            <div class="extra-item extra-blue">
              <h3>🎈 Piñata</h3>
              <p>Spalvinga piñata, pilna saldžių dovanų ir surprizų. Visada smagus!</p>
            </div>
            <div class="extra-item extra-red">
              <h3>🎭 Animatorius</h3>
              <p>Profesionalus animatorius, kuris vedė šventę ir žaidimų programą</p>
            </div>
            <div class="extra-item extra-green">
              <h3>📸 Fotosesija</h3>
              <p>Profesionali fotosesija su šiuolaikine nuotoliniu atsidarymu ir redakcija</p>
            </div>
            <div class="extra-item extra-yellow">
              <h3>🎂 Dekoruotas Pyragas</h3>
              <p>Specialiai pagamintas ir dekoruotas pyragas pagal tavo temą</p>
            </div>
            <div class="extra-item extra-blue">
              <h3>🎁 Dovanu Paketai</h3>
              <p>Specialiai paruošti dovanu paketai kiekvienam svečiui</p>
            </div>
            <div class="extra-item extra-red">
              <h3>🎉 Balionu Dekors</h3>
              <p>Nuostabūs balionu dekoracijy sustatymai ir figūros</p>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="signup-btn">Pasirinkti Papildai</a>
          </div>
        </section>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // load-in animation toggle
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

    // Initialize router
    new PageRouter();
  });
})();
