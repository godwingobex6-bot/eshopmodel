// ==========================================================
// NUANCE — UI partagée : format, cartes, toasts, drawer, modal
// ==========================================================
import { catLabel, discountOf, FREE_SHIPPING, SHIPPING_COST } from './data.js';
import { cartApi, subscribe } from './store.js';
import { navigate } from './router.js';

export const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const icon = (name, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

export function stars(rating) {
  let out = '<span class="stars" aria-label="Note">';
  for (let i = 1; i <= 5; i++) out += `<svg class="icon ${i <= Math.round(rating) ? '' : 'is-off'}" aria-hidden="true"><use href="#i-star"/></svg>`;
  return out + '</span>';
}

export function badges(p) {
  const list = [];
  if (p.oldPrice) list.push(`<span class="badge badge--promo">−${discountOf(p)} %</span>`);
  if (p.badge === 'new') list.push('<span class="badge badge--new">Nouveau</span>');
  if (p.badge === 'best') list.push('<span class="badge badge--best">Bestseller</span>');
  return list.length ? `<div class="card__badges">${list.join('')}</div>` : '';
}

export function priceRow(p, big = false) {
  return `<span class="price">${fmt.format(p.price)}</span>${p.oldPrice ? `<span class="price--old">${fmt.format(p.oldPrice)}</span>` : ''}`;
}

// ---------- Carte produit ----------
export function productCard(p, i = 0) {
  return `
  <article class="card reveal" style="--d:${Math.min(i, 8) * 60}ms">
    <div class="card__media">
      ${badges(p)}
      <img src="${p.img}" alt="${p.name} — ${p.short}" loading="lazy" decoding="async" width="600" height="750">
      <button class="card__quick" data-add="${p.id}" aria-label="Ajouter ${p.name} au panier">
        ${icon('bag')} Ajout rapide
      </button>
    </div>
    <div class="card__body">
      <span class="card__cat">${catLabel(p.cat)}</span>
      <h3 class="card__name"><a href="#/produit/${p.id}">${p.name}</a></h3>
      <div class="card__row">
        <span>${priceRow(p)}</span>
        ${stars(p.rating)}
      </div>
    </div>
  </article>`;
}

// ---------- Toasts ----------
export function toast(msg, ms = 2600) {
  const box = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${icon('check')}<span>${msg}</span>`;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('is-out');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, ms);
}

// ---------- Reveal on scroll ----------
let observer = null;
export function observeReveals(root = document) {
  observer ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); observer.unobserve(e.target); } }),
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
  );
  $$('.reveal:not(.is-in)', root).forEach((el) => observer.observe(el));
}

// ---------- Badge panier ----------
function syncCartBadge(cart) {
  const n = cartApi.count();
  $$('[data-cart-count]').forEach((b) => { b.textContent = n; b.hidden = n === 0; });
  $$('[data-cart-count-txt]').forEach((b) => { b.textContent = n ? `(${n} article${n > 1 ? 's' : ''})` : ''; });
}

// ---------- Drawer mini-panier ----------
export const drawer = {
  open() {
    renderDrawer();
    $('#scrim').hidden = false;
    $('#cartDrawer').hidden = false;
    requestAnimationFrame(() => { $('#scrim').classList.add('is-on'); $('#cartDrawer').classList.add('is-on'); });
    document.body.style.overflow = 'hidden';
  },
  close() {
    $('#scrim').classList.remove('is-on');
    $('#cartDrawer').classList.remove('is-on');
    document.body.style.overflow = '';
    setTimeout(() => { $('#scrim').hidden = true; $('#cartDrawer').hidden = true; }, 450);
  },
};

export function shipMeter(amount) {
  const pct = Math.min(100, (amount / FREE_SHIPPING) * 100);
  const done = amount >= FREE_SHIPPING;
  return `
  <div class="shipmeter ${done ? 'is-done' : ''}">
    <p class="shipmeter__txt">${done
      ? 'Livraison offerte débloquée 🎉'
      : `Plus que <b>${fmt.format(FREE_SHIPPING - amount)}</b> pour la livraison offerte`}</p>
    <div class="shipmeter__bar"><div class="shipmeter__fill" style="width:${pct}%"></div></div>
  </div>`;
}

function lineHtml(l, compact = false) {
  const p = l.product;
  const meta = [l.color ? `Coloris ${l.color}` : null, l.size ? `Taille ${l.size}` : null].filter(Boolean).join(' · ');
  return `
  <div class="cart-item" data-line="${l.key}">
    <a href="#/produit/${p.id}"><img class="cart-item__img" src="${p.img}" alt="${p.name}"></a>
    <div>
      <p class="cart-item__name">${p.name}</p>
      ${meta ? `<p class="cart-item__meta">${meta}</p>` : ''}
      <div class="cart-item__price">
        <span class="price" style="font-size:15px">${fmt.format(p.price * l.qty)}</span>
        ${l.qty > 1 ? `<span class="price--old" style="text-decoration:none">${fmt.format(p.price)} / pièce</span>` : ''}
      </div>
    </div>
    <div class="cart-item__side">
      <div class="qty qty--sm">
        <button data-dec="${l.key}" aria-label="Diminuer la quantité">${icon('minus')}</button>
        <output>${l.qty}</output>
        <button data-inc="${l.key}" aria-label="Augmenter la quantité">${icon('plus')}</button>
      </div>
      <button class="cart-item__remove" data-remove="${l.key}" aria-label="Retirer ${p.name}">${icon('trash')}</button>
    </div>
  </div>`;
}

// Re-rend le contenu tant que le drawer est ouvert (quantités, suppression…)
let drawerPaintBound = false;
function bindDrawerRefresh() {
  if (drawerPaintBound) return;
  drawerPaintBound = true;
  subscribe(() => { if ($('#cartDrawer').classList.contains('is-on')) paintDrawer(); });
}

function renderDrawer() {
  bindDrawerRefresh();
  paintDrawer();
}

function paintDrawer() {
  const lines = cartApi.lines();
  const body = $('#drawerBody');
  const foot = $('#drawerFoot');
  $('#drawerShip').innerHTML = lines.length ? shipMeter(lines.reduce((s, l) => s + l.product.price * l.qty, 0)) : '';
  if (!lines.length) {
    body.innerHTML = `
      <div class="empty">
        ${icon('bag')}
        <h3>Votre panier est vide</h3>
        <p>Explorez la boutique et trouvez votre prochain essentiel.</p>
        <button class="btn btn--sm" id="drawerGoShop">Voir la boutique</button>
      </div>`;
    foot.innerHTML = '';
    $('#drawerGoShop')?.addEventListener('click', () => { drawer.close(); navigate('/boutique'); });
    return;
  }
  body.innerHTML = lines.map((l) => lineHtml(l, true)).join('');
  const { subtotal } = cartApi.totals();
  foot.innerHTML = `
    <div class="summary__row"><span>Sous-total</span><b>${fmt.format(subtotal)}</b></div>
    <div class="summary__row" style="font-size:12.5px;color:var(--muted)"><span>Livraison calculée à l'étape suivante</span></div>
    <button class="btn btn--accent btn--block" id="drawerCheckout">Passer commande ${icon('arrow')}</button>
    <button class="btn btn--ghost btn--block btn--sm" id="drawerSeeCart">Voir le panier détaillé</button>`;
  $('#drawerCheckout').addEventListener('click', () => { drawer.close(); navigate('/panier'); });
  $('#drawerSeeCart').addEventListener('click', () => { drawer.close(); navigate('/panier'); });
}

// ---------- Modale générique ----------
export function modal(html) {
  const scrim = $('#scrim');
  scrim.hidden = false;
  scrim.classList.add('is-on');
  document.body.style.overflow = 'hidden';
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `<div class="modal__card" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  const close = () => {
    scrim.classList.remove('is-on');
    document.body.style.overflow = '';
    setTimeout(() => (scrim.hidden = true), 300);
    wrap.remove();
  };
  scrim.addEventListener('click', close, { once: true });
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  return { close, root: wrap };
}

// ---------- Délégation globale (ajout, qty, suppression) ----------
export function bindGlobalActions() {
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      cartApi.add(add.dataset.add);
      toast('Ajouté au panier');
      drawer.open();
      return;
    }
    const inc = e.target.closest('[data-inc]');
    if (inc) { const l = lineByKey(inc.dataset.inc); if (l) cartApi.setQty(inc.dataset.inc, l.qty + 1); return; }
    const dec = e.target.closest('[data-dec]');
    if (dec) { const l = lineByKey(dec.dataset.dec); if (l) cartApi.setQty(dec.dataset.dec, l.qty - 1); return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) { cartApi.remove(rm.dataset.remove); toast('Article retiré'); return; }
    const hint = e.target.closest('[data-toast]');
    if (hint) { e.preventDefault(); toast(hint.dataset.toast, 4200); }
  });
}

