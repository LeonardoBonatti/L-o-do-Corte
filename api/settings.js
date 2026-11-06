/* PUT /api/settings — nome, WhatsApp, endereço e horários (só o barbeiro). */

'use strict';

const { sql } = require('./_db');
const { currentUser } = require('./_auth');
const { timeToMin } = require('./_slots');
const shape = require('./_shape');
const http = require('./_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['PUT', 'POST'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);
    if (me.role !== 'admin') return http.forbidden(res);

    const body = await http.readBody(req);
    const shopName = String(body.shopName || '').trim();
    const whatsapp = String(body.whatsapp || '').replace(/\D+/g, '');
    const address = String(body.address || '').trim();
    const openTime = String(body.openTime || '');
    const closeTime = String(body.closeTime || '');

    if (shopName.length < 2) return http.badRequest(res, 'Informe o nome da barbearia.');
    if (whatsapp.length < 10) return http.badRequest(res, 'Informe o WhatsApp com DDD.');

    const open = timeToMin(openTime);
    const close = timeToMin(closeTime);
    if (open === null || close === null) return http.badRequest(res, 'Horário inválido.');
    if (close - open < 30) {
      return http.badRequest(res, 'O fechamento tem que ser ao menos 30 min depois da abertura.');
    }

    const closed = Array.isArray(body.closedWeekdays)
      ? body.closedWeekdays.map(Number).filter(function (d) { return d >= 0 && d <= 6; })
      : [];

    const { rows } = await sql`
      update settings
         set shop_name = ${shopName},
             whatsapp = ${whatsapp},
             address = ${address},
             open_time = ${openTime},
             close_time = ${closeTime},
             closed_weekdays = ${closed}
       where id = 1
      returning *
    `;

    if (!rows[0]) return http.json(res, 503, { error: 'Banco não inicializado.' });
    http.ok(res, { settings: shape.settings(rows[0]) });
  } catch (err) {
    http.serverError(res, err);
  }
};
