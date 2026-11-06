/* ============================================================
   _auth.js — senha em hash e sessão em cookie assinado.

   Sem dependência externa: scrypt e HMAC vêm do node:crypto.
   Nenhuma senha é gravada ou comparada em texto puro.
   ============================================================ */

'use strict';

const crypto = require('node:crypto');
const { sql } = require('./_db');

/* 128 * N * r = 16 MB por chamada, abaixo do maxmem padrão de 32 MB. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

const COOKIE = 'ldc_session';
const TTL_SECONDS = 60 * 60 * 24 * 30;   // 30 dias

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET ausente ou com menos de 32 caracteres.');
  }
  return value;
}

/* ---------------- Senha ---------------- */

/** Formato: scrypt$N$r$p$salt$hash — autodescritivo, para poder evoluir. */
function hashPassword(password) {
  return new Promise(function (resolve, reject) {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(
      password, salt, SCRYPT.keylen,
      { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p },
      function (err, derived) {
        if (err) return reject(err);
        resolve([
          'scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p,
          salt.toString('base64'), derived.toString('base64')
        ].join('$'));
      }
    );
  });
}

/** Comparação em tempo constante. Hash malformado devolve false, não erro. */
function verifyPassword(password, stored) {
  return new Promise(function (resolve) {
    if (typeof stored !== 'string') return resolve(false);

    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return resolve(false);

    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (!N || !r || !p) return resolve(false);

    let salt, expected;
    try {
      salt = Buffer.from(parts[4], 'base64');
      expected = Buffer.from(parts[5], 'base64');
    } catch (_) {
      return resolve(false);
    }
    if (!expected.length) return resolve(false);

    crypto.scrypt(password, salt, expected.length, { N: N, r: r, p: p }, function (err, derived) {
      if (err) return resolve(false);
      resolve(derived.length === expected.length && crypto.timingSafeEqual(derived, expected));
    });
  });
}

/* ---------------- Sessão ---------------- */

function signSession(userId) {
  const body = Buffer.from(userId + '.' + (Date.now() + TTL_SECONDS * 1000)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}

/** Devolve o id do usuário, ou null se a assinatura não bate ou expirou. */
function verifySession(token) {
  if (!token) return null;

  const cut = token.lastIndexOf('.');
  if (cut < 1) return null;

  const body = token.slice(0, cut);
  const expected = crypto.createHmac('sha256', secret()).update(body).digest();

  let given;
  try { given = Buffer.from(token.slice(cut + 1), 'base64url'); } catch (_) { return null; }
  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(given, expected)) return null;

  const decoded = Buffer.from(body, 'base64url').toString('utf8');
  const dot = decoded.lastIndexOf('.');
  if (dot < 1) return null;

  const expiresAt = Number(decoded.slice(dot + 1));
  if (!expiresAt || Date.now() > expiresAt) return null;

  return decoded.slice(0, dot);
}

function readToken(req) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';')
    .map(function (part) { return part.trim(); })
    .filter(function (part) { return part.indexOf(COOKIE + '=') === 0; })[0];
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

function cookie(value, maxAge) {
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' + maxAge];
  /* Secure só em produção: em http://localhost o navegador descartaria. */
  if (process.env.VERCEL) flags.push('Secure');
  return COOKIE + '=' + encodeURIComponent(value) + '; ' + flags.join('; ');
}

function setSession(res, userId) {
  res.setHeader('Set-Cookie', cookie(signSession(userId), TTL_SECONDS));
}

function clearSession(res) {
  res.setHeader('Set-Cookie', cookie('', 0));
}

/* ---------------- Usuário da requisição ---------------- */

/** Sem o hash da senha: este objeto é o que chega no navegador. */
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at
  };
}

async function currentUser(req) {
  const id = verifySession(readToken(req));
  if (!id) return null;

  const { rows } = await sql`
    select id, name, email, phone, role, created_at
      from users
     where id = ${id}
  `;
  return rows[0] ? publicUser(rows[0]) : null;
}

module.exports = {
  hashPassword, verifyPassword,
  setSession, clearSession, currentUser, publicUser,
  TTL_SECONDS
};
