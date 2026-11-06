/* ============================================================
   my-bookings.js — "Meus Agendamentos" (cliente)
   Expõe: window.App.myBookings
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var esc = utils.escapeHtml;

  var tab = 'proximos'; // 'proximos' | 'historico'

  function setTab(next) { tab = next; window.App.app.render(); }

  function render() {
    var user = window.App.auth.current();
    if (!user) {
      return '' +
        '<div class="auth-wrap">' +
          '<div class="card center">' +
            '<h2>Entre para ver seus horários</h2>' +
            '<p>Seu histórico de agendamentos fica guardado na sua conta.</p>' +
            '<a class="btn btn-primary" href="#/entrar" data-nav>Entrar ou criar conta</a>' +
          '</div>' +
        '</div>';
    }

    var all = store.appointmentsByUser(user.id);

    var upcoming = all.filter(function (a) {
      return a.status !== 'cancelado' && !utils.isPast(a.date, a.time);
    }).sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return utils.timeToMin(a.time) - utils.timeToMin(b.time);
    });

    var history = all.filter(function (a) {
      return a.status === 'cancelado' || utils.isPast(a.date, a.time);
    });

    var list = tab === 'proximos' ? upcoming : history;

    var body = list.length
      ? list.map(function (a) { return renderCard(a, tab === 'proximos'); }).join('')
      : (tab === 'proximos'
        ? '<div class="empty"><strong>Nenhum horário marcado</strong>' +
            'Que tal garantir seu próximo corte?<div style="margin-top:14px">' +
            '<a class="btn btn-primary" href="#/agendamento" data-nav>Agendar agora</a></div></div>'
        : '<div class="empty"><strong>Sem histórico ainda</strong>Seus atendimentos concluídos aparecem aqui.</div>');

    var totalSpent = history
      .filter(function (a) { return a.status !== 'cancelado'; })
      .reduce(function (sum, a) { return sum + (Number(a.priceFinal) || 0); }, 0);

    return '' +
      '<div class="page-head">' +
        '<span class="eyebrow">Olá, ' + esc(user.name.split(' ')[0]) + '</span>' +
        '<h1>Meus agendamentos</h1>' +
        '<p>Acompanhe seus próximos horários e consulte o que já passou.</p>' +
      '</div>' +

      '<div class="kpis">' +
        '<div class="kpi"><span>Próximos</span><strong>' + upcoming.length + '</strong></div>' +
        '<div class="kpi"><span>Atendimentos</span><strong>' +
          history.filter(function (a) { return a.status !== 'cancelado'; }).length + '</strong></div>' +
        '<div class="kpi"><span>Já investido</span><strong>' + utils.brl(totalSpent) + '</strong></div>' +
      '</div>' +

      '<div class="tabs">' +
        '<button type="button" class="' + (tab === 'proximos' ? 'active' : '') + '" ' +
          'data-action="mb-tab" data-tab="proximos">Próximos (' + upcoming.length + ')</button>' +
        '<button type="button" class="' + (tab === 'historico' ? 'active' : '') + '" ' +
          'data-action="mb-tab" data-tab="historico">Histórico (' + history.length + ')</button>' +
      '</div>' +

      '<div>' + body + '</div>';
  }

  function renderCard(appointment, cancellable) {
    var end = utils.minToTime(utils.timeToMin(appointment.time) + (Number(appointment.duration) || 30));
    var cancelled = appointment.status === 'cancelado';

    var status = cancelled
      ? '<span class="badge badge-danger">Cancelado' +
          (appointment.cancelledBy === 'barbeiro' ? ' pelo barbeiro' : '') + '</span>'
      : utils.isPast(appointment.date, appointment.time)
        ? '<span class="badge">Concluído</span>'
        : '<span class="badge badge-ok">Confirmado</span>';

    var discountLine = (Number(appointment.discount) || 0) > 0
      ? '<span class="price-old">' + utils.brl(appointment.priceBase) + '</span>'
      : '';

    var rules = (appointment.appliedRules || []).map(function (r) {
      return '<span class="badge badge-gold">' + esc(r.label) + ' −' + r.percent + '%</span>';
    }).join(' ');

    return '' +
      '<div class="item-row"' + (cancelled ? ' style="opacity:.62"' : '') + '>' +
        '<div style="min-width:88px">' +
          '<div style="font-family:var(--display);font-size:1.5rem;letter-spacing:1px;color:var(--gold)">' +
            appointment.time + '</div>' +
          '<div class="muted">até ' + end + '</div>' +
        '</div>' +
        '<div class="ir-main">' +
          '<strong>' + esc(appointment.serviceName) + '</strong>' +
          '<div class="muted" style="text-transform:capitalize">' + esc(utils.formatDateLong(appointment.date)) + '</div>' +
          (rules ? '<div class="row" style="margin-top:7px">' + rules + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right">' +
          '<div>' + discountLine + '<span class="price" style="font-size:1.2rem">' +
            utils.brl(appointment.priceFinal) + '</span></div>' +
          '<div style="margin-top:7px">' + status + '</div>' +
        '</div>' +
        (cancellable && !cancelled
          ? '<div style="flex:0 0 auto">' +
              '<button class="btn btn-danger btn-sm" type="button" data-action="mb-cancel" ' +
                'data-id="' + esc(appointment.id) + '">Cancelar</button>' +
            '</div>'
          : '') +
      '</div>';
  }

  function cancel(id) {
    var app = window.App.app;
    var state = store.get();
    var appointment = state.appointments.filter(function (a) { return a.id === id; })[0];
    if (!appointment) return;

    app.confirmModal({
      title: 'Cancelar este horário?',
      body: '<p><b>' + esc(appointment.serviceName) + '</b><br>' +
        esc(utils.formatDateLong(appointment.date)) + ' às ' + appointment.time + '</p>' +
        '<p class="muted">O horário volta a ficar disponível para outros clientes. ' +
        'Se mudar de ideia, será preciso agendar novamente.</p>',
      confirmText: 'Sim, cancelar',
      cancelText: 'Manter horário',
      danger: true,
      onConfirm: function () {
        store.cancelAppointment(id, 'cliente');
        app.toast('Agendamento cancelado.', 'info');
        app.render();
      }
    });
  }

  window.App.myBookings = { render: render, setTab: setTab, cancel: cancel };
})();
