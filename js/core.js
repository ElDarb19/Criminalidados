// ===== Criminal Dice · Núcleo del juego (hasta 4 jugadores, local y online) =====
// El anfitrión (o el único dispositivo en local) es la "autoridad": ejecuta las reglas y publica el estado.
// Los invitados solo envían intenciones (acciones) y dibujan el estado recibido.
const CD = { opts:{}, G:null, cfg:null, auth:true, me:-1, base:null, pending:null, fxSeen:0, promptSeen:0, rollResolve:null, busy:false };
const GAME_TITLES = { rpg:'GUERRA DE BANDAS', exp:'EL GRAN ATRACO', maf:'IMPERIO CRIMINAL', pok:'APUESTAS CLANDESTINAS' };
const MODULES = { rpg: () => RPG, exp: () => EXP, maf: () => MAF, pok: () => POK };           // cada contrato nuevo se registra aquí
const $$ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
// Los bots usan la carpeta assets/characters/Bot/ cuando exista; si no, su color; y como último recurso None/.
const BOT_FOLDER = 'Bot';
function charList(p, img) {
  const f = []; if (p.bot) f.push(BOT_FOLDER + '/' + img);
  f.push(p.color + '/' + img, 'None/' + img, 'None/idle');
  return f.map(x => 'assets/characters/' + x + '.png');
}
const charSrc = (p, img) => charList(p, img)[0];
function charNext(el) { const l = (el.dataset.c || '').split('|'); l.shift(); if (!l.length) { el.onerror = null; return; } el.dataset.c = l.join('|'); el.src = l[0]; }

window.addEventListener('criminaldice:start', e => CD.start(e.detail));

CD.mod = () => MODULES[CD.contract]();               // contrato en curso (en Modo Party va cambiando)
CD.applyContractUI = function () {                         // tema de color y título según el contrato actual
  document.body.className = 'theme-' + CD.contract; $$('g-title').textContent = GAME_TITLES[CD.contract];
};
CD.start = function (cfg) {
  if (CD.running) return; CD.running = true;      // evita relanzar la partida si el lobby cambia después de empezar
  CD.cfg = cfg; CD.auth = !cfg.online || S.host;
  CD.me = cfg.online ? (cfg.players.find(p => p.uid === uid) || { slot:-1 }).slot : -1;
  CD.base = cfg.online ? 'rooms/' + cfg.room + '/play' : null;
  CD.fxSeen = 0; CD.promptSeen = 0;
  $$('menu-screen').classList.add('hidden'); $$('game-screen').classList.remove('hidden');
  CD.playlist = cfg.mode === 'party' ? cfg.playlist : [cfg.contract]; CD.contract = CD.playlist[0]; CD.applyContractUI();
  if (CD.auth) {
    CD.G = { players:cfg.players.map(p => ({ slot:p.slot, name:p.name, color:p.color, bot:p.bot, alive:true, hp:0, max:0, poison:0, heals:0, blocked:false })),
      turn:0, round:1, start:0, log:[], fx:null, prompt:null, over:false, result:null, wait:true, started:false, contract:CD.contract, pi:0, wins:{} };
    if (cfg.online) { db.ref(CD.base).remove(); db.ref(CD.base + '/actions').on('child_added', s => { CD.onRemote(s.val()); s.ref.remove(); }); }
    render(); setTimeout(async () => { await CD.mod().init(CD.G); CD.G.started = true; CD.G.wait = false; CD.publish(); render(); CD.next(); }, 600);
  } else {
    db.ref(CD.base + '/ev').on('child_added', s => CD.enqueue(s.val()));
    let hostSeen = false;                      // el anfitrión es el jefe 0: si su presencia desaparece, la sala se cerró
    db.ref(CD.base + '/presence/0').on('value', s => {
      if (s.val()) hostSeen = true;
      else if (hostSeen && CD.G && !CD.G.over) { CD.G.over = true; CD.G.result = { winner:null, lost:true, summary:'El anfitrión se desconectó y la partida terminó.' }; render(); }
    });
  }
  if (cfg.online) CD.presence();
};

