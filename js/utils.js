export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const $ = (sel, root = document) => root.querySelector(sel);
export const fmtMoney = (n) => `GHC ${Number(n||0).toFixed(2)}`;
export const uid = (p = "") => p + Math.random().toString(36).slice(2,7) + Date.now().toString(36).slice(-4);
export const now = () => Date.now();
export const minutesFromNow = (m)=> now() + m*60*1000;
export const qs = new URLSearchParams(location.search);
export const timeLeft = (ts) => Math.max(0, ts - now());
export const formatDuration = (ms) => {
  const s = Math.ceil(ms/1000);
  const m = Math.floor(s/60), sec = s%60, h = Math.floor(m/60), mm = m%60;
  return h>0 ? `${h}h ${mm}m` : `${mm}m ${sec}s`;
};
export const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
