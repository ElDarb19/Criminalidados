// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCEY_P4mC8xArf88rRBYyI-JZ_M74o6FuE",
  authDomain: "criminalidados-243e6.firebaseapp.com",
  databaseURL: "https://criminalidados-243e6-default-rtdb.firebaseio.com",
  projectId: "criminalidados-243e6",
  storageBucket: "criminalidados-243e6.firebasestorage.app",
  messagingSenderId: "375013954181",
  appId: "1:375013954181:web:1d1a5d6ce1990454c04fec"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// CATÁLOGO INFRAESTRUCTURA MERCADO NEGRO (FASE 1, 2, 3)
// ==========================================
const MARKET_CATALOG = [
  // CONTACTOS (PASIVAS - 17 TOTAL)
  { id: 'contact_armero', name: 'Armero Clandestino', icon: '🔫', cost: 150, desc: '+2 a tiradas d20 (máximo 20).', type: 'contact', incompatible: [] },
  { id: 'contact_tahur', name: 'El Cobrador de la Mesa', icon: '🃏', cost: 120, desc: 'Si sacas 1 en d6, ganas +50💲 para tu dinero del Mercado Negro.', type: 'contact', incompatible: [] },
  { id: 'contact_crupier', name: 'Crupier de Esquina', icon: '🎰', cost: 220, desc: 'Un resultado par de d6 recibe +1, sin superar 6.', type: 'contact', incompatible: [] },
  { id: 'contact_tallador', name: 'Tallador de Dados', icon: '🎲', cost: 320, desc: 'En RPG, Atraco y Apuestas, transforma un 1 en d6 en un valor seguro. No funciona en Imperio Criminal.', type: 'contact', incompatible: ['maf'] },
  { id: 'contact_matematico', name: 'Matemático del Sindicato', icon: '🧮', cost: 240, desc: 'Sacar el máximo en cualquier dado otorga +100💲.', type: 'contact', incompatible: [] },
  { id: 'contact_matasanos', name: 'Médico Matasanos', icon: '🩺', cost: 200, desc: '+50% a toda curación recibida.', type: 'contact', incompatible: ['maf', 'pok'] },
  { id: 'contact_desguace', name: 'Dueño del Desguace', icon: '🏭', cost: 140, desc: 'Vender artículos te devuelve el 75% de su valor.', type: 'contact', incompatible: [] },
  { id: 'contact_policia', name: 'Protección Policial', icon: '🚓', cost: 250, desc: '80% de probabilidad de bloquear una Redada o un Infiltrar Soplón.', type: 'contact', incompatible: ['exp', 'pok'] },
  { id: 'contact_dinamita', name: 'Tramposo de la Casa', icon: '🧨', cost: 350, desc: 'En Saquear Cajas, un fallo propio recibe +1 daño. En Apuesta Básica, un fallo propio hace que el rival pierda 2 fichas.', type: 'contact', incompatible: ['rpg', 'maf'] },
  { id: 'contact_contador', name: 'Contador de la Mafia', icon: '📊', cost: 500, desc: 'Multiplica x1.5 la recompensa final si conservas HP > 50%.', type: 'contact', incompatible: ['maf', 'pok'] },
  { id: 'contact_usurero', name: 'Inversionista Usurero', icon: '📈', cost: 250, desc: 'Al salir de la tienda, +10% de interés sobre tu dinero (Max 200).', type: 'contact', incompatible: [] },
  { id: 'contact_prestamista', name: 'Prestamista Siniestro', icon: '🩸', cost: 300, desc: '+150💲 al inicio de minijuego, pero -4 HP/COB máxima.', type: 'contact', incompatible: ['maf', 'pok'] },
  { id: 'contact_extorsionador', name: 'Extorsionador de Barrio', icon: '💼', cost: 130, desc: 'Ganas +10💲 por cada turno finalizado sin recibir daño.', type: 'contact', incompatible: [] },
  { id: 'contact_maton', name: 'Matón a Sueldo', icon: '🥊', cost: 160, desc: 'En Lanzar Granada y Trampa de Tahúr, el primer d4/uso recibe +2 al resultado.', type: 'contact', incompatible: ['rpg', 'maf'] },
  { id: 'contact_chofer', name: 'Chófer de Huida', icon: '🚗', cost: 210, desc: 'Si tu HP/COB está por debajo del 25%, recibes -2 daño.', type: 'contact', incompatible: ['maf', 'pok'] },
  { id: 'contact_quimico', name: 'Químico Corruptor', icon: '🧪', cost: 310, desc: 'En RPG, un crítico envenena 3 rondas. En Imperio, un d20 final de 20 en Sobornar Político permite una Redada extra si el rival tiene menos de 3 activas.', type: 'contact', incompatible: ['exp', 'pok'] },
  { id: 'contact_arquitecto', name: 'Red de Protección', icon: '🏛️', cost: 340, desc: '+10% a ingresos y curaciones. Bloquea la primera Redada o Infiltrar Soplón que recibas.', type: 'contact', incompatible: ['exp', 'pok'] },

  // CONSUMIBLES
  { id: 'item_puro', name: 'Puro del Capo', icon: '🚬', cost: 80, desc: 'Repite la última tirada de dado.', type: 'consumable', incompatible: [] },
  { id: 'item_whisky', name: 'Whisky Clandestino', icon: '🥃', cost: 100, desc: 'Duplica el daño/botín, pero resta 2 HP/Cobertura.', type: 'consumable', incompatible: ['maf', 'pok'] },
  { id: 'item_soborno', name: 'Soborno Relámpago', icon: '🤝', cost: 150, desc: 'Fuerza un 6 en tu próximo d6.', type: 'consumable', incompatible: [] },
  { id: 'item_adrenalina', name: 'Inyección Adrenalina', icon: '💉', cost: 90, desc: 'Cura +4 HP/Cobertura al instante.', type: 'consumable', incompatible: ['maf', 'pok'] },
  { id: 'item_falsa_alarma', name: 'Llamada Falsa Alarma', icon: '📞', cost: 120, desc: 'Cancela los efectos o estados negativos del turno rival previo.', type: 'consumable', incompatible: [] }
];

// ==========================================
// LÓGICA MODO DE JUEGO (LOCAL / SOLO VS IA / ONLINE) Y RED
// ==========================================
let gameMode = 'local';
let roomId = null;
let isHost = true;
let roomPath = null;

let netRollIndex = 0;
let currentGameStatus = 'SETUP';
let networkStateReady = false;
let networkActionChain = Promise.resolve();
let networkLastActionId = null;
let lastAppliedActionId = null;
let networkInitInProgress = false;

function resetRollSync() {
  netRollIndex = 0;
  party.lastRollResult = null;
  if (isHost && gameMode === 'online' && roomPath) {
    const matchKey = `m${party.matchesPlayed || 0}`;
    db.ref(roomPath + '/rolls/' + matchKey).remove();
    db.ref(roomPath + '/guestManualRolls/' + matchKey).remove();
  }
}

function setGameMode(mode) {
  gameMode = mode;
  document.getElementById('m-local').classList.toggle('selected', mode === 'local');
  document.getElementById('m-solo').classList.toggle('selected', mode === 'solo');
  document.getElementById('m-online').classList.toggle('selected', mode === 'online');
  document.getElementById('network-panel').classList.toggle('hidden', mode !== 'online');

  // Limpieza de campos de texto bloqueados por el modo Solo vs IA
  const p2Input = document.getElementById('p2-name-input');
  if (p2Input && p2Input.value === "La Sombra (IA)") {
    p2Input.value = "";
  }

  if (mode === 'local') {
    unlockAllSetupInputs();
  } else if (mode === 'solo') {
    unlockSoloSetupInputs();
  } else if (mode === 'online') {
    enableInput('p1-name-input');
    enableInput('p1-color-input');
    enableInput('p2-name-input');
    enableInput('p2-color-input');
    enableSetupSection('setup-card-game');
    enableSetupSection('setup-card-dice');
    applyOnlinePermissions();
  }
}

function createOnlineRoom() {
  gameMode = 'online';
  isHost = true;
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  roomPath = 'rooms/' + roomId;
  window.history.replaceState(null, '', '?room=' + roomId);
  
  document.getElementById('room-id-display').innerText = roomId;
  document.getElementById('join-room-box').classList.add('hidden');
  document.getElementById('online-info-box').classList.remove('hidden');
  
  applyOnlinePermissions();
  initOnlineListeners();
  syncHostSetupToFirebase();
}

function showJoinRoomInput() {
  document.getElementById('join-room-box').classList.remove('hidden');
  document.getElementById('online-info-box').classList.add('hidden');
}

function joinOnlineRoom() {
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  if (!code || code.length < 3) {
    alert("Por favor ingresa un código de sala válido.");
    return;
  }
  gameMode = 'online';
  isHost = false;
  roomId = code;
  roomPath = 'rooms/' + roomId;
  window.history.replaceState(null, '', '?room=' + roomId);
  
  document.getElementById('room-id-display').innerText = roomId;
  document.getElementById('join-room-box').classList.add('hidden');
  document.getElementById('online-info-box').classList.remove('hidden');
  
  applyOnlinePermissions();
  initOnlineListeners();
  syncGuestSetupToFirebase();
}

function applyOnlinePermissions() {
  if (gameMode !== 'online') return;

  if (isHost) {
    enableInput('p1-name-input');
    enableInput('p1-color-input');
    disableInput('p2-name-input');
    disableInput('p2-color-input');
    enableSetupSection('setup-card-game');
    enableSetupSection('setup-card-dice');

    const btnStart = document.getElementById('btn-start-game');
    btnStart.style.pointerEvents = 'auto';
    btnStart.style.opacity = '1';
    btnStart.innerText = "¡COMENZAR!";
  } else {
    disableInput('p1-name-input');
    disableInput('p1-color-input');
    enableInput('p2-name-input');
    enableInput('p2-color-input');
    disableSetupSection('setup-card-game');
    disableSetupSection('setup-card-dice');

    const btnStart = document.getElementById('btn-start-game');
    btnStart.style.pointerEvents = 'none';
    btnStart.style.opacity = '0.5';
    btnStart.innerText = "ESPERANDO AL HOST...";
  }
}

