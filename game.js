/**
 * ============================================================================
 * CRIMINAL DICE / CRIMEN URBANO - ENGINE TÁCTICO INTEGRADO
 * Restauración: Sistema de Dados Asíncrono, Modo Party, Roguelike Toggle y Enlace
 * ============================================================================
 */

const CONFIG = {
  MAX_PLAYERS_DEFAULT: 2, MAX_PLAYERS_LIMIT: 4, MAX_HP: 100, STARTING_CASH: 1000, REROLL_COST: 50, MARKET_OFFER_SIZE: 4,
  DISTRICTS: [
    { id: "dist_centro", name: "Distrito Financiero", income: 300, defValue: 5 },
    { id: "dist_puerto", name: "Puerto de Carga", income: 250, defValue: 4 },
    { id: "dist_suburbios", name: "Los Callejones", income: 150, defValue: 2 },
    { id: "dist_casino", name: "Zona de Casinos", income: 400, defValue: 6 }
  ],
  CITY_EVENTS: [
    { id: "guerra_total", name: "Guerra Abierta", desc: "El daño de todas las armas aumenta un 50% este asalto.", dmgMultiplier: 1.5 },
    { id: "redada", name: "Redada Policial", desc: "La policía vigila las esquinas. Ganar dinero cuesta un 20% más.", tax: 0.2 },
    { id: "noche_tranquila", name: "Calma Tensada", desc: "Sin incidentes policiales reportados.", neutral: true }
  ]
};

// Catalogo omitido parcialmente por brevedad, asume que está el tuyo completo...
const MARKET_CATALOG = [
  { id: "informante_sueldo", name: "Informante a Sueldo", cost: 260, type: "passive", desc: "Ganas +$10 o +1 HP cuando el rival falla." },
  { id: "maton_pesado", name: "Matón Pesado", cost: 210, type: "passive", desc: "+2 de daño adicional en armas." },
  { id: "chaleco_kevlar", name: "Chaleco Antibalas", cost: 150, type: "consumable", desc: "Otorga +25 de Escudo protector." },
  { id: "dados_cargados", name: "Dados Trucados", cost: 180, type: "consumable", desc: "Garantiza el valor máximo en tu siguiente tirada." }
];

const localAuth = {
  uid: null, isReady: false, username: "Capo_" + Math.floor(1000 + Math.random() * 9000), color: "Color_R"
};

const gameState = {
  mode: "local", roomId: null, isHost: false, roomRef: null,
  activeContract: "guerra_bandas", players: {}, turnOrder: [], currentTurnIndex: 0, currentTurnUid: null,
  marketOffer: [], currentCityEvent: null,
  
  // Opciones de Configuración Restauradas
  config: { isParty: false, isRoguelike: true, totalMatches: 3, matchesPlayed: 0, score: {} },
  
  heistState: { vaultPot: 3000, alarmLevel: 0, roundLoot: 0 },
  empireState: { districts: {} },
  gamblingState: { tablePot: 0, bets: {} },
  party: { isWaiting: false, actionInProgress: false }
};

const AudioFX = {
  ctx: null, init() { if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if(this.ctx.state==="suspended") this.ctx.resume(); },
  play(type) { /* Tu motor web audio (omito para ahorrar espacio en la respuesta, pero asume tu código exacto) */ }
};

const Juice = {
  screenShake(intensity = 8) { /* Tu código de vibración */ },
  showFloatingText(text, x, y, color = "#ff4444") { /* Tu código flotante */ },
  spawnParticles(x, y, count = 12, color = "#ffcc00") { /* Tu código de particulas */ }
};

function createPlayerData(uid, name, color, isHost = false) {
  return {
    uid: uid, name: name, color: color, hp: CONFIG.MAX_HP, maxHp: CONFIG.MAX_HP, shield: 0, cash: CONFIG.STARTING_CASH,
    vault: 0, tempLoot: 0, diceValue: 1, isHost: isHost, isAlive: true, connected: true,
    hasLoadedDice: false, hasSmokeScreen: false, passives: [], consumables: []
  };
}