// ---------- presencia: si un jugador online se desconecta, un bot toma su lugar ----------
CD.presence = function () {
  if (CD.me >= 0) { const r = db.ref(CD.base + '/presence/' + CD.me); r.set(true); r.onDisconnect().remove(); }
  if (!CD.auth) return;
  const seen = {};
  db.ref(CD.base + '/presence').on('value', s => {
    const v = s.val() || {};
    CD.cfg.players.forEach(p => { if (p.bot || p.slot === CD.me) return; if (v[p.slot]) seen[p.slot] = true; else if (seen[p.slot]) { seen[p.slot] = false; CD.dropPlayer(p.slot); } });
  });
};
CD.dropPlayer = function (slot) {
  const G = CD.G, p = G && G.players[slot]; if (!p || p.bot || G.over) return;
  p.bot = true; p.name += ' (desconectado)'; CD.log('📡 ' + p.name + ' perdió la conexión: un bot toma su lugar.');
  if (G.prompt && G.prompt.slot === slot && CD.rollResolve) CD.rollResolve(1 + Math.floor(Math.random() * G.prompt.sides));
  CD.publish(); render(); if (!G.wait) CD.next();
};

// ---------- red ----------
let evSeq = 0;
CD.emit = function (k, d) {                                 // el anfitrión publica una secuencia ORDENADA de eventos (ev/000001, 000002…)
  if (!CD.cfg.online || !CD.auth) return;
  db.ref(CD.base + '/ev/' + ('000000' + (++evSeq)).slice(-6)).set({ k, d:JSON.parse(JSON.stringify(d === undefined ? null : d)) });
};
CD.publish = function () {                                  // foto del estado (sin log ni efectos); no se envía si no cambió
  if (!CD.cfg.online || !CD.auth) return;
  const { log, fx, floats, ...rest } = CD.G, s = JSON.stringify(rest);
  if (s === CD.lastSnap) return; CD.lastSnap = s; CD.emit('state', rest);
};
CD.send = a => db.ref(CD.base + '/actions').push(Object.assign({ uid }, a));
CD.onRemote = function (a) {
  const p = CD.cfg.players[a.slot]; if (!p || p.uid !== a.uid) return;           // solo el dueño del jefe puede actuar por él
  if (a.type === 'roll') { if (CD.rollResolve && CD.G.prompt && CD.G.prompt.slot === a.slot) CD.rollResolve(a.value); }
  else CD.exec(a.slot, a.type, a.target, a.extra);
};
CD.overSeen = false;
CD.float = function (slot, text, kind) {                    // texto flotante sobre la tarjeta de un jugador
  CD.publish(); CD.emit('float', { slot, text, kind }); showFloat(slot, text, kind);
};
function showFloat(slot, text, kind) {
  const card = document.querySelector('.pcard[data-slot="' + slot + '"]'); if (!card) return;
  const r = card.getBoundingClientRect(), s = document.createElement('div');
  s.className = 'float ' + kind; s.textContent = text; s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 3) + 'px';
  document.body.appendChild(s); setTimeout(() => s.remove(), 1700);
  card.classList.add(kind === 'heal' ? 'pulse-heal' : 'shake'); setTimeout(() => card.classList.remove('shake', 'pulse-heal'), 450);
  playSound(kind === 'heal' ? 'heal' : kind === 'loot' ? 'coin' : kind === 'crit' ? 'crit' : kind === 'dmg' ? 'hit' : 'roll');
  if (kind === 'crit') { const g = $$('game-screen'); g.classList.add('screen-shake'); setTimeout(() => g.classList.remove('screen-shake'), 350); }
}
// ---- invitado: reproduce los eventos del anfitrión EN ORDEN, uno tras otro, sin solapar animaciones ----
CD.q = []; CD.pumping = false; CD.gLog = [];
CD.enqueue = function (ev) { if (!ev) return; CD.q.push(ev); if (!CD.pumping) CD.pump(); };
CD.pump = async function () {
  CD.pumping = true;
  while (CD.q.length) {
    const e = CD.q.shift(), late = CD.q.length > 14;          // muy atrasado (pestaña dormida o mala red): salta animaciones y se pone al día
    try {
      if (e.k === 'state') CD.applySnapshot(e.d);
      else if (e.k === 'log') { CD.gLog.push(e.d); if (CD.gLog.length > 60) CD.gLog.shift(); if (CD.G) { CD.G.log = CD.gLog; render(); } }
      else if (e.k === 'float') { if (!late) showFloat(e.d.slot, e.d.text, e.d.kind); }
      else if (e.k === 'fx') { if (!late) await playFx(e.d); }
    } catch (err) { console.error(err); }
  }
  CD.pumping = false;
};
CD.applySnapshot = function (st) {
  const changed = !!(st.contract && st.contract !== CD.contract); if (changed) CD.contract = st.contract;
  const M = CD.mod(); st.players.forEach(p => { if (M.normalize) M.normalize(p); });   // Firebase borra arreglos/objetos vacíos
  st.log = CD.gLog; st.wins = st.wins || {}; CD.G = st;
  if (changed) CD.applyContractUI();
  if (st.over && !CD.overSeen) { CD.overSeen = true; playSound('win'); }
  if (st.prompt && st.prompt.id > CD.promptSeen && st.prompt.slot === CD.me) {
    CD.promptSeen = st.prompt.id; askManual(st.prompt.sides, st.prompt.desc).then(v => CD.send({ type:'roll', slot:CD.me, value:v }));
  }
  render();
};

