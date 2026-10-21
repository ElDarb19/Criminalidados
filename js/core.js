// ===== Criminal Dice · Núcleo del juego (hasta 4 jugadores, local y online) =====
// El anfitrión (o el único dispositivo en local) es la "autoridad": ejecuta las reglas y publica el estado.
// Los invitados solo envían intenciones (acciones) y dibujan el estado recibido.
const CD = { G:null, cfg:null, auth:true, me:-1, base:null, pending:null, fxSeen:0, promptSeen:0, rollResolve:null, busy:false };
const GAME_TITLES = { rpg:'GUERRA DE BANDAS', exp:'EL GRAN ATRACO', maf:'IMPERIO CRIMINAL', pok:'APUESTAS CLANDESTINAS' };
const MODULES = { rpg: () => RPG, exp: () => EXP };           // cada contrato nuevo se registra aquí
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

CD.mod = () => MODULES[CD.cfg.contract]();
CD.start = function (cfg) {
  if (CD.running) return; CD.running = true;      // evita relanzar la partida si el lobby cambia después de empezar
  CD.cfg = cfg; CD.auth = !cfg.online || S.host;
  CD.me = cfg.online ? (cfg.players.find(p => p.uid === uid) || { slot:-1 }).slot : -1;
  CD.base = cfg.online ? 'rooms/' + cfg.room + '/play' : null;
  CD.fxSeen = 0; CD.promptSeen = 0;
  $$('menu-screen').classList.add('hidden'); $$('game-screen').classList.remove('hidden');
  document.body.className = 'theme-' + cfg.contract;
  $$('g-title').textContent = GAME_TITLES[cfg.contract];
  if (CD.auth) {
    CD.G = { players:cfg.players.map(p => ({ slot:p.slot, name:p.name, color:p.color, bot:p.bot, alive:true, hp:0, max:0, poison:0, heals:0, blocked:false })),
      turn:0, round:1, log:[], fx:null, prompt:null, over:false, result:null, wait:true, started:false };
    if (cfg.online) { db.ref(CD.base).remove(); db.ref(CD.base + '/actions').on('child_added', s => { CD.onRemote(s.val()); s.ref.remove(); }); }
    render(); setTimeout(async () => { await CD.mod().init(CD.G); CD.G.started = true; CD.G.wait = false; CD.publish(); render(); CD.next(); }, 600);
  } else {
    db.ref(CD.base + '/state').on('value', s => {
      if (s.val()) CD.onState(s.val());
      else if (CD.G && CD.G.started && !CD.G.over) {     // el anfitrión se desconectó: la sala desaparece
        CD.G.over = true; CD.G.result = { winner:null, lost:true, summary:'El anfitrión se desconectó y la partida terminó.' }; render();
      }
    });
  }
  if (cfg.online) CD.presence();
};

