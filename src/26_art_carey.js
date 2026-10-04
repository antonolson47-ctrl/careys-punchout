/* ===================== ART: Carey (back view in fights, front view in scenes) ===================== */
const CAR = { hair: '#b8431f', hairHi: '#e2733a', hairDk: '#7a2610', skin: '#f5c6a0', skinSh: '#d99c78', top: '#ff3d8b', topSh: '#b8155a', shorts: '#6b2bd1', trim: '#ffd23f', glove: '#e8102a', cuff: '#ffffff', wrap: '#f4f4f4' };
function elbowPt(sx, sy, gx, gy, len, sign) {
  const dx = gx - sx, dy = gy - sy, d = Math.hypot(dx, dy) || 1, mx = (sx + gx) / 2, my = (sy + gy) / 2;
  if (d >= len * 2) return [mx, my]; const h = Math.sqrt(len * len - d * d / 4), nx = -dy / d, ny = dx / d; return [mx + nx * h * sign, my + ny * h * sign];
}
function arm(sx, sy, gx, gy, len, sign, r1, r2, c, o = '#000') {
  const [ex, ey] = elbowPt(sx, sy, gx, gy, len, sign);
  LIMB(sx, sy, r1 + 1, ex, ey, (r1 + r2) / 2 + 1, o); LIMB(ex, ey, (r1 + r2) / 2 + 1, gx, gy, r2 + 1, o);
  LIMB(sx, sy, r1, ex, ey, (r1 + r2) / 2, c); LIMB(ex, ey, (r1 + r2) / 2, gx, gy, r2, c);
}
function glove(x, y, r, c, side = 1, opts = {}) {
  const o = opts.o || '#000';
  if (opts.glow) E(x, y, r + 3 + Math.sin(T * 30) * 1.5, r + 3, opts.glow);
  EO(x, y, r, r * 1.02, c, o);
  E(x + side * r * 0.62, y + r * 0.25, r * 0.38, r * 0.5, o); E(x + side * r * 0.6, y + r * 0.22, r * 0.3, r * 0.42, c); // thumb
  E(x - r * 0.25, y - r * 0.35, r * 0.35, r * 0.25, sh(c, 0.45)); // shine
  if (opts.cuff !== false) { R(x - r * 0.6, y + r * 0.72, r * 1.2, Math.max(2, r * 0.3), o); R(x - r * 0.55, y + r * 0.75, r * 1.1, Math.max(1, r * 0.22), opts.cuffC || '#fff'); }
  if (opts.knuckles) { for (let i = -1; i <= 1; i++) LN(x + i * r * 0.35, y - r * 0.6, x + i * r * 0.3, y - r * 0.1, sh(c, -0.35)); }
}
// pose for Carey from fight state and targets (local coords: origin = bottom-centre of her body)
const CZ = 1.38;
function careyPose(PL, F) {
  const Z = CZ, p = { x: 0, y: 0, lean: 0, gl: { x: -24, y: -104, r: 12 }, gr: { x: 24, y: -104, r: 12 }, kick: null, spin: 0, tint: null, glowR: false };
  p.y = Math.sin(T * 5) * 1.4;
  const ox = F.cx + PL.dx, oy = 240 + PL.dy, tH = { x: F.oHead.x - ox, y: F.oHead.y - oy }, tB = { x: F.oBody.x - ox, y: F.oBody.y - oy };
  const st = PL.st, k = PL.atk ? PL.t / PL.atk.su : 0;
  if (st === 'atk' && PL.atk) {
    const a = PL.atk, side = a.side === 'L' ? -1 : 1, G = side < 0 ? p.gl : p.gr, imp = PL.t < a.su ? ease(Math.pow(clamp(k, 0, 1), 1.6)) : 1 - ease((PL.t - a.su) / a.rec);
    const tgt = a.tgt === 'body' ? tB : tH, tx = tgt.x + side * 4, ty = tgt.y + 2;
    if (a.kind === 'jab') { G.x = lerp(G.x, tx, imp); G.y = lerp(G.y, ty, imp); G.r = lerp(12, 8, imp); p.lean = side * 3 * imp; }
    else if (a.kind === 'hook') { const arc = Math.sin(imp * Math.PI) * 24 * side; G.x = lerp(G.x + side * 10, tx, imp) + arc; G.y = lerp(G.y + 6, ty, imp) - Math.sin(imp * Math.PI) * 8; G.r = lerp(12, 9, imp); p.lean = -side * 8 * imp; }
    else if (a.kind === 'body') { G.x = lerp(G.x, tx, imp) + Math.sin(imp * Math.PI) * 10 * side; G.y = lerp(G.y + 8, ty, imp); G.r = lerp(12, 9, imp); p.y += 7 * imp; p.lean = -side * 5 * imp; }
    else if (a.kind === 'upper' || a.kind === 'star') {
      const pre = a.kind === 'star' ? 0.55 : 0.4, dip = PL.t < a.su ? Math.min(1, k / pre) : 0, rise = PL.t < a.su ? clamp((k - pre) / (1 - pre), 0, 1) : 1 - ease((PL.t - a.su) / a.rec);
      G.x = lerp(lerp(G.x, side * 14, dip), tx, ease(rise)); G.y = lerp(lerp(G.y, -56, dip), ty + 8, ease(rise)); G.r = lerp(a.kind === 'star' ? 15 : 12, 9, rise); p.y += 11 * dip * (1 - rise); p.lean = side * 4 * rise;
      if (a.kind === 'star') p.glowR = true;
    } else { // kicks
      const kside = a.kind === 'round' ? -1 : 1, hip = { x: kside * 12, y: -8 };
      let fx = tx, fy = ty; if (a.kind === 'leg') { fx = tB.x + 22; fy = FLOOR_Y - 34 - oy; }
      if (a.kind === 'round') {
        const spinK = PL.t < a.su ? clamp(k / 0.5, 0, 1) : 1; p.spin = PL.t < a.su ? spinK : 0;
        const sw = PL.t < a.su ? clamp((k - 0.45) / 0.55, 0, 1) : 1 - ease((PL.t - a.su) / a.rec);
        if (sw > 0) p.kick = { hx: hip.x, hy: hip.y, fx: lerp(-150, fx, ease(sw)), fy: lerp(-60, fy, ease(sw)) - Math.sin(sw * Math.PI) * 14, r: lerp(10, 8, sw), trail: PL.t <= a.su + 0.08 ? 1 : 0, side: kside };
        p.lean = 14 * Math.sin(spinK * Math.PI); p.y += 5;
      } else {
        const sw = PL.t < a.su ? ease(Math.pow(k, 1.3)) : 1 - ease((PL.t - a.su) / a.rec);
        p.kick = { hx: hip.x, hy: hip.y, fx: lerp(kside * 24, fx, sw), fy: lerp(14, fy, sw), r: lerp(10, a.kind === 'head' ? 8 : 9, sw), trail: PL.t <= a.su + 0.06 && sw > 0.6 ? 1 : 0, side: kside };
        p.lean = -kside * (a.kind === 'head' ? 20 : 8) * sw; p.y += (a.kind === 'head' ? 12 : 4) * sw; p.gl.x -= 8 * sw; p.gr.x -= 6 * sw; p.gl.y += 6 * sw;
      }
    }
  } else if (st === 'block') { p.gl = { x: -11, y: -116, r: 13 }; p.gr = { x: 11, y: -116, r: 13 }; }
  else if (st === 'duck') { p.gl = { x: -17, y: -108, r: 12 }; p.gr = { x: 17, y: -108, r: 12 }; }
  else if (st === 'hurt') { p.gl.y += 10; p.gr.y += 10; p.gl.x -= 6; p.gr.x += 6; p.tint = PL.t < 0.12 ? '#ffffff' : null; }
  else if (st === 'idle' && PL.gasT > 0) { p.gl = { x: -30, y: -78, r: 12 }; p.gr = { x: 30, y: -78, r: 12 }; p.y += 8 + Math.sin(T * 3) * 2; }
  else if (st === 'win') { p.gl = { x: -38, y: -160 + Math.sin(T * 8) * 4, r: 12 }; p.gr = { x: 38, y: -160 + Math.cos(T * 8) * 4, r: 12 }; p.y -= Math.abs(Math.sin(T * 6)) * 5; }
  if (st === 'dodge') p.lean = PL.dir * 10;
  p.x = PL.dx; p.y += PL.dy;
  return p;
}
function drawCareyBack(cx, PL, F) {
  const p = careyPose(PL, F), X = cx + p.x, B = 240 + p.y, L = p.lean, wf = p.spin ? Math.max(0.35, Math.abs(Math.cos(p.spin * Math.PI))) : 1;
  const sk = PL.gasT > 0 ? '#ffb0b0' : CAR.skin, skD = PL.gasT > 0 ? '#e09090' : CAR.skinSh;
  const sL = { x: X + L - 24 * wf, y: B - 66 }, sR = { x: X + L + 24 * wf, y: B - 66 };
  const hx = X + L * 1.25, hy = B - 94;
  const pt = PL.pony || (PL.pony = { x: hx, y: hy + 10, vx: 0, vy: 0 }); const ax = hx + L * 0.4 + (p.spin ? Math.sin(p.spin * 6.28) * 26 : 0), ay = hy + 14;
  if (DT > 0) { pt.vx += ((ax - pt.x) * 80 - pt.vx * 8) * DT; pt.vy += ((ay - pt.y) * 80 - pt.vy * 8 + 160) * DT; pt.x += pt.vx * DT; pt.y += pt.vy * DT; }
  const drawKick = () => {
    const k = p.kick; if (!k) return; const hx2 = X + k.hx + L * 0.3, hy2 = B + k.hy, fx = X + k.fx, fy = B + k.fy, d = Math.hypot(fx - hx2, fy - hy2);
    if (k.trail) for (let i = 1; i <= 4; i++) E(fx - k.side * i * 11, fy + i * 4, k.r + 3 - i * 0.5, k.r, 'rgba(255,255,255,' + (0.38 - i * 0.08) + ')');
    const kx = Math.max(hx2, fx) * (k.side > 0 ? 1 : 0) + Math.min(hx2, fx) * (k.side > 0 ? 0 : 1) + k.side * Math.min(52, 14 + d * 0.28), ky = lerp(hy2, fy, 0.5) + 6;
    LIMB(hx2, hy2, 13, kx, ky, 10, '#000'); LIMB(kx, ky, 10, fx, fy, k.r + 1, '#000'); LIMB(hx2, hy2, 12, kx, ky, 9, sk); LIMB(kx, ky, 9, fx, fy, k.r, sk);
    LIMB(lerp(hx2, kx, 0.45), lerp(hy2, ky, 0.45), 6, kx, ky, 6, skD); LIMB(kx, ky, 8, fx, fy, k.r - 1, sk);
    LIMB(hx2, hy2, 12, lerp(hx2, kx, 0.4), lerp(hy2, ky, 0.4), 11, CAR.shorts);
    EO(fx, fy, k.r + 3, k.r + 1, sk); R(fx - k.r - 1, fy + k.r * 0.1, (k.r + 1) * 2, 3, CAR.wrap); E(fx - k.r * 0.4, fy - k.r * 0.5, k.r * 0.5, k.r * 0.3, '#ffe0c8');
  };
  if (p.kick && p.kick.fy > -40) drawKick();
  // torso (back), racerback top, name, shorts
  PO([X - 21 * wf, B + 1, X + 21 * wf, B + 1, sR.x + 3, sR.y + 4, sR.x - 5, sR.y - 1, sL.x + 5, sL.y - 1, sL.x - 3, sL.y + 4], sk);
  LN(X + L * 0.6, B - 56, X + L * 0.2, B - 20, skD); E(X + L * 0.8 - 11 * wf, B - 54, 6 * wf, 4, skD); E(X + L * 0.8 + 11 * wf, B - 54, 6 * wf, 4, skD);
  P([X - 20 * wf, B - 2, X + 20 * wf, B - 2, X + L * 0.8 + 21 * wf, B - 56, X + L * 0.8 + 8, B - 62, X + L * 0.8 - 8, B - 62, X + L * 0.8 - 21 * wf, B - 56], CAR.top); LN(X + L * 0.8 - 8, B - 60, X - 6, B - 24, CAR.topSh); LN(X + L * 0.8 + 8, B - 60, X + 6, B - 24, CAR.topSh);
  P([X + L * 0.8 - 5, B - 56, X + L * 0.8 + 5, B - 56, X + L + 3, B - 68, X + L - 3, B - 68], CAR.top);
  R(X - 20 * wf, B - 19, 40 * wf, 3, CAR.topSh);
  if (wf > 0.7) TX('CAREY', X + L * 0.5, B - 42, '#fff', 1, 0.5, CAR.topSh);
  PO([X - 22 * wf, B + 2, X + 22 * wf, B + 2, X + 21 * wf, B - 13, X - 21 * wf, B - 13], CAR.shorts); R(X - 21 * wf, B - 14, 42 * wf, 4, CAR.trim);
  // neck, ears, head
  R(X + L * 1.1 - 6, B - 84, 12, 18, '#000'); R(X + L * 1.1 - 5, B - 84, 10, 18, skD);
  const ac = PL.gasT > 0 ? '#f0a0a0' : '#ecb48e';
  arm(sL.x, sL.y, X + p.gl.x, B + p.gl.y, 27, 1, 6, 5, ac);
  arm(sR.x, sR.y, X + p.gr.x, B + p.gr.y, 27, -1, 6, 5, ac);
  for (const sd of [-1, 1]) { E(hx + sd * 15, hy + 3, 4, 5, '#000'); E(hx + sd * 15, hy + 3, 3, 4, sk); }
  EO(hx, hy, 15, 16, CAR.hair); E(hx - 4, hy - 7, 7, 5, CAR.hairHi); LN(hx, hy - 15, hx, hy + 8, CAR.hairDk); LN(hx - 6, hy - 13, hx - 8, hy + 8, CAR.hairDk); LN(hx + 6, hy - 13, hx + 8, hy + 8, CAR.hairDk);
  LIMBO(hx, hy - 10, 6.5, pt.x, pt.y + 14, 3, CAR.hair); LIMB(hx, hy - 9, 3, lerp(hx, pt.x, 0.6), lerp(hy - 9, pt.y + 14, 0.6), 1.5, CAR.hairHi);
  EO(hx, hy - 11, 4.5, 3, CAR.trim);
  glove(X + p.gl.x, B + p.gl.y, p.gl.r, CAR.glove, -1); glove(X + p.gr.x, B + p.gr.y, p.gr.r, CAR.glove, 1, p.glowR ? { glow: 'rgba(255,230,80,0.6)' } : {});
  if (p.kick && p.kick.fy <= -40) drawKick();
  if (p.tint) { g.globalAlpha = 0.5; E(hx, hy, 16, 17, p.tint); g.globalAlpha = 1; }
  if (PL.gasT > 0 && Math.random() < 0.1) spray(hx, hy - 8, 1, 'sweat');
  if (PL.st === 'down') for (let i = 0; i < 3; i++) { const a = T * 4 + i * 2.1; star(hx + Math.cos(a) * 18, hy - 18 + Math.sin(a) * 5, 3.5, '#ffd23f', '#000'); }
  PL.headPos = { x: hx, y: hy };
}
/* front view of Carey for title/corner/interview. opts: {armUp:'R'|'both'|null, sit, dmg (0..1), mouth:'smile'|'open'|'grit', blink} */
function drawCareyFront(x, y, s = 1, opts = {}) {
  const sk = CAR.skin, d = opts.dmg || 0;
  const S_ = v => v * s;
  // legs
  if (!opts.sit) { LIMBO(x - S_(8), y - S_(40), S_(6), x - S_(10), y - S_(4), S_(5), sk); LIMBO(x + S_(8), y - S_(40), S_(6), x + S_(10), y - S_(4), S_(5), sk); EO(x - S_(11), y - S_(2), S_(7), S_(3), '#fff'); EO(x + S_(11), y - S_(2), S_(7), S_(3), '#fff'); R(x - S_(16), y - S_(10), S_(10), S_(3), CAR.wrap); R(x + S_(6), y - S_(10), S_(10), S_(3), CAR.wrap); }
  else { LIMBO(x - S_(8), y - S_(40), S_(6), x - S_(14), y - S_(26), S_(6), sk); LIMBO(x - S_(14), y - S_(26), S_(6), x - S_(14), y - S_(2), S_(5), sk); LIMBO(x + S_(8), y - S_(40), S_(6), x + S_(14), y - S_(26), S_(6), sk); LIMBO(x + S_(14), y - S_(26), S_(6), x + S_(14), y - S_(2), S_(5), sk); }
  // shorts
  PO([x - S_(17), y - S_(56), x + S_(17), y - S_(56), x + S_(18), y - S_(34), x + S_(2), y - S_(34), x, y - S_(40), x - S_(2), y - S_(34), x - S_(18), y - S_(34)], CAR.shorts); R(x - S_(17), y - S_(57), S_(34), S_(3), CAR.trim);
  // torso
  PO([x - S_(14), y - S_(56), x + S_(14), y - S_(56), x + S_(18), y - S_(92), x - S_(18), y - S_(92)], sk);
  PO([x - S_(14), y - S_(70), x + S_(14), y - S_(70), x + S_(15), y - S_(88), x - S_(15), y - S_(88)], CAR.top); LN(x - S_(9), y - S_(66), x + S_(9), y - S_(66), CAR.skinSh); LN(x, y - S_(56), x, y - S_(68), CAR.skinSh);
  // arms
  const sL = [x - S_(18), y - S_(88)], sR = [x + S_(18), y - S_(88)];
  const gl = opts.armUp === 'both' || opts.armUp === 'L' ? [x - S_(30), y - S_(130)] : opts.sit ? [x - S_(24), y - S_(50)] : [x - S_(14), y - S_(104)];
  const gr = opts.armUp === 'both' || opts.armUp === 'R' ? [x + S_(30), y - S_(132)] : opts.sit ? [x + S_(24), y - S_(50)] : [x + S_(14), y - S_(104)];
  arm(sL[0], sL[1], gl[0], gl[1], S_(18), -1, S_(4.5), S_(3.5), sk); arm(sR[0], sR[1], gr[0], gr[1], S_(18), 1, S_(4.5), S_(3.5), sk);
  // neck/head
  R(x - S_(4), y - S_(100), S_(8), S_(10), CAR.skinSh);
  const hx = x, hy = y - S_(112);
  LIMBO(hx + S_(8), hy - S_(12), S_(4), hx + S_(16) + Math.sin(T * 3) * S_(2), hy + S_(10), S_(2.5), CAR.hair); // ponytail peeking
  EO(hx, hy, S_(13), S_(14), sk);
  EH(hx, hy - S_(2), S_(14), S_(13), CAR.hair, true); E(hx - S_(5), hy - S_(10), S_(6), S_(3), CAR.hairHi); P([hx - S_(13), hy - S_(3), hx - S_(4), hy - S_(8), hx + S_(6), hy - S_(4), hx + S_(13), hy - S_(3), hx + S_(13), hy - S_(8), hx - S_(13), hy - S_(8)], CAR.hair);
  R(hx - S_(13), hy - S_(7), S_(26), S_(2), CAR.trim); // headband
  // eyes (big cartoon)
  const blink = opts.blink || (Math.sin(T * 1.3) > 0.985);
  for (const sd of [-1, 1]) {
    const ex = hx + sd * S_(5), ey = hy + S_(1);
    if (d > 0.5 && sd < 0) E(ex, ey + S_(1), S_(5.5), S_(5), '#7a3a8a');
    if (blink) LN(ex - S_(3), ey, ex + S_(3), ey, '#000'); else { EO(ex, ey, S_(3.6), S_(4.2), '#fff'); E(ex + sd * S_(0.5), ey + S_(0.8), S_(1.6), S_(2), '#2a6a3a'); PX(ex, ey, '#000'); }
    LN(ex - S_(3), ey - S_(5) + (sd < 0 ? 0 : 0), ex + S_(3), ey - S_(6) + (sd > 0 ? 1 : 0), CAR.hairDk); // brows
    PX(ex - sd * S_(4), ey - S_(3), '#000'); // lash
  }
  // freckles
  for (const [fx, fy] of [[-7, 6], [-5, 7], [5, 7], [7, 6]]) PX(hx + S_(fx), hy + S_(fy), '#c47a50');
  const mt = opts.mouth || 'smile';
  if (mt === 'open') { EO(hx, hy + S_(9), S_(4), S_(3), '#7a1020'); R(hx - S_(3), hy + S_(7), S_(6), S_(1), '#fff'); }
  else if (mt === 'grit') { R(hx - S_(4), hy + S_(8), S_(8), S_(3), '#000'); R(hx - S_(3), hy + S_(9), S_(6), S_(1), '#fff'); }
  else { LN(hx - S_(4), hy + S_(8), hx - S_(2), hy + S_(10), '#7a1020'); LN(hx - S_(2), hy + S_(10), hx + S_(2), hy + S_(10), '#7a1020'); LN(hx + S_(2), hy + S_(10), hx + S_(4), hy + S_(8), '#7a1020'); }
  if (d > 0.3) { R(hx + S_(6), hy - S_(5), S_(5), S_(2), '#f8e0b0'); R(hx + S_(7), hy - S_(6), S_(3), S_(4), '#f8e0b0'); } // band-aid
  // gloves
  glove(gl[0], gl[1], S_(8), CAR.glove, -1); glove(gr[0], gr[1], S_(8), CAR.glove, 1);
  if (opts.belt) { PO([x - S_(19), y - S_(60), x + S_(19), y - S_(60), x + S_(19), y - S_(50), x - S_(19), y - S_(50)], '#d4a017'); EO(x, y - S_(55), S_(8), S_(7), '#ffe066'); star(x, y - S_(55), S_(4), '#ff3b5c'); }
}
