// Shared helpers for the /redaktorius editor API (functions/api/admin/*).
// Not a route: this module exports no onRequest* handlers.
//
// Env (Cloudflare Pages → Settings → Variables and Secrets):
//   ADMIN_PASSWORD        editor password (encrypted)
//   ADMIN_SESSION_SECRET  random ≥32-char string used to sign session cookies
//   GITHUB_TOKEN          fine-grained PAT, this repo only, Contents: read/write
//   GITHUB_REPO           "owner/repo"
//   GITHUB_BRANCH         branch Pages deploys from (default "main")
//   ADMIN_KV              optional KV binding for login rate limiting
//                         (falls back to the Cache API when not bound)

export const COOKIE_NAME = '__Host-tg_editor';
const SESSION_TTL = 12 * 60 * 60; // seconds
const RATE_LIMIT_MAX = 5;         // failed attempts…
const RATE_LIMIT_WINDOW = 15 * 60; // …per 15 minutes per IP

const enc = new TextEncoder();

// ── Responses ───────────────────────────────────────────────────────────────
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      ...headers,
    },
  });
}

export const fail = (error, status, extra = {}) => json({ ok: false, error, ...extra }, status);

export function configError(env) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return fail('Redaktorius nesukonfigūruotas (trūksta ADMIN_PASSWORD arba ADMIN_SESSION_SECRET).', 503);
  }
  return null;
}

// Browsers always send Origin on cross-site POSTs; reject anything foreign.
// (SameSite=Strict on the cookie already blocks CSRF; this is a second lock.)
export function badOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return origin !== new URL(request.url).origin;
}

// ── Crypto ──────────────────────────────────────────────────────────────────
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function hmac(secret, data) {
  return new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(data)));
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Constant-time string comparison: both sides are HMAC'd first, so lengths
// are equal and the comparison leaks nothing about the password.
export async function safeEqual(a, b, secret) {
  const [x, y] = await Promise.all([hmac(secret, `cmp:${a}`), hmac(secret, `cmp:${b}`)]);
  return equalBytes(x, y);
}

// ── Session cookie ──────────────────────────────────────────────────────────
// Token: "v1.<expires>.<nonce>.<signature>" — HMAC-SHA256 over the first three.
export async function createSessionCookie(env) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = `v1.${exp}.${nonce}`;
  const sig = b64url(await hmac(env.ADMIN_SESSION_SECRET, payload));
  return `${COOKIE_NAME}=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL}`;
}

export const clearSessionCookie = () =>
  `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export async function isAuthenticated(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const expected = b64url(await hmac(env.ADMIN_SESSION_SECRET, parts.slice(0, 3).join('.')));
  return equalBytes(enc.encode(expected), enc.encode(parts[3]));
}

// Guard for protected endpoints: returns a Response to send back, or null.
export async function requireSession(request, env) {
  const cfg = configError(env);
  if (cfg) return cfg;
  if (badOrigin(request)) return fail('Neleistinas šaltinis.', 403);
  if (!(await isAuthenticated(request, env))) return fail('Neprisijungta.', 401);
  return null;
}

// ── Login rate limiting (KV when bound, Cache API otherwise) ────────────────
function rateStore(env) {
  const kv = env.ADMIN_KV;
  if (kv) {
    return {
      async get(key) { return (await kv.get(key, 'json')) || null; },
      async put(key, value, ttl) { await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttl) }); },
      async del(key) { await kv.delete(key); },
    };
  }
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const url = (key) => `https://rate-limit.topgimtadieniai.internal/${encodeURIComponent(key)}`;
  return {
    async get(key) {
      if (!cache) return null;
      const hit = await cache.match(url(key));
      return hit ? hit.json() : null;
    },
    async put(key, value, ttl) {
      if (!cache) return;
      await cache.put(url(key), new Response(JSON.stringify(value), {
        headers: { 'cache-control': `max-age=${Math.max(1, ttl)}`, 'content-type': 'application/json' },
      }));
    },
    async del(key) { if (cache) await cache.delete(url(key)); },
  };
}

export function loginLimiter(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const key = `login:${ip}`;
  const store = rateStore(env);
  const now = () => Math.floor(Date.now() / 1000);
  return {
    // Seconds until the IP may try again, or 0 when not blocked.
    async blockedFor() {
      const rec = await store.get(key);
      if (!rec || rec.reset <= now()) return 0;
      return rec.count >= RATE_LIMIT_MAX ? rec.reset - now() : 0;
    },
    async registerFailure() {
      let rec = await store.get(key);
      if (!rec || rec.reset <= now()) rec = { count: 0, reset: now() + RATE_LIMIT_WINDOW };
      rec.count += 1;
      await store.put(key, rec, rec.reset - now());
      return Math.max(0, RATE_LIMIT_MAX - rec.count);
    },
    async reset() { await store.del(key); },
  };
}

// ── GitHub ──────────────────────────────────────────────────────────────────
export function githubConfig(env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return null;
  return {
    token: env.GITHUB_TOKEN,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH || 'main',
    api: (env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, ''),
  };
}

export class GitHubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function gh(cfg, path, init = {}) {
  const res = await fetch(`${cfg.api}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${cfg.token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'topgimtadieniai-redaktorius',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new GitHubError(res.status, body.message || `GitHub ${res.status}`);
  return body;
}

export function decodeBase64Utf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function getRepoFile(cfg, path) {
  const file = await gh(cfg, `/repos/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`);
  return { sha: file.sha, text: decodeBase64Utf8(file.content || '') };
}

export async function getRepoSha(cfg, path) {
  try {
    const file = await gh(cfg, `/repos/${cfg.repo}/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`);
    return file.sha;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}
