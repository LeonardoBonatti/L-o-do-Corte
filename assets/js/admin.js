/* ============================================================
   admin.js — Painel do Barbeiro
   Expõe: window.App.admin

   Abas: Agenda · Estoque · Promoções · Pedidos · Ajustes
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var esc = utils.escapeHtml;

  var tab = 'agenda';
  var agendaMode = 'dia';            // 'dia' | 'semana'
  var agendaDate = null;             // iso

  function setTab(next) { tab = next; window.App.app.render(); }
  function setAgendaMode(next) { agendaMode = next; window.App.app.render(); }
  function shiftAgenda(days) {
    agendaDate = utils.addDaysIso(agendaDate || utils.todayIso(), days);
    window.App.app.render();
  }
  function goToday() { agendaDate = utils.todayIso(); window.App.app.render(); }

  /* ---------------- Render raiz ---------------- */

  function render() {
    if (!window.App.auth.isAdmin()) {
      return '' +
        '<div class="auth-wrap"><div class="card center">' +
          '<h2>Acesso restrito</h2>' +
          '<p>Esta área é exclusiva do barbeiro. Entre com a conta de administrador.</p>' +
          '<a class="btn btn-primary" href="#/entrar" data-nav>Entrar</a>' +
        '</div></div>';
    }

    if (!agendaDate) agendaDate = utils.todayIso();

    var tabs = [
      ['agenda', 'Agenda'],
      ['estoque', 'Estoque'],
      ['promocoes', 'Promoções'],
      ['pedidos', 'Pedidos'],
      ['ajustes', 'Ajustes']
    ];

    var body =
      tab === 'estoque' ? renderStock()
        : tab === 'promocoes' ? renderPromos()
          : tab === 'pedidos' ? renderOrders()
            : tab === 'ajustes' ? renderSettings()
              : renderAgenda();

    return '' +
      '<div class="page-head">' +
        '<span class="eyebrow">Painel do barbeiro</span>' +
        '<h1>Central de controle</h1>' +
        '<p>Agenda, estoque de vestuário e as regras de promoção da barbearia.</p>' +
      '</div>' +

      renderKpis() +

      '<div class="tabs">' + tabs.map(function (t) {
        return '<button type="button" class="' + (tab === t[0] ? 'active' : '') + '" ' +
          'data-action="admin-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +

      body;
  }

  function renderKpis() {
    var state = store.get();
    var today = utils.todayIso();

    var todayList = store.appointmentsByDate(today).filter(function (a) { return a.status !== 'cancelado'; });
    var upcoming = store.activeAppointments().filter(function (a) { return !utils.isPast(a.date, a.time); });
    var revenueToday = todayList.reduce(function (sum, a) { return sum + (Number(a.priceFinal) || 0); }, 0);

    var lowStock = state.products.filter(function (p) {
      var total = (p.sizes || []).reduce(function (sum, s) { return sum + (Number(s.qty) || 0); }, 0);
      return total <= 3;
    }).length;

    return '' +
      '<div class="kpis">' +
        '<div class="kpi"><span>Hoje</span><strong>' + todayList.length + '</strong></div>' +
        '<div class="kpi"><span>Receita do dia</span><strong>' + utils.brl(revenueToday) + '</strong></div>' +
        '<div class="kpi"><span>Futuros</span><strong>' + upcoming.length + '</strong></div>' +
        '<div class="kpi"><span>Clientes</span><strong>' +
          state.users.filter(function (u) { return u.role !== 'admin'; }).length + '</strong></div>' +
        '<div class="kpi"><span>Estoque baixo</span><strong>' + lowStock + '</strong></div>' +
      '</div>';
  }

  /* ---------------- Aba: Agenda ---------------- */

  function renderAgenda() {
    var dates = agendaMode === 'semana'
      ? [0, 1, 2, 3, 4, 5, 6].map(function (i) { return utils.addDaysIso(agendaDate, i); })
      : [agendaDate];

    return '' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<div class="row">' +
            '<button class="btn btn-ghost btn-sm" type="button" data-action="agenda-shift" data-days="' +
              (agendaMode === 'semana' ? -7 : -1) + '">‹ Anterior</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-action="agenda-today">Hoje</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-action="agenda-shift" data-days="' +
              (agendaMode === 'semana' ? 7 : 1) + '">Próximo ›</button>' +
          '</div>' +
          '<div class="row">' +
            '<label class="muted" for="agenda-date">Ir para</label>' +
            '<input id="agenda-date" type="date" value="' + agendaDate + '" data-action="agenda-date" style="width:auto">' +
            '<div class="tabs" style="margin:0;padding:3px">' +
              '<button type="button" class="' + (agendaMode === 'dia' ? 'active' : '') + '" ' +
                'data-action="agenda-mode" data-mode="dia">Dia</button>' +
              '<button type="button" class="' + (agendaMode === 'semana' ? 'active' : '') + '" ' +
                'data-action="agenda-mode" data-mode="semana">Semana</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel-body">' + dates.map(renderAgendaDay).join('') + '</div>' +
      '</section>';
  }

  function renderAgendaDay(iso) {
    var state = store.get();
    var closed = (state.settings.closedWeekdays || []).indexOf(utils.weekdayOf(iso)) !== -1;
    var list = store.appointmentsByDate(iso);
    var active = list.filter(function (a) { return a.status !== 'cancelado'; });
    var revenue = active.reduce(function (sum, a) { return sum + (Number(a.priceFinal) || 0); }, 0);

    var rows = list.length
      ? list.map(function (a) {
        var client = store.userById(a.userId) || { name: 'Cliente removido', phone: '' };
        var end = utils.minToTime(utils.timeToMin(a.time) + (Number(a.duration) || 30));
        var cancelled = a.status === 'cancelado';
        var wa = utils.digitsOnly(client.phone);

        return '' +
          '<div class="agenda-slot' + (cancelled ? ' cancelled' : '') + '">' +
            '<div class="time">' + a.time + '</div>' +
            '<div class="who">' +
              '<strong>' + esc(client.name) + '</strong>' +
              '<div class="muted">' + esc(a.serviceName) + ' · até ' + end + ' · ' + utils.brl(a.priceFinal) +
                ((Number(a.discount) || 0) > 0 ? ' <span class="gold">(−' + utils.brl(a.discount) + ')</span>' : '') +
                (client.phone ? ' · ' + esc(utils.formatPhone(client.phone)) : '') +
              '</div>' +
            '</div>' +
            '<div class="row">' +
              (cancelled
                ? '<span class="badge badge-danger">Cancelado' +
                    (a.cancelledBy === 'cliente' ? ' pelo cliente' : '') + '</span>'
                : '<span class="badge badge-ok">Confirmado</span>' +
                  (wa
                    ? '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" ' +
                      'href="https://wa.me/' + (wa.length > 11 ? wa : '55' + wa) + '">WhatsApp</a>'
                    : '') +
                  '<button class="btn btn-ghost btn-sm" type="button" data-action="adm-reschedule" ' +
                    'data-id="' + esc(a.id) + '">Remarcar</button>' +
                  '<button class="btn btn-danger btn-sm" type="button" data-action="adm-cancel" ' +
                    'data-id="' + esc(a.id) + '">Cancelar</button>') +
            '</div>' +
          '</div>';
      }).join('')
      : '<div class="agenda-slot"><span class="muted">' +
          (closed ? 'Barbearia fechada neste dia.' : 'Nenhum agendamento.') + '</span></div>';

    return '' +
      '<div class="agenda-day">' +
        '<div class="agenda-day-head">' +
          '<strong>' + esc(utils.formatDateLong(iso)) + (iso === utils.todayIso() ? ' · hoje' : '') + '</strong>' +
          '<span class="muted">' + active.length + ' atendimento(s) · ' + utils.brl(revenue) + '</span>' +
        '</div>' +
        rows +
      '</div>';
  }

  function cancelAppointment(id) {
    var app = window.App.app;
    var state = store.get();
    var a = state.appointments.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var client = store.userById(a.userId) || { name: 'Cliente' };

    app.confirmModal({
      title: 'Cancelar agendamento?',
      body: '<p><b>' + esc(client.name) + '</b><br>' + esc(a.serviceName) + '<br>' +
        esc(utils.formatDateLong(a.date)) + ' às ' + a.time + '</p>' +
        '<p class="muted">O cliente verá o horário como cancelado em “Meus agendamentos”.</p>',
      confirmText: 'Cancelar horário',
      cancelText: 'Voltar',
      danger: true,
      onConfirm: function () {
        store.cancelAppointment(id, 'barbeiro');
        app.toast('Agendamento cancelado.', 'info');
        app.render();
      }
    });
  }

  /** Opções de horário disponíveis para remarcar (ignora o próprio agendamento). */
  function rescheduleOptions(appointmentId, iso) {
    var state = store.get();
    var a = state.appointments.filter(function (x) { return x.id === appointmentId; })[0];
    if (!a) return '';

    // ignora o próprio agendamento: na data atual o horário dele volta a contar como livre
    var slots = store.slotAvailability(iso, a.duration, a.id);
    var free = slots.filter(function (s) { return s.available; });

    if (!free.length) return '<option value="">Nenhum horário livre neste dia</option>';

    return free.map(function (s) {
      var selected = (iso === a.date && s.time === a.time) ? ' selected' : '';
      return '<option value="' + s.time + '"' + selected + '>' + s.time + '</option>';
    }).join('');
  }

  function reschedule(id) {
    var app = window.App.app;
    var state = store.get();
    var a = state.appointments.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var client = store.userById(a.userId) || { name: 'Cliente' };

    var body = '' +
      '<p class="muted">' + esc(client.name) + ' · ' + esc(a.serviceName) + ' (' + a.duration + ' min)</p>' +
      '<div class="field">' +
        '<label for="rs-date">Nova data</label>' +
        '<input id="rs-date" name="date" type="date" value="' + a.date + '" min="' + utils.todayIso() + '" required>' +
      '</div>' +
      '<div class="field">' +
        '<label for="rs-time">Novo horário</label>' +
        '<select id="rs-time" name="time" required>' + rescheduleOptions(id, a.date) + '</select>' +
      '</div>';

    app.formModal({
      title: 'Remarcar horário',
      body: body,
      confirmText: 'Salvar',
      onRender: function (modal) {
        var dateInput = modal.querySelector('#rs-date');
        var timeSelect = modal.querySelector('#rs-time');
        dateInput.addEventListener('change', function () {
          timeSelect.innerHTML = rescheduleOptions(id, dateInput.value || a.date);
        });
      },
      onConfirm: function (values) {
        if (!values.date || !values.time) return 'Escolha data e horário.';
        if (!store.isSlotFree(values.date, values.time, a.duration, a.id)) {
          return 'Esse horário não está livre para a duração do serviço.';
        }
        store.updateAppointment(id, { date: values.date, time: values.time, status: 'confirmado' });
        app.toast('Horário remarcado para ' + utils.formatDateShort(values.date) + ' às ' + values.time + '.', 'ok');
        app.render();
      }
    });
  }

  /* ---------------- Aba: Estoque ---------------- */

  function renderStock() {
    var state = store.get();

    var rows = state.products.map(function (p) {
      var sizes = p.sizes || [];
      var total = sizes.reduce(function (sum, s) { return sum + (Number(s.qty) || 0); }, 0);
      var sizeText = sizes.map(function (s) {
        var qty = Number(s.qty) || 0;
        return '<span class="badge' + (qty > 0 ? '' : ' badge-danger') + '">' +
          esc(s.size) + ' · ' + qty + '</span>';
      }).join(' ') || '<span class="muted">sem tamanhos</span>';

      return '' +
        '<tr>' +
          '<td>' +
            '<div class="row" style="gap:10px">' +
              '<div class="cart-thumb" style="width:44px;height:44px;flex:0 0 44px">' +
                (p.image ? '<img src="' + esc(p.image) + '" alt="" onerror="window.App.app.imgFallback(this)">' : '') +
              '</div>' +
              '<div><strong>' + esc(p.title) + '</strong>' +
                '<div class="muted">' + esc(p.desc || '—') + '</div></div>' +
            '</div>' +
          '</td>' +
          '<td class="nowrap">' + utils.brl(p.price) + '</td>' +
          '<td>' + sizeText + '</td>' +
          '<td class="nowrap"><strong>' + total + '</strong></td>' +
          '<td>' + (p.active !== false
            ? '<span class="badge badge-ok">Publicado</span>'
            : '<span class="badge">Oculto</span>') + '</td>' +
          '<td>' +
            '<div class="row" style="gap:5px">' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-stock" data-id="' + esc(p.id) + '">Estoque</button>' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-product-edit" data-id="' + esc(p.id) + '">Editar</button>' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-product-toggle" data-id="' + esc(p.id) + '">' +
                (p.active !== false ? 'Ocultar' : 'Publicar') + '</button>' +
              '<button class="btn btn-danger btn-icon" type="button" data-action="adm-product-del" data-id="' + esc(p.id) + '">Excluir</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');

    return '' +
      '<section class="panel">' +
        '<div class="panel-head">' +
          '<h3>Vestuário — ' + state.products.length + ' produto(s)</h3>' +
          '<button class="btn btn-primary btn-sm" type="button" data-action="adm-product-new">+ Novo produto</button>' +
        '</div>' +
        '<div class="panel-body">' +
          (state.products.length
            ? '<div class="table-wrap"><table>' +
                '<thead><tr><th>Produto</th><th>Valor</th><th>Tamanhos</th><th>Total</th><th>Status</th><th>Ações</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></div>'
            : '<div class="empty"><strong>Nenhum produto cadastrado</strong>Comece adicionando sua primeira peça.</div>') +
        '</div>' +
      '</section>';
  }

  /** "P:4, M:6" -> [{size:'P',qty:4},{size:'M',qty:6}] */
  function parseSizes(text) {
    var out = [];
    String(text || '').split(/[,\n;]+/).forEach(function (chunk) {
      var trimmed = chunk.trim();
      if (!trimmed) return;
      var parts = trimmed.split(':');
      var size = (parts[0] || '').trim();
      if (!size) return;
      var qty = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      out.push({ size: size, qty: isNaN(qty) || qty < 0 ? 0 : qty });
    });
    return out;
  }

  function sizesToText(sizes) {
    return (sizes || []).map(function (s) { return s.size + ':' + (Number(s.qty) || 0); }).join(', ');
  }

  function productForm(product) {
    product = product || {};
    return '' +
      '<div class="field">' +
        '<label for="pf-title">Título</label>' +
        '<input id="pf-title" name="title" type="text" value="' + esc(product.title || '') + '" ' +
          'placeholder="Camiseta Oversized Preta" required>' +
      '</div>' +
      '<div class="field">' +
        '<label for="pf-image">Foto (URL)</label>' +
        '<input id="pf-image" name="image" type="url" value="' + esc(product.image || '') + '" ' +
          'placeholder="https://…/foto.jpg">' +
        '<span class="hint">Deixe vazio para usar o espaço reservado da loja.</span>' +
      '</div>' +
      '<div class="inline-fields">' +
        '<div class="field">' +
          '<label for="pf-price">Valor (R$)</label>' +
          '<input id="pf-price" name="price" type="number" step="0.01" min="0" ' +
            'value="' + (product.price != null ? product.price : '') + '" placeholder="89.90" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="pf-active">Visibilidade</label>' +
          '<select id="pf-active" name="active">' +
            '<option value="1"' + (product.active !== false ? ' selected' : '') + '>Publicado</option>' +
            '<option value="0"' + (product.active === false ? ' selected' : '') + '>Oculto</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="field">' +
        '<label for="pf-desc">Descrição</label>' +
        '<input id="pf-desc" name="desc" type="text" value="' + esc(product.desc || '') + '" ' +
          'placeholder="Algodão pesado, caimento oversized.">' +
      '</div>' +
      '<div class="field">' +
        '<label for="pf-sizes">Tamanhos e quantidade</label>' +
        '<input id="pf-sizes" name="sizes" type="text" value="' + esc(sizesToText(product.sizes)) + '" ' +
          'placeholder="P:4, M:6, G:5, GG:2" required>' +
        '<span class="hint">Formato <code>TAMANHO:QUANTIDADE</code>, separados por vírgula.</span>' +
      '</div>';
  }

  function newProduct() {
    var app = window.App.app;
    app.formModal({
      title: 'Novo produto',
      body: productForm(null),
      confirmText: 'Cadastrar',
      onConfirm: function (values) {
        var error = validateProduct(values);
        if (error) return error;
        store.saveProduct({
          title: values.title.trim(),
          image: (values.image || '').trim(),
          price: parseFloat(values.price),
          desc: (values.desc || '').trim(),
          active: values.active !== '0',
          sizes: parseSizes(values.sizes)
        });
        app.toast('Produto cadastrado.', 'ok');
        app.render();
      }
    });
  }

  function editProduct(id) {
    var app = window.App.app;
    var product = store.productById(id);
    if (!product) return;

    app.formModal({
      title: 'Editar produto',
      body: productForm(product),
      confirmText: 'Salvar',
      onConfirm: function (values) {
        var error = validateProduct(values);
        if (error) return error;
        store.saveProduct({
          id: id,
          title: values.title.trim(),
          image: (values.image || '').trim(),
          price: parseFloat(values.price),
          desc: (values.desc || '').trim(),
          active: values.active !== '0',
          sizes: parseSizes(values.sizes)
        });
        app.toast('Produto atualizado.', 'ok');
        app.render();
      }
    });
  }

  function validateProduct(values) {
    if (!values.title || values.title.trim().length < 2) return 'Informe o título do produto.';
    var price = parseFloat(values.price);
    if (isNaN(price) || price < 0) return 'Informe um valor válido.';
    if (!parseSizes(values.sizes).length) return 'Informe ao menos um tamanho, no formato P:4.';
    return null;
  }

  function editStock(id) {
    var app = window.App.app;
    var product = store.productById(id);
    if (!product) return;

    var sizes = product.sizes || [];
    var fields = sizes.map(function (s, index) {
      return '<div class="field">' +
        '<label for="st-' + index + '">Tamanho ' + esc(s.size) + '</label>' +
        '<input id="st-' + index + '" name="qty_' + index + '" type="number" min="0" step="1" ' +
          'value="' + (Number(s.qty) || 0) + '">' +
      '</div>';
    }).join('');

    app.formModal({
      title: 'Estoque — ' + product.title,
      body: (fields
        ? '<div class="inline-fields">' + fields + '</div>'
        : '<p class="muted">Este produto não tem tamanhos cadastrados. Use “Editar” para incluí-los.</p>'),
      confirmText: 'Atualizar estoque',
      onConfirm: function (values) {
        var updated = sizes.map(function (s, index) {
          var qty = parseInt(values['qty_' + index], 10);
          return { size: s.size, qty: isNaN(qty) || qty < 0 ? 0 : qty };
        });
        store.saveProduct({ id: id, sizes: updated });
        app.toast('Estoque atualizado.', 'ok');
        app.render();
      }
    });
  }

  function toggleProduct(id) {
    var product = store.productById(id);
    if (!product) return;
    var wasActive = product.active !== false;
    store.saveProduct({ id: id, active: !wasActive });
    window.App.app.toast(wasActive ? 'Produto oculto da loja.' : 'Produto publicado.', 'info');
    window.App.app.render();
  }

  function deleteProduct(id) {
    var app = window.App.app;
    var product = store.productById(id);
    if (!product) return;

    app.confirmModal({
      title: 'Excluir produto?',
      body: '<p><b>' + esc(product.title) + '</b> será removido da loja e dos carrinhos. ' +
        'Essa ação não pode ser desfeita.</p>',
      confirmText: 'Excluir',
      danger: true,
      onConfirm: function () {
        store.removeProduct(id);
        app.toast('Produto excluído.', 'info');
        app.render();
      }
    });
  }

  /* ---------------- Aba: Promoções ---------------- */

  function renderPromos() {
    var state = store.get();

    var weekdayRows = state.weekdayRules.length
      ? state.weekdayRules.map(function (r) {
        var service = r.scope === 'servico' ? store.serviceById(r.serviceId) : null;
        var scopeText = r.scope === 'produtos' ? 'Vestuário'
          : r.scope === 'total' ? 'Total (serviço + vestuário)'
            : r.scope === 'servico' ? ('Serviço: ' + ((service && service.name) || '—'))
              : 'Todos os serviços';

        return '' +
          '<div class="item-row">' +
            '<div class="ir-main">' +
              '<strong>' + esc(r.label || 'Promoção') + '</strong>' +
              '<div class="muted">Toda ' + utils.WEEKDAYS[Number(r.weekday)].toLowerCase() +
                ' · ' + scopeText + '</div>' +
            '</div>' +
            '<span class="badge badge-gold">' + Number(r.percent) + '% off</span>' +
            (r.active ? '<span class="badge badge-ok">Ativa</span>' : '<span class="badge">Pausada</span>') +
            '<div class="row" style="gap:5px">' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-wd-edit" data-id="' + esc(r.id) + '">Editar</button>' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-wd-toggle" data-id="' + esc(r.id) + '">' +
                (r.active ? 'Pausar' : 'Ativar') + '</button>' +
              '<button class="btn btn-danger btn-icon" type="button" data-action="adm-wd-del" data-id="' + esc(r.id) + '">Excluir</button>' +
            '</div>' +
          '</div>';
      }).join('')
      : '<div class="empty"><strong>Nenhuma promoção por dia</strong>Ex.: toda quarta, 10% no corte.</div>';

    var comboRows = state.comboRules.length
      ? state.comboRules.map(function (r) {
        var parts = [];
        if (Number(r.minServices) > 0) parts.push(r.minServices + ' serviço(s)');
        if (Number(r.minProducts) > 0) parts.push(r.minProducts + ' peça(s)');
        return '' +
          '<div class="item-row">' +
            '<div class="ir-main">' +
              '<strong>' + esc(r.label || 'Combo') + '</strong>' +
              '<div class="muted">Dispara com ' + (parts.join(' + ') || '—') + ' · desconto no total</div>' +
            '</div>' +
            '<span class="badge badge-gold">' + Number(r.percent) + '% off</span>' +
            (r.active ? '<span class="badge badge-ok">Ativa</span>' : '<span class="badge">Pausada</span>') +
            '<div class="row" style="gap:5px">' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-cb-edit" data-id="' + esc(r.id) + '">Editar</button>' +
              '<button class="btn btn-ghost btn-icon" type="button" data-action="adm-cb-toggle" data-id="' + esc(r.id) + '">' +
                (r.active ? 'Pausar' : 'Ativar') + '</button>' +
              '<button class="btn btn-danger btn-icon" type="button" data-action="adm-cb-del" data-id="' + esc(r.id) + '">Excluir</button>' +
            '</div>' +
          '</div>';
      }).join('')
      : '<div class="empty"><strong>Nenhum combo</strong>Ex.: 1 corte + 1 blusa = 5% no total.</div>';

    return '' +
      '<section class="panel" style="margin-bottom:16px">' +
        '<div class="panel-head">' +
          '<h3>Desconto por dia da semana</h3>' +
          '<button class="btn btn-primary btn-sm" type="button" data-action="adm-wd-new">+ Nova regra</button>' +
        '</div>' +
        '<div class="panel-body">' + weekdayRows + '</div>' +
      '</section>' +

      '<section class="panel">' +
        '<div class="panel-head">' +
          '<h3>Desconto combo (cross-selling)</h3>' +
          '<button class="btn btn-primary btn-sm" type="button" data-action="adm-cb-new">+ Nova regra</button>' +
        '</div>' +
        '<div class="panel-body">' +
          comboRows +
          '<div class="promo-note" style="margin-top:14px"><span>ℹ</span><span>' +
            'As regras são aplicadas automaticamente no resumo do agendamento e no carrinho. ' +
            'Quando mais de uma regra vale, os descontos são somados sobre o valor original e ' +
            'limitados ao subtotal.</span></div>' +
        '</div>' +
      '</section>';
  }

  function weekdayForm(rule) {
    rule = rule || {};
    var state = store.get();
    var scope = rule.scope || 'servicos';

    return '' +
      '<div class="field">' +
        '<label for="wf-label">Nome da promoção</label>' +
        '<input id="wf-label" name="label" type="text" value="' + esc(rule.label || '') + '" ' +
          'placeholder="Quarta do Corte" required>' +
      '</div>' +
      '<div class="inline-fields">' +
        '<div class="field">' +
          '<label for="wf-weekday">Dia da semana</label>' +
          '<select id="wf-weekday" name="weekday">' +
            utils.WEEKDAYS.map(function (name, index) {
              var selected = Number(rule.weekday) === index ? ' selected' : '';
              return '<option value="' + index + '"' + selected + '>' + name + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="wf-percent">Desconto (%)</label>' +
          '<input id="wf-percent" name="percent" type="number" min="1" max="100" step="1" ' +
            'value="' + (rule.percent != null ? rule.percent : 10) + '" required>' +
        '</div>' +
      '</div>' +
      '<div class="field">' +
        '<label for="wf-scope">Aplicar em</label>' +
        '<select id="wf-scope" name="scope">' +
          '<option value="servicos"' + (scope === 'servicos' ? ' selected' : '') + '>Todos os serviços</option>' +
          '<option value="servico"' + (scope === 'servico' ? ' selected' : '') + '>Um serviço específico</option>' +
          '<option value="produtos"' + (scope === 'produtos' ? ' selected' : '') + '>Vestuário</option>' +
          '<option value="total"' + (scope === 'total' ? ' selected' : '') + '>Total (serviço + vestuário)</option>' +
        '</select>' +
      '</div>' +
      '<div class="field" id="wf-service-wrap"' + (scope === 'servico' ? '' : ' hidden') + '>' +
        '<label for="wf-service">Serviço</label>' +
        '<select id="wf-service" name="serviceId">' +
          state.services.map(function (svc) {
            return '<option value="' + esc(svc.id) + '"' +
              (rule.serviceId === svc.id ? ' selected' : '') + '>' + esc(svc.name) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<label class="check-line">' +
        '<input type="checkbox" name="active"' + (rule.active !== false ? ' checked' : '') + '> Regra ativa' +
      '</label>';
  }

  function weekdayModal(rule) {
    var app = window.App.app;
    app.formModal({
      title: rule ? 'Editar promoção' : 'Nova promoção por dia',
      body: weekdayForm(rule),
      confirmText: rule ? 'Salvar' : 'Criar regra',
      onRender: function (modal) {
        var scope = modal.querySelector('#wf-scope');
        var wrap = modal.querySelector('#wf-service-wrap');
        scope.addEventListener('change', function () {
          if (scope.value === 'servico') wrap.removeAttribute('hidden');
          else wrap.setAttribute('hidden', '');
        });
      },
      onConfirm: function (values) {
        var percent = parseInt(values.percent, 10);
        if (!values.label || values.label.trim().length < 2) return 'Dê um nome à promoção.';
        if (isNaN(percent) || percent < 1 || percent > 100) return 'O desconto deve ficar entre 1% e 100%.';

        store.saveWeekdayRule({
          id: rule ? rule.id : undefined,
          label: values.label.trim(),
          weekday: parseInt(values.weekday, 10) || 0,
          percent: percent,
          scope: values.scope,
          serviceId: values.scope === 'servico' ? values.serviceId : null,
          active: !!values.active
        });
        app.toast('Promoção salva.', 'ok');
        app.render();
      }
    });
  }

  function comboForm(rule) {
    rule = rule || {};
    return '' +
      '<div class="field">' +
        '<label for="cf-label">Nome da regra</label>' +
        '<input id="cf-label" name="label" type="text" value="' + esc(rule.label || '') + '" ' +
          'placeholder="Corte + Peça de Vestuário" required>' +
      '</div>' +
      '<div class="inline-fields">' +
        '<div class="field">' +
          '<label for="cf-min-s">Mín. serviços</label>' +
          '<input id="cf-min-s" name="minServices" type="number" min="0" step="1" ' +
            'value="' + (rule.minServices != null ? rule.minServices : 1) + '">' +
        '</div>' +
        '<div class="field">' +
          '<label for="cf-min-p">Mín. peças</label>' +
          '<input id="cf-min-p" name="minProducts" type="number" min="0" step="1" ' +
            'value="' + (rule.minProducts != null ? rule.minProducts : 1) + '">' +
        '</div>' +
        '<div class="field">' +
          '<label for="cf-percent">Desconto (%)</label>' +
          '<input id="cf-percent" name="percent" type="number" min="1" max="100" step="1" ' +
            'value="' + (rule.percent != null ? rule.percent : 5) + '">' +
        '</div>' +
      '</div>' +
      '<span class="hint">O desconto incide sobre o total (serviço + vestuário) e é rateado entre as duas partes.</span>' +
      '<label class="check-line" style="margin-top:12px">' +
        '<input type="checkbox" name="active"' + (rule.active !== false ? ' checked' : '') + '> Regra ativa' +
      '</label>';
  }

  function comboModal(rule) {
    var app = window.App.app;
    app.formModal({
      title: rule ? 'Editar combo' : 'Novo combo',
      body: comboForm(rule),
      confirmText: rule ? 'Salvar' : 'Criar regra',
      onConfirm: function (values) {
        var percent = parseInt(values.percent, 10);
        var minS = parseInt(values.minServices, 10) || 0;
        var minP = parseInt(values.minProducts, 10) || 0;

        if (!values.label || values.label.trim().length < 2) return 'Dê um nome à regra.';
        if (isNaN(percent) || percent < 1 || percent > 100) return 'O desconto deve ficar entre 1% e 100%.';
        if (minS <= 0 && minP <= 0) return 'Defina ao menos um mínimo de serviços ou de peças.';

        store.saveComboRule({
          id: rule ? rule.id : undefined,
          label: values.label.trim(),
          minServices: minS,
          minProducts: minP,
          percent: percent,
          active: !!values.active
        });
        app.toast('Combo salvo.', 'ok');
        app.render();
      }
    });
  }

  function ruleAction(kind, action, id) {
    var app = window.App.app;
    var state = store.get();
    var list = kind === 'wd' ? state.weekdayRules : state.comboRules;
    var rule = list.filter(function (r) { return r.id === id; })[0];
    if (!rule) return;

    if (action === 'edit') {
      if (kind === 'wd') weekdayModal(rule); else comboModal(rule);
      return;
    }

    if (action === 'toggle') {
      var wasActive = !!rule.active;
      var patch = { id: id, active: !wasActive };
      if (kind === 'wd') store.saveWeekdayRule(patch); else store.saveComboRule(patch);
      app.toast(wasActive ? 'Regra pausada.' : 'Regra ativada.', 'info');
      app.render();
      return;
    }

    if (action === 'del') {
      app.confirmModal({
        title: 'Excluir regra?',
        body: '<p><b>' + esc(rule.label || 'Regra') + '</b> deixará de ser aplicada.</p>',
        confirmText: 'Excluir',
        danger: true,
        onConfirm: function () {
          if (kind === 'wd') store.removeWeekdayRule(id); else store.removeComboRule(id);
          app.toast('Regra excluída.', 'info');
          app.render();
        }
      });
    }
  }

  /* ---------------- Aba: Pedidos ---------------- */

  function renderOrders() {
    var state = store.get();
    var orders = state.orders.slice().reverse();

    if (!orders.length) {
      return '<section class="panel"><div class="panel-head"><h3>Pedidos de vestuário</h3></div>' +
        '<div class="panel-body"><div class="empty"><strong>Nenhum pedido enviado</strong>' +
        'Quando um cliente finalizar o carrinho pelo WhatsApp, o resumo aparece aqui.</div></div></section>';
    }

    var rows = orders.map(function (order) {
      var when = new Date(order.createdAt);
      var items = (order.items || []).map(function (i) {
        return i.qty + 'x ' + i.title + ' (' + i.size + ')';
      }).join(', ');

      return '<tr>' +
        '<td class="nowrap">' + when.toLocaleDateString('pt-BR') + '<div class="muted">' +
          when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</div></td>' +
        '<td><strong>' + esc(order.userName || '—') + '</strong></td>' +
        '<td>' + esc(items) + '</td>' +
        '<td class="nowrap">' + utils.brl(order.subtotal) + '</td>' +
        '<td class="nowrap">' + ((Number(order.discount) || 0) > 0
          ? '<span class="gold">− ' + utils.brl(order.discount) + '</span>' : '—') + '</td>' +
        '<td class="nowrap"><strong>' + utils.brl(order.total) + '</strong></td>' +
      '</tr>';
    }).join('');

    return '' +
      '<section class="panel">' +
        '<div class="panel-head"><h3>Pedidos de vestuário — ' + orders.length + '</h3>' +
          '<span class="muted">Negociação concluída no WhatsApp</span></div>' +
        '<div class="panel-body"><div class="table-wrap"><table>' +
          '<thead><tr><th>Quando</th><th>Cliente</th><th>Itens</th><th>Subtotal</th><th>Desconto</th><th>Total</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div></div>' +
      '</section>';
  }

  /* ---------------- Aba: Ajustes ---------------- */

  function renderSettings() {
    var state = store.get();
    var s = state.settings;
    var closed = s.closedWeekdays || [];

    return '' +
      '<section class="panel" style="margin-bottom:16px">' +
        '<div class="panel-head"><h3>Dados da barbearia</h3></div>' +
        '<div class="panel-body">' +
          '<form data-form="settings">' +
            '<div class="inline-fields">' +
              '<div class="field">' +
                '<label for="cfg-name">Nome</label>' +
                '<input id="cfg-name" name="shopName" type="text" value="' + esc(s.shopName) + '" required>' +
              '</div>' +
              '<div class="field">' +
                '<label for="cfg-wa">WhatsApp (com DDI)</label>' +
                '<input id="cfg-wa" name="whatsapp" type="tel" inputmode="numeric" ' +
                  'value="' + esc(s.whatsapp) + '" placeholder="5511999999999" required>' +
              '</div>' +
            '</div>' +
            '<div class="field">' +
              '<label for="cfg-address">Endereço</label>' +
              '<input id="cfg-address" name="address" type="text" value="' + esc(s.address || '') + '">' +
            '</div>' +
            '<div class="inline-fields">' +
              '<div class="field">' +
                '<label for="cfg-open">Abre às</label>' +
                '<input id="cfg-open" name="openTime" type="time" step="1800" value="' + esc(s.openTime) + '" required>' +
              '</div>' +
              '<div class="field">' +
                '<label for="cfg-close">Fecha às</label>' +
                '<input id="cfg-close" name="closeTime" type="time" step="1800" value="' + esc(s.closeTime) + '" required>' +
              '</div>' +
            '</div>' +
            '<div class="field">' +
              '<label>Dias fechados</label>' +
              '<div class="row">' + utils.WEEKDAYS.map(function (name, index) {
                return '<label class="check-line"><input type="checkbox" name="closed_' + index + '"' +
                  (closed.indexOf(index) !== -1 ? ' checked' : '') + '> ' + utils.WEEKDAYS_SHORT[index] + '</label>';
              }).join('') + '</div>' +
            '</div>' +
            '<button class="btn btn-primary" type="submit">Salvar ajustes</button>' +
          '</form>' +
        '</div>' +
      '</section>' +

      '<section class="panel">' +
        '<div class="panel-head"><h3>Serviços</h3>' +
          '<span class="muted">Tabela de preços e durações</span></div>' +
        '<div class="panel-body">' +
          '<div class="table-wrap"><table>' +
            '<thead><tr><th>Serviço</th><th>Valor</th><th>Duração</th><th>Slots</th></tr></thead><tbody>' +
            state.services.map(function (svc) {
              return '<tr><td><strong>' + esc(svc.name) + '</strong>' +
                '<div class="muted">' + esc(svc.desc || '') + '</div></td>' +
                '<td class="nowrap">' + utils.brl(svc.price) + '</td>' +
                '<td class="nowrap">' + svc.duration + ' min</td>' +
                '<td class="nowrap">' + utils.slotsNeeded(svc.duration) + '</td></tr>';
            }).join('') +
            '</tbody></table></div>' +
          '<div class="promo-note" style="margin-top:14px"><span>⚠</span><span>' +
            'Todos os dados ficam no <b>localStorage</b> deste navegador. Limpar os dados do site apaga ' +
            'agendamentos, produtos e regras.</span></div>' +
          '<button class="btn btn-danger" type="button" data-action="adm-reset" style="margin-top:6px">' +
            'Restaurar dados de demonstração</button>' +
        '</div>' +
      '</section>';
  }

  function saveSettingsForm(form) {
    var app = window.App.app;
    var values = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      values[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });

    var closed = [];
    utils.WEEKDAYS.forEach(function (_, index) {
      if (values['closed_' + index]) closed.push(index);
    });

    var phone = utils.digitsOnly(values.whatsapp);
    if (phone.length < 12) {
      app.toast('Informe o WhatsApp com DDI e DDD, ex.: 5511999999999.', 'err');
      return;
    }
    if (utils.timeToMin(values.closeTime) - utils.timeToMin(values.openTime) < 30) {
      app.toast('O horário de fechamento precisa ser ao menos 30 min após a abertura.', 'err');
      return;
    }

    store.saveSettings({
      shopName: values.shopName.trim(),
      whatsapp: phone,
      address: (values.address || '').trim(),
      openTime: values.openTime,
      closeTime: values.closeTime,
      closedWeekdays: closed
    });

    app.toast('Ajustes salvos.', 'ok');
    app.render();
  }

  function resetData() {
    var app = window.App.app;
    app.confirmModal({
      title: 'Restaurar dados de demonstração?',
      body: '<p>Todos os agendamentos, clientes, produtos, pedidos e regras criados serão apagados ' +
        'e substituídos pelos dados iniciais.</p><p class="muted">Isso não pode ser desfeito.</p>',
      confirmText: 'Restaurar',
      danger: true,
      onConfirm: function () {
        store.reset();
        store.clearCart();
        app.toast('Dados restaurados. Faça login novamente.', 'info');
        window.location.hash = '#/entrar';
        app.render();
      }
    });
  }

  window.App.admin = {
    render: render, setTab: setTab,
    setAgendaMode: setAgendaMode, shiftAgenda: shiftAgenda, goToday: goToday,
    setAgendaDate: function (iso) { agendaDate = iso; window.App.app.render(); },
    cancelAppointment: cancelAppointment, reschedule: reschedule,
    newProduct: newProduct, editProduct: editProduct, editStock: editStock,
    toggleProduct: toggleProduct, deleteProduct: deleteProduct,
    weekdayModal: weekdayModal, comboModal: comboModal, ruleAction: ruleAction,
    saveSettingsForm: saveSettingsForm, resetData: resetData
  };
})();
