// GET /api/admin/content → the current content.json straight from GitHub
// (with its blob SHA for conflict detection on save). Read from GitHub, not
// the deployed bundle, so edits made in Sveltia CMS are never overwritten.
import { json, fail, requireSession, githubConfig, getRepoFile } from '../../_lib/admin.js';

const CONTENT_PATH = 'src/data/content.json';

export async function onRequestGet({ request, env }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const cfg = githubConfig(env);
  if (!cfg) return fail('GitHub nesukonfigūruotas (trūksta GITHUB_TOKEN arba GITHUB_REPO).', 503);

  try {
    const content = await getRepoFile(cfg, CONTENT_PATH);
    return json({ ok: true, content: JSON.parse(content.text), shas: { content: content.sha } });
  } catch (err) {
    console.error('content load failed:', err && err.message);
    return fail('Nepavyko įkelti turinio iš GitHub.', 502);
  }
}
