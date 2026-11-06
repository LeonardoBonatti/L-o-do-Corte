/* POST /api/auth/login */

'use strict';

const { sql } = require('../_db');
const { verifyPassword, setSession, publicUser } = require('../_auth');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const body = await http.readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return http.badRequest(res, 'Informe e-mail e senha.');
    }

    const { rows } = await sql`
      select id, name, email, phone, role, created_at, password_hash
        from users
       where lower(email) = ${email}
    `;
    const user = rows[0];

    /*
     * Uma única mensagem para e-mail inexistente e senha errada. A versão
     * anterior dizia "não encontramos esse e-mail", o que permitia descobrir
     * quais e-mails têm conta.
     */
    const good = user ? await verifyPassword(password, user.password_hash) : false;
    if (!good) return http.unauthorized(res, 'E-mail ou senha incorretos.');

    setSession(res, user.id);
    http.ok(res, { user: publicUser(user) });
  } catch (err) {
    http.serverError(res, err);
  }
};
