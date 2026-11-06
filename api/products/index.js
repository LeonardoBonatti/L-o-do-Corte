/* POST /api/products — cria ou atualiza um produto (só o barbeiro). */

'use strict';

const { sql, withTransaction, newId } = require('../_db');
const { currentUser } = require('../_auth');
const shape = require('../_shape');
const http = require('../_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);
    if (me.role !== 'admin') return http.forbidden(res);

    const body = await http.readBody(req);
    const title = String(body.title || '').trim();
    const price = Number(body.price);

    if (title.length < 2) return http.badRequest(res, 'Informe o nome do produto.');
    if (!isFinite(price) || price < 0) return http.badRequest(res, 'Informe um preço válido.');

    const id = String(body.id || '') || newId('p');
    const sizes = Array.isArray(body.sizes) ? body.sizes : [];

    for (const entry of sizes) {
      if (!String(entry.size || '').trim()) {
        return http.badRequest(res, 'Todo tamanho precisa de um nome.');
      }
      if (!isFinite(Number(entry.qty)) || Number(entry.qty) < 0) {
        return http.badRequest(res, 'Quantidade em estoque não pode ser negativa.');
      }
    }

    await withTransaction(async function (client) {
      await client.sql`
        insert into products (id, title, price, active, image, descr)
        values (${id}, ${title}, ${price}, ${body.active !== false},
                ${String(body.image || '')}, ${String(body.desc || '')})
        on conflict (id) do update
           set title = excluded.title,
               price = excluded.price,
               active = excluded.active,
               image = excluded.image,
               descr = excluded.descr
      `;

      /* Trocar a grade inteira é mais simples e seguro que casar diferenças. */
      await client.sql`delete from product_sizes where product_id = ${id}`;
      let sort = 0;
      for (const entry of sizes) {
        sort += 1;
        await client.sql`
          insert into product_sizes (product_id, size, qty, sort)
          values (${id}, ${String(entry.size).trim()}, ${Number(entry.qty)}, ${sort})
          on conflict (product_id, size) do update set qty = excluded.qty, sort = excluded.sort
        `;
      }
    });

    const [productRes, sizesRes] = await Promise.all([
      sql`select id, title, price, active, image, descr from products where id = ${id}`,
      sql`select size, qty from product_sizes where product_id = ${id} order by sort, size`
    ]);

    http.ok(res, {
      product: shape.product(
        productRes.rows[0],
        sizesRes.rows.map(function (r) { return { size: r.size, qty: Number(r.qty) }; })
      )
    });
  } catch (err) {
    http.serverError(res, err);
  }
};
