// ==========================================================
// NUANCE — Vue Accueil
// ==========================================================
import { CATEGORIES, PRODUCTS } from '../data.js';
import { productCard, icon, observeReveals, toast } from '../ui.js';

const underline = `<svg viewBox="0 0 120 12" fill="none" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9C30 3 70 2 118 6.5" stroke="#C05A2B" stroke-width="3.5" stroke-linecap="round" opacity=".55"/></svg>`;

export function renderHome(app) {
  const news = [...PRODUCTS.filter((p) => p.badge === 'new'), ...PRODUCTS.filter((p) => !p.badge)].slice(0, 4);
  const best = [...PRODUCTS.filter((p) => p.badge === 'best'), ...PRODUCTS.filter((p) => p.badge === null)].slice(0, 4);
  const heroPick = PRODUCTS.find((p) => p.id === 'meridian');

  app.innerHTML = `
  <!-- ================= HERO ================= -->
  <section class="hero">
    <div class="container hero__grid">
      <div>
        <span class="eyebrow reveal">Concept store — depuis 2019</span>
        <h1 class="reveal" style="--d:80ms">Des essentiels<br>pensés pour <em>durer${underline}</em></h1>
        <p class="hero__lead reveal" style="--d:160ms">
          Une sélection courte et exigeante : sneakers, maroquinerie, montres et accessoires.
          Peu de références, aucune concession sur les matériaux.
        </p>
        <div class="hero__cta reveal" style="--d:240ms">
          <a href="#/boutique" class="btn">Découvrir la boutique ${icon('arrow')}</a>
          <a href="#/boutique?promo=1" class="btn btn--ghost">Voir les promos</a>
        </div>
        <div class="hero__stats reveal" style="--d:320ms">
          <div><b>10</b><span>références choisies</span></div>
          <div><b>4,8/5</b><span>note moyenne</span></div>
          <div><b>72 h</b><span>livraison suivie</span></div>
        </div>
      </div>
      <div class="hero__visual reveal" style="--d:200ms">
        <div class="hero__img-main">
          <img src="assets/img/products/velocity.jpg" alt="Sneaker Velocity Knit — sélection Nuance" fetchpriority="high">
        </div>
        <a href="#/produit/${heroPick.id}" class="hero__float hero__float--a">
          <img src="${heroPick.img}" alt="${heroPick.name}">
          <span><small>${heroPick.short}</small><b>${heroPick.name} — 189 €</b></span>
        </a>
        <div class="hero__float hero__float--b">
          ${[1,2,3,4,5].map(() => '<svg class="icon" style="color:#D9904A;fill:currentColor"><use href="#i-star"/></svg>').join('')}
          <span style="font-size:12.5px"><b>2 000+</b> avis</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ================= CATÉGORIES ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section__head reveal">
        <div>
          <span class="eyebrow">Rayons</span>
          <h2 class="section__title">Quatre univers, une exigence</h2>
        </div>
        <a class="link-arrow" href="#/boutique">Tout parcourir ${icon('arrow')}</a>
      </div>
      <div class="cat-grid">
        ${CATEGORIES.map((c, i) => `
        <a href="#/boutique?cat=${c.id}" class="cat-card reveal" style="--d:${i * 70}ms">
          <img src="${c.img}" alt="Catégorie ${c.label}" loading="lazy">
          <span class="cat-card__go">${icon('arrow')}</span>
          <div class="cat-card__info">
            <h3>${c.label}</h3>
            <span>${c.tagline}</span>
          </div>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <!-- ================= NOUVEAUTÉS ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section__head reveal">
        <div>
          <span class="eyebrow">Fraîchement arrivés</span>
          <h2 class="section__title">Les nouveautés</h2>
        </div>
        <a class="link-arrow" href="#/boutique?sort=new">Toutes les nouveautés ${icon('arrow')}</a>
      </div>
      <div class="grid-products">${news.map((p, i) => productCard(p, i)).join('')}</div>
    </div>
  </section>

  <!-- ================= PROMO ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="promo-banner reveal">
        <div>
          <span class="eyebrow">Offre limitée</span>
          <h2>Jusqu'à <mark>−20 %</mark> sur une sélection d'icônes</h2>
          <p>Runner technique, besace en cuir, casque audio : nos icônes du moment à prix doux, jusqu'à épuisement du stock.</p>
          <a href="#/boutique?promo=1" class="btn btn--accent">J'en profite ${icon('arrow')}</a>
        </div>
        <a href="#/boutique?promo=1" class="promo-banner__visual" aria-label="Voir les promotions">
          <img src="assets/img/products/odyssey.jpg" alt="Besace Odyssey en cuir cognac — promotion" loading="lazy">
          <span class="promo-banner__tag">−18 %</span>
        </a>
      </div>
    </div>
  </section>

  <!-- ================= BESTSELLERS ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section__head reveal">
        <div>
          <span class="eyebrow">Les préférés</span>
          <h2 class="section__title">Ils les ont adoptés</h2>
        </div>
        <a class="link-arrow" href="#/boutique?sort=rating">Voir le classement ${icon('arrow')}</a>
      </div>
      <div class="grid-products">${best.map((p, i) => productCard(p, i)).join('')}</div>
    </div>
  </section>

  <!-- ================= VALEURS ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="values">
        ${[
          ['truck', 'Livraison 48–72 h', 'Suivie et soignée. Offerte dès 80 € d’achat en France métropolitaine.'],
          ['return', 'Retours 30 jours', 'Changement d’avis ? Retour gratuit et remboursement sous 5 jours.'],
          ['shield', 'Garantie Nuance', 'Tous nos produits sont garantis au moins 2 ans — certains à vie.'],
          ['headset', 'Support humain', 'Une question ? Une vraie personne vous répond en moins de 24 h.'],
        ].map(([ic, t, d], i) => `
        <div class="value reveal" style="--d:${i * 70}ms">${icon(ic)}<b>${t}</b><p>${d}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ================= NEWSLETTER ================= -->
  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="newsletter reveal">
        <span class="eyebrow">La lettre Nuance</span>
        <h2>−10 % sur votre première commande</h2>
        <p>Une fois par mois : nouveautés, coulisses et accès anticipés aux ventes. Jamais de spam, désinscription en un clic.</p>
        <form id="newsletterForm">
          <input type="email" required placeholder="votre@email.fr" aria-label="Votre adresse email">
          <button class="btn" type="submit">S'inscrire</button>
        </form>
      </div>
    </div>
  </section>`;

  app.querySelector('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    toast(`Merci ! Code NOVA10 envoyé à ${input.value}`);
    input.value = '';
  });
  observeReveals(app);
}
