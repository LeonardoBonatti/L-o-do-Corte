/* ============================================================
   POST /api/appointments — cria um agendamento.

   O agendamento e os seus slots nascem na mesma transação. Se outra pessoa
   pegou qualquer um dos slots no meio do caminho, a chave primária de
   appointment_slots recusa o insert e a transação inteira é desfeita.

   É aqui que o problema original morre: dois clientes não conseguem mais
   marcar o mesmo horário, porque a decisão é do banco e não da tela.
   ============================================================ */

'use strict';

const { sql, withTransaction, newId, isUniqueViolation } = require('../_db');
const { currentUser } = require('../_auth');
const { validateBooking } = require('../_slots');
const shape = require('../_shape');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);

    const body = await http.readBody(req);
    const serviceId = String(body.serviceId || '');
    const date = String(body.date || '');
    const time = String(body.time || '');

    if (!serviceId) return http.badRequest(res, 'Escolha um serviço.');

    const [serviceRes, settingsRes] = await Promise.all([
      sql`select id, name, price, duration, descr from services where id = ${serviceId}`,
      sql`select * from settings where id = 1`
    ]);

    const service = serviceRes.rows[0];
    if (!service) return http.badRequest(res, 'Serviço não encontrado.');
    if (!settingsRes.rows[0]) return http.json(res, 503, { error: 'Banco não inicializado.' });

    const check = validateBooking(shape.settings(settingsRes.rows[0]), date, time, service.duration);
    if (!check.ok) return http.conflict(res, check.error);

    /*
     * O preço base vem do banco, nunca do corpo da requisição. O desconto
     * ainda é calculado no cliente (discounts.js), então aqui ele só é
     * limitado ao intervalo possível — assim um cliente que adultere o
     * JavaScript não cria um agendamento de valor negativo.
     */
    const priceBase = Number(service.price);
    const discount = Math.min(Math.max(Number(body.discount) || 0, 0), priceBase);
    const priceFinal = priceBase - discount;
    const rules = Array.isArray(body.appliedRules) ? body.appliedRules : [];
    const id = newId('ap');

    try {
      await withTransaction(async function (client) {
        await client.sql`
          insert into appointments
            (id, user_id, service_id, service_name, duration, slot_date, slot_time,
             price_base, discount, price_final, applied_rules, status)
          values
            (${id}, ${me.id}, ${service.id}, ${service.name}, ${service.duration},
             ${date}, ${time}, ${priceBase}, ${discount}, ${priceFinal},
             ${JSON.stringify(rules)}::jsonb, 'confirmado')
        `;

        /* Um serviço de 45 min grava dois slots: o escolhido e o seguinte. */
        for (const slotTime of check.times) {
          await client.sql`
            insert into appointment_slots (slot_date, slot_time, appointment_id)
            values (${date}, ${slotTime}, ${id})
          `;
        }
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        return http.conflict(res, 'Esse horário acabou de ser reservado. Escolha outro.');
      }
      throw err;
    }

    const { rows } = await sql`
      select id, user_id, service_id, service_name, duration,
             to_char(slot_date, 'YYYY-MM-DD') as slot_date, slot_time,
             price_base, discount, price_final, applied_rules, status, created_at
        from appointments
       where id = ${id}
    `;

    http.ok(res, { appointment: shape.appointment(rows[0]) });
  } catch (err) {
    http.serverError(res, err);
  }
};
