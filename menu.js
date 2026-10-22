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
let db = null, auth = null, authPromise = null;
try { firebase.initializeApp(firebaseConfig); db = firebase.database(); auth = firebase.auth(); } catch (e) { console.warn('Firebase no disponible', e); }

// Autenticación anónima: cada pestaña obtiene su propio usuario (persistencia de sesión) y su uid.
function ensureAuth() {
  if (!auth) return Promise.reject({ code:'sin-firebase' });
  if (!authPromise) authPromise = auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => auth.currentUser || auth.signInAnonymously().then(c => c.user))
    .then(u => { uid = u.uid; return u; })
    .catch(e => { authPromise = null; throw e; });
  return authPromise;
}
function netError(e) {
  const c = (e && e.code) || '';
  if (c === 'auth/operation-not-allowed' || c === 'auth/admin-restricted-operation') return 'Activa el acceso "Anónimo" en Firebase → Authentication → Sign-in method.';
  if (/permission[-_]denied/i.test(c) || /permission_denied/i.test(String(e && e.message))) return 'Firebase rechazó la operación: revisa las reglas de la base de datos (deben permitir usuarios autenticados).';
  if (c === 'sin-firebase') return 'No se pudo cargar Firebase (revisa tu conexión).';
  return 'Error de conexión (' + (c || (e && e.message) || 'desconocido') + ').';
}

// Colores = carpetas de assets/characters/. Para agregar uno nuevo: crea su carpeta y añádelo aquí.
const COLORS = { Color_R:'#e74c3c', Color_B:'#3498db', Color_G:'#2ecc71', Color_P:'#ff8fc7', Color_Pu:'#9b59b6', Color_W:'#ecf0f1' };
// Ajustable: dinero inicial del Mercado Negro cuando se juega un único contrato (en Party se usa la economía normal).
const SINGLE_CONTRACT_START_MONEY = 300;
// Momentos de Mercado Negro en un único contrato: antes de empezar (y en El Gran Atraco, también tras la inmersión 1 y la 3).
const MARKET_MOMENTS = { rpg:['inicio'], maf:['inicio'], pok:['inicio'], exp:['inicio','tras_inmersion_1','tras_inmersion_3'] };
const COLOR_KEYS = Object.keys(COLORS);
const GAMES = ['rpg','exp','maf','pok'];
const IMPLEMENTED = ['rpg', 'exp', 'maf', 'pok'];   // contratos ya migrados a 4 jugadores; añade aquí cada uno al terminarlo
const GAME_NAMES = { rpg:'Guerra de Bandas', exp:'El Gran Atraco', maf:'Imperio Criminal', pok:'Apuestas Clandestinas' };
const $ = id => document.getElementById(id);

// Identidad anónima: sin cuentas, solo un id aleatorio por pestaña.
let uid = 'local-' + Math.random().toString(36).slice(2, 10);   // se reemplaza por el uid de Firebase al autenticar

const S = {
  mode:'local', room:null, host:true, humans:1, bots:1,
  players: ['Color_R','Color_B','Color_G','Color_P'].map((c,i) => ({ name:'Capo ' + (i+1), color:c, uid:null })),
  contract:'rpg', party:false, market:false, events:false,
  partyGames:{ rpg:true, exp:true, maf:true, pok:true }, partyWins:4, dice:'virtual'
};
let lobbyRef = null;

// ---------- utilidades ----------
const online = () => S.mode === 'online';
const canHost = () => !online() || S.host;
const partyCount = () => GAMES.filter(g => S.partyGames[g]).length;
const winsNeeded = () => S.partyWins;                // victorias que hay que conseguir para ganar el Modo Party
// Lista de reproducción en "bolsas" barajadas: cada bolsa trae todos los contratos elegidos una vez (sin repetir el último seguido).
// Si las victorias para ganar son MENOS que los contratos elegidos, salen al azar solo algunos; si son IGUAL O MÁS, se juegan todos al menos una vez.
function makePlaylist(games) {
  const out = [];
  while (out.length < 60) {
    const bag = games.slice().sort(() => Math.random() - .5);
    if (out.length && bag.length > 1 && bag[0] === out[out.length - 1]) bag.push(bag.shift());
    out.push(...bag);
  }
  return out;
}
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
async function requireDb() { try { await ensureAuth(); return true; } catch (e) { say('net-msg', netError(e)); return false; } }

async function createRoom() {
  if (!(await requireDb())) return;
  leaveRoom();
  S.room = newCode(); S.host = true;
  S.humans = Math.max(S.humans, 2); S.bots = Math.min(S.bots, 4 - S.humans);   // una sala online necesita al menos un lugar libre para invitados
  S.players[0].uid = uid;
  lobbyRef = db.ref('rooms/' + S.room + '/lobby');
  lobbyRef.set({ status:'LOBBY', hostUid:uid, config:cfgFromState(), players:{ 0:S.players[0] } }).catch(e => { say('net-msg', netError(e)); leaveRoom(); renderAll(); });
  db.ref('rooms/' + S.room).onDisconnect().remove();      // si el anfitrión se desconecta, desaparece toda la sala
  history.replaceState(null, '', '?room=' + S.room);
  $('room-code').textContent = S.room;
  $('create-box').classList.remove('hidden'); $('join-box').classList.add('hidden');
  say('net-msg', ''); listen(); renderAll();
}
function showJoin() { $('join-box').classList.remove('hidden'); $('create-box').classList.add('hidden'); }