function enableInput(id) {
  const el = document.getElementById(id);
  if (el) { el.disabled = false; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
}

function disableInput(id) {
  const el = document.getElementById(id);
  if (el) { el.disabled = true; el.style.opacity = '0.5'; el.style.pointerEvents = 'none'; }
}

function enableSetupSection(id) {
  const sec = document.getElementById(id);
  if (sec) { sec.style.pointerEvents = 'auto'; sec.style.opacity = '1'; }
}

function disableSetupSection(id) {
  const sec = document.getElementById(id);
  if (sec) { sec.style.pointerEvents = 'none'; sec.style.opacity = '0.7'; }
}

function unlockAllSetupInputs() {
  enableInput('p1-name-input');
  enableInput('p1-color-input');
  enableInput('p2-name-input');
  enableInput('p2-color-input');
  document.getElementById('p2-name-input').value = "";
  updateMenuPreviews();
  enableSetupSection('setup-card-game');
  enableSetupSection('setup-card-dice');

  const btnStart = document.getElementById('btn-start-game');
  btnStart.style.pointerEvents = 'auto';
  btnStart.style.opacity = '1';
  btnStart.innerText = "¡COMENZAR!";
}

function unlockSoloSetupInputs() {
  enableInput('p1-name-input');
  enableInput('p1-color-input');
  disableInput('p2-name-input');
  disableInput('p2-color-input');
  document.getElementById('p2-name-input').value = "La Sombra (IA)";
  updateMenuPreviews();
  enableSetupSection('setup-card-game');
  enableSetupSection('setup-card-dice');

  const btnStart = document.getElementById('btn-start-game');
  btnStart.style.pointerEvents = 'auto';
  btnStart.style.opacity = '1';
  btnStart.innerText = "¡COMENZAR!";
}

function onPlayerSetupInput() {
  if (gameMode !== 'online' || !roomPath) return;
  if (isHost) syncHostSetupToFirebase();
  else syncGuestSetupToFirebase();
}

function syncHostSetupToFirebase() {
  if (gameMode !== 'online' || !roomPath || !isHost) return;
  db.ref(roomPath + '/setup/p1').set({
    name: document.getElementById('p1-name-input').value.trim() || "Capo Alpha",
    color: document.getElementById('p1-color-input').value || 'Color_R'
  });
  db.ref(roomPath + '/setup/game').set({
    isParty: document.getElementById('party-mode-check').checked,
    isRoguelike: document.getElementById('roguelike-mode-check') ? document.getElementById('roguelike-mode-check').checked : true,
    singleGameChoice: party.singleGameChoice,
    totalMatches: parseInt(document.getElementById('total-matches').value, 10) || 3,
    diceMode: party.diceMode,
    partyRpg: document.getElementById('party-cb-rpg').checked,
    partyExp: document.getElementById('party-cb-exp').checked,
    partyMaf: document.getElementById('party-cb-maf').checked,
    partyPok: document.getElementById('party-cb-pok').checked
  });
}

function syncGuestSetupToFirebase() {
  if (gameMode !== 'online' || !roomPath || isHost) return;
  db.ref(roomPath + '/setup/p2').set({
    name: document.getElementById('p2-name-input').value.trim() || "Capo Bravo",
    color: document.getElementById('p2-color-input').value || 'Color_B'
  });
}

function initOnlineListeners() {
  if (!roomPath) return;

  db.ref(roomPath + '/rolls').off();
  db.ref(roomPath + '/guestManualRolls').off();
  db.ref(roomPath + '/actions').off();
  db.ref(roomPath + '/gameStatus').off();
  db.ref(roomPath + '/p2_joined').off();
  db.ref(roomPath + '/setup').off();
  db.ref(roomPath + '/state').off();

  networkStateReady = false;
  networkActionChain = Promise.resolve();
  networkLastActionId = null;
  lastAppliedActionId = null;

  // El invitado puede enviar tiradas manuales. La ruta correcta es:
  // guestManualRolls/mX/indice -> rolls/mX/indice
  if (isHost) {
    db.ref(roomPath + '/guestManualRolls').on('child_added', (matchSnap) => {
      const matchKey = matchSnap.key;
      matchSnap.ref.on('child_added', (rollSnap) => {
        const rollIdx = rollSnap.key;
        const val = rollSnap.val();
        db.ref(roomPath + `/rolls/${matchKey}/${rollIdx}`).set(val);
      });
    });
  }

  // Estado persistente: también lo lee el Host para poder recuperarse de un refresh.
  const stateRef = db.ref(roomPath + '/state');
  const handleStateSnapshot = (snap) => {
    if (!snap.exists()) return;
    const data = snap.val();
    party.latestNetworkState = data;
    networkStateReady = true;

    if (isHost || currentGameStatus !== 'PLAYING') return;

    // Durante la inicialización ambos clientes consumen la misma secuencia
    // de tiradas. El estado del Host puede llegar a mitad de esa secuencia;
    // aplicarlo en ese momento sobrescribiría la partida local de P2.
    if (networkInitInProgress) return;

    // Un estado posterior a una acción NO debe aplicarse antes de que el
    // evento de esa acción llegue por /actions. De lo contrario P2 puede
    // aplicar el resultado y luego saltarse la acción (o ejecutarla dos veces).
    const incomingActionId = data.networkMeta?.lastActionId || null;
    if (incomingActionId && incomingActionId !== lastAppliedActionId) return;

    if (!party.actionInProgress) applyNetworkState();
  };
  stateRef.on('value', handleStateSnapshot);

  // Cola única de acciones. Se conecta DESPUÉS de leer el snapshot inicial,
  // para que un refresh nunca vuelva a ejecutar acciones ya aplicadas.
  const attachNetworkActionListener = () => {
    db.ref(roomPath + '/actions').on('child_added', (snap) => {
      networkActionChain = networkActionChain.then(async () => {
        const data = snap.val();
        if (!data || !window[data.func]) return;

        if (networkStateReady && networkLastActionId && snap.key <= networkLastActionId) return;
        if (snap.key === lastAppliedActionId) return;

        lastAppliedActionId = snap.key;
        networkLastActionId = snap.key;
        party.isWaiting = false;
        party.actionInProgress = true;

        try {
          await Promise.resolve(window[data.func].apply(null, data.args || []));
        } catch (e) {
          console.error('Error ejecutando acción de red:', data.func, e);
          party.isWaiting = false;
        } finally {
          party.actionInProgress = false;
          if (isHost) syncStateToNetwork(snap.key);
        }
      });
    });
  };

  stateRef.once('value').then((snap) => {
    if (snap.exists()) {
      const data = snap.val();
      party.latestNetworkState = data;
      networkLastActionId = data.networkMeta?.lastActionId || null;
    }
    networkStateReady = true;
    attachNetworkActionListener();
  });

  db.ref(roomPath + '/gameStatus').on('value', (snap) => {
    const data = snap.val();
    if (!data) return;
    if (data.status === 'PLAYING' && currentGameStatus !== 'PLAYING') {
      currentGameStatus = 'PLAYING';
      window.networkStartGame(data.party);
    } else if (data.status === 'SETUP' && currentGameStatus !== 'SETUP') {
      currentGameStatus = 'SETUP';
      window.networkReturnToMenu();
    }
  });

  db.ref(roomPath + '/currentEvent').on('value', snap => {
    if (snap.exists()) {
      const val = snap.val();
      if (typeof val === 'object' && val !== null) {
        party.carniceroBoss = val.boss;
        applyCityEvent(val.code);
      } else {
        applyCityEvent(val);
      }
    }
  });

  db.ref(roomPath + '/setup/p1').on('value', snap => {
    const val = snap.val();
    if (val && !isHost) {
      document.getElementById('p1-name-input').value = val.name;
      document.getElementById('p1-color-input').value = val.color;
      updateMenuPreviews();
    }
  });

  db.ref(roomPath + '/setup/p2').on('value', snap => {
    const val = snap.val();
    if (val && isHost) {
      document.getElementById('p2-name-input').value = val.name;
      document.getElementById('p2-color-input').value = val.color;
      updateMenuPreviews();
    }
  });

  db.ref(roomPath + '/setup/game').on('value', snap => {
    const val = snap.val();
    if (val && !isHost) {
      document.getElementById('party-mode-check').checked = val.isParty;
      if (document.getElementById('roguelike-mode-check')) {
        document.getElementById('roguelike-mode-check').checked = val.isRoguelike !== false;
      }
      party.isRoguelike = val.isRoguelike !== false;
      party.singleGameChoice = val.singleGameChoice;
      selectSingleGame(val.singleGameChoice);
      document.getElementById('total-matches').value = val.totalMatches;
      party.diceMode = val.diceMode;
      setDice(val.diceMode);
      document.getElementById('party-cb-rpg').checked = val.partyRpg;
      document.getElementById('party-cb-exp').checked = val.partyExp;
      document.getElementById('party-cb-maf').checked = val.partyMaf;
      document.getElementById('party-cb-pok').checked = val.partyPok;
      togglePartySettings();
    }
  });

  if (!isHost) {
    db.ref(roomPath + '/p2_joined').set(true);
    db.ref(roomPath + '/p2_joined').onDisconnect().remove();
    const setupStatus = document.getElementById('network-status');
    setupStatus.innerText = "Conectado como Rival (P2). Elige tu nombre y traje mientras el Host inicia...";
    setupStatus.style.color = "var(--accent-green)";
  } else {
    db.ref(roomPath + '/p2_joined').on('value', snap => {
      const statusEl = document.getElementById('network-status');
      if (statusEl) {
        if (snap.val()) {
          statusEl.innerText = "¡Rival conectado! Listo para comenzar.";
          statusEl.style.color = "var(--accent-green)";
        } else {
          statusEl.innerText = "Esperando a que el rival se conecte...";
          statusEl.style.color = "var(--accent-gold)";
        }
      }
    });
  }
}

function isMyTurnNetwork() {
  if (gameMode === 'local') return true; 
  if (gameMode === 'solo') {
    let turn = 1;
    if (party.currentGame === 'rpg') turn = rpg.turn;
    else if (party.currentGame === 'exp') turn = exp.turn;
    else if (party.currentGame === 'maf') turn = maf.turn;
    else if (party.currentGame === 'pok') turn = pok.turn;
    return turn === 1; 
  }
  if (party.currentGame === 'rpg') return isHost ? (rpg.turn === 1) : (rpg.turn === 2);
  if (party.currentGame === 'exp') return isHost ? (exp.turn === 1) : (exp.turn === 2);
  if (party.currentGame === 'maf') return isHost ? (maf.turn === 1) : (maf.turn === 2);
  if (party.currentGame === 'pok') return isHost ? (pok.turn === 1) : (pok.turn === 2);
  return isHost;
}

// Probabilidades locales/online reproducibles para efectos pasivos.
// En online evitamos Math.random() independiente en cada cliente, que podría
// producir resultados distintos. El resultado sigue siendo 80/20 por estado.
function deterministicChance(percent, label = '') {
  if (gameMode !== 'online') return Math.random() * 100 < percent;
  const game = party.currentGame || '';
  let round = 0, turn = 0;
  if (game === 'rpg') { round = rpg.round; turn = rpg.turn; }
  else if (game === 'exp') { round = exp.round; turn = exp.turn; }
  else if (game === 'maf') { round = maf.round; turn = maf.turn; }
  else if (game === 'pok') { round = pok.round; turn = pok.turn; }
  const seed = `${party.matchesPlayed || 0}|${game}|${round}|${turn}|${label}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash >>> 0) % 100) < percent;
}

function dispatchAction(funcName, ...args) {
  if (gameMode === 'local' || gameMode === 'solo') {
    if (window[funcName]) window[funcName].apply(null, args);
    return;
  }
  if (funcName === 'hostStartCoreGame' && !isHost) return;

  const hostOnlyActions = ['networkNextGame', 'networkReturnToMenu', 'networkNextDive', 'openBlackMarket'];
  const marketActions = ['buyMarketItem', 'sellMarketItem', 'rerollMarket', 'syncMarketStock'];

  if (hostOnlyActions.includes(funcName)) {
    if (!isHost) return;
  } else if (marketActions.includes(funcName)) {
    // El mercado no depende del turno del minijuego.
  } else if (funcName !== 'onStartButtonClick') {
    if (!isMyTurnNetwork()) return;
  }

  party.isWaiting = true;
  const actionRef = db.ref(roomPath + '/actions').push();
  actionRef.set({
    func: funcName,
    args: args,
    ts: firebase.database.ServerValue.TIMESTAMP
  });
}

async function getNetworkRoll(sides, forcedVal = null) {
  if (gameMode === 'local' || gameMode === 'solo') {
    const val = forcedVal !== null ? forcedVal : (Math.floor(Math.random() * sides) + 1);
    return val;
  }

  const rollIdx = netRollIndex++;
  const matchKey = `m${party.matchesPlayed || 0}`;
  const rollRef = db.ref(roomPath + `/rolls/${matchKey}/${rollIdx}`);

  if (isHost) {
    // Si el Host se recarga después de haber generado el dado pero antes
    // de terminar la acción, reutiliza el valor existente.
    const existing = await rollRef.once('value');
    let valToSet = existing.exists() ? existing.val() : (forcedVal !== null ? forcedVal : (Math.floor(Math.random() * sides) + 1));
    await rollRef.set(valToSet);
    party.lastRollResult = { matchKey, rollIdx, sides, value: valToSet };
    return valToSet;
  }

  // El invitado nunca inventa un resultado. Si es tirada manual,
  // envía su valor al Host por la ruta anidada correcta.
  if (forcedVal !== null) {
    await db.ref(roomPath + `/guestManualRolls/${matchKey}/${rollIdx}`).set(forcedVal);
  }

  const snap = await rollRef.once('value');
  if (snap.exists() && snap.val() !== null) {
    const val = snap.val();
    party.lastRollResult = { matchKey, rollIdx, sides, value: val };
    return val;
  }

  return await new Promise((resolve) => {
    const handler = (rollSnap) => {
      if (rollSnap.exists() && rollSnap.val() !== null) {
        rollRef.off('value', handler);
        const val = rollSnap.val();
        party.lastRollResult = { matchKey, rollIdx, sides, value: val };
        resolve(val);
      }
    };
    rollRef.on('value', handler);
  });
}

window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  let urlRoom = urlParams.get('room');

  if (urlRoom) {
    setGameMode('online');
    document.getElementById('room-code-input').value = urlRoom.toUpperCase();
    joinOnlineRoom();
  }
};

window.copyInviteLink = function() {
  navigator.clipboard.writeText(window.location.href).then(() => {
      alert("¡Enlace copiado! Envíalo a tu rival.");
  });
};

// ==========================================
// VARIABLES GLOBALES Y DECK-BUILDING STATE
// ==========================================
let party = {
  p1Name: '', p2Name: '', p1Color: 'Color_R', p2Color: 'Color_B', diceMode: 'virtual',
  isParty: false, isRoguelike: true, singleGameChoice: 'rpg',
  totalMatches: 3, matchesPlayed: 0, p1Wins: 0, p2Wins: 0,
  playlist: [], currentGame: null, abortController: null, isWaiting: false,
  p1Coins: 100, p2Coins: 100, 
  p1Contacts: [], p2Contacts: [], // FASE 2: Max 3 slots de contactos pasivos
  p1Consumable: null, p2Consumable: null, // FASE 3: 1 Slot de consumible
  p1Combo: 1.0, p2Combo: 1.0, // FASE 4: Combos
  cityEvent: null, // FASE 5: Modificadores globales
  p1MarketStock: [], p2MarketStock: [],
  p1RerollCost: 50, p2RerollCost: 50,
  lastRollData: null,
  actionInProgress: false,
  latestNetworkState: null
};
const gameTitles = {
  rpg: 'GUERRA DE BANDAS',
  exp: 'EL GRAN ATRACO',
  maf: 'IMPERIO CRIMINAL',
  pok: 'APUESTAS CLANDESTINAS'
};

let rpg = { p1: { hp:0, max:0, poison:0, heals:0, blocked:false }, p2: { hp:0, max:0, poison:0, heals:0, blocked:false }, turn: 1, round: 1 };
let exp = { p1: { hp:20, max:20, secured:0, temp:0, repairUses:0, repairCooldown:0, torpedoUses:0, surfaced:false }, p2: { hp:20, max:20, secured:0, temp:0, repairUses:0, repairCooldown:0, torpedoUses:0, surfaced:false }, turn: 1, round: 1, dive: 1, maxDives: 3 };
let maf = { p1: { prestige: 0, coins: 0, parcels: [], sabotages: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0} }, p2: { prestige: 0, coins: 0, parcels: [], sabotages: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0} }, turn: 1, round: 1, phase: 'roll', winScore: 15 };
let pok = { p1: { tokens: 12, tahurCD: 0, tahurUsos: 0 }, p2: { tokens: 12, tahurCD: 0, tahurUsos: 0 }, turn: 1, round: 1, maxRounds: 8 };

// ==========================================
// MOTOR DE SONIDO (WEB AUDIO API + MP3)
// ==========================================
let audioCtx = null;
const mp3Buffers = {};

const mp3Sources = {
  'tommy': { url: 'assets/audios/tommygun.mp3', duration: 0.44 },
  'sniper_reload': { url: 'assets/audios/sniperreload.mp3', duration: 0.22 },
  'sniper_shot': { url: 'assets/audios/snipershoot.mp3', duration: 0.50 },
  'fuse': { url: 'assets/audios/tnttss.mp3', duration: 0.65 },
  'dynamite': { url: 'assets/audios/tntboom.mp3', duration: 0.70 },
  'heartbeat': { url: 'assets/audios/heartbeat.mp3', duration: 1.10 }
};

const mp3FetchPromises = {};
for (const key in mp3Sources) {
  mp3FetchPromises[key] = fetch(mp3Sources[key].url)
    .then(response => response.arrayBuffer())
    .catch(e => console.error("Error al cargar MP3:", key, e));
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    for (const key in mp3FetchPromises) {
      mp3FetchPromises[key].then(arrayBuffer => {
        if (arrayBuffer) {
          const bufferCopy = arrayBuffer.slice(0);
          audioCtx.decodeAudioData(bufferCopy, decodedData => {
            mp3Buffers[key] = decodedData;
          });
        }
      });
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (mp3Buffers[type]) {
      const source = ctx.createBufferSource();
      source.buffer = mp3Buffers[type];
      
      const gainNode = ctx.createGain();
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const targetDuration = mp3Sources[type].duration;
      
      gainNode.gain.setValueAtTime(1, now);
      gainNode.gain.setValueAtTime(1, Math.max(now, now + targetDuration - 0.05));
      gainNode.gain.linearRampToValueAtTime(0, now + targetDuration);

      source.start(now);
      source.stop(now + targetDuration);
      return;
    }

    if (type === 'tommy') {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(75 + Math.random() * 25, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.05);
          } catch(e){}
        }, i * 65);
      }
    } else if (type === 'sniper_reload') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.start(now); osc1.stop(now + 0.08);

      setTimeout(() => {
        try {
          const now2 = ctx.currentTime;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(600, now2);
          osc2.frequency.exponentialRampToValueAtTime(1400, now2 + 0.07);
          gain2.gain.setValueAtTime(0.25, now2);
          gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.07);
          osc2.connect(gain2); gain2.connect(ctx.destination);
          osc2.start(now2); osc2.stop(now2 + 0.07);
        } catch(e){}
      }, 150);
    } else if (type === 'sniper_shot') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.45);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.45);

      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(100, now);
      sub.frequency.exponentialRampToValueAtTime(15, now + 0.5);
      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      sub.connect(subGain); subGain.connect(ctx.destination);
      sub.start(now); sub.stop(now + 0.5);
    } else if (type === 'fuse') {
      const bufferSize = ctx.sampleRate * 0.65;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3500, now);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      noise.connect(filter); filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'dynamite') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(12, now + 0.7);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.7);

      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter); filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'diceLanding') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'crit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.35);
    } else if (type === 'heal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'win') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(783.99, now + 0.24);
      osc.frequency.setValueAtTime(1046.50, now + 0.36);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.6);
    }
  } catch(e) {}
}

// ==========================================
// SISTEMA DE GAME FEEL (HITSTOP & HEARTBEAT)
// ==========================================
let heartbeatSource = null;
let heartbeatGain = null;

async function triggerHitstop(duration = 140) {
  const screen = document.getElementById('game-screen');
  if (screen) screen.classList.add('hitstop-active');
  await new Promise(resolve => setTimeout(resolve, duration));
  if (screen) screen.classList.remove('hitstop-active');
}

function startHeartbeat() {
  const ctx = getAudioContext();
  if (heartbeatSource) return;
  if (mp3Buffers['heartbeat']) {
    heartbeatSource = ctx.createBufferSource();
    heartbeatSource.buffer = mp3Buffers['heartbeat'];
    heartbeatSource.loop = true;
    heartbeatGain = ctx.createGain();
    heartbeatGain.gain.setValueAtTime(0.65, ctx.currentTime);
    heartbeatSource.connect(heartbeatGain);
    heartbeatGain.connect(ctx.destination);
    heartbeatSource.start();
  }
}

function stopHeartbeat() {
  if (heartbeatSource) {
    try {
      heartbeatSource.stop();
      heartbeatSource.disconnect();
    } catch(e) {}
    heartbeatSource = null;
    heartbeatGain = null;
  }
}

function updateHeartbeat() {
  if (party.isWaiting || !party.currentGame) {
    stopHeartbeat();
    return;
  }

  let isCritical = false;

  if (party.currentGame === 'rpg') {
    const activeP = rpg.turn === 1 ? rpg.p1 : rpg.p2;
    if (activeP.max > 0 && (activeP.hp / activeP.max) <= 0.10 && activeP.hp > 0) {
      isCritical = true;
    }
  } else if (party.currentGame === 'exp') {
    const activeP = exp.turn === 1 ? exp.p1 : exp.p2;
    if (!activeP.surfaced && activeP.max > 0 && (activeP.hp / activeP.max) <= 0.10 && activeP.hp > 0) {
      isCritical = true;
    }
  } else if (party.currentGame === 'pok') {
    const activeP = pok.turn === 1 ? pok.p1 : pok.p2;
    if (activeP.tokens <= 1 && activeP.tokens > 0) {
      isCritical = true;
    }
  }

  if (isCritical) {
    startHeartbeat();
  } else {
    stopHeartbeat();
  }
}

function triggerVibrate(pattern) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

function triggerScreenShake() {
  const screen = document.getElementById('game-screen');
  if (!screen) return;
  screen.classList.remove('screen-shake');
  void screen.offsetWidth;
  screen.classList.add('screen-shake');
  setTimeout(() => screen.classList.remove('screen-shake'), 300);
}

function spawnFloatingText(containerId, text, type = 'dmg') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const el = document.createElement('div');
  el.className = `floating-text ${type}`;
  el.innerText = text;

  container.appendChild(el);
  setTimeout(() => el.remove(), type === 'crit' ? 1200 : 850);
}

function showMinigameSplash(title) {
  return new Promise((resolve) => {
    const splash = document.getElementById('modal-splash');
    document.getElementById('splash-title').innerText = title;
    splash.classList.remove('hidden');
    playSound('win');
    setTimeout(() => {
      splash.classList.add('hidden');
      resolve();
    }, 1400);
  });
}

function selectSingleGame(game) {
  party.singleGameChoice = game;
  document.getElementById('opt-single-rpg').classList.toggle('selected', game === 'rpg');
  document.getElementById('opt-single-exp').classList.toggle('selected', game === 'exp');
  document.getElementById('opt-single-maf').classList.toggle('selected', game === 'maf');
  document.getElementById('opt-single-pok').classList.toggle('selected', game === 'pok');
  document.body.className = `theme-${game}`;
  syncHostSetupToFirebase();
}

function togglePartySettings() {
  party.isParty = document.getElementById('party-mode-check').checked;
  document.getElementById('party-settings').classList.toggle('hidden', !party.isParty);
  document.getElementById('single-game-settings').classList.toggle('hidden', party.isParty);
  if(party.isParty) validateCheckboxes();
}

function updatePartyText() {
  const totalInput = document.getElementById('total-matches');
  const cbRpg = document.getElementById('party-cb-rpg');
  const cbExp = document.getElementById('party-cb-exp');
  const cbMaf = document.getElementById('party-cb-maf');
  const cbPok = document.getElementById('party-cb-pok');
  
  let selectedCount = 0;
  if (cbRpg && cbRpg.checked) selectedCount++;
  if (cbExp && cbExp.checked) selectedCount++;
  if (cbMaf && cbMaf.checked) selectedCount++;
  if (cbPok && cbPok.checked) selectedCount++;

  let minMatches = selectedCount;
  if (selectedCount % 2 === 0 && selectedCount > 0) {
    minMatches = selectedCount + 1; 
  }

  if (selectedCount > 0 && totalInput) {
    totalInput.min = minMatches;
    if (parseInt(totalInput.value, 10) < minMatches) {
      totalInput.value = minMatches;
    }
  }

  const num = parseInt(totalInput.value, 10) || minMatches || 3;
  const winsNeeded = Math.floor(num / 2) + 1;
  document.getElementById('party-desc-text').innerText = `El primero en ganar ${winsNeeded} victorias dominará la ciudad.`;
}

function validateCheckboxes() {
  const cbRpg = document.getElementById('party-cb-rpg');
  const cbExp = document.getElementById('party-cb-exp');
  const cbMaf = document.getElementById('party-cb-maf');
  const cbPok = document.getElementById('party-cb-pok');
  
  let selectedCount = 0;
  if (cbRpg.checked) selectedCount++;
  if (cbExp.checked) selectedCount++;
  if (cbMaf.checked) selectedCount++;
  if (cbPok.checked) selectedCount++;

  if (selectedCount === 0) {
    alert("Debes seleccionar al menos un contrato.");
    cbRpg.checked = true; 
    selectedCount = 1;
  }

  let minMatches = selectedCount;
  if (selectedCount % 2 === 0 && selectedCount > 0) {
    minMatches = selectedCount + 1;
  }

  const totalInput = document.getElementById('total-matches');
  totalInput.min = minMatches;
  if (parseInt(totalInput.value, 10) < minMatches) {
    totalInput.value = minMatches;
  }
  updatePartyText();
}

function setDice(d) {
  party.diceMode = d;
  document.getElementById('d-virt').classList.toggle('selected', d === 'virtual');
  document.getElementById('d-real').classList.toggle('selected', d === 'real');
  syncHostSetupToFirebase();
}

function getActivePlayerColorCode() {
  let turn = 1;
  if (party.currentGame === 'rpg') turn = rpg.turn;
  else if (party.currentGame === 'exp') turn = exp.turn;
  else if (party.currentGame === 'maf') turn = maf.turn;
  else if (party.currentGame === 'pok') turn = pok.turn;
  return turn === 1 ? party.p1Color : party.p2Color;
}

function getCurrentTurnPlayerNum() {
  if (party.currentGame === 'rpg') return rpg.turn;
  if (party.currentGame === 'exp') return exp.turn;
  if (party.currentGame === 'maf') return maf.turn;
  if (party.currentGame === 'pok') return pok.turn;
  return 1;
}

function updateMenuPreviews() {
  const p1Color = document.getElementById('p1-color-input').value || 'Color_R';
  const p2Color = document.getElementById('p2-color-input').value || 'Color_B';

  const p1Img = document.getElementById('p1-preview-img');
  const p2Img = document.getElementById('p2-preview-img');

  if (p1Img) {
    p1Img.src = `assets/characters/${p1Color}/idle.png`;
    p1Img.onerror = () => { p1Img.src = `assets/characters/None/idle.png`; };
  }
  if (p2Img) {
    p2Img.src = `assets/characters/${p2Color}/idle.png`;
    p2Img.onerror = () => { p2Img.src = `assets/characters/None/idle.png`; };
  }
}

function openManualGuide() {
  document.getElementById('modal-manual-guide').classList.remove('hidden');
}

function closeManualGuide() {
  document.getElementById('modal-manual-guide').classList.add('hidden');
}

function switchManualTab(tabIndex) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`tab-btn-${i}`).classList.toggle('active', tabIndex === i);
    document.getElementById(`tab-content-${i}`).classList.toggle('hidden', tabIndex !== i);
  }
}

function setWinOverlayAvatars(winnerCode) {
  const p1Img = document.getElementById('win-img-p1');
  const p2Img = document.getElementById('win-img-p2');
  const p1Label = document.getElementById('win-label-p1');
  const p2Label = document.getElementById('win-label-p2');

  p1Label.innerText = party.p1Name;
  p2Label.innerText = party.p2Name;

  const setAvatarImg = (imgEl, color, pose) => {
    imgEl.src = `assets/characters/${color}/${pose}.png`;
    imgEl.onerror = () => {
      imgEl.src = `assets/characters/${color}/idle.png`;
      imgEl.onerror = () => {
        imgEl.src = `assets/characters/None/idle.png`;
      };
    };
  };

  if (winnerCode === 'p1') {
    setAvatarImg(p1Img, party.p1Color, 'win');
    setAvatarImg(p2Img, party.p2Color, 'lose');
  } else if (winnerCode === 'p2') {
    setAvatarImg(p1Img, party.p1Color, 'lose');
    setAvatarImg(p2Img, party.p2Color, 'win');
  } else { 
    setAvatarImg(p1Img, party.p1Color, 'idle');
    setAvatarImg(p2Img, party.p2Color, 'idle');
  }
}

function onStartButtonClick() {
  if (gameMode === 'online') {
    if (!isHost) return;
    hostStartCoreGame();
  } else {
    startCoreGame();
  }
}

window.hostStartCoreGame = function() {
  if (!isHost) return;
  startCoreGame();
  resetRollSync();
  networkStateReady = false;
  networkLastActionId = null;
  lastAppliedActionId = null;
  db.ref(roomPath + '/state').remove();
  db.ref(roomPath + '/actions').remove();
  db.ref(roomPath + '/currentEvent').remove();
  db.ref(roomPath + '/gameStatus').set({ status: 'PLAYING', party: party, ts: firebase.database.ServerValue.TIMESTAMP });
};

function startCoreGame() {
  party.p1Name = document.getElementById('p1-name-input').value.trim() || "Capo Alpha";
  party.p2Name = gameMode === 'solo' ? "La Sombra (IA)" : (document.getElementById('p2-name-input').value.trim() || "Capo Bravo");
  party.p1Color = document.getElementById('p1-color-input').value || 'Color_R';
  party.p2Color = document.getElementById('p2-color-input').value || 'Color_B';

  party.matchesPlayed = 0; party.p1Wins = 0; party.p2Wins = 0;
  party.rerollCost = 50;
  party.p1Coins = 100; party.p2Coins = 100;
  party.p1Contacts = []; party.p2Contacts = [];
  party.p1Consumable = null; party.p2Consumable = null;
  party.p1Combo = 1.0; party.p2Combo = 1.0;
  party.cityEvent = null;
  party.isParty = document.getElementById('party-mode-check').checked;
  const roguelikeEl = document.getElementById('roguelike-mode-check');
  party.isRoguelike = roguelikeEl ? roguelikeEl.checked : true;
  
  const cbRpg = document.getElementById('party-cb-rpg');
  const cbExp = document.getElementById('party-cb-exp');
  const cbMaf = document.getElementById('party-cb-maf');
  const cbPok = document.getElementById('party-cb-pok');
  
  let selectedCount = 0;
  if (cbRpg && cbRpg.checked) selectedCount++;
  if (cbExp && cbExp.checked) selectedCount++;
  if (cbMaf && cbMaf.checked) selectedCount++;
  if (cbPok && cbPok.checked) selectedCount++;

  let minMatches = selectedCount;
  if (selectedCount % 2 === 0 && selectedCount > 0) minMatches = selectedCount + 1;

  const numInput = parseInt(document.getElementById('total-matches').value, 10);
  party.totalMatches = Math.max(numInput || minMatches || 3, minMatches || 1);

  if (party.isParty) {
    let selected = [];
    if(cbRpg.checked) selected.push('rpg');
    if(cbExp.checked) selected.push('exp');
    if(cbMaf.checked) selected.push('maf');
    if(cbPok.checked) selected.push('pok');
    buildPlaylist(selected, party.totalMatches);
  } else {
    party.playlist = [party.singleGameChoice];
    party.totalMatches = 1;
  }

  if (gameMode === 'local' || gameMode === 'solo') {
    window.networkStartGame(party);
  }
}

window.networkStartGame = async function(syncedParty) {
  party = syncedParty || party;

  document.querySelectorAll('.p1-display-name').forEach(el => el.innerText = party.p1Name || 'P1');
  document.querySelectorAll('.p2-display-name').forEach(el => el.innerText = party.p2Name || 'P2');
  document.getElementById('global-p1-name').innerText = party.p1Name || 'P1';
  document.getElementById('global-p2-name').innerText = party.p2Name || 'P2';

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  if (gameMode !== 'online') {
    await startNextMiniGame();
    return;
  }

  const sessionKey = `criminal_dice_online_${roomId}`;
  const wasAlreadyPlaying = sessionStorage.getItem(sessionKey) === 'PLAYING';

  if (wasAlreadyPlaying) {
    const stateSnap = await db.ref(roomPath + '/state').once('value');
    if (stateSnap.exists() && stateSnap.val().networkMeta?.status === 'PLAYING') {
      party.latestNetworkState = stateSnap.val();
      networkStateReady = true;
      networkLastActionId = stateSnap.val().networkMeta?.lastActionId || null;
      if (Number.isInteger(stateSnap.val().networkMeta?.rollIndex)) {
        netRollIndex = stateSnap.val().networkMeta.rollIndex;
      }
      applyNetworkState();
      return;
    }
  }

  sessionStorage.setItem(sessionKey, 'PLAYING');
  await startNextMiniGame();
}

function buildPlaylist(selectedGames, total) {
  party.playlist = [];
  let pool = [...selectedGames].sort(() => Math.random() - 0.5); 
  for(let i = 0; i < total; i++) {
    if (i < pool.length) party.playlist.push(pool[i]); 
    else party.playlist.push(selectedGames[Math.floor(Math.random() * selectedGames.length)]);
  }
}

function applyInitGameContacts(playerNum, playerState) {
  if (!party.isRoguelike) return;
  const contacts = playerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  playerState.firstAttackDone = false; 
  playerState.matonAbilityUsed = false; 
  playerState.tookDamageThisTurn = false; 
  playerState.bunkerUsed = false; 

  if (contacts.includes('contact_prestamista')) {
    if (playerNum === 1) party.p1Coins = (party.p1Coins || 0) + 150;
    else party.p2Coins = (party.p2Coins || 0) + 150;

    if (playerState.max && playerState.max > 2) {
      playerState.max -= 4;
      playerState.hp = Math.min(playerState.hp, playerState.max);
    }
    const boxId = playerNum === 1 ? 'rpg-m1-box' : 'rpg-m2-box';
    cLog(`🩸 ${playerNum === 1 ? party.p1Name : party.p2Name} usa el Prestamista Siniestro (+150💲, -2 Max HP/COB).`);
  }
}

async function startNextMiniGame() {
  if (gameMode === 'online') networkInitInProgress = true;
  resetRollSync();
  party.carniceroBoss = null;
  party.lastDmgToRPG = null;
  party.lastGrenadeDmg = null;
  party.lastTokensStolen = null;
  party.uiStage = 'game';
  party.currentGame = party.playlist[party.matchesPlayed];
  document.body.className = `theme-${party.currentGame}`;
  
  if (gameMode === 'local' || gameMode === 'solo' || isHost) {
    let newEvent = null;
    if (party.isRoguelike) {
      const EVENT_COMPATIBILITY = {
        rpg: ['purga', 'ley_seca', 'carnicero'],
        exp: ['purga', 'ley_seca', 'carnicero', 'comisionado'],
        maf: ['ley_seca', 'inspectores', 'comisionado'],
        pok: ['ley_seca', 'comisionado']
      };

      const validEvents = EVENT_COMPATIBILITY[party.currentGame] || ['ley_seca'];
      if (Math.random() < 0.65) { 
        newEvent = validEvents[Math.floor(Math.random() * validEvents.length)];
        if (newEvent === 'carnicero') {
          party.carniceroBoss = (gameMode === 'solo') ? 2 : (Math.random() < 0.5 ? 1 : 2);
        }
      }
    }
    if (gameMode === 'online' && roomPath) {
      db.ref(roomPath + '/currentEvent').set({ code: newEvent, boss: party.carniceroBoss || null });
    }
    applyCityEvent(newEvent);
  }

  await showMinigameSplash(gameTitles[party.currentGame]);

  document.getElementById('rpg-container').classList.toggle('hidden', party.currentGame !== 'rpg');
  document.getElementById('exp-container').classList.toggle('hidden', party.currentGame !== 'exp');
  document.getElementById('maf-container').classList.toggle('hidden', party.currentGame !== 'maf');
  document.getElementById('pok-container').classList.toggle('hidden', party.currentGame !== 'pok');
  
  if(party.isParty) {
    document.getElementById('party-match-indicator').innerText = `CONTRATO ${party.matchesPlayed + 1} DE ${party.totalMatches} (${gameTitles[party.currentGame]})`;
  }

  updateDeckHUD();

  if (party.currentGame === 'rpg') await initRPG();
  if (party.currentGame === 'exp') await initEXP();
  if (party.currentGame === 'maf') await initMAF();
  if (party.currentGame === 'pok') await initPOK();

  if (gameMode === 'online') {
    networkInitInProgress = false;
    if (!isHost && party.latestNetworkState) {
      const pendingActionId = party.latestNetworkState.networkMeta?.lastActionId || null;
      if (!pendingActionId || pendingActionId === lastAppliedActionId) {
        applyNetworkState();
      }
    }
  }
}

function generateMarketStock(forPlayer = null) {
  const get4Random = () => [...MARKET_CATALOG].sort(() => Math.random() - 0.5).slice(0, 4);
  
  if (!forPlayer || forPlayer === 1) {
    party.p1MarketStock = get4Random();
  }
  if (!forPlayer || forPlayer === 2) {
    party.p2MarketStock = get4Random();
  }
  
  if (gameMode === 'online' && isHost && roomPath) {
    const p1Ids = (party.p1MarketStock || []).map(i => i.id);
    const p2Ids = (party.p2MarketStock || []).map(i => i.id);
    dispatchAction('syncMarketStock', 1, p1Ids);
    dispatchAction('syncMarketStock', 2, p2Ids);
  }
}

window.syncMarketStock = function(playerNum, itemIds) {
  const stock = itemIds.map(id => MARKET_CATALOG.find(i => i.id === id)).filter(Boolean);
  if (playerNum === 1) party.p1MarketStock = stock;
  else party.p2MarketStock = stock;

  const marketModal = document.getElementById('modal-market');
  if (marketModal && !marketModal.classList.contains('hidden')) {
    renderBlackMarket();
  }
};

function handleMiniGameEnd(winnerCode, scoreText) { 
  stopHeartbeat();
  party.isWaiting = true;
  party.matchesPlayed++;
  playSound('win');
  triggerVibrate([100, 50, 150]);
  
  let winnerName = "EMPATE";
  if (winnerCode === 'p1') { party.p1Wins++; winnerName = party.p1Name; }
  if (winnerCode === 'p2') { party.p2Wins++; winnerName = party.p2Name; }
  party.uiStage = 'result';
  party.lastWinnerCode = winnerCode;
  party.lastScoreText = scoreText;
  
  let p1Reward = winnerCode === 'p1' ? 120 : 60;
  let p2Reward = winnerCode === 'p2' ? 120 : 60;

  let p1HpPercent = 1; let p2HpPercent = 1;
  if (party.currentGame === 'rpg') { p1HpPercent = rpg.p1.max > 0 ? rpg.p1.hp/rpg.p1.max : 0; p2HpPercent = rpg.p2.max > 0 ? rpg.p2.hp/rpg.p2.max : 0; }
  if (party.currentGame === 'exp') { p1HpPercent = exp.p1.max > 0 ? exp.p1.hp/exp.p1.max : 0; p2HpPercent = exp.p2.max > 0 ? exp.p2.hp/exp.p2.max : 0; }

  if ((party.p1Contacts || []).includes('contact_contador') && p1HpPercent > 0.5) p1Reward = Math.floor(p1Reward * 1.5);
  if ((party.p2Contacts || []).includes('contact_contador') && p2HpPercent > 0.5) p2Reward = Math.floor(p2Reward * 1.5);

  if (party.cityEvent === 'carnicero' && winnerCode !== 'tie') {
    const winningPNum = winnerCode === 'p1' ? 1 : 2;
    if (winningPNum !== party.carniceroBoss) {
      if (winningPNum === 1) { p1Reward *= 2; cLog(`🏆 ¡${party.p1Name} derrotó al Carnicero y gana DOBLE BOTÍN! (+${p1Reward}💲)`); }
      else { p2Reward *= 2; cLog(`🏆 ¡${party.p2Name} derrotó al Carnicero y gana DOBLE BOTÍN! (+${p2Reward}💲)`); }
    }
  }

  party.p1Coins = (party.p1Coins || 0) + p1Reward;
  party.p2Coins = (party.p2Coins || 0) + p2Reward;
  party.p1RerollCost = 50;
  party.p2RerollCost = 50;
  generateMarketStock();

  document.getElementById('global-p1-val').innerText = party.p1Wins;
  document.getElementById('global-p2-val').innerText = party.p2Wins;

  const overlay = document.getElementById('win-overlay');
  const title = document.getElementById('final-winner-name');
  const msg = document.getElementById('final-winner-msg');
  const btn = document.getElementById('btn-next-match');

  setWinOverlayAvatars(winnerCode);

  const winsNeeded = Math.floor(party.totalMatches / 2) + 1;
  const isPartyOver = party.isParty && (party.p1Wins >= winsNeeded || party.p2Wins >= winsNeeded || party.matchesPlayed >= party.totalMatches);
  const isHostOrLocal = (gameMode === 'local' || gameMode === 'solo') || isHost;

  if (!party.isParty) {
    title.innerText = winnerName.toUpperCase();
    msg.innerText = `FIN DEL JUEGO - ${scoreText}`;
    btn.innerText = isHostOrLocal ? "VOLVER A LOS NEGOCIOS" : "ESPERANDO AL CAPO 1...";
    btn.disabled = !isHostOrLocal;
    btn.style.opacity = isHostOrLocal ? '1' : '0.5';
    btn.onclick = () => { if (isHostOrLocal) dispatchAction('networkReturnToMenu'); };
  } else if (isPartyOver) {
    let grandWinner = "¡EMPATE TOTAL!";
    if (party.p1Wins > party.p2Wins) grandWinner = party.p1Name;
    else if (party.p2Wins > party.p1Wins) grandWinner = party.p2Name;
    
    title.innerText = grandWinner.toUpperCase();
    msg.innerText = `🏆 JEFE ABSOLUTO (${party.p1Wins} - ${party.p2Wins})`;
    btn.innerText = isHostOrLocal ? "VOLVER A LOS NEGOCIOS" : "ESPERANDO AL CAPO 1...";
    btn.disabled = !isHostOrLocal;
    btn.style.opacity = isHostOrLocal ? '1' : '0.5';
    btn.onclick = () => { if (isHostOrLocal) dispatchAction('networkReturnToMenu'); };
  } else {
    title.innerText = winnerName.toUpperCase();
    msg.innerText = `Gana este contrato de ${gameTitles[party.currentGame]} (${scoreText})`;
    const nextAction = party.isRoguelike ? 'openBlackMarket' : 'networkNextGame';
    btn.innerText = isHostOrLocal ? (party.isRoguelike ? "IR AL MERCADO NEGRO" : "SIGUIENTE CONTRATO ➔") : "ESPERANDO AL CAPO 1...";
    btn.disabled = !isHostOrLocal;
    btn.style.opacity = isHostOrLocal ? '1' : '0.5';
    btn.onclick = () => { if (isHostOrLocal) dispatchAction(nextAction); };
  }
  overlay.classList.remove('hidden');
}

let localMarketBuyer = 1;

window.toggleLocalBuyer = function() {
  localMarketBuyer = localMarketBuyer === 1 ? 2 : 1;
  renderBlackMarket();
};

window.openBlackMarket = function() {
  party.uiStage = 'market';
  localMarketBuyer = 1;
  document.getElementById('win-overlay').classList.add('hidden');
  renderBlackMarket();
  document.getElementById('modal-market').classList.remove('hidden');
  playSound('coin');

  if (gameMode === 'solo') {
    setTimeout(() => { executeAiMarketPurchases(); }, 700);
  }
};

function renderBlackMarket() {
  document.getElementById('market-p1-coins').innerText = party.p1Coins || 0;
  document.getElementById('market-p2-coins').innerText = party.p2Coins || 0;

  const isLocal = gameMode === 'local';
  const myPlayerNum = (gameMode === 'online' && !isHost) ? 2 : (isLocal ? localMarketBuyer : 1);
  const myCoins = myPlayerNum === 1 ? party.p1Coins : party.p2Coins;
  const buyerName = myPlayerNum === 1 ? party.p1Name : party.p2Name;
  const myRerollCost = myPlayerNum === 1 ? (party.p1RerollCost || 50) : (party.p2RerollCost || 50);

  const rerollCostEl = document.getElementById('reroll-cost-display');
  if (rerollCostEl) rerollCostEl.innerText = myRerollCost;

  const rerollBtn = document.querySelector('#modal-market .btn-buy-market[onclick*="rerollMarket"]');
  if (rerollBtn) {
    rerollBtn.onclick = () => dispatchAction('rerollMarket', myPlayerNum);
  }

  const container = document.getElementById('market-grid-container');
  container.innerHTML = '';

  if (isLocal) {
    const toggleDiv = document.createElement('div');
    toggleDiv.style.gridColumn = '1 / -1';
    toggleDiv.innerHTML = `
       <button class="btn-action btn-gold" style="width: 100%; font-size: 0.8rem; padding: 8px;" onclick="dispatchAction('toggleLocalBuyer')">
         🛒 COMPRANDO PARA: ${buyerName} 🔄
       </button>`;
    container.appendChild(toggleDiv);
  }

  const currentStock = myPlayerNum === 1 ? (party.p1MarketStock || []) : (party.p2MarketStock || []);

  currentStock.forEach(item => {
    const card = document.createElement('div');
    card.className = 'market-item-card';
    
    const myContacts = myPlayerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
    const myConsumable = myPlayerNum === 1 ? party.p1Consumable : party.p2Consumable;
    
    const isBought = item.type === 'contact' ? myContacts.includes(item.id) : (item.type === 'consumable' ? myConsumable === item.id : false);
    const isContactsFull = item.type === 'contact' && myContacts.length >= 3 && !isBought;

    let typeBadgeClass = 'type-passive';
    let typeBadgeText = 'Artefacto';
    if (item.type === 'contact') { typeBadgeClass = 'type-contact'; typeBadgeText = 'Contacto Pasivo'; }
    if (item.type === 'consumable') { typeBadgeClass = 'type-consumable'; typeBadgeText = 'Consumible'; }

    const refundPercent = myContacts.includes('contact_desguace') ? 0.75 : 0.50;
    const sellPrice = Math.floor(item.cost * refundPercent);

    card.innerHTML = `
      <span class="market-item-type ${typeBadgeClass}">${typeBadgeText}</span>
      <div class="market-item-icon">${item.icon}</div>
      <div class="market-item-title">${item.name}</div>
      <div class="market-item-desc">${item.desc}</div>
      <div class="market-item-cost">💲 ${item.cost}</div>
      <button class="btn-buy-market" id="buy-btn-${item.id}" 
        ${(!isBought && (myCoins < item.cost || isContactsFull)) ? 'disabled' : ''}
        style="${isBought ? 'background: var(--accent-red); color: white;' : ''}">
        ${isBought ? `VENDER (+${sellPrice}💲)` : (isContactsFull && item.type === 'contact' ? 'MAX CONTACTOS' : 'COMPRAR')}
      </button>
    `;

    const buyBtn = card.querySelector(`#buy-btn-${item.id}`);
    if (buyBtn && (!isContactsFull || isBought)) {
      buyBtn.onclick = () => {
        if (isBought) dispatchAction('sellMarketItem', myPlayerNum, item.id);
        else dispatchAction('buyMarketItem', myPlayerNum, item.id);
      };
    }

    container.appendChild(card);
  });

  const btnCont = document.getElementById('btn-market-continue');
  const isHostOrLocal = (gameMode === 'local' || gameMode === 'solo') || isHost;
  btnCont.innerText = isHostOrLocal ? "CONTINUAR AL SIGUIENTE CONTRATO ➔" : "ESPERANDO AL CAPO 1...";
  btnCont.disabled = !isHostOrLocal;
  btnCont.style.opacity = isHostOrLocal ? '1' : '0.5';
}

