// ===== Propuestas de capas femeninas (etapa 1: 3 idle en verde por personaje) =====
// Se ejecuta en el navegador desde el mismo servidor que el juego (lo carga Versiones/chicas_opciones.html).
// Cuerpo: silueta de la Mafiosa (assets/characters/Mafiosa/Color_G/idle.png) con el vestido de cada una.
// Cabeza, peinado, sombrero y accesorios: dibujados aquí por partes. El verde (#4E8A54 / #36613A / #24422A)
// es el color del jugador: en la etapa de colores se cambia solo eso.
const CHICAS = (() => {
  const G1 = '#4e8a54', G2 = '#36613a', G3 = '#24422a', A = '#000000';
  const SKIN = { clara:['#f0c8a8', '#d09c80', '#ffe0c8'], media:['#d8a47c', '#b07a58', '#ecc09c'], oscura:['#8a5a3a', '#6a4028', '#a8744e'], mayor:['#e8c0a0', '#c49678', '#f6d8bc'] };
  const HAIR = { roja:['#e0703a', '#b8481e', '#7a2a10'], negra:['#4a4250', '#26202c', '#0e0b12'], rubia:['#f6e09a', '#dcb860', '#a07a30'],
                 castana:['#9a6a42', '#6a4028', '#3e2416'], gris:['#e2e2e2', '#b0b0b0', '#747474'] };
  const W = { 13:5, 14:7, 15:7.5, 16:8, 17:8.5, 18:8.5, 19:8.5, 20:8.5, 21:8.5, 22:8.3, 23:7.8, 24:7.2, 25:6.4, 26:5.4, 27:4 };
  const inFace = (x, y) => W[y] != null && Math.abs(x + .5 - 32) <= W[y];

  function make(base, o) {                              // base: ImageData de la Mafiosa verde · o: receta
    const g = []; for (let y = 0; y < 64; y++) g.push(new Array(64).fill(null));
    const P = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < 64 && y < 64) g[y][x] = c; };
    const get = (x, y) => (x >= 0 && y >= 0 && x < 64 && y < 64 ? g[y][x] : null);
    const sk = SKIN[o.skin], hr = HAIR[o.hair];
    // ---- pelo de atrás (largo / ondas): va detrás del cuerpo y de la cara ----
    const hairMask = new Set(), mark = (x, y) => hairMask.add(y * 64 + x);
    const style = o.style;
    for (let y = 6; y < 64; y++) for (let x = 0; x < 64; x++) { const dx = x + .5 - 32;
      const cap = (dx * dx) / (10 * 10) + ((y - 17.5) * (y - 17.5)) / (6 * 6) <= 1 && y <= (Math.abs(dx) > 6 ? 18 : 15);   // la frente queda despejada
      let on = cap;
      if (style === 'bob') on = on || (Math.abs(dx) <= 10.5 && y >= 15 && y <= 24 - (Math.abs(dx) < 9 ? 1 : 0));
      if (style === 'larga') on = on || (Math.abs(dx) <= 11 && Math.abs(dx) >= 5 && y >= 15 && y <= 42 - (Math.abs(dx) > 9 ? 2 : 0));
      if (style === 'ondas') on = on || (Math.abs(dx) <= 10.8 + Math.sin(y * .9) * .9 && y >= 15 && y <= 31);
      if (style === 'recogido') on = on || ((dx * dx) / 36 + ((y - 10.5) * (y - 10.5)) / 12 <= 1) || (Math.abs(dx) <= 9.5 && y >= 15 && y <= 21);
      if (style === 'rollos') on = on || ((dx + 4.5) ** 2 / 9 + (y - 12.5) ** 2 / 4 <= 1) || ((dx - 4.5) ** 2 / 9 + (y - 12.5) ** 2 / 4 <= 1) || (Math.abs(dx) <= 9.5 && y >= 15 && y <= 23);
      if (style === 'mono') on = on || ((dx - 7) ** 2 / 12 + (y - 12) ** 2 / 9 <= 1) || (Math.abs(dx) <= 9.2 && y >= 15 && y <= 20);
      if (on) mark(x, y); }
    const isHair = (x, y) => hairMask.has(y * 64 + x);
    const hairPx = (x, y) => { const dx = x + .5 - 32, edge = !isHair(x - 1, y) || !isHair(x + 1, y) || !isHair(x, y - 1) || !isHair(x, y + 1);
      if (edge) return A;
      const wave = style === 'bob' || style === 'ondas' ? Math.sin(y * 1.2 + dx * .5) > .55 : (x + y * 2) % 7 === 0;
      return dx < -3 && y < 16 ? hr[0] : wave ? hr[2] : hr[1]; };
    hairMask.forEach(k => { const x = k % 64, y = (k / 64) | 0; if (y > 18) g[y][x] = hairPx(x, y); });   // la parte baja del pelo, detrás
    // ---- cuerpo de la Mafiosa (desde la fila 29) con el vestido de la receta ----
    const map = Object.assign({ '#151515':'#151515', '#252525':'#252525', '#26232b':'#26232b', '#3d3944':'#3d3944', '#15131a':'#15131a',
      '#eee9dd':'#eee9dd', '#b9b2a4':'#b9b2a4', '#36613a':G2, '#945d44':sk[1], '#7b4e38':sk[1], '#a06346':sk[0] }, o.body || {});
    for (let y = 29; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (y * 64 + x) * 4; if (base.data[i + 3] < 128) continue;
      const h = '#' + [0, 1, 2].map(k => base.data[i + k].toString(16).padStart(2, '0')).join('');
      const m = map[h] !== undefined ? map[h] : h; g[y][x] = m === 'S0' ? sk[0] : m === 'S1' ? sk[1] : m; }   // S0/S1: piel (brazos descubiertos)
    if (o.dress) o.dress(P, get, g);
    // ---- cuello y cara ----
    for (let y = 26; y <= 29; y++) for (let x = 29; x <= 34; x++) P(x, y, x === 29 || x === 34 ? A : y >= 28 ? sk[1] : sk[0]);
    for (let y = 13; y <= 27; y++) for (let x = 0; x < 64; x++) { if (!inFace(x, y)) continue;
      const edge = !inFace(x - 1, y) || !inFace(x + 1, y) || !inFace(x, y + 1);
      P(x, y, edge ? A : (!inFace(x - 2, y) || !inFace(x + 2, y) || y >= 26) ? sk[1] : sk[0]); }
    // rasgos: cejas finas, pestañas, ojos, nariz, rubor y labios rojos
    const brow = o.brow || hr[2];
    [[26, 18], [27, 17], [28, 17], [35, 17], [36, 17], [37, 18]].forEach(([x, y]) => P(x, y, brow));
    if (!o.closed) { P(25, 19, A); P(26, 19, A); P(27, 19, A); P(28, 19, A); P(35, 19, A); P(36, 19, A); P(37, 19, A); P(38, 19, A);
      P(26, 20, '#f2ece2'); P(27, 20, o.eye || '#3a2a1a'); P(28, 20, A); P(35, 20, A); P(36, 20, o.eye || '#3a2a1a'); P(37, 20, '#f2ece2'); }
    else { [[25, 20], [26, 20], [27, 21], [28, 20], [35, 20], [36, 21], [37, 20], [38, 20]].forEach(([x, y]) => P(x, y, A)); }
    P(31, 22, sk[1]); P(32, 23, sk[1]); P(31, 23, sk[1]);
    const blush = o.skin === 'oscura' ? '#a8584a' : '#ec9a94'; P(25, 22, blush); P(26, 22, blush); P(37, 22, blush); P(38, 22, blush);
    const lip = o.lip || '#c01c3a'; P(30, 25, lip); P(31, 25, '#e04a60'); P(32, 25, lip); P(33, 25, lip); P(31, 26, '#8a0e26'); P(32, 26, '#8a0e26');
    if (o.mole) P(o.mole[0], o.mole[1], '#3a2010');
    if (o.age) { P(24, 21, sk[1]); P(39, 21, sk[1]); P(28, 24, sk[1]); P(35, 24, sk[1]); P(29, 27, sk[1]); P(34, 27, sk[1]); }
    // ---- pelo de delante (lo que va sobre la frente y los lados de la cara) ----
    hairMask.forEach(k => { const x = k % 64, y = (k / 64) | 0;
      if (y <= 18 || (!inFace(x, y) && y <= 27 && style !== 'larga') || (style === 'larga' && !inFace(x, y) && y <= 30)) P(x, y, hairPx(x, y)); });
    if (o.fringe) for (let x = 25; x <= 38; x++) { const y = 17 + ((x * 3) % 2); P(x, y, (x % 3) ? hr[1] : hr[2]); }
    // ---- sombreros y accesorios ----
    (o.extras || []).forEach(f => f(P, get, g, o));
    return g;
  }

  // ---------- piezas sueltas ----------
  const X = {
    perlas: (P) => { for (let dx = -6; dx <= 6; dx += 2) { const y = Math.round(30 + dx * dx / 14); P(32 + dx, y, '#fbf6ee'); P(33 + dx, y, '#c8c0b4'); } },
    perlasLargas: (P) => { for (let t = 0; t <= Math.PI; t += .18) { const x = 32 + Math.cos(t) * 6, y = 29 + Math.sin(t) * 14; P(x, y, '#fbf6ee'); } },
    cadena: (P) => { for (let dx = -5; dx <= 5; dx++) { const y = Math.round(30 + dx * dx / 10); P(32 + dx, y, dx % 2 ? '#f2c84a' : '#a07a20'); } P(32, 33, '#f2c84a'); P(32, 34, '#a07a20'); },
    estola: (c1, c2, c3) => (P) => { for (let x = 17; x <= 46; x++) for (let y = 28; y <= 33; y++) { const dx = x + .5 - 32, top = 29 + Math.abs(dx) / 6, bot = top + 3.2 + Math.sin(x * 1.3) * .8;
      if (y < top - .5 || y > bot) continue; P(x, y, y > bot - 1 ? c3 : (x + y) % 3 === 0 ? c1 : c2); } },
    boa: (P) => { for (let x = 15; x <= 48; x++) { const dx = x + .5 - 32, y = 29 + Math.abs(dx) / 5 + (Math.abs(dx) > 10 ? (Math.abs(dx) - 10) * .9 : 0);
      for (let k = -1; k <= 1; k++) P(x, y + k + ((x % 2) ? 0 : 1), ['#ffd4e6', '#ff9ec8', '#f070a8'][(x + k + 3) % 3]); } },
    gardenia: (cx, cy) => (P) => { for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const r = x * x + y * y; if (r > 10) continue;
      P(cx + x, cy + y, r > 7 ? '#8a8a7a' : r <= 1 ? '#f2d26a' : (x + y) % 2 ? '#ffffff' : '#ece6d4'); } P(cx - 4, cy + 2, '#2e5a2e'); P(cx - 3, cy + 3, '#2e5a2e'); },
    gafasSol: (P) => { [[25, 29], [34, 38]].forEach(([a, b]) => { for (let x = a; x <= b; x++) { P(x, 19, A); P(x, 20, x === a + 1 ? '#6a7a8a' : '#101418'); P(x, 21, x > a && x < b ? '#101418' : A); } });
      P(30, 19, A); P(31, 19, A); P(32, 19, A); P(33, 19, A); },
    gafasSolArriba: (P) => { [[24, 29], [34, 39]].forEach(([a, b]) => { for (let x = a; x <= b; x++) { P(x, 13, A); P(x, 14, x === a + 1 ? '#6a7a8a' : '#101418'); } }); P(30, 13, A); P(31, 13, A); P(32, 13, A); P(33, 13, A); },
    lentes: (P) => { [[25, 29], [34, 38]].forEach(([a, b]) => { for (let x = a; x <= b; x++) { P(x, 18, '#3a2a1a'); P(x, 22, '#3a2a1a'); } for (let y = 19; y <= 21; y++) { P(a, y, '#3a2a1a'); P(b, y, '#3a2a1a'); } });
      P(30, 19, '#3a2a1a'); P(31, 19, '#3a2a1a'); P(32, 19, '#3a2a1a'); P(33, 19, '#3a2a1a'); P(27, 19, '#ffffff'); P(36, 19, '#ffffff'); },
    lapiz: (P) => { for (let k = 0; k < 7; k++) { P(40 + k, 13 + k, k < 1 ? '#3a3a3a' : k < 2 ? '#e8c890' : k > 5 ? '#e88a8a' : '#f2c020'); } },
    velo: (P, get) => { for (let y = 14; y <= 22; y++) for (let x = 22; x <= 42; x++) if ((x + y) % 2 === 0 && get(x, y) && get(x, y) !== A) P(x, y, '#1a1a1e'); },
    pastillero: (c) => (P) => { for (let y = 8; y <= 13; y++) for (let x = 23; x <= 34; x++) { const e = y === 8 || y === 13 || x === 23 || x === 34; P(x + (13 - y) / 3, y, e ? A : y === 12 ? c : '#1c1c22'); } },
    cloche: (band, flower) => (P) => { for (let y = 7; y <= 19; y++) for (let x = 18; x <= 46; x++) { const dx = x + .5 - 32, e = (dx * dx) / (11.5 * 11.5) + ((y - 16) * (y - 16)) / (8.5 * 8.5);
      if (e > 1 || y > 18) continue; const edge = e > .82 || y === 18; P(x, y, edge ? A : y === 15 || y === 16 ? band : y < 11 && dx < -2 ? '#56506a' : '#36324a'); }
      if (flower) X.gardenia(40, 15)(P); },
    diadema: (jewel) => (P) => { for (let x = 23; x <= 41; x++) P(x, 15, x % 3 ? '#e8c860' : '#a07a20'); for (let x = 23; x <= 41; x++) P(x, 16, G2);
      if (jewel) { P(37, 15, '#ffffff'); P(37, 16, G1); } },
    pluma: (P) => { for (let k = 0; k < 11; k++) { const x = 38 + Math.round(Math.sin(k * .3) * 2) + (k > 6 ? 1 : 0), y = 15 - k; P(x, y, G2); P(x + 1, y, k % 2 ? G1 : G3); if (k > 3) P(x - 1, y, G1); } P(39, 16, '#e8c860'); },
    sombreroLado: (P) => { for (let x = 32; x <= 46; x++) { const y = 11 + Math.round((x - 32) * .15); P(x, y, A); P(x, y - 1, x > 34 && x < 44 ? G2 : A); if (x > 35 && x < 43) { P(x, y - 2, G2); P(x, y - 3, x === 36 || x === 42 ? A : G1); } }
      for (let x = 36; x <= 42; x++) P(x, 7, A); },
    plumaSombrero: (P) => { for (let k = 0; k < 8; k++) { const x = 41 + Math.round(k * .4); P(x, 14 - k, '#e8e0d0'); P(x + 1, 14 - k, k % 2 ? '#b8b0a0' : '#e8e0d0'); } }
  };

  // ---------- recetas: 6 capas × 3 versiones ----------
  // Inspiración real de la época (vestuario de los años 20-40): ver el texto de cada una en chicas_opciones.html.
  const negro = { '#151515':'#18181c', '#252525':'#26262c', '#26232b':'#0e0e12', '#3d3944':'#2a2a30', '#15131a':'#08080a', '#eee9dd':'#2e2e36', '#b9b2a4':'#1e1e24', '#36613a':G2 };
  const blanco = { '#151515':'#d8d2c6', '#252525':'#ece8de', '#3d3944':G1, '#26232b':G2, '#15131a':G3, '#eee9dd':'#ffffff', '#b9b2a4':'#d0cabe', '#36613a':'#e8c860' };
  const vestido = { '#151515':'S1', '#252525':'S0', '#26232b':G1, '#3d3944':'#7ab07e', '#15131a':G2, '#eee9dd':null, '#b9b2a4':null, '#36613a':'#e8c860' };   // vestido de noche sin mangas
  const flapper = { '#151515':'S1', '#252525':'S0', '#26232b':G2, '#3d3944':G1, '#15131a':G3, '#eee9dd':null, '#b9b2a4':null, '#36613a':'#e8c860' };
  const traje = { '#151515':'#4a4a52', '#252525':'#5e5e68', '#3d3944':'#f4f0e6', '#26232b':'#e6e0d4', '#15131a':'#c8c0b2', '#eee9dd':'#ffffff', '#b9b2a4':'#d8d2c6', '#36613a':'#3a3a42' };
  const piel = { '#151515':'#5a3e28', '#252525':'#7a5a3c', '#3d3944':G1, '#26232b':G2, '#15131a':G3, '#eee9dd':'#9a7a58', '#b9b2a4':'#7a5a3c', '#36613a':G3 };
  const lentejuelas = (P, get, g) => { for (let y = 30; y < 60; y++) for (let x = 0; x < 64; x++) { const c = g[y][x]; if (c !== G1 && c !== G2 && c !== G3) continue;
    const k = (x * 7 + y * 3) % 19; if (k === 0) g[y][x] = '#ffffff'; else if (k === 9) g[y][x] = '#9fd8a4'; } };
  const cuentas = (P, get, g) => { for (let y = 31; y < 60; y++) for (let x = 0; x < 64; x++) { const c = g[y][x]; if (c !== G1 && c !== G2 && c !== G3) continue;
    if ((x + y) % 4 === 0) g[y][x] = '#e8c860'; else if ((x - y + 64) % 4 === 0 && y > 36) g[y][x] = '#a07a20'; }
    for (let y = 45; y <= 56; y++) for (let x = 0; x < 64; x++) { const c = g[y][x]; if (c && c !== A && x % 2 === 0) g[y][x] = '#e8c860'; } };      // flecos dorados bajo la cintura
  const escote = (sk) => (P, get, g) => { for (let y = 29; y <= 33; y++) for (let x = 0; x < 64; x++) { if (g[y][x] === null && y >= 30 && Math.abs(x + .5 - 32) < 7 - (y - 30) * 1.4) g[y][x] = SKIN[sk][0]; } };
  const lunares = (P, get, g) => { for (let y = 33; y < 58; y++) for (let x = 0; x < 64; x++) { if (g[y][x] === G2 && (x * 3 + y * 5) % 7 === 0) g[y][x] = '#f2ece2'; } };
  const lazo = (P) => { [[29, 30], [30, 30], [33, 30], [34, 30], [29, 31], [34, 31], [31, 31], [32, 31]].forEach(([x, y]) => P(x, y, G2)); P(31, 30, G1); P(32, 30, G1); P(31, 32, G3); P(32, 33, G3); };

  const RECIPES = {
    Viuda: { label:'La Viuda Negra', inspo:'Viudas de luto de los años 40 y el pelo rojo de las estrellas de cine negro: vestido negro, velo de red, perlas.',
      v:{ A:{ skin:'clara', hair:'roja', style:'ondas', body:negro, mole:[36, 24], extras:[X.pastillero(G2), X.velo, X.perlas] },
          B:{ skin:'clara', hair:'roja', style:'ondas', body:negro, closed:true, extras:[X.perlas] },
          C:{ skin:'clara', hair:'roja', style:'larga', body:negro, mole:[36, 24], extras:[X.estola('#3a3a40', '#26262c', '#101014'), X.pastillero(G2)] } } },
    Reina: { label:'La Reina del Sur', inspo:'Traje sastre blanco de los 40 con blusa de color, pelo largo y negro y lentes oscuros.',
      v:{ A:{ skin:'media', hair:'negra', style:'larga', body:blanco, extras:[X.gafasSolArriba, X.cadena] },
          B:{ skin:'media', hair:'negra', style:'larga', body:blanco, extras:[X.gafasSol] },
          C:{ skin:'media', hair:'negra', style:'larga', body:blanco, mole:[34, 26], extras:[X.cadena] } } },
    Cantante: { label:'La Cantante del Club', inspo:'Cantantes de jazz de los clubes de los 40: gardenia blanca en el pelo, vestido de noche brillante y hombros descubiertos.',
      v:{ A:{ skin:'oscura', hair:'negra', style:'recogido', body:vestido, dress:(P, get, g) => { lentejuelas(P, get, g); escote('oscura')(P, get, g); }, extras:[X.gardenia(40, 14)] },
          B:{ skin:'oscura', hair:'negra', style:'recogido', body:vestido, closed:true, dress:(P, get, g) => { lentejuelas(P, get, g); escote('oscura')(P, get, g); }, extras:[X.gardenia(40, 14), X.perlas] },
          C:{ skin:'oscura', hair:'negra', style:'ondas', body:vestido, dress:(P, get, g) => { lentejuelas(P, get, g); escote('oscura')(P, get, g); }, extras:[X.gardenia(41, 16), X.boa] } } },
    Flapper: { label:'La Flapper', inspo:'Flappers de 1928 (como la imagen): melena corta rubia con ondas, vestido de cintura baja con cuentas y flecos, diadema con pluma y perlas largas.',
      v:{ A:{ skin:'clara', hair:'rubia', style:'bob', body:flapper, dress:(P, get, g) => { cuentas(P, get, g); escote('clara')(P, get, g); }, extras:[X.diadema(true), X.pluma, X.perlasLargas] },
          B:{ skin:'clara', hair:'rubia', style:'bob', fringe:true, body:flapper, dress:(P, get, g) => { cuentas(P, get, g); escote('clara')(P, get, g); }, extras:[X.diadema(true), X.perlasLargas] },
          C:{ skin:'clara', hair:'rubia', style:'bob', body:flapper, mole:[35, 24], dress:(P, get, g) => { cuentas(P, get, g); escote('clara')(P, get, g); }, extras:[X.cloche(G2, false), X.perlasLargas] } } },
    Contadora: { label:'La Contadora', inspo:'Secretarias y contadoras de los 40: traje sastre gris, blusa con lazo, peinado "victory rolls" y lentes.',
      v:{ A:{ skin:'clara', hair:'castana', style:'rollos', body:traje, extras:[X.lentes, lazo] },
          B:{ skin:'clara', hair:'castana', style:'rollos', body:traje, extras:[X.lentes, lazo, X.lapiz] },
          C:{ skin:'clara', hair:'castana', style:'mono', body:traje, extras:[X.sombreroLado, lazo] } } },
    MaBarker: { label:'Ma Barker', inspo:'La "madre" de una banda de los años 30: abrigo de piel, vestido estampado, sombrero cloché y pelo gris.',
      v:{ A:{ skin:'mayor', hair:'gris', style:'mono', age:true, body:piel, dress:lunares, extras:[X.cloche(G2, false)] },
          B:{ skin:'mayor', hair:'gris', style:'mono', age:true, body:piel, dress:lunares, extras:[X.perlas] },
          C:{ skin:'mayor', hair:'gris', style:'mono', age:true, body:piel, dress:lunares, extras:[X.cloche(G2, false), X.plumaSombrero] } } }
  };

  function toCanvas(g) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    for (let y = 0; y < 64; y++) for (let i = 0; i < 64; i++) if (g[y][i]) { x.fillStyle = g[y][i]; x.fillRect(i, y, 1, 1); } return c; }
  async function build() {
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = '../assets/characters/Mafiosa/Color_G/idle.png'; });
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const base = x.getImageData(0, 0, 64, 64);
    const out = {}; for (const [k, r] of Object.entries(RECIPES)) out[k] = { label:r.label, inspo:r.inspo, v:Object.fromEntries(Object.entries(r.v).map(([v, o]) => [v, toCanvas(make(base, o))])) };
    return out;
  }
  return { build, RECIPES };
})();
