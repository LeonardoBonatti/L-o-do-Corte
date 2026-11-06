/* GET /api/auth/me — quem está logado, ou null. */

'use strict';

const { currentUser } = require('../_auth');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['GET'])) return;
  try {
    http.ok(res, { user: await currentUser(req) });
  } catch (err) {
    http.serverError(res, err);
  }
};
