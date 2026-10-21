// ===== Criminal Dice · Menú inicial =====
const firebaseConfig = {
  apiKey: "AIzaSyCEY_P4mC8xArf88rRBYyI-JZ_M74o6FuE",
  authDomain: "criminalidados-243e6.firebaseapp.com",
  databaseURL: "https://criminalidados-243e6-default-rtdb.firebaseio.com",
  projectId: "criminalidados-243e6",
  storageBucket: "criminalidados-243e6.firebasestorage.app",
  messagingSenderId: "375013954181",
  appId: "1:375013954181:web:1d1a5d6ce1990454c04fec"
};
let db = null;
try { firebase.initializeApp(firebaseConfig); db = firebase.database(); } catch (e) { console.warn('Firebase no disponible', e); }

// Colores = carpetas de assets/characters/. Para agregar uno nuevo: crea su carpeta y añádelo aquí.
const COLORS = { Color_R:'#e74c3c', Color_B:'#3498db', Color_G:'#2ecc71', Color_P:'#ff8fc7', Color_Pu:'#9b59b6', Color_W:'#ecf0f1' };
// Ajustable: dinero inicial del Mercado Negro cuando se juega un único contrato (en Party se usa la economía normal).
const SINGLE_CONTRACT_START_MONEY = 300;
// Momentos de Mercado Negro en un único contrato: antes de empezar (y en El Gran Atraco, también tras la inmersión 1 y la 3).
const MARKET_MOMENTS = { rpg:['inicio'], maf:['inicio'], pok:['inicio'], exp:['inicio','tras_inmersion_1','tras_inmersion_3'] };
const COLOR_KEYS = Object.keys(COLORS);
const GAMES = ['rpg','exp','maf','pok'];
const IMPLEMENTED = ['rpg', 'exp'];   // contratos ya migrados a 4 jugadores; añade aquí cada uno al terminarlo
const GAME_NAMES = { rpg:'Guerra de Bandas', exp:'El Gran Atraco', maf:'Imperio Criminal', pok:'Apuestas Clandestinas' };
const $ = id => document.getElementById(id);

// Identidad anónima: sin cuentas, solo un id aleatorio por pestaña.
const uid = sessionStorage.cdUid || (sessionStorage.cdUid = Math.random().toString(36).slice(2, 10));

const S = {
  mode:'local', room:null, host:true, humans:1, bots:1,
  players: ['Color_R','Color_B','Color_G','Color_P'].map((c,i) => ({ name:'Capo ' + (i+1), color:c, uid:null })),
  contract:'rpg', party:false, market:false, events:false,
  partyGames:{ rpg:true, exp:true, maf:true, pok:true }, total:6, dice:'virtual'
};
let lobbyRef = null;

// ---------- utilidades ----------
const online = () => S.mode === 'online';
const canHost = () => !online() || S.host;
const partyCount = () => GAMES.filter(g => S.partyGames[g]).length;
const minTotal = () => partyCount() + 2;           // 4 contratos -> 6 (ejemplo del diseño)
const winsNeeded = () => Math.floor(S.total / 2) + 1; // 6 -> 4
const usedByHumans = except => S.players.slice(0, S.humans).filter((p,i) => i !== except).map(p => p.color);
function botColors() {
  const free = COLOR_KEYS.filter(c => !usedByHumans(-1).includes(c));
  return S.players.slice(S.humans, S.humans + S.bots).map((p,i) => free[i]);
}
function say(id, t) { $(id).textContent = t || ''; }

// ---------- modo de juego ----------
function setMode(m) {
  if (m === 'local' && online()) leaveRoom();
  S.mode = m; S.host = true;
  $('m-local').classList.toggle('selected', m === 'local');
  $('m-online').classList.toggle('selected', m === 'online');
  $('net-card').classList.toggle('hidden', m !== 'online');
  renderAll();
}

// ---------- sala online ----------
function newCode() { return Math.random().toString(36).slice(2, 6).toUpperCase(); }
function requireDb() { if (!db) { say('net-msg', 'Sin conexión con Firebase.'); return false; } return true; }

