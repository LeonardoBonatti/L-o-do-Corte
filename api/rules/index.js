/* POST /api/rules — cria ou atualiza uma promoção (só o barbeiro).
   O corpo traz `kind`: 'weekday' (dia da semana) ou 'combo'. */

'use strict';

const { sql, newId } = require('../_db');
const { currentUser } = require('../_auth');
const shape = require('../_shape');
const http = require('../_http');

const SCOPES = ['servicos', 'servico', 'produtos', 'total'];

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);
    if (me.role !== 'admin') return http.forbidden(res);

    const body = await http.readBody(req);
    const kind = String(body.kind || '');
    const label = String(body.label || '').trim();
    const percent = Number(body.percent);
    const active = body.active !== false;

    if (label.length < 2) return http.badRequest(res, 'Dê um nome à promoção.');
    if (!isFinite(percent) || percent <= 0 || percent > 100) {
      return http.badRequest(res, 'O percentual precisa ficar entre 1 e 100.');
    }

    if (kind === 'weekday') {
      const weekday = Number(body.weekday);
      const scope = String(body.scope || '');

      if (!(weekday >= 0 && weekday <= 6)) return http.badRequest(res, 'Dia da semana inválido.');
      if (SCOPES.indexOf(scope) === -1) return http.badRequest(res, 'Abrangência inválida.');

      /* 'servico' exige apontar qual; os outros escopos ignoram o campo. */
      const serviceId = scope === 'servico' ? String(body.serviceId || '') : null;
      if (scope === 'servico') {
        if (!serviceId) return http.badRequest(res, 'Escolha o serviço da promoção.');
        const { rows } = await sql`select id from services where id = ${serviceId}`;
        if (!rows[0]) return http.badRequest(res, 'Serviço não encontrado.');
      }

      const id = String(body.id || '') || newId('wd');
      const { rows } = await sql`
        insert into weekday_rules (id, label, weekday, percent, scope, service_id, active)
        values (${id}, ${label}, ${weekday}, ${percent}, ${scope}, ${serviceId}, ${active})
        on conflict (id) do update
           set label = excluded.label, weekday = excluded.weekday,
               percent = excluded.percent, scope = excluded.scope,
               service_id = excluded.service_id, active = excluded.active
        returning id, label, weekday, percent, scope, service_id, active
      `;
      return http.ok(res, { rule: shape.weekdayRule(rows[0]), kind: 'weekday' });
    }

    if (kind === 'combo') {
      const minServices = Number(body.minServices);
      const minProducts = Number(body.minProducts);

      if (!(minServices >= 0) || !(minProducts >= 0)) {
        return http.badRequest(res, 'Os mínimos não podem ser negativos.');
      }
      if (minServices === 0 && minProducts === 0) {
        return http.badRequest(res, 'A regra precisa exigir ao menos um item.');
      }

      const id = String(body.id || '') || newId('cb');
      const { rows } = await sql`
        insert into combo_rules (id, label, min_services, min_products, percent, active)
        values (${id}, ${label}, ${minServices}, ${minProducts}, ${percent}, ${active})
        on conflict (id) do update
           set label = excluded.label, min_services = excluded.min_services,
               min_products = excluded.min_products, percent = excluded.percent,
               active = excluded.active
        returning id, label, min_services, min_products, percent, active
      `;
      return http.ok(res, { rule: shape.comboRule(rows[0]), kind: 'combo' });
    }

    http.badRequest(res, 'Tipo de promoção desconhecido.');
  } catch (err) {
    http.serverError(res, err);
  }
};
