// ==========================================================
// NUANCE — Bootstrap de l'application
// ==========================================================
import { startRouter, onRoute } from './router.js';
import { initChrome, bindGlobalActions, highlightNav, observeReveals } from './ui.js';
import { renderHome } from './views/home.js';
import { renderShop } from './views/catalog.js';
import { renderProduct } from './views/product.js';
import { renderCart } from './views/cart.js';

const app = document.getElementById('app');

const VIEWS = {
  home: renderHome,
  shop: renderShop,
  product: renderProduct,
  cart: renderCart,
};

const TITLES = {
  home: 'NUANCE — Concept Store',
  shop: 'Boutique — NUANCE',
  product: 'NUANCE',
  cart: 'Panier — NUANCE',
};

onRoute((route) => {
  scrollTo({ top: 0, behavior: 'auto' });
  (VIEWS[route.name] ?? renderHome)(app, route);
  document.title = TITLES[route.name] ?? TITLES.home;
  highlightNav(route);
  observeReveals(app);
});

initChrome();
bindGlobalActions();
startRouter();

// ------ Service Worker (PWA) ------
if ('serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW:', err));
  });
}
