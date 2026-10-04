/* ===================== ART: arena / environment ===================== */
function withCtx(cn, fn) { const og = g, of = FILL; g = cn.getContext('2d'); FILL = ''; try { fn(); } finally { g = og; FILL = of === '' ? '' : ''; FILL = ''; } }
let ARENA = null, ARENA_W = 0, ARENA_KIND = '';
const FLOOR_Y = 216;
function buildArena(kind) {
  const cn = document.createElement('canvas'); cn.width = GW; cn.height = GH; const C = GW / 2;
  withCtx(cn, () => {
    // dark arena backdrop with lights
    for (let y = 0; y < 110; y += 2) R(0, y, GW, 2, y < 30 ? '#0d0518' : sh('#1a0a2a', -y / 400));
    // spotlight cone
    for (let y = 0; y < 150; y++) { const w = 60 + y * 0.9; R(C - w, y, w * 2, 1, y % 2 ? 'rgba(255,240,200,0.035)' : 'rgba(255,240,200,0.05)'); }
    // stadium light rig
    R(0, 4, GW, 3, '#2a2140'); for (let x = 12; x < GW; x += 34) { EO(x, 9, 4, 3, '#fff8d0', '#3a3050'); }
    // crowd rows (pixel heads)
    const skins = ['#f2c7a5', '#d9a07a', '#a8714f', '#7a4b30', '#ffdcc0', '#c58c64'], hair = ['#2a1a10', '#5a3010', '#d8b040', '#111', '#8a2a10', '#ccc', '#4a2a6a'], shirts = ['#c0304a', '#3060c0', '#30a060', '#e0c030', '#8040a0', '#e07020', '#ddd', '#222'];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let row = 0; row < 6; row++) {
      const y = 34 + row * 13, sz = 3.2 + row * 0.5, dk = -0.62 + row * 0.08;
      for (let x = -4 + (row % 2) * 6; x < GW + 8; x += 9 + row) {
        const s = sh(pick2(skins, rnd), dk), hcol = sh(pick2(hair, rnd), dk), sc = sh(pick2(shirts, rnd), dk), ox = rnd() * 3;
        R(x + ox - sz, y + sz * 1.4, sz * 2 + 1, sz * 2, sc); E(x + ox, y + sz * 0.6, sz, sz * 1.05, s); EH(x + ox, y, sz + 0.5, sz * 0.8, hcol, true);
        if (rnd() < 0.08) R(x + ox - 1, y - sz - 5, 2, 6, sh('#ffd23f', dk)); // sign stick
        if (rnd() < 0.05) R(x + ox - 5, y - sz - 9, 11, 6, sh(pick2(['#fff', '#ffd23f', '#7ef0ff'], rnd), dk));
      }
    }
    // barrier / press row
    R(0, 108, GW, 14, '#1b1030'); R(0, 108, GW, 2, '#3a2a5a'); for (let x = 0; x < GW; x += 40) { R(x + 4, 111, 32, 8, '#2a1a48'); TX(kind === 'title' ? 'CAREY' : 'PUNCH', x + 6, 112, '#6a4aa0', 1, 0, null); }
    // ring apron & mat
    const top = 128;
    for (let y = top; y < GH; y++) { const k = (y - top) / (GH - top); const w = GW * (0.78 + k * 0.5); R(C - w / 2, y, w, 1, y % 3 === 0 ? '#c9d6e6' : '#d6e2f0'); }
    R(0, top, GW, 2, '#9aaac0');
    // mat logo
    for (let r = 0; r < 2; r++) { E(C, 188, 66 - r * 6, 22 - r * 2, r ? '#c3d0e2' : '#b8c6da'); }
    TX("CAREY'S", C, 176, '#a6b6cc', 1, 0.5, null); TX('PUNCHOUT', C, 186, '#a6b6cc', 2, 0.5, null);
    // corner posts + back ropes
    const pl = C - GW * 0.39, pr = C + GW * 0.39;
    for (const [x, c] of [[pl, '#d02040'], [pr, '#2050d0']]) { R(x - 4, 74, 8, 60, '#000'); R(x - 3, 75, 6, 58, c); R(x - 3, 75, 2, 58, sh(c, 0.4)); R(x - 5, 72, 10, 5, '#ddd'); }
    const ropes = [['#ff3b5c', 84], ['#ffffff', 98], ['#3b7cff', 112]];
    for (const [c, y] of ropes) { R(pl, y, pr - pl, 3, '#000'); R(pl, y, pr - pl, 2, c); R(pl, y, pr - pl, 1, sh(c, 0.5)); }
    for (const x of [C - 60, C + 60]) R(x - 1, 82, 3, 34, '#e6e6e6'); // turnbuckle ties
  });
  ARENA = cn; ARENA_W = GW; ARENA_KIND = kind;
}
function pick2(a, r) { return a[Math.floor(r() * a.length)]; }
function drawArena(kind = 'ring', crowdBounce = 0) {
  if (!ARENA || ARENA_W !== GW || ARENA_KIND !== kind) buildArena(kind);
  g.drawImage(ARENA, 0, 0);
  // camera flashes
  if (Math.random() < 0.18) { const x = rand(0, GW), y = rand(30, 100); burst(x, y, rand(3, 6), 'rgba(255,255,255,0.85)', 4, 0.3); }
  if (crowdBounce > 0.05) { for (let i = 0; i < 10; i++) { const x = rand(0, GW), y = rand(30, 100); R(x, y - crowdBounce * 4, 2, 4, pick(['#ffd23f', '#fff', '#ff7ac8'])); } }
  // stains on mat
  for (const s of STAINS) E(s.x, s.y, s.r * 1.5, s.r * 0.6, s.c === '#1a1a1a' || s.c === '#2b2b2b' || s.c === '#3a3020' ? '#3a3a40' : '#d0405a');
}
// generic HP bar
function bar(x, y, w, h, v, c1, c2, flip) {
  R(x - 1, y - 1, w + 2, h + 2, '#000'); R(x, y, w, h, '#3a1020');
  const fw = Math.round(w * clamp(v, 0, 1)); const c = v > 0.5 ? c1 : v > 0.25 ? '#ffd23f' : '#ff3b30';
  if (flip) { R(x + w - fw, y, fw, h, c); R(x + w - fw, y, fw, 1, '#fff8'); } else { R(x, y, fw, h, c); R(x, y, fw, 1, 'rgba(255,255,255,0.5)'); }
}
function heartIcon(x, y, c = '#ff3b5c') { TX('♥', x, y, c, 1, 0); }
function vignette(a) { col('rgba(0,0,0,' + a + ')'); g.fillRect(0, 0, GW, GH); FILL = ''; }
function flashScreen(c, a) { g.globalAlpha = a; R(0, 0, GW, GH, c); g.globalAlpha = 1; }