// ---------- dados ----------
let fxId = 0, promptId = 0;
CD.roll = async function (sides, p, desc, img, sound) {
  const G = CD.G, human = !p.bot, manual = CD.cfg.dice === 'real' && human;
  let val;
  if (manual) {
    if (!CD.cfg.online || p.slot === CD.me) val = await askManual(sides, desc + ' · ' + p.name);
    else {
      G.prompt = { id:++promptId, slot:p.slot, sides, desc:desc + ' · ' + p.name }; CD.publish(); render();
      val = await new Promise(r => { CD.rollResolve = r; }); CD.rollResolve = null; G.prompt = null;
    }
  } else val = 1 + Math.floor(Math.random() * sides);
  G.fx = { id:++fxId, sides, val, slot:p.slot, desc, img:img || 'idle', color:p.color, bot:p.bot, sound:sound || null, manual };
  CD.publish(); CD.emit('fx', G.fx); const t = playFx(G.fx); render(); await t;
  return val;
};
function askManual(sides, desc) {
  return new Promise(res => {
    $$('manual-desc').textContent = desc + ' (1-' + sides + ')'; const inp = $$('manual-input'); inp.value = ''; inp.max = sides;
    $$('modal-roll').classList.remove('hidden'); inp.focus();
    $$('manual-ok').onclick = () => { const v = parseInt(inp.value, 10); if (!(v >= 1 && v <= sides)) { $$('manual-err').textContent = 'Escribe un número entre 1 y ' + sides; return; }
      $$('manual-err').textContent = ''; $$('modal-roll').classList.add('hidden'); res(v); };
  });
}
async function playFx(fx) {
  const box = $$('fx'), d = 'assets/D' + fx.sides + '/';
  const list = charList({ bot:fx.bot, color:fx.color }, fx.img), im = $$('fx-char');
  $$('fx-title').textContent = fx.desc; im.dataset.c = list.join('|'); im.onerror = function () { charNext(this); }; im.src = list[0];
  if (fx.sound) playSound(fx.sound);
  $$('d-shadow').style.backgroundImage = fx.sides > 6 ? `url('${d}Sombra.png')` : 'none';
  $$('d-color').style.backgroundImage = `url('${d}${fx.color}.png')`; $$('d-base').style.backgroundImage = `url('${d}Capa 0.png')`;
  const num = $$('d-num'); box.classList.remove('hidden');
  if (fx.manual) { num.style.backgroundImage = `url('${d}${fx.val}.png')`; playSound('diceLanding'); await sleep(900); }
  else { for (let i = 0; i < 10; i++) { num.style.backgroundImage = `url('${d}${1 + Math.floor(Math.random() * fx.sides)}.png')`; $$('d-wrap').style.transform = `rotate(${Math.random() * 20 - 10}deg)`; playSound('roll'); await sleep(60); }
    num.style.backgroundImage = `url('${d}${fx.val}.png')`; $$('d-wrap').style.transform = 'none'; playSound('diceLanding'); await sleep(650); }
  box.classList.add('hidden');
}

