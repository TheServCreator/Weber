import React, { useEffect, useMemo, useState } from "react";
import Carousel, { Slide } from "./components/Carousel";

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0.1, 0.2, 0.4, 0.6] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);

  return active;
}

export default function App() {
  const heroSlides: Slide[] = useMemo(
    () => [
      { id: "h1", title: "Full-width hero", subtitle: "Autoplay, swipe, arrows, dots, progress." },
      { id: "h2", title: "Looks premium by default", subtitle: "Replace content whenever." },
      { id: "h3", title: "Mockup-ready", subtitle: "Everything works, nothing is final." }
    ],
    []
  );

  const cards = useMemo(
    () => [
      { title: "Clickable carousel 1", href: "/link-1", slides: [{ id: "c11" }, { id: "c12" }, { id: "c13" }] },
      { title: "Clickable carousel 2", href: "/link-2", slides: [{ id: "c21" }, { id: "c22" }, { id: "c23" }] },
      { title: "Clickable carousel 3", href: "/link-3", slides: [{ id: "c31" }, { id: "c32" }, { id: "c33" }] },
      { title: "Clickable carousel 4", href: "/link-4", slides: [{ id: "c41" }, { id: "c42" }, { id: "c43" }] }
    ],
    []
  );

  const sections = ["home", "work", "contact"];
  const active = useActiveSection(sections);

  return (
    <div className="page">
      <header className="header">
        <div className="headerInner">
          <div className="brand">BRAND</div>
          <nav className="nav">
            {sections.map((id) => (
              <a key={id} className={`navLink ${active === id ? "active" : ""}`} href={`#${id}`}> 
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <section id="home" className="section">
          <Carousel slides={heroSlides} height={520} seconds={4} ariaLabel="Hero carousel" />
        </section>

        <section id="work" className="section">
          <div className="grid">
            {cards.map((c) => (
              <div className="cardBlock" key={c.href}>
                <div className="cardTitle">{c.title}</div>
                <Carousel
                  slides={c.slides}
                  height={240}
                  seconds={3}
                  showDots={false}
                  clickableHref={c.href}
                  ariaLabel={c.title}
                />
                <div className="cardHint">
                  Click to go to: <span className="mono">{c.href}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact">
          <h2>Contacts</h2>
          <div className="contactBox">
            <div>Email: placeholder@domain.com</div>
            <div>Phone: +370 000 00000</div>
            <div>Instagram: @placeholder</div>
          </div>
        </section>
      </main>

      <footer className="footer">© {new Date().getFullYear()} BRAND</footer>
    </div>
  );
}