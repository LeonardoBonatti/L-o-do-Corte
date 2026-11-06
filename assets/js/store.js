/* ============================================================
   store.js — cliente da API, cache em memória e utilitários
   Expõe: window.App.{store, utils}

   O estado vem de uma única chamada a GET /api/bootstrap e fica em memória.
   É isso que permite manter as leituras síncronas espalhadas pela app
   (store.get(), serviceById(), slotAvailability()…) sem reescrever todo o
   código de renderização: só as escritas são assíncronas.

   O carrinho continua no localStorage de propósito — é rascunho por
   navegador, não dado compartilhado.
   ============================================================ */

window.App = window.App || {};

(function () {
  'use strict';

  var KEY = 'leodocorte.v1';     // usado só pelas chaves do carrinho
  var SLOT = 30;                 // minutos por slot
  var OPEN = 10 * 60;            // 10:00
  var CLOSE = 19 * 60;           // 19:00 (fechamento — nenhum atendimento passa daqui)

  /* ---------------- Utils ---------------- */

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function brl(cents) {
    return (Number(cents) || 0).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL', minimumFractionDigits: 2
    });
  }

  function timeToMin(hhmm) {
    var parts = String(hhmm || '').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function minToTime(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /** Date -> 'YYYY-MM-DD' (sempre em horário local, nunca UTC) */
  function dateToIso(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  /** 'YYYY-MM-DD' -> Date local à meia-noite */
  function isoToDate(iso) {
    var p = String(iso || '').split('-');
    return new Date(parseInt(p[0], 10), (parseInt(p[1], 10) || 1) - 1, parseInt(p[2], 10) || 1);
  }

  function todayIso() { return dateToIso(new Date()); }

  function addDaysIso(iso, days) {
    var d = isoToDate(iso);
    d.setDate(d.getDate() + days);
    return dateToIso(d);
  }

  var WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function weekdayOf(iso) { return isoToDate(iso).getDay(); }

  /** '2026-10-29' -> 'qui, 29 out' */
  function formatDateShort(iso) {
    var d = isoToDate(iso);
    return WEEKDAYS_SHORT[d.getDay()].toLowerCase() + ', ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
  }

  /** '2026-10-29' -> 'Quinta-feira, 29 de outubro de 2026' */
  function formatDateLong(iso) {
    var d = isoToDate(iso);
    var full = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
      'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return WEEKDAYS[d.getDay()] + ', ' + d.getDate() + ' de ' + full[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function nowMinutes() {
    var n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }

  /** true se data+hora já passou */
  function isPast(iso, time) {
    var t = todayIso();
    if (iso < t) return true;
    if (iso > t) return false;
    return timeToMin(time) <= nowMinutes();
  }

  function digitsOnly(value) { return String(value || '').replace(/\D/g, ''); }

  function formatPhone(value) {
    var d = digitsOnly(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '?').toUpperCase() + (parts.length > 1 ? (parts[parts.length - 1][0] || '').toUpperCase() : '');
  }

  /** nº de slots de 30 min que um serviço ocupa (45 min -> 2 slots) */
  function slotsNeeded(durationMin) {
    return Math.max(1, Math.ceil((Number(durationMin) || SLOT) / SLOT));
  }

  /** Todos os horários de início possíveis: 10:00 ... 18:30 */
  function allSlots() {
    var out = [];
    for (var m = OPEN; m <= CLOSE - SLOT; m += SLOT) out.push(minToTime(m));
    return out;
  }

  /* ---------------- Cliente da API ---------------- */

  /** Erro que carrega a mensagem do servidor, para o toast poder mostrar. */
  function ApiError(message, status) {
    this.name = 'ApiError';
    this.message = message || 'Não conseguimos falar com o servidor.';
    this.status = status || 0;
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  function api(method, path, body) {
    var init = { method: method, credentials: 'same-origin' };
    if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    }

    return window.fetch('/api' + path, init).then(function (response) {
      return response.text().then(function (text) {
        var payload = {};
        try { payload = text ? JSON.parse(text) : {}; } catch (e) { payload = {}; }
        if (!response.ok) throw new ApiError(payload.error, response.status);
        return payload;
      });
    }, function () {
      throw new ApiError('Sem conexão com o servidor. Tente de novo.', 0);
    });
  }

  /* ---------------- Estado ---------------- */

  function emptyState() {
    return {
      me: null,
      sessionUserId: null,
      settings: {
        shopName: 'Léo do Corte', whatsapp: '', address: '',
        openTime: '10:00', closeTime: '19:00', slotMinutes: SLOT, closedWeekdays: [0]
      },
      users: [], services: [], products: [],
      appointments: [], orders: [], weekdayRules: [], comboRules: []
    };
  }

  var state = emptyState();
  var hydrated = false;

  function applyBootstrap(data) {
    state = {
      me: data.me || null,
      /* O cart usa sessionUserId; a sessão real é o cookie assinado. */
      sessionUserId: data.me ? data.me.id : null,
      settings: data.settings || emptyState().settings,
      /* Cliente não recebe a lista de usuários: só ele mesmo. */
      users: (data.users && data.users.length) ? data.users : (data.me ? [data.me] : []),
      services: data.services || [],
      products: data.products || [],
      appointments: data.appointments || [],
      orders: data.orders || [],
      weekdayRules: data.weekdayRules || [],
      comboRules: data.comboRules || []
    };
    hydrated = true;
    return state;
  }

  /** Busca tudo do servidor. O boot espera por isso antes de renderizar. */
  function hydrate() {
    return api('GET', '/bootstrap').then(applyBootstrap);
  }

  function get() { return state; }
  function isHydrated() { return hydrated; }

  /* Sem efeito: a fonte de verdade é o banco. Mantido porque algumas telas
     chamavam save() depois de mexer no estado. */
  function save() {}

  /* ---------------- Carrinho (por usuário, no navegador) ---------------- */

  function cartKey() {
    return KEY + '.cart.' + (state.sessionUserId || 'guest');
  }

  function getCart() {
    try {
      var raw = window.localStorage.getItem(cartKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function setCart(items) {
    try { window.localStorage.setItem(cartKey(), JSON.stringify(items || [])); } catch (e) {}
  }

  function clearCart() { setCart([]); }

  /** Move o carrinho montado antes do login para a conta que acabou de entrar. */
  function absorbGuestCart() {
    var guestKey = KEY + '.cart.guest';
    var guest;
    try {
      var raw = window.localStorage.getItem(guestKey);
      guest = raw ? JSON.parse(raw) : [];
    } catch (e) { guest = []; }
    if (!Array.isArray(guest) || !guest.length) return;
    if (cartKey() === guestKey) return;   // ninguém logado

    var mine = getCart();
    guest.forEach(function (item) {
      var existing = mine.filter(function (i) {
        return i.productId === item.productId && i.size === item.size;
      })[0];
      if (existing) existing.qty = (Number(existing.qty) || 1) + (Number(item.qty) || 1);
      else mine.push(item);
    });
    setCart(mine);
    try { window.localStorage.removeItem(guestKey); } catch (e) {}
  }

  /** Define a quantidade de um item; 0 ou menos remove. */
  function setCartQty(productId, size, qty) {
    var cart = getCart();
    var index = -1;
    cart.forEach(function (item, i) {
      if (item.productId === productId && item.size === size) index = i;
    });
    if (index === -1) {
      if (qty > 0) cart.push({ productId: productId, size: size, qty: qty });
    } else if (qty > 0) {
      cart[index].qty = qty;
    } else {
      cart.splice(index, 1);
    }
    setCart(cart);
  }

  /** Carrinho enriquecido com os dados atuais do produto; descarta itens removidos. */
  function cartDetailed() {
    var s = get();
    return getCart().map(function (item) {
      var product = s.products.filter(function (p) { return p.id === item.productId; })[0];
      if (!product) return null;
      var sizeRow = (product.sizes || []).filter(function (x) { return x.size === item.size; })[0];
      var stock = sizeRow ? Number(sizeRow.qty) || 0 : 0;
      return {
        productId: product.id,
        title: product.title,
        image: product.image,
        size: item.size,
        qty: Math.max(1, Number(item.qty) || 1),
        unitPrice: Number(product.price) || 0,
        stock: stock,
        subtotal: (Math.max(1, Number(item.qty) || 1)) * (Number(product.price) || 0)
      };
    }).filter(Boolean);
  }

  function cartCount() {
    return cartDetailed().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  /* ---------------- Consultas ---------------- */

  /** Vem do servidor no bootstrap, não de uma busca na lista de usuários. */
  function currentUser() { return state.me || null; }

  function userById(id) {
    return get().users.filter(function (u) { return u.id === id; })[0] || null;
  }

  function serviceById(id) {
    return get().services.filter(function (x) { return x.id === id; })[0] || null;
  }

  function productById(id) {
    return get().products.filter(function (x) { return x.id === id; })[0] || null;
  }

  function activeAppointments() {
    return get().appointments.filter(function (a) { return a.status !== 'cancelado'; });
  }

  function appointmentsByDate(iso) {
    return get().appointments
      .filter(function (a) { return a.date === iso; })
      .sort(function (a, b) { return timeToMin(a.time) - timeToMin(b.time); });
  }

  function appointmentsByUser(userId) {
    return get().appointments
      .filter(function (a) { return a.userId === userId; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return timeToMin(b.time) - timeToMin(a.time);
      });
  }

  /** Minutos de início já ocupados numa data (considera serviços de 45 min). */
  function occupiedStarts(iso, ignoreAppointmentId) {
    var taken = {};
    appointmentsByDate(iso).forEach(function (a) {
      if (a.status === 'cancelado') return;
      if (ignoreAppointmentId && a.id === ignoreAppointmentId) return;
      var start = timeToMin(a.time);
      var need = slotsNeeded(a.duration);
      for (var i = 0; i < need; i++) taken[start + i * SLOT] = a.id;
    });
    return taken;
  }

  /**
   * Disponibilidade de cada slot para um serviço numa data.
   * Retorna [{ time, available, reason }]
   *
   * Isto é para EXIBIR. A decisão final é do servidor, em api/_slots.js mais
   * a chave primária de appointment_slots — aqui pode estar desatualizado se
   * alguém reservou há segundos.
   */
  function slotAvailability(iso, durationMin, ignoreAppointmentId) {
    var s = get();
    var need = slotsNeeded(durationMin);
    var taken = occupiedStarts(iso, ignoreAppointmentId);
    var closed = (s.settings.closedWeekdays || []).indexOf(weekdayOf(iso)) !== -1;
    var openMin = timeToMin(s.settings.openTime || '10:00');
    var closeMin = timeToMin(s.settings.closeTime || '19:00');
    var today = todayIso();

    var out = [];
    for (var start = openMin; start <= closeMin - SLOT; start += SLOT) {
      var reason = '';

      if (closed) {
        reason = 'Fechado';
      } else if (start + need * SLOT > closeMin) {
        // 45 min às 18:30 passaria do fechamento
        reason = 'Sem tempo até o fechamento';
      } else if (iso < today || (iso === today && start <= nowMinutes())) {
        reason = 'Horário já passou';
      } else {
        for (var i = 0; i < need; i++) {
          if (taken[start + i * SLOT]) {
            reason = need > 1 ? 'Conflita com outro horário' : 'Já reservado';
            break;
          }
        }
      }

      out.push({ time: minToTime(start), available: !reason, reason: reason });
    }
    return out;
  }

  function isSlotFree(iso, time, durationMin, ignoreAppointmentId) {
    var found = slotAvailability(iso, durationMin, ignoreAppointmentId)
      .filter(function (s) { return s.time === time; })[0];
    return !!(found && found.available);
  }

  /* ---------------- Mutações (assíncronas) ---------------- */

  function replaceInList(list, item) {
    var index = -1;
    list.forEach(function (row, i) { if (row.id === item.id) index = i; });
    if (index === -1) list.push(item); else list[index] = item;
    return item;
  }

  function createAppointment(data) {
    return api('POST', '/appointments', {
      serviceId: data.serviceId,
      date: data.date,
      time: data.time,
      discount: data.discount || 0,
      appliedRules: data.appliedRules || []
    }).then(function (payload) {
      return replaceInList(state.appointments, payload.appointment);
    });
  }

  function updateAppointment(id, patch) {
    return api('PATCH', '/appointments/' + encodeURIComponent(id), {
      date: patch.date,
      time: patch.time
    }).then(function (payload) {
      return replaceInList(state.appointments, payload.appointment);
    });
  }

  function cancelAppointment(id) {
    return api('DELETE', '/appointments/' + encodeURIComponent(id)).then(function (payload) {
      return replaceInList(state.appointments, payload.appointment);
    });
  }

  function saveProduct(data) {
    return api('POST', '/products', data).then(function (payload) {
      return replaceInList(state.products, payload.product);
    });
  }

  function removeProduct(id) {
    return api('DELETE', '/products/' + encodeURIComponent(id)).then(function () {
      state.products = state.products.filter(function (p) { return p.id !== id; });
      setCart(getCart().filter(function (i) { return i.productId !== id; }));
    });
  }

  function saveWeekdayRule(data) {
    return api('POST', '/rules', Object.assign({ kind: 'weekday' }, data)).then(function (payload) {
      return replaceInList(state.weekdayRules, payload.rule);
    });
  }

  function removeWeekdayRule(id) {
    return api('DELETE', '/rules/' + encodeURIComponent(id) + '?kind=weekday').then(function () {
      state.weekdayRules = state.weekdayRules.filter(function (r) { return r.id !== id; });
    });
  }

  function saveComboRule(data) {
    return api('POST', '/rules', Object.assign({ kind: 'combo' }, data)).then(function (payload) {
      return replaceInList(state.comboRules, payload.rule);
    });
  }

  function removeComboRule(id) {
    return api('DELETE', '/rules/' + encodeURIComponent(id) + '?kind=combo').then(function () {
      state.comboRules = state.comboRules.filter(function (r) { return r.id !== id; });
    });
  }

  function saveSettings(patch) {
    var merged = Object.assign({}, state.settings, patch);
    return api('PUT', '/settings', merged).then(function (payload) {
      state.settings = payload.settings;
      return state.settings;
    });
  }

  function recordOrder(order) {
    return api('POST', '/orders', {
      items: (order.items || []).map(function (i) {
        return { productId: i.productId, size: i.size, qty: i.qty };
      }),
      discount: order.discount || 0
    }).then(function (payload) {
      state.orders.unshift(payload.order);
      return payload.order;
    });
  }

  /* ---------------- Sessão ---------------- */

  function login(email, password) {
    return api('POST', '/auth/login', { email: email, password: password })
      .then(function () { return hydrate(); });
  }

  function register(data) {
    return api('POST', '/auth/register', data).then(function () { return hydrate(); });
  }

  function logout() {
    return api('POST', '/auth/logout').then(function () { return hydrate(); });
  }

  /* ---------------- Export ---------------- */

  window.App.utils = {
    uid: uid, escapeHtml: escapeHtml, brl: brl,
    timeToMin: timeToMin, minToTime: minToTime,
    dateToIso: dateToIso, isoToDate: isoToDate, todayIso: todayIso, addDaysIso: addDaysIso,
    weekdayOf: weekdayOf, formatDateShort: formatDateShort, formatDateLong: formatDateLong,
    nowMinutes: nowMinutes, isPast: isPast,
    digitsOnly: digitsOnly, formatPhone: formatPhone, initials: initials,
    slotsNeeded: slotsNeeded, allSlots: allSlots,
    WEEKDAYS: WEEKDAYS, WEEKDAYS_SHORT: WEEKDAYS_SHORT,
    SLOT: SLOT
  };

  window.App.store = {
    KEY: KEY, ApiError: ApiError,
    api: api, hydrate: hydrate, isHydrated: isHydrated, get: get, save: save,
    login: login, register: register, logout: logout,
    getCart: getCart, setCart: setCart, clearCart: clearCart,
    absorbGuestCart: absorbGuestCart, setCartQty: setCartQty,
    cartDetailed: cartDetailed, cartCount: cartCount,
    currentUser: currentUser, userById: userById,
    serviceById: serviceById, productById: productById,
    activeAppointments: activeAppointments,
    appointmentsByDate: appointmentsByDate, appointmentsByUser: appointmentsByUser,
    occupiedStarts: occupiedStarts, slotAvailability: slotAvailability, isSlotFree: isSlotFree,
    createAppointment: createAppointment, updateAppointment: updateAppointment,
    cancelAppointment: cancelAppointment,
    saveProduct: saveProduct, removeProduct: removeProduct,
    saveWeekdayRule: saveWeekdayRule, removeWeekdayRule: removeWeekdayRule,
    saveComboRule: saveComboRule, removeComboRule: removeComboRule,
    saveSettings: saveSettings, recordOrder: recordOrder
  };
})();
