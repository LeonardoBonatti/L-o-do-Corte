/* ============================================================
   POST /api/orders — registra o pedido que vai para o WhatsApp.

   Os preços vêm do banco, não do corpo da requisição: o cliente manda apenas
   produto, tamanho e quantidade. Assim um total adulterado no navegador não
   entra no histórico do barbeiro.
   ============================================================ */

'use strict';

const { sql, withTransaction, newId } = require('./_db');
const { currentUser } = require('./_auth');
const shape = require('./_shape');
const http = require('./_http');

module.exports = async function handler(req, res) {
  if (http.rejectMethod(req, res, ['POST'])) return;

  try {
    const me = await currentUser(req);
    if (!me) return http.unauthorized(res);

    const body = await http.readBody(req);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return http.badRequest(res, 'O carrinho está vazio.');

    const ids = items.map(function (i) { return String(i.productId || ''); });
    const { rows: products } = await sql`
      select id, title, price from products where id = any(${ids})
    `;
    const byId = {};
    products.forEach(function (p) { byId[p.id] = p; });

    const resolved = [];
    let subtotal = 0;

    for (const item of items) {
      const product = byId[String(item.productId || '')];
      if (!product) return http.badRequest(res, 'Um dos produtos não existe mais.');

      const qty = Math.floor(Number(item.qty));
      if (!(qty > 0)) return http.badRequest(res, 'Quantidade inválida no carrinho.');

      const unitPrice = Number(product.price);
      subtotal += unitPrice * qty;
      resolved.push({
        productId: product.id,
        title: product.title,
        size: String(item.size || ''),
        qty: qty,
        unitPrice: unitPrice
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const discount = Math.min(Math.max(Number(body.discount) || 0, 0), subtotal);
    const total = Math.round((subtotal - discount) * 100) / 100;
    const id = newId('or');

    await withTransaction(async function (client) {
      await client.sql`
        insert into orders (id, user_id, user_name, subtotal, discount, total, status)
        values (${id}, ${me.id}, ${me.name}, ${subtotal}, ${discount}, ${total}, 'enviado')
      `;
      for (const item of resolved) {
        await client.sql`
          insert into order_items (order_id, product_id, title, size, qty, unit_price)
          values (${id}, ${item.productId}, ${item.title}, ${item.size}, ${item.qty}, ${item.unitPrice})
        `;
      }
    });

    const { rows } = await sql`select * from orders where id = ${id}`;
    http.ok(res, { order: shape.order(rows[0], resolved) });
  } catch (err) {
    http.serverError(res, err);
  }
};
