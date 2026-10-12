// ==========================================================
// NUANCE — Vue Produit
// ==========================================================
import { byId, catLabel, discountOf, PRODUCTS, byCat } from '../data.js';
import { fmt, badges, stars, priceRow, productCard, icon, toast, drawer, observeReveals, $, $$ } from '../ui.js';
import { cartApi, wish } from '../store.js';
import { navigate } from '../router.js';

export function renderProduct(app, route) {
  const p = byId(route.params.id);
  if (!p) {
    app.innerHTML = `
    <section class="section"><div class="container">
      <div class="empty">${icon('search')}
        <h3>Produit introuvable</h3>
        <p>Cette référence n'existe plus ou a été déplacée.</p>
        <a class="btn btn--sm" href="#/boutique">Retour à la boutique</a>
      </div>
    </div></section>`;
    return;
  }

  const related = [...byCat(p.cat).filter((x) => x.id !== p.id), ...PRODUCTS.filter((x) => x.cat !== p.cat)].slice(0, 4);
  const inWish = wish.has(p.id);

  app.innerHTML = `
  <section class="section" style="padding-top:clamp(24px,3.5vw,40px)">
    <div class="container">
      <nav class="breadcrumbs" aria-label="Fil d'Ariane">
        <a href="#/">Accueil</a> ${icon('chevron')}
        <a href="#/boutique">Boutique</a> ${icon('chevron')}
        <a href="#/boutique?cat=${p.cat}">${catLabel(p.cat)}</a> ${icon('chevron')}
        <span aria-current="page">${p.name}</span>
      </nav>

      <div class="product">
        <!-- ===== Visuel ===== -->
        <div class="product__media reveal is-in">
          <div class="product__frame">
            ${badges(p)}
            <img src="${p.img}" alt="${p.name} — ${p.short}" fetchpriority="high">
          </div>
        </div>

        <!-- ===== Infos ===== -->
        <div class="product__info">
          <div class="reveal is-in">
            <span class="eyebrow">${catLabel(p.cat)}</span>
            <h1 class="product__title" style="margin-top:10px">${p.name}</h1>
          </div>

          <div class="product__rating">
            ${stars(p.rating)} <span><b>${String(p.rating).replace('.', ',')}</b> · ${p.reviews} avis vérifiés</span>
          </div>

          <div class="product__price">
            ${priceRow(p, true)}
            ${p.oldPrice ? `<span class="badge badge--promo">Économisez ${discountOf(p)} %</span>` : ''}
          </div>

          <p class="product__desc">${p.desc}</p>

          ${p.colors ? `
          <div class="opt">
            <p class="opt__label">Coloris <output id="colorOut">— ${p.colors[0].n}</output></p>
            <div class="swatches" id="swatches">
              ${p.colors.map((c, i) => `<button class="swatch ${i === 0 ? 'is-on' : ''}" style="background:${c.h}" data-color="${c.n}" aria-label="Coloris ${c.n}" aria-pressed="${i === 0}"></button>`).join('')}
            </div>
          </div>` : ''}

          ${p.sizes ? `
          <div class="opt">
            <p class="opt__label">Taille (UE) <button class="filters__reset" data-toast="Guide : nos modèles taillent normalement. Entre deux tailles, prenez la plus grande.">Guide des tailles</button></p>
            <div class="sizes" id="sizes">
              ${p.sizes.map((s, i) => `<button class="size ${i === Math.floor(p.sizes.length / 2) ? 'is-on' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>` : ''}

          <div class="buy-row">
            <div class="qty" aria-label="Quantité">
              <button id="qtyMinus" aria-label="Diminuer">${icon('minus')}</button>
              <output id="qtyOut">1</output>
              <button id="qtyPlus" aria-label="Augmenter">${icon('plus')}</button>
            </div>
            <button class="btn btn--accent btn--buy" id="buyBtn">
              ${icon('bag')} <span>Ajouter — <b id="buyPrice">${fmt.format(p.price)}</b></span>
            </button>
            <button class="icon-btn ${inWish ? 'is-on' : ''}" id="wishBtn" aria-label="Ajouter aux favoris" style="border:1.5px solid var(--line);color:${inWish ? 'var(--accent)' : 'inherit'}">
              ${icon('heart')}
            </button>
          </div>

          <div class="trust">
            <span>${icon('truck')} Expédié sous 24 h</span>
            <span>${icon('return')} Retours 30 jours</span>
            <span>${icon('shield')} Garantie 2 ans min.</span>
          </div>

          <div class="accordion">
            <details open>
              <summary>Détails & matériaux ${icon('chevron')}</summary>
              <div class="accordion__body"><ul>${p.details.map((d) => `<li>${d}</li>`).join('')}</ul></div>
            </details>
            <details>
              <summary>Livraison & retours ${icon('chevron')}</summary>
              <div class="accordion__body">
                Livraison suivie 48–72 h en France métropolitaine (offerte dès 80 €, sinon 6,90 €).
                Retours gratuits sous 30 jours : l'étiquette retour est incluse dans chaque colis.
              </div>
            </details>
            <details>
              <summary>Authenticité & garantie ${icon('chevron')}</summary>
              <div class="accordion__body">
                Chaque pièce est contrôlée à la main dans notre atelier avant expédition.
                Garantie Nuance : réparation ou remplacement pendant 2 ans minimum.
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- ===== Voir aussi ===== -->
      <div style="margin-top:clamp(52px,7vw,84px)">
        <div class="section__head reveal">
          <div>
            <span class="eyebrow">Complétez le look</span>
            <h2 class="section__title">Vous aimerez aussi</h2>
          </div>
          <a class="link-arrow" href="#/boutique?cat=${p.cat}">Tout le rayon ${catLabel(p.cat)} ${icon('arrow')}</a>
        </div>
        <div class="grid-products">${related.map((x, i) => productCard(x, i)).join('')}</div>
      </div>
    </div>
  </section>`;

  // ----- état local -----
  let qty = 1;
  let color = p.colors ? p.colors[0].n : null;
  let size = p.sizes ? (app.querySelector('.size.is-on')?.dataset.size ?? p.sizes[0]) : null;

  const updateCta = () => { $('#buyPrice').textContent = fmt.format(p.price * qty); $('#qtyOut').textContent = qty; };

  $('#qtyMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); updateCta(); });
  $('#qtyPlus').addEventListener('click', () => { qty = Math.min(99, qty + 1); updateCta(); });

  $$('#swatches .swatch', app).forEach((s) => s.addEventListener('click', () => {
    color = s.dataset.color;
    $$('#swatches .swatch', app).forEach((x) => { x.classList.toggle('is-on', x === s); x.setAttribute('aria-pressed', x === s); });
    $('#colorOut').textContent = `— ${color}`;
  }));

  $$('#sizes .size', app).forEach((s) => s.addEventListener('click', () => {
    size = s.dataset.size;
    $$('#sizes .size', app).forEach((x) => x.classList.toggle('is-on', x === s));
  }));

  $('#buyBtn').addEventListener('click', () => {
    cartApi.add(p.id, { qty, size, color });
    toast('Ajouté au panier');
    drawer.open();
  });

  $('#wishBtn').addEventListener('click', (e) => {
    const on = wish.toggle(p.id);
    e.currentTarget.style.color = on ? 'var(--accent)' : '';
    toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
  });

  observeReveals(app);
}
