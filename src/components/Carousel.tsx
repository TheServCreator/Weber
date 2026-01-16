import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type Slide = {
  id: string;
  title?: string;
  subtitle?: string;
};

type Props = {
  slides: Slide[];
  height: number;
  rounded?: number;
  seconds?: number;
  clickableHref?: string;
  showDots?: boolean;
  showArrows?: boolean;
  showProgress?: boolean;
  ariaLabel?: string;
};

export default function Carousel({
  slides,
  height,
  rounded = 18,
  seconds = 4,
  clickableHref,
  showDots = true,
  showArrows = true,
  showProgress = true,
  ariaLabel = "Carousel",
}: Props) {
  const prefersReduced = usePrefersReducedMotion();

  // Create autoplay plugin ONCE per (seconds, prefersReduced)
  const autoplayPlugin = useMemo(() => {
    if (prefersReduced) return null;
    return Autoplay({
      delay: Math.max(1200, seconds * 1000),
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    });
  }, [seconds, prefersReduced]);

  const plugins = useMemo(() => (autoplayPlugin ? [autoplayPlugin] : []), [autoplayPlugin]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
      duration: 22,
    },
    plugins as any
  );

  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Progress bar (no React state, only DOM)
  const rafRef = useRef<number | null>(null);
  const progressStartRef = useRef<number>(0);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const stopRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const resetProgress = useCallback(() => {
    if (!showProgress || prefersReduced) return;
    progressStartRef.current = performance.now();
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
  }, [showProgress, prefersReduced]);

  const tick = useCallback(() => {
    if (!showProgress || prefersReduced) return;
    const el = progressRef.current;
    if (!el) return;

    const now = performance.now();
    const elapsed = now - progressStartRef.current;
    const p = Math.min(1, elapsed / (seconds * 1000));
    el.style.transform = `scaleX(${p})`;

    rafRef.current = requestAnimationFrame(tick);
  }, [seconds, showProgress, prefersReduced]);

  const startRaf = useCallback(() => {
    if (!showProgress || prefersReduced) return;
    stopRaf();
    rafRef.current = requestAnimationFrame(tick);
  }, [showProgress, prefersReduced, tick, stopRaf]);

  // Idempotent setters (prevents update-depth loops)
  const safeSet = {
    selected: (v: number) => setSelected((p) => (p === v ? p : v)),
    snapCount: (v: number) => setSnapCount((p) => (p === v ? p : v)),
    canPrev: (v: boolean) => setCanPrev((p) => (p === v ? p : v)),
    canNext: (v: boolean) => setCanNext((p) => (p === v ? p : v)),
  };

  const updateFromEmbla = useCallback(() => {
    if (!emblaApi) return;
    safeSet.selected(emblaApi.selectedScrollSnap());
    safeSet.snapCount(emblaApi.scrollSnapList().length);
    safeSet.canPrev(emblaApi.canScrollPrev());
    safeSet.canNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const scrollPrev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      emblaApi?.scrollPrev();
    },
    [emblaApi]
  );

  const scrollNext = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      emblaApi?.scrollNext();
    },
    [emblaApi]
  );

  const scrollTo = useCallback(
    (i: number, e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      emblaApi?.scrollTo(i);
    },
    [emblaApi]
  );

  // Pause autoplay when tab hidden
  useEffect(() => {
    if (!autoplayPlugin) return;

    const onVis = () => {
      if (document.hidden) autoplayPlugin.stop();
      else autoplayPlugin.play();
      resetProgress();
      startRaf();
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [autoplayPlugin, resetProgress, startRaf]);

  // Embla events with proper cleanup
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      updateFromEmbla();
      resetProgress();
      startRaf();
    };

    const onReInit = () => {
      updateFromEmbla();
      resetProgress();
      startRaf();
    };

    updateFromEmbla();
    resetProgress();
    startRaf();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onReInit);

    return () => {
      stopRaf();
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onReInit);
    };
  }, [emblaApi, updateFromEmbla, resetProgress, startRaf, stopRaf]);

  // Hover pauses progress raf too
  const onMouseEnter = () => stopRaf();
  const onMouseLeave = () => {
    resetProgress();
    startRaf();
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  };

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    if (!clickableHref) return <>{children}</>;
    return (
      <a className="clickWrap" href={clickableHref} aria-label="Open link">
        {children}
      </a>
    );
  };

  return (
    <Wrapper>
      <div
        className="carouselShell"
        style={{ borderRadius: rounded }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={ariaLabel}
        role="region"
      >
        <div ref={emblaRef} className="emblaViewport">
          <div className="emblaContainer" style={{ height }}>
            {slides.map((s, idx) => (
              <div className="emblaSlide" key={s.id} style={{ height }}>
                <div
                  className="slideBg"
                  style={{
                    background:
                      idx % 3 === 0
                        ? "linear-gradient(135deg, #0b1020, #2c3345)"
                        : idx % 3 === 1
                        ? "linear-gradient(135deg, #0a1a14, #203a2d)"
                        : "linear-gradient(135deg, #1a0a10, #3b1e2a)",
                  }}
                />
                <div className="slideOverlay">
                  <div className="slideText">
                    <div className="slideTitle">{s.title ?? `Slide ${idx + 1}`}</div>
                    <div className="slideSub">{s.subtitle ?? "Placeholder copy. Replace later."}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showProgress && !prefersReduced && (
          <div className="progressTrack" aria-hidden="true">
            <div ref={progressRef} className="progressBar" />
          </div>
        )}

        {showArrows && snapCount > 1 && (
          <>
            <button className="navBtn left" onClick={(e) => scrollPrev(e)} disabled={!canPrev} aria-label="Previous">
              ‹
            </button>
            <button className="navBtn right" onClick={(e) => scrollNext(e)} disabled={!canNext} aria-label="Next">
              ›
            </button>
          </>
        )}

        {showDots && snapCount > 1 && (
          <div className="dotsRow" aria-label="Carousel pagination">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                className={`dot ${i === selected ? "active" : ""}`}
                onClick={(e) => scrollTo(i, e)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