function initDistrictsState() {
  const s = {}; CONFIG.DISTRICTS.forEach(d => s[d.id] = { ownerUid: null, level: 1 }); return s;
}

function showNotification(msg, type = "info") {
  const el = document.getElementById("gameNotification");
  if(!el) return;
  el.textContent = msg; el.className = `notification-toast show toast-${type}`;
  clearTimeout(el._timer); el._timer = setTimeout(() => el.className = "notification-toast", 3400);
}

function getCenterCoords() {
  const board = document.getElementById("gameBoard");
  if (board) { const rect = board.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

// ==========================================
// DADOS VIRTUALES (RESTAURADOS)
// ==========================================
function virtualRoll(sides, desc, playerColor, actionImg = 'idle') {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-virtual');
    const wrapper = document.getElementById('modal-dice-wrapper');
    const charImg = document.getElementById('modal-char-img');
    const numEl = document.getElementById('modal-dice-num');
    const shadowEl = document.getElementById('modal-dice-shadow');
    const colorEl = document.getElementById('modal-dice-color');
    const baseEl = document.getElementById('modal-dice-base');

    document.getElementById('virtual-title').innerText = desc;
    charImg.src = `assets/characters/${playerColor}/${actionImg}.png`;
    charImg.onerror = () => charImg.src = `assets/characters/None/idle.png`;

    modal.style.display = 'flex';
    wrapper.style.display = 'block';

    const diceFolder = `assets/D${sides}`;
    colorEl.style.backgroundImage = `url('${diceFolder}/${playerColor}.png')`;
    baseEl.style.backgroundImage = `url('${diceFolder}/Capa 0.png')`;
    
    if (sides !== 4 && sides !== 6) {
        shadowEl.style.backgroundImage = `url('${diceFolder}/Sombra.png')`;
    } else {
        shadowEl.style.backgroundImage = 'none';
    }

    let interval = setInterval(() => {
      const tempVal = Math.floor(Math.random() * sides) + 1;
      numEl.style.backgroundImage = `url('${diceFolder}/${tempVal}.png')`;
      wrapper.style.transform = `rotate(${Math.floor(Math.random() * 20) - 10}deg) scale(0.95)`;
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const finalVal = Math.floor(Math.random() * sides) + 1;
      numEl.style.backgroundImage = `url('${diceFolder}/${finalVal}.png')`;
      wrapper.style.transform = 'rotate(0deg) scale(1)';
      
      setTimeout(() => {
        modal.style.display = 'none';
        wrapper.style.display = 'none';
        resolve(finalVal);
      }, 1000);
    }, 800);
  });
}

// ==========================================
// CÁLCULO DE DAÑO TÁCTICO 1v1
// ==========================================
function getOpponentUid(attackerUid) {
  const targets = gameState.turnOrder.filter(uid => uid !== attackerUid && gameState.players[uid]?.hp > 0);
  return targets.length > 0 ? targets[0] : null;
}

function applyTacticalDamage(targetPlayer, rawDamage, attackerPlayer) {
  let finalDmg = rawDamage;
  if (attackerPlayer?.passives.includes("maton_pesado")) finalDmg += 2;
  
  if (targetPlayer.shield > 0) {
    if (targetPlayer.shield >= finalDmg) {
      targetPlayer.shield -= finalDmg; return { finalDamage: 0 };
    } else {
      finalDmg -= targetPlayer.shield; targetPlayer.shield = 0;
    }
  }

  targetPlayer.hp = Math.max(0, targetPlayer.hp - finalDmg);
  return { finalDamage: finalDmg };
}

// ==========================================
// RESOLUCIÓN ASÍNCRONA DE TURNOS
// ==========================================
async function triggerTurnAction(actionKey, actionParam = null) {
  if (gameState.party.isWaiting || gameState.party.actionInProgress) return;

  if (gameState.mode === "online") {
    if (gameState.currentTurnUid !== localAuth.uid) { showNotification("No es tu turno.", "warning"); return; }
    await executeActionAsync(actionKey, actionParam, localAuth.uid);
  } else {
    await executeActionAsync(actionKey, actionParam, gameState.turnOrder[gameState.currentTurnIndex]);
  }
}