window.buyMarketItem = function(playerNum, itemId) {
  const item = MARKET_CATALOG.find(i => i.id === itemId);
  if (!item) return;

  const pCoins = playerNum === 1 ? party.p1Coins : party.p2Coins;
  const pContacts = playerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);

  if (pCoins >= item.cost) {
    if (item.type === 'contact') {
      if (pContacts.length >= 3) {
        alert("¡Límite de 3 Contactos pasivos alcanzado!");
        return;
      }
      if (playerNum === 1) { party.p1Coins -= item.cost; if(!party.p1Contacts) party.p1Contacts=[]; party.p1Contacts.push(itemId); }
      else { party.p2Coins -= item.cost; if(!party.p2Contacts) party.p2Contacts=[]; party.p2Contacts.push(itemId); }
    } else if (item.type === 'consumable') {
      if (playerNum === 1) { party.p1Coins -= item.cost; party.p1Consumable = itemId; }
      else { party.p2Coins -= item.cost; party.p2Consumable = itemId; }
    }

    const pName = playerNum === 1 ? party.p1Name : party.p2Name;
    cLog(`🛒 ${pName} compró en el Mercado: ${item.name} (${item.icon})`);
    playSound('coin');
    spawnParticles('market-grid-container', 'loot');
  }

  renderBlackMarket();
  if (isHost) syncStateToNetwork();
};

window.sellMarketItem = function(playerNum, itemId) {
  const item = MARKET_CATALOG.find(i => i.id === itemId);
  if (!item) return;
  
  const pContacts = playerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const refundPercent = pContacts.includes('contact_desguace') ? 0.75 : 0.50;
  const refund = Math.floor(item.cost * refundPercent);

  if (playerNum === 1) { 
    party.p1Coins += refund; 
    if (item.type === 'contact') party.p1Contacts = party.p1Contacts.filter(id => id !== itemId);
    else party.p1Consumable = null;
  } else { 
    party.p2Coins += refund; 
    if (item.type === 'contact') party.p2Contacts = party.p2Contacts.filter(id => id !== itemId);
    else party.p2Consumable = null;
  }
  playSound('coin');
  renderBlackMarket();
  if (isHost) syncStateToNetwork();
};

window.rerollMarket = function(pNumParam) {
  const myPlayerNum = pNumParam || ((gameMode === 'online' && !isHost) ? 2 : (gameMode === 'local' ? localMarketBuyer : 1));
  const currentCoins = myPlayerNum === 1 ? party.p1Coins : party.p2Coins;
  const currentRerollCost = myPlayerNum === 1 ? (party.p1RerollCost || 50) : (party.p2RerollCost || 50);

  if (currentCoins >= currentRerollCost) {
    if (myPlayerNum === 1) {
      party.p1Coins -= currentRerollCost;
      party.p1RerollCost = currentRerollCost + 25;
      party.p1MarketStock = [...MARKET_CATALOG].sort(() => Math.random() - 0.5).slice(0, 4);
      if (gameMode === 'online' && roomPath) {
        dispatchAction('syncMarketStock', 1, party.p1MarketStock.map(i => i.id));
      }
    } else {
      party.p2Coins -= currentRerollCost;
      party.p2RerollCost = currentRerollCost + 25;
      party.p2MarketStock = [...MARKET_CATALOG].sort(() => Math.random() - 0.5).slice(0, 4);
      if (gameMode === 'online' && roomPath) {
        dispatchAction('syncMarketStock', 2, party.p2MarketStock.map(i => i.id));
      }
    }
    playSound('diceLanding');
    renderBlackMarket();
  } else {
    alert("No tienes suficientes monedas para el Reroll.");
  }
};

function executeAiMarketPurchases() {
  if (gameMode !== 'solo') return;
  const aiStock = party.p2MarketStock || [];
  aiStock.forEach(item => {
    if (party.p2Coins >= item.cost && Math.random() < 0.6) {
      buyMarketItem(2, item.id);
    }
  });
}

function createItemBadge(item, playerNum, isConsumable = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'item-badge-wrapper';

  const currentG = party.currentGame || 'rpg';
  const incompatibleGames = item.incompatible || [];
  const isCompat = !incompatibleGames.includes(currentG);

  if (isConsumable) {
    const btn = document.createElement('button');
    btn.className = `btn-use-consumable ${isCompat ? '' : 'item-incompatible'}`;
    const currentTurn = getCurrentTurnPlayerNum();
    const needsRollData = item.id === 'item_puro';
    const canUse = isCompat && (playerNum === currentTurn) && (!needsRollData || party.lastRollData) && !party.isWaiting && isMyTurnNetwork();
    
    btn.disabled = !canUse;
    btn.onclick = () => dispatchAction('useConsumable', playerNum);
    btn.innerHTML = `${item.icon} <span class="item-name-text">${item.name}</span>${isCompat ? '' : ' ⚠️'}`;
    wrapper.appendChild(btn);
  } else {
    const badge = document.createElement('div');
    badge.className = `contact-slot-badge ${isCompat ? '' : 'item-incompatible'}`;
    badge.innerHTML = `${item.icon} <span class="item-name-text" style="font-size:0.6rem;">${item.name}</span>${isCompat ? '' : ' ⚠️'}`;
    wrapper.appendChild(badge);
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'item-tooltip';
  tooltip.innerHTML = `<b>${item.name}</b><br>${item.desc}${isCompat ? '' : '<br><span style="color:var(--accent-red); font-weight:bold;">⚠️ Incompatible en ' + currentG.toUpperCase() + '</span>'}`;
  wrapper.appendChild(tooltip);

  return wrapper;
}

function updateDeckHUD() {
  const showHud = party.isRoguelike !== false;
  document.querySelectorAll('.player-deck-hud').forEach(el => el.style.display = showHud ? 'flex' : 'none');
  if (!showHud) return;

  const prefixes = ['rpg', 'exp', 'maf', 'pok'];
  prefixes.forEach(pfx => {
    updatePlayerHUD(1, `${pfx}-p1-items-hud`, `${pfx}-p1-money-hud`);
    updatePlayerHUD(2, `${pfx}-p2-items-hud`, `${pfx}-p2-money-hud`);
  });
}

function updatePlayerHUD(playerNum, itemsHudId, moneyHudId) {
  const contacts = playerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const consumable = playerNum === 1 ? party.p1Consumable : party.p2Consumable;
  const money = playerNum === 1 ? (party.p1Coins || 0) : (party.p2Coins || 0);

  const itemsContainer = document.getElementById(itemsHudId);
  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    
    contacts.forEach(cId => {
      const item = MARKET_CATALOG.find(i => i.id === cId);
      if (item) {
        itemsContainer.appendChild(createItemBadge(item, playerNum));
      }
    });

    if (consumable) {
      const item = MARKET_CATALOG.find(i => i.id === consumable);
      if (item) {
        itemsContainer.appendChild(createItemBadge(item, playerNum, true));
      }
    } else {
      const emptyBtn = document.createElement('button');
      emptyBtn.className = 'btn-use-consumable';
      emptyBtn.style.opacity = '0.5';
      emptyBtn.disabled = true;
      emptyBtn.innerHTML = `🚬 <span class="item-name-text">VACÍO</span>`;
      itemsContainer.appendChild(emptyBtn);
    }
  }

  const moneyContainer = document.getElementById(moneyHudId);
  if (moneyContainer) {
    moneyContainer.innerText = `💲 ${money}`;
  }
}

function addCombo(playerNum) {
  if (playerNum === 1) party.p1Combo = 1.0;
  else party.p2Combo = 1.0;
}

function resetCombo(playerNum) {
  if (playerNum === 1) party.p1Combo = 1.0;
  else party.p2Combo = 1.0;
}

window.useConsumable = function(playerNum) {
  const consumable = playerNum === 1 ? party.p1Consumable : party.p2Consumable;
  if (!consumable || party.isWaiting) return;

  const pName = playerNum === 1 ? party.p1Name : party.p2Name;
  const pStateRPG = playerNum === 1 ? rpg.p1 : rpg.p2;
  const pStateEXP = playerNum === 1 ? exp.p1 : exp.p2;

  if (playerNum === 1) party.p1Consumable = null;
  else party.p2Consumable = null;

  if (consumable === 'item_puro' && party.lastRollData) {
    cLog(`🚬 ¡${pName} usa PURO DEL CAPO y repite el dado!`);
    playSound('roll');
    const last = party.lastRollData;
    roll(last.sides, last.desc + " (RE-TIRADA)", last.overrideColor, last.actionImg, last.actionAnim, last.soundName);
  } 
  else if (consumable === 'item_adrenalina') {
    cLog(`💉 ¡${pName} usa ADRENALINA y recupera 4 HP/COB!`);
    if (party.currentGame === 'rpg') pStateRPG.hp = Math.min(pStateRPG.max, pStateRPG.hp + 4);
    if (party.currentGame === 'exp') pStateEXP.hp = Math.min(pStateEXP.max, pStateEXP.hp + 4);
    playSound('heal');
    triggerScreenShake();
  }

  else if (consumable === 'item_whisky') {
    cLog(`🥃 ¡${pName} bebe WHISKY! Daño/Botín x2 este turno, pero pierde 2 HP/COB.`);
    if (party.currentGame === 'rpg') {
      pStateRPG.hp = Math.max(0, pStateRPG.hp - 2);
      if (pStateRPG.hp === 0) {
        updateDeckHUD(); updateUI_RPG();
        return endRPG(playerNum === 1 ? 'p2' : 'p1');
      }
    }
    if (party.currentGame === 'exp') {
      pStateEXP.hp = Math.max(0, pStateEXP.hp - 2);
      if (pStateEXP.hp === 0 && !pStateEXP.surfaced) {
        pStateEXP.temp = 0; pStateEXP.surfaced = true;
        cLog(`🚨 ¡${pName} colapsa por el Whisky! Cobertura destruida.`);
      }
    }
    if (playerNum === 1) party.p1Combo = (party.p1Combo || 1) * 2;
    else party.p2Combo = (party.p2Combo || 1) * 2;
    playSound('hit');
  }
  else if (consumable === 'item_soborno') {
    cLog(`🤝 ¡${pName} usa SOBORNO RELÁMPAGO! Su próximo d6 será forzado a un 6 automático.`);
    if (playerNum === 1) party.p1Force6 = true; else party.p2Force6 = true;
    playSound('coin');
  }
  else if (consumable === 'item_falsa_alarma') {
    cLog(`📞 ¡${pName} realiza una LLAMADA DE FALSA ALARMA y cancela los efectos del rival!`);
    playSound('heal');
    triggerScreenShake();

    if (party.currentGame === 'rpg') {
      pStateRPG.poison = 0;
      if (party.lastDmgToRPG && party.lastDmgToRPG.target === playerNum) {
        pStateRPG.hp = Math.min(pStateRPG.max, pStateRPG.hp + party.lastDmgToRPG.amount);
        party.lastDmgToRPG = null;
      }
      cLog(`📞 Estado purificado y Soplón cancelado.`);
    } else if (party.currentGame === 'exp') {
      if (party.lastGrenadeDmg && party.lastGrenadeDmg.target === playerNum) {
        pStateEXP.hp = Math.min(pStateEXP.max, pStateEXP.hp + party.lastGrenadeDmg.amount);
        party.lastGrenadeDmg = null;
        cLog(`📞 Cobertura dañada por granada restaurada.`);
      }
    } else if (party.currentGame === 'maf') {
      const actMAF = playerNum === 1 ? maf.p1 : maf.p2;
      for (let i = 1; i <= 6; i++) { actMAF.sabotages[i] = 0; }
      cLog(`📞 Redadas Policiales sobre tus distritos clausurados canceladas.`);
    } else if (party.currentGame === 'pok') {
      const actPOK = playerNum === 1 ? pok.p1 : pok.p2;
      const rvlPOK = playerNum === 1 ? pok.p2 : pok.p1;
      if (party.lastTokensStolen && party.lastTokensStolen.target === playerNum) {
        const amt = Math.min(rvlPOK.tokens, party.lastTokensStolen.amount);
        actPOK.tokens += amt;
        rvlPOK.tokens -= amt;
        party.lastTokensStolen = null;
        cLog(`📞 Recobradas ${amt} fichas sustraídas por el rival.`);
      }
    }
  }

  updateDeckHUD();
  if(party.currentGame === 'rpg') updateUI_RPG();
  if(party.currentGame === 'exp') updateUI_EXP();
  if(party.currentGame === 'maf') updateUI_MAF();
  if(party.currentGame === 'pok') updateUI_POK();
};