// ---------- reglas generales ----------
CD.log = t => { CD.G.log.push(t); if (CD.G.log.length > 60) CD.G.log.shift(); CD.emit('log', t); };
CD.alive = () => CD.G.players.filter(p => p.alive);
CD.canAct = function (p) { return !!p && !p.bot && (CD.cfg.online ? p.slot === CD.me : true); };
CD.input = function (type, target, extra) {
  const G = CD.G, p = G.players[G.turn];
  if (G.over || G.wait || G.between || !CD.canAct(p)) return;
  CD.pending = null; CD.opts = {};
  if (CD.auth) CD.exec(p.slot, type, target, extra); else { CD.send({ type, slot:p.slot, target, extra:extra === undefined ? null : extra }); G.wait = true; render(); }
};
CD.exec = async function (slot, type, target, extra) {
  const G = CD.G, p = G.players[G.turn];
  if (G.over || G.wait || G.between || !p || p.slot !== slot) return;
  G.wait = true; CD.publish(); render();
  try { await CD.mod().act(G, p, type, target, extra); } catch (e) { console.error(e); }
  CD.publish(); render(); await sleep(G.over || G.between ? 900 : 1500);     // momento para ver el daño sobre el personaje
  G.focus = null;
  const M = CD.mod();
  if (!G.over && !G.between && !(M.keepTurn && M.keepTurn(G))) CD.advance();     // algunos contratos tienen turnos de varias fases
  G.wait = false; CD.publish(); render(); CD.next();
};
CD.advance = function () {
  // Una ronda se completa cuando el turno vuelve a pasar por el jugador que empezó (G.start), no por el asiento 0:
  // así, con primer turno aleatorio, todos juegan exactamente las mismas veces.
  const G = CD.G, n = G.players.length, start = G.start || 0; let crossed = false;
  for (let k = 1; k <= n; k++) {
    const j = (G.turn + k) % n;
    if (j === start) crossed = true;
    if (G.players[j].alive) {
      if (crossed) { G.round++; if (CD.mod().onRound) CD.mod().onRound(G); }
      G.turn = j; if (CD.mod().onTurnStart) CD.mod().onTurnStart(G, G.players[j]); return;
    }
  }
};
CD.next = function () {                       // los bots juegan solos
  const G = CD.G; if (!CD.auth || G.over || G.wait || G.between) return; const p = G.players[G.turn];
  if (p.bot) setTimeout(() => { const a = AI.decide(G, p, CD.contract); if (a) CD.exec(p.slot, a.type, a.target, a.extra); }, 900);
};
// Ordena jugadores por una clave (arreglo de números, mayor = mejor); los empates comparten puesto.
CD.rank = function (players, key, text) {
  const s = players.slice().sort((a, b) => { const x = key(a), y = key(b); for (let i = 0; i < x.length; i++) if (y[i] !== x[i]) return y[i] - x[i]; return 0; });
  let place = 0, prev = null;
  return s.map((p, i) => { const k = key(p).join(','); if (k !== prev) { place = i + 1; prev = k; } return { slot:p.slot, place, text:text(p) }; });
};
function podiumHtml(G, pod) {
  const medal = { 1:'🥇', 2:'🥈', 3:'🥉' };
  return pod.map(e => { const p = G.players[e.slot], L = charList(p, e.place === 1 ? 'win' : 'idle');
    return `<div class="pod p${Math.min(e.place, 4)}" style="--pc:${COLORS[p.color]}"><span class="medal">${medal[e.place] || e.place + 'º'}</span>
      <img src="${L[0]}" data-c="${L.join('|')}" onerror="charNext(this)" alt=""><div><b>${esc(p.name)}</b><small>${esc(e.text)}</small></div></div>`; }).join('');
}
CD.finish = function (winnerSlot, summary) {
  const G = CD.G;
  if (CD.cfg.mode === 'party') return CD.partyResult(winnerSlot, summary);
  G.over = true; G.result = { winner:winnerSlot, summary:summary || '', podium:CD.mod().ranking ? CD.mod().ranking(G) : null };
  playSound('win');
  CD.log(winnerSlot == null ? '🤝 Empate: nadie sobrevivió.' : '🏆 ' + G.players[winnerSlot].name + ' domina la ciudad.');
};
// ---------- Modo Party: marcador de victorias y paso al siguiente contrato ----------
CD.partyResult = function (winnerSlot, summary) {
  const G = CD.G, goal = CD.cfg.winsNeeded, name = GAME_TITLES[G.contract];
  if (winnerSlot != null) G.wins[winnerSlot] = (G.wins[winnerSlot] || 0) + 1;
  const board = G.players.map(p => (p.name + ': ' + (G.wins[p.slot] || 0) + '/' + goal));
  CD.log(winnerSlot == null ? `🤝 ${name}: empate, nadie suma victoria.` : `🏅 ${G.players[winnerSlot].name} gana ${name}.`);
  playSound('win');
  if (winnerSlot != null && G.wins[winnerSlot] >= goal) {
    G.over = true; G.result = { winner:winnerSlot, summary:'Campeón del Modo Party', podium:CD.rank(G.players, p => [G.wins[p.slot] || 0], p => (G.wins[p.slot] || 0) + ' de ' + goal + ' victorias') };
    CD.log('🏆 ' + G.players[winnerSlot].name + ' llega a ' + goal + ' victorias y domina la ciudad.'); return;
  }
  const next = CD.playlist[(G.pi + 1) % CD.playlist.length];
  G.between = { kind:'party', title:'CONTRATO COMPLETADO', button:'SIGUIENTE CONTRATO',
    lines:[winnerSlot == null ? `${name}: empate, nadie suma victoria.` : `🏅 ${G.players[winnerSlot].name} gana ${name}.`, summary || '', 'Marcador (meta: ' + goal + ' victorias):'].filter(Boolean).concat(board, ['', 'Siguiente contrato: ' + GAME_TITLES[next]]) };
};
CD.nextContract = async function () {
  const G = CD.G, pi = G.pi + 1;
  CD.contract = CD.playlist[pi % CD.playlist.length];
  CD.G = { players:G.players.map(p => ({ slot:p.slot, name:p.name, color:p.color, bot:p.bot, alive:true, hp:0, max:0, poison:0, heals:0, blocked:false })),
    turn:0, round:1, start:0, log:G.log, fx:null, prompt:null, over:false, result:null, wait:true, started:false, contract:CD.contract, pi, wins:G.wins, between:null, focus:null };
  CD.applyContractUI(); CD.log('🎬 ——— Contrato ' + (pi + 1) + ': ' + GAME_TITLES[CD.contract] + ' ———'); CD.lastSnap = null; CD.publish(); render();
  await CD.mod().init(CD.G); CD.G.started = true; CD.G.wait = false; CD.publish(); render(); CD.next();
};
CD.nextStage = async function () {            // botón de la pantalla intermedia (solo anfitrión/local)
  const G = CD.G; if (!CD.auth || !G.between) return;
  const party = G.between.kind === 'party';
  if (party) return CD.nextContract();
  G.between = null; G.wait = true; CD.publish(); render();
  await CD.mod().nextStage(G); G.wait = false; CD.publish(); render(); CD.next();
};
CD.exit = () => { if (CD.cfg.online && CD.auth) db.ref('rooms/' + CD.cfg.room).remove(); location.href = location.pathname; };

