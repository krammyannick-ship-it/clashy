document.addEventListener('DOMContentLoaded', function () {
  const sortSelect = document.getElementById('sort-select');
  const sortSelectEsports = document.getElementById('sort-select-esports');
  const grid = document.querySelector('.card-grid');

  if (!grid) return;

  const getCards = () => Array.from(grid.querySelectorAll('.card-box'));

  const parseNumber = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  function sortCards(mode) {
    const cards = getCards();
    let sorted;
    if (mode === 'usage') {
      sorted = cards.sort((a, b) => parseNumber(b.dataset.usage) - parseNumber(a.dataset.usage));
    } else if (mode === 'win') {
      sorted = cards.sort((a, b) => parseNumber(b.dataset.win) - parseNumber(a.dataset.win));
    } else {
      sorted = cards.sort((a, b) => (a.dataset.name || '').localeCompare(b.dataset.name || '', undefined, { sensitivity: 'base' }));
    }

    // detach and re-append in sorted order
    const fragment = document.createDocumentFragment();
    sorted.forEach(c => fragment.appendChild(c));
    grid.innerHTML = '';
    grid.appendChild(fragment);
  }

  // Populate any missing stat-values from data-attributes (if placeholders exist)
  getCards().forEach(card => {
    const win = card.dataset.win;
    const usage = card.dataset.usage;
    const statValues = card.querySelectorAll('.stat-value');
    if (statValues && statValues.length >= 2) {
      statValues[0].textContent = (win ? parseFloat(win).toFixed(2) + '%' : statValues[0].textContent);
      statValues[1].textContent = (usage ? parseFloat(usage).toFixed(1) + '%' : statValues[1].textContent);
    }
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortCards(e.target.value);
    });

    // initial for other pages that use this select
    sortCards(sortSelect.value || 'alpha');
  }

  // --- Esports page: sorting by year, preisgeld, zuschauer ---
  if (sortSelectEsports) {
    // Parse euro strings like "170.000€" -> 170000 (integer)
    const parseEuro = (txt) => {
      if (!txt) return 0;
      // keep only digits
      const digits = txt.toString().replace(/\D/g, '');
      if (!digits) return 0;
      return parseInt(digits, 10);
    };

    // Helper: find a stat's value by matching its label text (case-insensitive)
    const getStatText = (card, match) => {
      const stats = Array.from(card.querySelectorAll('.stat'));
      match = (match || '').toString().toLowerCase();
      for (const s of stats) {
        const labelEl = s.querySelector('.stat-label');
        const valueEl = s.querySelector('.stat-value');
        if (!labelEl || !valueEl) continue;
        const label = labelEl.textContent.trim().toLowerCase();
        if (label.includes(match)) return valueEl.textContent.trim();
      }
      return '';
    };

    const parseZuschauer = (txt) => {
      if (!txt) return 0;
      const cleaned = txt.toString().replace(/\./g, '').replace(/,/g, '').replace(/—/g, '').trim();
      const n = parseInt(cleaned, 10);
      return isNaN(n) ? 0 : n;
    };

    function sortEsports(mode) {
      const cards = getCards();
      let sorted = cards.slice();
      if (mode === 'year') {
        // newest first (desc)
        sorted.sort((a,b) => parseInt(b.dataset.year || '0',10) - parseInt(a.dataset.year || '0',10));
      } else if (mode === 'preisgeld') {
        // highest prize first — find by label (e.g. "Preisgeld")
        sorted.sort((a,b) => parseEuro(getStatText(b, 'preis')) - parseEuro(getStatText(a, 'preis')));
      } else if (mode === 'zuschauer') {
        // highest viewers first — match labels containing "zuschauer" or "peak"
        sorted.sort((a,b) => parseZuschauer(getStatText(b, 'zuschauer') || getStatText(b, 'peak')) - parseZuschauer(getStatText(a, 'zuschauer') || getStatText(a, 'peak')));
      }

      const frag = document.createDocumentFragment();
      sorted.forEach(c => frag.appendChild(c));
      grid.innerHTML = '';
      grid.appendChild(frag);
    }

    // wire up
    sortSelectEsports.addEventListener('change', (e) => sortEsports(e.target.value));
    // default sort state (year newest first)
    sortEsports(sortSelectEsports.value || 'year');

  }

  // SuperStore CTA is always visible; no scroll handler needed.
});