window.networkReturnToMenu = function() {
  party.uiStage = 'setup';
  stopHeartbeat();
  resetRollSync();
  party.matchesPlayed = 0; party.p1Wins = 0; party.p2Wins = 0;
  party.rerollCost = 50;
  party.p1Coins = 100; party.p2Coins = 100;
  party.p1Contacts = []; party.p2Contacts = [];
  party.p1Consumable = null; party.p2Consumable = null;
  party.p1Combo = 1.0; party.p2Combo = 1.0;
  party.cityEvent = null;
  if (gameMode === 'online' && roomId) {
    sessionStorage.removeItem(`criminal_dice_online_${roomId}`);
  }

  document.getElementById('global-p1-val').innerText = '0';
  document.getElementById('global-p2-val').innerText = '0';

  document.getElementById('win-overlay').classList.add('hidden');
  document.getElementById('modal-market').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
  document.body.className = `theme-${party.singleGameChoice}`; 
  if (gameMode === 'online' && roomPath && isHost) {
    db.ref(roomPath + '/state').remove();
    db.ref(roomPath + '/actions').remove();
    db.ref(roomPath + '/currentEvent').remove();
    db.ref(roomPath + '/gameStatus').set({ status: 'SETUP' });
  }
}

window.networkNextGame = function() {
  party.uiStage = 'game';
  if ((party.p1Contacts || []).includes('contact_usurero')) {
     let interes = Math.min(200, Math.floor((party.p1Coins || 0) * 0.10));
     party.p1Coins += interes;
  }
  if ((party.p2Contacts || []).includes('contact_usurero')) {
     let interes = Math.min(200, Math.floor((party.p2Coins || 0) * 0.10));
     party.p2Coins += interes;
  }

  document.getElementById('win-overlay').classList.add('hidden');
  document.getElementById('modal-market').classList.add('hidden');
  startNextMiniGame();
}

window.applyCityEvent = function(eventCode) {
  party.cityEvent = eventCode;
  let eventTitle = ''; let eventDesc = '';
  if (eventCode === 'purga') { eventTitle = '📰 NOCHE DE PURGA'; eventDesc = 'RPG: Tommy/Francotirador +2 daño | Atraco: Trampa/Granada +2 daño'; }
  else if (eventCode === 'ley_seca') { eventTitle = '📰 LEY SECA CLANDESTINA'; eventDesc = '-50% a Curaciones | -1 a Tiradas de d6'; }
  else if (eventCode === 'inspectores') { eventTitle = '📰 GUERRA DE INSPECTORES'; eventDesc = 'Recaudación x2 | Riesgo Redada Policial sube al 50%'; }
  else if (eventCode === 'carnicero') {
    const bossName = party.carniceroBoss === 1 ? party.p1Name : party.p2Name;
    eventTitle = `💀 JEFE: EL CARNICERO (${bossName.toUpperCase()})`;
    eventDesc = `¡${bossName} asume el rol de Jefe! (+10 HP/COB, +1 Daño y recibe +1 daño). Vencerlo otorga x2 Botín.`;
  }
  else if (eventCode === 'comisionado') { eventTitle = '💀 JEFE: COMISIONADO CORRUPTO'; eventDesc = '-10% de Efectivo/Fichas/Botín al pasar turno'; }

  const banner = document.getElementById('city-event-banner');
  if (party.cityEvent) {
    banner.classList.remove('hidden');
    document.getElementById('city-event-title').innerText = eventTitle;
    document.getElementById('city-event-desc').innerText = eventDesc;
    banner.style.boxShadow = (eventCode.includes('carnicero') || eventCode.includes('comisionado')) ? '0 0 20px rgba(231, 76, 60, 0.8)' : '0 0 12px rgba(231, 76, 60, 0.4)';
  } else {
    banner.classList.add('hidden');
  }
};

function showActionModal(playerNum, titleText, actionImg, actionAnim, duration = 1200) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-virtual');
    const wrapper = document.getElementById('modal-dice-wrapper');
    const charImg = document.getElementById('modal-char-img');
    const cancelBtn = modal.querySelector('.btn-cancel');

    charImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    charImg.className = '';
    wrapper.classList.add('hidden');

    document.getElementById('virtual-title').innerText = titleText;
    if (cancelBtn) cancelBtn.classList.add('hidden'); 

    const playerColorCode = playerNum === 1 ? party.p1Color : party.p2Color;
    
    setTimeout(() => {
      charImg.src = `assets/characters/${playerColorCode}/${actionImg}.png`;
      charImg.onerror = () => {
        charImg.src = `assets/characters/${actionImg}.png`;
        charImg.onerror = () => { charImg.src = `assets/characters/None/idle.png`; };
      };

      void charImg.offsetWidth;
      charImg.classList.add(actionAnim);
      modal.classList.remove('hidden');
    }, 50);

    setTimeout(() => {
      modal.classList.add('hidden');
      resolve();
    }, duration + 50);
  });
}

async function roll(sides, desc, overrideColor = null, actionImg = 'idle', actionAnim = 'anim-bounce', soundName = null, forcedVal = null) {
  party.abortController = new AbortController();
  const signal = party.abortController.signal;

  party.lastRollData = { sides, desc, overrideColor, actionImg, actionAnim, soundName };
  updateDeckHUD();

  let val = 0;

  const currentPNum = getCurrentTurnPlayerNum();
  const isP1 = currentPNum === 1;

  if (sides === 6 && ((isP1 && party.p1Force6) || (!isP1 && party.p2Force6))) {
    forcedVal = 6;
    if (isP1) party.p1Force6 = false; else party.p2Force6 = false;
    cLog("🤝 ¡Soborno aplicado! d6 forzado a 6.");
  }

  let leySecaApplied = false;
  if (party.cityEvent === 'ley_seca' && sides === 6 && forcedVal === null) {
    leySecaApplied = true;
  }

  if (party.diceMode === 'virtual') val = await virtualRoll(sides, desc, signal, overrideColor, actionImg, actionAnim, soundName, forcedVal);
  else val = await manualRoll(sides, desc, signal, overrideColor, actionImg, actionAnim, soundName, forcedVal);

  const pfx = party.currentGame || 'rpg';
  const boxId = isP1 ? `${pfx}-m1-box` : `${pfx}-m2-box`;

  if (leySecaApplied) {
    const rawVal = val;
    val = Math.max(1, val - 1);
    cLog(`🍷 Ley Seca Clandestina: Tirada d6 de ${rawVal} ajustada a ${val}.`);
    spawnFloatingText(boxId, `-1 LEY SECA`, 'status');
  }

  const currentContacts = isP1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  
  if (sides === 20 && currentContacts.includes('contact_armero')) {
    val = Math.min(20, val + 2); 
    spawnFloatingText(boxId, `+2 ARMERO`, 'crit');
  }
  if (sides === 6 && party.currentGame !== 'maf' && currentContacts.includes('contact_tallador') && val === 1) {
    val = (party.currentGame === 'exp') ? 3 : 2; 
    spawnFloatingText(boxId, `TALLADOR (${val})`, 'crit');
  }
  if (sides === 6 && currentContacts.includes('contact_crupier') && val % 2 === 0) {
    val = Math.min(6, val + 1); spawnFloatingText(boxId, `+1 CRUPIER`, 'crit');
  }
  if (currentContacts.includes('contact_matematico') && val === sides) {
    if (isP1) party.p1Coins += 100; else party.p2Coins += 100;
    spawnFloatingText(boxId, `+100💲 MATEMÁTICO`, 'loot'); playSound('coin');
  }
  if (sides === 6 && currentContacts.includes('contact_tahur') && val === 1) {
    if (isP1) party.p1Coins += 50; else party.p2Coins += 50;
    spawnFloatingText(boxId, `+50💲 COBRADOR`, 'loot');
    cLog(`🃏 El Cobrador de la Mesa añade +50💲 al dinero del Mercado Negro de ${isP1 ? party.p1Name : party.p2Name}.`);
    playSound('coin');
  }

  return val;
}

function virtualRoll(sides, desc, signal, overrideColor = null, actionImg = 'idle', actionAnim = 'anim-bounce', soundName = null, forcedVal = null) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('modal-virtual');
    const wrapper = document.getElementById('modal-dice-wrapper');
    const charImg = document.getElementById('modal-char-img');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const modalContent = modal.querySelector('.modal-content');

    const shadowEl = document.getElementById('modal-dice-shadow');
    const colorEl = document.getElementById('modal-dice-color');
    const baseEl = document.getElementById('modal-dice-base');
    const numEl = document.getElementById('modal-dice-num');

    shadowEl.style.backgroundImage = 'none';
    colorEl.style.backgroundImage = 'none';
    baseEl.style.backgroundImage = 'none';
    numEl.style.backgroundImage = 'none';

    charImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    charImg.className = '';
    
    document.getElementById('virtual-title').innerText = desc;
    if (cancelBtn) cancelBtn.classList.remove('hidden'); 
    modal.classList.remove('hidden');

    const playerColorCode = overrideColor || getActivePlayerColorCode();
    const diceFolder = `assets/D${sides}`;

    const rollPromise = getNetworkRoll(sides, forcedVal);

    setTimeout(() => {
      charImg.src = `assets/characters/${playerColorCode}/${actionImg}.png`;
      charImg.onerror = () => {
        charImg.src = `assets/characters/${actionImg}.png`;
        charImg.onerror = () => { charImg.src = `assets/characters/None/idle.png`; };
      };

      void charImg.offsetWidth; 
      charImg.classList.add(actionAnim);
    }, 50);

    if (soundName) {
      playSound(soundName);
    } else if (actionImg === 'rpg_tommy') {
      playSound('tommy');
    } else if (actionImg === 'rpg_sniper') {
      playSound('sniper_reload');
    } else if (actionImg === 'exp_vault') {
      playSound('fuse');
    }

    wrapper.classList.add('hidden');
    wrapper.style.transform = 'rotate(0deg) scale(1)';

    if (sides === 4 || sides === 6) {
      shadowEl.style.backgroundImage = 'none';
    } else {
      shadowEl.style.backgroundImage = `url('${diceFolder}/Sombra.png')`;
    }
    colorEl.style.backgroundImage = `url('${diceFolder}/${playerColorCode}.png')`;
    baseEl.style.backgroundImage = `url('${diceFolder}/Capa 0.png')`;

    let interval = null;

    const cleanUp = () => { 
      if (interval) clearInterval(interval); 
      modal.classList.add('hidden'); 
      wrapper.style.transform = 'rotate(0deg) scale(1)';
    };

    signal.addEventListener('abort', () => { 
      cleanUp(); 
      reject('aborted'); 
    });

    setTimeout(() => {
      if (cancelBtn) cancelBtn.classList.add('hidden');
      wrapper.classList.remove('hidden');

      interval = setInterval(() => {
        const tempVal = Math.floor(Math.random() * sides) + 1;
        numEl.style.backgroundImage = `url('${diceFolder}/${tempVal}.png')`;

        const rot = Math.floor(Math.random() * 20) - 10;
        const scale = 0.95 + Math.random() * 0.1;
        wrapper.style.transform = `rotate(${rot}deg) scale(${scale})`;
        playSound('roll');
        triggerVibrate(20);
      }, 50);

      setTimeout(async () => {
        clearInterval(interval);
        
        const finalRoll = await rollPromise;
        numEl.style.backgroundImage = `url('${diceFolder}/${finalRoll}.png')`;
        wrapper.style.transform = 'rotate(0deg) scale(1)';

        playSound('diceLanding');
        triggerVibrate(50);
        if (modalContent) {
          modalContent.style.transition = 'background-color 0.05s ease';
          modalContent.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
          setTimeout(() => { modalContent.style.backgroundColor = ''; }, 90);
        }

        setTimeout(() => {
          cleanUp();
          resolve(finalRoll);
        }, 1000);
      }, 800);

    }, 700);
  });
}

function manualRoll(sides, desc, signal, overrideColor = null, actionImg = 'idle', actionAnim = 'anim-bounce', soundName = null, forcedVal = null) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('modal-manual');
    const input = document.getElementById('input-manual-value');
    const btn = document.getElementById('btn-confirm-manual');
    const charImg = document.getElementById('modal-manual-char-img');

    charImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    charImg.className = '';

    document.getElementById('manual-title').innerText = `Tira d${sides}`;
    document.getElementById('manual-desc').innerText = desc;

    const playerColorCode = overrideColor || getActivePlayerColorCode();
    
    setTimeout(() => {
      charImg.src = `assets/characters/${playerColorCode}/${actionImg}.png`;
      charImg.onerror = () => {
        charImg.src = `assets/characters/${actionImg}.png`;
        charImg.onerror = () => { charImg.src = `assets/characters/None/idle.png`; };
      };
      charImg.className = actionAnim;
    }, 50);

    modal.classList.remove('hidden');
    input.value = ''; setTimeout(() => input.focus(), 50);

    const cleanUp = () => { modal.classList.add('hidden'); btn.onclick = null; input.onkeydown = null; };
    
    signal.addEventListener('abort', () => { cleanUp(); reject('aborted'); });

    if (!isMyTurnNetwork()) {
        input.disabled = true;
        btn.innerText = "ESPERANDO RIVAL...";
        btn.onclick = null;
        getNetworkRoll(sides).then(val => {
            cleanUp();
            resolve(val);
        });
    } else {
        input.disabled = false;
        btn.innerText = "CONFIRMAR DADO";
        const validateAndResolve = async () => {
          const val = parseInt(input.value, 10);
          if (val >= 1 && val <= sides) { 
              const finalVal = await getNetworkRoll(sides, val);
              cleanUp(); 
              resolve(finalVal); 
          } else { alert(`Número entre 1 y ${sides}`); }
        };
        btn.onclick = validateAndResolve;
        input.onkeydown = (e) => { if(e.key === 'Enter') validateAndResolve(); };
    }
  });
}

window.networkCancelAction = function() {
  cancelAction();
}

function cancelAction() {
  if (party.abortController) party.abortController.abort();
  closeChoiceModal();
  party.isWaiting = false;
  cLog("🚫 Acción cancelada.");
  
  if(party.currentGame === 'rpg') updateUI_RPG(); 
  else if(party.currentGame === 'exp') updateUI_EXP();
  else if(party.currentGame === 'maf') updateUI_MAF();
  else updateUI_POK();
}

let currentModalCallback = null;
function openChoiceModal(title, desc, options, callback) {
  currentModalCallback = callback;
  document.getElementById('choice-title').innerText = title;
  document.getElementById('choice-desc').innerText = desc;
  const container = document.getElementById('choice-container');
  container.innerHTML = '';

  const myTurn = isMyTurnNetwork();

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'btn-action';
    btn.style.width = '100%';
    btn.innerHTML = opt.label;
    btn.disabled = opt.disabled || !myTurn;
    
    if(opt.isOwned) btn.classList.add('owned');
    else if(opt.disabled || !myTurn) btn.style.opacity = '0.3';

    btn.onclick = () => { 
        if (!myTurn) return;
        dispatchAction('networkModalChoice', opt.value);
    };
    container.appendChild(btn);
  });

  const cancelBtn = document.querySelector('#modal-choice .btn-cancel');
  if (cancelBtn) {
    cancelBtn.disabled = !myTurn;
    cancelBtn.style.opacity = myTurn ? '1' : '0.3';
    cancelBtn.style.pointerEvents = myTurn ? 'auto' : 'none';
  }

  document.getElementById('modal-choice').classList.remove('hidden');
}

window.networkModalChoice = function(val) {
  closeChoiceModal();
  if (currentModalCallback) {
      currentModalCallback(val);
      currentModalCallback = null;
  }
};

function closeChoiceModal() {
  document.getElementById('modal-choice').classList.add('hidden');
}