// ---------- presencia: si un jugador online se desconecta, un bot toma su lugar ----------
CD.presence = function () {
  if (CD.auth) db.ref(CD.base).onDisconnect().remove();                    // si cae el anfitrión, la partida se cierra
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
CD.publish = function () { if (CD.cfg.online && CD.auth) db.ref(CD.base + '/state').set(JSON.parse(JSON.stringify(CD.G))); };
CD.send = a => db.ref(CD.base + '/actions').push(Object.assign({ uid }, a));
CD.onRemote = function (a) {
  const p = CD.cfg.players[a.slot]; if (!p || p.uid !== a.uid) return;           // solo el dueño del jefe puede actuar por él
  if (a.type === 'roll') { if (CD.rollResolve && CD.G.prompt && CD.G.prompt.slot === a.slot) CD.rollResolve(a.value); }
  else CD.exec(a.slot, a.type, a.target);
};
let floatId = 0; CD.floatSeen = 0; CD.overSeen = false;
CD.float = function (slot, text, kind) {                    // texto flotante sobre la tarjeta de un jugador
  const G = CD.G; G.floats = (G.floats || []).slice(-7); G.floats.push({ id:++floatId, slot, text, kind });
  CD.floatSeen = floatId; CD.publish(); showFloat(slot, text, kind);
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
CD.onState = function (st) {
  CD.G = st;
  (st.floats || []).forEach(f => { if (f.id > CD.floatSeen) { CD.floatSeen = f.id; showFloat(f.slot, f.text, f.kind); } });
  if (st.over && !CD.overSeen) { CD.overSeen = true; playSound('win'); }
  if (st.fx && st.fx.id > CD.fxSeen) { CD.fxSeen = st.fx.id; playFx(st.fx); }
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
  CD.publish(); const t = playFx(G.fx); render(); await t;
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
CD.log = t => { CD.G.log.push(t); if (CD.G.log.length > 60) CD.G.log.shift(); };
CD.alive = () => CD.G.players.filter(p => p.alive);
CD.canAct = function (p) { return !!p && !p.bot && (CD.cfg.online ? p.slot === CD.me : true); };
CD.input = function (type, target) {
  const G = CD.G, p = G.players[G.turn];
  if (G.over || G.wait || G.between || !CD.canAct(p)) return;
  CD.pending = null;
  if (CD.auth) CD.exec(p.slot, type, target); else CD.send({ type, slot:p.slot, target });
};
CD.exec = async function (slot, type, target) {
  const G = CD.G, p = G.players[G.turn];
  if (G.over || G.wait || G.between || !p || p.slot !== slot) return;
  G.wait = true; CD.publish(); render();
  try { await CD.mod().act(G, p, type, target); } catch (e) { console.error(e); }
  CD.publish(); render(); await sleep(G.over ? 600 : 1500);     // momento para ver el daño sobre el personaje
  G.focus = null;
  if (!G.over) CD.advance();
  G.wait = false; CD.publish(); render(); CD.next();
};
CD.advance = function () {
  const G = CD.G, n = G.players.length;
  for (let k = 1; k <= n; k++) {
    const j = (G.turn + k) % n;
    if (G.players[j].alive) { if (j <= G.turn) { G.round++; if (CD.mod().onRound) CD.mod().onRound(G); } G.turn = j; return; }
  }
};
CD.next = function () {                       // los bots juegan solos
  const G = CD.G; if (!CD.auth || G.over || G.wait || G.between) return; const p = G.players[G.turn];
  if (p.bot) setTimeout(() => { const a = AI.decide(G, p, CD.cfg.contract); if (a) CD.exec(p.slot, a.type, a.target); }, 900);
};
CD.finish = function (winnerSlot, summary) {
  const G = CD.G; G.over = true; G.result = { winner:winnerSlot, summary:summary || '' };
  playSound('win');
  CD.log(winnerSlot == null ? '🤝 Empate: nadie sobrevivió.' : '🏆 ' + G.players[winnerSlot].name + ' domina la ciudad.');
};
CD.nextStage = async function () {            // botón de la pantalla intermedia (solo anfitrión/local)
  const G = CD.G; if (!CD.auth || !G.between) return;
  G.between = null; G.wait = true; CD.publish(); render();
  await CD.mod().nextStage(G); G.wait = false; CD.publish(); render(); CD.next();
};
CD.exit = () => { if (CD.cfg.online && CD.auth) db.ref('rooms/' + CD.cfg.room).remove(); location.href = location.pathname; };

// ---------- pantalla ----------
function render() {
  const G = CD.G; if (!G) return; const M = CD.mod(), cur = G.players[G.turn];
  $$('g-round').textContent = (M.head ? M.head(G) + ' · ' : '') + 'RONDA ' + G.round;
  const mine = CD.canAct(cur) && !G.wait && !G.over && !G.between && G.started;
  const targets = CD.pending && mine ? (M.validTargets(G, cur, CD.pending) || []) : [];
  $$('g-players').innerHTML = G.players.map(p => {
    const k = M.card(p, G), L = charList(p, k.img), isT = targets.includes(p.slot);
    const marked = G.focus && G.focus.target === p.slot && G.focus.att !== p.slot;
    return `<div class="pcard ${G.players[G.turn].slot === p.slot && !G.over && !G.between && p.alive ? 'turn' : ''} ${k.state} ${isT ? 'targetable' : ''} ${marked ? 'marked' : ''}" data-slot="${p.slot}" style="--pc:${COLORS[p.color]}" ${isT ? `onclick="CD.pick(${p.slot})"` : ''}>
      ${marked ? '<span class="mark">🎯</span>' : ''}<img src="${L[0]}" data-c="${L.join('|')}" onerror="charNext(this)" alt="">
      <div><b>${esc(p.name)}</b>${p.bot ? ' 🤖' : ''}<div class="hp"><i style="width:${Math.max(0, Math.min(100, k.pct))}%;background:${k.color}"></i></div><small>${k.label}</small></div></div>`; }).join('');
  $$('g-turn').textContent = G.over ? '' : !G.started ? 'Preparando el contrato…' : G.between ? '' : G.prompt ? '⏳ Esperando el dado de ' + G.players[G.prompt.slot].name :
    CD.pending ? '🎯 Elige a quién atacar' : (mine ? '👉 Tu turno, ' + cur.name : 'Turno de ' + cur.name + (cur.bot ? ' (bot)' : ''));
  const box = $$('g-actions'); box.classList.toggle('hidden', !mine);
  if (mine) box.innerHTML = M.ui(G, cur).map(b => `<button class="opt ${CD.pending === b.type ? 'selected' : ''}" ${b.disabled ? 'disabled' : ''} onclick="CD.choose('${b.type}')">${b.label}<br><small>${b.sub}</small></button>`).join('');
  $$('g-log').innerHTML = G.log.slice().reverse().map(l => '<div>' + esc(l) + '</div>').join('');
  const bt = $$('modal-between'); bt.classList.toggle('hidden', !G.between);
  if (G.between) {
    $$('between-title').textContent = G.between.title; $$('between-text').innerHTML = G.between.lines.map(esc).join('<br>');
    const b = $$('between-btn'); b.disabled = !CD.auth; b.textContent = CD.auth ? G.between.button : 'ESPERANDO AL ANFITRIÓN…';
  }
  $$('modal-over').classList.toggle('hidden', !G.over);
  if (G.over) { $$('over-text').textContent = G.result.lost ? 'Partida interrumpida' : G.result.winner == null ? 'Empate' : '🏆 ' + G.players[G.result.winner].name; $$('over-sub').textContent = G.result.summary || ''; }
}
CD.choose = function (type) {                 // botón de acción
  const G = CD.G, me = G.players[G.turn]; if (G.between || G.over || G.wait) return;
  const t = CD.mod().validTargets(G, me, type);
  if (t === null) return CD.input(type, null);            // la acción no necesita objetivo
  if (!t.length) return;
  if (t.length === 1) return CD.input(type, t[0]);        // un solo objetivo posible
  CD.pending = CD.pending === type ? null : type; render();
};
CD.pick = function (slot) { if (CD.pending) CD.input(CD.pending, slot); };
