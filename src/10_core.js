/* ===================== CORE: utils, save, pixel rasterizer, bitmap font ===================== */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const approach = (v, t, k) => v + (t - v) * (1 - Math.exp(-k));
const cv = $('#cv');
let g = cv.getContext('2d', { alpha: false });
let GW = 320; const GH = 240;
let T = 0, DT = 0;                  // global time (s)
let IS_TOUCH = false;
const COARSE = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
const FORCE_TOUCH = /[?&]touch=1/.test(location.search);

/* ---------- save ---------- */
const SAVE_KEY = 'careys_punchout_v1';
const S = { musicVol: 0.55, sfxVol: 0.9, mute: false, voice: true, hints: true, shake: true, unlocked: 0, rec: {}, champ: false, sel: 0, fights: 0 };
function loadSave() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); for (const k in S) if (d[k] !== undefined) S[k] = d[k]; } catch (e) { } }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function rec(id) { return S.rec[id] || (S.rec[id] = { w: 0, l: 0, ko: 0 }); }

/* ---------- pixel rasterizer (integer spans -> crisp chunky pixels, no antialiasing) ---------- */
let FILL = '';
function col(c) { if (c !== FILL) { g.fillStyle = c; FILL = c; } }
function R(x, y, w, h, c) { col(c); g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function E(cx, cy, rx, ry, c) {
  if (rx < 0.5 || ry < 0.5) return; col(c);
  const y0 = Math.round(cy - ry), y1 = Math.round(cy + ry);
  for (let y = y0; y < y1; y++) {
    const dy = (y + 0.5 - cy) / ry, k = 1 - dy * dy; if (k <= 0) continue;
    const hw = rx * Math.sqrt(k), xa = Math.round(cx - hw), xb = Math.round(cx + hw);
    if (xb > xa) g.fillRect(xa, y, xb - xa, 1);
  }
}
function EO(cx, cy, rx, ry, c, o = '#000', w = 1) { E(cx, cy, rx + w, ry + w, o); E(cx, cy, rx, ry, c); }
// half ellipse (top or bottom)
function EH(cx, cy, rx, ry, c, top) {
  col(c); const y0 = Math.round(top ? cy - ry : cy), y1 = Math.round(top ? cy : cy + ry);
  for (let y = y0; y < y1; y++) { const dy = (y + 0.5 - cy) / ry, k = 1 - dy * dy; if (k <= 0) continue; const hw = rx * Math.sqrt(k), xa = Math.round(cx - hw), xb = Math.round(cx + hw); if (xb > xa) g.fillRect(xa, y, xb - xa, 1); }
}
function P(pts, c) { // scanline polygon fill (even-odd), pts = [x0,y0,x1,y1,...]
  const n = pts.length >> 1; if (n < 3) return; col(c);
  let mn = 1e9, mx = -1e9; for (let i = 1; i < pts.length; i += 2) { if (pts[i] < mn) mn = pts[i]; if (pts[i] > mx) mx = pts[i]; }
  const xs = [];
  for (let y = Math.round(mn); y < Math.round(mx); y++) {
    const yc = y + 0.5; xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = pts[i * 2], yi = pts[i * 2 + 1], xj = pts[j * 2], yj = pts[j * 2 + 1];
      if ((yi <= yc && yj > yc) || (yj <= yc && yi > yc)) xs.push(xi + (yc - yi) * (xj - xi) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
  }
}
function PO(pts, c, o = '#000') { // polygon with 1px outline (approx: offset copies)
  const sh = (dx, dy) => pts.map((v, i) => v + (i & 1 ? dy : dx));
  P(sh(-1, 0), o); P(sh(1, 0), o); P(sh(0, -1), o); P(sh(0, 1), o); P(pts, c);
}
// tapered limb from (x1,y1,r1) to (x2,y2,r2)
function LIMB(x1, y1, r1, x2, y2, r2, c) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  P([x1 + nx * r1, y1 + ny * r1, x2 + nx * r2, y2 + ny * r2, x2 - nx * r2, y2 - ny * r2, x1 - nx * r1, y1 - ny * r1], c);
  E(x1, y1, r1, r1, c); E(x2, y2, r2, r2, c);
}
function LIMBO(x1, y1, r1, x2, y2, r2, c, o = '#000') { LIMB(x1, y1, r1 + 1, x2, y2, r2 + 1, o); LIMB(x1, y1, r1, x2, y2, r2, c); }
function LN(x0, y0, x1, y1, c, w = 1) { // bresenham
  col(c); x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, n = 0;
  for (; ;) { g.fillRect(x0 - (w >> 1), y0 - (w >> 1), w, w); if ((x0 === x1 && y0 === y1) || n++ > 600) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function PX(x, y, c) { col(c); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function shade(hex, k) { // k<0 darker, k>0 lighter
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), gg = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  if (k < 0) { r *= 1 + k; gg *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; }
  const h = v => ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); return '#' + h(r) + h(gg) + h(b);
}
const SHC = {}; function sh(hex, k) { const key = hex + k; return SHC[key] || (SHC[key] = shade(hex, k)); }
function star(cx, cy, r, c, o) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i & 1 ? r * 0.45 : r; p.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } if (o) PO(p, c, o); else P(p, c); }
function burst(cx, cy, r, c, n = 8, inner = 0.5) { const p = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + T * 2, rr = i & 1 ? r * inner : r; p.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } P(p, c); }