async function joinRoom() {
  if (!(await requireDb())) return;
  const code = $('join-input').value.trim().toUpperCase();
  if (code.length < 3) return say('net-msg', 'Ingresa un código válido.');
  const ref = db.ref('rooms/' + code + '/lobby');
  let snap; try { snap = await ref.once('value'); } catch (e) { return say('net-msg', netError(e)); }
  const lobby = snap.val();
  if (!lobby) return say('net-msg', 'Esa sala no existe.');
  if (lobby.status !== 'LOBBY') return say('net-msg', 'La partida ya comenzó.');
  const humans = lobby.config.humans;
  const pl = lobby.players || {};
  let slot = -1;
  for (let i = 0; i < humans; i++) if (!pl[i]) { slot = i; break; }
  if (slot < 0) return say('net-msg', 'La sala está llena (el anfitrión debe subir el número de jugadores).');
  const taken = Object.values(pl).map(p => p.color);
  const mine = { name:'Capo ' + (slot + 1), color:COLOR_KEYS.find(c => !taken.includes(c)), uid };
  let tx; try { tx = await ref.child('players/' + slot).transaction(cur => cur ? undefined : mine); } catch (e) { return say('net-msg', netError(e)); }
  if (!tx.committed) return say('net-msg', 'Otro jugador tomó ese lugar justo ahora. Intenta de nuevo.');
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
        events:c.events, partyWins:c.partyWins, dice:c.dice, partyGames:Object.assign({}, c.partyGames) });
    }
    for (let i = 0; i < 4; i++) {
      const p = (l.players || {})[i];
      S.players[i] = p ? Object.assign({}, p) : { name:'Capo ' + (i+1), color:S.players[i].color, uid:null };
    }
    renderAll();
    if (l.status === 'STARTING' && !S.host && c && c.final) emitStart(l.config);   // espera a tener la configuración final
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
    partyWins:S.partyWins, dice:S.dice, partyGames:Object.assign({}, S.partyGames) };
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
  if (typeof CD !== 'undefined' && CD.running) return;                    // durante la partida el tema lo controla el juego
  const g = S.party ? 'rpg' : S.contract;
  document.body.className = 'theme-' + g;
}
function pickContract(g) { if (!canHost()) return; S.contract = g; renderAll(); pushConfig(); }
function onToggles() {
  if (!canHost()) { renderAll(); return; }
  S.party = $('t-party').checked; S.market = $('t-market').checked; S.events = $('t-events').checked;
  renderAll(); pushConfig();
}
function onPartyGames() {
  if (!canHost()) { renderAll(); return; }
  document.querySelectorAll('#party-box input[data-g]').forEach(c => S.partyGames[c.dataset.g] = c.checked);
  if (partyCount() === 0) { S.partyGames.rpg = true; }   // mínimo un contrato
  renderAll(); pushConfig();
}
function onWins() {
  if (!canHost()) return;
  const v = parseInt($('wins').value, 10);
  if (isNaN(v)) return;
  S.partyWins = Math.min(10, Math.max(1, v)); updatePartyHint(); pushConfig();
}
function updatePartyHint() {
  const n = partyCount(), w = S.partyWins;
  $('party-hint').textContent = 'El primero en ganar ' + w + ' contratos dominará la ciudad. ' +
    (w < n ? 'Saldrán al azar algunos de los ' + n + ' contratos marcados.' : 'Se jugará cada contrato marcado al menos una vez.');
}
function setDice(d) { if (!canHost()) return; S.dice = d; renderAll(); pushConfig(); }

function renderContract() {
  $('t-party').checked = S.party; $('t-market').checked = S.market; $('t-events').checked = S.events;
  $('single-box').classList.toggle('hidden', S.party);
  $('party-box').classList.toggle('hidden', !S.party);
  document.querySelectorAll('#single-box .opt').forEach(b => b.classList.toggle('selected', b.dataset.g === S.contract));
  document.querySelectorAll('#party-box input[data-g]').forEach(c => c.checked = S.partyGames[c.dataset.g]);
  $('wins').min = 1;
  if (document.activeElement !== $('wins')) $('wins').value = S.partyWins;
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
  if (S.party) { const games = GAMES.filter(g => S.partyGames[g]); Object.assign(c, { games, winsNeeded:winsNeeded(), playlist:makePlaylist(games) }); }
  else c.contract = S.contract;
  return c;
}
function startGame() {
  if (online() && !S.host) return;
  say('start-msg', '');
  const need = { CD:typeof CD, RPG:typeof RPG, EXP:typeof EXP, MAF:typeof MAF, POK:typeof POK, AI:typeof AI, playSound:typeof playSound };   // detecta archivos que no cargaron
  const missing = Object.keys(need).filter(k => need[k] === 'undefined');
  if (missing.length) return say('start-msg', 'No cargaron estos módulos: ' + missing.join(', ') + '. Revisa que js/ tenga todos los archivos y que ninguno tenga marcas de conflicto de Git.');
  if (online()) {
    if (!S.room) return say('start-msg', 'Crea una sala primero.');
    for (let i = 0; i < S.humans; i++) if (!S.players[i].uid) return say('start-msg', 'Faltan jugadores por unirse a la sala.');
  }
  if (!S.party && !IMPLEMENTED.includes(S.contract)) return say('start-msg', 'Ese contrato todavía está en construcción.');
  if (S.party && GAMES.some(g => S.partyGames[g] && !IMPLEMENTED.includes(g))) return say('start-msg', 'Alguno de los contratos elegidos todavía está en construcción.');
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
  if (auth) ensureAuth().catch(() => {});   // autentica en segundo plano
  const r = new URLSearchParams(location.search).get('room');
  if (r) { setMode('online'); showJoin(); $('join-input').value = r.toUpperCase(); joinRoom(); }
});
