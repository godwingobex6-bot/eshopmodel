// ==========================================================
// NUANCE — Store : panier persistant (localStorage) + pub/sub
// ==========================================================
import { byId, PROMO_CODES } from './data.js';

const KEY = 'nuance.cart.v1';
const WISH_KEY = 'nuance.wishlist.v1';

const load = (k, fb) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; }
};

let cart = load(KEY, { lines: [], promo: null }); // ligne : { id, qty, size, color }
let wishlist = load(WISH_KEY, []);
const listeners = new Set();

const persist = () => {
  localStorage.setItem(KEY, JSON.stringify(cart));
  listeners.forEach((fn) => fn(cart));
};

export const subscribe = (fn) => { listeners.add(fn); fn(cart); return () => listeners.delete(fn); };

const keyOf = (l) => `${l.id}|${l.size ?? ''}|${l.color ?? ''}`;

export const wish = {
  list: () => wishlist,
  has: (id) => wishlist.includes(id),
  toggle(id) {
    wishlist = wish.has(id) ? wishlist.filter((w) => w !== id) : [...wishlist, id];
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    return wishlist.includes(id);
  },
};

export const cartApi = {
  lines: () => cart.lines.map((l) => ({ ...l, key: keyOf(l), product: byId(l.id) })).filter((l) => l.product),

  add(id, { qty = 1, size = null, color = null } = {}) {
    const line = { id, qty, size, color };
    const found = cart.lines.find((l) => keyOf(l) === keyOf(line));
    if (found) found.qty = Math.min(found.qty + qty, 99);
    else cart.lines.push(line);
    persist();
    return true;
  },

  setQty(key, qty) {
    const l = cart.lines.find((x) => keyOf(x) === key);
    if (!l) return;
    l.qty = qty;
    if (l.qty <= 0) cart.lines = cart.lines.filter((x) => keyOf(x) !== key);
    if (l.qty > 99) l.qty = 99;
    persist();
  },

  remove(key) {
    cart.lines = cart.lines.filter((x) => keyOf(x) !== key);
    persist();
  },

  clear() { cart = { lines: [], promo: null }; persist(); },

  setPromo(code) {
    const c = (code || '').trim().toUpperCase();
    if (!c) { cart.promo = null; persist(); return { ok: true }; }
    if (PROMO_CODES[c]) { cart.promo = c; persist(); return { ok: true, code: c }; }
    return { ok: false };
  },
  promo: () => (cart.promo ? { code: cart.promo, ...PROMO_CODES[cart.promo] } : null),

  count: () => cart.lines.reduce((n, l) => n + l.qty, 0),

  totals() {
    const lines = this.lines();
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const promo = this.promo();
    const discount = promo ? subtotal * promo.rate : 0;
    return { subtotal, discount, promo, afterDiscount: subtotal - discount };
  },
};
