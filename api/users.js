'use strict';

const { randomInt, randomBytes, createHash, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const { rateLimit } = require('express-rate-limit');
const deriveKey = promisify(scrypt);
const CODE_TTL = 5 * 60 * 1000;
const SESSION_TTL = 24 * 60 * 60 * 1000;
const RESEND_DELAY = 30 * 1000;
const DEMO_CARD = '4111111111111111';
const digest = (value) => createHash('sha256').update(value).digest('hex');
const validPhone = (value) => typeof value === 'string' && /^9\d{8}$/.test(value);
const string = (value) => typeof value === 'string' ? value.trim() : '';
const safeUser = (user) => ({
  phone: user.phone, terms: user.terms, verified: Boolean(user.verified),
  name: user.name || null, email: user.email || null, card: user.card || null,
  status: user.card ? 'complete' : user.name ? 'card' : user.verified ? 'profile' : 'verification'
});

module.exports = (router, db, { now = Date.now } = {}) => {
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 150, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { success: false, message: 'Demasiadas solicitudes. Intenta más tarde.', data: null } }));
  const queues = new Map();
  // Serializa operaciones sobre el mismo teléfono para evitar registros y verificaciones en carrera.
  const locked = (handler) => async (req, res) => {
    const key = validPhone(req.body?.phone) ? req.body.phone : req.ip;
    const previous = queues.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    queues.set(key, current);
    await previous;
    try { await handler(req, res); } finally {
      release();
      if (queues.get(key) === current) queues.delete(key);
    }
  };
  const fail = (res, status, message) => res.status(status).json({ success: false, message, data: null });
  const ok = (res, message, data) => res.json({ success: true, message, data });
  async function authorize(req, res) {
    const phone = req.body?.phone || req.query.phone;
    if (!validPhone(phone)) { fail(res, 400, 'Ingresa un celular peruano de 9 dígitos que comience con 9.'); return; }
    const user = await db.get(phone);
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!user || !token || digest(token) !== user.tokenHash || user.sessionExpiresAt <= now()) {
      fail(res, 401, 'La sesión no es válida o ha vencido. Inicia un nuevo registro.'); return;
    }
    return user;
  }
  router.post('/registerNumber', locked(async (req, res) => {
    const { phone, terms } = req.body || {};
    if (!validPhone(phone) || !(terms === true || terms === 'true')) return fail(res, 400, 'Ingresa un celular válido y acepta las condiciones de la demo.');
    const existing = await db.get(phone);
    if (existing?.name) return fail(res, 409, 'Este número ya está registrado. Usa otro número ficticio para probar.');
    if (existing && now() - existing.codeSentAt < RESEND_DELAY) return fail(res, 429, 'Espera 30 segundos antes de volver a registrar este número.');
    const token = randomBytes(32).toString('hex');
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const user = { phone, terms: true, codeHash: digest(code), codeExpiresAt: now() + CODE_TTL,
      codeSentAt: now(), attempts: 0, verified: false, tokenHash: digest(token), sessionExpiresAt: now() + SESSION_TTL };
    await db.put(phone, user);
    ok(res, 'Número registrado en modo demo. No se envió un SMS.', { ...safeUser(user), token, code, expiresIn: CODE_TTL / 1000, resendAfter: RESEND_DELAY / 1000 });
  }));
  router.post('/resendCode', locked(async (req, res) => {
    const user = await authorize(req, res);
    if (!user) return;
    if (user.verified) return fail(res, 409, 'El número ya está verificado.');
    if (now() - user.codeSentAt < RESEND_DELAY) return fail(res, 429, 'Espera 30 segundos antes de solicitar otro código.');
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    Object.assign(user, { codeHash: digest(code), codeExpiresAt: now() + CODE_TTL, codeSentAt: now(), attempts: 0 });
    await db.put(user.phone, user);
    ok(res, 'Nuevo código de demostración generado.', { code, expiresIn: CODE_TTL / 1000, resendAfter: RESEND_DELAY / 1000 });
  }));
  router.post('/verifyCode', locked(async (req, res) => {
    const user = await authorize(req, res);
    if (!user) return;
    if (user.verified) return fail(res, 409, 'El número ya está verificado.');
    if (user.attempts >= 5) return fail(res, 429, 'Se agotaron los intentos. Solicita otro código.');
    if (user.codeExpiresAt <= now()) return fail(res, 410, 'El código ha vencido. Solicita otro.');
    if (typeof req.body.code !== 'string' || !/^\d{6}$/.test(req.body.code) || digest(req.body.code) !== user.codeHash) {
      user.attempts++;
      await db.put(user.phone, user);
      return fail(res, 400, 'El código no es correcto.');
    }
    user.verified = true;
    delete user.codeHash;
    await db.put(user.phone, user);
    ok(res, 'Número verificado.', safeUser(user));
  }));
  router.post('/createUser', locked(async (req, res) => {
    const user = await authorize(req, res);
    if (!user) return;
    if (!user.verified) return fail(res, 403, 'Primero verifica tu código.');
    if (user.name) return fail(res, 409, 'El perfil ya está creado.');
    const name = string(req.body.name);
    const email = string(req.body.email).toLowerCase();
    const password = req.body.password;
    if (name.length < 2 || name.length > 80 || !/^[\p{L}\p{M} '\u2019-]+$/u.test(name)
      || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof password !== 'string' || !/^\d{6}$/.test(password)) return fail(res, 400, 'Revisa el nombre, correo y clave de 6 dígitos.');
    const salt = randomBytes(16).toString('hex');
    const hash = await deriveKey(password, salt, 64);
    Object.assign(user, { name, email, passwordHash: hash.toString('hex'), passwordSalt: salt });
    await db.put(user.phone, user);
    ok(res, 'Cuenta de demostración creada.', safeUser(user));
  }));
  router.post('/registerCard', locked(async (req, res) => {
    const user = await authorize(req, res);
    if (!user) return;
    if (!user.name) return fail(res, 403, 'Primero crea tu perfil.');
    if (user.card) return fail(res, 409, 'Ya agregaste una tarjeta de prueba.');
    const { cardNumber, cardMonth, cardYear, cardPassword } = req.body;
    if (cardNumber !== DEMO_CARD || cardPassword !== '1234') return fail(res, 400, 'Usa solamente la tarjeta de prueba 4111111111111111 y la clave ficticia 1234.');
    const monthText = String(cardMonth ?? '');
    const yearText = String(cardYear ?? '');
    if (!/^(0?[1-9]|1[0-2])$/.test(monthText) || !/^(\d{2}|\d{4})$/.test(yearText)) return fail(res, 400, 'La fecha de vencimiento no es válida.');
    const month = Number(monthText);
    const year = Number(yearText) < 100 ? 2000 + Number(yearText) : Number(yearText);
    const today = new Date(now());
    const currentYear = today.getUTCFullYear();
    if (year < currentYear || year > currentYear + 20 || (year === currentYear && month < today.getUTCMonth() + 1)) return fail(res, 400, 'La tarjeta está vencida o la fecha es inválida.');
    // Solo se guarda una referencia enmascarada. Nunca el número ni el PIN de una tarjeta.
    user.card = { last4: DEMO_CARD.slice(-4), month, year, demo: true };
    await db.put(user.phone, user);
    ok(res, 'Tarjeta ficticia agregada.', safeUser(user));
  }));
  router.get('/me', async (req, res) => {
    const user = await authorize(req, res);
    if (user) ok(res, 'Sesión de demostración.', safeUser(user));
  });
  return router;
};
