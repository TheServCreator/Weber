var u=Object.defineProperty;var h=(o,r,d)=>r in o?u(o,r,{enumerable:!0,configurable:!0,writable:!0,value:d}):o[r]=d;var p=(o,r,d)=>h(o,typeof r!="symbol"?r+"":r,d);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const t of i)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function d(i){const t={};return i.integrity&&(t.integrity=i.integrity),i.referrerPolicy&&(t.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?t.credentials="include":i.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(i){if(i.ep)return;i.ep=!0;const t=d(i);fetch(i.href,t)}})();(()=>{const o=()=>{try{return window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return!1}};class r{constructor(i){p(this,"_tickProgress",()=>{if(!this.bar||!this.autoplay)return;const i=performance.now(),t=Math.min(1,(i-this.progressStart)/this.intervalMs);this.bar.style.transform=`scaleX(${t})`,this.raf=requestAnimationFrame(this._tickProgress)});this.root=i,this.track=i.querySelector(".carousel__track"),this.slides=Array.from(i.querySelectorAll(".carousel__slide")),this.prevBtn=i.querySelector(".carousel__btn--prev"),this.nextBtn=i.querySelector(".carousel__btn--next"),this.dotsWrap=i.querySelector(".carousel__dots"),this.bar=i.querySelector(".carousel__bar"),this.index=0,this.isDragging=!1,this.startX=0,this.currentX=0,this.startTranslate=0,this.width=0,this.autoplay=i.dataset.autoplay==="true"&&!o(),this.intervalMs=Number(i.dataset.interval||4e3),this.timer=null,this.raf=null,this.progressStart=0,this._buildDots(),this._bind(),this._measure(),this.goTo(0,!1),this._start()}_measure(){this.width=this.root.getBoundingClientRect().width}_buildDots(){this.dotsWrap&&(this.dotsWrap.innerHTML="",this.dots=this.slides.map((i,t)=>{const s=document.createElement("button");return s.type="button",s.setAttribute("aria-label",`Go to slide ${t+1}`),s.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.goTo(t)}),this.dotsWrap.appendChild(s),s}))}_setActiveDot(){this.dots&&this.dots.forEach((i,t)=>i.classList.toggle("is-active",t===this.index))}_translateFor(i){return-i*this.width}goTo(i,t=!0){this._measure(),this.index=(i+this.slides.length)%this.slides.length,this.track.style.transition=t?"transform 420ms ease":"none",this.track.style.transform=`translateX(${this._translateFor(this.index)}px)`,this._setActiveDot(),this._resetProgress()}next(){this.goTo(this.index+1)}prev(){this.goTo(this.index-1)}_stopTimers(){this.timer&&clearInterval(this.timer),this.timer=null,this.raf&&cancelAnimationFrame(this.raf),this.raf=null}_resetProgress(){!this.bar||!this.autoplay||(this.progressStart=performance.now(),this.bar.style.transform="scaleX(0)")}_start(){this._stopTimers(),this.autoplay&&(this._resetProgress(),this.raf=requestAnimationFrame(this._tickProgress),this.timer=setInterval(()=>{this.next()},this.intervalMs))}_pause(){this._stopTimers()}_bind(){this.prevBtn&&this.prevBtn.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.prev(),this._start()}),this.nextBtn&&this.nextBtn.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation(),this.next(),this._start()}),this.root.addEventListener("mouseenter",()=>this._pause()),this.root.addEventListener("mouseleave",()=>this._start()),document.addEventListener("visibilitychange",()=>{document.hidden?this._pause():this._start()}),window.addEventListener("resize",()=>{const e=this.index;this._measure(),this.goTo(e,!1)});const i=e=>{this.isDragging=!0,this._pause(),this.track.style.transition="none",this.startX=e.touches?e.touches[0].clientX:e.clientX,this.currentX=this.startX;const a=/translateX\(([-0-9.]+)px\)/.exec(this.track.style.transform||"");this.startTranslate=a?Number(a[1]):this._translateFor(this.index)},t=e=>{if(!this.isDragging)return;this.currentX=e.touches?e.touches[0].clientX:e.clientX;const a=this.currentX-this.startX;this.track.style.transform=`translateX(${this.startTranslate+a}px)`},s=()=>{if(!this.isDragging)return;this.isDragging=!1;const e=this.currentX-this.startX,a=Math.min(120,this.width*.18);e>a?this.prev():e<-a?this.next():this.goTo(this.index),this._start()};this.root.addEventListener("mousedown",i),this.root.addEventListener("mousemove",t),window.addEventListener("mouseup",s),this.root.addEventListener("touchstart",i,{passive:!0}),this.root.addEventListener("touchmove",t,{passive:!0}),this.root.addEventListener("touchend",s),this.root.tabIndex=0,this.root.addEventListener("keydown",e=>{e.key==="ArrowLeft"&&(e.preventDefault(),this.prev(),this._start()),e.key==="ArrowRight"&&(e.preventDefault(),this.next(),this._start())})}}class d{constructor(){this.container=document.querySelector(".container"),this.originalContent=this.container.innerHTML,window.addEventListener("hashchange",()=>this.handleRoute()),this.handleRoute()}handleRoute(){const i=window.location.hash.slice(1)||"";i==="contact"?this.showSignupPage():i==="teddy-birthdays"?this.showTeddyPage():i==="birthday-extras"?this.showExtrasPage():i==="birthday-packages"?this.showPackagesPage():this.showHomePage(),setTimeout(()=>{document.querySelectorAll(".carousel").forEach(e=>new r(e)),document.querySelectorAll("[data-reveal]").forEach(e=>{e.style.opacity="0",e.style.transform="translateY(10px)",e.style.transition="opacity 800ms cubic-bezier(0.4, 0, 0.2, 1), transform 800ms cubic-bezier(0.4, 0, 0.2, 1)",requestAnimationFrame(()=>{e.style.opacity="1",e.style.transform="translateY(0)"})});const t=document.querySelector(".teddy-form");t&&t.addEventListener("submit",e=>{e.preventDefault();const a=new FormData(t);fetch("/api/rezervacija",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(a).toString()}).then(l=>{if(!l.ok)throw new Error("submit failed");const c=document.querySelector(".form-success");c&&(c.style.display="block"),t.reset()}).catch(()=>{const l="mailto:info@steamedukacija.lt?subject=Me%C5%A1ku%C4%8Di%C5%B3%20gimtadienis&body="+encodeURIComponent(`Vardas: ${a.get("name")}
El. paštas: ${a.get("email")}
Telefonas: ${a.get("phone")}
Miestas: ${a.get("city")}
Data: ${a.get("date")}
Svečių skaičius: ${a.get("guests")}
Komentarai: ${a.get("comments")}`);window.location.href=l})});const s=document.querySelector(".signup-form:not(.teddy-form)");s&&s.addEventListener("submit",e=>{e.preventDefault();const a=new FormData(s);fetch("/api/rezervacija",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(a).toString()}).then(l=>{if(!l.ok)throw new Error("submit failed");const c=document.querySelector(".form-success");c&&(c.style.display="block"),s.reset()}).catch(()=>{const l="mailto:info@steamedukacija.lt?subject=Gimtadienis";window.location.href=l})})},0)}showHomePage(){this.container.innerHTML=this.originalContent}showSignupPage(){this.container.innerHTML=`
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2">Gimtadienio Rezervacija</h2>
          <div class="phone-note">Teirautis telefonu: <a href="tel:+37065050556">+370 650 50556</a></div>
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
                <label>Pageidaujamos pramogos</label>
                <div class="checkbox-group">
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="Pinata"> Pinata</label>
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="Veidų piešimas"> Veidų piešimas</label>
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="360 photo/selfie kamera"> 360 photo/selfie kamera</label>
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="Teminė dekoracija"> Teminė dekoracija</label>
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="Dovanų paketai"> Dovanų paketai</label>
                  <label class="checkbox-item"><input type="checkbox" name="pramogos" value="Balionų dekoracija"> Balionų dekoracija</label>
                </div>
              </div>
              <div class="form-group">
                <label for="paketas">Gimtadienio paketas</label>
                <select id="paketas" name="paketas">
                  <option value="">Pasirinkite paketą</option>
                  <option value="Bronzinis">Bronzinis</option>
                  <option value="Sidabrinis">Sidabrinis</option>
                  <option value="Auksinis">Auksinis</option>
                  <option value="Deimantinis">Deimantinis</option>
                </select>
              </div>
              <button type="submit" class="reg-btn" style="width:100%;margin-top:8px">Rezervuoti</button>
              <div class="form-success">Ačiū! Susisieksime su jumis artimiausiu metu.</div>
            </form>
            <div class="signup-image-wrap">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2F981c188440564f9ca66e89daf788983d?format=webp&width=800" alt="Birthday party" class="signup-image">
            </div>
          </div>
        </section>
      `}showTeddyPage(){this.container.innerHTML=`
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
                  <button type="submit" class="teddy-submit-btn">Rezervuoti</button>
                  <div class="form-success">Ačiū! Susisieksime su jumis artimiausiu metu.</div>
                </form>
              </div>
              <div class="teddy-form-img">
                <img src="https://cdn.builder.io/api/v1/image/assets%2Ffc207801b22940b69c4754284e090cf1%2Fa9fb08ffa873450893193bd4b7ff5587?format=webp&width=800" alt="Meškučių šventė">
              </div>
            </div>
          </div>
        </div>
      `}showPackagesPage(){this.container.innerHTML=`
        <section class="section inner-wrap" data-reveal style="--d: 140ms">
          <h2 class="h2" style="margin:0">Gimtadienio paketai</h2>

          <div style="margin: 0 0 20px;">
            <a href="/" class="reg-btn" style="display: inline-flex; width: auto; margin-top: 0;">
                ← Grįžti į pradžią
            </a>
          </div>

          <p class="description">Pasirink šventės paketą pagal savo norus — nuo klasikinės šventės iki „viskas įskaičiuota". Kiekvienoje šventėje laukia privati erdvė, edukatorius ir pilna pramogų programa.</p>

          <div class="packages-detail-grid">
            <div class="package-detail" style="border-color:#c9803a">
              <div class="package-detail-head package-bronze">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8M8 3l3.2 6M16 3l-3.2 6"/><circle cx="12" cy="14.5" r="5.5"/></svg>
                <h3>Bronzinis</h3>
              </div>
              <div class="package-detail-plus">Į paketą įeina:</div>
              <ul>
                <li>Privati šventės erdvė tik jūsų šventei</li>
                <li>Edukatorius, vedantis šventę nuo pradžios iki pabaigos</li>
                <li>2 valandų šventė (iki 10 vaikų)</li>
                <li>Daugiau nei 500 LEGO® modelių</li>
                <li>Žaidimai ir kūrybinės užduotys</li>
                <li>Skaitmeninis kvietimas</li>
                <li>10–12 nuotraukų telefonu</li>
                <li>Vanduo vaikams</li>
                <li>Vaikų draudimas</li>
              </ul>
            </div>

            <div class="package-detail" style="border-color:#9aa7b5">
              <div class="package-detail-head package-silver">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="M9 13.5 7.5 21l4.5-2.5L16.5 21 15 13.5"/></svg>
                <h3>Sidabrinis</h3>
              </div>
              <div class="package-detail-plus">Viskas iš Bronzinio paketo, plius:</div>
              <ul>
                <li>Specialios teminės dekoracijos</li>
                <li>Dovanėlės svečiams</li>
                <li>Speciali dovana gimtadienio kaltininkui</li>
                <li>Diplomas</li>
                <li>Balionai</li>
              </ul>
            </div>

            <div class="package-detail" style="border-color:#f2b01e">
              <div class="package-detail-head package-gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17 3 8l5.5 4L12 5l3.5 7L21 8l-1 9z"/><path d="M5 20.5h14"/></svg>
                <h3>Auksinis</h3>
              </div>
              <div class="package-detail-plus">Viskas iš Sidabrinio paketo, plius:</div>
              <ul>
                <li>Sultys</li>
                <li>Vaisiai</li>
                <li>Spragėsiai</li>
              </ul>
            </div>

            <div class="package-detail" style="border-color:#4fc3f7">
              <div class="package-detail-head package-diamond">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9z"/><path d="M3 9h18"/><path d="M12 21 7.5 9M12 21l4.5-12"/></svg>
                <h3>Deimantinis</h3>
              </div>
              <div class="package-detail-plus">Viskas iš Auksinio paketo, plius:</div>
              <ul>
                <li>Pica kiekvienam svečiui</li>
                <li>Vienkartiniai indai</li>
              </ul>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">Rezervuoti šventę</a>
          </div>
        </section>
      `}showExtrasPage(){this.container.innerHTML=`
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

          <div class="extras-grid-new">
            <div class="extra-card">
              <div class="extra-card-top extra-bg-1">
                <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=400&fit=crop&auto=format" alt="Pinata" class="extra-card-img">
                <h3 class="extra-card-name">Pinata</h3>
              </div>
              <div class="extra-card-body">Spalvinga pinata, pilna saldžių dovanų ir surprizų. Garantuotas smagumas visiems šventės dalyviams!</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-2">
                <!-- TODO: pakeisti nuotrauką -->
                <img src="https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=600&h=400&fit=crop&auto=format" alt="Veidų piešimas" class="extra-card-img">
                <h3 class="extra-card-name">Veidų piešimas</h3>
              </div>
              <div class="extra-card-body">Profesionalus veidų piešimas — spalvingi piešiniai ant veidukų pagal šventės temą, džiuginantys kiekvieną vaiką.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-3">
                <!-- TODO: pakeisti nuotrauką -->
                <img src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop&auto=format" alt="360 photo/selfie kamera" class="extra-card-img">
                <h3 class="extra-card-name">360 photo/selfie kamera</h3>
              </div>
              <div class="extra-card-body">Moderni 360 photo/selfie kamera — įspūdingi besisukantys vaizdo įrašai ir nuotraukos, kuriomis galėsite dalintis iškart po šventės.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-4">
                <!-- TODO: pakeisti nuotrauką -->
                <img src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&h=400&fit=crop&auto=format" alt="Teminė dekoracija" class="extra-card-img">
                <h3 class="extra-card-name">Teminė dekoracija</h3>
              </div>
              <div class="extra-card-body">Šventės erdvės dekoravimas pagal pasirinktą temą — fonai, stalo dekoras ir akcentai, sukuriantys šventinę nuotaiką.</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-5">
                <img src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop&auto=format" alt="Dovanų paketai" class="extra-card-img">
                <h3 class="extra-card-name">Dovanų Paketai</h3>
              </div>
              <div class="extra-card-body">Specialiai paruošti dovanų paketai kiekvienam svečiui — su siurprizais viduje!</div>
            </div>
            <div class="extra-card">
              <div class="extra-card-top extra-bg-6">
                <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop&auto=format" alt="Balionai" class="extra-card-img">
                <h3 class="extra-card-name">Balionų Dekoracija</h3>
              </div>
              <div class="extra-card-body">Nuostabūs balionų dekoracijos, figūros ir kompozicijos, kurios nustebins kiekvieną.</div>
            </div>
          </div>

          <div class="cta-section">
            <a href="/#contact" class="reg-btn">Registruokis ir pasirink pramogas</a>
          </div>
        </section>
      `}}document.addEventListener("DOMContentLoaded",()=>{const n=document.body;o()?(n.classList.remove("preload"),n.classList.add("loaded")):requestAnimationFrame(()=>{n.classList.remove("preload"),n.classList.add("loaded")}),new d})})();
