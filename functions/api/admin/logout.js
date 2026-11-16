// POST /api/admin/logout → clears the session cookie.
import { json, fail, badOrigin, clearSessionCookie } from '../../_lib/admin.js';

export async function onRequestPost({ request }) {
  if (badOrigin(request)) return fail('Neleistinas šaltinis.', 403);
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
