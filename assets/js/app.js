/* ============================================================
   app.js — roteador por hash, navegação, home, modais e toasts
   Expõe: window.App.app
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var discounts = window.App.discounts;
  var auth = window.App.auth;
  var esc = utils.escapeHtml;

  var ROUTES = {
    '/home': { title: 'Home', render: renderHome, nav: true },
    '/agendamento': { title: 'Agendamento', render: function () { return window.App.booking.render(); }, nav: true },
    '/vestuario': { title: 'Vestuário', render: function () { return window.App.shop.render(); }, nav: true },
    '/meus-agendamentos': { title: 'Meus Agendamentos', render: function () { return window.App.myBookings.render(); }, nav: true },
    '/painel': { title: 'Painel do Barbeiro', render: function () { return window.App.admin.render(); }, nav: 'admin' },
    '/entrar': { title: 'Entrar', render: function (params) { return auth.render(params); }, nav: false }
  };

  var app = {
    pendingRedirect: null
  };

  /* ---------------- Roteamento ---------------- */

  function parseHash() {
    var raw = String(window.location.hash || '').replace(/^#/, '');
    if (!raw || raw === '/') raw = '/home';

    var parts = raw.split('?');
    var path = parts[0];
    var params = {};

    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        var kv = pair.split('=');
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    return { path: path, params: params };
  }

  function render() {
    var route = parseHash();
    var entry = ROUTES[route.path];

    if (!entry) {
      document.getElementById('view').innerHTML =
        '<div class="empty" style="margin-top:40px"><strong>Página não encontrada</strong>' +
        '<div style="margin-top:14px"><a class="btn btn-primary" href="#/home" data-nav>Voltar para a home</a></div></div>';
      renderChrome();
      return;
    }

    // "Meus agendamentos" e o painel exigem sessão
    if (route.path === '/meus-agendamentos' && !auth.isLogged()) {
      app.pendingRedirect = '#/meus-agendamentos';
    }

    document.title = 'Leo do Corte — ' + entry.title;
    document.getElementById('view').innerHTML = entry.render(route.params);
    renderChrome();
    closeMobileNav();
  }

  /** Barra superior: menu, carrinho e usuário. */
  function renderChrome() {
    var route = parseHash();
    var isAdmin = auth.isAdmin();
    var user = auth.current();

    var items = [
      ['/home', 'Home'],
      ['/agendamento', 'Agendamento'],
      ['/vestuario', 'Vestuário'],
      ['/meus-agendamentos', 'Meus Agendamentos']
    ];
    if (isAdmin) items.push(['/painel', 'Painel do Barbeiro']);

    var links = items.map(function (item) {
      var active = route.path === item[0] ? ' active' : '';
      var admin = item[0] === '/painel' ? ' admin-link' : '';
      return '<a class="' + active.trim() + admin + '" href="#' + item[0] + '" data-nav>' + item[1] + '</a>';
    }).join('');

    document.getElementById('nav-desktop').innerHTML = links;
    document.getElementById('nav-mobile').innerHTML = links;

    var count = store.cartCount();
    var badge = document.getElementById('cart-count');
    badge.textContent = count;
    if (count > 0) badge.removeAttribute('hidden'); else badge.setAttribute('hidden', '');

    document.getElementById('user-slot').innerHTML = user
      ? '<button class="user-chip" type="button" data-action="user-menu">' +
          '<span class="avatar">' + esc(utils.initials(user.name)) + '</span>' +
          '<span class="u-name">' + esc(user.name.split(' ')[0]) + '</span>' +
          (user.role === 'admin' ? '<span class="role-tag">admin</span>' : '') +
        '</button>'
      : '<a class="btn btn-primary btn-sm" href="#/entrar" data-nav>Entrar</a>';
  }

  /* ---------------- Home ---------------- */

  function renderHome() {
    var state = store.get();
    var promos = discounts.activePromoList();
    var products = state.products.filter(function (p) { return p.active !== false; }).slice(0, 3);

    var servicesHtml = state.services.map(function (svc) {
      return '' +
        '<div class="card card-hover">' +
          '<div class="row-between" style="align-items:flex-start">' +
            '<h3>' + esc(svc.name) + '</h3>' +
            '<span class="badge">' + svc.duration + ' min</span>' +
          '</div>' +
          '<p class="muted">' + esc(svc.desc || '') + '</p>' +
          '<div class="row-between" style="margin-top:14px">' +
            '<span class="price">' + utils.brl(svc.price) + '</span>' +
            '<a class="btn btn-ghost btn-sm" href="#/agendamento" data-nav>Agendar</a>' +
          '</div>' +
        '</div>';
    }).join('');

    var promosHtml = promos.length
      ? '<section class="section">' +
          '<div class="section-head"><span class="eyebrow">Vantagens</span><h2>Promoções ativas</h2></div>' +
          '<div class="grid grid-2">' + promos.map(function (promo) {
            return '<div class="card card-hover">' +
              '<div class="row-between"><h3>' + esc(promo.label) + '</h3>' +
              '<span class="badge badge-gold">' + promo.percent + '% off</span></div>' +
              '<p class="muted" style="margin:0">' + esc(promo.detail) + '</p></div>';
          }).join('') + '</div>' +
        '</section>'
      : '';

    var productsHtml = products.length
      ? '<section class="section">' +
          '<div class="row-between section-head">' +
            '<div><span class="eyebrow">Vestuário</span><h2>Direto da loja</h2></div>' +
            '<a class="btn btn-ghost btn-sm" href="#/vestuario" data-nav>Ver tudo</a>' +
          '</div>' +
          '<div class="grid grid-3">' + products.map(function (p) {
            return '<a class="product-card" href="#/vestuario" data-nav>' +
              '<div class="product-media"><span class="ph">LEO</span>' +
                (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) +
                  '" loading="lazy" onerror="window.App.app.imgFallback(this)">' : '') +
              '</div>' +
              '<div class="product-info"><h3>' + esc(p.title) + '</h3>' +
                '<div class="product-foot"><span class="price">' + utils.brl(p.price) + '</span>' +
                '<span class="badge">Ver na loja</span></div>' +
              '</div></a>';
          }).join('') + '</div>' +
        '</section>'
      : '';

    var steps = [
      ['1', 'Crie sua conta', 'Cadastro rápido com nome, e-mail e WhatsApp.'],
      ['2', 'Escolha serviço e horário', 'Slots de 30 min entre 10h e 19h, sem sobreposição.'],
      ['3', 'Apareça no horário', 'Você pode cancelar ou conferir tudo em “Meus Agendamentos”.']
    ];

    return '' +
      '<section class="hero">' +
        '<div class="hero-inner">' +
          '<span class="eyebrow">Barbearia · desde sempre no estilo</span>' +
          '<h1>Corte afiado,<br><em>presença de dono</em></h1>' +
          '<p>Agende em segundos, escolha seu horário e garanta o atendimento sem fila. ' +
            'Ainda leve para casa as peças da nossa loja.</p>' +
          '<div class="hero-actions">' +
            '<a class="btn btn-primary" href="#/agendamento" data-nav>Agendar meu horário</a>' +
            '<a class="btn btn-ghost" href="#/vestuario" data-nav>Ver o vestuário</a>' +
          '</div>' +
          '<div class="hero-stats">' +
            '<div><strong>10h–19h</strong><span>Seg a Sáb</span></div>' +
            '<div><strong>30 min</strong><span>Por atendimento</span></div>' +
            '<div><strong>' + utils.brl(state.services[0] ? state.services[0].price : 0) + '</strong><span>A partir de</span></div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="section-head"><span class="eyebrow">Serviços</span><h2>O que fazemos</h2></div>' +
        '<div class="grid grid-3">' + servicesHtml + '</div>' +
      '</section>' +

      promosHtml +

      '<section class="section">' +
        '<div class="section-head"><span class="eyebrow">Como funciona</span><h2>Três passos</h2></div>' +
        '<div class="grid grid-3">' + steps.map(function (step) {
          return '<div class="card">' +
            '<span class="price" style="font-size:1.9rem">' + step[0] + '</span>' +
            '<h3 style="margin-top:6px">' + step[1] + '</h3>' +
            '<p class="muted" style="margin:0">' + step[2] + '</p></div>';
        }).join('') + '</div>' +
      '</section>' +

      productsHtml +

      '<section class="section">' +
        '<div class="card">' +
          '<div class="row-between">' +
            '<div>' +
              '<span class="eyebrow">Onde estamos</span>' +
              '<h3 style="font-size:1.15rem">' + esc(state.settings.address || 'Barbearia Leo do Corte') + '</h3>' +
              '<p class="muted" style="margin:6px 0 0">Atendimento das ' + esc(state.settings.openTime) +
                ' às ' + esc(state.settings.closeTime) + ', de segunda a sábado.</p>' +
            '</div>' +
            '<a class="btn btn-wa" target="_blank" rel="noopener" ' +
              'href="https://wa.me/' + utils.digitsOnly(state.settings.whatsapp) + '">Falar no WhatsApp</a>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* ---------------- Toasts ---------------- */

  function toast(message, kind) {
    var host = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    el.textContent = message;
    host.appendChild(el);
    window.setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, 3600);
  }

  /* ---------------- Modais ---------------- */

  var activeModal = null;

  function openModal(config) {
    activeModal = config;
    var backdrop = document.getElementById('modal-backdrop');
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');
    var actionsEl = document.getElementById('modal-actions');

    titleEl.textContent = config.title || '';
    bodyEl.innerHTML = (config.isForm
      ? '<form id="modal-form" novalidate><div id="modal-form-error"></div>' + config.body + '</form>'
      : config.body) || '';

    actionsEl.innerHTML = '' +
      '<button class="btn btn-ghost" type="button" data-action="modal-close">' +
        esc(config.cancelText || 'Cancelar') + '</button>' +
      '<button class="btn ' + (config.danger ? 'btn-danger' : 'btn-primary') + '" type="button" ' +
        'data-action="modal-confirm">' + esc(config.confirmText || 'Confirmar') + '</button>';

    backdrop.removeAttribute('hidden');

    var modal = backdrop.querySelector('.modal');
    if (config.onRender) config.onRender(modal);

    var form = document.getElementById('modal-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitModal();
      });
    }

    var focusable = modal.querySelector('input,select,textarea,button[data-action="modal-confirm"]');
    if (focusable) focusable.focus();
  }

  function closeModal() {
    activeModal = null;
    document.getElementById('modal-backdrop').setAttribute('hidden', '');
    document.getElementById('modal-body').innerHTML = '';
  }

  function modalError(message) {
    var box = document.getElementById('modal-form-error');
    if (box) box.innerHTML = '<div class="form-error">' + esc(message) + '</div>';
    else toast(message, 'err');
  }

  function submitModal() {
    if (!activeModal) return;
    var config = activeModal;

    if (!config.isForm) {
      closeModal();
      if (config.onConfirm) config.onConfirm();
      return;
    }

    var form = document.getElementById('modal-form');
    var values = {};
    if (form) {
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        values[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      });
    }

    var error = config.onConfirm ? config.onConfirm(values) : null;
    if (typeof error === 'string' && error) { modalError(error); return; }
    closeModal();
  }

  function confirmModal(config) {
    openModal(Object.assign({}, config, { isForm: false }));
  }

  function formModal(config) {
    openModal(Object.assign({}, config, { isForm: true }));
  }

  /* ---------------- Menu móvel / usuário ---------------- */

  function toggleMobileNav() {
    var nav = document.getElementById('nav-mobile');
    var burger = document.getElementById('burger');
    var open = nav.hasAttribute('hidden');
    if (open) { nav.removeAttribute('hidden'); burger.setAttribute('aria-expanded', 'true'); }
    else { nav.setAttribute('hidden', ''); burger.setAttribute('aria-expanded', 'false'); }
  }

  function closeMobileNav() {
    document.getElementById('nav-mobile').setAttribute('hidden', '');
    document.getElementById('burger').setAttribute('aria-expanded', 'false');
  }

  function userMenu() {
    var user = auth.current();
    if (!user) return;

    confirmModal({
      title: user.name,
      body: '<p class="muted">' + esc(user.email) +
        (user.phone ? '<br>' + esc(utils.formatPhone(user.phone)) : '') +
        '<br>Perfil: <b class="gold">' + (user.role === 'admin' ? 'Barbeiro (admin)' : 'Cliente') + '</b></p>',
      confirmText: 'Sair da conta',
      cancelText: 'Fechar',
      danger: true,
      onConfirm: function () {
        auth.logout();
        window.App.booking.reset();
        toast('Você saiu da conta.', 'info');
        window.location.hash = '#/home';
        render();
      }
    });
  }

  function imgFallback(img) {
    img.style.display = 'none';
  }

  /* ---------------- Delegação de eventos ---------------- */

  var ACTIONS = {
    /* navegação / chrome */
    'modal-close': closeModal,
    'modal-confirm': submitModal,
    'user-menu': userMenu,

    /* autenticação */
    'auth-mode': function (el) { auth.setMode(el.getAttribute('data-mode')); },

    /* agendamento */
    'pick-service': function (el) { window.App.booking.pickService(el.getAttribute('data-id')); },
    'pick-date': function (el) { window.App.booking.pickDate(el.getAttribute('data-date')); },
    'pick-slot': function (el) { window.App.booking.pickSlot(el.getAttribute('data-time')); },
    'confirm-booking': function () { window.App.booking.confirm(); },

    /* vestuário */
    'pick-size': function (el) { window.App.shop.pickSize(el.getAttribute('data-id'), el.getAttribute('data-size')); },
    'add-cart': function (el) { window.App.shop.addToCart(el.getAttribute('data-id')); },
    'cart-inc': function (el) { window.App.shop.changeQty(el.getAttribute('data-pid'), el.getAttribute('data-size'), 1); },
    'cart-dec': function (el) { window.App.shop.changeQty(el.getAttribute('data-pid'), el.getAttribute('data-size'), -1); },
    'cart-del': function (el) { window.App.shop.removeItem(el.getAttribute('data-pid'), el.getAttribute('data-size')); },
    'cart-clear': function () { window.App.shop.clear(); },
    'checkout-wa': function () { window.App.shop.checkout(); },

    /* meus agendamentos */
    'mb-tab': function (el) { window.App.myBookings.setTab(el.getAttribute('data-tab')); },
    'mb-cancel': function (el) { window.App.myBookings.cancel(el.getAttribute('data-id')); },

    /* painel */
    'admin-tab': function (el) { window.App.admin.setTab(el.getAttribute('data-tab')); },
    'agenda-mode': function (el) { window.App.admin.setAgendaMode(el.getAttribute('data-mode')); },
    'agenda-shift': function (el) { window.App.admin.shiftAgenda(parseInt(el.getAttribute('data-days'), 10)); },
    'agenda-today': function () { window.App.admin.goToday(); },
    'adm-cancel': function (el) { window.App.admin.cancelAppointment(el.getAttribute('data-id')); },
    'adm-reschedule': function (el) { window.App.admin.reschedule(el.getAttribute('data-id')); },
    'adm-product-new': function () { window.App.admin.newProduct(); },
    'adm-product-edit': function (el) { window.App.admin.editProduct(el.getAttribute('data-id')); },
    'adm-product-toggle': function (el) { window.App.admin.toggleProduct(el.getAttribute('data-id')); },
    'adm-product-del': function (el) { window.App.admin.deleteProduct(el.getAttribute('data-id')); },
    'adm-stock': function (el) { window.App.admin.editStock(el.getAttribute('data-id')); },
    'adm-wd-new': function () { window.App.admin.weekdayModal(null); },
    'adm-wd-edit': function (el) { window.App.admin.ruleAction('wd', 'edit', el.getAttribute('data-id')); },
    'adm-wd-toggle': function (el) { window.App.admin.ruleAction('wd', 'toggle', el.getAttribute('data-id')); },
    'adm-wd-del': function (el) { window.App.admin.ruleAction('wd', 'del', el.getAttribute('data-id')); },
    'adm-cb-new': function () { window.App.admin.comboModal(null); },
    'adm-cb-edit': function (el) { window.App.admin.ruleAction('cb', 'edit', el.getAttribute('data-id')); },
    'adm-cb-toggle': function (el) { window.App.admin.ruleAction('cb', 'toggle', el.getAttribute('data-id')); },
    'adm-cb-del': function (el) { window.App.admin.ruleAction('cb', 'del', el.getAttribute('data-id')); },
    'adm-reset': function () { window.App.admin.resetData(); }
  };

  function bind() {
    document.addEventListener('click', function (event) {
      var burger = event.target.closest && event.target.closest('#burger');
      if (burger) { toggleMobileNav(); return; }

      var actionEl = event.target.closest && event.target.closest('[data-action]');
      if (actionEl && !actionEl.disabled) {
        var handler = ACTIONS[actionEl.getAttribute('data-action')];
        if (handler) { event.preventDefault(); handler(actionEl); return; }
      }

      var navLink = event.target.closest && event.target.closest('a[data-nav]');
      if (navLink) { closeMobileNav(); return; }

      // clique fora do modal fecha
      if (event.target.id === 'modal-backdrop') closeModal();
    });

    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (form.id === 'modal-form') return; // tratado no openModal

      var kind = form.getAttribute && form.getAttribute('data-form');
      if (!kind) return;
      event.preventDefault();

      if (kind === 'login' || kind === 'register') auth.handleSubmit(form);
      else if (kind === 'settings') window.App.admin.saveSettingsForm(form);
    });

    document.addEventListener('change', function (event) {
      var el = event.target;
      if (el.getAttribute && el.getAttribute('data-action') === 'agenda-date' && el.value) {
        window.App.admin.setAgendaDate(el.value);
      }
    });

    document.addEventListener('input', function (event) {
      var el = event.target;
      if (el.getAttribute && el.getAttribute('data-mask') === 'phone') {
        var caretAtEnd = el.selectionStart === el.value.length;
        el.value = utils.formatPhone(el.value);
        if (caretAtEnd) el.setSelectionRange(el.value.length, el.value.length);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !document.getElementById('modal-backdrop').hasAttribute('hidden')) {
        closeModal();
      }
    });

    window.addEventListener('hashchange', function () {
      closeModal();
      render();
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    // outra aba alterou os dados
    window.addEventListener('storage', function (event) {
      if (event.key && event.key.indexOf(store.KEY) === 0) { store.load(); render(); }
    });
  }

  /* ---------------- Boot ---------------- */

  function boot() {
    document.getElementById('year').textContent = new Date().getFullYear();
    if (!window.location.hash) window.location.hash = '#/home';
    bind();
    render();
  }

  Object.assign(app, {
    render: render, renderChrome: renderChrome,
    toast: toast, confirmModal: confirmModal, formModal: formModal, closeModal: closeModal,
    imgFallback: imgFallback, parseHash: parseHash
  });

  window.App.app = app;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
