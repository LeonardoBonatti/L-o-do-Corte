/* ============================================================
   PATCH  /api/appointments/:id — remarcar (só o barbeiro)
   DELETE /api/appointments/:id — cancelar (o dono ou o barbeiro)

   Cancelar apaga as linhas de appointment_slots, devolvendo o horário para a
   grade. Remarcar troca os slots na mesma transação do update, então ou o
   novo horário é inteiramente livre, ou nada muda.
   ============================================================ */

'use strict';

const { sql, withTransaction, isUniqueViolation } = require('../_db');
const { currentUser } = require('../_auth');
const { validateBooking } = require('../_slots');
const shape = require('../_shape');
const http = require('../_http');

const SELECT_ONE = (id) => sql`
  select id, user_id, service_id, service_name, duration,
         to_char(slot_date, 'YYYY-MM-DD') as slot_date, slot_time,
         price_base, discount, price_final, applied_rules, status, created_at
    from appointments
   where id = ${id}
`;

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['PATCH', 'DELETE'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);

    const id = String(req.query && req.query.id ? req.query.id : '');
    if (!id) return http.badRequest(res, 'Agendamento não informado.');

    const existing = (await SELECT_ONE(id)).rows[0];
    if (!existing) return http.notFound(res, 'Agendamento não encontrado.');

    const isAdmin = me.role === 'admin';
    const isOwner = existing.user_id === me.id;

    /* ---------------- Cancelar ---------------- */
    if (req.method === 'DELETE') {
      if (!isAdmin && !isOwner) return http.forbidden(res, 'Esse agendamento não é seu.');

      if (existing.status === 'cancelado') {
        return http.ok(res, { appointment: shape.appointment(existing) });
      }

      await withTransaction(async function (client) {
        await client.sql`update appointments set status = 'cancelado' where id = ${id}`;
        await client.sql`delete from appointment_slots where appointment_id = ${id}`;
      });

      return http.ok(res, { appointment: shape.appointment((await SELECT_ONE(id)).rows[0]) });
    }

    /* ---------------- Remarcar ---------------- */
    if (!isAdmin) return http.forbidden(res, 'Só o barbeiro remarca horários.');
    if (existing.status === 'cancelado') {
      return http.conflict(res, 'Esse agendamento está cancelado.');
    }

    const body = await http.readBody(req);
    const date = String(body.date || '');
    const time = String(body.time || '');

    const settingsRes = await sql`select * from settings where id = 1`;
    if (!settingsRes.rows[0]) return http.json(res, 503, { error: 'Banco não inicializado.' });

    const check = validateBooking(
      shape.settings(settingsRes.rows[0]), date, time, existing.duration
    );
    if (!check.ok) return http.conflict(res, check.error);

    try {
      await withTransaction(async function (client) {
        /* Libera os slots antigos antes de pedir os novos, senão o próprio
           agendamento conflitaria consigo mesmo ao ficar no mesmo horário. */
        await client.sql`delete from appointment_slots where appointment_id = ${id}`;
        await client.sql`
          update appointments
             set slot_date = ${date}, slot_time = ${time}
           where id = ${id}
        `;
        for (const slotTime of check.times) {
          await client.sql`
            insert into appointment_slots (slot_date, slot_time, appointment_id)
            values (${date}, ${slotTime}, ${id})
          `;
        }
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return http.conflict(res, 'Esse horário já está ocupado.');
      }
      throw err;
    }

    http.ok(res, { appointment: shape.appointment((await SELECT_ONE(id)).rows[0]) });
  } catch (err) {
    http.serverError(res, err);
  }
};
