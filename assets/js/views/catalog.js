// ==========================================================
// NUANCE — Vue Boutique : filtres, tri, recherche (via query)
// ==========================================================
import { PRODUCTS, CATEGORIES, PRICE_MAX, SORTS, catLabel } from '../data.js';
import { productCard, icon, observeReveals, $, $$ } from '../ui.js';
import { navigate } from '../router.js';

const CAT_ALL = { id: '', label: 'Tout le catalogue' };

function applyFilters(query) {
  let list = [...PRODUCTS];
  const q = (query.q || '').trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.name} ${p.short} ${catLabel(p.cat)}`.toLowerCase().includes(q));
  if (query.cat) list = list.filter((p) => p.cat === query.cat);
  if (query.promo) list = list.filter((p) => p.oldPrice);
  if (query.max) list = list.filter((p) => p.price <= Number(query.max));

  switch (query.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'new': list.sort((a, b) => (b.badge === 'new') - (a.badge === 'new') || b.reviews - a.reviews); break;
    default: list.sort((a, b) => (b.badge === 'best') - (a.badge === 'best') || b.rating - a.rating);
  }
  return list;
}

const buildQuery = (obj) => {
  const params = new URLSearchParams(Object.entries(obj).filter(([, v]) => v));
  const s = params.toString();
  return `/boutique${s ? `?${s}` : ''}`;
};

export function renderShop(app, route) {
  const { query } = route;
  const max = Number(query.max || 0);
  const list = applyFilters(query);

  // Réinitialise l'état d'overlay (le re-render détruit l'ancien panneau de filtres)
  $('#scrim').classList.remove('is-on');
  $('#scrim').hidden = true;
  document.body.style.overflow = '';

  const activeChips = [];
  if (query.q) activeChips.push({ k: 'q', label: `« ${query.q} »` });
  if (query.promo) activeChips.push({ k: 'promo', label: 'Promotions' });
  if (query.max) activeChips.push({ k: 'max', label: `≤ ${query.max} €` });

  app.innerHTML = `
  <section class="section" style="padding-top:clamp(28px,4vw,44px)">
    <div class="container">
      <div class="reveal is-in">
        <span class="eyebrow">Catalogue</span>
        <h1 class="section__title" style="max-width:none">${query.cat ? catLabel(query.cat) : 'Toute la boutique'}</h1>
      </div>

      <div class="shop" style="margin-top:clamp(22px,3vw,34px)">
        <!-- ===== Filtres ===== -->
        <aside class="filters" id="filters" aria-label="Filtres">
          <div class="filters__head only-mobile">
            <h3>Filtres</h3>
            <button class="icon-btn" id="filtersClose" aria-label="Fermer les filtres">${icon('close')}</button>
          </div>

          <div class="filters__group">
            <p class="filters__title">Catégories</p>
            ${[CAT_ALL, ...CATEGORIES].map((c) => `
            <button class="filter-cat ${query.cat === c.id || (!query.cat && !c.id) ? 'is-on' : ''}" data-cat="${c.id}">
              ${c.label}
              <span class="filter-cat__n">${c.id ? PRODUCTS.filter((p) => p.cat === c.id).length : PRODUCTS.length}</span>
            </button>`).join('')}
          </div>

          <div class="filters__group">
            <p class="filters__title">Offres</p>
            <label class="checkline">
              <input type="checkbox" id="fPromo" ${query.promo ? 'checked' : ''}>
              <span class="box">${icon('check')}</span>
              Promotions uniquement
            </label>
            <label class="checkline">
              <input type="checkbox" id="fNew" data-notimplemented>
              <span class="box">${icon('check')}</span>
              Nouveautés
            </label>
          </div>

          <div class="filters__group">
            <p class="filters__title">Prix maximum</p>
            <div class="range-row"><span>Budget</span><b id="rangeLabel">${max ? max + ' €' : 'Illimité'}</b></div>
            <input type="range" id="fMax" min="40" max="${Math.ceil(PRICE_MAX / 10) * 10}" step="10" value="${max || Math.ceil(PRICE_MAX / 10) * 10}" aria-label="Prix maximum">
            <div class="range-row" style="margin:6px 0 0;color:var(--muted);font-size:12px"><span>40 €</span><span>${Math.ceil(PRICE_MAX / 10) * 10} €</span></div>
          </div>

          <div class="filters__group">
            <button class="filters__reset" id="fReset">${icon('close')} Réinitialiser les filtres</button>
          </div>

          <button class="btn btn--block only-mobile" id="filtersApply">Voir ${list.length} produit${list.length > 1 ? 's' : ''}</button>
        </aside>

        <!-- ===== Résultats ===== -->
        <div>
          <div class="shop__toolbar reveal is-in">
            <button class="chip btn-filters" id="filtersOpen">${icon('filter')} Filtres</button>
            <span class="shop__count"><b>${list.length}</b> produit${list.length > 1 ? 's' : ''}</span>
            <span class="spacer"></span>
            <div class="select">
              <select id="fSort" aria-label="Trier les produits">
                ${SORTS.map((s) => `<option value="${s.id}" ${query.sort === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
              ${icon('chevron')}
            </div>
          </div>

          ${activeChips.length ? `
          <div class="active-filters">
            ${activeChips.map((c) => `<button class="chip" data-unset="${c.k}">${c.label} ${icon('close')}</button>`).join('')}
          </div>` : ''}

          ${list.length
            ? `<div class="grid-products" id="shopGrid">${list.map((p, i) => productCard(p, i)).join('')}</div>`
            : `<div class="empty">
                ${icon('search')}
                <h3>Aucun produit trouvé</h3>
                <p>Essayez d'élargir votre recherche ou de retirer des filtres.</p>
                <button class="btn btn--sm" id="emptyReset">Tout réinitialiser</button>
              </div>`}
        </div>
      </div>
    </div>
  </section>`;

  // ----- interactions -----
  const merged = (patch) => navigate(buildQuery({ ...query, ...patch }), { replace: true });

  $$('.filter-cat', app).forEach((b) => b.addEventListener('click', () => { merged({ cat: b.dataset.cat }); closeFilters(); }));
  $('#fPromo')?.addEventListener('change', (e) => merged({ promo: e.target.checked ? '1' : '' }));
  $('#fSort')?.addEventListener('change', (e) => merged({ sort: e.target.value === 'reco' ? '' : e.target.value }));
  $('#fReset')?.addEventListener('click', () => merged({ cat: '', promo: '', max: '', q: '', sort: '' }));
  $('#emptyReset')?.addEventListener('click', () => merged({ cat: '', promo: '', max: '', q: '', sort: '' }));
  $$('[data-unset]', app).forEach((b) => b.addEventListener('click', () => merged({ [b.dataset.unset]: '' })));

  // Nouveautés (client-side checkbox → sort=new)
  $('#fNew')?.addEventListener('change', (e) => merged({ sort: e.target.checked ? 'new' : '' }));

  // Range prix
  const range = $('#fMax');
  const setFill = () => {
    const pct = ((range.value - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty('--fill', `${pct}%`);
    $('#rangeLabel').textContent = range.value >= range.max ? 'Illimité' : `${range.value} €`;
  };
  range?.addEventListener('input', setFill);
  range?.addEventListener('change', () => merged({ max: range.value >= range.max ? '' : range.value }));
  setFill();

  // Drawer mobile
  const openFilters = () => { $('#filters').classList.add('is-open'); $('#scrim').hidden = false; requestAnimationFrame(() => $('#scrim').classList.add('is-on')); document.body.style.overflow = 'hidden'; };
  function closeFilters() {
    const f = $('#filters');
    if (!f?.classList.contains('is-open')) return;
    f.classList.remove('is-open');
    $('#scrim').classList.remove('is-on');
    document.body.style.overflow = '';
    setTimeout(() => ($('#scrim').hidden = true), 400);
  }
  $('#filtersOpen')?.addEventListener('click', openFilters);
  $('#filtersClose')?.addEventListener('click', closeFilters);
  $('#filtersApply')?.addEventListener('click', closeFilters);
  $('#scrim')?.addEventListener('click', closeFilters);

  observeReveals(app);
}
