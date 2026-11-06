/* DELETE /api/products/:id — remove um produto (só o barbeiro).
   Os tamanhos saem junto, por cascade no schema. */

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

    const id = String(req.query && req.query.id ? req.query.id : '');
    if (!id) return http.badRequest(res, 'Produto não informado.');

    const { rowCount } = await sql`delete from products where id = ${id}`;
    if (!rowCount) return http.notFound(res, 'Produto não encontrado.');

    http.ok(res, { id: id });
  } catch (err) {
    http.serverError(res, err);
  }
};
