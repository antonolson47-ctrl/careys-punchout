/* ===================== ART: supporting cast (ref, announcer, coach, commentators) ===================== */
const ZD = { eyeL: 0, eyeR: 0, cheekL: 0, cheekR: 0, lip: 0, nose: 0, cut: 0, teeth: 0, lump: 0, puff: 0, bruises: [], leg: 0 };
function castHead(x, y, u, c, talk, face = 'normal') {
  EO(x - c.rx * u, y + 2 * u, 3 * u, 4 * u, c.skin); EO(x + c.rx * u, y + 2 * u, 3 * u, 4 * u, c.skin);
  EO(x, y, c.rx * u, c.ry * u, c.skin);
  if (c.shine) E(x - c.rx * 0.4 * u, y - c.ry * 0.6 * u, 5 * u, 3 * u, sh(c.skin, 0.35));
  if (c.under) c.under(x, y, u);
  drawEyesSP({ skin: c.skin, erx: c.erx || 5.5, ery: c.ery || 6.2, egap: c.egap || 5.6, brow: c.brow || '#000', browAlways: true }, x, y, u, face, ZD, 0);
  if (c.nose) c.nose(x, y, u);
  const open = talk && Math.sin(T * 22) > -0.2;
  if (open) { EO(x, y + 10 * u, 4 * u, 3 * u, '#5a0a18'); R(x - 3 * u, y + 8 * u, 6 * u, 1, '#fff'); } else drawMouth(c.smile ? 'smirk' : 'line', x, y + 10 * u, u, ZD, {});
  if (c.over) c.over(x, y, u);
}
function drawRef(x, y, s = 1, armPose = 0, count = 0) {
  const u = s, sk = '#f0c8a8';
  LIMBO(x - 7 * u, y - 36 * u, 5 * u, x - 9 * u, y - 2 * u, 4 * u, '#222'); LIMBO(x + 7 * u, y - 36 * u, 5 * u, x + 9 * u, y - 2 * u, 4 * u, '#222'); EO(x - 10 * u, y - 1 * u, 6 * u, 3 * u, '#111'); EO(x + 10 * u, y - 1 * u, 6 * u, 3 * u, '#111');
  PO([x - 16 * u, y - 80 * u, x + 16 * u, y - 80 * u, x + 13 * u, y - 36 * u, x - 13 * u, y - 36 * u], '#f8f8f8'); R(x - 13 * u, y - 40 * u, 26 * u, 4 * u, '#111');
  P([x - 6 * u, y - 82 * u, x, y - 79 * u, x - 6 * u, y - 76 * u], '#111'); P([x + 6 * u, y - 82 * u, x, y - 79 * u, x + 6 * u, y - 76 * u], '#111');
  arm(x - 16 * u, y - 76 * u, x - 22 * u, y - 46 * u, 16 * u, -1, 3.5 * u, 3 * u, '#f8f8f8'); E(x - 22 * u, y - 45 * u, 3.5 * u, 3.5 * u, sk);
  const hy = armPose ? y - 100 * u - Math.abs(Math.sin(T * 6)) * 6 * u : y - 50 * u, hx = armPose ? x + 30 * u : x + 22 * u;
  arm(x + 16 * u, y - 76 * u, hx, hy, 16 * u, 1, 3.5 * u, 3 * u, '#f8f8f8'); EO(hx, hy, 4 * u, 4 * u, sk);
  if (count > 0 && count <= 5) for (let i = 0; i < count; i++) R(hx - 4 * u + i * 2 * u, hy - 9 * u, 1.5 * u, 6 * u, sk);
  castHead(x, y - 98 * u, u, { rx: 14, ry: 14, skin: sk, shine: true, over: (X, Y, U) => { PO([X - 9 * U, Y + 6 * U, X + 9 * U, Y + 6 * U, X + 11 * U, Y + 9 * U, X - 11 * U, Y + 9 * U], '#333'); for (let i = 0; i < 4; i++) LN(X - 10 * U + i * 5 * U, Y - 13 * U, X - 2 * U + i * 5 * U, Y - 12 * U, '#333'); } }, false);
}
function drawAnnouncer(x, y, s = 1, talk = false) {
  const u = s, sk = '#f2c8a0';
  PO([x - 22 * u, y, x + 22 * u, y, x + 20 * u, y - 46 * u, x - 20 * u, y - 46 * u], '#111'); P([x - 6 * u, y - 46 * u, x + 6 * u, y - 46 * u, x, y - 22 * u], '#fff'); P([x - 6 * u, y - 44 * u, x, y - 40 * u, x - 6 * u, y - 36 * u], '#d02030'); P([x + 6 * u, y - 44 * u, x, y - 40 * u, x + 6 * u, y - 36 * u], '#d02030');
  arm(x + 20 * u, y - 42 * u, x + 8 * u, y - 60 * u, 14 * u, 1, 4 * u, 3.5 * u, '#111'); E(x + 8 * u, y - 60 * u, 4 * u, 4 * u, sk);
  LN(x + 8 * u, y - 62 * u, x + 8 * u, y - 160 * u, '#444'); EO(x + 6 * u, y - 68 * u, 3 * u, 5 * u, '#333'); E(x + 6 * u, y - 70 * u, 2 * u, 2 * u, '#888');
  arm(x - 20 * u, y - 42 * u, x - 34 * u, y - 70 * u - (talk ? Math.abs(Math.sin(T * 5)) * 8 * u : 0), 14 * u, -1, 4 * u, 3.5 * u, '#111'); E(x - 34 * u, y - 72 * u, 4 * u, 4 * u, sk);
  castHead(x, y - 66 * u, u, { rx: 15, ry: 15, skin: sk, smile: true, under: (X, Y, U) => { EH(X, Y - 4 * U, 16 * U, 13 * U, '#1a1a1a', true); E(X - 6 * U, Y - 14 * U, 5 * U, 2 * U, '#555'); } }, talk);
}
function drawCoach(x, y, s = 1, talk = false) {
  const u = s, sk = '#e8b896';
  PO([x - 24 * u, y, x + 24 * u, y, x + 22 * u, y - 48 * u, x - 22 * u, y - 48 * u], '#c02030'); TX('GUS', x, y - 34 * u, '#fff', 1, 0.5, null);
  P([x - 22 * u, y - 48 * u, x - 8 * u, y - 48 * u, x - 14 * u, y - 10 * u, x - 22 * u, y - 10 * u], '#f8f8f8');
  arm(x + 22 * u, y - 44 * u, x + 30 * u, y - 62 * u - (talk ? Math.abs(Math.sin(T * 6)) * 8 * u : 0), 14 * u, 1, 4.5 * u, 4 * u, '#c02030'); EO(x + 30 * u, y - 64 * u, 4.5 * u, 4.5 * u, sk);
  castHead(x, y - 66 * u, u, { rx: 16, ry: 15, skin: sk, shine: true, brow: '#ddd', nose: (X, Y, U) => EO(X, Y + 4 * U, 4.5 * U, 4 * U, '#e8907a'), under: (X, Y, U) => { for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) EO(X + sd * 15 * U, Y - 4 * U + i * 4 * U, 3 * U, 3 * U, '#e8e8e8'); R(X - 16 * U, Y - 11 * U, 32 * U, 4 * U, '#ffd23f'); for (let i = 0; i < 18; i++) PX(X + Math.cos(i * 0.35 + 0.2) * 12 * U, Y + 9 * U + Math.sin(i * 0.35 + 0.2) * 6 * U, '#aaa'); } }, talk);
}
function drawChet(x, y, s = 1, talk = false) { // generic bald, muscular podcast-host commentator (parody, not a likeness)
  const u = s, sk = '#efc29e';
  PO([x - 30 * u, y, x + 30 * u, y, x + 28 * u, y - 44 * u, x - 28 * u, y - 44 * u], '#141414'); EH(x - 14 * u, y - 36 * u, 12 * u, 6 * u, '#222', false); EH(x + 14 * u, y - 36 * u, 12 * u, 6 * u, '#222', false); TX('RUCKUS', x, y - 22 * u, '#ffd23f', 1, 0.5, null);
  arm(x - 28 * u, y - 40 * u, x - 34 * u, y - 4 * u, 14 * u, -1, 7 * u, 6 * u, sk); arm(x + 28 * u, y - 40 * u, x + 12 * u, y - 52 * u - (talk ? Math.abs(Math.sin(T * 7)) * 6 * u : 0), 14 * u, 1, 7 * u, 6 * u, sk);
  EO(x + 12 * u, y - 54 * u, 5 * u, 5 * u, sk); EO(x + 10 * u, y - 62 * u, 3 * u, 6 * u, '#333');
  R(x - 9 * u, y - 52 * u, 18 * u, 10 * u, sh(sk, -0.1));
  castHead(x, y - 64 * u, u, { rx: 15, ry: 14, skin: sk, shine: true, brow: '#3a2a1a', erx: 5, ery: 5.5, nose: (X, Y, U) => LN(X, Y + 1 * U, X + 2 * U, Y + 5 * U, '#c08a6a'), over: (X, Y, U) => { LN(X - 16 * U, Y - 2 * U, X - 12 * U, Y + 8 * U, '#222', 2); LN(X - 12 * U, Y + 8 * U, X - 5 * U, Y + 10 * U, '#222'); EO(X - 5 * U, Y + 10 * U, 1.5 * U, 1.5 * U, '#444'); EH(X, Y - 2 * U, 17 * U, 15 * U, 'rgba(0,0,0,0)', true); R(X - 17 * U, Y - 6 * U, 3 * U, 8 * U, '#222'); R(X + 14 * U, Y - 6 * U, 3 * U, 8 * U, '#222'); LN(X - 16 * U, Y - 6 * U, X, Y - 16 * U, '#222'); LN(X, Y - 16 * U, X + 16 * U, Y - 6 * U, '#222'); } }, talk);
}
function drawBarry(x, y, s = 1, talk = false) { // generic big cheerful ex-champ analyst (parody, not a likeness)
  const u = s, sk = '#8a5a3a';
  PO([x - 36 * u, y, x + 36 * u, y, x + 32 * u, y - 46 * u, x - 32 * u, y - 46 * u], '#7a2ad0'); E(x, y - 14 * u, 30 * u, 22 * u, '#7a2ad0'); P([x - 7 * u, y - 46 * u, x + 7 * u, y - 46 * u, x, y - 26 * u], '#fff'); PO([x - 3 * u, y - 44 * u, x + 3 * u, y - 44 * u, x + 4 * u, y - 24 * u, x, y - 20 * u, x - 4 * u, y - 24 * u], '#ff3b5c');
  arm(x - 32 * u, y - 42 * u, x - 18 * u, y - 54 * u - (talk ? Math.abs(Math.sin(T * 6)) * 5 * u : 0), 14 * u, -1, 7 * u, 6 * u, '#7a2ad0'); EO(x - 18 * u, y - 56 * u, 5 * u, 5 * u, sk); EO(x - 16 * u, y - 64 * u, 3 * u, 6 * u, '#333');
  arm(x + 32 * u, y - 42 * u, x + 40 * u, y - 10 * u, 14 * u, 1, 7 * u, 6 * u, '#7a2ad0'); EO(x + 40 * u, y - 8 * u, 5 * u, 5 * u, sk);
  castHead(x, y - 66 * u, u * 1.05, { rx: 17, ry: 16, skin: sk, smile: true, brow: '#111', under: (X, Y, U) => { R(X - 15 * U, Y - 18 * U, 30 * U, 7 * U, '#111'); for (let i = 0; i < 16; i++) PX(X + Math.cos(i * 0.4 + 0.15) * 13 * U, Y + 10 * U + Math.sin(i * 0.4 + 0.15) * 7 * U, '#2a1a10'); }, nose: (X, Y, U) => EO(X, Y + 4 * U, 4 * U, 3 * U, '#6a4028') }, talk, talk ? 'normal' : 'laugh');
}
