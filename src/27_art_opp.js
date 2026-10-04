/* ===================== ART: opponent rig (front view, posed, damage overlays) ===================== */
const BRUISE = ['#c9708a', '#a24a8a', '#7a3a8a', '#4a1a5a', '#33103f'];
function basePose() { return { bx: 0, by: 0, lean: 0, crouch: 0, hx: 0, hy: 0, gl: { x: -22, y: -104, r: 10 }, gr: { x: 22, y: -104, r: 10 }, fl: { x: -18, y: 0 }, fr: { x: 18, y: 0 }, kick: null, face: 'normal', front: null, jit: 0, kneel: 0, look: 0 }; }
function lerpPose(a, b, k) {
  for (const key of ['bx', 'by', 'lean', 'crouch', 'hx', 'hy', 'kneel']) a[key] = lerp(a[key], b[key], k);
  for (const gk of ['gl', 'gr']) { a[gk].x = lerp(a[gk].x, b[gk].x, k); a[gk].y = lerp(a[gk].y, b[gk].y, k); a[gk].r = lerp(a[gk].r, b[gk].r, k); }
  for (const fk of ['fl', 'fr']) { a[fk].x = lerp(a[fk].x, b[fk].x, k); a[fk].y = lerp(a[fk].y, b[fk].y, k); }
  if (b.kick) { if (!a.kick) a.kick = Object.assign({}, b.kick, { x: b.kick.side * 16, y: -2, r: 6 }); a.kick.side = b.kick.side; a.kick.x = lerp(a.kick.x, b.kick.x, k); a.kick.y = lerp(a.kick.y, b.kick.y, k); a.kick.r = lerp(a.kick.r, b.kick.r, k); }
  else a.kick = null;
  a.face = b.face; a.front = b.front; a.jit = b.jit; a.look = b.look; a.prop = b.prop;
}
// mouth with teeth (missing ones blacked out)
const TOOTH_ORDER = [2, 3, 1, 4, 0, 5];
function teethRow(x, y, w, h, missing, c = '#fffbe8') {
  R(x, y, w, h, c); const n = 6, tw = w / n;
  for (let i = 1; i < n; i++) PX(x + i * tw, y + h - 1, '#bbb');
  for (let k = 0; k < Math.min(missing, 6); k++) { const i = TOOTH_ORDER[k]; R(x + i * tw, y, Math.ceil(tw), h, '#200'); }
}
function drawMouth(kind, x, y, u, D, C) {
  const miss = D.teeth;
  if (kind === 'line') { LN(x - 4 * u, y, x + 4 * u, y + (C.frown ? 1 : -1) * u, '#000'); }
  else if (kind === 'smirk') { LN(x - 4 * u, y + u, x + 3 * u, y - u, '#000'); LN(x + 3 * u, y - u, x + 5 * u, y - 2 * u, '#000'); }
  else if (kind === 'grin') { R(x - 6 * u - 1, y - 2 * u - 1, 12 * u + 2, 4 * u + 2, '#000'); teethRow(x - 6 * u, y - 2 * u, 12 * u, 4 * u, miss); LN(x - 6 * u, y, x + 6 * u, y, '#999'); }
  else if (kind === 'open' || kind === 'tongue' || kind === 'laugh') {
    const w = kind === 'laugh' ? 8 : 6.5, h = kind === 'laugh' ? 6 : 5;
    EO(x, y + u, w * u, h * u, '#5a0a18'); teethRow(x - w * 0.75 * u, y + u - h * u + 1, w * 1.5 * u, 2 * u, miss);
    if (kind !== 'laugh' || true) E(x + (kind === 'tongue' ? 2 * u : 0), y + (kind === 'tongue' ? 6 : 4) * u, 3.4 * u, (kind === 'tongue' ? 4 : 2) * u, '#ff6b8a');
  }
  else if (kind === 'o') { EO(x, y + u, 2.5 * u, 3 * u, '#5a0a18'); }
  else if (kind === 'wobble') { for (let i = -4; i < 4; i++) LN(x + i * u, y + (i & 1 ? u : -u), x + (i + 1) * u, y + (i & 1 ? -u : u), '#000'); E(x + 2 * u, y + 3 * u, 2 * u, 3 * u, '#ff6b8a'); }
}
const FACE_MOUTH = { normal: 'line', angry: 'grin', tell: 'grin', hurt: 'open', ouch: 'o', dizzy: 'wobble', ko: 'tongue', smug: 'smirk', laugh: 'laugh', surprise: 'o', gloat: 'laugh', yell: 'open' };
function drawEyesSP(C, hx, hy, u, face, D, look) {
  const erx = (C.erx || 6.2) * u, ery = (C.ery || 7) * u, gap = (C.egap || 6.2) * u, ey = hy + (C.ey || -3) * u;
  for (const sd of [-1, 1]) { // black eye rings (behind)
    const lv = sd < 0 ? D.eyeL : D.eyeR; if (lv > 0) E(hx + sd * gap, ey + u * 1.2, erx + (1 + lv * 1.1) * u, ery + (0.6 + lv * 0.7) * u, BRUISE[Math.min(4, lv)]);
  }
  for (const sd of [-1, 1]) {
    const ex = hx + sd * gap, lv = sd < 0 ? D.eyeL : D.eyeR;
    if (lv >= 4) { EO(ex, ey + u, erx * 1.05, ery * 0.9, BRUISE[3], '#000'); LN(ex - erx * 0.6, ey + u, ex + erx * 0.6, ey + u, '#000'); continue; }
    if (face === 'hurt' || face === 'laugh' || face === 'gloat') { // squeezed / happy
      if (face === 'hurt') { LN(ex + sd * 3 * u, ey - 3 * u, ex - sd * 2 * u, ey, '#000', 2); LN(ex - sd * 2 * u, ey, ex + sd * 3 * u, ey + 3 * u, '#000', 2); }
      else { LN(ex - erx * 0.7, ey + u, ex, ey - 2 * u, '#000', 2); LN(ex, ey - 2 * u, ex + erx * 0.7, ey + u, '#000', 2); }
      continue;
    }
    if (face === 'ko') { LN(ex - 3 * u, ey - 3 * u, ex + 3 * u, ey + 3 * u, '#000', 2); LN(ex - 3 * u, ey + 3 * u, ex + 3 * u, ey - 3 * u, '#000', 2); continue; }
    EO(ex, ey, erx, ery, '#fff');
    // pupils
    let px = ex - sd * 1.5 * u + look * 2 * u, py = ey + 1.5 * u, pr = face === 'surprise' || face === 'ouch' ? 1 : 1.6;
    if (face === 'dizzy') { px = ex + Math.cos(T * 9 + sd) * 2.5 * u; py = ey + Math.sin(T * 9 + sd) * 2.5 * u; }
    E(px, py, pr * u + 0.6, pr * u + 0.6, '#000');
    if (face === 'smug' || face === 'tell' || face === 'angry') EH(ex, ey - ery * 0.25, erx + 1, ery * 0.9, face === 'smug' ? C.skin : C.skin, true);
    if (lv >= 2) EH(ex, ey + ery * (lv >= 3 ? 0.3 : -0.1), erx + 1, ery * (lv >= 3 ? 1.1 : 0.85), BRUISE[lv], true); // swollen lid
    // brows
    const bc = C.brow || '#000', by = ey - ery - 1.5 * u;
    if (face === 'angry' || face === 'tell' || face === 'gloat') LN(ex - sd * erx * 0.9, by - 2 * u, ex + sd * erx * 0.7, by + 2 * u, bc, Math.max(1, Math.round(u * 1.6)));
    else if (face === 'surprise' || face === 'ouch' || face === 'dizzy') LN(ex - erx * 0.7, by - 3 * u, ex + erx * 0.7, by - 3 * u, bc, Math.max(1, Math.round(u * 1.4)));
    else if (C.browAlways) LN(ex - erx * 0.8, by, ex + erx * 0.8, by - sd * u * 0.5, bc, Math.max(1, Math.round(u * 1.6)));
  }
}
function drawDamageFace(C, hx, hy, u, D, face) {
  // nose
  if (D.nose > 0) { E(hx + (D.nose >= 3 ? 2 * u : 0), hy + 4 * u, (2.5 + D.nose * 0.6) * u, (2 + D.nose * 0.5) * u, D.nose >= 2 ? '#e0405a' : '#f07080'); if (D.nose >= 2 && !C.robot) { const dl = ((T * 0.7) % 1) * 6 * u; R(hx - u, hy + 6 * u, 1, 2 + dl * 0.6, '#d0102a'); E(hx - u + 0.5, hy + 7 * u + dl * 0.6, 1, 1.2, '#e3122f'); } }
  // fat lip
  if (D.lip > 0) E(hx + 2 * u, hy + (C.my || 11) * u + 2.5 * u, (2.5 + D.lip * 1.2) * u, (1.2 + D.lip * 0.6) * u, '#e05070');
  // cut over brow with drip
  if (D.cut > 0) { const cx = hx - 9 * u, cy = hy - 12 * u; LN(cx - 3 * u, cy - u, cx + 3 * u, cy + u, '#c0102a', 2); if (D.cut >= 2) { R(cx, cy + u, 1, (3 + D.cut * 3) * u, '#e3122f'); E(cx + 0.5, cy + (4 + D.cut * 3) * u, 1, 1.4, '#e3122f'); } if (D.cut >= 3) LN(hx + 8 * u, hy - 13 * u, hx + 12 * u, hy - 11 * u, '#c0102a', 2); }
  // goose-egg lump
  if (D.lump > 0) { EO(hx + 7 * u, hy - (C.hry || 22) * u * 0.78, (2 + D.lump * 1.5) * u, (1.5 + D.lump * 1.2) * u, '#ff8a9a', sh(C.skin, -0.4)); PX(hx + 6 * u, hy - (C.hry || 22) * u * 0.82, '#fff'); }
}
function drawHeadGeneric(o, hx, hy, u, face) {
  const C = o.C, D = o.dmg, rx = (C.hrx || 24) * u * (1 + D.puff * 0.04), ry = (C.hry || 22) * u * (1 + D.puff * 0.03);
  if (C.hairBack) C.hairBack(hx, hy, u, o, rx, ry);
  E(hx - rx * 0.98, hy + 2 * u, 4 * u, 5 * u, '#000'); E(hx + rx * 0.98, hy + 2 * u, 4 * u, 5 * u, '#000'); E(hx - rx * 0.98, hy + 2 * u, 3 * u, 4 * u, C.skin); E(hx + rx * 0.98, hy + 2 * u, 3 * u, 4 * u, C.skin); // ears
  if (C.headShape) C.headShape(hx, hy, u, o, rx, ry); else EO(hx, hy, rx, ry, C.skin);
  if (D.puff > 1) { E(hx - rx * 0.7, hy + ry * 0.35, rx * 0.35, ry * 0.3, sh(C.skin, -0.06)); E(hx + rx * 0.72, hy + ry * 0.3, rx * 0.3, ry * 0.3, sh(C.skin, -0.06)); }
  E(hx, hy + ry * 0.55, rx * 0.6, ry * 0.25, sh(C.skin, -0.06)); // jaw shade
  for (const sd of [-1, 1]) { const lv = sd < 0 ? D.cheekL : D.cheekR; if (lv > 0) { E(hx + sd * rx * 0.62, hy + 7 * u, (2.5 + lv * 1.6) * u, (2 + lv * 1.1) * u, BRUISE[Math.min(4, lv)]); if (lv >= 2) E(hx + sd * rx * 0.62, hy + 7 * u, (1.5 + lv) * u, (1 + lv * 0.6) * u, BRUISE[Math.min(4, lv + 1)]); } }
  if (C.blush) { E(hx - rx * 0.62, hy + 6 * u, 3 * u, 2 * u, '#ff9aa8'); E(hx + rx * 0.62, hy + 6 * u, 3 * u, 2 * u, '#ff9aa8'); }
  if (C.faceUnder) C.faceUnder(hx, hy, u, o, face);
  if (C.eyesFn) C.eyesFn(hx, hy, u, o, face); else drawEyesSP(C, hx, hy, u, face, D, o.pose.look || 0);
  if (C.nose) C.nose(hx, hy, u, o);
  if (!C.noMouth || (C.mouthWhen && C.mouthWhen(o))) drawMouth(FACE_MOUTH[face] || 'line', hx + (C.mx || 0) * u, hy + (C.my || 11) * u, u, D, C);
  drawDamageFace(C, hx, hy, u, D, face);
  if (C.hairFront) C.hairFront(hx, hy, u, o, rx, ry, face);
  if (face === 'dizzy' || face === 'ko') for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; star(hx + Math.cos(a) * rx * 1.1, hy - ry - 4 * u + Math.sin(a) * 4 * u, 3.2 * u, '#ffd23f', '#000'); }
  if (o.sweat > 0 && Math.random() < 0.05 * o.sweat) spray(hx, hy - ry * 0.4, 1, 'sweat');
}
function legDraw(hx, hy, fx, fy, r, c, side, o, s) {
  const [kx, ky] = elbowPt(hx, hy, fx, fy, Math.max(Math.hypot(fx - hx, fy - hy) * 0.55, 20 * s * 0.55), side);
  LIMBO(hx, hy, r * 1.15, kx, ky, r, c); LIMBO(kx, ky, r, fx, fy - r, r * 0.85, c);
  if (o.dmg.leg > 0 && !o.C.robot) { E(lerp(hx, kx, 0.55), lerp(hy, ky, 0.55), r * 0.8, r * (0.4 + o.dmg.leg * 0.25), o.dmg.leg >= 3 ? '#a8305a' : '#e0607a'); }
  return [kx, ky];
}
function drawOpp(o, X0, pass, F, floorY, sMul) {
  const C = o.C, p = o.pose, s = C.s * (sMul || 1), jit = p.jit ? Math.sin(T * 47) * p.jit : 0;
  const FY = floorY || FLOOR_Y, X = X0 + (p.bx + jit) * s, Y = FY + p.by * s, u = s;
  const lx = v => X + v * s, ly = v => Y + v * s;
  if (o.st === 'down' || o.st === 'ko') { if (pass === 0) drawOppDown(o, X, Y, s, F); return; }
  const cr = p.crouch + p.kneel * 30, ln = p.lean, shY = -112 + cr, waY = -60 + cr * 0.55, hipY = -42 + cr * 0.4;
  const shW = C.shW || 30, waW = C.waW || 20;
  const drawKickLeg = () => { const k = p.kick, side = k.side; const hx = lx(side * 12 + ln * 0.2), hy = ly(hipY); legDraw(hx, hy, lx(k.x), ly(k.y), (C.legR || 7) * s * (1 + Math.max(0, k.r - 7) / 20), C.legC || C.skin, side, o, s); const sr = k.r * s; EO(lx(k.x), ly(k.y), sr * 1.1, sr * 0.9, C.shoe || '#222'); if (k.r > 10) { R(lx(k.x) - sr * 0.8, ly(k.y) - sr * 0.1, sr * 1.6, 1, '#fff'); } };
  if (pass === 1) {
    if (p.front === 'K' && p.kick) drawKickLeg();
    else if (p.front === 'L' || p.front === 'R') { const G = p.front === 'L' ? p.gl : p.gr, sd = p.front === 'L' ? -1 : 1; arm(lx(sd * shW + ln), ly(shY + 4), lx(G.x), ly(G.y), 24 * s * (1 + Math.max(0, G.r - 10) / 30), sd, 6 * s, 5 * s * (1 + Math.max(0, G.r - 10) / 18), C.armC || C.skin); glove(lx(G.x), ly(G.y), G.r * s, C.glove, -sd, { knuckles: G.r > 14, cuffC: C.cuff }); if (C.propFront) C.propFront(o, lx(G.x), ly(G.y), G.r * s); }
    return;
  }
  E(X, FY + 2, 44 * s, 6 * s, 'rgba(10,0,30,0.28)');
  if (C.behind) C.behind(o, X, Y, s, p);
  // legs
  const legR = (C.legR || 7) * s;
  for (const side of [-1, 1]) {
    if (p.kick && p.kick.side === side) { if (p.front !== 'K') drawKickLeg(); continue; }
    const f = side < 0 ? p.fl : p.fr; const kneel = p.kneel > 0.3 && side > 0;
    const hx = lx(side * 12 + ln * 0.2), hy = ly(hipY), fx = lx(f.x), fy = ly(f.y + (kneel ? -2 : 0));
    if (kneel) { LIMBO(hx, hy, legR, lx(side * 22), ly(-6), legR * 0.9, C.legC || C.skin); LIMBO(lx(side * 22), ly(-6), legR * 0.9, lx(side * 30), ly(-1), legR * 0.8, C.legC || C.skin); EO(lx(side * 33), ly(-2), 7 * s, 3.5 * s, C.shoe || '#222'); continue; }
    legDraw(hx, hy, fx, fy, legR, C.legC || C.skin, side, o, s);
    if (C.sock) R(fx - legR, fy - legR * 2.6, legR * 2, legR * 1.2, C.sock);
    EO(fx + side * 2 * s, fy - 2 * s, 9 * s, 4.5 * s, C.shoe || '#222'); R(fx - 6 * s + side * 2 * s, fy - 4 * s, 12 * s, 1, sh(C.shoe || '#222', 0.4));
  }
  // shorts
  const sc = C.shorts || '#2050d0', tw = waW + 4;
  PO([lx(-tw + ln * 0.5), ly(waY - 2), lx(tw + ln * 0.5), ly(waY - 2), lx(tw + 3 + ln * 0.2), ly(hipY + 8), lx(2), ly(hipY + 10), lx(ln * 0.2), ly(hipY + 2), lx(-2), ly(hipY + 10), lx(-tw - 3 + ln * 0.2), ly(hipY + 8)], sc);
  R(lx(-tw + ln * 0.5), ly(waY - 2), (tw * 2) * s, 3 * s, C.trim || '#fff');
  if (C.shortsDeco) C.shortsDeco(o, lx, ly, waY, hipY, tw, ln, s);
  // torso
  const sL = [lx(-shW + ln), ly(shY)], sR = [lx(shW + ln), ly(shY)], wL = [lx(-waW + ln * 0.5), ly(waY)], wR = [lx(waW + ln * 0.5), ly(waY)];
  PO([wL[0], wL[1], wR[0], wR[1], sR[0], sR[1] + 6 * s, sR[0] - 6 * s, sR[1], sL[0] + 6 * s, sL[1], sL[0], sL[1] + 6 * s], C.torsoC || C.skin);
  if (C.belly) { const b = C.belly; EO(lx(ln * 0.6), ly(waY - b.y + cr * 0.1), b.rx * s, b.ry * s, C.torsoC || C.skin); }
  if (C.torso) C.torso(o, lx, ly, shY, waY, shW, waW, ln, s);
  for (const b of o.dmg.bruises) E(lx(b.x + ln * 0.6), ly(b.y + cr * 0.6), b.r * s, b.r * 0.75 * s, C.robot ? '#4a5560' : BRUISE[Math.min(4, b.lv)]);
  // neck + head
  const hx = lx(ln * 1.15 + p.hx), hy = ly(-138 + cr + p.hy);
  R(lx(ln - 7), ly(shY - 12), 14 * s, 14 * s, '#000'); R(lx(ln - 6), ly(shY - 12), 12 * s, 14 * s, sh(C.skin, -0.12));
  // back arms (not front)
  const drawArm = (sd, G) => { arm(lx(sd * shW + ln), ly(shY + 4), lx(G.x), ly(G.y), 24 * s, sd, 6 * s, 5 * s, C.armC || C.skin); };
  if (p.front !== 'L') drawArm(-1, p.gl); if (p.front !== 'R') drawArm(1, p.gr);
  drawHeadGeneric(o, hx, hy, u, p.face);
  o.headScr = { x: hx, y: hy + 6 * s }; o.bodyScr = { x: lx(ln * 0.6), y: ly(-84 + cr) }; o.mouthScr = { x: hx, y: hy + 11 * s };
  if (p.front !== 'L') { glove(lx(p.gl.x), ly(p.gl.y), p.gl.r * s, C.glove, 1, { cuffC: C.cuff }); }
  if (p.front !== 'R') { glove(lx(p.gr.x), ly(p.gr.y), p.gr.r * s, C.glove, -1, { cuffC: C.cuff }); }
  if (p.prop && C.prop) C.prop(o, p.prop, lx, ly, s, hx, hy);
  if (o.glint > 0) { const G = o.glintAt === 'K' && p.kick ? { x: p.kick.x, y: p.kick.y } : (o.glintAt === 'L' ? p.gl : p.gr); const gs = (3 + Math.sin(T * 40) * 1.5) * Math.min(1, o.glint * 6) * s; star(lx(G.x), ly(G.y) - 4 * s, gs * 2.2, '#ffffff'); star(lx(G.x), ly(G.y) - 4 * s, gs * 1.2, '#ffd23f'); }
  if (C.over) C.over(o, X, Y, s, p, hx, hy);
}
function drawOppDown(o, X, Y, s, F) {
  const C = o.C, p = o.pose, k = clamp(o.downT / 0.35, 0, 1), lie = ease(k), u = s * 0.92;
  const by = lerp(-110, -26, lie) * s;
  // arms splayed
  for (const sd of [-1, 1]) { arm(X + sd * 26 * s, Y + by + 6 * s, X + sd * 56 * s, Y - 8 * s, 24 * s, sd, 6 * s, 5 * s, C.armC || C.skin); }
  EO(X, Y + by + 10 * s, (C.shW || 30) * 1.15 * s, 18 * s, C.torsoC || C.skin);
  if (C.torso) { } // keep simple when lying
  PO([X - 22 * s, Y - 18 * s, X + 22 * s, Y - 18 * s, X + 20 * s, Y - 4 * s, X - 20 * s, Y - 4 * s], C.shorts || '#2050d0');
  // legs toward camera, feet up (cartoon)
  for (const sd of [-1, 1]) { LIMBO(X + sd * 10 * s, Y - 8 * s, (C.legR || 7) * s, X + sd * 20 * s, Y + 4 * s, (C.legR || 7) * s, C.legC || C.skin); EO(X + sd * 22 * s, Y + 6 * s - Math.abs(Math.sin(T * 7 + sd)) * 2 * s * (o.st === 'ko' ? 1 : 0), 9 * s, 6 * s, C.shoe || '#222'); }
  glove(X - 58 * s, Y - 8 * s, 9 * s, C.glove, 1); glove(X + 58 * s, Y - 8 * s, 9 * s, C.glove, -1);
  drawHeadGeneric(o, X, Y + by - 14 * s, u, o.st === 'ko' || o.downT > 0.4 ? (o.getupAt && o.count >= o.getupAt - 2 ? 'dizzy' : 'ko') : 'hurt');
  o.headScr = { x: X, y: Y + by - 8 * s }; o.mouthScr = o.headScr;
}
