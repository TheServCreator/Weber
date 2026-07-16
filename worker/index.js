import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

const FIELD_LABELS = {
  name: 'Vardas',
  email: 'El. paštas',
  phone: 'Telefonas',
  city: 'Miestas',
  date: 'Data',
  guests: 'Svečių skaičius',
  comments: 'Komentarai',
  'party-type': 'Šventės tipas',
  pramogos: 'Pageidaujamos pramogos',
  paketas: 'Gimtadienio paketas',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/rezervacija') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Method Not Allowed' }, 405);
      }
      return handleFormSubmission(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleFormSubmission(request, env) {
  let entries;
  try {
    const formData = await request.formData();
    entries = [...formData.entries()].map(([k, v]) => [k, String(v).trim()]);
  } catch {
    return json({ ok: false, error: 'Blogas užklausos formatas' }, 400);
  }

  const get = (key) => {
    const found = entries.find(([k]) => k === key);
    return found ? found[1] : '';
  };

  if (!get('name') || !get('email')) {
    return json({ ok: false, error: 'Trūksta privalomų laukų' }, 422);
  }

  const formName = get('form-name') || 'rezervacija';
  const grouped = new Map();
  for (const [k, v] of entries) {
    if (k === 'form-name' || v === '') continue;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(v);
  }
  const lines = [...grouped.entries()].map(([k, values]) => `${FIELD_LABELS[k] || k}: ${values.join(', ')}`);

  const msg = createMimeMessage();
  msg.setSender({ name: 'Gimtadienių svetainė', addr: env.SENDER_ADDRESS });
  msg.setRecipient(env.DESTINATION_ADDRESS);
  msg.setHeader('Reply-To', get('email'));
  msg.setSubject(`Nauja rezervacija (${formName})`);
  msg.addMessage({ contentType: 'text/plain', charset: 'utf-8', data: lines.join('\n') });

  try {
    await env.EMAIL.send(new EmailMessage(env.SENDER_ADDRESS, env.DESTINATION_ADDRESS, msg.asRaw()));
  } catch (error) {
    console.error(`Email send failed: ${error.message}`);
    return json({ ok: false, error: 'Nepavyko išsiųsti' }, 502);
  }

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