function createRoom() {
  if (!requireDb()) return;
  leaveRoom();
  S.room = newCode(); S.host = true;
  S.players[0].uid = uid;
  lobbyRef = db.ref('rooms/' + S.room + '/lobby');
  lobbyRef.set({ status:'LOBBY', config:cfgFromState(), players:{ 0:S.players[0] } });
  lobbyRef.onDisconnect().remove();
  history.replaceState(null, '', '?room=' + S.room);
  $('room-code').textContent = S.room;
  $('create-box').classList.remove('hidden'); $('join-box').classList.add('hidden');
  say('net-msg', ''); listen(); renderAll();
}
function showJoin() { $('join-box').classList.remove('hidden'); $('create-box').classList.add('hidden'); }

async function joinRoom() {
  if (!requireDb()) return;
  const code = $('join-input').value.trim().toUpperCase();
  if (code.length < 3) return say('net-msg', 'Ingresa un código válido.');
  const ref = db.ref('rooms/' + code + '/lobby');
  const snap = await ref.once('value');
  const lobby = snap.val();
  if (!lobby) return say('net-msg', 'Esa sala no existe.');
  if (lobby.status !== 'LOBBY') return say('net-msg', 'La partida ya comenzó.');
  const humans = lobby.config.humans;
  let slot = -1;
  const tx = await ref.child('players').transaction(pl => {
    pl = pl || {}; slot = -1;
    for (let i = 0; i < humans; i++) if (!pl[i]) { slot = i; break; }
    if (slot < 0) return;                                   // llena -> aborta
    const taken = Object.values(pl).map(p => p.color);
    pl[slot] = { name:'Capo ' + (slot+1), color:COLOR_KEYS.find(c => !taken.includes(c)), uid };
    return pl;
  });
  if (!tx.committed) return say('net-msg', 'La sala está llena.');
  S.room = code; S.host = false; lobbyRef = ref;
  ref.child('players/' + slot).onDisconnect().remove();
  history.replaceState(null, '', '?room=' + code);
  $('room-code').textContent = code;
  $('create-box').classList.remove('hidden'); $('join-box').classList.add('hidden');
  say('net-msg', 'Conectado a la sala ' + code); listen();
}

function listen() {
  lobbyRef.on('value', snap => {
    const l = snap.val();
    if (!l) { if (!S.host) { say('net-msg', 'El anfitrión cerró la sala.'); leaveRoom(); renderAll(); } return; }
    const c = l.config;
    if (!S.host) {   // el invitado refleja la configuración del anfitrión
      Object.assign(S, { humans:c.humans, bots:c.bots, contract:c.contract, party:c.party, market:c.market,
        events:c.events, total:c.total, dice:c.dice, partyGames:Object.assign({}, c.partyGames) });
    }
    for (let i = 0; i < 4; i++) {
      const p = (l.players || {})[i];
      S.players[i] = p ? Object.assign({}, p) : { name:'Capo ' + (i+1), color:S.players[i].color, uid:null };
    }
    renderAll();
    if (l.status === 'STARTING' && !S.host) emitStart(l.config);
  });
}
function leaveRoom() {
  if (lobbyRef) {
    lobbyRef.off();
    if (S.host) lobbyRef.remove();
    else S.players.forEach((p,i) => { if (p.uid === uid) lobbyRef.child('players/' + i).remove(); });
  }
  lobbyRef = null; S.room = null; S.host = true;
  S.players.forEach(p => { p.uid = null; });
  $('create-box').classList.add('hidden'); $('join-box').classList.add('hidden');
  history.replaceState(null, '', location.pathname);
}