async function executeActionAsync(actionKey, actionParam, activeUid) {
  gameState.party.actionInProgress = true;
  if (gameState.roomRef) await gameState.roomRef.child("gameState").update({ actionInProgress: true });

  const attacker = gameState.players[activeUid];
  const targetUid = getOpponentUid(activeUid);
  const target = targetUid ? gameState.players[targetUid] : null;
  const pos = getCenterCoords();
  let log = "";

  // Integración de Dados Visuales según el contrato y acción
  if (gameState.activeContract === "guerra_bandas") {
    if (actionKey === "tommy") {
      let rolledVal = attacker.hasLoadedDice ? 6 : await virtualRoll(6, `${attacker.name}: Tommy Gun`, attacker.color, 'idle');
      attacker.hasLoadedDice = false;
      const res = applyTacticalDamage(target, rolledVal * 4, attacker);
      Juice.showFloatingText(`-${res.finalDamage} HP`, pos.x, pos.y, "#ff4400");
      log = `${attacker.name} disparó Tommy Gun (sacó ${rolledVal}) causando ${res.finalDamage} de daño.`;
    }
    // Añade el resto de tu lógica de armas aquí...
  }

  // Actualizar estado al final del turno
  gameState.party.actionInProgress = false;
  showNotification(log, "info");
  
  await checkWinConditionOrAdvance();
  
  if (gameState.mode === "online" && gameState.roomRef) {
    const nextIndex = gameState.currentTurnIndex;
    await gameState.roomRef.update({
      players: gameState.players, currentTurnIndex: nextIndex, currentTurnUid: gameState.turnOrder[nextIndex],
      "gameState/actionInProgress": false, "gameState/lastAction": log, "config": gameState.config
    });
  }
  
  renderPlayers(); renderContractUI();
}

async function checkWinConditionOrAdvance() {
  const living = gameState.turnOrder.filter(uid => gameState.players[uid]?.hp > 0);

  // Lógica simple de victoria, extendida para el Modo Party
  if (living.length <= 1) {
    const winnerUid = living[0] || gameState.turnOrder[0];
    
    if (gameState.config.isParty) {
      gameState.config.score[winnerUid] = (gameState.config.score[winnerUid] || 0) + 1;
      gameState.config.matchesPlayed++;
      
      const winsNeeded = Math.floor(gameState.config.totalMatches / 2) + 1;
      if (gameState.config.score[winnerUid] >= winsNeeded || gameState.config.matchesPlayed >= gameState.config.totalMatches) {
        showNotification(`¡LA GUERRA TERMINÓ! Jefe Absoluto: ${gameState.players[winnerUid].name}`, "success");
      } else {
        showNotification(`¡${gameState.players[winnerUid].name} ganó este contrato! Siguiente ronda...`, "success");
        // Aquí podrías ciclar al siguiente contrato de la playlist
      }
      renderPartyScore();
    } else {
      showNotification(`¡VICTORIA de ${gameState.players[winnerUid].name}!`, "success");
    }
    return;
  }

  gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
  gameState.currentTurnUid = gameState.turnOrder[gameState.currentTurnIndex];
  renderTurnStatus();
}

// ==========================================
// RENDERIZADO Y CONTROL DE UI
// ==========================================
function renderPartyScore() {
  const bar = document.getElementById("partyScoreBar");
  if (!gameState.config.isParty) { bar.style.display = "none"; return; }
  
  bar.style.display = "flex";
  document.getElementById("partyMatchIndicator").innerText = `${gameState.config.matchesPlayed + 1} / ${gameState.config.totalMatches}`;
  
  const uids = gameState.turnOrder;
  if(uids[0]) document.getElementById("partyScoreP1").innerText = gameState.config.score[uids[0]] || 0;
  if(uids[1]) document.getElementById("partyScoreP2").innerText = gameState.config.score[uids[1]] || 0;
}