function spawnParticles(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let color = '#fff'; let count = 12; let isFloating = false;

  if (type === 'quick' || type === 'dmg-light') { color = 'var(--accent-red)'; count = 10; }
  else if (type === 'strong' || type === 'dmg-heavy') { color = 'var(--accent-orange)'; count = 24; }
  else if (type === 'heal' || type === 'repair' || type === 'growth') { color = 'var(--accent-green)'; count = 15; isFloating = true; }
  else if (type === 'poison') { color = 'var(--accent-purple)'; count = 15; isFloating = true; }
  else if (type === 'shield') { color = 'var(--accent-shield)'; count = 3; isFloating = true; }
  else if (type === 'loot' || type === 'brew' || type === 'coin') { color = 'var(--accent-gold)'; count = 15; isFloating = true; }
  else if (type === 'surface') { color = 'var(--text-bright)'; count = 30; isFloating = true; }

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle ' + (isFloating ? 'part-float' : 'part-burst');
    p.style.backgroundColor = color;
    const size = Math.random() * 6 + 4;
    p.style.width = size + 'px'; p.style.height = size + 'px';
    p.style.left = (Math.random() * 50 + 25) + '%'; p.style.top = '45px';

    if (isFloating) {
      p.style.setProperty('--x', (Math.random() * 60 - 30) + 'px');
      p.style.setProperty('--y', -(Math.random() * 60 + 30) + 'px');
    } else {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (type === 'dmg-heavy' || type === 'strong' ? 100 : 50) + 20;
      p.style.setProperty('--x', Math.cos(angle) * distance + 'px');
      p.style.setProperty('--y', Math.sin(angle) * distance + 'px');
    }
    container.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

function triggerAnimation(elementId, className) {
  return new Promise((resolve) => {
    const element = document.getElementById(elementId);
    if (!element) return resolve();
    
    let finished = false;
    const done = () => {
      if (!finished) {
        finished = true;
        element.classList.remove(className);
        resolve();
      }
    };

    element.classList.add(className);
    element.addEventListener('animationend', done, { once: true });
    setTimeout(done, 500);
  });
}

function cLog(txt) {
  let boxId = 'rpg-log-box';
  if(party.currentGame === 'exp') boxId = 'exp-log-box';
  if(party.currentGame === 'maf') boxId = 'maf-log-box';
  if(party.currentGame === 'pok') boxId = 'pok-log-box';
  
  const log = document.getElementById(boxId);
  log.innerHTML += `<div class="log-entry">${txt}</div>`;
  log.scrollTop = log.scrollHeight;
}

// ==========================================
// LÓGICA DE INTELIGENCIA ARTIFICIAL (IA / BOT)
// ==========================================
let aiThinkingTimeout = null;

function isAiTurn() {
  if (gameMode !== 'solo') return false;
  if (party.currentGame === 'rpg') return rpg.turn === 2 && rpg.p2.hp > 0;
  if (party.currentGame === 'exp') return exp.turn === 2 && !exp.p2.surfaced && exp.p2.hp > 0;
  if (party.currentGame === 'maf') return maf.turn === 2;
  if (party.currentGame === 'pok') return pok.turn === 2 && pok.p2.tokens > 0;
  return false;
}

function checkAiTurn() {
  if (!isAiTurn() || party.isWaiting) return;
  if (aiThinkingTimeout) clearTimeout(aiThinkingTimeout);

  aiThinkingTimeout = setTimeout(() => {
    if (!isAiTurn() || party.isWaiting) return;
    executeAiTurn();
  }, 1100);
}

async function executeAiTurn() {
  if (party.isWaiting) return;

  if (party.currentGame === 'rpg') {
    const ai = rpg.p2;
    const human = rpg.p1;
    if (ai.hp <= 0) return;

    if (party.isRoguelike && (party.p1Contacts || []).includes('contact_soplon')) {
      let planned = "Ráfaga Tommy Gun";
      if (ai.hp / ai.max < 0.35 && ai.heals < 3 && !ai.blocked && rpg.round > 1) planned = "Visita al Médico Matasanos";
      else if (human.hp <= 6) planned = "Remate con Tommy Gun";
      else if (human.poison === 0) planned = "Infiltrar Soplón";
      else if (Math.random() < 0.5) planned = "Disparo de Francotirador";
      cLog(`🕵️ Soplón Infiltrado revela: La IA se prepara para ejecutar: ${planned}.`);
    }

    if (ai.hp / ai.max < 0.35 && ai.heals < 3 && !ai.blocked && rpg.round > 1) {
      rpgAction('heal');
    } else if (human.hp <= 6) {
      rpgAction('quick');
    } else if (human.poison === 0 && Math.random() < 0.4) {
      rpgAction('poison');
    } else if (Math.random() < 0.5) {
      rpgAction('strong');
    } else {
      rpgAction('quick');
    }
  } else if (party.currentGame === 'exp') {
    const ai = exp.p2;
    const human = exp.p1;
    if (ai.surfaced) return;

    const maxTorpedos = party.isParty ? 1 : 3;
    const canRepair = !party.isParty ? (ai.repairUses < 1) : (ai.repairCooldown === 0);

    const humanTotal = human.secured + (human.surfaced ? 0 : human.temp);
    const aiTotal = ai.secured + ai.temp;
    const isBehind = aiTotal <= humanTotal;

    if (party.isRoguelike && (party.p1Contacts || []).includes('contact_soplon')) {
      let planned = "Saquear Cajas";
      if (!human.surfaced && human.temp >= 2 && ai.torpedoUses < maxTorpedos) planned = "Sabotaje con Granada";
      else if (ai.hp <= 4 && !canRepair && ai.temp > 0 && !isBehind) planned = "Huir en Coche de Escape";
      else if (isBehind || ai.hp > 6) planned = "Forzar Bóveda";
      else if (ai.hp <= 10 && canRepair) planned = "Reforzar Cobertura";
      cLog(`🕵️ Soplón Infiltrado revela: La IA planea en el Atraco: ${planned}.`);
    }

    if (!human.surfaced && human.temp >= 2 && ai.torpedoUses < maxTorpedos && Math.random() < 0.75) {
      expAction('sabotage');
    } else if (ai.hp <= 6 && canRepair) {
      expAction('repair');
    } else if (isBehind && ai.hp > 4) {
      expAction('deep');
    } else if (ai.temp >= 5 && !isBehind) {
      expAction('surface');
    } else {
      expAction('explore');
    }
  } else if (party.currentGame === 'maf') {
    const ai = maf.p2;
    const human = maf.p1;

    if (maf.phase === 'roll') {
      const egoist = ai.coins >= 3 && Math.random() < 0.3;
      const sides = (ai.parcels.length <= 2 || Math.random() < 0.3) ? 12 : 6;
      if (party.isRoguelike && (party.p1Contacts || []).includes('contact_soplon')) {
        cLog(`🕵️ Soplón Infiltrado revela: La IA planea Recaudación ${sides === 6 ? 'Segura (d6)' : 'Arriesgada (d12)'}${egoist ? ' Lavando Dinero' : ''}.`);
      }
      mafRollHarvest(sides, egoist);
    } else if (maf.phase === 'action') {
      const nextParcelCost = ai.parcels.length >= 6 ? 999 : ai.parcels.length + 1;
      const humanActiveSabotages = Object.values(human.sabotages).filter(v => v > 0).length;

      if (party.isRoguelike && (party.p1Contacts || []).includes('contact_soplon')) {
        let planned = "Pasar Turno";
        if (ai.coins >= 5 && ai.prestige + 2 >= maf.winScore) planned = "Sobornar Político";
        else if (ai.coins >= nextParcelCost && ai.parcels.length < 6) planned = "Controlar Nuevo Distrito";
        else if (ai.coins >= 3 && humanActiveSabotages < 3) planned = "Lanzar Redada Policial";
        cLog(`🕵️ Soplón Infiltrado revela: La IA planea en Imperio: ${planned}.`);
      }

      if (ai.coins >= 5 && ai.prestige + 2 >= maf.winScore) {
        mafActionBrew();
      } else if (ai.coins >= nextParcelCost && ai.parcels.length < 6) {
        let freeParcels = [1, 2, 3, 4, 5, 6].filter(i => !ai.parcels.includes(i));
        if (freeParcels.length > 0) {
          const choice = freeParcels[Math.floor(Math.random() * freeParcels.length)];
          aiBuyParcelDirect(choice);
        } else {
          mafActionPass();
        }
      } else if (ai.coins >= 5 && Math.random() < 0.6) {
        mafActionBrew();
      } else if (ai.coins >= 3 && humanActiveSabotages < 3 && human.parcels.some(i => human.sabotages[i] === 0)) {
        const hasPoliceProtection = (party.p1Contacts || []).includes('contact_policia');
        const blockedByPolice = hasPoliceProtection && deterministicChance(80, `ia-redada|${maf.round}|${human.parcels.join(',')}`);
        if (blockedByPolice) {
          cLog(`🚓 ¡PROTECCIÓN POLICIAL! La Redada de la IA fue interceptada (80%).`);
          mafActionPass();
        } else {
          let validSabotages = human.parcels.filter(i => human.sabotages[i] === 0);
          if (validSabotages.length > 0) {
            const choice = validSabotages[Math.floor(Math.random() * validSabotages.length)];
            aiSabotageParcelDirect(choice);
          } else {
            mafActionPass();
          }
        }
      } else {
        mafActionPass();
      }
    }
  } else if (party.currentGame === 'pok') {
    const ai = pok.p2;
    const human = pok.p1;
    const canTahur = party.isParty ? (ai.tahurUsos < 1) : (ai.tahurCD === 0);

    if (party.isRoguelike && (party.p1Contacts || []).includes('contact_soplon')) {
      let planned = "Apuesta Básica";
      if (canTahur && human.tokens >= 2) planned = "Trampa de Tahúr";
      else if (ai.tokens >= 5) planned = "Golpe a la Mesa";
      cLog(`🕵️ Soplón Infiltrado revela: La IA planea en el Póker: ${planned}.`);
    }

    if (canTahur && human.tokens >= 1 && Math.random() < 0.5) {
      pokAction('tahur');
    } else if (ai.tokens >= 3 && human.tokens >= 1 && Math.random() < 0.45) {
      pokAction('golpe');
    } else if (ai.tokens >= 1 && human.tokens >= 1) {
      pokAction('apuesta');
    } else {
      cLog(`🎰 ${party.p2Name} no tiene suficiente capital para apostar.`);
      nextTurnPOK();
    }
  }
}

async function aiBuyParcelDirect(val) {
  party.isWaiting = true; updateUI_MAF();
  const cost = maf.p2.parcels.length + 1;
  await showActionModal(2, "¡DISTRITO CONTROLADO!", "maf_buy", "anim-slam", 1200);
  maf.p2.coins = Math.max(0, maf.p2.coins - cost);
  maf.p2.parcels.push(val);
  maf.p2.parcels.sort((a, b) => a - b);
  cLog(`🏢 ${party.p2Name} toma el control del Distrito [${val}].`);
  playSound('coin');
  spawnFloatingText('maf-m2-box', `+DISTRITO [${val}]`, 'loot');
  spawnParticles('maf-m2-box', 'growth');
  nextTurnMAF();
}

async function aiSabotageParcelDirect(val) {
  party.isWaiting = true; updateUI_MAF();
  try {
    const turns = await roll(4, `${party.p2Name}: Duración de la Redada`, null, 'maf_raid', 'anim-slide');
    maf.p2.coins = Math.max(0, maf.p2.coins - 3);
    maf.p1.sabotages[val] = turns;
    cLog(`🚨 ¡SOPLO! ${party.p2Name} envía una redada policial al Distrito [${val}] rival por ${turns} rondas.`);
    playSound('crit');
    await triggerHitstop(140);
    triggerScreenShake();
    triggerVibrate([80, 50, 120]);
    spawnFloatingText('maf-m1-box', `REDADA [${val}]`, 'status');
    spawnParticles('maf-m1-box', 'poison');
    party.isWaiting = false;
    nextTurnMAF();
  } catch(e) {
    party.isWaiting = false; updateUI_MAF();
  }
}

async function initRPG() {
  rpg.round = 1; rpg.turn = 1;
  [rpg.p1, rpg.p2].forEach(p => { p.poison = 0; p.heals = 0; p.blocked = false; });
  party.isWaiting = true; updateUI_RPG();
  document.getElementById('rpg-log-box').innerHTML = '';
  
  try {
    cLog("🎲 Generando Salud inicial de los Capos...");
    rpg.p1.hp = await roll(6, "Salud Inicial "+party.p1Name, party.p1Color, 'idle', 'anim-bounce') 
              + await roll(6, "Salud Inicial "+party.p1Name, party.p1Color, 'idle', 'anim-bounce') 
              + await roll(6, "Salud Inicial "+party.p1Name, party.p1Color, 'idle', 'anim-bounce') + 10;
    rpg.p1.max = rpg.p1.hp;
    updateUI_RPG();

    rpg.p2.hp = await roll(6, "Salud Inicial "+party.p2Name, party.p2Color, 'idle', 'anim-bounce') 
              + await roll(6, "Salud Inicial "+party.p2Name, party.p2Color, 'idle', 'anim-bounce') 
              + await roll(6, "Salud Inicial "+party.p2Name, party.p2Color, 'idle', 'anim-bounce') + 10;
    rpg.p2.max = rpg.p2.hp;
    updateUI_RPG();

    if (party.cityEvent === 'carnicero') {
      if (party.carniceroBoss === 1) { rpg.p1.hp += 10; rpg.p1.max = rpg.p1.hp; }
      else { rpg.p2.hp += 10; rpg.p2.max = rpg.p2.hp; }
    }
    
    applyInitGameContacts(1, rpg.p1);
    applyInitGameContacts(2, rpg.p2);

    party.isWaiting = false; updateUI_RPG();
    cLog(`🔫 ¡Empieza el tiroteo por el territorio! Turno de ${party.p1Name}`);
  } catch(e) {
    party.isWaiting = false; updateUI_RPG();
  }
}

window.rpgAction = async function(type) {
  if (party.isWaiting) return;
  party.isWaiting = true; updateUI_RPG();

  const pNum = rpg.turn;
  const att = rpg.turn === 1 ? rpg.p1 : rpg.p2;
  const def = rpg.turn === 1 ? rpg.p2 : rpg.p1;
  const attName = rpg.turn === 1 ? party.p1Name : party.p2Name;
  const defName = rpg.turn === 1 ? party.p2Name : party.p1Name;
  const attBar = rpg.turn === 1 ? 'rpg-p1-bar-container' : 'rpg-p2-bar-container';
  const attBox = rpg.turn === 1 ? 'rpg-m1-box' : 'rpg-m2-box';
  const defBox = rpg.turn === 1 ? 'rpg-m2-box' : 'rpg-m1-box';

  try {
    if (type === 'heal') {
      att.heals++;
      let h = await roll(8, `${attName}: Médico Matasanos`, null, 'rpg_doctor', 'anim-bounce');
      
      if (party.cityEvent === 'ley_seca') h = Math.max(1, Math.floor(h * 0.5));
      const currentContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
      if (currentContacts.includes('contact_arquitecto')) h = Math.floor(h * 1.10);
      if (currentContacts.includes('contact_matasanos')) h = Math.floor(h * 1.5);

      att.hp += h; cLog(`💚 Médico de calle: ${attName} recupera +${h} de Salud.`);
      
      playSound('heal');
      spawnFloatingText(attBox, `+${h} SALUD`, 'heal');
      spawnParticles(attBox, 'heal'); await triggerAnimation(attBar, 'anim-bar-heal');
      if (att.heals >= 3) { att.blocked = true; att.heals = 0; cLog("🚫 Médico bloqueado (Max 3 visitas seguidas)."); }
    } else {
      if (att.blocked) { att.blocked = false; cLog(`🔄 Médico Matasanos vuelve a estar disponible.`); }
      att.heals = 0;
      
      if (type === 'quick') {
        let dmg = await roll(6, `${attName}: Ráfaga Tommy Gun`, null, 'rpg_tommy', 'anim-tommy');
        if (party.cityEvent === 'purga') dmg += 2; 
        await applyDmgRPG(dmg, 0, att, def, attName, defName, 'quick', pNum);
      } else if (type === 'strong') {
        const acc = await roll(20, `${attName}: Francotirador (Req. 11+)`, null, 'rpg_sniper', 'anim-recoil', 'sniper_reload');
        if (acc >= 11) {
          if (acc === 20) { triggerScreenShake(); }
          let baseDmg = await roll(12, `${attName}: Daño Francotirador`, null, 'rpg_sniper', 'anim-recoil', 'sniper_shot');
          if (party.cityEvent === 'purga') baseDmg += 2; 
          let critBonus = 0;
          
          if (acc === 20) {
            if (baseDmg + 2 <= def.hp) {
              critBonus = 2;
              cLog(`🎯 ¡TIRO PERFECTO (d20 = 20)! +2 de daño crítico extra.`);
              spawnFloatingText(defBox, `🎯 -2 CRÍTICO!`, 'crit');
            } else {
              cLog(`🎯 ¡TIRO PERFECTO (d20 = 20)! Daño calibrado para remate exacto.`);
            }
          }

          await applyDmgRPG(baseDmg, critBonus, att, def, attName, defName, 'strong', pNum);
        } else { 
          cLog(`💨 ¡El francotirador de ${attName} falló el tiro! (Sacó ${acc})`); 
          resetCombo(pNum);
        }
      } else if (type === 'poison') {
        const defPlayerNum = pNum === 1 ? 2 : 1;
        const defContacts = defPlayerNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);

        if (party.isRoguelike && defContacts.includes('contact_arquitecto') && !def.bunkerUsed) {
          def.bunkerUsed = true;
          cLog(`🏛️ ¡RED DE PROTECCIÓN! El Infiltrar Soplón de ${attName} fue bloqueado.`);
          spawnFloatingText(defBox, `🏛️ BLOQUEADO`, 'status');
          playSound('hit');
        } else if (party.isRoguelike && defContacts.includes('contact_policia') && deterministicChance(80, `soplon|${defPlayerNum}|${rpg.round}`)) {
          cLog(`🚓 ¡PROTECCIÓN POLICIAL! El Soplón fue interceptado (80%).`);
          spawnFloatingText(defBox, `🚓 INTERCEPTADO`, 'status');
          playSound('hit');
        } else {
          const turns = await roll(4, `${attName}: Infiltrar Soplón`, null, 'rpg_rat', 'anim-slide');
          def.poison = turns; cLog(`🕵️‍♂️ ${attName} infiltra a un soplón por ${turns} rondas.`);
          spawnFloatingText(defBox, `SOPLÓN`, 'status');
          addCombo(pNum);
        }
      }
    }

    if (def.hp <= 0 || att.hp <= 0) return;

    const poisonedPlayers = [
      { num: 1, state: rpg.p1, box: 'rpg-m1-box', bar: 'rpg-p1-bar-container', name: party.p1Name },
      { num: 2, state: rpg.p2, box: 'rpg-m2-box', bar: 'rpg-p2-bar-container', name: party.p2Name }
    ];

    for (const poisoned of poisonedPlayers) {
      if (poisoned.state.poison > 0 && poisoned.state.hp > 0) {
        poisoned.state.hp -= 1;
        poisoned.state.poison--;
        poisoned.state.tookDamageThisTurn = true;
        cLog(`🧪 ¡El soplón filtra información de ${poisoned.name} al finalizar el turno! (-1 SALUD). Quedan ${poisoned.state.poison} rd.`);
        playSound('hit');
        spawnFloatingText(poisoned.box, `-1 SALUD`, 'status');
        spawnParticles(poisoned.box, 'poison');
        await triggerAnimation(poisoned.bar, 'anim-bar-poison');
      }
    }

    const p1DeadByPoison = rpg.p1.hp <= 0;
    const p2DeadByPoison = rpg.p2.hp <= 0;
    if (p1DeadByPoison || p2DeadByPoison) {
      rpg.p1.hp = Math.max(0, rpg.p1.hp);
      rpg.p2.hp = Math.max(0, rpg.p2.hp);
      if (p1DeadByPoison && p2DeadByPoison) return endRPG('tie');
      return endRPG(p1DeadByPoison ? 'p2' : 'p1');
    }
    
    const attContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
    if (party.isRoguelike && attContacts.includes('contact_extorsionador') && !att.tookDamageThisTurn) {
      if (pNum === 1) party.p1Coins = (party.p1Coins || 0) + 10;
      else party.p2Coins = (party.p2Coins || 0) + 10;
      cLog(`💼 Extorsionador de Barrio: ${attName} gana +10💲 por finalizar el turno sin recibir daño.`);
      spawnFloatingText(attBox, `+10💲 EXTORSIONADOR`, 'loot');
    }
    att.tookDamageThisTurn = false;

    party.isWaiting = false;
    rpg.turn = rpg.turn === 1 ? 2 : 1;

    if (rpg.turn === 1) rpg.round++;
    updateUI_RPG();
  } catch(e) {
    party.isWaiting = false; updateUI_RPG();
  }
};

async function applyDmgRPG(baseDmg, critBonus, att, def, attName, defName, type, pNum) {
  const defBar = rpg.turn === 1 ? 'rpg-p2-bar-container' : 'rpg-p1-bar-container';
  const defBox = rpg.turn === 1 ? 'rpg-m2-box' : 'rpg-m1-box';
  const attContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const defContacts = pNum === 1 ? (party.p2Contacts || []) : (party.p1Contacts || []);

  const comboMult = pNum === 1 ? (party.p1Combo || 1.0) : (party.p2Combo || 1.0);
  let totalDmg = Math.round((baseDmg + critBonus) * comboMult);
  if (party.cityEvent === 'carnicero' && pNum !== party.carniceroBoss && def === (party.carniceroBoss === 1 ? rpg.p1 : rpg.p2)) {
    totalDmg += 1;
    spawnFloatingText(defBox, `+1 DAÑO CARNICERO`, 'status');
  }

  if (party.isRoguelike && defContacts.includes('contact_chofer') && def.max > 0 && (def.hp / def.max) < 0.25) {
    totalDmg = Math.max(1, totalDmg - 2);
    spawnFloatingText(defBox, `-2 DEF CHÓFER`, 'status');
  }
  
  if (totalDmg > def.hp) {
    cLog(`🛡️ Disparo anulado por sobredaño (${totalDmg} > ${def.hp} HP restante).`); 
    resetCombo(pNum);
    playSound('hit');
    spawnFloatingText(defBox, `🛡️ ANULADO`, 'status');
  } else {
    def.hp -= totalDmg;
    def.tookDamageThisTurn = true; 
    party.lastDmgToRPG = { target: pNum === 1 ? 2 : 1, amount: totalDmg };
    cLog(`💥 ${attName} acierta e inflige ${totalDmg} de daño a ${defName}. (Mult: x${comboMult.toFixed(1)})`);
    addCombo(pNum);

    if (party.isRoguelike && attContacts.includes('contact_quimico') && (critBonus > 0 || type === 'strong')) {
      def.poison = 3;
      cLog(`🧪 ¡El Químico Corruptor de ${attName} envenena al rival por 3 rondas!`);
      spawnFloatingText(defBox, `VENENO 🧪`, 'status');
    }

    if (type === 'strong' || totalDmg >= 8 || def.hp === 0) {
      playSound('crit');
      await triggerHitstop(140);
      triggerScreenShake();
      triggerVibrate([80, 50, 120]);
    } else {
      playSound('hit');
      triggerVibrate(40);
    }
    spawnFloatingText(defBox, `-${totalDmg} SALUD`, 'dmg');
    spawnParticles(defBox, type); await triggerAnimation(defBar, type==='strong'?'anim-bar-strong':'anim-bar-quick');
    if (def.hp === 0) return endRPG(rpg.turn === 1 ? 'p1' : 'p2');
  }
}

function endRPG(winnerCode) {
  party.isWaiting = true; updateUI_RPG();
  handleMiniGameEnd(winnerCode, "Capo Eliminado");
}

function syncStateToNetwork(actionId = networkLastActionId) {
  if (gameMode !== 'online' || !isHost || !roomPath) return;

  const { abortController, actionInProgress, latestNetworkState, ...partySerializable } = party;

  db.ref(roomPath + '/state').set({
    networkMeta: {
      status: 'PLAYING',
      lastActionId: actionId || null,
      rollIndex: netRollIndex,
      lastRollResult: party.lastRollResult || null,
      savedAt: firebase.database.ServerValue.TIMESTAMP
    },
    party: JSON.parse(JSON.stringify(partySerializable)),
    rpg: JSON.parse(JSON.stringify(rpg)),
    exp: JSON.parse(JSON.stringify(exp)),
    maf: JSON.parse(JSON.stringify(maf)),
    pok: JSON.parse(JSON.stringify(pok))
  });
}

function applyNetworkState() {
  if (!party.latestNetworkState) return;
  const data = party.latestNetworkState;
  if (!data) return;

  if (data.party) {
    const localTransient = {
      abortController: party.abortController || null,
      actionInProgress: party.actionInProgress || false,
      latestNetworkState: data
    };
    Object.assign(party, data.party);
    party.abortController = localTransient.abortController;
    party.actionInProgress = localTransient.actionInProgress;
    party.latestNetworkState = data;
  }

  if (data.rpg) rpg = data.rpg;
  if (data.exp) exp = data.exp;
  if (data.maf) maf = data.maf;
  if (data.pok) pok = data.pok;

  if (data.networkMeta) {
    party.lastRollResult = data.networkMeta.lastRollResult || party.lastRollResult || null;
  }

  if (party.currentGame) {
    document.body.className = `theme-${party.currentGame}`;
    document.getElementById('rpg-container').classList.toggle('hidden', party.currentGame !== 'rpg');
    document.getElementById('exp-container').classList.toggle('hidden', party.currentGame !== 'exp');
    document.getElementById('maf-container').classList.toggle('hidden', party.currentGame !== 'maf');
    document.getElementById('pok-container').classList.toggle('hidden', party.currentGame !== 'pok');
  }

  document.querySelectorAll('.p1-display-name').forEach(el => el.innerText = party.p1Name || 'P1');
  document.querySelectorAll('.p2-display-name').forEach(el => el.innerText = party.p2Name || 'P2');

  const scoreBar = document.getElementById('party-score-bar');
  if (scoreBar) scoreBar.classList.toggle('hidden', !party.isParty);
  const p1Val = document.getElementById('global-p1-val');
  const p2Val = document.getElementById('global-p2-val');
  if (p1Val) p1Val.innerText = party.p1Wins || 0;
  if (p2Val) p2Val.innerText = party.p2Wins || 0;

  if (party.isParty) {
    const indicator = document.getElementById('party-match-indicator');
    if (indicator && party.currentGame) {
      indicator.innerText = `CONTRATO ${party.matchesPlayed + 1} DE ${party.totalMatches} (${gameTitles[party.currentGame]})`;
    }
  }

  if (party.currentGame === 'rpg') renderUI_RPG_Only();
  else if (party.currentGame === 'exp') renderUI_EXP_Only();
  else if (party.currentGame === 'maf') renderUI_MAF_Only();
  else if (party.currentGame === 'pok') renderUI_POK_Only();

  updateDeckHUD();

  if (party.uiStage === 'market') {
    document.getElementById('win-overlay').classList.add('hidden');
    renderBlackMarket();
    document.getElementById('modal-market').classList.remove('hidden');
  } else if (party.uiStage === 'result') {
    document.getElementById('modal-market').classList.add('hidden');

    const winnerCode = party.lastWinnerCode || 'tie';
    const winnerName = winnerCode === 'p1' ? party.p1Name : winnerCode === 'p2' ? party.p2Name : 'EMPATE';
    const scoreText = party.lastScoreText || '';
    const title = document.getElementById('final-winner-name');
    const msg = document.getElementById('final-winner-msg');
    const btn = document.getElementById('btn-next-match');
    const winsNeeded = Math.floor(party.totalMatches / 2) + 1;
    const isPartyOver = party.isParty && (party.p1Wins >= winsNeeded || party.p2Wins >= winsNeeded || party.matchesPlayed >= party.totalMatches);
    const isHostOrLocal = (gameMode === 'local' || gameMode === 'solo') || isHost;

    setWinOverlayAvatars(winnerCode);

    if (!party.isParty) {
      title.innerText = winnerName.toUpperCase();
      msg.innerText = `FIN DEL JUEGO - ${scoreText}`;
      btn.innerText = isHostOrLocal ? 'VOLVER A LOS NEGOCIOS' : 'ESPERANDO AL CAPO 1...';
      btn.disabled = !isHostOrLocal;
      btn.onclick = () => { if (isHostOrLocal) dispatchAction('networkReturnToMenu'); };
    } else if (isPartyOver) {
      let grandWinner = '¡EMPATE TOTAL!';
      if (party.p1Wins > party.p2Wins) grandWinner = party.p1Name;
      else if (party.p2Wins > party.p1Wins) grandWinner = party.p2Name;
      title.innerText = grandWinner.toUpperCase();
      msg.innerText = `🏆 JEFE ABSOLUTO (${party.p1Wins} - ${party.p2Wins})`;
      btn.innerText = isHostOrLocal ? 'VOLVER A LOS NEGOCIOS' : 'ESPERANDO AL CAPO 1...';
      btn.disabled = !isHostOrLocal;
      btn.onclick = () => { if (isHostOrLocal) dispatchAction('networkReturnToMenu'); };
    } else {
      title.innerText = winnerName.toUpperCase();
      msg.innerText = `Gana este contrato de ${gameTitles[party.currentGame]} (${scoreText})`;
      const nextAction = party.isRoguelike ? 'openBlackMarket' : 'networkNextGame';
      btn.innerText = isHostOrLocal ? (party.isRoguelike ? 'IR AL MERCADO NEGRO' : 'SIGUIENTE CONTRATO ➔') : 'ESPERANDO AL CAPO 1...';
      btn.disabled = !isHostOrLocal;
      btn.onclick = () => { if (isHostOrLocal) dispatchAction(nextAction); };
    }

    document.getElementById('win-overlay').classList.remove('hidden');
  } else {
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('modal-market').classList.add('hidden');
  }
}