/* ---------- bitmap font (5x7) ---------- */
const FONT_SRC = {
  'A': '01110 10001 10001 11111 10001 10001 10001', 'B': '11110 10001 10001 11110 10001 10001 11110', 'C': '01110 10001 10000 10000 10000 10001 01110',
  'D': '11110 10001 10001 10001 10001 10001 11110', 'E': '11111 10000 10000 11110 10000 10000 11111', 'F': '11111 10000 10000 11110 10000 10000 10000',
  'G': '01110 10001 10000 10111 10001 10001 01111', 'H': '10001 10001 10001 11111 10001 10001 10001', 'I': '01110 00100 00100 00100 00100 00100 01110',
  'J': '00111 00010 00010 00010 00010 10010 01100', 'K': '10001 10010 10100 11000 10100 10010 10001', 'L': '10000 10000 10000 10000 10000 10000 11111',
  'M': '10001 11011 10101 10101 10001 10001 10001', 'N': '10001 10001 11001 10101 10011 10001 10001', 'O': '01110 10001 10001 10001 10001 10001 01110',
  'P': '11110 10001 10001 11110 10000 10000 10000', 'Q': '01110 10001 10001 10001 10101 10010 01101', 'R': '11110 10001 10001 11110 10100 10010 10001',
  'S': '01111 10000 10000 01110 00001 00001 11110', 'T': '11111 00100 00100 00100 00100 00100 00100', 'U': '10001 10001 10001 10001 10001 10001 01110',
  'V': '10001 10001 10001 10001 10001 01010 00100', 'W': '10001 10001 10001 10101 10101 10101 01010', 'X': '10001 10001 01010 00100 01010 10001 10001',
  'Y': '10001 10001 01010 00100 00100 00100 00100', 'Z': '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110', '1': '00100 01100 00100 00100 00100 00100 01110', '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11111 00010 00100 00010 00001 10001 01110', '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000', '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00010 01100',
  '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000', '!': '00100 00100 00100 00100 00100 00000 00100',
  '?': '01110 10001 00001 00010 00100 00000 00100', "'": '00100 00100 01000 00000 00000 00000 00000', '"': '01010 01010 00000 00000 00000 00000 00000',
  ':': '00000 01100 01100 00000 01100 01100 00000', '-': '00000 00000 00000 11111 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000',
  '/': '00001 00010 00010 00100 01000 01000 10000', '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
  '%': '11001 11010 00010 00100 01000 01011 10011', '&': '01100 10010 10100 01000 10101 10010 01101', '#': '01010 11111 01010 01010 01010 11111 01010',
  '*': '00100 10101 01110 11111 01110 10101 00100', '=': '00000 00000 11111 00000 11111 00000 00000', '<': '00010 00100 01000 10000 01000 00100 00010',
  '>': '01000 00100 00010 00001 00010 00100 01000', '$': '00100 01111 10100 01110 00101 11110 00100', '@': '01110 10001 10111 10101 10111 10000 01111',
  '★': '00100 00100 11111 01110 01110 11011 10001', '♥': '00000 01010 11111 11111 01110 00100 00000', ' ': '00000 00000 00000 00000 00000 00000 00000',
  '_': '00000 00000 00000 00000 00000 00000 11111', 'x': '00000 00000 10001 01010 00100 01010 10001'
};
const FONT = {}; for (const k in FONT_SRC) FONT[k] = FONT_SRC[k].split(' ').map(r => r.split('').map(Number));
const txtCache = new Map();
function textW(s, sc = 1) { return s.length * 6 * sc - sc; }
function renderText(s, c, sc, o) {
  const key = s + '|' + c + '|' + sc + '|' + o; let cn = txtCache.get(key); if (cn) return cn;
  const pad = o ? sc : 0;
  cn = document.createElement('canvas'); cn.width = Math.max(1, textW(s, sc) + pad * 2 + (o ? sc : 0)); cn.height = 7 * sc + pad * 2 + (o ? sc : 0);
  const x = cn.getContext('2d');
  const drawG = (ox, oy, color) => {
    x.fillStyle = color;
    for (let i = 0; i < s.length; i++) { const gl = FONT[s[i]] || FONT[s[i].toUpperCase()] || FONT['?']; for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (gl[r][q]) x.fillRect(ox + (i * 6 + q) * sc, oy + r * sc, sc, sc); }
  };
  if (o) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [2, 2], [1, 2], [2, 1]]) drawG(pad + dx * sc, pad + dy * sc, o); }
  if (typeof c === 'string') drawG(pad, pad, c);
  else { // vertical gradient array of colors (one per glyph row)
    for (let i = 0; i < s.length; i++) { const gl = FONT[s[i]] || FONT[s[i].toUpperCase()] || FONT['?']; for (let r = 0; r < 7; r++) { x.fillStyle = c[r % c.length]; for (let q = 0; q < 5; q++) if (gl[r][q]) x.fillRect(pad + (i * 6 + q) * sc, pad + r * sc, sc, sc); } }
  }
  if (txtCache.size > 400) txtCache.clear(); txtCache.set(key, cn); return cn;
}
// draw text; align: 0 left, 0.5 center, 1 right
function TX(s, x, y, c = '#fff', sc = 1, align = 0, o = '#000') {
  s = String(s).toUpperCase(); const cn = renderText(s, c, sc, o);
  const tw = textW(s, sc); g.drawImage(cn, Math.round(x - tw * align - (o ? sc : 0)), Math.round(y - (o ? sc : 0)));
}
// word-wrap for canvas text
function wrapText(s, maxChars) { const w = String(s).split(' '), lines = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > maxChars) { if (cur) lines.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); } if (cur) lines.push(cur); return lines; }

