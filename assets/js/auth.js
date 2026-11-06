/* ============================================================
   auth.js — cadastro, login, sessão e tela de autenticação
   Expõe: window.App.auth
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var esc = utils.escapeHtml;

  /* ---------------- Sessão ---------------- */

  function current() { return store.currentUser(); }
  function isLogged() { return !!current(); }
  function isAdmin() { var u = current(); return !!u && u.role === 'admin'; }

  function login(email, password) {
    var state = store.get();
    var key = String(email || '').trim().toLowerCase();
    var user = state.users.filter(function (u) {
      return String(u.email).toLowerCase() === key;
    })[0];

    if (!user) return { ok: false, error: 'Não encontramos uma conta com esse e-mail.' };
    if (user.password !== password) return { ok: false, error: 'Senha incorreta. Tente novamente.' };

    state.sessionUserId = user.id;
    store.save();
    return { ok: true, user: user };
  }

  function register(data) {
    var state = store.get();
    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim().toLowerCase();
    var phone = utils.digitsOnly(data.phone);
    var password = String(data.password || '');

    if (name.length < 3) return { ok: false, error: 'Informe seu nome completo.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Informe um e-mail válido.' };
    if (phone.length < 10) return { ok: false, error: 'Informe um celular com DDD (10 ou 11 dígitos).' };
    if (password.length < 4) return { ok: false, error: 'A senha precisa ter ao menos 4 caracteres.' };

    var taken = state.users.some(function (u) { return String(u.email).toLowerCase() === email; });
    if (taken) return { ok: false, error: 'Esse e-mail já está cadastrado. Faça login.' };

    var user = {
      id: utils.uid('u'), name: name, email: email, phone: phone,
      password: password, role: 'cliente', createdAt: new Date().toISOString()
    };
    state.users.push(user);
    state.sessionUserId = user.id;
    store.save();
    return { ok: true, user: user };
  }

  function logout() {
    var state = store.get();
    state.sessionUserId = null;
    store.save();
  }

  /**
   * Garante login antes de uma ação. Se deslogado, manda para a tela de
   * acesso guardando o destino em `redirectTo`.
   */
  function requireLogin(redirectTo) {
    if (isLogged()) return true;
    window.App.app.pendingRedirect = redirectTo || '#/home';
    window.location.hash = '#/entrar';
    return false;
  }

  /* ---------------- Tela de acesso ---------------- */

  var mode = 'login'; // 'login' | 'cadastro'

  function render(params) {
    if (params && params.modo === 'cadastro') mode = 'cadastro';
    if (params && params.modo === 'login') mode = 'login';

    if (isLogged()) {
      return '' +
        '<div class="auth-wrap">' +
          '<div class="card center">' +
            '<h2>Você já está conectado</h2>' +
            '<p>Boas-vindas de volta, ' + esc(current().name.split(' ')[0]) + '.</p>' +
            '<div class="row" style="justify-content:center">' +
              '<a class="btn btn-primary" href="#/agendamento" data-nav>Agendar horário</a>' +
              '<a class="btn btn-ghost" href="#/meus-agendamentos" data-nav>Meus agendamentos</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    return mode === 'cadastro' ? renderRegister() : renderLogin();
  }

  function renderLogin() {
    return '' +
      '<div class="auth-wrap">' +
        '<div class="page-head center">' +
          '<span class="eyebrow">Área do cliente</span>' +
          '<h1>Entrar</h1>' +
          '<p>Acesse para agendar e acompanhar seus horários.</p>' +
        '</div>' +
        '<form class="card" data-form="login" novalidate>' +
          '<div id="auth-error"></div>' +
          '<div class="field">' +
            '<label for="login-email">E-mail</label>' +
            '<input id="login-email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" required>' +
          '</div>' +
          '<div class="field">' +
            '<label for="login-password">Senha</label>' +
            '<input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="••••••" required>' +
          '</div>' +
          '<button class="btn btn-primary btn-block" type="submit">Entrar</button>' +
          '<p class="auth-switch">Ainda não tem conta? ' +
            '<button class="linkish" type="button" data-action="auth-mode" data-mode="cadastro">Criar conta</button>' +
          '</p>' +
          '<div class="demo-box">' +
            '<strong>Acesso do barbeiro (demonstração)</strong><br>' +
            'E-mail: <code>leo@leodocorte.com</code> · Senha: <code>leo123</code>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function renderRegister() {
    return '' +
      '<div class="auth-wrap">' +
        '<div class="page-head center">' +
          '<span class="eyebrow">Primeira vez aqui?</span>' +
          '<h1>Criar conta</h1>' +
          '<p>É rápido — só precisamos do essencial para confirmar seu horário.</p>' +
        '</div>' +
        '<form class="card" data-form="register" novalidate>' +
          '<div id="auth-error"></div>' +
          '<div class="field">' +
            '<label for="reg-name">Nome completo</label>' +
            '<input id="reg-name" name="name" type="text" autocomplete="name" placeholder="Seu nome" required>' +
          '</div>' +
          '<div class="field">' +
            '<label for="reg-email">E-mail</label>' +
            '<input id="reg-email" name="email" type="email" autocomplete="email" placeholder="voce@email.com" required>' +
          '</div>' +
          '<div class="field">' +
            '<label for="reg-phone">Celular (WhatsApp)</label>' +
            '<input id="reg-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="(11) 90000-0000" data-mask="phone" required>' +
          '</div>' +
          '<div class="field">' +
            '<label for="reg-password">Senha</label>' +
            '<input id="reg-password" name="password" type="password" autocomplete="new-password" placeholder="mínimo 4 caracteres" required>' +
            '<span class="hint">Os dados ficam salvos apenas neste navegador.</span>' +
          '</div>' +
          '<button class="btn btn-primary btn-block" type="submit">Criar conta e continuar</button>' +
          '<p class="auth-switch">Já tem conta? ' +
            '<button class="linkish" type="button" data-action="auth-mode" data-mode="login">Fazer login</button>' +
          '</p>' +
        '</form>' +
      '</div>';
  }

  function showError(message) {
    var box = document.getElementById('auth-error');
    if (box) box.innerHTML = '<div class="form-error">' + esc(message) + '</div>';
  }

  function setMode(next) {
    mode = next;
    window.App.app.render();
  }

  /* ---------------- Handlers de formulário ---------------- */

  function handleSubmit(form) {
    var kind = form.getAttribute('data-form');
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });

    var result = kind === 'login'
      ? login(data.email, data.password)
      : register(data);

    if (!result.ok) { showError(result.error); return; }

    store.absorbGuestCart();

    var app = window.App.app;
    var target = app.pendingRedirect || (result.user.role === 'admin' ? '#/painel' : '#/agendamento');
    app.pendingRedirect = null;
    app.toast('Bem-vindo, ' + result.user.name.split(' ')[0] + '!', 'ok');
    window.location.hash = target;
    app.render();
  }

  window.App.auth = {
    current: current, isLogged: isLogged, isAdmin: isAdmin,
    login: login, register: register, logout: logout, requireLogin: requireLogin,
    render: render, handleSubmit: handleSubmit, setMode: setMode
  };
})();
