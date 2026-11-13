// ===== Dados decorados (Tienda del perfil) =====
// Son solo decoración: cambian cómo se ve TU dado al tirar (también para los demás en online), nunca el resultado.
//  · Acabado (fin): cambia el dado en sí — Oro (contorno y números dorados) o Balazo (plomo con un agujero de bala).
//  · Aura: partículas alrededor del dado mientras rueda. Con "Reducir animaciones" (o el aviso del sistema)
//    se usa su versión estática: una decoración sólida que tampoco tapa el dado.
// El color del jugador se conserva siempre (para saber de quién es la tirada). Cada acabado y cada aura se compra
// una vez con oro y se elige en Perfil → Tu Capo.
// online:true = artículo nuevo que ya no entra en el oro de los logros: se paga con el oro de las partidas online.
// secret:true = no se vende; se gana (el Dado del Capo, al completar todos los logros).
const DICE_ITEMS = [
  { key:'fin:capo',      kind:'fin',  id:'capo',     label:'del Capo', sub:'el dado del logo, con su gorro', secret:true },
  { key:'fin:oro',       kind:'fin',  id:'oro',      label:'Oro',      sub:'contorno y números dorados', price:500 },
  { key:'fin:balazo',    kind:'fin',  id:'balazo',   label:'Balazo',   sub:'plomo con agujero de bala',  price:500 },
  { key:'fin:marfil',    kind:'fin',  id:'marfil',   label:'Marfil',   sub:'hueso pulido, contorno de tu color',   price:500, online:true },
  { key:'fin:billete',   kind:'fin',  id:'billete',  label:'Billete',  sub:'papel moneda verde, contorno de tu color', price:500, online:true },
  { key:'fin:marmol',    kind:'fin',  id:'marmol',   label:'Mármol Negro', sub:'piedra negra con vetas, contorno de tu color', price:500, online:true },
  { key:'fin:cromo',     kind:'fin',  id:'cromo',    label:'Cromo',    sub:'metal pulido con brillos, contorno de tu color', price:600, online:true },
  { key:'fin:perla',     kind:'fin',  id:'perla',    label:'Perla',    sub:'nácar con reflejos rosa y celeste', price:500, online:true },
  { key:'fin:orosa',     kind:'fin',  id:'orosa',    label:'Oro Rosa', sub:'metal rosado cepillado',     price:500, online:true },
  { key:'fin:labial',    kind:'fin',  id:'labial',   label:'Lápiz Labial', sub:'rojo brillante con un beso', price:500, online:true },
  { key:'fin:cristal',   kind:'fin',  id:'cristal',  label:'Cristal',  sub:'transparente, el número flota', price:500, online:true },
  { key:'aura:fuego',    kind:'aura', id:'fuego',    label:'Fuego',    sub:'llamas que suben',           price:400 },
  { key:'aura:aire',     kind:'aura', id:'aire',     label:'Aire',     sub:'remolino de viento',         price:400 },
  { key:'aura:tierra',   kind:'aura', id:'tierra',   label:'Tierra',   sub:'rocas que orbitan',          price:400 },
  { key:'aura:agua',     kind:'aura', id:'agua',     label:'Agua',     sub:'gotas en ola',               price:400 },
  { key:'aura:rayo',     kind:'aura', id:'rayo',     label:'Rayo',     sub:'chispas eléctricas',         price:400 },
  { key:'aura:humo',     kind:'aura', id:'humo',     label:'Humo',     sub:'niebla de callejón',         price:400 },
  { key:'aura:billetes', kind:'aura', id:'billetes', label:'Billetes', sub:'lluvia de dólares',          price:400 },
  { key:'aura:monedas',  kind:'aura', id:'monedas',  label:'Monedas',  sub:'oro que cae girando',        price:400 },
  { key:'aura:neon',     kind:'aura', id:'neon',     label:'Neón',     sub:'letrero de club nocturno',   price:400 },
  { key:'aura:sirena',   kind:'aura', id:'sirena',   label:'Sirena',   sub:'luces de patrulla roja y azul', price:400, online:true },
  { key:'aura:casino',   kind:'aura', id:'casino',   label:'Luces de Casino', sub:'bombillas que corren en cadena', price:400, online:true },
  { key:'aura:petalos',  kind:'aura', id:'petalos',  label:'Pétalos',  sub:'pétalos de rosa que caen',   price:400, online:true },
  { key:'aura:diamantes', kind:'aura', id:'diamantes', label:'Diamantes', sub:'destellos de joyería',   price:400, online:true },
  { key:'aura:corazones', kind:'aura', id:'corazones', label:'Corazones Rotos', sub:'corazones que suben', price:400, online:true },
  { key:'aura:boa',      kind:'aura', id:'boa',      label:'Boa de Plumas', sub:'plumas rosas alrededor', price:400, online:true },
  { key:'aura:perfume',  kind:'aura', id:'perfume',  label:'Perfume',  sub:'nubecitas rosas con brillo',  price:400, online:true }
];
// En prueba: se dibujan (para verlos en Versiones/Dados_opciones/nuevos.html) pero aún no se venden.
const DICE_DRAFTS = [];

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
        g.fillStyle = p.c; g.fillRect(x | 0, y | 0, 2, 2); g.globalAlpha = .35; g.fillRect((x | 0) - 1, (y | 0) - 1, 4, 4); g.globalAlpha = 1; } },
    // ---- auras para chicas (en prueba, ver DICE_DRAFTS) ----
    petalos: { rate:.3, behind:true,                      // pétalos de rosa que caen meciéndose
      spawn() { return { x:R(8, 88), y:-3, vy:R(.35, .6), life:0, max:R(130, 180), ph:R(0, 6) }; },
      step(p) { p.x += Math.sin(p.life * .07 + p.ph) * .5; p.y += p.vy; },
      draw(g, p) { const f = Math.sin(p.life * .12 + p.ph) > 0, x = p.x | 0, y = p.y | 0;
        g.fillStyle = '#8a1838'; g.fillRect(x - 1, y - 1, f ? 5 : 3, 4); g.fillStyle = '#e8456e'; g.fillRect(x, y, f ? 3 : 1, 2); g.fillStyle = '#ffb0c4'; g.fillRect(x, y, 1, 1); } },
    diamantes: { rate:.45,                                // destellos de diamante alrededor del dado
      spawn() { const a = R(0, Math.PI * 2), r = R(25, 38); return { x:C + Math.cos(a) * r, y:C + Math.sin(a) * r * .85, life:0, max:R(24, 36) }; },
      step() {},
      draw(g, p) { const s = Math.sin(p.life / p.max * Math.PI), n = Math.round(s * 4), x = p.x | 0, y = p.y | 0;
        g.fillStyle = '#9fe8ff'; g.fillRect(x - n, y, n * 2 + 1, 1); g.fillRect(x, y - n, 1, n * 2 + 1);
        g.fillStyle = '#ffffff'; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } },
    corazones: { rate:.22, behind:true,                   // corazones que suben; algunos rotos
      spawn() { return { x:R(10, 80), y:R(70, 92), vy:R(-.45, -.3), life:0, max:R(90, 130), broken:Math.random() < .4 }; },
      step(p) { p.y += p.vy; p.x += Math.sin(p.life * .06) * .2; },
      draw(g, p) { g.globalAlpha = Math.min(1, (p.max - p.life) / 25); heart(g, p.x | 0, p.y | 0, p.broken); g.globalAlpha = 1; } },
    boa: { rate:1.6,                                      // boa de plumas rosa que rodea el dado
      spawn() { return { a:R(0, Math.PI * 2), r:R(29, 34), life:0, max:R(30, 50), c:pick(['#ff9ec8', '#ff7ab4', '#ffc4de', '#e0568f']) }; },
      step(p) { p.a += .025; p.r += R(-.2, .2); },
      draw(g, p) { const x = C + Math.cos(p.a) * p.r, y = C + Math.sin(p.a) * p.r * .55 + 6, t = p.life / p.max; g.globalAlpha = Math.sin(t * Math.PI);
        g.fillStyle = p.c; g.fillRect(x | 0, y | 0, 2, 2); g.fillRect((x | 0) + (p.life % 2 ? 1 : -1), (y | 0) - 1, 1, 1); g.globalAlpha = 1; } },
    perfume: { rate:.5, behind:true,                      // nubecitas rosas de perfume con brillitos
      spawn() { const s = Math.random() < .5 ? -1 : 1; return { x:C + s * R(18, 28), y:C + R(-6, 14), vx:s * R(.05, .25), vy:R(-.4, -.2), life:0, max:R(60, 90) }; },
      step(p) { p.x += p.vx; p.y += p.vy; },
      draw(g, p) { const t = p.life / p.max, s = 2 + (t * 5 | 0); g.globalAlpha = (1 - t) * .75;
        g.fillStyle = t < .4 ? '#ffc4e0' : '#e89ac4'; g.fillRect((p.x - s / 2) | 0, (p.y - s / 2) | 0, s, s);
        if (p.life % 12 < 2) { g.fillStyle = '#ffffff'; g.fillRect((p.x | 0) + 2, (p.y | 0) - 3, 1, 1); } g.globalAlpha = 1; } },
    // frame(g, ms): auras que se dibujan enteras en cada cuadro (sin partículas), detrás del dado.
    sirena: { rate:0,                                     // luces de patrulla: un difuminado rojo (izquierda) y uno azul (derecha) que aparecen y desaparecen
      frame(g, ms) { const w = Math.sin((ms % 1400) / 1400 * Math.PI * 2);
        sirenGlow(g, Math.pow(Math.max(0, w), 1.4), Math.pow(Math.max(0, -w), 1.4)); } },
    casino: { rate:0,                                     // marquesina de casino: bombillas que se encienden en cadena
      frame(g, ms) { marquee(g, Math.floor(ms / 120)); } }
  };
  const HEART = ['.AA.AA.', 'ABBABBA', 'ABWBBBA', 'ABBBBBA', '.ABBBA.', '..ABA..', '...A...'];
  function heart(g, x, y, broken, P) {                    // corazón de 7x7 (con grieta si está roto); P = pintor de las auras estáticas
    const put = P || ((px, py, c) => { g.fillStyle = c; g.fillRect(px, py, 1, 1); });
    HEART.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return;
      const crack = broken && ((j === 1 && i === 3) || (j === 2 && i === 4) || (j === 3 && i === 3) || (j === 4 && i === 4) || (j === 5 && i === 3));
      put(x + i - 3, y + j - 3, crack ? '#2a0610' : ch === 'A' ? '#5a0c1e' : ch === 'W' ? '#ffd0dc' : '#e8304e'); }));
  }
  // ---- piezas de la Sirena y la Marquesina (las usan la versión animada y la estática) ----
  // Sirena: resplandor difuminado de cada lado (r = fuerza del rojo, b = del azul, de 0 a 1) con destellos de lente redondos
  const SIREN = [{ x:C - 17, rgb:'255,40,30', core:'255,190,180', bokeh:[[-10, -9, 6], [2, 9, 7], [-6, 13, 3]] },
                 { x:C + 17, rgb:'40,60,255', core:'200,190,255', bokeh:[[9, -8, 7], [-3, 10, 5], [11, 11, 3]] }];
  function sirenGlow(g, r, b) {
    [r, b].forEach((k, i) => { if (k < .02) return; const S = SIREN[i];
      const gr = g.createRadialGradient(S.x, C, 0, S.x, C, 31);   // radio 31: se apaga antes del borde del lienzo
      gr.addColorStop(0, 'rgba(' + S.core + ',' + (.95 * k) + ')'); gr.addColorStop(.2, 'rgba(' + S.rgb + ',' + (.85 * k) + ')');
      gr.addColorStop(.55, 'rgba(' + S.rgb + ',' + (.35 * k) + ')'); gr.addColorStop(1, 'rgba(' + S.rgb + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
      S.bokeh.forEach(([ox, oy, rad]) => { g.beginPath(); g.arc(S.x + ox, C + oy, rad, 0, Math.PI * 2);   // círculos de luz, como reflejos de lente
        g.fillStyle = 'rgba(' + S.core + ',' + (.18 * k) + ')'; g.fill(); g.strokeStyle = 'rgba(255,255,255,' + (.22 * k) + ')'; g.lineWidth = 1; g.stroke(); }); });
  }
  function marquee(g, step, P) {                          // bombillas en un marco redondeado alrededor del dado
    const pts = [], L = 14, Rr = 81, rad = 8;
    for (let x = L + rad; x <= Rr - rad; x += 6) pts.push([x, L]);
    for (let y = L + rad; y <= Rr - rad; y += 6) pts.push([Rr, y]);
    for (let x = Rr - rad; x >= L + rad; x -= 6) pts.push([x, Rr]);
    for (let y = Rr - rad; y >= L + rad; y -= 6) pts.push([L, y]);
    const put = P || ((x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); });
    for (let x = L + 2; x <= Rr - 2; x++) { put(x, L, '#3a2a10'); put(x, Rr, '#3a2a10'); }        // el marco
    for (let y = L + 2; y <= Rr - 2; y++) { put(L, y, '#3a2a10'); put(Rr, y, '#3a2a10'); }
    pts.forEach(([x, y], i) => { const lit = step == null ? i % 2 === 0 : (i + step) % 3 === 0;
      const c = lit ? ['#fff6c8', '#ffd23a', '#c07a10'] : ['#7a5a20', '#5a3a12', '#3a2408'];
      put(x, y, c[0]); [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ox, oy]) => put(x + ox, y + oy, c[1]));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([ox, oy]) => put(x + ox, y + oy, c[2])); });
  }

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
        if (c) P(x, y, c); } },
    sirena(P) {                                           // los dos resplandores encendidos a la vez (rojo izquierda, azul derecha)
      const c = canvas(96), g = c.getContext('2d'); sirenGlow(g, .85, .85);
      const d = g.getImageData(0, 0, 96, 96).data;
      for (let i = 0; i < 96 * 96; i++) if (d[i * 4 + 3] > 4) P(i % 96, (i / 96) | 0, 'rgba(' + d[i * 4] + ',' + d[i * 4 + 1] + ',' + d[i * 4 + 2] + ',' + (d[i * 4 + 3] / 255).toFixed(3) + ')');
    },
    casino(P) { marquee(null, null, P); },                // marquesina con las bombillas alternas encendidas
    petalos(P) {                                          // pétalos repartidos alrededor del dado
      [[14, 18], [80, 14], [8, 50], [86, 46], [20, 80], [74, 82], [46, 8], [50, 88], [30, 12], [64, 86]].forEach(([x, y], i) => {
        const w = i % 2 ? 5 : 3; for (let j = -1; j < 3; j++) for (let k = -1; k < w - 1; k++) P(x + k, y + j, j === -1 || k === -1 || j === 2 || k === w - 2 ? '#8a1838' : '#e8456e');
        P(x, y, '#ffb0c4'); }); },
    diamantes(P) {                                        // destellos fijos en estrella
      [[16, 20, 4], [80, 18, 3], [10, 56, 3], [86, 62, 4], [28, 84, 3], [70, 84, 3], [48, 9, 3]].forEach(([x, y, n]) => {
        for (let k = -n; k <= n; k++) { P(x + k, y, '#9fe8ff'); P(x, y + k, '#9fe8ff'); }
        for (let k = -1; k <= 1; k++) { P(x + k, y, '#ffffff'); P(x, y + k, '#ffffff'); } }); },
    corazones(P) { [[14, 22, 0], [82, 20, 1], [10, 62, 1], [86, 66, 0], [48, 10, 0], [30, 86, 0], [68, 86, 1]].forEach(([x, y, b]) => heart(null, x, y, !!b, P)); },
    boa(P) {                                              // boa de plumas: anillo esponjoso rosa
      for (let t = 0; t < Math.PI * 2; t += .02) { const x = C + Math.cos(t) * 32, y = C + Math.sin(t) * 18 + 6, k = Math.round(t * 50);
        P(x, y, ['#ff9ec8', '#ff7ab4', '#ffc4de', '#e0568f'][k % 4]); P(x + (k % 3) - 1, y - 1, '#ffc4de'); P(x, y + 1, '#c0407a'); } },
    perfume(P) {                                          // nubecitas rosas a los lados
      [[14, 40, 5], [10, 30, 3], [18, 24, 2], [82, 44, 5], [86, 32, 3], [78, 26, 2]].forEach(([x, y, r]) => {
        for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) if (j * j + k * k <= r * r) P(x + k, y + j, j * j + k * k > (r - 1) * (r - 1) ? '#e89ac4' : '#ffc4e0'); });
      [[22, 18], [74, 20], [6, 44]].forEach(([x, y]) => P(x, y, '#ffffff')); }
  };

  // ---------- el dado (48x48) con su acabado ----------
  const mix = (d, i, hex, t) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    d[i] += (r - d[i]) * t; d[i + 1] += (g - d[i + 1]) * t; d[i + 2] += (b - d[i + 2]) * t; };
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  // Materiales: at(x, y) da el color del material en cada píxel (la textura). Los números siguen blancos: van sobre su placa oscura.
  const MATERIAL = {
    marfil:  { at:(x, y) => ((x * 7 + y * 13) % 11 === 0 ? '#c8b890' : (y + (x >> 2)) % 9 === 0 ? '#d8cba6' : '#efe6cc') },        // vetas finas de hueso
    billete: { at:(x, y) => ((x + y) % 4 === 0 ? '#6e9a62' : (x - y + 48) % 7 === 0 ? '#c8e2b4' : '#9cc48a') },              // guilloché de billete
    marmol:  { at:(x, y) => { const v = Math.abs(Math.sin(x * .33 + Math.sin(y * .27) * 2.4 + y * .11));                                   // vetas grises sobre negro (no blancas: así no se pierden los números)
      return v < .1 ? '#8a8a92' : v < .22 ? '#4e4e56' : (x * 5 + y * 3) % 13 === 0 ? '#2e2e34' : '#1c1c21'; } },
    cromo:   { at:(x, y) => { if ((x - y * .6 + 96) % 22 < 2) return '#ffffff';                                                         // metal pulido: cielo claro arriba,
      const t = y / 48; return t < .3 ? '#e4eaf0' : t < .58 ? '#c4ccd6' : t < .64 ? '#6a737e' : t < .71 ? '#2c3139' : t < .84 ? '#8c97a4' : '#c6ced8'; } },   // horizonte oscuro (bajo los números) y reflejo abajo, con brillos en diagonal
    // ---- en prueba (DICE_DRAFTS) ----
    perla:   { at:(x, y) => { const v = Math.sin(x * .18 + y * .11) + Math.sin(y * .23 - x * .07);                                       // nácar: blanco con reflejos rosa y celeste
      return (x * 3 + y * 5) % 29 === 0 ? '#ffffff' : v > .7 ? '#f0c8dc' : v < -.7 ? '#c8dcf2' : '#f2ece8'; } },
    orosa:   { at:(x, y) => ((x + y * 2) % 13 < 2 ? '#fbd8c8' : (x - y + 48) % 17 === 0 ? '#b8786a' : y < 20 ? '#ecbaa6' : '#d89c88') },    // oro rosa cepillado
    labial:  { at:(x, y) => { const lx = x - 33, ly = y - 33, lips = (lx * lx) / 42 + (ly * ly) / 8 <= 1 && !(ly === 0 && Math.abs(lx) < 5) && !(ly < 0 && Math.abs(lx) < 1);
      return lips ? '#ffc0cc' : (x - y + 48) % 15 < 2 ? '#ff7a90' : y < 18 ? '#d42a44' : '#b01830'; } },                                  // rojo labial brillante con un beso marcado
    cristal: { alpha:150, at:(x, y) => ((x + y) % 11 === 0 ? '#ffffff' : y < 16 ? '#d8f2ff' : '#a8d8ee') }                               // transparente: se ve el fondo y el número "flota"
  };
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
    let own = null;                                       // color del jugador (para el contorno de los materiales)
    if (MATERIAL[fin]) {                                  // Marfil, Billete o Mármol: el material sustituye al color, con sus mismas luces y sombras
      let n = 0, sr = 0, sg = 0, sb = 0, top = 0; const lum = i => cd.data[i] * .3 + cd.data[i + 1] * .59 + cd.data[i + 2] * .11;
      for (let i = 0; i < cd.data.length; i += 4) if (cd.data[i + 3]) { top = Math.max(top, lum(i)); sr += cd.data[i]; sg += cd.data[i + 1]; sb += cd.data[i + 2]; n++; }
      own = n ? [sr / n, sg / n, sb / n] : [200, 200, 200];
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const i = (y * 48 + x) * 4; if (!cd.data[i + 3]) continue;
        const shade = .62 + .5 * (top ? lum(i) / top : 1), c = rgb(MATERIAL[fin].at(x, y));
        cd.data[i] = Math.min(255, c[0] * shade); cd.data[i + 1] = Math.min(255, c[1] * shade); cd.data[i + 2] = Math.min(255, c[2] * shade);
        if (MATERIAL[fin].alpha) cd.data[i + 3] = MATERIAL[fin].alpha; }
      cx.putImageData(cd, 0, 0);
    }
    g.drawImage(cc, 0, 0); g.drawImage(L.base, 0, 0);
    const all = g.getImageData(0, 0, 48, 48), on = (x, y) => x >= 0 && y >= 0 && x < 48 && y < 48 && all.data[(y * 48 + x) * 4 + 3] >= 128;
    if (fin === 'oro' || own) {                           // contorno exterior: de oro, o del color del jugador en los materiales
      const out = g.getImageData(0, 0, 48, 48);
      for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { if (!on(x, y) || (on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1))) continue;
        const i = (y * 48 + x) * 4, c = own ? own.map(v => v * (y < 24 ? 1.15 : .8)) : rgb(y < 24 ? '#e8c860' : '#b8922e');
        out.data[i] = Math.min(255, c[0]); out.data[i + 1] = Math.min(255, c[1]); out.data[i + 2] = Math.min(255, c[2]); out.data[i + 3] = 255; }
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
    if (own) { const under = g.getImageData(0, 0, 48, 48).data;                        // materiales claros: el número se oscurece solo donde el fondo es claro
      for (let i = 0; i < nd.data.length; i += 4) if (nd.data[i + 3] && nd.data[i] > 200 && under[i] * .3 + under[i + 1] * .59 + under[i + 2] * .11 > 140) { nd.data[i] = 34; nd.data[i + 1] = 26; nd.data[i + 2] = 16; }
      nx.putImageData(nd, 0, 0); }
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
    const hat = () => { if (s.fin !== 'capo') return; const h = img(BASE + 'assets/D' + s.sides + '/Gorro.png'); if (ok(h)) g.drawImage(h, 0, 0); };   // Dado del Capo: el gorro (96x96, editable en Paint)
    // calm: fuerza la versión estática (la usa la página de muestras)
    if (s.aura && (s.calm || still())) { const st = stillAura(s.aura, s.sides, s.color, s.val, s.fin); if (st) g.drawImage(st, 0, 0); if (dc) g.drawImage(dc, 24, 24); hat(); return; }
    if (A && A.frame) A.frame(g, performance.now());
    if (A && A.rate) { s.acc = (s.acc || 0) + A.rate; while (s.acc >= 1) { s.ps.push(A.spawn()); s.acc--; } }
    const back = !A ? [] : A.behind ? s.ps : s.ps.filter(p => (p.y !== undefined ? p.y : C + Math.sin(p.a || 0) * 10) < C - 2);
    back.forEach(p => A.draw(g, p));
    if (dc) g.drawImage(dc, 24, 24);
    hat();
    if (A && A.rate) { s.ps.forEach(p => { if (!back.includes(p)) A.draw(g, p); }); s.ps.forEach(p => { A.step(p); p.life++; }); s.ps = s.ps.filter(p => p.life < p.max); }
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
