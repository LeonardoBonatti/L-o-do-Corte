/* ============================================================
   GET /api/bootstrap

   Uma chamada só, com tudo que a app precisa para renderizar. O cliente
   guarda isso em memória e todas as leituras continuam síncronas, como eram
   no localStorage.

   A resposta é FILTRADA POR PAPEL:
   - visitante e cliente: ajustes, serviços, produtos e promoções; os próprios
     agendamentos e pedidos por inteiro; os agendamentos de terceiros apenas
     como "slot ocupado", sem nome, telefone, serviço ou valor.
   - barbeiro: tudo, mais a lista de clientes (precisa do contato na agenda).

   Hash de senha não sai daqui em nenhuma hipótese.
   ============================================================ */

'use strict';

const { sql } = require('./_db');
const { currentUser } = require('./_auth');
const shape = require('./_shape');
const http = require('./_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['GET'])) return;

  try {
    const me = await currentUser(req);
    const isAdmin = !!me && me.role === 'admin';

    const [settingsRes, servicesRes, productsRes, sizesRes, weekdayRes, comboRes] = await Promise.all([
      sql`select * from settings where id = 1`,
      sql`select id, name, price, duration, descr from services order by sort, name`,
      sql`select id, title, price, active, image, descr from products order by sort, title`,
      sql`select product_id, size, qty from product_sizes order by product_id, sort, size`,
      sql`select id, label, weekday, percent, scope, service_id, active from weekday_rules order by weekday`,
      sql`select id, label, min_services, min_products, percent, active from combo_rules order by label`
    ]);

    if (!settingsRes.rows[0]) {
      return http.json(res, 503, {
        error: 'O banco ainda não foi inicializado. Rode `npm run migrate`.'
      });
    }

    const sizesByProduct = {};
    sizesRes.rows.forEach(function (row) {
      (sizesByProduct[row.product_id] = sizesByProduct[row.product_id] || [])
        .push({ size: row.size, qty: Number(row.qty) });
    });

    /*
     * A data sai como texto para não escorregar de dia no fuso do Brasil.
     *
     * O barbeiro vê tudo, cancelados incluídos — a agenda dele mostra o
     * histórico do dia. Para os outros, só os horários que ainda ocupam a
     * grade, mais os próprios cancelados (que aparecem no histórico do
     * cliente em "Meus agendamentos").
     */
    const appointmentsRes = isAdmin
      ? await sql`select id, user_id, service_id, service_name, duration,
                         to_char(slot_date, 'YYYY-MM-DD') as slot_date, slot_time,
                         price_base, discount, price_final, applied_rules, status, created_at
                    from appointments
                   order by slot_date, slot_time`
      : await sql`select id, user_id, service_id, service_name, duration,
                         to_char(slot_date, 'YYYY-MM-DD') as slot_date, slot_time,
                         price_base, discount, price_final, applied_rules, status, created_at
                    from appointments
                   where status <> 'cancelado'
                      or user_id = ${me ? me.id : null}
                   order by slot_date, slot_time`;

    const appointments = appointmentsRes.rows.map(function (row) {
      if (isAdmin || (me && row.user_id === me.id)) return shape.appointment(row);
      return shape.busySlot(row);
    });

    /* Pedidos: os próprios, ou todos se for o barbeiro. */
    const ordersRes = me
      ? (isAdmin
        ? await sql`select * from orders order by created_at desc`
        : await sql`select * from orders where user_id = ${me.id} order by created_at desc`)
      : { rows: [] };

    let orders = [];
    if (ordersRes.rows.length) {
      const ids = ordersRes.rows.map(function (r) { return r.id; });
      const itemsRes = await sql`select * from order_items where order_id = any(${ids}) order by id`;
      const itemsByOrder = {};
      itemsRes.rows.forEach(function (row) {
        (itemsByOrder[row.order_id] = itemsByOrder[row.order_id] || []).push(shape.orderItem(row));
      });
      orders = ordersRes.rows.map(function (row) {
        return shape.order(row, itemsByOrder[row.id] || []);
      });
    }

    /* Só o barbeiro recebe a lista de clientes, e sem hash de senha. */
    const usersRes = isAdmin
      ? await sql`select id, name, email, phone, role, created_at from users order by name`
      : { rows: [] };

    http.ok(res, {
      me: me,
      settings: shape.settings(settingsRes.rows[0]),
      services: servicesRes.rows.map(shape.service),
      products: productsRes.rows.map(function (row) {
        return shape.product(row, sizesByProduct[row.id] || []);
      }),
      appointments: appointments,
      orders: orders,
      weekdayRules: weekdayRes.rows.map(shape.weekdayRule),
      comboRules: comboRes.rows.map(shape.comboRule),
      users: usersRes.rows.map(function (row) {
        return {
          id: row.id, name: row.name, email: row.email,
          phone: row.phone, role: row.role, createdAt: row.created_at
        };
      })
    });
  } catch (err) {
    http.serverError(res, err);
  }
};
