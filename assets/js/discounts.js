/* ============================================================
   discounts.js — motor de descontos e promoções
   Expõe: window.App.discounts

   Como funciona
   -------------
   Duas famílias de regra, ambas configuráveis no painel do barbeiro:

   1) Dia da semana  (weekdayRules)
      { weekday: 0..6, percent, scope, serviceId }
      scope: 'servicos'  -> todos os serviços
             'servico'   -> apenas o serviço indicado em serviceId
             'produtos'  -> apenas o vestuário
             'total'     -> serviço + vestuário

   2) Combo / cross-selling  (comboRules)
      { minServices, minProducts, percent }
      Dispara quando o contexto tem pelo menos N serviços E N peças;
      o percentual incide sobre o total (serviço + vestuário).

   Acúmulo: cada regra calcula seu desconto sobre a própria base e os
   valores são SOMADOS (não compostos), limitados ao subtotal. Cada
   desconto é rateado entre serviço e produtos conforme a base que o
   originou, para que o agendamento e o pedido do carrinho recebam
   cada um a sua parte.
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;

  function round2(value) { return Math.round((Number(value) || 0) * 100) / 100; }

  /**
   * @param {object} ctx
   * @param {object|null} ctx.service  serviço selecionado (ou null)
   * @param {string}      ctx.date     'YYYY-MM-DD' usado para a regra de dia da semana
   * @param {Array}       ctx.cart     itens de App.store.cartDetailed()
   */
  function compute(ctx) {
    ctx = ctx || {};
    var service = ctx.service || null;
    var date = ctx.date || utils.todayIso();
    var cart = ctx.cart || [];
    var state = store.get();

    var subtotalServices = service ? (Number(service.price) || 0) : 0;
    var subtotalProducts = cart.reduce(function (sum, i) { return sum + i.subtotal; }, 0);
    var subtotal = subtotalServices + subtotalProducts;

    var servicesCount = service ? 1 : 0;
    var productsCount = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);

    var weekday = utils.weekdayOf(date);
    var applied = [];
    var discountServices = 0;
    var discountProducts = 0;

    function push(label, percent, baseServices, baseProducts, kind) {
      var base = baseServices + baseProducts;
      if (base <= 0 || !(percent > 0)) return;
      var amount = round2(base * (percent / 100));
      if (amount <= 0) return;
      // rateia o desconto entre serviço e produtos conforme a base
      var partServices = round2(amount * (base ? baseServices / base : 0));
      var partProducts = round2(amount - partServices);
      discountServices += partServices;
      discountProducts += partProducts;
      applied.push({
        label: label, percent: percent, amount: amount, kind: kind,
        onServices: partServices, onProducts: partProducts
      });
    }

    /* --- 1) Dia da semana --- */
    (state.weekdayRules || []).forEach(function (rule) {
      if (!rule.active) return;
      if (Number(rule.weekday) !== weekday) return;

      var baseS = 0, baseP = 0;
      if (rule.scope === 'servicos') {
        baseS = subtotalServices;
      } else if (rule.scope === 'servico') {
        baseS = (service && service.id === rule.serviceId) ? subtotalServices : 0;
      } else if (rule.scope === 'produtos') {
        baseP = subtotalProducts;
      } else { // 'total'
        baseS = subtotalServices; baseP = subtotalProducts;
      }
      push(rule.label || ('Promoção de ' + utils.WEEKDAYS[weekday]), Number(rule.percent) || 0, baseS, baseP, 'weekday');
    });

    /* --- 2) Combo --- */
    (state.comboRules || []).forEach(function (rule) {
      if (!rule.active) return;
      var minS = Number(rule.minServices) || 0;
      var minP = Number(rule.minProducts) || 0;
      if (servicesCount < minS || productsCount < minP) return;
      if (minS === 0 && minP === 0) return;
      push(rule.label || 'Combo', Number(rule.percent) || 0, subtotalServices, subtotalProducts, 'combo');
    });

    /* --- Teto: desconto nunca passa do subtotal de cada parte --- */
    discountServices = Math.min(round2(discountServices), subtotalServices);
    discountProducts = Math.min(round2(discountProducts), subtotalProducts);
    var discount = round2(discountServices + discountProducts);

    return {
      date: date,
      weekday: weekday,
      subtotalServices: round2(subtotalServices),
      subtotalProducts: round2(subtotalProducts),
      subtotal: round2(subtotal),
      discountServices: discountServices,
      discountProducts: discountProducts,
      discount: discount,
      totalServices: round2(subtotalServices - discountServices),
      totalProducts: round2(subtotalProducts - discountProducts),
      total: round2(subtotal - discount),
      applied: applied
    };
  }

  /**
   * Promoções ativas num dia, independente de contexto — usado para
   * marcar os dias promocionais no seletor de data e na home.
   */
  function weekdayPromosFor(iso) {
    var weekday = utils.weekdayOf(iso);
    return (store.get().weekdayRules || []).filter(function (r) {
      return r.active && Number(r.weekday) === weekday && Number(r.percent) > 0;
    });
  }

  function hasPromoOn(iso) { return weekdayPromosFor(iso).length > 0; }

  /** Lista legível de todas as promoções ativas (home / vitrine). */
  function activePromoList() {
    var state = store.get();
    var out = [];

    (state.weekdayRules || []).forEach(function (r) {
      if (!r.active || !(Number(r.percent) > 0)) return;
      var alvo = r.scope === 'produtos' ? 'no vestuário'
        : r.scope === 'total' ? 'no total'
          : r.scope === 'servico'
            ? ('em ' + ((store.serviceById(r.serviceId) || {}).name || 'serviço selecionado'))
            : 'nos serviços';
      out.push({
        id: r.id,
        label: r.label || ('Promoção de ' + utils.WEEKDAYS[Number(r.weekday)]),
        detail: 'Toda ' + utils.WEEKDAYS[Number(r.weekday)].toLowerCase() + ': ' + r.percent + '% de desconto ' + alvo + '.',
        percent: Number(r.percent)
      });
    });

    (state.comboRules || []).forEach(function (r) {
      if (!r.active || !(Number(r.percent) > 0)) return;
      var parts = [];
      if (Number(r.minServices) > 0) parts.push(r.minServices + ' serviço' + (r.minServices > 1 ? 's' : ''));
      if (Number(r.minProducts) > 0) parts.push(r.minProducts + ' peça' + (r.minProducts > 1 ? 's' : '') + ' de vestuário');
      out.push({
        id: r.id,
        label: r.label || 'Combo',
        detail: 'Agende ' + parts.join(' + ') + ' e ganhe ' + r.percent + '% no valor total.',
        percent: Number(r.percent)
      });
    });

    return out;
  }

  window.App.discounts = {
    compute: compute,
    weekdayPromosFor: weekdayPromosFor,
    hasPromoOn: hasPromoOn,
    activePromoList: activePromoList
  };
})();