function renderUI_RPG_Only() {
  const roundEl = document.getElementById('round-indicator');
  if (roundEl) roundEl.innerText = `RONDA ${rpg.round} (GUERRA DE BANDAS)`;

  const m1Box = document.getElementById('rpg-m1-box');
  const m2Box = document.getElementById('rpg-m2-box');

  if (m1Box) {
    m1Box.classList.toggle('active-turn', rpg.turn === 1);
    m1Box.classList.toggle('status-poisoned', rpg.p1.poison > 0);
    m1Box.classList.toggle('low-hp-warning', rpg.p1.max > 0 && (rpg.p1.hp / rpg.p1.max < 0.25));
  }
  if (m2Box) {
    m2Box.classList.toggle('active-turn', rpg.turn === 2);
    m2Box.classList.toggle('status-poisoned', rpg.p2.poison > 0);
    m2Box.classList.toggle('low-hp-warning', rpg.p2.max > 0 && (rpg.p2.hp / rpg.p2.max < 0.25));
  }

  const hp1 = document.getElementById('rpg-p1-hp-label');
  const hp2 = document.getElementById('rpg-p2-hp-label');
  if (hp1) hp1.innerText = `${rpg.p1.hp}/${rpg.p1.max} SALUD`;
  if (hp2) hp2.innerText = `${rpg.p2.hp}/${rpg.p2.max} SALUD`;

  const p1Bar = document.getElementById('rpg-p1-bar');
  const p2Bar = document.getElementById('rpg-p2-bar');
  if (p1Bar) p1Bar.style.width = Math.max(0, (rpg.p1.hp / Math.max(rpg.p1.max, rpg.p1.hp||1) * 100)) + '%';
  if (p2Bar) p2Bar.style.width = Math.max(0, (rpg.p2.hp / Math.max(rpg.p2.max, rpg.p2.hp||1) * 100)) + '%';

  const att = rpg.turn === 1 ? rpg.p1 : rpg.p2;
  const badgeH = document.getElementById('rpg-badge-h');
  if (badgeH) badgeH.innerText = `${att.heals}/3`;

  const dis = party.isWaiting || !isMyTurnNetwork();
  const btnQ = document.getElementById('rpg-btn-q');
  const btnS = document.getElementById('rpg-btn-s');
  const btnH = document.getElementById('rpg-btn-h');
  const btnP = document.getElementById('rpg-btn-p');
  const def = rpg.turn === 1 ? rpg.p2 : rpg.p1;
  if (btnQ) btnQ.disabled = dis;
  if (btnS) btnS.disabled = dis;
  if (btnH) btnH.disabled = dis || rpg.round === 1 || att.blocked;
  if (btnP) btnP.disabled = dis || def.poison > 0;
}

function renderUI_EXP_Only() {
  const roundEl = document.getElementById('round-indicator');
  if (roundEl) roundEl.innerText = `RONDA ${exp.round} (EL GRAN ATRACO)`;
  const diveEl = document.getElementById('exp-dive-indicator');
  if (diveEl) diveEl.innerText = party.isParty ? 'ATRACO ÚNICO' : `ATRACO ${exp.dive}/${exp.maxDives}`;

  const sec1 = document.getElementById('exp-p1-secured');
  const sec2 = document.getElementById('exp-p2-secured');
  if (sec1) sec1.innerText = exp.p1.secured;
  if (sec2) sec2.innerText = exp.p2.secured;

  const m1Box = document.getElementById('exp-m1-box');
  const m2Box = document.getElementById('exp-m2-box');
  if (m1Box) {
    m1Box.classList.toggle('active-turn', exp.turn === 1 && !exp.p1.surfaced);
    m1Box.classList.toggle('surfaced', exp.p1.surfaced);
    m1Box.classList.toggle('low-hp-warning', !exp.p1.surfaced && exp.p1.hp < 5);
  }
  if (m2Box) {
    m2Box.classList.toggle('active-turn', exp.turn === 2 && !exp.p2.surfaced);
    m2Box.classList.toggle('surfaced', exp.p2.surfaced);
    m2Box.classList.toggle('low-hp-warning', !exp.p2.surfaced && exp.p2.hp < 5);
  }

  const hp1 = document.getElementById('exp-p1-hp-label');
  const hp2 = document.getElementById('exp-p2-hp-label');
  if (hp1) hp1.innerText = `${exp.p1.hp}/${exp.p1.max} COB`;
  if (hp2) hp2.innerText = `${exp.p2.hp}/${exp.p2.max} COB`;

  const tLoot1 = document.getElementById('exp-p1-temp-loot');
  const tLoot2 = document.getElementById('exp-p2-temp-loot');
  if (tLoot1) tLoot1.innerText = `💰 ${exp.p1.temp}`;
  if (tLoot2) tLoot2.innerText = `💰 ${exp.p2.temp}`;

  const p1Bar = document.getElementById('exp-p1-bar');
  const p2Bar = document.getElementById('exp-p2-bar');
  if (p1Bar) p1Bar.style.width = Math.max(0, (exp.p1.hp / exp.p1.max * 100)) + '%';
  if (p2Bar) p2Bar.style.width = Math.max(0, (exp.p2.hp / exp.p2.max * 100)) + '%';

  const act = exp.turn === 1 ? exp.p1 : exp.p2;
  const rvl = exp.turn === 1 ? exp.p2 : exp.p1;
  const dis = party.isWaiting || act.surfaced || !isMyTurnNetwork();

  const btnQ = document.getElementById('exp-btn-q');
  const btnS = document.getElementById('exp-btn-s');
  const btnP = document.getElementById('exp-btn-p');
  if (btnQ) btnQ.disabled = dis;
  if (btnS) btnS.disabled = dis;
  if (btnP) btnP.disabled = dis;

  const maxTorpedos = party.isParty ? 1 : 3;
  const sabBadge = document.getElementById('exp-badge-sab');
  const sabBtn = document.getElementById('exp-btn-sab');
  if (sabBadge) sabBadge.innerText = `${act.torpedoUses}/${maxTorpedos}`;
  if (sabBtn) sabBtn.disabled = dis || rvl.surfaced || act.torpedoUses >= maxTorpedos;

  const repBadge = document.getElementById('exp-badge-h');
  const repBtn = document.getElementById('exp-btn-h');
  if (repBadge && repBtn) {
    if (!party.isParty) {
      repBadge.innerText = act.repairUses >= 1 ? `Agotado` : `1/Inv`;
      repBtn.disabled = dis || act.hp >= act.max || act.repairUses >= 1;
    } else {
      repBadge.innerText = act.repairCooldown > 0 ? `Espere ${act.repairCooldown} Rd` : `1/5 Rd`;
      repBtn.disabled = dis || act.hp >= act.max || act.repairCooldown > 0;
    }
  }
}

function renderUI_MAF_Only() {
  const roundEl = document.getElementById('round-indicator');
  if (roundEl) roundEl.innerText = `RONDA ${maf.round} (IMPERIO CRIMINAL)`;

  const m1Box = document.getElementById('maf-m1-box');
  const m2Box = document.getElementById('maf-m2-box');
  if (m1Box) m1Box.classList.toggle('active-turn', maf.turn === 1);
  if (m2Box) m2Box.classList.toggle('active-turn', maf.turn === 2);

  const p1P = document.getElementById('maf-p1-prestige');
  const p2P = document.getElementById('maf-p2-prestige');
  if (p1P) p1P.innerText = `${maf.p1.prestige}/${maf.winScore} INFLUENCIA`;
  if (p2P) p2P.innerText = `${maf.p2.prestige}/${maf.winScore} INFLUENCIA`;

  const p1C = document.getElementById('maf-p1-coins');
  const p2C = document.getElementById('maf-p2-coins');
  if (p1C) p1C.innerText = maf.p1.coins;
  if (p2C) p2C.innerText = maf.p2.coins;

  const p1Bar = document.getElementById('maf-p1-bar');
  const p2Bar = document.getElementById('maf-p2-bar');
  if (p1Bar) p1Bar.style.width = Math.max(0, (maf.p1.prestige / maf.winScore * 100)) + '%';
  if (p2Bar) p2Bar.style.width = Math.max(0, (maf.p2.prestige / maf.winScore * 100)) + '%';

  renderDistricts('maf-p1-parcels', maf.p1);
  renderDistricts('maf-p2-parcels', maf.p2);

  const isWait = party.isWaiting || !isMyTurnNetwork();
  const isRollPhase = maf.phase === 'roll';
  const isActionPhase = maf.phase === 'action';
  const act = maf.turn === 1 ? maf.p1 : maf.p2;
  const rvl = maf.turn === 1 ? maf.p2 : maf.p1;

  const rollSec = document.getElementById('maf-phase-roll');
  const actSec = document.getElementById('maf-phase-action');
  if (rollSec) rollSec.classList.toggle('hidden', !isRollPhase);
  if (actSec) actSec.classList.toggle('hidden', !isActionPhase);

  const nextParcelCost = act.parcels.length >= 6 ? 'MAX' : act.parcels.length + 1;
  const costBuyEl = document.getElementById('maf-cost-buy');
  if (costBuyEl) costBuyEl.innerText = nextParcelCost === 'MAX' ? `Límite Alcanzado` : `Costo: ${nextParcelCost} Efectivo`;

  const rvlActiveSabotages = Object.values(rvl.sabotages).filter(v => v > 0).length;

  const btnSafe = document.getElementById('maf-btn-safe');
  const btnExo = document.getElementById('maf-btn-exotic');
  const btnBuy = document.getElementById('maf-btn-buy');
  const btnBrew = document.getElementById('maf-btn-brew');
  const btnSab = document.getElementById('maf-btn-sab');
  const btnPass = document.getElementById('maf-btn-pass');

  if (btnSafe) btnSafe.disabled = isWait;
  if (btnExo) btnExo.disabled = isWait;
  if (btnBuy) btnBuy.disabled = isWait || nextParcelCost === 'MAX' || act.coins < nextParcelCost;
  if (btnBrew) btnBrew.disabled = isWait || act.coins < 5;
  if (btnSab) btnSab.disabled = isWait || act.coins < 3 || rvlActiveSabotages >= 3;
  if (btnPass) btnPass.disabled = isWait;
}

function renderUI_POK_Only() {
  const roundEl = document.getElementById('round-indicator');
  if (roundEl) roundEl.innerText = `RONDA ${pok.round}/${pok.maxRounds} (APUESTAS CLANDESTINAS)`;

  const m1Box = document.getElementById('pok-m1-box');
  const m2Box = document.getElementById('pok-m2-box');
  if (m1Box) {
    m1Box.classList.toggle('active-turn', pok.turn === 1);
    m1Box.classList.toggle('low-hp-warning', pok.p1.tokens <= 2);
  }
  if (m2Box) {
    m2Box.classList.toggle('active-turn', pok.turn === 2);
    m2Box.classList.toggle('low-hp-warning', pok.p2.tokens <= 2);
  }

  const p1Tok = document.getElementById('pok-p1-tokens');
  const p2Tok = document.getElementById('pok-p2-tokens');
  if (p1Tok) p1Tok.innerText = pok.p1.tokens;
  if (p2Tok) p2Tok.innerText = pok.p2.tokens;

  const act = pok.turn === 1 ? pok.p1 : pok.p2;
  const rvl = pok.turn === 1 ? pok.p2 : pok.p1;
  const dis = party.isWaiting || !isMyTurnNetwork();

  const btnQ = document.getElementById('pok-btn-q');
  const btnS = document.getElementById('pok-btn-s');
  if (btnQ) btnQ.disabled = dis || act.tokens < 1 || rvl.tokens < 1;
  if (btnS) btnS.disabled = dis || act.tokens < 3 || rvl.tokens < 1;

  const tahurBadge = document.getElementById('pok-badge-sab');
  const tahurBtn = document.getElementById('pok-btn-sab');
  if (tahurBadge && tahurBtn) {
    if (party.isParty) {
      tahurBadge.innerText = act.tahurUsos >= 1 ? `Agotado` : `1/Partida`;
      tahurBtn.disabled = dis || act.tahurUsos >= 1 || rvl.tokens <= 0;
    } else {
      tahurBadge.innerText = act.tahurCD > 0 ? `Espera ${act.tahurCD} Rd` : `Activo`;
      tahurBtn.disabled = dis || act.tahurCD > 0 || rvl.tokens <= 0;
    }
  }
}

function updateUI_RPG() {
  document.getElementById('round-indicator').innerText = `RONDA ${rpg.round} (GUERRA DE BANDAS)`;
  
  const m1Box = document.getElementById('rpg-m1-box');
  const m2Box = document.getElementById('rpg-m2-box');

  m1Box.classList.toggle('active-turn', rpg.turn === 1);
  m2Box.classList.toggle('active-turn', rpg.turn === 2);

  m1Box.classList.toggle('status-poisoned', rpg.p1.poison > 0);
  m2Box.classList.toggle('status-poisoned', rpg.p2.poison > 0);

  m1Box.classList.toggle('low-hp-warning', rpg.p1.max > 0 && (rpg.p1.hp / rpg.p1.max < 0.25));
  m2Box.classList.toggle('low-hp-warning', rpg.p2.max > 0 && (rpg.p2.hp / rpg.p2.max < 0.25));

  document.getElementById('rpg-p1-hp-label').innerText = `${rpg.p1.hp}/${rpg.p1.max} SALUD`;
  document.getElementById('rpg-p2-hp-label').innerText = `${rpg.p2.hp}/${rpg.p2.max} SALUD`;

  const p1Bar = document.getElementById('rpg-p1-bar'); const p2Bar = document.getElementById('rpg-p2-bar');
  p1Bar.style.width = Math.max(0, (rpg.p1.hp / Math.max(rpg.p1.max, rpg.p1.hp||1) * 100)) + '%';
  p2Bar.style.width = Math.max(0, (rpg.p2.hp / Math.max(rpg.p2.max, rpg.p2.hp||1) * 100)) + '%';
  
  p1Bar.style.background = rpg.p1.poison > 0 ? 'var(--accent-purple)' : 'var(--accent-red)';
  p2Bar.style.background = rpg.p2.poison > 0 ? 'var(--accent-purple)' : 'var(--accent-red)';

  document.getElementById('rpg-p1-status').innerText = rpg.p1.poison > 0 ? `🕵️‍♂️ Soplón: ${rpg.p1.poison}` : '';
  document.getElementById('rpg-p1-status').style.color = 'var(--accent-purple)';
  document.getElementById('rpg-p2-status').innerText = rpg.p2.poison > 0 ? `🕵️‍♂️ Soplón: ${rpg.p2.poison}` : '';
  document.getElementById('rpg-p2-status').style.color = 'var(--accent-purple)';

  const att = rpg.turn === 1 ? rpg.p1 : rpg.p2;
  document.getElementById('rpg-badge-h').innerText = `${att.heals}/3`;

  const def = rpg.turn === 1 ? rpg.p2 : rpg.p1;
  const dis = party.isWaiting || !isMyTurnNetwork();
  document.getElementById('rpg-btn-q').disabled = dis;
  document.getElementById('rpg-btn-s').disabled = dis;
  document.getElementById('rpg-btn-h').disabled = dis || rpg.round === 1 || att.blocked;
  document.getElementById('rpg-btn-p').disabled = dis || def.poison > 0;

  updateDeckHUD();
  updateHeartbeat();
  checkAiTurn();
}

function initEXP() {
  exp.dive = 1;
  exp.maxDives = party.isParty ? 1 : 3;
  exp.p1.secured = 0; exp.p2.secured = 0;
  document.getElementById('exp-log-box').innerHTML = '';
  startDiveEXP();
}

function startDiveEXP() {
  exp.round = 1; exp.turn = 1;
  [exp.p1, exp.p2].forEach((p, idx) => { 
    const pNum = idx + 1;
    const isCarnicero = (party.cityEvent === 'carnicero' && party.carniceroBoss === pNum);
    p.max = isCarnicero ? 30 : 20;
    p.hp = p.max; p.temp = 0; p.surfaced = false; 
    p.repairUses = 0; p.repairCooldown = 0; p.torpedoUses = 0;
    applyInitGameContacts(pNum, p);
  });
  party.isWaiting = false;
  cLog(`💰 ¡Inicia ${party.isParty ? 'el Atraco Único' : 'Atraco '+exp.dive+' de 3'} a la bóveda!`);
  updateUI_EXP();
}

window.expAction = async function(type) {
  if (party.isWaiting) return;
  party.isWaiting = true; updateUI_EXP();

  const pNum = exp.turn;
  const p = exp.turn === 1 ? exp.p1 : exp.p2;
  const r = exp.turn === 1 ? exp.p2 : exp.p1;
  const pName = exp.turn === 1 ? party.p1Name : party.p2Name;
  const barId = exp.turn === 1 ? 'exp-p1-bar-container' : 'exp-p2-bar-container';
  const boxId = exp.turn === 1 ? 'exp-m1-box' : 'exp-m2-box';
  const comboMult = pNum === 1 ? (party.p1Combo || 1.0) : (party.p2Combo || 1.0);

  try {
    if (type === 'explore') {
      const res = await roll(6, `${pName}: Saquear Cajas Fuertes`, null, 'exp_boxes', 'anim-slide');
      if (res <= 2) {
        let trapDmg = 3;
        if (party.cityEvent === 'purga') trapDmg += 2; 
        if (party.cityEvent === 'carnicero' && pNum === party.carniceroBoss) trapDmg += 1;

        const currentContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
        if (currentContacts.includes('contact_dinamita')) {
            trapDmg += 1;
            cLog(`🧨 ¡Tramposo de la Casa! El fallo de ${pName} se agrava en +1 daño.`);
        }

        p.hp = Math.max(0, p.hp - trapDmg);
        p.tookDamageThisTurn = true;
        cLog(`🚨 ¡Trampa de seguridad! ${pName} pierde ${trapDmg} de cobertura.`);
        resetCombo(pNum);
        playSound('hit');
        triggerVibrate(40);
        spawnFloatingText(boxId, `-${trapDmg} COB`, 'dmg');
        spawnParticles(boxId, 'dmg-light'); await triggerAnimation(barId, 'anim-bar-quick');
      } else {
        const baseLoot = res === 6 ? 3 : 1; 
        const totalLoot = Math.round(baseLoot * comboMult);
        p.temp += totalLoot; 
        cLog(`💵 ${pName} saca ${totalLoot} fajo(s) de billetes.`);
        addCombo(pNum);
        playSound('coin');
        spawnFloatingText(boxId, `+${totalLoot} 💰`, 'loot');
        spawnParticles(boxId, 'loot'); await triggerAnimation(barId, 'anim-bar-loot');
      }
    } else if (type === 'deep') {
      const acc = await roll(20, `${pName}: Destreza (11+)`, null, 'exp_vault', 'anim-slam', 'fuse');
      if (acc >= 11) {
        let baseLoot = await roll(12, `${pName}: Forzar Bóveda`, null, 'exp_vault', 'anim-slam', 'dynamite');
        let critBonus = 0;
        if (acc === 20) {
          critBonus = 2;
          cLog(`🌟 ¡DESTREZA PERFECTA (d20 = 20)! +2 bolsas de botín extra.`);
          spawnFloatingText(boxId, `🌟 +2 CRÍTICO!`, 'crit');
        }
        const totalLoot = Math.round((baseLoot + critBonus) * comboMult);
        p.temp += totalLoot; 
        cLog(`💎 ¡La puerta cede! ${pName} embolsa ${totalLoot} bolsas de botín.`);
        addCombo(pNum);
        playSound('coin');
        triggerScreenShake();
        triggerVibrate(60);
        spawnFloatingText(boxId, `+${baseLoot} 💰`, 'loot');
        spawnParticles(boxId, 'loot'); await triggerAnimation(barId, 'anim-bar-loot');
      } else {
        let coverLoss = 6;
        if (party.cityEvent === 'carnicero' && pNum === party.carniceroBoss) coverLoss += 1;
        cLog(`🚨 ¡Fallo! Se activa la alarma pesada. ${pName} recibe ${coverLoss} de daño a cobertura.`);
        p.hp = Math.max(0, p.hp - coverLoss);
        p.tookDamageThisTurn = true;
        resetCombo(pNum);
        playSound('crit');
        await triggerHitstop(140);
        triggerScreenShake();
        triggerVibrate([80, 50, 120]);
        spawnFloatingText(boxId, `-${coverLoss} COB`, 'dmg');
        spawnParticles(boxId, 'dmg-heavy'); await triggerAnimation(barId, 'anim-bar-strong');
      }
    } else if (type === 'repair') {
      if (!party.isParty) p.repairUses++;
      else p.repairCooldown = 5; 

      let h = await roll(4, `${pName}: Reforzar Cobertura`, null, 'exp_cover', 'anim-bounce');
      if (party.cityEvent === 'ley_seca') h = Math.max(1, Math.floor(h * 0.5));
      
      const currentContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
      if (currentContacts.includes('contact_matasanos')) h = Math.floor(h * 1.5);

      p.hp = Math.min(p.max, p.hp + h); cLog(`🔧 ${pName} se atrinchera y recupera ${h} de Cobertura.`);
      
      playSound('heal');
      spawnFloatingText(boxId, `+${h} COB`, 'heal');
      spawnParticles(boxId, 'repair'); await triggerAnimation(barId, 'anim-bar-heal');

    } else if (type === 'sabotage') {
      p.torpedoUses++;
      let dmg = await roll(4, `${pName}: Lanzar Granada`, null, 'exp_grenade', 'anim-recoil');
      const pContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
      if (party.isRoguelike && pContacts.includes('contact_maton') && !p.matonAbilityUsed) {
        dmg += 2;
        p.matonAbilityUsed = true;
        cLog(`🥊 ¡Matón a Sueldo! El primer Lanzar Granada de ${pName} recibe +2 al d4.`);
        spawnFloatingText(boxId, `+2 MATÓN`, 'crit');
      }
      if (party.cityEvent === 'purga') dmg += 2; 
      if (party.cityEvent === 'carnicero' && pNum === party.carniceroBoss) dmg += 1; 

      if (party.cityEvent === 'carnicero' && r === (party.carniceroBoss === 1 ? exp.p1 : exp.p2)) {
        dmg += 1;
        spawnFloatingText(exp.turn === 1 ? 'exp-m2-box' : 'exp-m1-box', `+1 DAÑO CARNICERO`, 'status');
      }

      const rContacts = pNum === 1 ? (party.p2Contacts || []) : (party.p1Contacts || []);
      if (party.isRoguelike && rContacts.includes('contact_chofer') && r.max > 0 && (r.hp / r.max) < 0.25) {
        dmg = Math.max(1, dmg - 2);
        spawnFloatingText(exp.turn === 1 ? 'exp-m2-box' : 'exp-m1-box', `-2 DEF CHÓFER`, 'status');
      }

      r.hp = Math.max(0, r.hp - dmg);
      r.tookDamageThisTurn = true;
      party.lastGrenadeDmg = { target: pNum === 1 ? 2 : 1, amount: dmg };
      cLog(`💣 ¡SABOTAJE! ${pName} lanza una granada causando ${dmg} daños a la huida rival.`);
      addCombo(pNum);
      playSound('crit');
      await triggerHitstop(140);
      triggerScreenShake();
      triggerVibrate([80, 50, 120]);

      const rBox = exp.turn === 1 ? 'exp-m2-box' : 'exp-m1-box';
      const rBar = exp.turn === 1 ? 'exp-p2-bar-container' : 'exp-p1-bar-container';
      spawnFloatingText(rBox, `-${dmg} COB`, 'dmg');
      spawnParticles(rBox, 'dmg-heavy'); await triggerAnimation(rBar, 'anim-bar-strong');
      
      if (r.hp <= 0 && !r.surfaced) {
        r.hp = 0; r.temp = 0; r.surfaced = true;
        cLog(`🚨 ¡Emboscada Policial al Coche Huida rival! Atrapados.`);
        spawnParticles(rBox, 'dmg-heavy');
      }
    } else if (type === 'surface') {
      await showActionModal(pNum, "¡COCHE DE ESCAPE!", "exp_getaway", "anim-slide", 1200);
      p.surfaced = true; p.secured += p.temp;
      cLog(`🚗💨 ${pName} arranca el Coche de Escape y asegura ${p.temp} de botín.`);
      addCombo(pNum);
      playSound('coin');
      spawnFloatingText(boxId, `¡A SALVO!`, 'loot');
      p.temp = 0; spawnParticles(boxId, 'surface');
    }

    if (p.hp <= 0 && !p.surfaced) {
      p.hp = 0; p.temp = 0; p.surfaced = true;
      cLog(`🚨 ¡LA POLICÍA TE ATRAPÓ! Pierdes todo el botín no asegurado.`);
      resetCombo(pNum);
      playSound('crit');
      await triggerHitstop(140);
      triggerScreenShake();
      triggerVibrate([80, 50, 120]);
      spawnParticles(boxId, 'dmg-heavy');
    }

    updateUI_EXP(); nextTurnEXP();
  } catch(e) {
    party.isWaiting = false; updateUI_EXP();
  }
};