/* ---------- particles ---------- */
const PARTS = [], STAINS = [], POPS = [];
function part(o) { if (PARTS.length > 420) PARTS.shift(); PARTS.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 320, life: 1, t: 0, c: '#fff', s: 1, type: 'drop', floor: 232 }, o)); }
function updParts(dt) {
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.type === 'confetti') { p.vx *= 0.98; p.vy = Math.min(p.vy, 40); }
    if ((p.type === 'drop' || p.type === 'tooth') && p.vy > 0 && p.y > p.floor) {
      if (p.type === 'drop' && STAINS.length < 160 && p.stain !== false) STAINS.push({ x: p.x, y: p.floor + rand(-2, 2), r: p.s * rand(0.8, 1.6), c: p.c });
      if (p.type === 'tooth') { p.vy *= -0.4; p.vx *= 0.6; p.y = p.floor; if (Math.abs(p.vy) < 20) { p.g = 0; p.vy = 0; p.vx = 0; } continue; }
      PARTS.splice(i, 1); continue;
    }
    if (p.t > p.life) PARTS.splice(i, 1);
  }
  for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; p.t += dt; if (p.t > p.life) POPS.splice(i, 1); }
}
function drawParts() {
  for (const p of PARTS) {
    const a = 1 - p.t / p.life;
    if (p.type === 'drop') { E(p.x, p.y, p.s, p.s * (1 + Math.min(1, Math.abs(p.vy) / 300) * 0.6), p.c); if (p.s >= 2) PX(p.x - p.s * 0.4, p.y - p.s * 0.4, '#ffb3c0'); }
    else if (p.type === 'spit') { if (a > 0.1) E(p.x, p.y, p.s, p.s, p.c); }
    else if (p.type === 'tooth') { R(p.x - 1, p.y - 1.5, 3, 4, '#000'); R(p.x - 0.5, p.y - 1, 2, 3, '#fffbe8'); }
    else if (p.type === 'spark') { if (a > 0) R(p.x, p.y, p.s, p.s, p.c); }
    else if (p.type === 'sweat') E(p.x, p.y, p.s, p.s * 1.4, '#bfefff');
    else if (p.type === 'confetti') R(p.x, p.y, 2 + Math.sin(p.t * 9 + p.s) * 1.2, 2, p.c);
    else if (p.type === 'star') star(p.x, p.y, p.s, p.c);
  }
  for (const p of POPS) {
    const k = p.t / p.life, y = p.y - ease(k * 2) * 10;
    if (k < 0.85 || Math.floor(p.t * 30) % 2) TX(p.s, p.x, y, p.c, p.sc || 1, 0.5);
  }
}
function pop(s, x, y, c = '#ffd23f', sc = 1, life = 0.8) { POPS.push({ s, x, y, c, sc, life, t: 0 }); }
function spray(x, y, n, kind, dir = 0, power = 1, robot = false) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + dir * 0.8 + rand(-1.1, 1.1), v = rand(60, 190) * power;
    if (kind === 'blood') part({ type: 'drop', x: x + rand(-3, 3), y: y + rand(-2, 2), vx: Math.cos(a) * v + dir * 60, vy: Math.sin(a) * v - 40, life: 2.5, s: rand(1, 2.6), c: robot ? pick(['#1a1a1a', '#2b2b2b', '#3a3020']) : pick(['#e3122f', '#ff2a45', '#c10a24']), floor: rand(205, 236) });
    else if (kind === 'spit') part({ type: 'spit', x: x + rand(-2, 2), y: y + rand(-2, 2), vx: Math.cos(a) * v * 1.3 + dir * 80, vy: Math.sin(a) * v * 0.8 - 20, life: rand(0.35, 0.7), g: 200, s: rand(0.6, 1.6), c: robot ? pick(['#7ef0ff', '#b5ffff']) : pick(['#eaf9ff', '#c6ecff', '#ffffff']) });
    else if (kind === 'spark') part({ type: 'spark', x, y, vx: Math.cos(a) * v * 1.4, vy: Math.sin(a) * v * 1.2, life: rand(0.2, 0.5), g: 150, s: irand(1, 2), c: pick(['#fff', '#ffd23f', '#ff9d2e']) });
    else if (kind === 'sweat') part({ type: 'sweat', x: x + rand(-14, 14), y: y + rand(-8, 4), vx: rand(-60, 60), vy: rand(-90, -30), life: 0.8, g: 400, s: rand(0.8, 1.4) });
  }
}
function tooth(x, y, dir) { part({ type: 'tooth', x, y, vx: dir * rand(40, 110) + rand(-30, 30), vy: rand(-170, -110), life: 6, floor: rand(214, 234), g: 420 }); }
function confetti(n) { for (let i = 0; i < n; i++) part({ type: 'confetti', x: rand(0, GW), y: rand(-60, -4), vx: rand(-30, 30), vy: rand(10, 40), g: 30, life: 6, s: rand(0, 6), c: pick(['#ff3b5c', '#ffd23f', '#3bc6ff', '#b9ff7a', '#ff7ac8', '#fff']) }); }
function clearFx() { PARTS.length = 0; STAINS.length = 0; POPS.length = 0; }