function copyLink() {
  const url = location.origin + location.pathname + '?room=' + S.room;
  (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(
    () => say('net-msg', '¡Enlace copiado!'), () => prompt('Copia el enlace:', url));
}
function cfgFromState() {
  return { humans:S.humans, bots:S.bots, contract:S.contract, party:S.party, market:S.market, events:S.events,
    total:S.total, dice:S.dice, partyGames:Object.assign({}, S.partyGames) };
}
function pushConfig() { if (online() && S.host && lobbyRef) lobbyRef.child('config').set(cfgFromState()); }

// ---------- jefes de la mafia ----------
function onCounts() {
  if (!canHost()) return;
  S.humans = +$('sel-humans').value; S.bots = Math.min(+$('sel-bots').value, 4 - S.humans);
  renderAll(); pushConfig();
}
function claimedMax() { let m = 0; if (online()) S.players.forEach((p,i) => { if (p.uid) m = i + 1; }); return m; }

function renderSlots() {
  const hs = $('sel-humans'), bs = $('sel-bots');
  const minH = Math.max(1, claimedMax());
  hs.innerHTML = ''; for (let h = minH; h <= 4; h++) hs.add(new Option(h, h));
  hs.value = S.humans;
  bs.innerHTML = ''; for (let b = 0; b <= 4 - S.humans; b++) bs.add(new Option(b, b));
  bs.value = S.bots;
  const locked = !canHost();
  hs.disabled = bs.disabled = locked;

  const bc = botColors(), box = $('slots');
  const total = S.humans + S.bots;
  for (let i = 0; i < 4; i++) {
    let el = box.children[i];
    if (!el) { el = document.createElement('div'); el.className = 'slot'; box.appendChild(el); el.innerHTML =
      '<div class="avatar"><img alt=""></div><div><small></small><input type="text" maxlength="16"><div class="swatches"></div></div>';
      el.querySelector('input').addEventListener('input', e => onName(i, e.target.value));
      const sw = el.querySelector('.swatches');
      COLOR_KEYS.forEach(c => { const b = document.createElement('button'); b.className = 'sw'; b.style.setProperty('--c', COLORS[c]);
        b.title = c; b.onclick = () => onColor(i, c); sw.appendChild(b); }); }
    el.classList.toggle('hidden', i >= total);
    if (i >= total) continue;
    const isBot = i >= S.humans, p = S.players[i];
    const color = isBot ? bc[i - S.humans] : p.color;
    const mine = !isBot && (!online() || p.uid === uid);
    const claimed = !online() || !!p.uid;
    el.classList.toggle('mine', mine && online());
    const inp = el.querySelector('input');
    el.querySelector('small').textContent = isBot ? 'BOT ' + (i - S.humans + 1) : ('JEFE ' + (i+1) + (online() ? (p.uid === uid ? ' · TÚ' : (claimed ? '' : ' · esperando…')) : ''));
    const nm = isBot ? 'Bot ' + (i - S.humans + 1) : (claimed ? p.name : '—');
    if (document.activeElement !== inp) inp.value = nm;
    inp.disabled = !mine;
    el.querySelector('.avatar').style.setProperty('--pc', COLORS[color] || '#555');
    const img = el.querySelector('img'); const src = 'assets/characters/' + color + '/idle.png';
    if (!img.src.endsWith(src)) { img.style.visibility = 'visible'; img.onerror = () => { img.style.visibility = 'hidden'; }; img.src = src; }
    el.querySelectorAll('.sw').forEach(b => {
      const c = b.title; b.classList.toggle('sel', c === color);
      b.disabled = !mine || usedByHumans(i).includes(c);   // colores en uso, bloqueados
    });
  }
}
function onName(i, v) {
  S.players[i].name = v;
  if (online() && lobbyRef) lobbyRef.child('players/' + i + '/name').set(v);
}
function onColor(i, c) {
  if (usedByHumans(i).includes(c)) return;
  S.players[i].color = c;
  if (online() && lobbyRef) lobbyRef.child('players/' + i + '/color').set(c);
  renderAll();
}

// ---------- contrato ----------
function applyTheme() {
  const g = S.party ? 'rpg' : S.contract;
  document.body.className = 'theme-' + g;
}
function pickContract(g) { if (!canHost()) return; S.contract = g; renderAll(); pushConfig(); }
function onToggles() {
  if (!canHost()) { renderAll(); return; }
  S.party = $('t-party').checked; S.market = $('t-market').checked; S.events = $('t-events').checked;
  if (S.party) S.total = Math.max(S.total, minTotal());
  renderAll(); pushConfig();
}
function onPartyGames() {
  if (!canHost()) { renderAll(); return; }
  document.querySelectorAll('#party-box input[data-g]').forEach(c => S.partyGames[c.dataset.g] = c.checked);
  if (partyCount() === 0) { S.partyGames.rpg = true; }   // mínimo un contrato
  S.total = Math.max(S.total, minTotal());
  renderAll(); pushConfig();
}
function onTotal() {
  if (!canHost()) return;
  const v = parseInt($('total').value, 10);
  if (isNaN(v)) return;
  S.total = Math.min(15, v); updatePartyHint(); pushConfig();
}
function updatePartyHint() {
  const low = S.total < minTotal();
  $('party-hint').textContent = low ? 'Mínimo ' + minTotal() + ' contratos para que se juegue cada actividad al menos una vez.'
    : 'El primero en ganar ' + winsNeeded() + ' victorias dominará la ciudad.';
}
function setDice(d) { if (!canHost()) return; S.dice = d; renderAll(); pushConfig(); }

function renderContract() {
  $('t-party').checked = S.party; $('t-market').checked = S.market; $('t-events').checked = S.events;
  $('single-box').classList.toggle('hidden', S.party);
  $('party-box').classList.toggle('hidden', !S.party);
  document.querySelectorAll('#single-box .opt').forEach(b => b.classList.toggle('selected', b.dataset.g === S.contract));
  document.querySelectorAll('#party-box input[data-g]').forEach(c => c.checked = S.partyGames[c.dataset.g]);
  $('total').min = minTotal();
  if (document.activeElement !== $('total')) $('total').value = Math.max(S.total, S.party ? 0 : S.total);
  updatePartyHint();
  $('contract-card').classList.toggle('locked', !canHost());
  $('dice-card').classList.toggle('locked', !canHost());
  $('d-virtual').classList.toggle('selected', S.dice === 'virtual');
  $('d-real').classList.toggle('selected', S.dice === 'real');
  $('n-create').classList.toggle('selected', online() && S.host && !!S.room);
  $('n-join').classList.toggle('selected', online() && !S.host && !!S.room);
}
function renderAll() {
  applyTheme(); renderSlots(); renderContract();
  const btn = $('btn-start');
  btn.disabled = online() && !S.host;
  btn.textContent = btn.disabled ? 'ESPERANDO AL ANFITRIÓN…' : '¡COMENZAR!';
  $('players-card').classList.toggle('locked', false);
}

// ---------- comenzar ----------
function buildConfig() {
  const total = S.humans + S.bots;
  const botCols = botColors();
  const players = [];
  for (let i = 0; i < total; i++) {
    const bot = i >= S.humans;
    players.push({ slot:i, bot, uid:bot ? null : (S.players[i].uid || null), name:bot ? 'Bot ' + (i - S.humans + 1) : S.players[i].name.trim() || 'Capo ' + (i+1),
      color:bot ? botCols[i - S.humans] : S.players[i].color });
  }
  const c = { room:S.room, online:online(), players, market:S.market, events:S.events, dice:S.dice,
    mode:S.party ? 'party' : 'single' };
  if (S.market && !S.party) { c.startingMoney = SINGLE_CONTRACT_START_MONEY; c.marketMoments = MARKET_MOMENTS[S.contract]; }
  if (S.party) Object.assign(c, { games:GAMES.filter(g => S.partyGames[g]), totalContracts:S.total, winsNeeded:winsNeeded() });
  else c.contract = S.contract;
  return c;
}
function startGame() {
  if (online() && !S.host) return;
  say('start-msg', '');
  if (online()) {
    if (!S.room) return say('start-msg', 'Crea una sala primero.');
    for (let i = 0; i < S.humans; i++) if (!S.players[i].uid) return say('start-msg', 'Faltan jugadores por unirse a la sala.');
  }
  if (S.party || !IMPLEMENTED.includes(S.contract)) return say('start-msg', 'Por ahora están disponibles Guerra de Bandas y El Gran Atraco (sin Modo Party). Los demás están en construcción.');
  if (S.party && S.total < minTotal()) return say('start-msg', 'El total de contratos debe ser al menos ' + minTotal() + '.');
  const c = buildConfig();
  if (online() && lobbyRef) lobbyRef.update({ status:'STARTING', config:Object.assign(cfgFromState(), { final:c }) });
  emitStart(c);
}
function emitStart(c) {
  const cfg = c.final || c;
  window.CD_CONFIG = cfg;
  window.dispatchEvent(new CustomEvent('criminaldice:start', { detail:cfg }));
}

// ---------- Manual del Capo (igual que la versión anterior) ----------
function openManualGuide() { $('modal-manual-guide').classList.remove('hidden'); }
function closeManualGuide() { $('modal-manual-guide').classList.add('hidden'); }
function switchManualTab(t) {
  for (let i = 1; i <= 4; i++) {
    $('tab-btn-' + i).classList.toggle('active', t === i);
    $('tab-content-' + i).classList.toggle('hidden', t !== i);
  }
}

// ---------- arranque ----------
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  const r = new URLSearchParams(location.search).get('room');
  if (r) { setMode('online'); showJoin(); $('join-input').value = r.toUpperCase(); joinRoom(); }
});