function applyComisionadoTax() {
  if (party.cityEvent !== 'comisionado') return;
  let taxed = false;
  const activePNum = getCurrentTurnPlayerNum();
  
  if (party.currentGame === 'maf') {
     const p = activePNum === 1 ? maf.p1 : maf.p2;
     if (p.coins > 0) { p.coins = Math.floor(p.coins * 0.9); taxed = true; }
  } else if (party.currentGame === 'pok') {
     const p = activePNum === 1 ? pok.p1 : pok.p2;
     if (p.tokens > 0) { p.tokens = Math.floor(p.tokens * 0.9); taxed = true; }
  } else if (party.currentGame === 'exp') {
     const p = activePNum === 1 ? exp.p1 : exp.p2;
     if (p.temp > 0) { p.temp = Math.floor(p.temp * 0.9); taxed = true; }
  }
  if (taxed) cLog(`🕵️‍♂️ EL COMISIONADO CORRUPTO confisca el 10% de los fondos de ${activePNum === 1 ? party.p1Name : party.p2Name}.`);
}

function nextTurnEXP() {
  applyComisionadoTax();
  const currentCode = exp.turn;
  const currentP = currentCode === 1 ? exp.p1 : exp.p2;
  const pName = currentCode === 1 ? party.p1Name : party.p2Name;
  const pContacts = currentCode === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const boxId = currentCode === 1 ? 'exp-m1-box' : 'exp-m2-box';

  if (party.isRoguelike && pContacts.includes('contact_extorsionador') && !currentP.tookDamageThisTurn && !currentP.surfaced) {
    if (currentCode === 1) party.p1Coins = (party.p1Coins || 0) + 10;
    else party.p2Coins = (party.p2Coins || 0) + 10;
    cLog(`💼 Extorsionador de Barrio: ${pName} gana +10💲 por finalizar el turno sin recibir daño a su Cobertura.`);
    spawnFloatingText(boxId, `+10💲 EXTORSIONADOR`, 'loot');
  }
  currentP.tookDamageThisTurn = false;

  if (exp.p1.surfaced && exp.p2.surfaced) {
    return finishDiveEXP();
  }

  let nextTurn = currentCode === 1 ? 2 : 1;
  let nextP = nextTurn === 1 ? exp.p1 : exp.p2;

  if (nextP.surfaced) {
    nextTurn = currentCode;
    if (party.isParty && currentP.repairCooldown > 0) currentP.repairCooldown--;
    exp.round++;
  } else if (nextTurn === 1) {
    if (party.isParty) {
      if (exp.p1.repairCooldown > 0) exp.p1.repairCooldown--;
      if (exp.p2.repairCooldown > 0) exp.p2.repairCooldown--;
    }
    exp.round++;
  }

  exp.turn = nextTurn;
  party.isWaiting = false;
  updateUI_EXP();
}

function finishDiveEXP() {
  party.isWaiting = true; updateUI_EXP();
  
  if (exp.dive >= exp.maxDives) {
    let wCode = 'tie';
    if (exp.p1.secured > exp.p2.secured) wCode = 'p1';
    else if (exp.p2.secured > exp.p1.secured) wCode = 'p2';
    handleMiniGameEnd(wCode, `${exp.p1.secured} vs ${exp.p2.secured} Botín Asegurado`);
  } else {
    let diveWinner = 'tie';
    if (exp.p1.secured > exp.p2.secured) diveWinner = 'p1';
    else if (exp.p2.secured > exp.p1.secured) diveWinner = 'p2';

    setWinOverlayAvatars(diveWinner);

    const overlay = document.getElementById('win-overlay');
    document.getElementById('final-winner-name').innerText = "ATRACO COMPLETADO";
    document.getElementById('final-winner-msg').innerText = `Botín robado: P1(${exp.p1.secured}) | P2(${exp.p2.secured})`;
    const btn = document.getElementById('btn-next-match');
    
    const isHostOrLocal = (gameMode === 'local' || gameMode === 'solo') || isHost;
    btn.innerText = isHostOrLocal ? "SIGUIENTE ATRACO" : "ESPERANDO AL CAPO 1...";
    btn.disabled = !isHostOrLocal;
    btn.style.opacity = isHostOrLocal ? '1' : '0.5';
    btn.onclick = () => { if (isHostOrLocal) dispatchAction('networkNextDive'); };
    
    overlay.classList.remove('hidden');
  }
}

window.networkNextDive = function() {
  document.getElementById('win-overlay').classList.add('hidden');
  exp.dive++;
  startDiveEXP();
}

function updateUI_EXP() {
  document.getElementById('round-indicator').innerText = `RONDA ${exp.round} (EL GRAN ATRACO)`;
  document.getElementById('exp-dive-indicator').innerText = party.isParty ? 'ATRACO ÚNICO' : `ATRACO ${exp.dive}/${exp.maxDives}`;
  
  document.getElementById('exp-p1-secured').innerText = exp.p1.secured;
  document.getElementById('exp-p2-secured').innerText = exp.p2.secured;

  const m1Box = document.getElementById('exp-m1-box');
  const m2Box = document.getElementById('exp-m2-box');

  m1Box.classList.toggle('active-turn', exp.turn === 1 && !exp.p1.surfaced);
  m2Box.classList.toggle('active-turn', exp.turn === 2 && !exp.p2.surfaced);
  m1Box.classList.toggle('surfaced', exp.p1.surfaced);
  m2Box.classList.toggle('surfaced', exp.p2.surfaced);

  m1Box.classList.toggle('low-hp-warning', !exp.p1.surfaced && exp.p1.hp < 5);
  m2Box.classList.toggle('low-hp-warning', !exp.p2.surfaced && exp.p2.hp < 5);

  document.getElementById('exp-p1-hp-label').innerText = `${exp.p1.hp}/${exp.p1.max} COB`;
  document.getElementById('exp-p2-hp-label').innerText = `${exp.p2.hp}/${exp.p2.max} COB`;
  document.getElementById('exp-p1-temp-loot').innerText = `💰 ${exp.p1.temp}`;
  document.getElementById('exp-p2-temp-loot').innerText = `💰 ${exp.p2.temp}`;

  const p1Bar = document.getElementById('exp-p1-bar'); const p2Bar = document.getElementById('exp-p2-bar');
  p1Bar.style.width = Math.max(0, (exp.p1.hp / exp.p1.max * 100)) + '%';
  p2Bar.style.width = Math.max(0, (exp.p2.hp / exp.p2.max * 100)) + '%';
  p1Bar.style.background = exp.p1.hp <= 5 ? 'var(--accent-red)' : 'var(--accent-cyan)';
  p2Bar.style.background = exp.p2.hp <= 5 ? 'var(--accent-red)' : 'var(--accent-cyan)';

  document.getElementById('exp-p1-status').innerText = exp.p1.surfaced ? (exp.p1.hp > 0 ? "✅ A salvo" : "Arrestado") : "🏦 Dentro del banco...";
  document.getElementById('exp-p1-status').style.color = exp.p1.surfaced && exp.p1.hp === 0 ? "var(--accent-red)" : "var(--text-light)";
  document.getElementById('exp-p2-status').innerText = exp.p2.surfaced ? (exp.p2.hp > 0 ? "✅ A salvo" : "Arrestado") : "🏦 Dentro del banco...";
  document.getElementById('exp-p2-status').style.color = exp.p2.surfaced && exp.p2.hp === 0 ? "var(--accent-red)" : "var(--text-light)";

  const act = exp.turn === 1 ? exp.p1 : exp.p2;
  const rvl = exp.turn === 1 ? exp.p2 : exp.p1;
  const dis = party.isWaiting || act.surfaced || !isMyTurnNetwork();

  document.getElementById('exp-btn-q').disabled = dis;
  document.getElementById('exp-btn-s').disabled = dis;
  document.getElementById('exp-btn-p').disabled = dis;
  
  const maxTorpedos = party.isParty ? 1 : 3;
  document.getElementById('exp-badge-sab').innerText = `${act.torpedoUses}/${maxTorpedos}`;
  document.getElementById('exp-btn-sab').disabled = dis || rvl.surfaced || act.torpedoUses >= maxTorpedos;

  const repBadge = document.getElementById('exp-badge-h');
  const repBtn = document.getElementById('exp-btn-h');
  if (!party.isParty) {
    repBadge.innerText = act.repairUses >= 1 ? `Agotado` : `1/Inv`;
    repBtn.disabled = dis || act.hp >= act.max || act.repairUses >= 1;
  } else {
    repBadge.innerText = act.repairCooldown > 0 ? `Espere ${act.repairCooldown} Rd` : `1/5 Rd`;
    repBtn.disabled = dis || act.hp >= act.max || act.repairCooldown > 0;
  }

  updateDeckHUD();
  updateHeartbeat();
  checkAiTurn();
}

async function assignInitialDistricts(playerState, playerName, boxId, playerColor) {
  while (playerState.parcels.length < 2) {
    let r = await roll(6, `${playerName}: Asignando Zona Inicial`, playerColor, 'maf_buy', 'anim-slam');
    if (!playerState.parcels.includes(r)) {
      playerState.parcels.push(r);
      playerState.parcels.sort((a, b) => a - b);
      cLog(`🎲 Destino: ${playerName} controla el Distrito [${r}].`);
      spawnFloatingText(boxId, `DISTRITO [${r}]`, 'loot');
      spawnParticles(boxId, 'growth');
      updateUI_MAF(); 
    } else {
      cLog(`🔄 ${playerName} ya controla el Distrito [${r}]. Se relanza el dado...`);
    }
  }
}

async function initMAF() {
  maf.round = 1; maf.turn = 1; maf.phase = 'roll';
  maf.winScore = party.isParty ? 10 : 15;
  maf.p1.parcels = []; maf.p1.coins = 0; maf.p1.prestige = 0; maf.p1.sabotages = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}; maf.p1.bunkerUsed = false;
  maf.p2.parcels = []; maf.p2.coins = 0; maf.p2.prestige = 0; maf.p2.sabotages = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0}; maf.p2.bunkerUsed = false;
  applyInitGameContacts(1, maf.p1);
  applyInitGameContacts(2, maf.p2);
  document.getElementById('maf-log-box').innerHTML = '';
  
  cLog("ENV La ciudad despierta. Repartiendo territorios...");
  updateUI_MAF();

  party.isWaiting = true;
  try {
    await assignInitialDistricts(maf.p1, party.p1Name, 'maf-m1-box', party.p1Color);
    await assignInitialDistricts(maf.p2, party.p2Name, 'maf-m2-box', party.p2Color);
    party.isWaiting = false;
    updateUI_MAF();
  } catch (e) { 
    party.isWaiting = false; updateUI_MAF(); 
  }
}

window.mafRollHarvest = async function(sides, egoistCheck) {
  if (party.isWaiting) return;
  party.isWaiting = true; updateUI_MAF();

  try {
    const pNum = maf.turn;
    const act = maf.turn === 1 ? maf.p1 : maf.p2;
    const actName = maf.turn === 1 ? party.p1Name : party.p2Name;
    const comboMult = pNum === 1 ? (party.p1Combo || 1.0) : (party.p2Combo || 1.0);

    const actionImg = sides === 6 ? 'maf_safe' : 'maf_risk';
    const actionAnim = sides === 6 ? 'anim-bounce' : 'anim-slam';

    const res = await roll(sides, `Recaudación ${sides === 6 ? 'Segura (1d6)' : 'Arriesgada (1d12)'}`, null, actionImg, actionAnim);
    
    if (egoistCheck) {
      act.coins = Math.max(0, act.coins - 1);
      cLog(`🔥 ${actName} paga 1💵 y procede a LAVAR DINERO (Solo él cobra).`);
    }

    let logStr = `🎲 Cobro en el Distrito <b>[${res}]</b>: <br>`;
    const playersToHarvest = egoistCheck ? [act] : [maf.p1, maf.p2];

    let anySuccess = false;

    if (sides === 6 && party.cityEvent === 'inspectores' && deterministicChance(50, `inspectores|${res}|${pNum}|${maf.round}`)) {
      logStr += `&nbsp;&nbsp;🚓 ¡INSPECTORES! Redada sorpresiva en el Distrito [${res}]. Nadie cobra.<br>`;
      playSound('hit');
      resetCombo(pNum);
    } else {
      playersToHarvest.forEach((p) => {
        const pName = p === maf.p1 ? party.p1Name : party.p2Name;
        const boxId = p === maf.p1 ? 'maf-m1-box' : 'maf-m2-box';
        
        if (res >= 1 && res <= 6 && p.parcels.includes(res)) {
          if (p.sabotages[res] > 0) {
            logStr += `&nbsp;&nbsp;❌ ${pName} falla (Distrito en Redada).<br>`;
          } else {
          const baseGain = sides === 12 ? 3 : 1;
          let gain = Math.round(baseGain * comboMult);
          if (party.cityEvent === 'inspectores') gain *= 2;
          
          const pContacts = (p === maf.p1) ? (party.p1Contacts || []) : (party.p2Contacts || []);
          if (party.isRoguelike && pContacts.includes('contact_arquitecto')) {
            gain = Math.ceil(gain * 1.10);
          }

          p.coins += gain;
          anySuccess = true;
          logStr += `&nbsp;&nbsp;💵 ${pName} recauda +${gain} Efectivo.<br>`;
          playSound('coin');
          spawnFloatingText(boxId, `+${gain} 💵`, 'coin');
          spawnParticles(boxId, 'coin');
          }
        }
      });
    }

    if (anySuccess) addCombo(pNum);
    else resetCombo(pNum);

    if (sides === 12 && res > 6) {
      logStr += `&nbsp;&nbsp;🚓 Demasiada vigilancia policial. Nadie cobra.<br>`;
      playSound('hit');
      resetCombo(pNum);
    }
    
    cLog(logStr);
    
    maf.phase = 'action'; 
    document.getElementById('maf-egoist-check').checked = false;
    party.isWaiting = false;
    updateUI_MAF();
  } catch(e) {
    party.isWaiting = false; updateUI_MAF();
  }
};

window.openBuyModal = function() {
  const pNum = maf.turn;
  const act = maf.turn === 1 ? maf.p1 : maf.p2;
  const actName = maf.turn === 1 ? party.p1Name : party.p2Name;
  const actBox = maf.turn === 1 ? 'maf-m1-box' : 'maf-m2-box';
  const cost = act.parcels.length + 1; 

  let options = [];
  for (let i = 1; i <= 6; i++) {
    let isOwned = act.parcels.includes(i);
    options.push({
      label: isOwned ? `✅ Distrito ${i} <br><small>[CONTROLADO]</small>` : `Distrito ${i}`,
      value: i,
      disabled: isOwned || act.coins < cost,
      isOwned: isOwned
    });
  }

  openChoiceModal("CONTROLAR DISTRITO", `El costo actual para expandir tu territorio es de ${cost}💵. Elige el Distrito a tomar:`, options, async (val) => {
    act.coins = Math.max(0, act.coins - cost);
    act.parcels.push(val);
    act.parcels.sort((a, b) => a - b);
    updateUI_MAF();
    await showActionModal(pNum, "¡DISTRITO CONTROLADO!", "maf_buy", "anim-slam", 1200);
    cLog(`🏢 ${actName} toma el control del Distrito [${val}].`);
    addCombo(pNum);
    playSound('coin');
    spawnFloatingText(actBox, `+DISTRITO [${val}]`, 'loot');
    spawnParticles(actBox, 'growth');
    nextTurnMAF();
  });
};

window.openSabotageModal = function() {
  const pNum = maf.turn;
  const act = maf.turn === 1 ? maf.p1 : maf.p2;
  const rvl = maf.turn === 1 ? maf.p2 : maf.p1;
  const actName = maf.turn === 1 ? party.p1Name : party.p2Name;
  const rvlBox = maf.turn === 1 ? 'maf-m2-box' : 'maf-m1-box';

  const rvlActiveSabotages = Object.values(rvl.sabotages).filter(v => v > 0).length;
  if (rvlActiveSabotages >= 3) {
    alert("El rival ya tiene el máximo de 3 distritos en redada simultáneamente.");
    return;
  }

  let options = [];
  const rvlContacts = maf.turn === 1 ? (party.p2Contacts || []) : (party.p1Contacts || []);
  const hasPoliceProtection = rvlContacts.includes('contact_policia');

  for (let i = 1; i <= 6; i++) {
    let isSabotaged = rvl.sabotages[i] > 0;
    let hasParcel = rvl.parcels.includes(i);

    let lbl = `Distrito ${i}`;
    if (!hasParcel) lbl = `Distrito ${i} <br><small>[NO LO POSEE]</small>`;
    if (isSabotaged) lbl = `Distrito ${i} <br><small>[YA EN REDADA]</small>`;
    if (hasPoliceProtection && hasParcel && !isSabotaged) lbl += ` <br><small>[80% PROTECCIÓN]</small>`;

    options.push({
      label: lbl,
      value: i,
      disabled: !hasParcel || isSabotaged
    });
  }

  if (options.every(o => o.disabled)) {
    alert("El rival no tiene distritos válidos para enviar a la policía.");
    return;
  }

  openChoiceModal("REDADA POLICIAL", "Selecciona el Distrito rival que deseas clausurar temporalmente.", options, async (val) => {
    party.isWaiting = true; updateUI_MAF(); 
    try {
      const rvlContacts = (rvl === maf.p1) ? (party.p1Contacts || []) : (party.p2Contacts || []);
      
      if (party.isRoguelike && rvlContacts.includes('contact_arquitecto') && !rvl.bunkerUsed) {
        rvl.bunkerUsed = true;
        act.coins = Math.max(0, act.coins - 3);
        cLog(`🏛️ ¡RED DE PROTECCIÓN! El búnker absorbió la Redada Policial en el Distrito [${val}].`);
        spawnFloatingText(rvlBox, `🏛️ BLOQUEADO`, 'status');
        playSound('hit');
        party.isWaiting = false;
        return nextTurnMAF();
      }

      if (party.isRoguelike && rvlContacts.includes('contact_policia') && deterministicChance(80, `redada|${val}|${rvl === maf.p1 ? 1 : 2}|${maf.round}`)) {
        cLog(`🚓 ¡PROTECCIÓN POLICIAL! La Redada al Distrito [${val}] fue interceptada (80%).`);
        spawnFloatingText(rvlBox, `🚓 INTERCEPTADA`, 'status');
        playSound('hit');
        party.isWaiting = false;
        return nextTurnMAF();
      }

      const turns = await roll(4, `${actName}: Duración de la Redada`, null, 'maf_raid', 'anim-slide');
      act.coins = Math.max(0, act.coins - 3);
      rvl.sabotages[val] = turns;
      cLog(`🚨 ¡SOPLO! ${actName} envía una redada policial al Distrito [${val}] rival por ${turns} rondas.`);
      addCombo(pNum);
      playSound('crit');
      await triggerHitstop(140);
      triggerScreenShake();
      triggerVibrate([80, 50, 120]);
      spawnFloatingText(rvlBox, `REDADA [${val}]`, 'status');
      spawnParticles(rvlBox, 'poison');
      party.isWaiting = false;
      nextTurnMAF(true);
    } catch(e) {
      party.isWaiting = false; updateUI_MAF();
    }
  });
};

