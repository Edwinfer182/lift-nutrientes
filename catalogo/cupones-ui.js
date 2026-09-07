(() => {
  'use strict';

  const SUPABASE_URL = 'https://lethnvyuvnhekoudmqgy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_jaBDvCiunGGwMakqL_-TIg_LZcgHgk8';

  function couponMessage(data) {
    const messages = {
      invalid_code: 'Código no válido.',
      inactive: 'Este cupón está inactivo.',
      not_started: 'Este cupón todavía no está vigente.',
      expired: 'Este cupón ya venció.',
      not_assigned_to_phone: 'Este cupón no está asignado a este celular.',
      usage_limit_reached: 'Este cupón alcanzó su límite de usos.',
      phone_usage_limit_reached: 'Este celular ya utilizó este cupón.',
      category_not_eligible: `Este cupón aplica a la categoría ${data?.required || 'indicada'}.`,
      brand_not_eligible: `Este cupón aplica a la marca ${data?.required || 'indicada'}.`,
      minimum_not_met: `Compra mínima requerida: ${fmt(Number(data?.minimum || 0))}.`
    };
    return messages[data?.reason] || 'Este cupón no se puede aplicar a este pedido.';
  }

  function setStatus(text, type = '') {
    const el = document.getElementById('couponStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'couponStatus' + (type ? ' ' + type : '');
  }

  function subtotalNow() {
    return checkoutItemsList().reduce((sum, row) => sum + priceOf(row.p) * row.q, 0);
  }

  async function validateCoupon() {
    const code = (document.getElementById('coCoupon')?.value || '').trim().toUpperCase();
    const phone = (document.getElementById('coPhone')?.value || '').trim();
    const button = document.getElementById('couponApplyBtn');

    appliedCoupon = null;
    renderCheckoutSummary();

    if (!code) {
      setStatus('Escribe un código de cupón.', 'err');
      return;
    }
    if (!phone) {
      setStatus('Escribe tu celular para validar el cupón.', 'err');
      return;
    }

    const rows = checkoutItemsList();
    const subtotal = rows.reduce((sum, row) => sum + priceOf(row.p) * row.q, 0);
    const categories = [...new Set(rows.map((row) => row.p.category).filter(Boolean))];
    const brands = [...new Set(rows.map((row) => row.p.brand).filter(Boolean))];

    if (button) button.disabled = true;
    setStatus('Validando cupón…');

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/validate_coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          p_code: code,
          p_phone: phone,
          p_subtotal: subtotal,
          p_categories: categories,
          p_brands: brands
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (!data?.valid) {
        setStatus(couponMessage(data), 'err');
        renderCheckoutSummary();
        return;
      }

      appliedCoupon = {
        code: data.code,
        discount: Number(data.discount_amount || 0),
        min: Number(data.min_subtotal || 0),
        subtotal,
        expiresAt: data.expires_at,
        couponId: data.coupon_id,
        couponType: data.coupon_type
      };

      setStatus(`Cupón ${data.code} aplicado: ahorras ${fmt(Number(data.discount_amount || 0))}.`, 'ok');
      renderCheckoutSummary();
    } catch (error) {
      console.warn('Lift: no se pudo validar el cupón', error);
      setStatus('No pudimos validar el cupón. Intenta nuevamente.', 'err');
      renderCheckoutSummary();
    } finally {
      if (button) button.disabled = false;
    }
  }

  function installCouponBehavior() {
    applyCoupon = validateCoupon;

    const originalOpenCheckout = openCheckout;
    openCheckout = function () {
      originalOpenCheckout();
      setStatus('Ingresa tu cupón y lo validaremos automáticamente.');
    };

    renderCheckoutSummary = function () {
      const rows = checkoutItemsList();
      const subtotal = rows.reduce((sum, row) => sum + priceOf(row.p) * row.q, 0);
      const shipping = shippingFor(selectedCity?.name || '', checkoutQty());

      if (appliedCoupon && (subtotal < Number(appliedCoupon.min || 0) || subtotal !== Number(appliedCoupon.subtotal || subtotal))) {
        appliedCoupon = null;
        setStatus('El pedido cambió. Valida nuevamente el cupón.');
      }

      const discount = Math.min(subtotal, Number(appliedCoupon?.discount || 0));
      const flavorMsg = typeof flavorMessageFor === 'function' ? flavorMessageFor(rows) : '';

      document.getElementById('checkoutItems').innerHTML = rows.map((row) =>
        `${row.q} × ${esc(row.p.name)}${row.flavor ? ` · Sabor: ${esc(row.flavor)}` : ''} · ${fmt(priceOf(row.p) * row.q)}`
      ).join('<br>') + (flavorMsg ? `<div class="checkoutFlavorMsg">${flavorMsg}</div>` : '');

      const progress = document.getElementById('checkoutShippingProgress');
      if (progress && typeof shippingProgressHTML === 'function') {
        progress.innerHTML = selectedCity ? shippingProgressHTML(checkoutQty(), selectedCity.name) : shippingProgressHTML(checkoutQty());
      }

      document.getElementById('coSubtotal').textContent = fmt(subtotal);
      const discountLine = document.getElementById('coDiscountLine');
      if (discountLine) discountLine.style.display = discount ? 'flex' : 'none';
      if (discount) {
        document.getElementById('coDiscountLabel').textContent = `Cupón ${appliedCoupon.code}`;
        document.getElementById('coDiscount').textContent = '-' + fmt(discount);
      }
      document.getElementById('coShipping').textContent = shipping === null ? 'Selecciona ciudad' : (shipping === 0 ? 'Gratis' : fmt(shipping));
      document.getElementById('coTotal').textContent = fmt(Math.max(0, subtotal - discount) + (shipping || 0));
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

      const rows = checkoutItemsList();
      if (!rows.length) return '';
      const subtotal = rows.reduce((sum, row) => sum + priceOf(row.p) * row.q, 0);
      const shipping = shippingFor(selectedCity.name, checkoutQty());
      const discount = Math.min(subtotal, Number(appliedCoupon?.discount || 0));
      const total = Math.max(0, subtotal - discount) + (shipping || 0);

      const lines = [
        'Hola, quiero confirmar este pedido:',
        '',
        `Nombre: ${name}`,
        `Celular: ${phone}`,
        `Dirección: ${address}`,
        `Ciudad: ${selectedCity.name}${selectedCity.department ? ' · ' + selectedCity.department : ''}`,
        notes ? `Notas: ${notes}` : '',
        '',
        'Pedido:'
      ];

      rows.forEach(({ p, q, flavor }) => {
        lines.push(`⚡ ${q} ${p.name} – ${p.brand}${flavor ? ' · Sabor: ' + flavor : ''} · ${fmt(priceOf(p))} c/u${offerOf(p)?.gift ? ' · 🎁 Incluye regalo' : ''}`);
      });

      if (!rows.some((row) => row.flavor)) {
        lines.push('', '💬 Si el producto maneja sabores, se confirman por WhatsApp según disponibilidad.');
      }
      lines.push('', `Subtotal: ${fmt(subtotal)}`);
      if (appliedCoupon && discount) lines.push(`Cupón ${appliedCoupon.code}: -${fmt(discount)}`);
      lines.push(`Envío: ${shipping === 0 ? 'GRATIS' : fmt(shipping)}`, `Total: ${fmt(total)}`);
      return lines.filter(Boolean).join('\n');
    };

    const phoneInput = document.getElementById('coPhone');
    if (phoneInput && !phoneInput.dataset.couponListenerV2) {
      phoneInput.dataset.couponListenerV2 = '1';
      phoneInput.addEventListener('input', () => {
        if (appliedCoupon) {
          appliedCoupon = null;
          setStatus('El celular cambió. Valida nuevamente el cupón.');
          renderCheckoutSummary();
        }
      });
    }

    const couponInput = document.getElementById('coCoupon');
    if (couponInput && !couponInput.dataset.couponListenerV2) {
      couponInput.dataset.couponListenerV2 = '1';
      couponInput.addEventListener('input', () => {
        if (appliedCoupon) {
          appliedCoupon = null;
          setStatus('El código cambió. Valida nuevamente el cupón.');
          renderCheckoutSummary();
        }
      });
    }

    setStatus('Ingresa tu cupón y lo validaremos automáticamente.');
    console.info('Lift cupones: conexión con Supabase activa');
  }

  function waitForFlavorOverrides(attempt = 0) {
    const flavorReady = typeof renderCart === 'function' && String(renderCart).includes('cartFlavor');
    if (flavorReady || attempt >= 80) {
      installCouponBehavior();
      return;
    }
    setTimeout(() => waitForFlavorOverrides(attempt + 1), 50);
  }

  waitForFlavorOverrides();
})();
