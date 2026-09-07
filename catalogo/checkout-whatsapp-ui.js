(() => {
  'use strict';
  const DESTINO = '573137380766';

  function install(attempt = 0) {
    const ready = typeof checkoutItemsList === 'function' && typeof priceOf === 'function' && typeof shippingFor === 'function' && typeof fmt === 'function';
    if (!ready) {
      if (attempt < 120) setTimeout(() => install(attempt + 1), 50);
      return;
    }

    checkoutText = function () {
      const name = document.getElementById('coName')?.value.trim() || '';
      const phone = document.getElementById('coPhone')?.value.trim() || '';
      const address = document.getElementById('coAddress')?.value.trim() || '';
      const notes = document.getElementById('coNotes')?.value.trim() || '';

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
        'Hola Fer quiero realizar el siguiente producto',
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

    console.info('Lift checkout: WhatsApp personalizado activo');
  }

  install();
})();
