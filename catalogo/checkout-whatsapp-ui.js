(() => {
  'use strict';
  const DESTINO = '573137380766';
  const CIUDADES_LOCALES = ['medellin','bello','itagui','envigado','sabaneta','la estrella'];

  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function esFueraDeMedellin() {
    if (!selectedCity?.name) return false;
    return !CIUDADES_LOCALES.includes(normalizar(selectedCity.name));
  }

  function instalarCampoCedula() {
    if (document.getElementById('coCedulaWrap')) return;
    const cityInput = document.getElementById('coCity');
    const cityField = cityInput?.closest('.field');
    if (!cityField?.parentElement) return;

    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.id = 'coCedulaWrap';
    wrap.style.display = 'none';
    wrap.innerHTML = `
      <label for="coCedula">Cédula</label>
      <input id="coCedula" type="text" inputmode="numeric" autocomplete="off" placeholder="Número de cédula">
    `;
    cityField.insertAdjacentElement('afterend', wrap);
  }

  function actualizarCampoCedula() {
    instalarCampoCedula();
    const wrap = document.getElementById('coCedulaWrap');
    const input = document.getElementById('coCedula');
    if (!wrap || !input) return;

    const fuera = esFueraDeMedellin();
    wrap.style.display = fuera ? 'flex' : 'none';
    input.required = fuera;
    if (!fuera) input.value = '';
  }

  function install(attempt = 0) {
    const ready = typeof checkoutItemsList === 'function' && typeof priceOf === 'function' && typeof shippingFor === 'function' && typeof fmt === 'function';
    if (!ready) {
      if (attempt < 120) setTimeout(() => install(attempt + 1), 50);
      return;
    }

    instalarCampoCedula();
    actualizarCampoCedula();

    const cityInput = document.getElementById('coCity');
    if (cityInput && !cityInput.dataset.cedulaListener) {
      cityInput.dataset.cedulaListener = '1';
      cityInput.addEventListener('input', () => setTimeout(actualizarCampoCedula, 0));
      cityInput.addEventListener('change', () => setTimeout(actualizarCampoCedula, 0));
    }
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cityOption')) setTimeout(actualizarCampoCedula, 0);
    });

    checkoutText = function () {
      actualizarCampoCedula();

      const name = document.getElementById('coName')?.value.trim() || '';
      const phone = document.getElementById('coPhone')?.value.trim() || '';
      const address = document.getElementById('coAddress')?.value.trim() || '';
      const notes = document.getElementById('coNotes')?.value.trim() || '';
      const cedula = document.getElementById('coCedula')?.value.trim() || '';
      const fuera = esFueraDeMedellin();

      if (!name || !phone || !address || !selectedCity) {
        alert('Completa nombre, celular, dirección y selecciona una ciudad de la lista.');
        return '';
      }
      if (fuera && !cedula) {
        alert('Para envíos fuera de Medellín debes ingresar la cédula.');
        document.getElementById('coCedula')?.focus();
        return '';
      }

      const rows = checkoutItemsList();
      if (!rows.length) return '';

      const subtotal = rows.reduce((sum, row) => sum + priceOf(row.p) * row.q, 0);
      const shipping = shippingFor(selectedCity.name, checkoutQty());
      const discount = Math.min(subtotal, Number(appliedCoupon?.discount || 0));
      const total = Math.max(0, subtotal - discount) + (shipping || 0);

      const lines = [
        'Hola Fer, quiero realizar el siguiente pedido:',
        '',
        `Nombre: ${name}`,
        `Celular: ${phone}`,
        fuera ? `Cédula: ${cedula}` : '',
        `Dirección: ${address}`,
        `Ciudad: ${selectedCity.name}${selectedCity.department ? ' · ' + selectedCity.department : ''}`,
        notes ? `Notas: ${notes}` : '',
        '',
        'Pedido:'
      ];

      rows.forEach(({ p, q, flavor }) => {
        lines.push(`⚡ ${q} ${p.name} – ${p.brand}${flavor ? ' · Sabor: ' + flavor : ''} · ${fmt(priceOf(p))} c/u${offerOf(p)?.gift ? ' · 🎁 Incluye regalo' : ''}`);
      });

      lines.push('', `Subtotal: ${fmt(subtotal)}`);
      if (appliedCoupon && discount) {
        lines.push(`Cupón ${appliedCoupon.code}: -${fmt(discount)}`);
      }
      lines.push(
        `Envío: ${shipping === 0 ? 'GRATIS 🚚' : fmt(shipping) + ' 🚚'}`,
        `Total del pedido: ${fmt(total)}`
      );

      return lines.filter(Boolean).join('\n');
    };

    finishCheckout = function () {
      const text = checkoutText();
      if (!text) return;
      window.open(`https://wa.me/${DESTINO}?text=${encodeURIComponent(text)}`, '_blank');
    };

    setInterval(actualizarCampoCedula, 500);
    console.info('Lift checkout: WhatsApp personalizado y cédula nacional activos');
  }

  install();
})();
