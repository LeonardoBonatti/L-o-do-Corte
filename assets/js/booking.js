/* ============================================================
   booking.js — módulo de agendamento (cliente)
   Expõe: window.App.booking

   Regras implementadas
   --------------------
   · Expediente 10:00–19:00, slots de 30 min (10:00 … 18:30).
   · Serviço de 45 min ocupa 2 slots: o escolhido e o seguinte.
     Por isso 18:30 fica indisponível para Corte + Barba (passaria das 19h).
   · Slot ocupado (ou em conflito com um serviço longo) não é selecionável.
   · Horários no passado ficam bloqueados; domingo fechado (configurável).
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var discounts = window.App.discounts;
  var esc = utils.escapeHtml;

  var DAYS_AHEAD = 21;

  var sel = { serviceId: null, date: null, time: null };

  function reset() { sel = { serviceId: null, date: null, time: null }; }

  function ensureDefaults() {
    var state = store.get();
    if (!sel.serviceId && state.services.length) sel.serviceId = state.services[0].id;

    if (!sel.date) {
      // primeiro dia aberto a partir de hoje
      var closed = state.settings.closedWeekdays || [];
      var iso = utils.todayIso();
      for (var i = 0; i < DAYS_AHEAD; i++) {
        var candidate = utils.addDaysIso(iso, i);
        if (closed.indexOf(utils.weekdayOf(candidate)) === -1) { sel.date = candidate; break; }
      }
      if (!sel.date) sel.date = iso;
    }
  }

  function service() { return store.serviceById(sel.serviceId); }

  /* ---------------- Render ---------------- */

  function render() {
    ensureDefaults();
    var state = store.get();
    var svc = service();

    return '' +
      '<div class="page-head">' +
        '<span class="eyebrow">Agendamento</span>' +
        '<h1>Reserve seu horário</h1>' +
        '<p>Escolha o serviço, o dia e o horário. A confirmação é imediata e você pode cancelar quando precisar.</p>' +
      '</div>' +

      '<div class="split">' +
        '<div class="stack">' +
          renderServices(state) +
          renderDates() +
          renderSlots(svc) +
        '</div>' +
        '<aside class="sticky-side">' + renderSummary(svc) + '</aside>' +
      '</div>';
  }

  function renderServices(state) {
    var cards = state.services.map(function (svc) {
      var selected = svc.id === sel.serviceId;
      var blocks = utils.slotsNeeded(svc.duration);
      return '' +
        '<button class="service-card' + (selected ? ' selected' : '') + '" type="button" ' +
          'data-action="pick-service" data-id="' + esc(svc.id) + '" aria-pressed="' + selected + '">' +
          '<div class="sc-top">' +
            '<h3>' + esc(svc.name) + '</h3>' +
            (selected ? '<span class="badge badge-gold">Selecionado</span>' : '') +
          '</div>' +
          '<p class="muted" style="margin:0">' + esc(svc.desc || '') + '</p>' +
          '<div class="row-between" style="margin-top:4px">' +
            '<span class="price">' + utils.brl(svc.price) + '</span>' +
            '<span class="badge">' + svc.duration + ' min' + (blocks > 1 ? ' · 2 slots' : '') + '</span>' +
          '</div>' +
        '</button>';
    }).join('');

    return '' +
      '<section class="panel">' +
        '<div class="panel-head"><h3>1. Serviço</h3></div>' +
        '<div class="panel-body"><div class="grid grid-3">' + cards + '</div></div>' +
      '</section>';
  }

  function renderDates() {
    var state = store.get();
    var closed = state.settings.closedWeekdays || [];
    var today = utils.todayIso();
    var pills = '';

    for (var i = 0; i < DAYS_AHEAD; i++) {
      var iso = utils.addDaysIso(today, i);
      var date = utils.isoToDate(iso);
      var isClosed = closed.indexOf(date.getDay()) !== -1;
      var selected = iso === sel.date;
      var promo = discounts.hasPromoOn(iso);

      pills += '' +
        '<button class="day-pill' + (selected ? ' selected' : '') + (promo ? ' has-promo' : '') + '" type="button" ' +
          'data-action="pick-date" data-date="' + iso + '"' + (isClosed ? ' disabled' : '') +
          ' aria-pressed="' + selected + '" title="' + esc(utils.formatDateLong(iso)) + (promo ? ' — dia promocional' : '') + '">' +
          '<span>' + utils.WEEKDAYS_SHORT[date.getDay()] + '</span>' +
          '<strong>' + date.getDate() + '</strong>' +
          '<small>' + (isClosed ? 'fechado' : (i === 0 ? 'hoje' : i === 1 ? 'amanhã' : utils.formatDateShort(iso).split(', ')[1].split(' ')[1])) + '</small>' +
        '</button>';
    }

    return '' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<h3>2. Dia</h3>' +
          '<span class="muted">Próximos ' + DAYS_AHEAD + ' dias · <span class="gold">•</span> dia promocional</span>' +
        '</div>' +
        '<div class="panel-body"><div class="weekday-strip">' + pills + '</div></div>' +
      '</section>';
  }

  function renderSlots(svc) {
    if (!svc) return '';
    var slots = store.slotAvailability(sel.date, svc.duration);
    var freeCount = slots.filter(function (s) { return s.available; }).length;
    var needs2 = utils.slotsNeeded(svc.duration) > 1;

    var body;
    if (!freeCount) {
      body = '<div class="empty"><strong>Nenhum horário livre neste dia</strong>' +
        'Escolha outra data acima ou outro serviço.</div>';
    } else {
      body =
        (needs2
          ? '<div class="promo-note" style="background:rgba(255,255,255,.04);border-color:var(--line);color:var(--text-2)">' +
              '<span>⏱</span><span><b>' + esc(svc.name) + '</b> leva ' + svc.duration +
              ' min e reserva também o slot seguinte — por isso alguns horários aparecem bloqueados.</span>' +
            '</div>'
          : '') +
        '<div class="slot-grid">' + slots.map(function (slot) {
          var selected = slot.time === sel.time;
          return '<button class="slot' + (selected ? ' selected' : '') + '" type="button" ' +
            'data-action="pick-slot" data-time="' + slot.time + '"' +
            (slot.available ? '' : ' disabled') +
            ' title="' + esc(slot.available ? 'Disponível' : slot.reason) + '" aria-pressed="' + selected + '">' +
            slot.time + '</button>';
        }).join('') + '</div>';
    }

    return '' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<h3>3. Horário</h3>' +
          '<span class="muted">' + esc(utils.formatDateLong(sel.date)) + ' · ' + freeCount + ' livre(s)</span>' +
        '</div>' +
        '<div class="panel-body">' + body + '</div>' +
      '</section>';
  }

  function renderSummary(svc) {
    var cart = store.cartDetailed();
    var calc = discounts.compute({ service: svc, date: sel.date, cart: cart });
    var ready = !!(svc && sel.date && sel.time);
    var logged = window.App.auth.isLogged();

    var promos = calc.applied.map(function (rule) {
      return '<div class="summary-line discount">' +
        '<span>' + esc(rule.label) + ' (' + rule.percent + '%)</span>' +
        '<span>− ' + utils.brl(rule.amount) + '</span></div>';
    }).join('');

    var cartNote = cart.length
      ? '<div class="promo-note"><span>🛍</span><span>Você tem <b>' + cart.length +
          ' item(ns)</b> no carrinho. Eles entram no cálculo das promoções combo e são negociados pelo WhatsApp na aba Vestuário.</span></div>'
      : '';

    var hint = ready
      ? ''
      : '<p class="muted" style="margin:10px 0 0">Selecione serviço, dia e horário para confirmar.</p>';

    return '' +
      '<div class="panel">' +
        '<div class="panel-head"><h3>Resumo</h3>' +
          (calc.discount > 0 ? '<span class="badge badge-ok">Desconto aplicado</span>' : '') +
        '</div>' +
        '<div class="panel-body">' +
          (svc
            ? '<div class="summary-line"><span>' + esc(svc.name) + '</span><span>' + utils.brl(svc.price) + '</span></div>'
            : '') +
          '<div class="summary-line"><span>Data</span><span>' +
            (sel.date ? esc(utils.formatDateShort(sel.date)) : '—') + '</span></div>' +
          '<div class="summary-line"><span>Horário</span><span>' +
            (sel.time ? sel.time + ' – ' + utils.minToTime(utils.timeToMin(sel.time) + (svc ? svc.duration : 0)) : '—') +
          '</span></div>' +

          (cart.length
            ? '<div class="summary-line"><span>Vestuário (' + cart.length + ')</span><span>' + utils.brl(calc.subtotalProducts) + '</span></div>'
            : '') +

          promos +

          '<div class="summary-line total"><span>' + (cart.length ? 'Total geral' : 'Total do serviço') + '</span>' +
            '<strong>' + utils.brl(cart.length ? calc.total : calc.totalServices) + '</strong></div>' +

          (cart.length && svc
            ? '<p class="muted" style="margin:6px 0 0">No dia, pelo serviço: <b class="gold">' +
                utils.brl(calc.totalServices) + '</b>' +
                (calc.discountServices > 0 ? ' (já com ' + utils.brl(calc.discountServices) + ' de desconto)' : '') + '.</p>'
            : '') +

          '<div style="margin-top:16px">' +
            '<button class="btn btn-primary btn-block" type="button" data-action="confirm-booking"' +
              (ready ? '' : ' disabled') + '>' +
              (logged ? 'Confirmar agendamento' : 'Entrar e confirmar') +
            '</button>' +
          '</div>' +
          hint +
          cartNote +
        '</div>' +
      '</div>';
  }

  /* ---------------- Ações ---------------- */

  function pickService(id) {
    sel.serviceId = id;
    // o horário escolhido pode não caber na nova duração
    if (sel.time && !store.isSlotFree(sel.date, sel.time, (store.serviceById(id) || {}).duration)) {
      sel.time = null;
    }
    window.App.app.render();
  }

  function pickDate(iso) {
    sel.date = iso;
    sel.time = null;
    window.App.app.render();
  }

  function pickSlot(time) {
    sel.time = time;
    window.App.app.render();
  }

  function confirm() {
    var app = window.App.app;
    var svc = service();
    if (!svc || !sel.date || !sel.time) {
      app.toast('Escolha serviço, dia e horário.', 'err');
      return;
    }

    if (!window.App.auth.requireLogin('#/agendamento')) return;

    // revalida: alguém pode ter reservado enquanto a tela estava aberta
    if (!store.isSlotFree(sel.date, sel.time, svc.duration)) {
      app.toast('Esse horário acabou de ser ocupado. Escolha outro.', 'err');
      sel.time = null;
      app.render();
      return;
    }

    var cart = store.cartDetailed();
    var calc = discounts.compute({ service: svc, date: sel.date, cart: cart });
    var endTime = utils.minToTime(utils.timeToMin(sel.time) + svc.duration);

    var lines = '' +
      '<p><b>' + esc(svc.name) + '</b><br>' +
      esc(utils.formatDateLong(sel.date)) + '<br>' +
      sel.time + ' às ' + endTime + ' (' + svc.duration + ' min)</p>' +
      '<div class="summary-line"><span>Valor do serviço</span><span>' + utils.brl(svc.price) + '</span></div>' +
      (calc.discountServices > 0
        ? '<div class="summary-line discount"><span>Descontos</span><span>− ' + utils.brl(calc.discountServices) + '</span></div>'
        : '') +
      '<div class="summary-line total"><span>A pagar no dia</span><strong>' + utils.brl(calc.totalServices) + '</strong></div>';

    app.confirmModal({
      title: 'Confirmar agendamento?',
      body: lines,
      confirmText: 'Confirmar',
      onConfirm: function () {
        var appointment = store.createAppointment({
          userId: window.App.auth.current().id,
          serviceId: svc.id,
          serviceName: svc.name,
          duration: svc.duration,
          date: sel.date,
          time: sel.time,
          priceBase: svc.price,
          discount: calc.discountServices,
          priceFinal: calc.totalServices,
          appliedRules: calc.applied.filter(function (r) { return r.onServices > 0; })
            .map(function (r) { return { label: r.label, percent: r.percent, amount: r.onServices }; })
        });

        reset();
        app.toast('Horário confirmado para ' + utils.formatDateShort(appointment.date) + ' às ' + appointment.time + '.', 'ok');
        window.location.hash = '#/meus-agendamentos';
        app.render();
      }
    });
  }

  window.App.booking = {
    render: render, reset: reset,
    pickService: pickService, pickDate: pickDate, pickSlot: pickSlot, confirm: confirm
  };
})();
