# Turinio valdymo sistemos (CMS) nustatymas

Šis dokumentas — vienkartinio nustatymo instrukcija. Atlikus šiuos žingsnius, klientas galės redaguoti svetainės turinį per `/admin/` be programuotojo pagalbos.

Sistema veikia taip: **Sveltia CMS** (naršyklėje veikianti turinio redagavimo sąsaja) → per **GitHub OAuth** prisijungia prie repozitorijos `TheServCreator/Weber` → išsaugoję pakeitimus, jie tiesiogiai commit'inami į `main` šaką → **Cloudflare Pages** automatiškai perdeploy'ina svetainę (per 1–2 minutes).

Kadangi GitHub neleidžia OAuth prisijungimo tiesiai iš statinio puslapio, tarpininkui reikalingas nedidelis **Cloudflare Worker** (`sveltia-cms-auth`), kuris tvarko prisijungimo (OAuth) srautą.

---

## 1 žingsnis — GitHub OAuth App sukūrimas

1. Eikite į [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Užpildykite:
   - **Application name**: pvz. `Weber CMS`
   - **Homepage URL**: `https://www.topgimtadieniai.lt`
   - **Authorization callback URL**: laikinai įrašykite bet ką (pvz. `https://placeholder.workers.dev/callback`) — tikslų adresą įrašysime 3 žingsnyje, kai žinosime Worker'io URL.
3. Paspauskite **Register application**.
4. Puslapyje, kuris atsivers, matysite **Client ID** — nusikopijuokite jį.
5. Paspauskite **Generate a new client secret** — nusikopijuokite ir **Client Secret** (jis bus parodytas tik vieną kartą).

Išsaugokite abi reikšmes saugioje vietoje — jos reikės 2 žingsnyje.

---

## 2 žingsnis — `sveltia-cms-auth` Worker diegimas

Šis Worker'is — atskiras, jau paruoštas projektas, tvarkantis GitHub OAuth srautą tarp Sveltia CMS ir GitHub.

1. Eikite į [github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth).
2. Paspauskite **Deploy to Cloudflare Workers** mygtuką (README viršuje) — tai atidarys Cloudflare diegimo vediklį.
3. Prisijunkite prie savo Cloudflare paskyros (tos pačios, kurioje veikia Cloudflare Pages projektas).
4. Diegimo metu (arba iš karto po jo, per Worker'io **Settings → Variables and Secrets**) sukonfigūruokite šiuos **encrypted** (paslėptus) kintamuosius:

   | Kintamasis | Reikšmė |
   |---|---|
   | `GITHUB_CLIENT_ID` | Client ID iš 1 žingsnio |
   | `GITHUB_CLIENT_SECRET` | Client Secret iš 1 žingsnio |
   | `ALLOWED_DOMAINS` | `www.topgimtadieniai.lt` (domenas, iš kurio bus leidžiama jungtis prie admin — apsauga nuo svetimų svetainių) |

   **Svarbu**: pažymėkite `GITHUB_CLIENT_SECRET` kaip **Secret** (encrypted), ne paprastą tekstinį kintamąjį.

5. Įsidėmėkite (arba nusikopijuokite) sudiegto Worker'io adresą — jis atrodys panašiai kaip `https://sveltia-cms-auth.<jūsų-subdomenas>.workers.dev`.

---

## 3 žingsnis — Callback URL pataisymas OAuth App'e

1. Grįžkite į GitHub OAuth App nustatymus (1 žingsnis, [github.com/settings/developers](https://github.com/settings/developers)).
2. Atidarykite sukurtą `Weber CMS` aplikaciją.
3. Laukelyje **Authorization callback URL** įrašykite tikrąjį Worker'io adresą su `/callback`:

   ```
   https://<worker-adresas>.workers.dev/callback
   ```

4. Paspauskite **Update application**.

---

## 4 žingsnis — `base_url` įrašymas į `config.yml`

Atidarykite `public/admin/config.yml` ir pakeiskite placeholder eilutę:

```yaml
backend:
  name: github
  repo: TheServCreator/Weber
  branch: main
  base_url: https://REIKIA-PAKEISTI.workers.dev
```

į tikrąjį Worker'io adresą (be `/callback` galūnės):

```yaml
  base_url: https://sveltia-cms-auth.<jūsų-subdomenas>.workers.dev
```

Išsaugokite, commit'inkite ir push'inkite į `main` — Cloudflare Pages automatiškai perdeploy'ins svetainę su atnaujinta konfigūracija.

---

## 5 žingsnis — kaip klientas jungiasi

1. Klientas eina į **`https://www.topgimtadieniai.lt/admin/`**.
2. Paspaudžia **Login with GitHub**.
3. Prisijungia prie savo GitHub paskyros (jei dar neprisijungęs) ir patvirtina prieigą.
4. Atsidaro Sveltia CMS redagavimo sąsaja lietuvių kalba — visos turinio sekcijos pagal `config.yml` struktūrą.

**Svarbu**: kliento GitHub paskyra turi turėti prieigą prie repozitorijos `TheServCreator/Weber`. Jei kliento paskyra nėra repozitorijos savininkė ar organizacijos narė, reikia pakviesti ją kaip **collaborator**:

1. Repozitorijoje eikite į **Settings → Collaborators**.
2. Paspauskite **Add people** ir įveskite kliento GitHub vartotojo vardą arba el. paštą.
3. Klientas turi priimti kvietimą (atsiųstą el. paštu arba GitHub pranešimuose).

Be šios prieigos klientas galės prisijungti prie `/admin/`, bet negalės išsaugoti pakeitimų (commit'inti į repozitoriją).

---

## Kontrolinis sąrašas

- [ ] GitHub OAuth App sukurta, Client ID + Secret nusikopijuoti
- [ ] `sveltia-cms-auth` Worker sudiegtas Cloudflare
- [ ] Worker'io kintamieji `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS` nustatyti (Secret sukoduotas)
- [ ] OAuth App callback URL pataisytas į `https://<worker>/callback`
- [ ] `public/admin/config.yml` → `base_url` atnaujintas ir push'intas į `main`
- [ ] Klientas pakviestas kaip repozitorijos collaborator
- [ ] Išbandytas prisijungimas per `https://www.topgimtadieniai.lt/admin/`

---

# Vizualus redaktorius — `/redaktorius`

Antras, paprastesnis būdas redaguoti svetainę: **https://www.topgimtadieniai.lt/redaktorius**
(tik slaptažodis, GitHub paskyros klientui nereikia). Sveltia CMS (`/admin/`) veikia toliau.

Ką galima daryti:
- spustelėti tekstą puslapyje ir keisti jį vietoje;
- užvedus ant nuotraukos ar kortelės — **Keisti nuotrauką** (automatiškai sumažinama ir
  paverčiama WebP, iki 1 MB) ir **Nuoroda**;
- telefonas, el. paštas ir mygtukai atsidaro mažame lange;
- šoniniame skydelyje: **paketų kainos** (I–IV / V–VII), **paketų turinys**, **pagrindinė karuselė**,
  **pramogos**, **kontaktai** (telefonai, el. paštas, miestai ir adresai rezervacijos formoje);
- **Išsaugoti** — parodomas pakeitimų sąrašas (buvo → bus), tada vienas commit'as į GitHub;
  Cloudflare Pages per ~1–2 min. perstato svetainę.

## Cloudflare Pages kintamieji

**Workers & Pages → (šio projekto Pages) → Settings → Variables and Secrets** (Production),
visi kaip **Encrypted**. Slaptažodis ir secret **turi skirtis** nuo Top Stovyklų.

| Kintamasis | Reikšmė / kaip gauti |
|---|---|
| `ADMIN_PASSWORD` | Redaktoriaus slaptažodis (≥ 12 simbolių), pvz. `node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"`. |
| `ADMIN_SESSION_SECRET` | Atsitiktinė eilutė: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`. Pakeitus — visi atjungiami. |
| `GITHUB_TOKEN` | Fine-grained token: GitHub → Settings → Developer settings → **Fine-grained tokens** → *Only select repositories*: `TheServCreator/Weber` → *Repository permissions → Contents: Read and write*. |
| `GITHUB_REPO` | `TheServCreator/Weber` |
| `GITHUB_BRANCH` | `main` |

**KV prisijungimo bandymų ribojimui (rekomenduojama):** 5 nesėkmingi bandymai / 15 min. per IP.
Be KV naudojamas Cloudflare Cache API — jis veikia tik ant `topgimtadieniai.lt` domeno, o
`*.pages.dev` adrese ribojimas neveiktų. Todėl: *Storage & Databases → KV → Create*
(pvz. `gimtadieniai-admin`), tada Pages projekte **Settings → Bindings → KV namespace**,
pavadinimas **`ADMIN_KV`**.

Pakeitus kintamuosius — **Deployments → Retry deployment** (arba naujas push), kad įsigaliotų.

## Lokalus testavimas

Sukurk `.dev.vars` (jis gitignore'intas, niekada necommit'inamas) su aukščiau išvardintais
kintamaisiais, tada:

```bash
npm run build
npx wrangler pages dev dist
```

ir atidaryk http://127.0.0.1:8788/redaktorius (dėmesio: su tikru tokenu išsaugojimai
commit'inami į tikrą repo — testams naudok atskirą `GITHUB_BRANCH`).
