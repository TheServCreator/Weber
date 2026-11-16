// POST /api/admin/save — commits the edited content.json and any uploaded
// images to GitHub in ONE commit (Git Data API), so a half-saved state with
// content pointing at a missing image can never be deployed. Cloudflare Pages
// then rebuilds the static site (~1–2 min).
//
// Body: {
//   base:     { content: sha }                 SHA the editor loaded
//   content?: object                           new src/data/content.json
//   images?:  [{ path: 'public/images/x.webp', data: '<base64>' }]
//   summary?: string                           commit message detail
// }
import { json, fail, requireSession, githubConfig, gh, getRepoSha, GitHubError } from '../../_lib/admin.js';

const CONTENT_PATH = 'src/data/content.json';
const IMAGE_PATH = /^public\/images\/[a-z0-9][a-z0-9._-]{0,90}\.(webp|jpe?g|png|gif)$/;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_IMAGES = 12;
const CONFLICT = 'Turinys pasikeitė, perkraukite puslapį.';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Decoded size of a base64 string, without decoding it.
const base64Bytes = (b64) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

// The site renders these keys unconditionally; a payload without them would
// deploy a blank page, so reject it here rather than trust the client.
function validContent(c) {
  return isObject(c) && isObject(c.header) && isObject(c.hero) && Array.isArray(c.hero.slides)
    && Array.isArray(c.packages) && Array.isArray(c.pramogos) && isObject(c.contact)
    && Array.isArray(c.cities) && isObject(c.footer);
}

export async function onRequestPost({ request, env }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const cfg = githubConfig(env);
  if (!cfg) return fail('GitHub nesukonfigūruotas (trūksta GITHUB_TOKEN arba GITHUB_REPO).', 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Neteisingas užklausos formatas.', 400);
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const files = [];
  if (body.content !== undefined) {
    if (!validContent(body.content)) return fail('Netinkamas content.json turinys.', 400);
    files.push({ key: 'content', path: CONTENT_PATH, text: JSON.stringify(body.content, null, 2) + '\n' });
  }

  const images = Array.isArray(body.images) ? body.images : [];
  if (images.length > MAX_IMAGES) return fail(`Vienu kartu galima įkelti iki ${MAX_IMAGES} nuotraukų.`, 400);
  for (const img of images) {
    if (!img || !IMAGE_PATH.test(String(img.path)) || typeof img.data !== 'string') {
      return fail('Netinkamas nuotraukos failas.', 400);
    }
    if (base64Bytes(img.data) > MAX_IMAGE_BYTES) return fail('Nuotrauka per didelė (daugiausia 1 MB).', 413);
  }
  if (!files.length && !images.length) return fail('Nėra ką išsaugoti.', 400);

  const repo = `/repos/${cfg.repo}`;
  const branch = encodeURIComponent(cfg.branch);
  try {
    // ── Conflict check: the file must still be what the editor loaded ──────
    for (const f of files) {
      const current = await getRepoSha(cfg, f.path);
      if (!body.base || body.base[f.key] !== current) return fail(CONFLICT, 409);
    }

    const ref = await gh(cfg, `${repo}/git/ref/heads/${branch}`);
    const parent = await gh(cfg, `${repo}/git/commits/${ref.object.sha}`);

    // ── Blobs → tree → commit → move branch (fast-forward only) ───────────
    const shas = {};
    const tree = [];
    for (const f of files) {
      const blob = await gh(cfg, `${repo}/git/blobs`, {
        method: 'POST', body: JSON.stringify({ content: f.text, encoding: 'utf-8' }),
      });
      shas[f.key] = blob.sha;
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    for (const img of images) {
      const blob = await gh(cfg, `${repo}/git/blobs`, {
        method: 'POST', body: JSON.stringify({ content: img.data, encoding: 'base64' }),
      });
      tree.push({ path: img.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const newTree = await gh(cfg, `${repo}/git/trees`, {
      method: 'POST', body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
    });
    const summary = String(body.summary || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 300);
    const commit = await gh(cfg, `${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: `Redaktorius: turinio atnaujinimas${summary ? `\n\n${summary}` : ''}`,
        tree: newTree.sha,
        parents: [ref.object.sha],
      }),
    });
    await gh(cfg, `${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }),
    });

    return json({ ok: true, commit: commit.sha, shas });
  } catch (err) {
    // 422 on the ref update = someone else committed in between.
    if (err instanceof GitHubError && err.status === 422) return fail(CONFLICT, 409);
    console.error('save failed:', err && err.message);
    return fail('Nepavyko išsaugoti į GitHub. Bandykite dar kartą.', 502);
  }
}
