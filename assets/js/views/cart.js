// ==========================================================
// NUANCE — Vue Panier + commande (démo)
// ==========================================================
import { FREE_SHIPPING, SHIPPING_COST } from '../data.js';
import { fmt, icon, toast, modal, shipMeter, $, $$ } from '../ui.js';
import { cartApi, subscribe } from '../store.js';
import { navigate } from '../router.js';

function lineHtml(l) {
  const p = l.product;
  const meta = [l.color ? `Coloris ${l.color}` : null, l.size ? `Taille ${l.size}` : null].filter(Boolean).join(' · ');
  return `
  <div class="cart-item" data-line="${l.key}">
    <a href="#/produit/${p.id}"><img class="cart-item__img" src="${p.img}" alt="${p.name}"></a>
    <div>
      <span class="card__cat">${p.cat}</span>
      <p class="cart-item__name"><a href="#/produit/${p.id}">${p.name}</a></p>
      ${meta ? `<p class="cart-item__meta">${meta}</p>` : ''}
      <div class="cart-item__price">
        <span class="price" style="font-size:16px">${fmt.format(p.price * l.qty)}</span>
        ${p.oldPrice ? `<span class="price--old">${fmt.format(p.oldPrice * l.qty)}</span>` : ''}
      </div>
    </div>
    <div class="cart-item__side">
      <button class="cart-item__remove" data-remove="${l.key}" aria-label="Retirer ${p.name}">${icon('trash')}</button>
      <div class="qty qty--sm">
        <button data-dec="${l.key}" aria-label="Diminuer la quantité">${icon('minus')}</button>
        <output>${l.qty}</output>
        <button data-inc="${l.key}" aria-label="Augmenter la quantité">${icon('plus')}</button>
      </div>
    </div>
  </div>`;
}

export function renderCart(app) {
  const render = () => {
    if (!location.hash.startsWith('#/panier')) return unsub();
    const lines = cartApi.lines();
    const t = cartApi.totals();

    if (!lines.length) {
      app.innerHTML = `
      <section class="section"><div class="container">
        <div class="empty" style="padding-top:60px">
          ${icon('bag')}
          <h1 class="section__title" style="max-width:none">Votre panier est vide</h1>
          <p>Il n'attend que vous — parcourez notre sélection.</p>
          <a class="btn" href="#/boutique">Découvrir la boutique ${icon('arrow')}</a>
        </div>
      </div></section>`;
      return;
    }

    const shipping = t.afterDiscount >= FREE_SHIPPING ? 0 : SHIPPING_COST;
    const total = t.afterDiscount + shipping;

    app.innerHTML = `
    <section class="section" style="padding-top:clamp(28px,4vw,44px)">
      <div class="container">
        <span class="eyebrow">Commande</span>
        <h1 class="section__title" style="max-width:none;margin-bottom:clamp(22px,3vw,34px)">Panier <span style="color:var(--muted);font-size:.55em;vertical-align:middle">(${cartApi.count()} article${cartApi.count() > 1 ? 's' : ''})</span></h1>

        <div class="cart-layout">
          <div>
            ${shipMeter(t.afterDiscount)}
            <div class="cart-list" style="margin-top:8px">${lines.map(lineHtml).join('')}</div>
            <p style="margin-top:18px"><a class="link-arrow" href="#/boutique" style="rotate:180deg;display:inline-flex"><span style="rotate:180deg;display:inline-flex;align-items:center;gap:8px">Continuer mes achats ${icon('arrow')}</span></a></p>
          </div>

          <aside class="summary" aria-label="Récapitulatif">
            <h3>Récapitulatif</h3>

            <form class="promo-form" id="promoForm">
              <input type="text" id="promoInput" placeholder="Code promo" value="${t.promo?.code ?? ''}" ${t.promo ? 'disabled' : ''} aria-label="Code promo">
              ${t.promo
                ? `<button type="button" class="btn btn--ghost" id="promoRemove" aria-label="Retirer le code">${icon('close')}</button>`
                : `<button class="btn" type="submit">Appliquer</button>`}
            </form>
            ${t.promo
              ? `<p class="promo-hint">${icon('check', 'icon')} Code <code>${t.promo.code}</code> appliqué — ${t.promo.label}</p>`
              : `<p class="promo-hint">Essayez <code>NOVA10</code> pour −10 % de bienvenue.</p>`}

            <div class="summary__row"><span>Sous-total</span><b>${fmt.format(t.subtotal)}</b></div>
            ${t.promo ? `<div class="summary__row"><span>Remise ${t.promo.code}</span><b class="accent">−${fmt.format(t.discount)}</b></div>` : ''}
            <div class="summary__row"><span>Livraison</span>${shipping === 0 ? '<b class="ok">Offerte</b>' : `<b>${fmt.format(shipping)}</b>`}</div>
            <div class="summary__row summary__row--total"><span>Total</span><span>${fmt.format(total)}</span></div>

            <button class="btn btn--accent btn--block" id="checkoutBtn" style="margin-top:4px">
              ${icon('shield')} Passer commande — ${fmt.format(total)}
            </button>
            <p class="promo-hint" style="text-align:center">Paiement sécurisé · Débit différé à l'expédition</p>
          </aside>
        </div>
      </div>
    </section>`;

    // ----- promo -----
    $('#promoForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = cartApi.setPromo($('#promoInput').value);
      if (r.ok) toast(`Code ${r.code} appliqué`);
      else toast('Code invalide — essayez NOVA10');
    });
    $('#promoRemove')?.addEventListener('click', () => cartApi.setPromo(null));

    // ----- commande (démo) -----
    $('#checkoutBtn')?.addEventListener('click', () => {
      const m = modal(`
        <div class="modal__check">${icon('check')}</div>
        <h3>Commande confirmée</h3>
        <p>Merci ! Ceci est une démonstration — aucun paiement n'a été effectué. Votre panier a été vidé.</p>
        <span class="order-id">N° NU-${Math.floor(100000 + Math.random() * 900000)}</span>
        <button class="btn btn--block" id="modalContinue" style="margin-top:8px">Continuer mes achats</button>`);
      cartApi.clear();
      m.root.querySelector('#modalContinue').addEventListener('click', () => { m.close(); navigate('/boutique'); });
    });
  };

  const unsub = subscribe(render);
}
