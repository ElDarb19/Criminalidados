// ===== Dados decorados (Tienda del perfil) =====
// Son solo decoración: cambian cómo se ve TU dado al tirar (también para los demás en online), nunca el resultado.
//  · Acabado (fin): cambia el dado en sí — Oro (contorno y números dorados) o Balazo (plomo con un agujero de bala).
//  · Aura: partículas alrededor del dado mientras rueda. Con "Reducir animaciones" (o el aviso del sistema)
//    se usa su versión estática: una decoración sólida que tampoco tapa el dado.
// El color del jugador se conserva siempre (para saber de quién es la tirada). Cada acabado y cada aura se compra
// una vez con oro y se elige en Perfil → Tu Capo.
const DICE_ITEMS = [
  { key:'fin:oro',       kind:'fin',  id:'oro',      label:'Oro',      sub:'contorno y números dorados', price:500 },
  { key:'fin:balazo',    kind:'fin',  id:'balazo',   label:'Balazo',   sub:'plomo con agujero de bala',  price:500 },
  { key:'aura:fuego',    kind:'aura', id:'fuego',    label:'Fuego',    sub:'llamas que suben',           price:400 },
  { key:'aura:aire',     kind:'aura', id:'aire',     label:'Aire',     sub:'remolino de viento',         price:400 },
  { key:'aura:tierra',   kind:'aura', id:'tierra',   label:'Tierra',   sub:'rocas que orbitan',          price:400 },
  { key:'aura:agua',     kind:'aura', id:'agua',     label:'Agua',     sub:'gotas en ola',               price:400 },
  { key:'aura:rayo',     kind:'aura', id:'rayo',     label:'Rayo',     sub:'chispas eléctricas',         price:400 },
  { key:'aura:humo',     kind:'aura', id:'humo',     label:'Humo',     sub:'niebla de callejón',         price:400 },
  { key:'aura:billetes', kind:'aura', id:'billetes', label:'Billetes', sub:'lluvia de dólares',          price:400 },
  { key:'aura:monedas',  kind:'aura', id:'monedas',  label:'Monedas',  sub:'oro que cae girando',        price:400 },
  { key:'aura:neon',     kind:'aura', id:'neon',     label:'Neón',     sub:'letrero de club nocturno',   price:400 }
];