function renderContractUI() {
  // Aseguramos que el Mercado Negro solo se muestra si el modo Roguelike está activo
  const contractPanel = document.getElementById("contractPanel");
  contractPanel.innerHTML = "";
  
  // (Genera tu wrapper de botones de acción del contrato aquí, tal cual lo tenías)
  
  if (gameState.config.isRoguelike) {
    const marketWrapper = document.createElement("div");
    marketWrapper.className = "black-market-section";
    marketWrapper.innerHTML = `<h4>🛒 MERCADO NEGRO (Roguelike Activo)</h4>`;
    // (Renderizado de items del mercado...)
    contractPanel.appendChild(marketWrapper);
  }
}

function renderPlayers() {
  const container = document.getElementById("playersContainer");
  container.innerHTML = "";
  gameState.turnOrder.forEach(uid => {
    const p = gameState.players[uid];
    if (!p) return;
    const hpPercent = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    const card = document.createElement("div");
    card.className = `player-card ${gameState.currentTurnUid === uid ? "active-turn" : ""}`;
    card.innerHTML = `
      <div class="player-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(0,0,0,0.5); border: 1px solid #444; flex-shrink: 0;">
             <img src="assets/characters/${p.color}/idle.png" style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" onerror="this.src='assets/characters/None/idle.png'">
          </div>
          <span class="player-name">${escapeHTML(p.name)}</span>
        </div>
      </div>
      <div class="hp-bar-bg"><div class="hp-bar-fill" style="width: ${hpPercent}%"></div></div>
    `;
    container.appendChild(card);
  });
}

function renderTurnStatus() {
  const statusEl = document.getElementById("turnStatusLabel");
  const isMyTurn = (gameState.mode !== "online") || (gameState.mode === "online" && gameState.currentTurnUid === localAuth.uid);
  statusEl.textContent = isMyTurn ? "¡Es tu turno de dar la orden!" : `Planificando: ${gameState.players[gameState.currentTurnUid]?.name || 'Rival'}`;
}

function hideLobbyShowBattle() {
  document.getElementById("lobbySection").style.display = "none";
  document.getElementById("battleSection").style.display = "block";
  renderPartyScore();
}

function resetToMainMenu() {
  gameState.mode = "local"; gameState.roomId = null;
  document.getElementById("lobbySection").style.display = "block";
  document.getElementById("battleSection").style.display = "none";
}

function escapeHTML(str) { return String(str || "").replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)); }

// ==========================================
// ONLINE Y MULTIPLAYER
// ==========================================
function initFirebaseAuth() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      localAuth.uid = user.uid; localAuth.isReady = true;
      document.querySelectorAll(".btn-online-action").forEach(b => b.disabled = false);
      document.getElementById("playerUidBadge").textContent = `UID: ${user.uid.substring(0,6)}...`;
    } else {
      firebase.auth().signInAnonymously();
    }
  });
}

function createOnlineRoom() {
  const db = firebase.database();
  const roomId = "CD-" + Math.floor(1000 + Math.random() * 9000);
  const roomRef = db.ref(`rooms/${roomId}`);
  
  // Guardamos la configuración del Lobby
  gameState.config.isParty = document.getElementById("partyModeCheck").checked;
  gameState.config.totalMatches = parseInt(document.getElementById("totalMatchesInput").value) || 3;
  gameState.config.isRoguelike = document.getElementById("roguelikeModeCheck").checked;

  roomRef.set({
    roomId, hostUid: localAuth.uid, status: "lobby", config: gameState.config,
    turnOrder: [localAuth.uid],
    players: { [localAuth.uid]: createPlayerData(localAuth.uid, localAuth.username, localAuth.color, true) }
  }).then(() => {
    gameState.mode = "online"; gameState.roomId = roomId; gameState.isHost = true; gameState.roomRef = roomRef;
    setupRoomListener(roomRef);
    updateLobbyUI();
    window.history.replaceState(null, '', '?room=' + roomId);
  });
}

