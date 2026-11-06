/* ============================================================
   auth.js — sessão e tela de acesso
   Expõe: window.App.auth

   O login e o cadastro agora acontecem no servidor: a senha vai por POST,
   é verificada contra um hash scrypt e a sessão volta num cookie assinado
   httpOnly, que o JavaScript não consegue ler.
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

  function logout() {
    return store.logout();
  }

  /**
   * Garante login antes de uma ação. Se deslogado, manda para a tela de
   * acesso guardando o destino em `pendingRedirect`.
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
            '<span class="hint">Guardamos sua senha com hash, nunca em texto puro.</span>' +
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

    var button = form.querySelector('[type="submit"]');
    var label = button ? button.textContent : '';
    if (button) { button.disabled = true; button.textContent = 'Aguarde…'; }

    var action = kind === 'login'
      ? store.login(data.email, data.password)
      : store.register(data);

    action.then(function () {
      store.absorbGuestCart();

      var app = window.App.app;
      var user = current();
      var target = app.pendingRedirect || (user && user.role === 'admin' ? '#/painel' : '#/agendamento');
      app.pendingRedirect = null;
      app.toast('Bem-vindo, ' + (user ? user.name.split(' ')[0] : '') + '!', 'ok');
      window.location.hash = target;
      app.render();
    }).catch(function (err) {
      if (button) { button.disabled = false; button.textContent = label; }
      showError(err && err.message ? err.message : 'Não conseguimos entrar agora.');
    });
  }

  window.App.auth = {
    current: current, isLogged: isLogged, isAdmin: isAdmin,
    logout: logout, requireLogin: requireLogin,
    render: render, handleSubmit: handleSubmit, setMode: setMode
  };
})();
