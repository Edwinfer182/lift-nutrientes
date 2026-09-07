(() => {
  'use strict';

  const FLAVOR_JSON = 'sabores.json';
  let flavorData = { products: {} };
  let picker = { id: null, action: 'cart', selected: '' };
  let checkoutSingleFlavor = '';

  const escAttr = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  function injectStyles() {
    if (document.getElementById('liftFlavorStyles')) return;
    const style = document.createElement('style');
    style.id = 'liftFlavorStyles';
    style.textContent = `
      .flavorOff{width:min(92vw,390px)}
      .flavorProduct{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center;padding:4px 0 16px;border-bottom:1px solid #eee}
      .flavorProduct img{width:76px;height:76px;object-fit:contain;border:1px solid #eee;border-radius:12px;background:#fff}
      .flavorProductName{font-size:14px;line-height:1.35;font-weight:400}
      .flavorProductMeta{font-size:12px;color:#777;margin-top:4px}
      .flavorTitle{font-size:12px;color:#666;margin:16px 0 9px}
      .flavorList{display:grid;gap:8px}
      .flavorChoice{width:100%;min-height:46px;border:1px solid #ddd;background:#fff;border-radius:11px;padding:10px 12px;text-align:left;font-family:inherit;font-size:13px;font-weight:300;cursor:pointer;transition:.15s}
      .flavorChoice:hover{border-color:#999;background:#fafafa}
      .flavorChoice:focus{outline:2px solid #111;outline-offset:2px}
      .flavorChoice.selected{border-color:#111;background:#f4f4f4;font-weight:400}
      .flavorFoot{border-top:1px solid #ddd;padding:14px 17px;background:#fff}
      .flavorConfirm{width:100%;height:46px;border:0;border-radius:11px;background:#111;color:#fff;font-family:inherit;font-weight:300;cursor:pointer}
      .flavorConfirm:disabled{opacity:.42;cursor:not-allowed}
      .flavorHint{font-size:11px;color:#777;line-height:1.45;margin-top:8px}
      .cartFlavor{font-size:11.5px;color:#666;margin-top:3px}
    `;
    document.head.appendChild(style);
  }

  function injectPicker() {
    if (document.getElementById('flavors')) return;
    const aside = document.createElement('aside');
    aside.id = 'flavors';
    aside.className = 'off right flavorOff';
    aside.setAttribute('aria-labelledby', 'flavorHeading');
    aside.innerHTML = `
      <div class="offhead">
        <h2 id="flavorHeading">Elige el sabor</h2>
        <button class="close" type="button" id="flavorClose" aria-label="Cerrar">×</button>
      </div>
      <div id="flavorBody" class="offbody"></div>
      <div class="flavorFoot">
        <button id="flavorConfirm" class="flavorConfirm" type="button" disabled>Continuar</button>
        <div class="flavorHint">Selecciona un sabor para continuar con este producto.</div>
      </div>`;
    const cartPanel = document.getElementById('cart');
    if (cartPanel) cartPanel.insertAdjacentElement('afterend', aside);
    else document.body.appendChild(aside);

    document.getElementById('flavorClose')?.addEventListener('click', closeFlavorPicker);
    document.getElementById('flavorConfirm')?.addEventListener('click', confirmFlavor);
  }

  function flavorsFor(id) {
    const row = flavorData?.products?.[String(id)];
    return Array.isArray(row?.flavors) ? row.flavors.filter(Boolean) : [];
  }

  function cartKey(id, flavor = '') {
    return `${id}::${flavor || ''}`;
  }

  function parseCartKey(key) {
    const value = String(key);
    const at = value.indexOf('::');
    if (at < 0) return { id: value, flavor: '' };
    return { id: value.slice(0, at), flavor: value.slice(at + 2) };
  }

  function persistCart() {
    localStorage.setItem('liftCartV2', JSON.stringify(cart));
    updateCount();
  }

  function migrateCart() {
    const migrated = {};
    for (const [key, qty] of Object.entries(cart || {})) {
      const parsed = parseCartKey(key);
      const nextKey = cartKey(parsed.id, parsed.flavor);
      migrated[nextKey] = (migrated[nextKey] || 0) + Number(qty || 0);
    }
    cart = migrated;
    persistCart();
  }

  function rawAdd(id, flavor = '') {
    const key = cartKey(id, flavor);
    cart[key] = (cart[key] || 0) + 1;
    persistCart();
    renderCart();
    openOff('cart');
  }

  function openFlavorPicker(id, action = 'cart') {
    const product = PRODUCTS.find((x) => x.id === id);
    const flavors = flavorsFor(id);
    if (!product || !flavors.length) {
      if (action === 'buy') startSingleCheckout(id, '');
      else rawAdd(id, '');
      return;
    }

    picker = { id, action, selected: '' };
    closeOff();

    const body = document.getElementById('flavorBody');
    body.innerHTML = `
      <div class="flavorProduct">
        <img src="${escAttr(product.image)}" alt="${escAttr(product.name)}">
        <div>
          <div class="flavorProductName">${esc(product.name)}</div>
          <div class="flavorProductMeta">${esc(product.brand)} · ${fmt(product.price)}</div>
        </div>
      </div>
      <div class="flavorTitle">Sabores disponibles</div>
      <div class="flavorList">
        ${flavors.map((flavor) => `<button type="button" class="flavorChoice" data-flavor="${escAttr(flavor)}">${esc(flavor)}</button>`).join('')}
      </div>`;

    body.querySelectorAll('.flavorChoice').forEach((button) => {
      button.addEventListener('click', () => {
        picker.selected = button.dataset.flavor || '';
        body.querySelectorAll('.flavorChoice').forEach((node) => node.classList.toggle('selected', node === button));
        document.getElementById('flavorConfirm').disabled = !picker.selected;
      });
    });

    document.getElementById('flavorConfirm').disabled = true;
    document.getElementById('flavors').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeFlavorPicker() {
    document.getElementById('flavors')?.classList.remove('open');
    const anotherOpen = document.querySelector('.off.open');
    if (!anotherOpen) document.getElementById('overlay')?.classList.remove('show');
    document.body.style.overflow = anotherOpen ? 'hidden' : '';
    picker = { id: null, action: 'cart', selected: '' };
  }

  function confirmFlavor() {
    const { id, action, selected } = picker;
    if (!id || !selected) return;
    closeFlavorPicker();
    if (action === 'buy') startSingleCheckout(id, selected);
    else rawAdd(id, selected);
  }

  function startSingleCheckout(id, flavor = '') {
    checkoutMode = 'single';
    checkoutSingleId = id;
    checkoutSingleFlavor = flavor;
    openCheckout();
  }

  function overrideCatalogBehavior() {
    saveCart = persistCart;

    items = function () {
      return Object.entries(cart).map(([key, qty]) => {
        const parsed = parseCartKey(key);
        return {
          key,
          p: PRODUCTS.find((x) => x.id == parsed.id),
          q: Number(qty || 0),
          flavor: parsed.flavor
        };
      }).filter((x) => x.p && x.q > 0);
    };

    add = function (id, flavor) {
      if (typeof flavor === 'string' && flavor) {
        rawAdd(id, flavor);
        return;
      }
      const flavors = flavorsFor(id);
      if (flavors.length) openFlavorPicker(id, 'cart');
      else rawAdd(id, '');
    };

    change = function (key, delta) {
      if (!(key in cart) && /^\d+$/.test(String(key))) key = cartKey(key, '');
      cart[key] = (cart[key] || 0) + delta;
      if (cart[key] <= 0) delete cart[key];
      persistCart();
      renderCart();
    };

    removeItem = function (key) {
      if (!(key in cart) && /^\d+$/.test(String(key))) key = cartKey(key, '');
      delete cart[key];
      persistCart();
      renderCart();
    };

    renderCart = function () {
      const cartItems = items();
      const body = document.getElementById('cartBody');
      if (!cartItems.length) {
        body.innerHTML = '<div class="empty">Tu carrito está vacío.</div>';
      } else {
        body.innerHTML = cartItems.map(({ key, p, q, flavor }) => `
          <div class="cartline">
            <img src="${escAttr(p.image)}" alt="${escAttr(p.name)}">
            <div>
              <div class="cartname">${esc(p.name)} · ${esc(p.brand)}</div>
              ${flavor ? `<div class="cartFlavor">Sabor: ${esc(flavor)}</div>` : ''}
              <div class="cartprice">${fmt(p.price * q)}</div>
              <div class="qty">
                <button type="button" data-cart-key="${escAttr(key)}" data-delta="-1">−</button>
                <b>${q}</b>
                <button type="button" data-cart-key="${escAttr(key)}" data-delta="1">+</button>
              </div>
            </div>
            <button type="button" class="trash" data-remove-key="${escAttr(key)}">×</button>
          </div>`).join('');

        body.querySelectorAll('[data-cart-key]').forEach((button) => {
          button.addEventListener('click', () => change(button.dataset.cartKey, Number(button.dataset.delta || 0)));
        });
        body.querySelectorAll('[data-remove-key]').forEach((button) => {
          button.addEventListener('click', () => removeItem(button.dataset.removeKey));
        });
      }

      document.getElementById('subtotal').textContent = fmt(cartItems.reduce((sum, row) => sum + row.p.price * row.q, 0));
      const checkoutButton = document.getElementById('cartBuyBtn');
      if (checkoutButton) checkoutButton.disabled = !cartItems.length;
      updateCount();
    };

    buyProduct = function (id) {
      const flavors = flavorsFor(id);
      if (flavors.length) openFlavorPicker(id, 'buy');
      else startSingleCheckout(id, '');
    };

    const originalStartCartCheckout = startCartCheckout;
    startCartCheckout = function () {
      checkoutSingleFlavor = '';
      originalStartCartCheckout();
    };

    checkoutItemsList = function () {
      if (checkoutMode === 'single') {
        const product = PRODUCTS.find((x) => x.id === checkoutSingleId);
        return product ? [{ p: product, q: 1, flavor: checkoutSingleFlavor || '' }] : [];
      }
      return items();
    };

    renderCheckoutSummary = function () {
      const checkoutItems = checkoutItemsList();
      const subtotal = checkoutItems.reduce((sum, row) => sum + row.p.price * row.q, 0);
      const shipping = shippingFor(selectedCity?.name || '', checkoutQty());
      document.getElementById('checkoutItems').innerHTML = checkoutItems.map((row) =>
        `${row.q} × ${esc(row.p.name)}${row.flavor ? ` · Sabor: ${esc(row.flavor)}` : ''} · ${fmt(row.p.price * row.q)}`
      ).join('<br>');
      document.getElementById('coSubtotal').textContent = fmt(subtotal);
      document.getElementById('coShipping').textContent = shipping === null ? 'Selecciona ciudad' : (shipping === 0 ? 'Gratis' : fmt(shipping));
      document.getElementById('coTotal').textContent = fmt(subtotal + (shipping || 0));
    };

    checkoutText = function () {
      const name = document.getElementById('coName').value.trim();
      const phone = document.getElementById('coPhone').value.trim();
      const address = document.getElementById('coAddress').value.trim();
      const notes = document.getElementById('coNotes').value.trim();
      if (!name || !phone || !address || !selectedCity) {
        alert('Completa nombre, celular, dirección y selecciona una ciudad de la lista.');
        return '';
      }
      const checkoutItems = checkoutItemsList();
      if (!checkoutItems.length) return '';
      const subtotal = checkoutItems.reduce((sum, row) => sum + row.p.price * row.q, 0);
      const shipping = shippingFor(selectedCity.name, checkoutQty());
      const total = subtotal + (shipping || 0);
      const lines = [
        'Hola, quiero confirmar este pedido:', '',
        `Nombre: ${name}`,
        `Celular: ${phone}`,
        `Dirección: ${address}`,
        `Ciudad: ${selectedCity.name}${selectedCity.department ? ' · ' + selectedCity.department : ''}`,
        notes ? `Notas: ${notes}` : '', '', 'Pedido:'
      ];
      checkoutItems.forEach(({ p, q, flavor }) => {
        lines.push(`⚡ ${q} ${p.name} – ${p.brand}${flavor ? ' · Sabor: ' + flavor : ''} · ${fmt(p.price)} c/u`);
      });
      lines.push('', `Subtotal: ${fmt(subtotal)}`, `Envío: ${shipping === 0 ? 'GRATIS' : fmt(shipping)}`, `Total: ${fmt(total)}`);
      return lines.join('\n');
    };

    orderText = function () {
      const cartItems = items();
      if (!cartItems.length) return '';
      const lines = ['Pedido:', ''];
      cartItems.forEach(({ p, q, flavor }) => {
        lines.push(`⚡ ${q} ${p.name} – ${p.brand}${flavor ? ' · Sabor: ' + flavor : ''} · ${fmt(p.price)} c/u`);
      });
      const subtotal = cartItems.reduce((sum, row) => sum + row.p.price * row.q, 0);
      lines.push('', `Subtotal: ${fmt(subtotal)}`);
      return lines.join('\n');
    };
  }

  async function loadFlavorData() {
    try {
      const response = await fetch(FLAVOR_JSON, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      flavorData = data && typeof data === 'object' ? data : { products: {} };
    } catch (error) {
      console.warn('Lift: no se pudo cargar sabores.json', error);
      flavorData = { products: {} };
    }
  }

  async function init() {
    injectStyles();
    injectPicker();
    overrideCatalogBehavior();
    migrateCart();
    renderCart();
    await loadFlavorData();
  }

  init();
})();