const DICEFX = (() => {
  const C = 48, R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], SQ = (x, y) => Math.sqrt(x * x + y * y);
  const still = () => typeof reducedMotion === 'function' ? reducedMotion() : matchMedia('(prefers-reduced-motion: reduce)').matches;
  let BASE = '';                                          // carpeta del juego (las pruebas y el prototipo la cambian)
  const imgs = {};
  const img = src => { if (!imgs[src]) { const i = new Image(); i.src = src; imgs[src] = i; } return imgs[src]; };
  const ok = i => i.complete && i.naturalWidth > 0;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };

  // ---------- auras animadas: spawn() crea una partícula, step() la mueve, draw() la pinta (rate = nuevas por cuadro) ----------
  // behind: todas van detrás del dado (las que cruzan la cara taparían el número).
  const ANIM = {
    fuego: { rate:2.2,
      spawn() { const a = R(0, Math.PI * 2), r = R(20, 26); return { x:C + Math.cos(a) * r, y:C + Math.sin(a) * r * .9 + 4, vx:R(-.15, .15), vy:R(-1.1, -.5), life:0, max:R(22, 40) }; },
      step(p) { p.x += p.vx + Math.sin((p.life + p.y) * .3) * .25; p.y += p.vy; },
      draw(g, p) { const t = p.life / p.max; g.fillStyle = t < .25 ? '#fff3a0' : t < .5 ? '#ffb02e' : t < .78 ? '#e8501c' : '#7a1e10'; const s = t < .5 ? 2 : 1; g.fillRect(p.x | 0, p.y | 0, s, s); } },
    aire: { rate:1.2,
      spawn() { return { a:R(0, Math.PI * 2), r:R(25, 34), w:R(.05, .09) * pick([1, 1, 1.2]), life:0, max:R(40, 70), h:R(-3, 3) }; },
      step(p) { p.a += p.w; p.r -= .04; },
      draw(g, p) { const t = p.life / p.max; for (let k = 0; k < 4; k++) { const a = p.a - k * .09, x = C + Math.cos(a) * p.r, y = C + Math.sin(a) * p.r * .55 + p.h + Math.sin(a * 2) * 3;
        g.globalAlpha = (1 - t) * (1 - k * .22); g.fillStyle = k ? '#bfe6f2' : '#ffffff'; g.fillRect(x | 0, y | 0, 1, 1); } g.globalAlpha = 1; } },
    tierra: { rate:.45,
      spawn() { return { a:R(0, Math.PI * 2), r:R(27, 33), w:R(.02, .035), life:0, max:R(90, 140), c:pick(['#8a6a44', '#6e5234', '#a8845a', '#5a7a3a']), s:pick([2, 2, 3]), dust:Math.random() < .3 }; },
      step(p) { p.a += p.w; },
      draw(g, p) { const x = C + Math.cos(p.a) * p.r, y = C + Math.sin(p.a) * p.r * .7 + Math.sin(p.life * .08) * 1.5, t = p.life / p.max;
        g.globalAlpha = t < .1 ? t * 10 : t > .85 ? (1 - t) / .15 : 1;
        g.fillStyle = '#2a1e12'; g.fillRect((x | 0) - 1, (y | 0) - 1, p.s + 2, p.s + 2); g.fillStyle = p.c; g.fillRect(x | 0, y | 0, p.s, p.s);
        if (p.dust) { g.fillStyle = '#c9b48a'; g.fillRect((x | 0) + p.s + 1, (y | 0) + 1, 1, 1); } g.globalAlpha = 1; } },
    agua: { rate:1.4,
      spawn() { const drip = Math.random() < .25; return { a:R(0, Math.PI * 2), r:R(24, 30), w:R(.04, .06), life:0, max:drip ? R(25, 40) : R(45, 70), drip, vy:0 }; },
      step(p) { if (p.drip) p.vy += .08; else p.a += p.w; },
      draw(g, p) { let x = C + Math.cos(p.a) * p.r, y = C + Math.sin(p.a) * p.r * .6 + Math.sin(p.a * 3 + p.life * .1) * 3; if (p.drip) y += p.vy * p.life * .5;
        const t = p.life / p.max; g.globalAlpha = 1 - t * .7; g.fillStyle = '#1a5aa8'; g.fillRect(x | 0, y | 0, 2, 2); g.fillStyle = '#7fd0ff'; g.fillRect(x | 0, y | 0, 1, 1); g.globalAlpha = 1; } },
    rayo: { rate:.6,
      spawn() { const a = R(0, Math.PI * 2), pts = []; let r = 20; while (r < 40) { pts.push([C + Math.cos(a) * r + R(-3, 3), C + Math.sin(a) * r + R(-3, 3)]); r += R(3, 6); } return { pts, life:0, max:6 }; },
      step() {},
      draw(g, p) { g.fillStyle = p.life % 2 ? '#fff6a8' : '#ffe14a';
        for (let i = 1; i < p.pts.length; i++) { const [x0, y0] = p.pts[i - 1], [x1, y1] = p.pts[i], n = Math.max(1, Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0);
          for (let k = 0; k <= n; k++) g.fillRect((x0 + (x1 - x0) * k / n) | 0, (y0 + (y1 - y0) * k / n) | 0, 1, 1); } } },
    humo: { rate:.7, behind:true,
      spawn() { return { x:C + R(-22, 22), y:C + R(-4, 16), vx:R(-.18, .18), vy:R(-.55, -.3), life:0, max:R(60, 95) }; },   // sale por detrás del dado y sube
      step(p) { p.x += p.vx; p.y += p.vy; },
      draw(g, p) { const t = p.life / p.max, s = 2 + (t * 6 | 0); g.globalAlpha = (1 - t) * (1 - t) * .7;          // cuanto más lejos, menos se ve
        g.fillStyle = t < .5 ? '#8a8a8a' : '#5a5a5a'; g.fillRect((p.x - s / 2) | 0, (p.y - s / 2) | 0, s, s); g.globalAlpha = 1; } },
    billetes: { rate:.35, behind:true,
      spawn() { return { x:R(10, 86), y:-4, vx:R(-.3, .3), vy:R(.35, .6), life:0, max:R(120, 180), ph:R(0, 6) }; },
      step(p) { p.x += p.vx + Math.sin(p.life * .1 + p.ph) * .4; p.y += p.vy; },
      draw(g, p) { const flip = Math.sin(p.life * .15 + p.ph) > 0, w = flip ? 5 : 3, h = flip ? 3 : 2;
        g.fillStyle = '#1e3a1e'; g.fillRect((p.x | 0) - 1, (p.y | 0) - 1, w + 2, h + 2); g.fillStyle = '#6fb06a'; g.fillRect(p.x | 0, p.y | 0, w, h);
        if (flip) { g.fillStyle = '#2e5a2e'; g.fillRect((p.x | 0) + 2, (p.y | 0) + 1, 1, 1); } } },
    monedas: { rate:.4, behind:true,
      spawn() { return { x:R(12, 84), y:-3, vy:R(.4, .8), life:0, max:R(110, 150), ph:R(0, 6) }; },
      step(p) { p.y += p.vy; },
      draw(g, p) { const w = [3, 2, 1, 2][((p.life * .25 + p.ph) | 0) % 4];
        g.fillStyle = '#5a4010'; g.fillRect((p.x | 0) - 1, (p.y | 0) - 1, w + 2, 5); g.fillStyle = '#e8c860'; g.fillRect(p.x | 0, p.y | 0, w, 3);
        if (w > 1) { g.fillStyle = '#fff2b0'; g.fillRect(p.x | 0, p.y | 0, 1, 1); } } },
    neon: { rate:1,
      spawn() { return { a:R(0, Math.PI * 2), life:0, max:R(30, 50), c:pick(['#ff4fd8', '#4ff2ff']) }; },
      step(p) { p.a += .03; },
      draw(g, p) { const t = p.life / p.max, x = C + Math.cos(p.a) * 30, y = C + Math.sin(p.a) * 30; g.globalAlpha = Math.sin(t * Math.PI) * (Math.random() < .08 ? .2 : 1);
        g.fillStyle = p.c; g.fillRect(x | 0, y | 0, 2, 2); g.globalAlpha = .35; g.fillRect((x | 0) - 1, (y | 0) - 1, 4, 4); g.globalAlpha = 1; } }
  };

  // ---------- auras estáticas: formas sólidas de pixel art, pintadas solo FUERA de la silueta del dado ----------
  const STILL = {
    aire(P) {                                             // tres cintas de viento que abrazan el dado, con su remolino al final
      [{ rx:36, ry:15, o:-8, t0:-2.7, t1:.3 }, { rx:31, ry:12, o:10, t0:.5, t1:3.3 }, { rx:40, ry:20, o:2, t0:3.5, t1:5.9 }].forEach(k => {
        for (let t = k.t0; t <= k.t1; t += .006) { const x = C + Math.cos(t) * k.rx, y = C + Math.sin(t) * k.ry + k.o, w = Math.sin((t - k.t0) / (k.t1 - k.t0) * Math.PI);
          P(x, y + 1, '#3a6a7a'); P(x, y, '#ffffff'); if (w > .45) { P(x, y - 1, '#bfe6f2'); P(x, y + 1, '#9fd8ec'); P(x, y + 2, '#3a6a7a'); } }
        const ex = C + Math.cos(k.t1) * k.rx, ey = C + Math.sin(k.t1) * k.ry + k.o;
        for (let t = 0; t < 5.2; t += .05) { const rr = 3.2 - t * .45; P(ex + Math.cos(t + k.t1) * rr, ey + Math.sin(t + k.t1) * rr, '#ffffff'); } }); },
    tierra(P) {                                           // anillo de roca con aristas, vetas y musgo arriba
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const dx = x - C, dy = y - C, r = SQ(dx, dy * 1.1), a = Math.atan2(dy, dx);
        const saw = Math.abs(((a + Math.PI) * 7 / Math.PI) % 2 - 1), Ro = 30 + 4.5 * saw, Ri = 24; if (r < Ri || r > Ro) continue;
        const d = Ro - r, crack = (((a + Math.PI) * 30) | 0) % 11 === 0;
        P(x, y, d < 1.2 || r < Ri + 1 ? '#2a1e12' : dy < -6 && d < 3.2 ? (((x + y) % 3) ? '#5a8a3a' : '#7aa84a') : crack ? '#3a2a1a' : ((r | 0) % 4 < 2 ? '#8a6a44' : '#6e5234')); } },
    agua(P) {                                             // anillo de olas con espuma blanca en la cresta
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const dx = x - C, dy = y - C, r = SQ(dx, dy * 1.15), a = Math.atan2(dy, dx);
        const Ro = 32 + 2.6 * Math.sin(7 * a), Ri = 24; if (r < Ri || r > Ro + 1) continue;
        const d = Ro - r; P(x, y, d < 0 ? '#0a2448' : d < 1.3 ? '#e8f8ff' : d < 3 ? '#7fd0ff' : d < 5.5 ? '#2e7fd0' : '#1a4a90'); } },
    rayo(P) {                                             // tres rayos fijos que salen del dado, con brillo alrededor
      [-2.35, -.55, 1.95].forEach((a, i) => { const pts = []; for (let k = 0; k <= 5; k++) { const r = 21 + k * 4.4, o = (k % 2 ? 3.2 : -3.2) * (i % 2 ? -1 : 1);
          pts.push([C + Math.cos(a) * r - Math.sin(a) * o, C + Math.sin(a) * r + Math.cos(a) * o]); }
        const line = c => { for (let j = 1; j < pts.length; j++) { const [x0, y0] = pts[j - 1], [x1, y1] = pts[j], n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
          for (let s = 0; s <= n; s++) c(x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n); } };
        line((x, y) => { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) P(x + ox, y + oy, '#b08a10'); });
        line((x, y) => { P(x, y, '#ffe14a'); P(x + 1, y, '#ffe14a'); });
        line((x, y) => P(x, y, '#fffbe0')); }); },
    billetes(P) {                                         // abanico doble de billetes asomando detrás del dado
      const bill = (deg, r) => { const a = deg * Math.PI / 180, bx = Math.round(C + Math.cos(a) * r - 8), by = Math.round(C + Math.sin(a) * r - 4);
        for (let y = 0; y < 9; y++) for (let x = 0; x < 17; x++) { const edge = x === 0 || y === 0 || x === 16 || y === 8, inner = x === 2 || y === 2 || x === 14 || y === 6, mid = Math.abs(x - 8) <= 2 && y >= 3 && y <= 5;
          P(bx + x, by + y, edge ? '#1e3a1e' : mid ? '#2e5a2e' : inner ? '#4e8a4a' : '#6fb06a'); } };
      [[-165, 36], [-135, 38], [-105, 39], [-75, 39], [-45, 38], [-15, 36]].forEach(b => bill(...b));          // fila de atrás
      [[-178, 27], [-150, 28], [-122, 29], [-90, 30], [-58, 29], [-30, 28], [-2, 27], [160, 29], [20, 29]].forEach(b => bill(...b)); },
    monedas(P) {                                          // pilas de monedas de oro a los pies del dado
      const coin = (cx, cy, top) => { for (let y = -3; y <= 3; y++) for (let x = -6; x <= 6; x++) { const e = (x * x) / 36 + (y * y) / 9; if (e > 1) continue;
        P(cx + x, cy + y, e > .7 ? '#5a4010' : y > 0 ? '#b8922e' : top && x < -1 && y < 0 ? '#fff2b0' : '#e8c860'); } };
      [[16, 80, 5], [80, 80, 6], [29, 86, 2], [67, 86, 3], [8, 66, 2], [88, 64, 1]].forEach(([cx, cy, n]) => { for (let k = 0; k < n; k++) coin(cx, cy - k * 3, k === n - 1); }); },
    neon(P) {                                             // dos anillos de neón, rosa y cian, con su resplandor
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const r = SQ(x - C, y - C);
        const c = r > 31.5 && r < 33.5 ? (Math.abs(r - 32.5) < .5 ? '#ffd0f4' : '#ff4fd8') : r > 36 && r < 37.3 ? '#4ff2ff' : r > 30.3 && r < 31.5 || r > 33.5 && r < 34.8 ? '#5a1e50' : r > 37.3 && r < 38.4 ? '#1e4a50' : null;
        if (c) P(x, y, c); } }
  };

  // ---------- el dado (48x48) con su acabado ----------
  const mix = (d, i, hex, t) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    d[i] += (r - d[i]) * t; d[i + 1] += (g - d[i + 1]) * t; d[i + 2] += (b - d[i + 2]) * t; };
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const dieCache = {};
  function layers(sides, color, val) { const d = BASE + 'assets/D' + sides + '/';
    return { sh:sides > 6 ? img(d + 'Sombra.png') : null, col:img(d + color + '.png'), base:img(d + 'Capa 0.png'), num:img(d + val + '.png') }; }
  function dieCanvas(sides, color, val, fin) {           // dado listo para pintar (null si sus imágenes aún no cargan)
    const k = [sides, color, val, fin].join('|'); if (dieCache[k]) return dieCache[k];
    const L = layers(sides, color, val); if (![L.col, L.base, L.num].concat(L.sh ? [L.sh] : []).every(ok)) return null;
    const cv = canvas(48), g = cv.getContext('2d');
    const layer = i => { const c = canvas(48), x = c.getContext('2d'); x.drawImage(i, 0, 0); return [c, x, x.getImageData(0, 0, 48, 48)]; };
    if (L.sh) g.drawImage(L.sh, 0, 0);
    const [cc, cx, cd] = layer(L.col);
    if (fin === 'balazo') { for (let i = 0; i < cd.data.length; i += 4) if (cd.data[i + 3]) mix(cd.data, i, '#7a8088', .55); cx.putImageData(cd, 0, 0); }   // plomo
    g.drawImage(cc, 0, 0); g.drawImage(L.base, 0, 0);
    const all = g.getImageData(0, 0, 48, 48), on = (x, y) => x >= 0 && y >= 0 && x < 48 && y < 48 && all.data[(y * 48 + x) * 4 + 3] >= 128;
    if (fin === 'oro') {                                  // contorno exterior de oro
      const out = g.getImageData(0, 0, 48, 48);
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { if (!on(x, y) || (on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1))) continue;
        const i = (y * 48 + x) * 4, c = rgb(y < 24 ? '#e8c860' : '#b8922e'); out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255; }
      g.putImageData(out, 0, 0);
    }
    if (fin === 'balazo') {                               // agujero de bala con grietas, abajo a la izquierda de la cara
      const hx = 15, hy = 31; g.fillStyle = '#e8ecf0';
      [[-1, 0, 7], [1, 1, 6], [0, 1, 6], [1, -1, 7], [-1, -1, 5], [1, 0, 5]].forEach(([ox, oy, n]) => { for (let k = 4; k <= n; k++) { const x = hx + ox * k, y = hy + oy * k; if (on(x, y)) g.fillRect(x, y, 1, 1); } });
      for (let y = hy - 4; y <= hy + 4; y++) for (let x = hx - 4; x <= hx + 4; x++) { const d = SQ(x - hx, y - hy);
        if (d <= 2.2) { g.fillStyle = '#000000'; g.fillRect(x, y, 1, 1); } else if (d <= 3.4) { g.fillStyle = (x + y) % 2 ? '#5a5e66' : '#c8ccd2'; g.fillRect(x, y, 1, 1); } }
    }
    const [nc, nx, nd] = layer(L.num);
    if (fin === 'oro') { for (let i = 0; i < nd.data.length; i += 4) if (nd.data[i + 3] && nd.data[i] > 200 && nd.data[i + 1] > 200) { nd.data[i] = 242; nd.data[i + 1] = 209; nd.data[i + 2] = 107; } nx.putImageData(nd, 0, 0); }
    g.drawImage(nc, 0, 0);
    return (dieCache[k] = cv);
  }
  const maskCache = {};
  function mask(sides, color, val, fin) {                // silueta del dado en el lienzo de 96x96
    const k = sides + '|' + fin; if (maskCache[k]) return maskCache[k];
    const dc = dieCanvas(sides, color, val, fin); if (!dc) return null;
    const d = dc.getContext('2d').getImageData(0, 0, 48, 48).data, m = new Uint8Array(96 * 96);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) m[(y + 24) * 96 + x + 24] = d[(y * 48 + x) * 4 + 3] > 20 ? 1 : 0;
    return (maskCache[k] = m);
  }
  // Fuego y humo estáticos son dibujos de Darb (assets/auras/*.png, 96x96), completos y sin dado: se usan tal cual en todos
  // los dados, pintados solo fuera de la silueta de cada uno.
  // fill: rellenar lo que tapaba el D6 con la llama del borde de la fila (solo hacía falta cuando el dibujo venía con el D6 encima).
  const SPRITES = { fuego:{ fill:false }, humo:{ fill:false } };
  const pixels = i => { const c = canvas(96), x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, 96, 96).data; };
  const stillCache = {};
  function stillAura(aura, sides, color, val, fin) {
    const k = aura + '|' + sides + '|' + fin; if (stillCache[k]) return stillCache[k];
    const m = mask(sides, color, val, fin); if (!m) return null;
    const cv = canvas(96), g = cv.getContext('2d');
    if (SPRITES[aura]) {
      const sp = img(BASE + 'assets/auras/' + aura + '.png'), d6 = mask(6, color, 6, null); if (!ok(sp) || !d6) return null;
      const px = pixels(sp), out = g.createImageData(96, 96), at = (x, y) => (y * 96 + x) * 4;
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) { const i = y * 96 + x; if (m[i]) continue;
        let s = at(x, y);
        if (px[s + 3] < 20 && SPRITES[aura].fill && d6[i]) {                                 // tapado por el D6: copia la llama del borde
          const dir = x < 48 ? -1 : 1; let sx = x; while (sx >= 0 && sx < 96 && d6[y * 96 + sx]) sx += dir;
          if (sx < 0 || sx > 95) continue; s = at(sx, y); }
        if (px[s + 3] < 20) continue;
        const o = at(x, y); out.data[o] = px[s]; out.data[o + 1] = px[s + 1]; out.data[o + 2] = px[s + 2]; out.data[o + 3] = px[s + 3]; }
      g.putImageData(out, 0, 0);
    } else {
      if (!STILL[aura]) return null;
      STILL[aura]((x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x > 95 || y > 95 || m[y * 96 + x]) return; g.fillStyle = c; g.fillRect(x, y, 1, 1); });
    }
    return (stillCache[k] = cv);
  }


  // ---------- escenas: cada lienzo con su dado y su aura, en un solo bucle de animación ----------
  const scenes = new Map(); let raf = 0;
  function paint(cv, s) {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 96, 96);
    const dc = dieCanvas(s.sides, s.color, s.val, s.fin), A = s.aura && ANIM[s.aura];
    if (s.aura && still()) { const st = stillAura(s.aura, s.sides, s.color, s.val, s.fin); if (st) g.drawImage(st, 0, 0); if (dc) g.drawImage(dc, 24, 24); return; }
    if (A) { s.acc = (s.acc || 0) + A.rate; while (s.acc >= 1) { s.ps.push(A.spawn()); s.acc--; } }
    const back = !A ? [] : A.behind ? s.ps : s.ps.filter(p => (p.y !== undefined ? p.y : C + Math.sin(p.a || 0) * 10) < C - 2);
    back.forEach(p => A.draw(g, p));
    if (dc) g.drawImage(dc, 24, 24);
    if (A) { s.ps.forEach(p => { if (!back.includes(p)) A.draw(g, p); }); s.ps.forEach(p => { A.step(p); p.life++; }); s.ps = s.ps.filter(p => p.life < p.max); }
  }
  function loop() {
    raf = 0;
    scenes.forEach((s, cv) => { if (!cv.isConnected) { scenes.delete(cv); return; } paint(cv, s); });
    if (scenes.size) raf = requestAnimationFrame(loop);
  }
  // Pone (o actualiza) un dado en un lienzo de 96x96: { sides, color, val, fin, aura }.
  function show(cv, opt) {
    const s = scenes.get(cv) || { ps:[], acc:0 }; Object.assign(s, opt); scenes.set(cv, s);
    paint(cv, s); if (!raf) raf = requestAnimationFrame(loop);
  }
  function hide(cv) { scenes.delete(cv); }
  return { show, hide, base:b => { BASE = b; } };
})();