// ---------- pantalla ----------
function render() {
  const G = CD.G; if (!G) return; const M = CD.mod(), cur = G.players[G.turn];
  $$('g-round').textContent = (CD.cfg.mode === 'party' ? 'CONTRATO ' + ((G.pi || 0) + 1) + ' · ' : '') + (M.head && M.head(G) ? M.head(G) + ' · ' : '') + 'RONDA ' + (M.rounds ? Math.min(G.round, M.rounds()) + '/' + M.rounds() : G.round);
  const mine = CD.canAct(cur) && !G.wait && !G.over && !G.between && G.started;
  const targets = CD.pending && mine ? (M.validTargets(G, cur, CD.pending) || []) : [];
  $$('g-players').innerHTML = G.players.map(p => {
    const k = M.card(p, G), L = charList(p, k.img), isT = targets.includes(p.slot);
    const marked = G.focus && G.focus.target === p.slot && G.focus.att !== p.slot;
    return `<div class="pcard ${G.players[G.turn].slot === p.slot && !G.over && !G.between && p.alive ? 'turn' : ''} ${k.state} ${isT ? 'targetable' : ''} ${marked ? 'marked' : ''}" data-slot="${p.slot}" style="--pc:${COLORS[p.color]}" ${isT ? `onclick="CD.pick(${p.slot})"` : ''}>
      ${marked ? '<span class="mark">🎯</span>' : ''}<img src="${L[0]}" data-c="${L.join('|')}" onerror="charNext(this)" alt="">
      <div><b>${esc(p.name)}</b>${p.bot ? ' 🤖' : ''}<div class="hp">${(k.segs || [{ pct:k.pct, color:k.color }]).map(s => `<i style="width:${Math.max(0, Math.min(100, s.pct))}%;background:${s.color}"></i>`).join('')}</div><small>${k.label}</small>${k.html || ''}${CD.cfg.mode === 'party' ? `<div class="pw">🏅 ${(G.wins && G.wins[p.slot]) || 0}/${CD.cfg.winsNeeded} victorias</div>` : ''}</div></div>`; }).join('');
  $$('g-turn').textContent = G.over ? '' : !G.started ? 'Preparando el contrato…' : G.between ? '' : G.prompt ? '⏳ Esperando el dado de ' + G.players[G.prompt.slot].name :
    CD.pending ? '🎯 Elige a tu objetivo' : (mine ? '👉 Tu turno, ' + cur.name : 'Turno de ' + cur.name + (cur.bot ? ' (bot)' : ''));
  const box = $$('g-actions'); box.classList.toggle('hidden', !mine);
  if (mine) box.innerHTML = M.ui(G, cur).map(b => `<button class="opt ${b.wide ? 'wide' : ''} ${CD.pending === b.type ? 'selected' : ''}" ${b.disabled ? 'disabled' : ''} onclick="CD.choose('${b.type}')">${b.label}<br><small>${b.sub}</small></button>`).join('');
  $$('g-log').innerHTML = G.log.slice().reverse().map(l => '<div>' + esc(l) + '</div>').join('');
  const bt = $$('modal-between'); bt.classList.toggle('hidden', !G.between);
  if (G.between) {
    $$('between-title').textContent = G.between.title; $$('between-text').innerHTML = G.between.lines.map(esc).join('<br>');
    const b = $$('between-btn'); b.disabled = !CD.auth; b.textContent = CD.auth ? G.between.button : 'ESPERANDO AL ANFITRIÓN…';
  }
  $$('modal-over').classList.toggle('hidden', !G.over);
  if (G.over) { $$('over-text').textContent = G.result.lost ? 'Partida interrumpida' : G.result.winner == null ? 'Empate' : '🏆 ' + G.players[G.result.winner].name; $$('over-sub').textContent = G.result.summary || ''; $$('over-podium').innerHTML = G.result.podium ? podiumHtml(G, G.result.podium) : ''; }
}
CD.choose = function (type) {                 // botón de acción
  const G = CD.G, me = G.players[G.turn]; if (G.between || G.over || G.wait) return;
  if (type.startsWith('opt:')) { const k = type.slice(4); CD.opts[k] = !CD.opts[k]; return render(); }   // interruptores locales (no son acciones)
  const t = CD.mod().validTargets(G, me, type);
  if (t === null) return CD.go(type, null);               // la acción no necesita objetivo
  if (!t.length) return;
  if (t.length === 1) return CD.go(type, t[0]);           // un solo objetivo posible
  CD.pending = CD.pending === type ? null : type; render();
};
CD.pick = function (slot) { if (CD.pending) CD.go(CD.pending, slot); };
// Tras elegir acción (y objetivo), el contrato puede pedir un dato más (p. ej. el distrito) con una ventana de elección.
CD.go = async function (type, target) {
  const G = CD.G, me = G.players[G.turn], M = CD.mod(), spec = M.extra ? M.extra(G, me, type, target) : null;
  if (!spec) return CD.input(type, target);
  if ('value' in spec) return CD.input(type, target, spec.value);
  CD.pending = null; render();
  const v = await CD.ask(spec); if (v == null) return;
  CD.input(type, target, v);
};
CD.ask = function (spec) {
  return new Promise(res => {
    $$('choice-title').textContent = spec.title; $$('choice-text').textContent = spec.text || '';
    const box = $$('choice-opts'); box.innerHTML = '';
    spec.options.forEach(o => { const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = o.label; b.disabled = !!o.disabled;
      b.onclick = () => { $$('modal-choice').classList.add('hidden'); res(o.value); }; box.appendChild(b); });
    $$('choice-cancel').onclick = () => { $$('modal-choice').classList.add('hidden'); res(null); };
    $$('modal-choice').classList.remove('hidden');
  });
};