const lineByKey = (key) => cartApi.lines().find((l) => l.key === key);

// ---------- Init header / recherche / install ----------
export function initChrome() {
  // Ombre du header au scroll
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Recherche (desktop + mobile)
  const bindSearch = (formSel, inputSel) => {
    const form = $(formSel);
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $(inputSel).value.trim();
      navigate(`/boutique${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      $(inputSel).blur();
      $('#searchFormMobile').hidden = true;
    });
  };
  bindSearch('#searchFormDesktop', '#searchInputDesktop');
  bindSearch('#searchFormMobile', '#searchInputMobile');

  $('#searchToggle')?.addEventListener('click', () => {
    const bar = $('#searchFormMobile');
    bar.hidden = !bar.hidden;
    if (!bar.hidden) $('#searchInputMobile').focus();
  });
  $('#searchClose')?.addEventListener('click', () => ($('#searchFormMobile').hidden = true));

  // Fermeture drawer via scrim + croix
  $('#drawerClose').addEventListener('click', drawer.close);
  $('#scrim').addEventListener('click', () => { if ($('#cartDrawer').classList.contains('is-on')) drawer.close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#cartDrawer').hidden) drawer.close(); });

  // Badge + footer liens démo
  subscribe(syncCartBadge);

  // Installation PWA
  let deferredPrompt = null;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    ['#btnInstallTop', '#btnInstallFooter'].forEach((s) => { const b = $(s); if (b) b.hidden = false; });
  });
  ['#btnInstallTop', '#btnInstallFooter'].forEach((s) =>
    $(s)?.addEventListener('click', async () => {
      if (!deferredPrompt) return toast("L'installation se fait depuis le menu du navigateur.");
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $$('#btnInstallTop, #btnInstallFooter').forEach((b) => (b.hidden = true));
    })
  );
  addEventListener('appinstalled', () => toast('Application installée — bienvenue !'));
}

// ---------- Nav active ----------
export function highlightNav(route) {
  const map = { home: 'home', shop: route.query.promo ? 'promo' : 'shop', cart: 'cart', product: 'shop' };
  const active = map[route.name] || '';
  $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === active));
}
