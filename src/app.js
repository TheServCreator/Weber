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

    document.querySelectorAll('.carousel').forEach((el) => new SimpleCarousel(el));
  });
})();
