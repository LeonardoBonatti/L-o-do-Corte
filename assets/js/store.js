/* ============================================================
   store.js — persistência (localStorage), seed e utilitários
   Expõe: window.App.{store, utils}
   ============================================================ */

window.App = window.App || {};

(function () {
  'use strict';

  var KEY = 'leodocorte.v1';
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

  /* ---------------- Seed ---------------- */

  function seed() {
    return {
      version: 1,
      sessionUserId: null,
      settings: {
        shopName: 'Leo do Corte',
        whatsapp: '5511999999999',
        address: 'Rua das Tesouras, 120 — Centro',
        openTime: '10:00',
        closeTime: '19:00',
        slotMinutes: SLOT,
        closedWeekdays: [0]           // domingo fechado
      },
      users: [
        {
          id: 'u_admin', name: 'Leo', email: 'leo@leodocorte.com',
          phone: '11999999999', password: 'leo123', role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      services: [
        { id: 'svc_corte', name: 'Corte', price: 40, duration: 30, desc: 'Máquina, tesoura e finalização.' },
        { id: 'svc_corte_sobr', name: 'Corte + Sobrancelha', price: 45, duration: 30, desc: 'Corte completo com design de sobrancelha.' },
        { id: 'svc_corte_barba', name: 'Corte + Barba', price: 60, duration: 45, desc: 'Corte, barba na navalha e toalha quente.' }
      ],
      products: [
        {
          id: 'p_1', title: 'Camiseta Oversized Preta', price: 89.9, active: true,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=70',
          desc: 'Algodão pesado, caimento oversized.',
          sizes: [{ size: 'P', qty: 4 }, { size: 'M', qty: 6 }, { size: 'G', qty: 5 }, { size: 'GG', qty: 2 }]
        },
        {
          id: 'p_2', title: 'Camisa Social Chumbo', price: 139.9, active: true,
          image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=70',
          desc: 'Tecido acetinado, manga longa.',
          sizes: [{ size: 'M', qty: 3 }, { size: 'G', qty: 3 }, { size: 'GG', qty: 1 }]
        },
        {
          id: 'p_3', title: 'Short Sarja Masculino', price: 99.9, active: true,
          image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=70',
          desc: 'Sarja com elastano, bolso traseiro.',
          sizes: [{ size: '38', qty: 2 }, { size: '40', qty: 4 }, { size: '42', qty: 4 }, { size: '44', qty: 0 }]
        },
        {
          id: 'p_4', title: 'Boné Aba Curva Dourado', price: 69.9, active: true,
          image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=70',
          desc: 'Bordado Leo do Corte em fio dourado.',
          sizes: [{ size: 'Único', qty: 9 }]
        },
        {
          id: 'p_5', title: 'Moletom Capuz Grafite', price: 179.9, active: true,
          image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=70',
          desc: 'Moletom flanelado, bolso canguru.',
          sizes: [{ size: 'M', qty: 2 }, { size: 'G', qty: 3 }, { size: 'GG', qty: 2 }]
        },
        {
          id: 'p_6', title: 'Pomada Modeladora Matte', price: 49.9, active: true,
          image: 'https://images.unsplash.com/photo-1626808642875-0aa545482dfb?auto=format&fit=crop&w=800&q=70',
          desc: 'Fixação forte, efeito seco. 120g.',
          sizes: [{ size: '120g', qty: 12 }]
        }
      ],
      appointments: [],
      orders: [],
      /* Promoções por dia da semana */
      weekdayRules: [
        {
          id: 'wd_1', label: 'Quarta do Corte', weekday: 3, percent: 10,
          scope: 'servicos', serviceId: null, active: true
        }
      ],
      /* Promoções combo (cross-selling serviço + vestuário) */
      comboRules: [
        {
          id: 'cb_1', label: 'Corte + Peça de Vestuário', minServices: 1, minProducts: 1,
          percent: 5, active: true
        }
      ]
    };
  }

  /* ---------------- Estado ---------------- */

  var state = null;

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { raw = null; }

    if (!raw) { state = seed(); save(); return state; }

    try {
      var parsed = JSON.parse(raw);
      state = migrate(parsed);
    } catch (e) {
      state = seed();
    }
    save();
    return state;
  }

  /** Garante que bases antigas/incompletas ganhem as chaves novas sem perder dados. */
  function migrate(data) {
    var base = seed();
    if (!data || typeof data !== 'object') return base;

    ['users', 'services', 'products', 'appointments', 'orders', 'weekdayRules', 'comboRules'].forEach(function (k) {
      if (!Array.isArray(data[k])) data[k] = base[k];
    });
    data.settings = Object.assign({}, base.settings, data.settings || {});
    if (!data.users.length) data.users = base.users;
    if (!data.services.length) data.services = base.services;
    data.version = base.version;
    return data;
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* modo privado / cota cheia: a app continua funcionando em memória */ }
  }

  function get() { return state || load(); }

  function reset() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
    state = seed();
    save();
  }

  /* ---------------- Carrinho (por usuário, na sessão) ---------------- */

  function cartKey() {
    var s = get();
    return KEY + '.cart.' + (s.sessionUserId || 'guest');
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

  function currentUser() {
    var s = get();
    if (!s.sessionUserId) return null;
    return s.users.filter(function (u) { return u.id === s.sessionUserId; })[0] || null;
  }

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

  /* ---------------- Mutações ---------------- */

  function createAppointment(data) {
    var s = get();
    var appointment = {
      id: uid('ap'),
      userId: data.userId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      duration: data.duration,
      date: data.date,
      time: data.time,
      priceBase: data.priceBase,
      discount: data.discount || 0,
      priceFinal: data.priceFinal,
      appliedRules: data.appliedRules || [],
      status: 'confirmado',
      createdAt: new Date().toISOString()
    };
    s.appointments.push(appointment);
    save();
    return appointment;
  }

  function updateAppointment(id, patch) {
    var s = get();
    var found = s.appointments.filter(function (a) { return a.id === id; })[0];
    if (!found) return null;
    Object.assign(found, patch);
    save();
    return found;
  }

  function cancelAppointment(id, by) {
    return updateAppointment(id, {
      status: 'cancelado',
      cancelledAt: new Date().toISOString(),
      cancelledBy: by || 'cliente'
    });
  }

  function saveProduct(data) {
    var s = get();
    if (data.id) {
      var found = s.products.filter(function (p) { return p.id === data.id; })[0];
      if (found) { Object.assign(found, data); save(); return found; }
    }
    var created = Object.assign({ id: uid('p'), active: true }, data);
    s.products.push(created);
    save();
    return created;
  }

  function removeProduct(id) {
    var s = get();
    s.products = s.products.filter(function (p) { return p.id !== id; });
    setCart(getCart().filter(function (i) { return i.productId !== id; }));
    save();
  }

  function saveWeekdayRule(data) {
    var s = get();
    if (data.id) {
      var found = s.weekdayRules.filter(function (r) { return r.id === data.id; })[0];
      if (found) { Object.assign(found, data); save(); return found; }
    }
    var created = Object.assign({ id: uid('wd'), active: true }, data);
    s.weekdayRules.push(created);
    save();
    return created;
  }

  function removeWeekdayRule(id) {
    var s = get();
    s.weekdayRules = s.weekdayRules.filter(function (r) { return r.id !== id; });
    save();
  }

  function saveComboRule(data) {
    var s = get();
    if (data.id) {
      var found = s.comboRules.filter(function (r) { return r.id === data.id; })[0];
      if (found) { Object.assign(found, data); save(); return found; }
    }
    var created = Object.assign({ id: uid('cb'), active: true }, data);
    s.comboRules.push(created);
    save();
    return created;
  }

  function removeComboRule(id) {
    var s = get();
    s.comboRules = s.comboRules.filter(function (r) { return r.id !== id; });
    save();
  }

  function saveSettings(patch) {
    var s = get();
    Object.assign(s.settings, patch);
    save();
  }

  function recordOrder(order) {
    var s = get();
    var created = Object.assign({ id: uid('or'), createdAt: new Date().toISOString() }, order);
    s.orders.push(created);
    save();
    return created;
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
    KEY: KEY,
    load: load, save: save, get: get, reset: reset,
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

  load();
})();
