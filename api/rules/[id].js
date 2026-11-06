/* DELETE /api/rules/:id?kind=weekday|combo — remove uma promoção. */

'use strict';

const { sql } = require('../_db');
const { currentUser } = require('../_auth');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['DELETE'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);
    if (me.role !== 'admin') return http.forbidden(res);

    const query = req.query || {};
    const id = String(query.id || '');
    const kind = String(query.kind || '');

    if (!id) return http.badRequest(res, 'Promoção não informada.');

    let result;
    if (kind === 'weekday') {
      result = await sql`delete from weekday_rules where id = ${id}`;
    } else if (kind === 'combo') {
      result = await sql`delete from combo_rules where id = ${id}`;
    } else {
      return http.badRequest(res, 'Informe kind=weekday ou kind=combo.');
    }

    if (!result.rowCount) return http.notFound(res, 'Promoção não encontrada.');
    http.ok(res, { id: id, kind: kind });
  } catch (err) {
    http.serverError(res, err);
  }
};