async function triggerQuimicoSpecialRaid(pNum, act, actName) {
  const rvl = pNum === 1 ? maf.p2 : maf.p1;
  const rvlNum = pNum === 1 ? 2 : 1;
  const rvlName = rvlNum === 1 ? party.p1Name : party.p2Name;
  const rvlBox = rvlNum === 1 ? 'maf-m1-box' : 'maf-m2-box';
  const activeRaids = Object.values(rvl.sabotages).filter(v => v > 0).length;
  if (activeRaids >= 3) {
    cLog(`🧪 Químico Corruptor: ${rvlName} ya tiene 3 Redadas activas. No se añade otra.`);
    return false;
  }

  const validDistricts = rvl.parcels.filter(i => rvl.sabotages[i] === 0);
  if (validDistricts.length === 0) return false;

  openChoiceModal(
    "REDADA DEL QUÍMICO",
    `El Químico Corruptor permite una Redada Policial extra. Elige un distrito de ${rvlName}.`,
    validDistricts.map(i => ({ label: `🚨 Distrito ${i}`, value: i, disabled: false })),
    async (val) => {
      const rvlContacts = rvlNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);

      if (party.isRoguelike && rvlContacts.includes('contact_arquitecto') && !rvl.bunkerUsed) {
        rvl.bunkerUsed = true;
        cLog(`🏛️ ¡RED DE PROTECCIÓN! El búnker absorbió la Redada especial del Químico.`);
        spawnFloatingText(rvlBox, `🏛️ BLOQUEADO`, 'status');
        playSound('hit');
        party.isWaiting = false;
        return nextTurnMAF();
      }

      if (party.isRoguelike && rvlContacts.includes('contact_policia') && deterministicChance(80, `quimico-redada|${val}|${rvlNum}|${maf.round}`)) {
        cLog(`🚓 ¡PROTECCIÓN POLICIAL! La Redada especial del Químico fue interceptada (80%).`);
        spawnFloatingText(rvlBox, `🚓 INTERCEPTADA`, 'status');
        playSound('hit');
        party.isWaiting = false;
        return nextTurnMAF();
      }

      const turns = await roll(4, `${actName}: Redada del Químico`, null, 'maf_raid', 'anim-slide');
      rvl.sabotages[val] = turns;
      cLog(`🧪🚨 ¡QUÍMICO CORRUPTOR! ${actName} coloca una Redada gratis en el Distrito [${val}] por ${turns} rondas.`);
      spawnFloatingText(rvlBox, `REDADA [${val}]`, 'status');
      spawnParticles(rvlBox, 'poison');
      playSound('crit');
      party.isWaiting = false;
      nextTurnMAF(true);
    }
  );
  return true;
}

window.mafActionBrew = async function() {
  if (party.isWaiting) return;
  party.isWaiting = true; updateUI_MAF();
  try {
    const pNum = maf.turn;
    const act = maf.turn === 1 ? maf.p1 : maf.p2;
    const actName = maf.turn === 1 ? party.p1Name : party.p2Name;
    const actBox = maf.turn === 1 ? 'maf-m1-box' : 'maf-m2-box';
    const actBar = maf.turn === 1 ? 'maf-p1-bar-container' : 'maf-p2-bar-container';

    const res = await roll(20, `${actName}: Sobornar Político (d20)`, null, 'maf_bribe', 'anim-bounce');
    act.coins = Math.max(0, act.coins - 5);
    
    let pts = 0; let desc = "";
    if (res <= 9) { pts = 1; desc = "Soborno Menor"; }
    else if (res <= 19) { pts = 2; desc = "Trato Jugoso"; }
    else { pts = 4; desc = "¡CONTROL POLÍTICO TOTAL!"; triggerScreenShake(); }

    act.prestige += pts;
    cLog(`🎩 ${desc} (Sacó ${res}). ${actName} gana +${pts} Influencia.`);
    addCombo(pNum);
    playSound('heal');
    spawnFloatingText(actBox, `+${pts} INFLUENCIA`, 'heal');
    
    spawnParticles(actBox, 'brew'); 
    await triggerAnimation(actBar, 'anim-bar-heal');
    
    if (act.prestige >= maf.winScore) {
       act.prestige = maf.winScore; updateUI_MAF(); return endMAF(maf.turn === 1 ? 'p1' : 'p2');
    }

    const brewContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
    if (res === 20 && party.isRoguelike && brewContacts.includes('contact_quimico')) {
      const openedRaidChoice = await triggerQuimicoSpecialRaid(pNum, act, actName);
      if (openedRaidChoice) return;
    }
    
    party.isWaiting = false;
    nextTurnMAF();
  } catch(e) {
    party.isWaiting = false; updateUI_MAF();
  }
};

window.mafActionPass = function() {
  const actName = maf.turn === 1 ? party.p1Name : party.p2Name;
  cLog(`⏳ ${actName} no hace movimientos y guarda su Efectivo.`);
  nextTurnMAF();
};

function nextTurnMAF(skipRaidTick = false) {
  if (!skipRaidTick) {
    [
      { player: maf.p1, name: party.p1Name },
      { player: maf.p2, name: party.p2Name }
    ].forEach(({ player, name }) => {
      for (let i = 1; i <= 6; i++) {
        if (player.sabotages[i] > 0) {
          player.sabotages[i]--;
          if (player.sabotages[i] === 0) {
            cLog(`🏢 El Distrito [${i}] de ${name} reabre sus puertas tras la redada.`);
          }
        }
      }
    });
  }
  applyComisionadoTax();
  const currentCode = maf.turn;
  const currentP = currentCode === 1 ? maf.p1 : maf.p2;
  const pName = currentCode === 1 ? party.p1Name : party.p2Name;
  const pContacts = currentCode === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const boxId = currentCode === 1 ? 'maf-m1-box' : 'maf-m2-box';

  if (party.isRoguelike && pContacts.includes('contact_extorsionador') && !currentP.tookDamageThisTurn) {
    if (currentCode === 1) party.p1Coins = (party.p1Coins || 0) + 10;
    else party.p2Coins = (party.p2Coins || 0) + 10;
    cLog(`💼 Extorsionador de Barrio: ${pName} gana +10💲 por finalizar el turno sin contratiempos.`);
    spawnFloatingText(boxId, `+10💲 EXTORSIONADOR`, 'loot');
  }
  currentP.tookDamageThisTurn = false;

  maf.turn = maf.turn === 1 ? 2 : 1;
  if (maf.turn === 1) maf.round++;
  maf.phase = 'roll'; 
  party.isWaiting = false;
  updateUI_MAF();
}

function endMAF(winnerCode) {
  party.isWaiting = true; updateUI_MAF();
  handleMiniGameEnd(winnerCode, "Dominio Total (Influencia)");
}

function updateUI_MAF() {
  document.getElementById('round-indicator').innerText = `RONDA ${maf.round} (IMPERIO CRIMINAL)`;
  
  maf.p1.coins = Math.max(0, maf.p1.coins);
  maf.p2.coins = Math.max(0, maf.p2.coins);

  document.getElementById('maf-m1-box').classList.toggle('active-turn', maf.turn === 1);
  document.getElementById('maf-m2-box').classList.toggle('active-turn', maf.turn === 2);

  document.getElementById('maf-p1-prestige').innerText = `${maf.p1.prestige}/${maf.winScore} INFLUENCIA`;
  document.getElementById('maf-p2-prestige').innerText = `${maf.p2.prestige}/${maf.winScore} INFLUENCIA`;
  document.getElementById('maf-p1-coins').innerText = maf.p1.coins;
  document.getElementById('maf-p2-coins').innerText = maf.p2.coins;

  const p1Bar = document.getElementById('maf-p1-bar'); const p2Bar = document.getElementById('maf-p2-bar');
  p1Bar.style.width = Math.max(0, (maf.p1.prestige / maf.winScore * 100)) + '%';
  p2Bar.style.width = Math.max(0, (maf.p2.prestige / maf.winScore * 100)) + '%';

  renderDistricts('maf-p1-parcels', maf.p1);
  renderDistricts('maf-p2-parcels', maf.p2);

  const isWait = party.isWaiting || !isMyTurnNetwork();
  const isRollPhase = maf.phase === 'roll';
  const isActionPhase = maf.phase === 'action';
  const act = maf.turn === 1 ? maf.p1 : maf.p2;
  const rvl = maf.turn === 1 ? maf.p2 : maf.p1;

  document.getElementById('maf-phase-roll').classList.toggle('hidden', !isRollPhase);
  document.getElementById('maf-phase-action').classList.toggle('hidden', !isActionPhase);

  const egoistToggle = document.getElementById('maf-egoist-check');
  document.getElementById('egoist-label').style.opacity = act.coins >= 1 ? '1' : '0.5';
  if (act.coins < 1) egoistToggle.checked = false;
  egoistToggle.disabled = party.isWaiting || !isMyTurnNetwork() || act.coins < 1;

  document.getElementById('maf-btn-safe').disabled = isWait;
  document.getElementById('maf-btn-exotic').disabled = isWait;
  
  const nextParcelCost = act.parcels.length >= 6 ? 'MAX' : act.parcels.length + 1;
  document.getElementById('maf-cost-buy').innerText = nextParcelCost === 'MAX' ? `Límite Alcanzado` : `Costo: ${nextParcelCost} Efectivo`;
  
  const rvlActiveSabotages = Object.values(rvl.sabotages).filter(v => v > 0).length;

  document.getElementById('maf-btn-buy').disabled = isWait || nextParcelCost === 'MAX' || act.coins < nextParcelCost; 
  document.getElementById('maf-btn-brew').disabled = isWait || act.coins < 5;
  document.getElementById('maf-btn-sab').disabled = isWait || act.coins < 3 || rvlActiveSabotages >= 3;
  document.getElementById('maf-btn-pass').disabled = isWait;

  updateDeckHUD();
  updateHeartbeat();
  checkAiTurn();
}

function renderDistricts(containerId, playerState) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; 
  
  for (let i = 1; i <= 6; i++) {
    const div = document.createElement('div');
    div.className = 'parcel-box';
    
    if (playerState.parcels.includes(i)) {
      if (playerState.sabotages[i] > 0) {
        div.classList.add('sabotaged');
        div.innerHTML = `${i}<br><span style="font-size:0.7rem; color:var(--text-bright); font-weight: 900;">🚨 ${playerState.sabotages[i]}</span>`;
      } else {
        div.classList.add('active');
        div.innerText = i;
      }
    } else {
      div.innerText = i;
    }
    container.appendChild(div);
  }
}

function initPOK() {
  pok.round = 1; pok.turn = 1; pok.maxRounds = 8;
  let initTokens = party.isParty ? 8 : 12;

  pok.p1 = { tokens: initTokens, tahurCD: 0, tahurUsos: 0 };
  pok.p2 = { tokens: initTokens, tahurCD: 0, tahurUsos: 0 };
  applyInitGameContacts(1, pok.p1);
  applyInitGameContacts(2, pok.p2);
  
  document.getElementById('pok-log-box').innerHTML = '';
  cLog(`🎲 ¡Se abren las mesas clandestinas! Ambos capos inician con ${initTokens} fichas.`);
  cLog(`⚠️ Objetivo: Desplumar al rival en duelos directos durante ${pok.maxRounds} rondas.`);
  party.isWaiting = false;
  updateUI_POK();
}

window.pokAction = async function(type) {
  if (party.isWaiting) return;

  const pNum = pok.turn;
  const p = pok.turn === 1 ? pok.p1 : pok.p2;
  const r = pok.turn === 1 ? pok.p2 : pok.p1;

  if (type === 'apuesta' && (p.tokens < 1 || r.tokens < 1)) {
    cLog(`⚠️ Se requieren al menos 1 ficha por jugador para Apuesta Básica.`);
    return;
  }
  if (type === 'golpe' && (p.tokens < 3 || r.tokens < 1)) {
    cLog(`⚠️ Se requieren al menos 3 fichas para un Golpe a la Mesa.`);
    return;
  }

  party.isWaiting = true; updateUI_POK();
  
  const pName = pok.turn === 1 ? party.p1Name : party.p2Name;
  const rName = pok.turn === 1 ? party.p2Name : party.p1Name;
  const pBox = pok.turn === 1 ? 'pok-m1-box' : 'pok-m2-box';
  const rBox = pok.turn === 1 ? 'pok-m2-box' : 'pok-m1-box';
  const comboMult = pNum === 1 ? (party.p1Combo || 1.0) : (party.p2Combo || 1.0);

  try {
    if(type === 'apuesta') {
        const res = await roll(6, `${pName}: Apuesta (Gana con 4+)`, null, 'pok_bet', 'anim-slide');
        cLog(`🎰 ${pName} arriesga 1 ficha contra ${rName}...`);
        if(res >= 4) {
            const baseStolen = 1;
            const stolen = Math.min(Math.round(baseStolen * comboMult), r.tokens);
            p.tokens += stolen;
            r.tokens -= stolen;
            party.lastTokensStolen = { target: pNum === 1 ? 2 : 1, amount: stolen };
            cLog(`✅ ¡Acierto! ${pName} gana ${stolen} ficha(s) directamente del alijo de ${rName}.`);
            addCombo(pNum);
            playSound('coin');
            spawnFloatingText(pBox, `+${stolen} 🎰`, 'loot');
            spawnFloatingText(rBox, `-${stolen} 🎰`, 'dmg');
            spawnParticles(pBox, 'coin');
        } else {
            const hasDynamite = party.isRoguelike && (pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || [])).includes('contact_dinamita');
            const lost = hasDynamite ? Math.min(2, r.tokens) : Math.min(1, p.tokens);
            if (hasDynamite) {
              r.tokens -= lost;
              cLog(`❌ Falla. 🧨 ${pName} activa al Tramposo de la Casa: ${rName} pierde ${lost} fichas.`);
            } else {
              p.tokens -= lost;
              r.tokens += lost;
              cLog(`❌ Falla. ${rName} gana ${lost} ficha(s) directamente de ${pName}.`);
            }
            resetCombo(pNum);
            playSound('hit');
            spawnFloatingText(pBox, `-${lost} 🎰`, 'dmg');
            spawnFloatingText(rBox, `+${lost} 🎰`, 'loot');
            spawnParticles(pBox, 'dmg-light');
        }
    } else if(type === 'golpe') {
        const acc = await roll(20, `${pName}: Riesgo (Req. 11+)`, null, 'pok_slam', 'anim-slam');
        cLog(`💥 ${pName} arriesga 3 fichas en un golpe directo contra ${rName}...`);
        if(acc >= 11) {
            let baseWin = await roll(12, `${pName}: Ganancias del Golpe`, null, 'pok_slam', 'anim-slam');
            let critBonus = 0;
            if (acc === 20) {
              critBonus = 2;
              cLog(`🎉 ¡GOLPE PERFECTO (d20 = 20)! +2 fichas extra ganadas.`);
              spawnFloatingText(pBox, `🎉 +2 CRÍTICO!`, 'crit');
            }
            let totalWin = Math.round((baseWin + critBonus) * comboMult);

            if (totalWin > r.tokens) {
              cLog(`🛡️ Golpe a la Mesa anulado por exceso (${totalWin} > ${r.tokens} Fichas del rival).`);
              resetCombo(pNum);
              playSound('hit');
              spawnFloatingText(pBox, `🛡️ ANULADO`, 'status');
            } else {
              p.tokens += totalWin;
              r.tokens -= totalWin;

              cLog(`🎉 ¡JACKPOT! ${pName} arrasa la mesa y le roba ${totalWin} fichas a ${rName}.`);
              addCombo(pNum);
              playSound('coin');
              await triggerHitstop(140);
              triggerScreenShake();
              triggerVibrate([80, 50, 120]);
              spawnFloatingText(pBox, `+${totalWin} 🎰`, 'loot');
              spawnFloatingText(rBox, `-${totalWin} 🎰`, 'dmg');
              spawnParticles(pBox, 'loot');
            }
        } else {
            let actualLoss = Math.min(3, p.tokens);
            p.tokens -= actualLoss;
            r.tokens += actualLoss;

            cLog(`💀 Las cosas salen mal. ${rName} gana las ${actualLoss} fichas del riesgo.`);
            resetCombo(pNum);
            playSound('hit');
            spawnFloatingText(pBox, `-${actualLoss} 🎰`, 'dmg');
            spawnFloatingText(rBox, `+${actualLoss} 🎰`, 'loot');
            spawnParticles(pBox, 'dmg-light');
        }
    } else if(type === 'tahur') {
        let steal = await roll(4, `${pName}: Trampa de Tahúr`, null, 'pok_cheat', 'anim-slide');
        const pContacts = pNum === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
        if (party.isRoguelike && pContacts.includes('contact_maton') && !p.matonAbilityUsed) {
          steal += 2;
          p.matonAbilityUsed = true;
          cLog(`🥊 ¡Matón a Sueldo! La primera Trampa de Tahúr de ${pName} recibe +2 al d4.`);
          spawnFloatingText(pBox, `+2 MATÓN`, 'crit');
        }
        p.tahurUsos++;
        if(!party.isParty) p.tahurCD = 3;
        
        const actualSteal = Math.min(steal, r.tokens);
        r.tokens = Math.max(0, r.tokens - actualSteal);
        p.tokens += actualSteal;
        party.lastTokensStolen = { target: pNum === 1 ? 2 : 1, amount: actualSteal };
        cLog(`🎭 ¡TRAMPA! ${pName} hace un juego de manos y roba ${actualSteal} fichas a ${rName}.`);
        addCombo(pNum);
        playSound('coin');
        spawnFloatingText(pBox, `+${actualSteal} 🎰`, 'loot');
        spawnFloatingText(rBox, `-${actualSteal} 🎰`, 'dmg');
        spawnParticles(rBox, 'dmg-heavy');
        setTimeout(() => spawnParticles(pBox, 'coin'), 400);
    }
    
    p.tokens = Math.max(0, p.tokens);
    r.tokens = Math.max(0, r.tokens);

    if (p.tokens === 0 || r.tokens === 0) {
        updateUI_POK();
        let winner = p.tokens === 0 ? (pok.turn === 1 ? 'p2' : 'p1') : (pok.turn === 1 ? 'p1' : 'p2');
        if(p.tokens === 0 && r.tokens === 0) winner = 'tie';
        return endPOK(winner, "Bancarrota Total");
    }
    
    nextTurnPOK();
  } catch(e) {
    party.isWaiting = false; updateUI_POK();
  }
};

function nextTurnPOK() {
  applyComisionadoTax();
  const currentCode = pok.turn;
  const currentP = currentCode === 1 ? pok.p1 : pok.p2;
  const pName = currentCode === 1 ? party.p1Name : party.p2Name;
  const pContacts = currentCode === 1 ? (party.p1Contacts || []) : (party.p2Contacts || []);
  const boxId = currentCode === 1 ? 'pok-m1-box' : 'pok-m2-box';

  if (party.isRoguelike && pContacts.includes('contact_extorsionador') && !currentP.tookDamageThisTurn) {
    if (currentCode === 1) party.p1Coins = (party.p1Coins || 0) + 10;
    else party.p2Coins = (party.p2Coins || 0) + 10;
    cLog(`💼 Extorsionador de Barrio: ${pName} gana +10💲 por finalizar el turno sin perder fichas.`);
    spawnFloatingText(boxId, `+10💲 EXTORSIONADOR`, 'loot');
  }
  currentP.tookDamageThisTurn = false;

  pok.turn = pok.turn === 1 ? 2 : 1;
  const nextP = pok.turn === 1 ? pok.p1 : pok.p2;
  
  if(nextP.tahurCD > 0) nextP.tahurCD--;

  if (pok.turn === 1) {
     pok.round++;
     if (pok.round > pok.maxRounds) {
        let winner = 'tie';
        if (pok.p1.tokens > pok.p2.tokens) winner = 'p1';
        else if (pok.p2.tokens > pok.p1.tokens) winner = 'p2';
        updateUI_POK();
        return endPOK(winner, "Límite de Rondas");
     }
  }
  party.isWaiting = false;
  updateUI_POK();
}

function endPOK(winnerCode, reason) {
   party.isWaiting = true; updateUI_POK();
   handleMiniGameEnd(winnerCode, `Poker: ${reason} (${pok.p1.tokens} vs ${pok.p2.tokens} Fichas)`);
}

function updateUI_POK() {
  document.getElementById('round-indicator').innerText = `RONDA ${pok.round}/${pok.maxRounds} (APUESTAS CLANDESTINAS)`;
  
  const m1Box = document.getElementById('pok-m1-box');
  const m2Box = document.getElementById('pok-m2-box');

  if (m1Box) m1Box.classList.toggle('active-turn', pok.turn === 1);
  if (m2Box) m2Box.classList.toggle('active-turn', pok.turn === 2);

  if (m1Box) m1Box.classList.toggle('low-hp-warning', pok.p1.tokens <= 2);
  if (m2Box) m2Box.classList.toggle('low-hp-warning', pok.p2.tokens <= 2);

  const p1Img = document.getElementById('pok-p1-avatar-img');
  const p2Img = document.getElementById('pok-p2-avatar-img');
  if (p1Img) {
    p1Img.src = `assets/characters/${party.p1Color || 'Color_R'}/idle.png`;
    p1Img.onerror = () => { p1Img.src = `assets/characters/None/idle.png`; };
  }
  if (p2Img) {
    p2Img.src = `assets/characters/${party.p2Color || 'Color_B'}/idle.png`;
    p2Img.onerror = () => { p2Img.src = `assets/characters/None/idle.png`; };
  }

  const p1Tok = document.getElementById('pok-p1-tokens');
  const p2Tok = document.getElementById('pok-p2-tokens');
  if (p1Tok) p1Tok.innerText = pok.p1.tokens;
  if (p2Tok) p2Tok.innerText = pok.p2.tokens;

  const act = pok.turn === 1 ? pok.p1 : pok.p2;
  const rvl = pok.turn === 1 ? pok.p2 : pok.p1;
  const dis = party.isWaiting || !isMyTurnNetwork();

  document.getElementById('pok-btn-q').disabled = dis || act.tokens < 1 || rvl.tokens < 1;
  document.getElementById('pok-btn-s').disabled = dis || act.tokens < 3 || rvl.tokens < 1;

  const tahurBadge = document.getElementById('pok-badge-sab');
  const tahurBtn = document.getElementById('pok-btn-sab');
  if (party.isParty) {
    tahurBadge.innerText = act.tahurUsos >= 1 ? `Agotado` : `1/Partida`;
    tahurBtn.disabled = dis || act.tahurUsos >= 1 || rvl.tokens <= 0;
  } else {
    tahurBadge.innerText = act.tahurCD > 0 ? `Espera ${act.tahurCD} Rd` : `Activo`;
    tahurBtn.disabled = dis || act.tahurCD > 0 || rvl.tokens <= 0;
  }

  updateDeckHUD();
  updateHeartbeat();
  checkAiTurn();
}
