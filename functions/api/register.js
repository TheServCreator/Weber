// Delay importing `cloudflare:sockets` until runtime inside `sendMail`
// to avoid module-load failures in environments that don't support it.

const SMTP_HOST = 'serbentas.serveriai.lt';
const SMTP_PORT = 465;
const TO_ADDRESS = 'info@steamedukacija.lt';
const EHLO_DOMAIN = 'topgimtadieniai.lt';

const COMMON_REQUIRED_FIELDS = ['name', 'email', 'city', 'date', 'guests'];

const FORM_SPECIFIC_REQUIRED_FIELDS = {
  'gimtadienis-registracija': ['tema'],
  'meskuciai-registracija': ['phone'],
};

const FORM_LABELS = {
  'gimtadienis-registracija': 'Gimtadienio šventė',
  'meskuciai-registracija': 'Meškučių gimtadienis',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const fd = await request.formData();
      data = Object.fromEntries(fd.entries());
    }
  } catch {
    return jsonError('Neteisingas užklausos formatas.', 400);
  }

  const formName = String(data['form-name'] || '');
  const specificRequired = FORM_SPECIFIC_REQUIRED_FIELDS[formName];
  if (!specificRequired) {
    return jsonError('Nežinoma forma.', 400);
  }

  const requiredFields = [...COMMON_REQUIRED_FIELDS, ...specificRequired];
  for (const f of requiredFields) {
    if (!data[f] || String(data[f]).trim() === '') {
      return jsonError(`Trūksta lauko: ${f}.`, 400);
    }
  }

  const fromEmail = String(data.email).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return jsonError('Neteisingas el. pašto formatas.', 400);
  }
  if (containsCrlf(fromEmail) || containsCrlf(String(data.name))) {
    return jsonError('Neleistini simboliai.', 400);
  }

  if (!env.SMTP_USERNAME || !env.SMTP_PASSWORD) {
    console.error('SMTP credentials not configured');
    return jsonError('Serverio konfigūracijos klaida.', 500);
  }

  const subjectTopic = formName === 'gimtadienis-registracija'
    ? (data.tema || FORM_LABELS[formName])
    : FORM_LABELS[formName];
  const subject = `Nauja rezervacija: ${subjectTopic} – ${data.name}`;

  const bodyText = formName === 'gimtadienis-registracija'
    ? [
        `Vardas: ${data.name}`,
        `El. paštas: ${fromEmail}`,
        `Telefonas: ${data.phone || ''}`,
        `Miestas: ${data.city}`,
        `Data: ${data.date}`,
        `Svečių skaičius: ${data.guests}`,
        `Pageidaujamos pramogos: ${data.pramogos || ''}`,
        `Gimtadienio paketas: ${data.paketas || ''}`,
        `Tema: ${data.tema}`,
      ].join('\r\n')
    : [
        `Vardas: ${data.name}`,
        `El. paštas: ${fromEmail}`,
        `Telefonas: ${data.phone}`,
        `Miestas: ${data.city}`,
        `Data: ${data.date}`,
        `Vaikų skaičius: ${data.guests}`,
        `Komentarai: ${data.comments || ''}`,
      ].join('\r\n');

  try {
    await sendMail({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: env.SMTP_USERNAME,
      password: env.SMTP_PASSWORD,
      from: TO_ADDRESS,
      to: TO_ADDRESS,
      replyTo: fromEmail,
      subject,
      bodyText,
    });
  } catch (err) {
    console.error('SMTP error:', err && (err.message || String(err)));
    return jsonError(
      'Nepavyko išsiųsti registracijos. Bandykite vėliau arba parašykite el. paštu info@steamedukacija.lt.',
      502,
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function containsCrlf(s) {
  return /[\r\n]/.test(s);
}

function b64(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

class SmtpReader {
  constructor(reader) {
    this.reader = reader;
    this.decoder = new TextDecoder();
    this.buf = '';
  }
  async readResponse(expectedCode) {
    while (true) {
      const lines = this.buf.split('\r\n');
      let endIdx = -1;
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.length >= 4 && line[3] === ' ') {
          endIdx = i;
          break;
        }
      }
      if (endIdx >= 0) {
        const responseLines = lines.slice(0, endIdx + 1);
        this.buf = lines.slice(endIdx + 1).join('\r\n');
        const code = parseInt(responseLines[responseLines.length - 1].slice(0, 3), 10);
        if (expectedCode && code !== expectedCode) {
          throw new Error(`Expected ${expectedCode}, got: ${responseLines.join(' / ')}`);
        }
        return { code, lines: responseLines };
      }
      const { value, done } = await this.reader.read();
      if (done) throw new Error('SMTP connection closed unexpectedly');
      this.buf += this.decoder.decode(value, { stream: true });
    }
  }
}

async function sendMail({ host, port, username, password, from, to, replyTo, subject, bodyText }) {
  let connect;
  try {
    ({ connect } = await import('cloudflare:sockets'));
  } catch (err) {
    throw new Error('cloudflare:sockets import failed: ' + (err && err.message ? err.message : String(err)));
  }

  const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
  const writer = socket.writable.getWriter();
  const reader = new SmtpReader(socket.readable.getReader());
  const encoder = new TextEncoder();

  const send = (line) => writer.write(encoder.encode(line + '\r\n'));

  try {
    await reader.readResponse(220);
    await send(`EHLO ${EHLO_DOMAIN}`);
    await reader.readResponse(250);
    await send('AUTH LOGIN');
    await reader.readResponse(334);
    await send(b64(username));
    await reader.readResponse(334);
    await send(b64(password));
    await reader.readResponse(235);
    await send(`MAIL FROM:<${from}>`);
    await reader.readResponse(250);
    await send(`RCPT TO:<${to}>`);
    await reader.readResponse(250);
    await send('DATA');
    await reader.readResponse(354);

    const subjectEncoded = `=?UTF-8?B?${b64(subject)}?=`;
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${subjectEncoded}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      `Date: ${new Date().toUTCString()}`,
    ].join('\r\n');

    const bodyB64 = b64(bodyText).replace(/(.{76})/g, '$1\r\n');
    await send(`${headers}\r\n\r\n${bodyB64}\r\n.`);
    await reader.readResponse(250);
    await send('QUIT');
  } finally {
    try { writer.releaseLock(); } catch {}
    try { await socket.close(); } catch {}
  }
}
