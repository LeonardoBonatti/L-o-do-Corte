/* POST /api/auth/logout — apaga o cookie de sessão. */

'use strict';

const { clearSession } = require('../_auth');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;
  clearSession(res);
  http.ok(res, { ok: true });
};
