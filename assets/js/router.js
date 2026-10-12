// ==========================================================
// NUANCE — Mini routeur par hash
// Routes : #/ · #/boutique · #/produit/:id · #/panier
// Query string supportée : #/boutique?cat=sacs&promo=1&q=tote
// ==========================================================

const routeDef = [
  { re: /^\/?$/, name: 'home' },
  { re: /^boutique$/, name: 'shop' },
  { re: /^produit\/([\w-]+)$/, name: 'product', keys: ['id'] },
  { re: /^panier$/, name: 'cart' },
];

export function parseRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const path = pathPart.replace(/^\/+|\/+$/g, '');
  const query = Object.fromEntries(new URLSearchParams(queryPart));

  for (const r of routeDef) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      (r.keys || []).forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { name: r.name, params, query };
    }
  }
  return { name: 'home', params: {}, query };
}

let handler = () => {};
export const onRoute = (fn) => { handler = fn; };
export const emitRoute = () => handler(parseRoute());

export function navigate(path, { replace = false } = {}) {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (replace) {
    history.replaceState(null, '', target);
    emitRoute();
  } else if (location.hash === target) {
    emitRoute();
  } else {
    location.hash = target; // déclenche hashchange
  }
}

export function startRouter() {
  window.addEventListener('hashchange', emitRoute);
  emitRoute();
}