function joinOnlineRoom(targetRoomId) {
  const code = (targetRoomId || "").trim().toUpperCase();
  if(!code) return;
  
  const roomRef = firebase.database().ref(`rooms/${code}`);
  roomRef.once("value").then(snap => {
    if(!snap.exists()) return alert("La sala no existe.");
    const data = snap.val();
    const updates = {};
    updates[`players/${localAuth.uid}`] = createPlayerData(localAuth.uid, localAuth.username, localAuth.color, false);
    if (!data.turnOrder || !data.turnOrder.includes(localAuth.uid)) updates["turnOrder"] = data.turnOrder ? [...data.turnOrder, localAuth.uid] : [data.hostUid, localAuth.uid];
    
    return roomRef.update(updates);
  }).then(() => {
    gameState.mode = "online"; gameState.roomId = code; gameState.isHost = false; gameState.roomRef = roomRef;
    setupRoomListener(roomRef);
    updateLobbyUI();
    window.history.replaceState(null, '', '?room=' + code);
  });
}

function setupRoomListener(roomRef) {
  roomRef.on("value", snap => {
    if(!snap.exists()) return resetToMainMenu();
    const data = snap.val();
    gameState.players = data.players || {};
    gameState.turnOrder = data.turnOrder || [];
    gameState.currentTurnUid = data.currentTurnUid || gameState.turnOrder[0];
    if (data.config) gameState.config = data.config;
    
    if (data.status === "lobby" && gameState.isHost) {
      document.getElementById("btnStartOnlineMatch").style.display = "inline-block";
      document.getElementById("btnStartOnlineMatch").disabled = Object.keys(gameState.players).length < 2;
    } else if (data.status === "playing") {
      hideLobbyShowBattle();
      renderPlayers();
      renderTurnStatus();
      renderContractUI();
    }
  });
}

function updateLobbyUI() {
  if (gameState.roomId) {
    document.getElementById("currentRoomCode").textContent = `SALA: ${gameState.roomId}`;
    document.getElementById("btnCopyInvite").style.display = "inline-block";
    document.getElementById("btnCreateOnlineRoom").style.display = "none";
    document.querySelector(".join-group").style.display = "none";
    document.querySelector(".online-flow-divider").style.display = "none";
  }
}

function copyInviteLink() {
  const url = window.location.href.split('?')[0] + '?room=' + gameState.roomId;
  navigator.clipboard.writeText(url).then(() => {
    showNotification("Enlace de invitación copiado al portapapeles.", "success");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initFirebaseAuth();

  document.getElementById("inputPlayerName")?.addEventListener("input", e => localAuth.username = e.target.value || "Capo");
  
  const colorInput = document.getElementById("selectPlayerColor");
  const previewImg = document.getElementById("profilePreviewImg");
  if (colorInput) {
    colorInput.value = localAuth.color;
    colorInput.addEventListener("change", e => {
      localAuth.color = e.target.value;
      if (previewImg) previewImg.src = `assets/characters/${localAuth.color}/idle.png`;
    });
  }

  // Toggles de Lobby
  document.getElementById("partyModeCheck")?.addEventListener("change", e => {
    document.getElementById("partySettingsBox").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("btnCreateOnlineRoom")?.addEventListener("click", createOnlineRoom);
  document.getElementById("btnJoinOnlineRoom")?.addEventListener("click", () => joinOnlineRoom(document.getElementById("inputRoomCode").value));
  document.getElementById("btnCopyInvite")?.addEventListener("click", copyInviteLink);
  
  document.getElementById("btnStartOnlineMatch")?.addEventListener("click", () => {
    if (gameState.roomRef) gameState.roomRef.update({ status: "playing" });
  });

  // Autounirse si hay un ?room=XXXX en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoom = urlParams.get('room');
  if (urlRoom) {
    // Esperamos a que Auth esté listo para unirnos
    const checkAuth = setInterval(() => {
      if (localAuth.isReady) {
        clearInterval(checkAuth);
        document.getElementById("inputRoomCode").value = urlRoom;
        joinOnlineRoom(urlRoom);
      }
    }, 500);
  }
});
