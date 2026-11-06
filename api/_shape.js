/* ============================================================
   _shape.js — converte linha do Postgres no formato que o cliente já espera.

   Dois cuidados que, esquecidos, quebram a app de formas silenciosas:
   - `numeric` chega como string no driver: tudo que é preço passa por Number.
   - `date` chega como objeto Date em UTC, o que pode andar um dia para trás
     no fuso do Brasil. Por isso as consultas devolvem a data já como texto
     (to_char), e aqui ela só é repassada.
   ============================================================ */

'use strict';

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

function service(row) {
  return {
    id: row.id,
    name: row.name,
    price: num(row.price),
    duration: Number(row.duration),
    desc: row.descr || ''
  };
}

function product(row, sizes) {
  return {
    id: row.id,
    title: row.title,
    price: num(row.price),
    active: row.active !== false,
    image: row.image || '',
    desc: row.descr || '',
    sizes: sizes || []
  };
}

function appointment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    duration: Number(row.duration),
    date: row.slot_date,
    time: row.slot_time,
    priceBase: num(row.price_base),
    discount: num(row.discount),
    priceFinal: num(row.price_final),
    appliedRules: row.applied_rules || [],
    status: row.status,
    createdAt: row.created_at
  };
}

/**
 * Agendamento de outra pessoa, para quem não é o barbeiro.
 *
 * A grade de horários precisa saber que o slot está ocupado — occupiedStarts()
 * só lê id, status, time e duration. Nome, telefone, serviço e preço de outro
 * cliente não têm por que sair do servidor.
 */
function busySlot(row) {
  return {
    id: row.id,
    date: row.slot_date,
    time: row.slot_time,
    duration: Number(row.duration),
    status: row.status
  };
}

function order(row, items) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    items: items || [],
    subtotal: num(row.subtotal),
    discount: num(row.discount),
    total: num(row.total),
    status: row.status,
    createdAt: row.created_at
  };
}

function orderItem(row) {
  return {
    productId: row.product_id,
    title: row.title,
    size: row.size,
    qty: Number(row.qty),
    unitPrice: num(row.unit_price)
  };
}

function weekdayRule(row) {
  return {
    id: row.id,
    label: row.label,
    weekday: Number(row.weekday),
    percent: num(row.percent),
    scope: row.scope,
    serviceId: row.service_id,
    active: row.active !== false
  };
}

function comboRule(row) {
  return {
    id: row.id,
    label: row.label,
    minServices: Number(row.min_services),
    minProducts: Number(row.min_products),
    percent: num(row.percent),
    active: row.active !== false
  };
}

function settings(row) {
  return {
    shopName: row.shop_name,
    whatsapp: row.whatsapp,
    address: row.address || '',
    openTime: row.open_time,
    closeTime: row.close_time,
    slotMinutes: Number(row.slot_minutes),
    closedWeekdays: row.closed_weekdays || []
  };
}

module.exports = {
  service, product, appointment, busySlot,
  order, orderItem, weekdayRule, comboRule, settings
};
