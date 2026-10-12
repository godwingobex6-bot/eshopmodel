# NUANCE — Concept Store (PWA e-commerce)

Application e-commerce moderne, minimaliste et responsive, construite en **vanilla JS (ES modules) + CSS**, installable en **PWA** — sans framework ni étape de build.

## Fonctionnalités

- **Accueil éditorial** : hero, catégories, nouveautés, bandeau promo, bestsellers, newsletter
- **Boutique** : filtres (catégorie, promos, prix max), tri, recherche — état synchronisé dans l'URL (`#/boutique?cat=sacs&promo=1`)
- **Fiche produit** : coloris, tailles, quantité, accordéons, produits liés, favoris
- **Panier persistant** (localStorage) : quantités, code promo (`NOVA10`, `NUANCE15`), livraison offerte dès 80 €, modale de confirmation
- **Mini-panier** coulissant, toasts, badge panier, barre d'onglets mobile
- **PWA** : manifest, service worker (app-shell hors-ligne, cache polices), icônes maskable, bouton d'installation
- Responsive : desktop, tablette, mobile — `prefers-reduced-motion` respecté

## Lancer en local

```bash
python3 server.py        # http://localhost:8080
# ou : npx serve .
```

> Le service worker nécessite un contexte sécurisé (localhost ou HTTPS).

## Structure

```
├── index.html              # coquille (header, footer, drawer, sprites SVG)
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # service worker (offline-first)
├── server.py               # serveur de dev (MIME manifest/JS corrects)
├── assets/
│   ├── css/styles.css      # design system complet
│   ├── js/
│   │   ├── app.js          # bootstrap + routeur → vues
│   │   ├── data.js         # catalogue (remplaçable par une API)
│   │   ├── store.js        # panier + favoris (localStorage, pub/sub)
│   │   ├── router.js       # routeur hash + query
│   │   ├── ui.js           # composants partagés (cartes, toasts, drawer…)
│   │   └── views/          # home.js · catalog.js · product.js · cart.js
│   ├── img/products/       # visuels produits
│   └── icons/              # icônes PWA (tools/genicons.py)
└── tools/genicons.py       # régénère les icônes (Pillow)
```

## Évolution vers une vraie boutique

- `data.js` expose déjà `PRODUCTS` / `CATEGORIES` / `PROMO_CODES` : à brancher sur une API ou un CMS headless
- `store.js` isole l'état panier : branchable sur un checkout (Stripe, Adyen…)
- Bump de version du cache : constante `VERSION` dans `sw.js`
