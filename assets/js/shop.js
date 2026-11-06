/* ============================================================
   shop.js — catálogo de vestuário, carrinho e envio via WhatsApp
   Expõe: window.App.shop

   Não há pagamento online: ao finalizar, o cliente é levado ao
   WhatsApp do barbeiro com o resumo do pedido já formatado.
   ============================================================ */

(function () {
  'use strict';

  var store = window.App.store;
  var utils = window.App.utils;
  var discounts = window.App.discounts;
  var esc = utils.escapeHtml;

  /* tamanho escolhido por produto, apenas na tela */
  var chosenSize = {};

  function render() {
    var state = store.get();
    var products = state.products.filter(function (p) { return p.active !== false; });

    return '' +
      '<div class="page-head">' +
        '<span class="eyebrow">Vestuário</span>' +
        '<h1>Loja da barbearia</h1>' +
        '<p>Peças selecionadas, disponíveis na loja física. Monte seu pedido e feche a negociação direto com o Leo pelo WhatsApp.</p>' +
      '</div>' +

      '<div class="split">' +
        '<div>' +
          (products.length
            ? '<div class="grid grid-3">' + products.map(renderProduct).join('') + '</div>'
            : '<div class="empty"><strong>Nenhuma peça cadastrada</strong>O barbeiro ainda não publicou produtos.</div>') +
        '</div>' +
        '<aside class="sticky-side">' + renderCart() + '</aside>' +
      '</div>';
  }

  function renderProduct(product) {
    var sizes = product.sizes || [];
    var totalStock = sizes.reduce(function (sum, s) { return sum + (Number(s.qty) || 0); }, 0);
    var picked = chosenSize[product.id];

    // se o tamanho escolhido ficou sem estoque, limpa a escolha
    if (picked) {
      var row = sizes.filter(function (s) { return s.size === picked; })[0];
      if (!row || (Number(row.qty) || 0) <= 0) { picked = null; delete chosenSize[product.id]; }
    }

    var chips = sizes.map(function (s) {
      var qty = Number(s.qty) || 0;
      return '<button class="size-chip' + (picked === s.size ? ' selected' : '') + '" type="button" ' +
        'data-action="pick-size" data-id="' + esc(product.id) + '" data-size="' + esc(s.size) + '"' +
        (qty > 0 ? '' : ' disabled') +
        ' title="' + (qty > 0 ? qty + ' em estoque' : 'Esgotado') + '">' + esc(s.size) + '</button>';
    }).join('');

    var stockTag = totalStock > 0
      ? (totalStock <= 3
        ? '<span class="badge badge-warn stock-tag">Últimas ' + totalStock + '</span>'
        : '<span class="badge badge-ok stock-tag">Em estoque</span>')
      : '<span class="badge badge-danger stock-tag">Esgotado</span>';

    return '' +
      '<article class="product-card">' +
        '<div class="product-media">' +
          '<span class="ph">LEO</span>' +
          (product.image
            ? '<img src="' + esc(product.image) + '" alt="' + esc(product.title) + '" loading="lazy" ' +
              'onerror="window.App.app.imgFallback(this)">'
            : '') +
          stockTag +
        '</div>' +
        '<div class="product-info">' +
          '<h3>' + esc(product.title) + '</h3>' +
          (product.desc ? '<p class="muted" style="margin:0">' + esc(product.desc) + '</p>' : '') +
          '<div>' +
            '<div class="muted" style="margin-bottom:5px">Tamanho</div>' +
            '<div class="size-row">' + (chips || '<span class="muted">—</span>') + '</div>' +
          '</div>' +
          '<div class="product-foot">' +
            '<span class="price">' + utils.brl(product.price) + '</span>' +
            '<button class="btn btn-primary btn-sm" type="button" data-action="add-cart" ' +
              'data-id="' + esc(product.id) + '"' + (totalStock > 0 ? '' : ' disabled') + '>' +
              (totalStock > 0 ? 'Adicionar' : 'Esgotado') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderCart() {
    var cart = store.cartDetailed();
    var calc = discounts.compute({ service: null, date: utils.todayIso(), cart: cart });

    if (!cart.length) {
      return '' +
        '<div class="panel">' +
          '<div class="panel-head"><h3>Seu carrinho</h3></div>' +
          '<div class="panel-body">' +
            '<div class="empty" style="padding:28px 16px">' +
              '<strong>Carrinho vazio</strong>Escolha um tamanho e toque em “Adicionar”.' +
            '</div>' +
            renderPromoHints() +
          '</div>' +
        '</div>';
    }

    var items = cart.map(function (item) {
      var ref = 'data-pid="' + esc(item.productId) + '" data-size="' + esc(item.size) + '"';
      return '' +
        '<div class="cart-item">' +
          '<div class="cart-thumb">' +
            (item.image
              ? '<img src="' + esc(item.image) + '" alt="" onerror="window.App.app.imgFallback(this)">'
              : '') +
          '</div>' +
          '<div>' +
            '<div class="ci-name">' + esc(item.title) + '</div>' +
            '<div class="ci-meta">Tam. ' + esc(item.size) + ' · ' + utils.brl(item.unitPrice) + ' un.' +
              (item.qty >= item.stock ? ' · <span class="gold">máx. em estoque</span>' : '') +
            '</div>' +
            '<div class="qty-ctrl" style="margin-top:7px">' +
              '<button type="button" data-action="cart-dec" ' + ref + ' aria-label="Diminuir">−</button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-action="cart-inc" ' + ref + ' aria-label="Aumentar"' +
                (item.qty >= item.stock ? ' disabled' : '') + '>+</button>' +
              '<button type="button" data-action="cart-del" ' + ref + ' aria-label="Remover" ' +
                'style="margin-left:6px">✕</button>' +
            '</div>' +
          '</div>' +
          '<strong style="font-size:.9rem">' + utils.brl(item.subtotal) + '</strong>' +
        '</div>';
    }).join('');

    var promos = calc.applied.map(function (rule) {
      return '<div class="summary-line discount"><span>' + esc(rule.label) + ' (' + rule.percent + '%)</span>' +
        '<span>− ' + utils.brl(rule.amount) + '</span></div>';
    }).join('');

    return '' +
      '<div class="panel">' +
        '<div class="panel-head">' +
          '<h3>Seu carrinho</h3>' +
          '<button class="linkish" type="button" data-action="cart-clear">Limpar</button>' +
        '</div>' +
        '<div class="panel-body">' +
          items +
          '<div style="margin-top:12px">' +
            '<div class="summary-line"><span>Subtotal</span><span>' + utils.brl(calc.subtotalProducts) + '</span></div>' +
            promos +
            '<div class="summary-line total"><span>Total</span><strong>' + utils.brl(calc.totalProducts) + '</strong></div>' +
          '</div>' +
          '<button class="btn btn-wa btn-block" type="button" data-action="checkout-wa" style="margin-top:14px">' +
            'Finalizar pedido no WhatsApp' +
          '</button>' +
          '<p class="muted" style="margin:10px 0 0">Sem pagamento online: o pedido é combinado e retirado na barbearia.</p>' +
          renderPromoHints() +
        '</div>' +
      '</div>';
  }

  function renderPromoHints() {
    var list = discounts.activePromoList();
    if (!list.length) return '';
    return '<div style="margin-top:14px">' + list.map(function (promo) {
      return '<div class="promo-note"><span>★</span><span><b>' + esc(promo.label) + '</b> — ' +
        esc(promo.detail) + '</span></div>';
    }).join('') + '</div>';
  }

  /* ---------------- Ações ---------------- */

  function pickSize(productId, size) {
    chosenSize[productId] = size;
    window.App.app.render();
  }

  function addToCart(productId) {
    var app = window.App.app;
    var product = store.productById(productId);
    if (!product) return;

    var sizes = product.sizes || [];
    var size = chosenSize[productId];

    if (!size) {
      var available = sizes.filter(function (s) { return (Number(s.qty) || 0) > 0; });
      if (available.length === 1) {
        size = available[0].size;
        chosenSize[productId] = size;
      } else {
        app.toast('Escolha um tamanho antes de adicionar.', 'err');
        return;
      }
    }

    var row = sizes.filter(function (s) { return s.size === size; })[0];
    var stock = row ? Number(row.qty) || 0 : 0;
    if (stock <= 0) { app.toast('Tamanho esgotado.', 'err'); return; }

    var cart = store.getCart();
    var existing = cart.filter(function (i) {
      return i.productId === productId && i.size === size;
    })[0];

    if (existing) {
      if (existing.qty >= stock) {
        app.toast('Você já tem todo o estoque disponível desse tamanho no carrinho.', 'info');
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({ productId: productId, size: size, qty: 1 });
    }

    store.setCart(cart);
    app.toast(product.title + ' (tam. ' + size + ') no carrinho.', 'ok');
    app.render();
  }

  function changeQty(productId, size, delta) {
    var item = store.cartDetailed().filter(function (i) {
      return i.productId === productId && i.size === size;
    })[0];
    if (!item) return;

    var next = item.qty + delta;
    if (next > item.stock) {
      window.App.app.toast('Estoque insuficiente para mais unidades.', 'info');
      return;
    }

    store.setCartQty(productId, size, next);
    window.App.app.render();
  }

  function removeItem(productId, size) {
    store.setCartQty(productId, size, 0);
    window.App.app.render();
  }

  function clear() {
    var app = window.App.app;
    app.confirmModal({
      title: 'Limpar o carrinho?',
      body: '<p>Todos os itens serão removidos.</p>',
      confirmText: 'Limpar',
      danger: true,
      onConfirm: function () {
        store.clearCart();
        app.toast('Carrinho limpo.', 'info');
        app.render();
      }
    });
  }

  /* ---------------- Checkout via WhatsApp ---------------- */

  function buildMessage(cart, calc, user) {
    var state = store.get();
    var lines = [];

    lines.push('*Pedido — ' + state.settings.shopName + '*');
    lines.push('');
    if (user) {
      lines.push('Cliente: ' + user.name);
      if (user.phone) lines.push('Contato: ' + utils.formatPhone(user.phone));
      lines.push('');
    }
    lines.push('*Itens*');
    cart.forEach(function (item) {
      lines.push('• ' + item.qty + 'x ' + item.title + ' (tam. ' + item.size + ') — ' + utils.brl(item.subtotal));
    });
    lines.push('');
    lines.push('Subtotal: ' + utils.brl(calc.subtotalProducts));

    if (calc.applied.length) {
      lines.push('*Promoções*');
      calc.applied.forEach(function (rule) {
        lines.push('• ' + rule.label + ' (' + rule.percent + '%): -' + utils.brl(rule.onProducts || rule.amount));
      });
    }

    lines.push('*Total: ' + utils.brl(calc.totalProducts) + '*');

    // agendamento futuro do cliente ajuda o barbeiro a combinar a retirada
    if (user) {
      var next = store.appointmentsByUser(user.id).filter(function (a) {
        return a.status !== 'cancelado' && !utils.isPast(a.date, a.time);
      }).sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];

      if (next) {
        lines.push('');
        lines.push('Tenho horário marcado: ' + next.serviceName + ' em ' +
          utils.formatDateShort(next.date) + ' às ' + next.time + '.');
      }
    }

    lines.push('');
    lines.push('Podemos combinar a retirada?');

    return lines.join('\n');
  }

  function checkout() {
    var app = window.App.app;
    var cart = store.cartDetailed();
    if (!cart.length) { app.toast('Seu carrinho está vazio.', 'err'); return; }

    if (!window.App.auth.requireLogin('#/vestuario')) return;

    var user = window.App.auth.current();
    var calc = discounts.compute({ service: null, date: utils.todayIso(), cart: cart });
    var state = store.get();
    var phone = utils.digitsOnly(state.settings.whatsapp);
    var message = buildMessage(cart, calc, user);

    var preview = cart.map(function (item) {
      return '<div class="summary-line"><span>' + item.qty + 'x ' + esc(item.title) +
        ' <span class="muted">(' + esc(item.size) + ')</span></span><span>' + utils.brl(item.subtotal) + '</span></div>';
    }).join('') +
      (calc.discountProducts > 0
        ? '<div class="summary-line discount"><span>Descontos</span><span>− ' + utils.brl(calc.discountProducts) + '</span></div>'
        : '') +
      '<div class="summary-line total"><span>Total</span><strong>' + utils.brl(calc.totalProducts) + '</strong></div>' +
      '<p class="muted" style="margin-top:12px">Vamos abrir o WhatsApp do barbeiro com esse resumo já escrito. ' +
      'Nada é cobrado agora — o pagamento é combinado direto com o Léo.</p>';

    app.confirmModal({
      title: 'Enviar pedido pelo WhatsApp?',
      body: preview,
      confirmText: 'Abrir WhatsApp',
      onConfirm: function () {
        store.recordOrder({
          userId: user.id,
          userName: user.name,
          items: cart.map(function (i) {
            return { productId: i.productId, title: i.title, size: i.size, qty: i.qty, unitPrice: i.unitPrice };
          }),
          subtotal: calc.subtotalProducts,
          discount: calc.discountProducts,
          total: calc.totalProducts,
          status: 'enviado'
        });

        var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank', 'noopener');
        app.toast('Pedido registrado. Finalize a conversa no WhatsApp.', 'ok');
        app.render();
      }
    });
  }

  window.App.shop = {
    render: render,
    pickSize: pickSize, addToCart: addToCart,
    changeQty: changeQty, removeItem: removeItem, clear: clear,
    checkout: checkout, buildMessage: buildMessage
  };
})();
