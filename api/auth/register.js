/* POST /api/auth/register — cria conta de cliente e já abre a sessão. */

'use strict';

const { sql, newId, isUniqueViolation } = require('../_db');
const { hashPassword, setSession, publicUser } = require('../_auth');
const http = require('../_http');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const body = await http.readBody(req);

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').replace(/\D+/g, '');
    const password = String(body.password || '');

    /* Mesmas regras que o cliente já aplicava, para as mensagens casarem. */
    if (name.length < 3) return http.badRequest(res, 'Informe seu nome completo.');
    if (!EMAIL.test(email)) return http.badRequest(res, 'Informe um e-mail válido.');
    if (phone.length < 10) return http.badRequest(res, 'Informe um celular com DDD (10 ou 11 dígitos).');
    if (password.length < 4) return http.badRequest(res, 'A senha precisa ter ao menos 4 caracteres.');

    const id = newId('u');
    const passwordHash = await hashPassword(password);

    let rows;
    try {
      ({ rows } = await sql`
        insert into users (id, name, email, phone, password_hash, role)
        values (${id}, ${name}, ${email}, ${phone}, ${passwordHash}, 'cliente')
        returning id, name, email, phone, role, created_at
      `);
    } catch (err) {
      /* O índice único em lower(email) é quem decide, não um select antes. */
      if (isUniqueViolation(err)) {
        return http.conflict(res, 'Esse e-mail já está cadastrado. Faça login.');
      }
      throw err;
    }

    setSession(res, rows[0].id);
    http.ok(res, { user: publicUser(rows[0]) });
  } catch (err) {
    http.serverError(res, err);
  }
};
