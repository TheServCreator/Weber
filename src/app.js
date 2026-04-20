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
            const data = new FormData(teddyForm);
            fetch('/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams(data).toString()
            })
            .then(() => {
              const success = document.querySelector('.form-success');
              if (success) { success.style.display = 'block'; }
              teddyForm.reset();
            })
            .catch(() => {
              const mailto = `mailto:info@steamedukacija.lt?subject=Mesk%C5%AB%C4%8Di%C5%B3%20gimtadienis&body=` +
                encodeURIComponent(
                  `Vardas: ${data.get('name')}\nEl. paštas: ${data.get('email')}\nTelefonas: ${data.get('phone')}\nMiestas: ${data.get('city')}\nData: ${data.get('date')}\nSvečių skaičius: ${data.get('guests')}\nKomentarai: ${data.get('comments')}`
                );
              window.location.href = mailto;
            });
          });
        }
      }, 0);
    }

    showHomePage() {
      this.container.innerHTML = this.originalContent;
    }

    showSignupPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2">Gimtadienio Registracija 🎂</h2>
          <div class="signup-wrapper">
            <form class="signup-form" name="gimtadienis-registracija" method="POST" data-netlify="true">
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
                <label for="party-type">Šventės Tipas</label>
                <select id="party-type" name="party-type" required>
                  <option value="">Pasirinkite šventės tipą</option>
                  <option value="bricks4kidz">Bricks4Kidz</option>
                  <option value="medical">Little Medical School</option>
                  <option value="teddy">Meškučių Gimtadienio Šventė</option>
                  <option value="extras">Šventės Priedai ir Pramogos</option>
                </select>
              </div>
              <button type="submit" class="reg-btn" style="width:100%;margin-top:8px">🎉 Registruotis</button>
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
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2">Meškučių Gimtadienio Šventė 🧸</h2>

          <div class="teddy-hero">
            <h3>Surengkite nepamirštamą šventę su mylimiausiais meškučiais!</h3>
            <p>Kiekvienas vaikas ateina su savo plūšiniu draugu – ir išeina su nauja istorija.</p>
          </div>

          <div class="features-grid">
            <div class="feature-card feature-green">
              <h3>🧸 Teminės Dekoracijos</h3>
              <p>Meškučių tema su spalvingomis dekoracijomis, sukuriančiomis nepakartojamą atmosferą</p>
            </div>
            <div class="feature-card feature-blue">
              <h3>🎮 Interaktyvūs Žaidimai</h3>
              <p>Žaidimai su plūšinukais, kūrybinės veiklos ir smagūs konkursai kiekvienam vaikui</p>
            </div>
            <div class="feature-card feature-red">
              <h3>🎂 Šventinis Pyragas</h3>
              <p>Specialiai pagamintas pyragas su meškučio figūra – tikras šventės centras</p>
            </div>
            <div class="feature-card feature-yellow">
              <h3>🎁 Dovanėlės Svečiams</h3>
              <p>Kiekvienas svečias išeina su atminimėliu – maža meškučio istorija namuose</p>
            </div>
          </div>

          <div class="teddy-cta">✨ Įkvėpk Meškučiui gyvybę! ✨</div>

          <div class="signup-wrapper">
            <form class="signup-form teddy-form" name="meskuciai-registracija" method="POST" data-netlify="true">
              <input type="hidden" name="form-name" value="meskuciai-registracija">
              <h3 style="margin:0 0 20px;font-family:'Baloo 2',cursive;color:var(--b4k-green)">Registracija 🧸</h3>
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
                  <option value="">Pasirinkite miestą</option>
                  <option value="vilnius">Vilnius</option>
                  <option value="kaunas">Kaunas</option>
                  <option value="klaipeda">Klaipėda</option>
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
              <button type="submit" class="reg-btn" style="width:100%;margin-top:8px;background:var(--b4k-green);box-shadow:0 6px 0 0 #007a30">🧸 Registruotis</button>
              <div class="form-success">✅ Ačiū! Susisieksime su jumis artimiausiu metu.</div>
            </form>
            <div class="signup-image-wrap">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2Fb1c4d2db544a48c6a3d2e75974aa9b70?format=webp&width=800" alt="Meškučių šventė" class="signup-image" style="border-color:var(--b4k-green)">
            </div>
          </div>
        </section>
      `;
    }

    showExtrasPage() {
      this.container.innerHTML = `
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2">Šventės Priedai ir Pramogos 🎊</h2>
          <p class="description">Padarykite jūsų šventę dar geresnę su šiais nuostabiais priedais!</p>

          <div class="extras-hero">
            <div class="extras-hero-text">Sukurk šventę, kurią visi prisimins! 🎊<br><span style="font-size:0.55em;font-family:Nunito,sans-serif;font-weight:700;opacity:.9">Pasirink iš mūsų spalvingų priedų kolekcijos</span></div>
          </div>

          <div class="extras-grid-new">
            <div class="extra-card">
              <div class="extra-card-top extra-bg-1">
                <div class="extra-card-icon">🪅</div>
                <h3 class="extra-card-name">Piñata</h3>
              </div>
              <div class="extra-card-body">Spalvinga piñata, pilna saldžių dovanų ir surprizų. Garantuotas smagumas visiems!</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-2">
                <div class="extra-card-icon">🎭</div>
                <h3 class="extra-card-name">Animatorius</h3>
              </div>
              <div class="extra-card-body">Profesionalus animatorius, kuris vedė šventę ir žaidimų programą nuo pradžios iki pabaigos.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-3">
                <div class="extra-card-icon">📸</div>
                <h3 class="extra-card-name">Fotosesija</h3>
              </div>
              <div class="extra-card-body">Profesionali fotosesija su redakcija — nepamirštami prisiminimai visam gyvenimui.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-4">
                <div class="extra-card-icon">🎂</div>
                <h3 class="extra-card-name">Dekoruotas Pyragas</h3>
              </div>
              <div class="extra-card-body">Specialiai pagamintas ir dekoruotas pyragas pagal pasirinktą šventės temą.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-5">
                <div class="extra-card-icon">🎁</div>
                <h3 class="extra-card-name">Dovanų Paketai</h3>
              </div>
              <div class="extra-card-body">Specialiai paruošti dovanų paketai kiekvienam svečiui — su siurprizais viduje!</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-6">
                <div class="extra-card-icon">🎈</div>
                <h3 class="extra-card-name">Balionų Dekoracija</h3>
              </div>
              <div class="extra-card-body">Nuostabūs balionų dekoracijos, figūros ir kompozicijos, kurios nustebins kiekvieną.</div>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">🎉 Pasirinkti Priedus</a>
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
