# Top Gimtadieniai — topgimtadieniai.lt

Gimtadienio švenčių vaikams svetainė (Bricks4Kidz, Little Medical School, Meškučiai, Business Kids).

## Technologijos

- **Vite 5** + vanilla JavaScript (be framework'o), CSS be preprocesoriaus
- Vienas puslapis su hash-routing'u (`PageRouter` faile `src/app.js`)
- **Cloudflare Pages** — hostingas ir automatinis build'as iš `main` šakos
- **Cloudflare Pages Functions** — formų siuntimas per SMTP
- **Sveltia CMS** — turinio redagavimas klientui

## Paleidimas

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sugeneruoja dist/
npm run preview  # peržiūra iš dist/
```

Cloudflare aplinkos patikrinimui (reikia Wrangler prisijungimo):

```bash
npm run preview:cf   # build + wrangler pages dev dist
npm run deploy       # build + wrangler pages deploy dist
```

`dist/` ir `.wrangler/` yra `.gitignore` — Cloudflare Pages build'ina pati, komituoti jų nereikia.

## Kur kas yra

| Ką keisti | Kur |
|---|---|
| **Visas svetainės turinys** (tekstai, nuotraukos, kainos, miestai) | `src/data/content.json` |
| Renderinimas ir puslapių logika | `src/app.js` |
| Stiliai | `src/styles.css` |
| HTML karkasas, SEO meta, JSON-LD | `index.html` |
| Nuotraukos ir ikonos | `public/photos/`, `public/pramogos/`, `public/logos/` |
| **CMS konfigūracija** (kokius laukus klientas mato `/admin/`) | `public/admin/config.yml` |
| **Formų siuntimas el. paštu** (SMTP) | `functions/api/register.js` |

### Turinys

Visi tekstiniai pakeitimai daromi `src/data/content.json`, o ne hardcode'inami `src/app.js`.
Pridėjus naują lauką į JSON, reikia atnaujinti ir renderintoją `src/app.js`, ir
`public/admin/config.yml`, kad klientas tą lauką matytų CMS'e.

### CMS

Klientas redaguoja turinį per `https://www.topgimtadieniai.lt/admin/`. Sveltia CMS
prisijungia prie GitHub per OAuth Worker'į ir commit'ina pakeitimus tiesiai į `main`.
Vienkartinio nustatymo instrukcija — **[ADMIN-SETUP.md](ADMIN-SETUP.md)**.

### Formos

Abi rezervacijos formos (pagrindinė ir Meškučių) POST'ina į `/api/register`.
`functions/api/register.js` siunčia el. laišką per SMTP; reikalingi Cloudflare Pages
aplinkos kintamieji `SMTP_USERNAME` ir `SMTP_PASSWORD`.
