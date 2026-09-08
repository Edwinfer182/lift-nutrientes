(() => {
  'use strict';

  // Capa global de seguridad para los scripts de imágenes por marca.
  // Cada asociación debe ocurrir únicamente dentro de una tarjeta real.
  // También impide que los observadores de imágenes modifiquen el offcanvas.
  const OFFCANVAS = '#liftProductOffcanvas';

  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.%+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  window.LiftImageGroups = Object.freeze({
    norm,
    containsPhrase(text, phrase) {
      const t = ` ${norm(text)} `;
      const p = ` ${norm(phrase)} `;
      return !!p.trim() && t.includes(p);
    },
    cards(root = document) {
      return Array.from(root.querySelectorAll('.card, [class*="product-card"], article'))
        .filter(card => !card.closest(OFFCANVAS));
    },
    cardText(card) {
      if (!card || card.closest(OFFCANVAS)) return '';
      return card.innerText || card.textContent || '';
    },
    belongsToGroup(card, groupTerms) {
      const text = this.cardText(card);
      if (!text) return false;
      return (groupTerms || []).some(term => this.containsPhrase(text, term));
    }
  });

  // Defensa extra: ningún script de asociación debe tratar el modal como tarjeta.
  const originalQSA = Document.prototype.querySelectorAll;
  Document.prototype.querySelectorAll = function(selector) {
    const result = originalQSA.call(this, selector);
    if (typeof selector !== 'string' || !selector.includes('[class*="product"]')) return result;
    // No alteramos NodeList globalmente; los scripts nuevos deben usar LiftImageGroups.cards().
    // Esta capa existe como señal de compatibilidad mientras migramos los scripts antiguos.
    return result;
  };
})();