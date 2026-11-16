// POST /api/admin/login  { password } → sets the signed session cookie.
import {
  json, fail, configError, badOrigin, safeEqual, createSessionCookie, loginLimiter,
} from '../../_lib/admin.js';

export async function onRequestPost({ request, env }) {
  const cfg = configError(env);
  if (cfg) return cfg;
  if (badOrigin(request)) return fail('Neleistinas šaltinis.', 403);

  const limiter = loginLimiter(request, env);
  const wait = await limiter.blockedFor();
  if (wait > 0) {
    const minutes = Math.ceil(wait / 60);
    return fail(`Per daug bandymų. Bandykite po ${minutes} min.`, 429, { retryAfter: wait });
  }

  let password = '';
  try {
    ({ password = '' } = await request.json());
  } catch {
    return fail('Neteisingas užklausos formatas.', 400);
  }

  if (!(await safeEqual(String(password), env.ADMIN_PASSWORD, env.ADMIN_SESSION_SECRET))) {
    const left = await limiter.registerFailure();
    return fail(
      left > 0
        ? `Neteisingas slaptažodis. Liko bandymų: ${left}.`
        : 'Neteisingas slaptažodis. Prisijungimas laikinai užblokuotas 15 min.',
      401,
      { attemptsLeft: left },
    );
  }

  await limiter.reset();
  return json({ ok: true }, 200, { 'set-cookie': await createSessionCookie(env) });
}
