// GET /api/admin/session → 200 when the session cookie is valid, 401 otherwise.
import { json, requireSession, githubConfig } from '../../_lib/admin.js';

export async function onRequestGet({ request, env }) {
  const denied = await requireSession(request, env);
  if (denied) return denied;
  return json({ ok: true, github: Boolean(githubConfig(env)) });
}
