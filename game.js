/**
 * ============================================================================
 * CRIMINAL DICE / CRIMEN URBANO - ENGINE TÁCTICO 1v1 CORREGIDO
 * Arquitectura: Vanilla JS + Firebase RTDB + Firebase Auth (Anonymous)
 * Catálogo: MARKET_CATALOG Oficial Completo (21 Pasivas + 7 Consumibles)
 * Reglas: Corrección de Pasivas, Sabotaje en Distritos y Llamada Falsa Alarma
 * ============================================================================
 */

// ==========================================
// 1. CONFIGURACIÓN Y CATÁLOGO DEL MERCADO NEGRO
// ==========================================
const CONFIG = {
  MAX_PLAYERS_DEFAULT: 2,
  MAX_PLAYERS_LIMIT: 4,
  MAX_HP: 100,
  STARTING_CASH: 1000,
  REROLL_COST: 50,
  MARKET_OFFER_SIZE: 4,
  DISTRICTS: [
    { id: "dist_centro", name: "Distrito Financiero", income: 300, defValue: 5 },
    { id: "dist_puerto", name: "Puerto de Carga", income: 250, defValue: 4 },
    { id: "dist_suburbios", name: "Los Callejones", income: 150, defValue: 2 },
    { id: "dist_casino", name: "Zona de Casinos", income: 400, defValue: 6 }
  ],
  CITY_EVENTS: [
    { id: "guerra_total", name: "Guerra Abierta", desc: "El daño de todas las armas aumenta un 50% este asalto.", dmgMultiplier: 1.5 },
    { id: "redada", name: "Redada Policial", desc: "La policía vigila las esquinas. Ganar dinero cuesta un 20% más.", tax: 0.2 },
    { id: "dia_cobro", name: "Día de Pago del Cartel", desc: "Todos los líderes activos reciben un bono de $200.", bonusCash: 200 },
    { id: "noche_tranquila", name: "Calma Tensada", desc: "Sin incidentes policiales reportados.", neutral: true }
  ]
};

// Catálogo Oficial Completo del Mercado Negro
const MARKET_CATALOG = [
  // --- 4 NUEVOS OBJETOS TÁCTICOS 1v1 ---
  {
    id: "informante_sueldo",
    name: "Informante a Sueldo",
    cost: 260,
    type: "passive",
    desc: "Ganas +$10 o +1 HP cuando el rival falla un ataque contra ti."
  },
  {
    id: "sindicato_terror",
    name: "Sindicato del Terror",
    cost: 230,
    type: "passive",
    desc: "Tu ataque básico ignora pasivas de defensa rivales 1 de cada 3 veces."
  },
  {
    id: "c4_explosive",
    name: "Explosivo C4",
    cost: 160,
    type: "consumable",
    desc: "Ataque fuerte garantizado (1d4 de daño directo) que no consume tu acción del turno."
  },
  {
    id: "cortina_humo",
    name: "Cortina de Humo",
    cost: 130,
    type: "consumable",
    desc: "Anula el próximo ataque recibido y resetea el multiplicador de combo del rival."
  },

  // --- PASIVAS OFICIALES REAJUSTADAS ---
  {
    id: "prestamista_siniestro",
    name: "Prestamista Siniestro",
    cost: 200,
    type: "passive",
    desc: "Al inicio de cada minijuego otorga +$150 de capital y resta -4 a tu HP Máximo."
  },
  {
    id: "chofer_huida",
    name: "Chófer de Huida",
    cost: 220,
    type: "passive",
    desc: "Reduce el daño recibido en -2 SI tu HP/Cobertura está por debajo del 25%."
  },
  {
    id: "red_proteccion",
    name: "Red de Protección",
    cost: 240,
    type: "passive",
    desc: "+10% ingresos/curas. Bloquea de forma garantizada el 1er Soplón o Redada/Sabotaje."
  },
  {
    id: "llamada_falsa_alarma",
    name: "Llamada Falsa Alarma",
    cost: 250,
    type: "passive",
    desc: "Restaura daño recibido, purifica veneno, anula redadas y recupera apuestas perdidas."
  },

  // --- RESTO DE PASIVAS ORIGINALES ---
  {
    id: "maton_pesado",
    name: "Matón Pesado",
    cost: 210,
    type: "passive",
    desc: "Tus ataques de armas de fuego infligen +2 de daño adicional garantizado."
  },
  {
    id: "abogado_corrupto",
    name: "Abogado Corrupto",
    cost: 220,
    type: "passive",
    desc: "Reduce las pérdidas por multas y penalizaciones económicas en un 25%."
  },
  {
    id: "hacker_clandestino",
    name: "Hacker Clandestino",
    cost: 240,
    type: "passive",
    desc: "Aumenta el botín en 'El Gran Atraco' en +20% y reduce el riesgo de alarma."
  },
  {
    id: "medico_callejero",
    name: "Médico Callejero",
    cost: 230,
    type: "passive",
    desc: "Al final de tu turno, regeneras +2 HP si tu vida está por debajo del 50%."
  },
  {
    id: "armero_experto",
    name: "Armero Experto",
    cost: 250,
    type: "passive",
    desc: "Añade +1 al resultado del dado en todas tus tiradas de ataque con armas."
  },
  {
    id: "infiltrado_policia",
    name: "Infiltrado en la Policía",
    cost: 260,
    type: "passive",
    desc: "Otorga un 25% de probabilidad de ignorar redadas y alarmas bancarias."
  },
  {
    id: "usurero_barrio",
    name: "Usurero del Barrio",
    cost: 200,
    type: "passive",
    desc: "Cobras un 5% de intereses sobre tu efectivo total al iniciar cada ronda."
  },
  {
    id: "guardaespaldas_privado",
    name: "Guardaespaldas Privado",
    cost: 240,
    type: "passive",
    desc: "Otorga +15 de Escudo protector al inicio de la partida."
  },
  {
    id: "contrabandista_lujo",
    name: "Contrabandista de Lujo",
    cost: 210,
    type: "passive",
    desc: "Otorga un 15% de descuento permanente en futuras compras en el Mercado Negro."
  },
  {
    id: "falsificador_bonos",
    name: "Falsificador de Bonos",
    cost: 220,
    type: "passive",
    desc: "Aumenta las recompensas en efectivo de los distritos y atracos en un 20%."
  },
  {
    id: "quimico_letal",
    name: "Químico Letal",
    cost: 230,
    type: "passive",
    desc: "El veneno que inyectas dura +1 turno y causa +2 de daño por turno."
  },
  {
    id: "ojo_halcon",
    name: "Ojo de Halcón",
    cost: 210,
    type: "passive",
    desc: "Los impactos críticos infligen +4 de daño adicional."
  },
  {
    id: "maton_extorsionador",
    name: "Matón Extorsionador",
    cost: 200,
    type: "passive",
    desc: "Robas $40 del rival cada vez que impactas un disparo crítico."
  },

  // --- CONSUMIBLES OFICIALES ---
  {
    id: "chaleco_kevlar",
    name: "Chaleco Antibalas",
    cost: 150,
    type: "consumable",
    desc: "Otorga +25 de Escudo protector inmediato contra proyectiles."
  },
  {
    id: "inyeccion_adrenalina",
    name: "Inyección de Adrenalina",
    cost: 140,
    type: "consumable",
    desc: "Cura 30 HP de forma inmediata."
  },
  {
    id: "dados_cargados",
    name: "Dados Trucados",
    cost: 180,
    type: "consumable",
    desc: "Garantiza el valor máximo en tu siguiente tirada de dado."
  },
  {
    id: "antidoto_purgante",
    name: "Antídoto Universal",
    cost: 100,
    type: "consumable",
    desc: "Elimina de inmediato el veneno y restaura 15 HP."
  },
  {
    id: "granada_humo_cegadora",
    name: "Granada Cegadora",
    cost: 140,
    type: "consumable",
    desc: "Reduce a la mitad el daño del próximo ataque que realice el oponente."
  }
];

// Control de Sesión Local
const localAuth = {
  uid: null,
  isReady: false,
  username: "Capo_" + Math.floor(1000 + Math.random() * 9000)
};

// Estado Central del Juego
const gameState = {
  mode: "local",
  roomId: null,
  isHost: false,
  roomRef: null,
  activeContract: "guerra_bandas",

  players: {},
  turnOrder: [],
  currentTurnIndex: 0,
  currentTurnUid: null,

  marketOffer: [],
  currentCityEvent: CONFIG.CITY_EVENTS[3],

  heistState: {
    vaultPot: 3000,
    alarmLevel: 0,
    roundLoot: 0
  },
  empireState: {
    districts: {}
  },
  gamblingState: {
    tablePot: 0,
    bets: {}
  },

  party: {
    isWaiting: false,
    actionInProgress: false,
    roundCount: 1
  },
  networkActionChain: Promise.resolve()
};

// ==========================================
// 2. SISTEMA DE AUDIO (WEB AUDIO SINTETIZADO)
// ==========================================
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },
  play(type) {
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case "roll":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.12);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      case "tommy":
        for (let i = 0; i < 4; i++) {
          const sOsc = this.ctx.createOscillator();
          const sGain = this.ctx.createGain();
          sOsc.connect(sGain);
          sGain.connect(this.ctx.destination);
          sOsc.type = "square";
          sOsc.frequency.setValueAtTime(280 - (i * 25), t + (i * 0.05));
          sGain.gain.setValueAtTime(0.25, t + (i * 0.05));
          sGain.gain.linearRampToValueAtTime(0.01, t + (i * 0.05) + 0.04);
          sOsc.start(t + (i * 0.05));
          sOsc.stop(t + (i * 0.05) + 0.04);
        }
        break;
      case "sniper":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      case "heal":
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.linearRampToValueAtTime(580, t + 0.15);
        osc.frequency.linearRampToValueAtTime(880, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      case "poison":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(140, t + 0.1);
        osc.frequency.linearRampToValueAtTime(90, t + 0.25);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      case "coins":
        osc.type = "sine";
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      case "alarm":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.linearRampToValueAtTime(320, t + 0.22);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      case "explosion":
        osc.type = "square";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      case "smoke":
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(110, t + 0.3);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      case "win":
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(554.37, t + 0.12);
        osc.frequency.setValueAtTime(659.25, t + 0.24);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      case "hit":
        osc.type = "square";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
    }
  }
};

// ==========================================
// 3. GAME JUICE (FEEDBACK VISUAL Y PARTÍCULAS)
// ==========================================
const Juice = {
  screenShake(intensity = 8) {
    const el = document.querySelector(".game-container") || document.body;
    el.style.transition = "transform 0.04s ease";
    let count = 0;
    const interval = setInterval(() => {
      const ox = (Math.random() - 0.5) * intensity;
      const oy = (Math.random() - 0.5) * intensity;
      el.style.transform = `translate(${ox}px, ${oy}px)`;
      count++;
      if (count > 5) {
        clearInterval(interval);
        el.style.transform = "translate(0px, 0px)";
      }
    }, 40);
  },

  showFloatingText(text, x, y, color = "#ff4444") {
    const el = document.createElement("div");
    el.innerText = text;
    el.style.position = "fixed";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.style.fontSize = "1.5rem";
    el.style.fontWeight = "bold";
    el.style.pointerEvents = "none";
    el.style.textShadow = "0 0 8px #000, 2px 2px 0 #000";
    el.style.zIndex = "9999";
    el.style.transition = "all 0.85s cubic-bezier(0.18, 0.89, 0.32, 1.28)";
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = "translateY(-50px) scale(1.15)";
      el.style.opacity = "0";
    });

    setTimeout(() => el.remove(), 900);
  },

  spawnParticles(x, y, count = 12, color = "#ffcc00") {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.style.position = "fixed";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.width = "7px";
      p.style.height = "7px";
      p.style.backgroundColor = color;
      p.style.borderRadius = "50%";
      p.style.pointerEvents = "none";
      p.style.zIndex = "9998";
      p.style.transition = "all 0.65s ease-out";
      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 55;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
        p.style.opacity = "0";
      });

      setTimeout(() => p.remove(), 650);
    }
  }
};

// ==========================================
// 4. FACTORY DE JUGADORES Y DISTRITOS
// ==========================================
function createPlayerData(uid, name, isHost = false) {
  return {
    uid: uid,
    name: name,
    hp: CONFIG.MAX_HP,
    maxHp: CONFIG.MAX_HP,
    shield: 0,
    cash: CONFIG.STARTING_CASH,
    vault: 0,
    tempLoot: 0,
    diceValue: 1,
    isHost: isHost,
    isAlive: true,
    connected: true,

    // Estados de Combate y Control Táctico
    hasLoadedDice: false,
    hasSmokeScreen: false,
    terrorStrikeCounter: 0,
    redProteccionUsed: false,
    lastHostileDamageTaken: 0,
    lastGamblingLoss: 0,
    poison: { turns: 0, dmg: 0 },

    passives: [],
    consumables: []
  };
}

function initDistrictsState() {
  const state = {};
  CONFIG.DISTRICTS.forEach((d) => {
    state[d.id] = { ownerUid: null, level: 1 };
  });
  return state;
}

// ==========================================
// 5. MERCADO NEGRO Y COMPRA DE ITEMS
// ==========================================
function generateMarketOffer() {
  const shuffled = [...MARKET_CATALOG].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, CONFIG.MARKET_OFFER_SIZE).map((item) => item.id);
}

function rerollMarket() {
  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const player = gameState.players[activeUid];
  if (!player) return;

  if (player.cash < CONFIG.REROLL_COST) {
    showNotification("No tienes fondos para actualizar la oferta ($50).", "warning");
    return;
  }

  player.cash -= CONFIG.REROLL_COST;
  gameState.marketOffer = generateMarketOffer();
  AudioFX.play("coins");
  showNotification("Oferta del Mercado Negro actualizada.", "info");

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      marketOffer: gameState.marketOffer,
      [`players/${activeUid}/cash`]: player.cash
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

function buyBlackMarketItem(itemId) {
  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const player = gameState.players[activeUid];
  const item = MARKET_CATALOG.find((i) => i.id === itemId);

  if (!player || !item) return;

  if (item.type === "passive" && player.passives.includes(item.id)) {
    showNotification("Ya posees este contacto en tu sindicato.", "warning");
    return;
  }

  const hasDiscount = player.passives.includes("contrabandista_lujo");
  const finalCost = hasDiscount ? Math.round(item.cost * 0.85) : item.cost;

  if (player.cash < finalCost) {
    showNotification(`Fondos insuficientes. Requiere $${finalCost}.`, "warning");
    return;
  }

  player.cash -= finalCost;
  AudioFX.play("coins");

  if (item.type === "passive") {
    player.passives.push(item.id);

    // CORRECCIÓN 1: Prestamista Siniestro ya NO otorga dinero en la tienda
    if (item.id === "prestamista_siniestro") {
      showNotification("Prestamista Siniestro contratado: otorgará +$150 y -4 HP Máx al iniciar cada contrato.", "info");
    } else if (item.id === "guardaespaldas_privado") {
      player.shield += 15;
      showNotification("Guardaespaldas Privado desplegado: +15 Escudo.", "success");
    } else {
      showNotification(`Contacto adquirido: ${item.name}.`, "success");
    }
  } else {
    player.consumables.push(item.id);
    showNotification(`Objeto guardado en tu inventario: ${item.name}.`, "success");
  }

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      [`players/${activeUid}`]: player
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

function sellMarketItem(itemId) {
  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const player = gameState.players[activeUid];
  const item = MARKET_CATALOG.find((i) => i.id === itemId);

  if (!player || !item) return;

  const refund = Math.round(item.cost * 0.6);

  if (item.type === "passive") {
    const idx = player.passives.indexOf(itemId);
    if (idx !== -1) player.passives.splice(idx, 1);
  } else {
    const idx = player.consumables.indexOf(itemId);
    if (idx !== -1) player.consumables.splice(idx, 1);
  }

  player.cash += refund;
  AudioFX.play("coins");
  showNotification(`Vendiste ${item.name} por +$${refund}.`, "info");

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      [`players/${activeUid}`]: player
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

function useConsumable(itemId) {
  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const player = gameState.players[activeUid];
  const item = MARKET_CATALOG.find((i) => i.id === itemId);
  const targetUid = getOpponentUid(activeUid);
  const target = targetUid ? gameState.players[targetUid] : null;

  if (!player || !item) return;

  const idx = player.consumables.indexOf(itemId);
  if (idx === -1) return;
  player.consumables.splice(idx, 1);

  const pos = getCenterCoords();

  switch (itemId) {
    case "c4_explosive": {
      const d4 = Math.floor(Math.random() * 4) + 1;
      const dmg = d4 * 4;
      AudioFX.play("explosion");
      Juice.screenShake(14);
      Juice.showFloatingText(`💥 C4! -${dmg} HP`, pos.x, pos.y, "#ff2200");
      Juice.spawnParticles(pos.x, pos.y, 25, "#ff2200");

      if (target) {
        applyTacticalDamage(target, dmg, player);
      }
      showNotification(`¡Detonaste C4! Infligió ${dmg} de daño a ${target?.name || "rival"}.`, "success");
      break;
    }

    case "cortina_humo":
      player.hasSmokeScreen = true;
      AudioFX.play("smoke");
      Juice.showFloatingText("💨 CORTINA ACTIVA", pos.x, pos.y, "#aaaaaa");
      showNotification("Cortina de Humo activa: anulará el próximo ataque rival.", "info");
      break;

    case "chaleco_kevlar":
      player.shield += 25;
      AudioFX.play("heal");
      Juice.showFloatingText("+25 ESCUDO", pos.x, pos.y, "#00ccff");
      showNotification("Chaleco Antibalas equipado (+25 Escudo).", "success");
      break;

    case "inyeccion_adrenalina":
      player.hp = Math.min(player.maxHp, player.hp + 30);
      AudioFX.play("heal");
      Juice.showFloatingText("+30 HP", pos.x, pos.y, "#00ff88");
      showNotification("Inyección de Adrenalina aplicada (+30 HP).", "success");
      break;

    case "dados_cargados":
      player.hasLoadedDice = true;
      AudioFX.play("roll");
      showNotification("Dados Trucados cargados: tu siguiente tirada será el valor máximo.", "success");
      break;

    case "antidoto_purgante":
      player.poison = { turns: 0, dmg: 0 };
      player.hp = Math.min(player.maxHp, player.hp + 15);
      AudioFX.play("heal");
      showNotification("Antídoto aplicado: veneno neutralizado y +15 HP.", "success");
      break;

    case "granada_humo_cegadora":
      AudioFX.play("smoke");
      if (target) target.isBlinded = true;
      showNotification("Granada Cegadora: el rival causará mitad de daño en su próximo asalto.", "info");
      break;
  }

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      [`players/${activeUid}`]: player,
      [`players/${targetUid}`]: target
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

// CORRECCIÓN 4: Llamada Falsa Alarma Completa
function activateFalsaAlarma() {
  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const player = gameState.players[activeUid];
  if (!player || !player.passives.includes("llamada_falsa_alarma")) return;

  let restoredHp = 0;
  let restoredCash = 0;
  let cleanedPoison = false;
  let resetAlarm = false;

  // 1. Restaurar daño de armas/granadas
  if (player.lastHostileDamageTaken > 0) {
    restoredHp = player.lastHostileDamageTaken;
    player.hp = Math.min(player.maxHp, player.hp + restoredHp);
    player.lastHostileDamageTaken = 0;
  }

  // 2. Purificar veneno
  if (player.poison && player.poison.turns > 0) {
    player.poison = { turns: 0, dmg: 0 };
    cleanedPoison = true;
  }

  // 3. Anular redadas activas en ese turno
  if (gameState.heistState && gameState.heistState.alarmLevel > 0) {
    gameState.heistState.alarmLevel = Math.max(0, gameState.heistState.alarmLevel - 1);
    resetAlarm = true;
  }

  // 4. Recuperar fichas robadas/perdidas en Apuestas Clandestinas del turno anterior
  if (player.lastGamblingLoss > 0) {
    restoredCash = player.lastGamblingLoss;
    player.cash += restoredCash;
    player.lastGamblingLoss = 0;
  }

  AudioFX.play("heal");
  const pos = getCenterCoords();
  Juice.showFloatingText("🚨 ¡FALSA ALARMA TOTAL!", pos.x, pos.y, "#00e5ff");
  Juice.spawnParticles(pos.x, pos.y, 20, "#00e5ff");

  showNotification(
    `Falsa Alarma activada: +${restoredHp} HP devueltos, +$${restoredCash} recuperados` +
    (cleanedPoison ? ", veneno purificado" : "") +
    (resetAlarm ? ", alarma policial anulada." : "."),
    "success"
  );

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      [`players/${activeUid}`]: player,
      heistState: gameState.heistState
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

// ==========================================
// 6. CÁLCULO DE DAÑO TÁCTICO 1v1
// ==========================================
function getOpponentUid(attackerUid) {
  const targets = gameState.turnOrder.filter((uid) => uid !== attackerUid && gameState.players[uid]?.hp > 0);
  return targets.length > 0 ? targets[0] : null;
}

function applyTacticalDamage(targetPlayer, rawDamage, attackerPlayer) {
  const pos = getCenterCoords();

  // 1. Cortina de Humo (Anula completamente el ataque)
  if (targetPlayer.hasSmokeScreen) {
    targetPlayer.hasSmokeScreen = false;
    AudioFX.play("smoke");
    Juice.showFloatingText("💨 ¡HUMO! ATAQUE ANULADO", pos.x, pos.y, "#cccccc");
    return { finalDamage: 0, nullified: true, reason: "Cortina de Humo anuló el impacto." };
  }

  let finalDmg = rawDamage;

  if (gameState.currentCityEvent?.dmgMultiplier) {
    finalDmg = Math.round(finalDmg * gameState.currentCityEvent.dmgMultiplier);
  }

  if (attackerPlayer && attackerPlayer.passives.includes("maton_pesado")) {
    finalDmg += 2;
  }

  let ignoreDefense = false;
  if (attackerPlayer && attackerPlayer.passives.includes("sindicato_terror")) {
    attackerPlayer.terrorStrikeCounter = (attackerPlayer.terrorStrikeCounter || 0) + 1;
    if (attackerPlayer.terrorStrikeCounter >= 3) {
      ignoreDefense = true;
      attackerPlayer.terrorStrikeCounter = 0;
      Juice.showFloatingText("⚡ SINDICATO IGNORA DEFENSA", pos.x, pos.y, "#ff0077");
    }
  }

  // CORRECCIÓN 2: Chófer de Huida solo reduce daño si HP + Escudo está por debajo del 25%
  const combinedHealth = targetPlayer.hp + targetPlayer.shield;
  const isLowHealth = combinedHealth < (targetPlayer.maxHp * 0.25);

  if (!ignoreDefense && targetPlayer.passives.includes("chofer_huida") && isLowHealth) {
    finalDmg = Math.max(1, finalDmg - 2);
    Juice.showFloatingText("🚗 CHÓFER DE HUIDA (-2)", pos.x, pos.y, "#00e5ff");
  }

  // Absorción por escudo protector
  if (targetPlayer.shield > 0) {
    if (targetPlayer.shield >= finalDmg) {
      targetPlayer.shield -= finalDmg;
      targetPlayer.lastHostileDamageTaken = 0;
      return { finalDamage: 0, absorbed: finalDmg };
    } else {
      finalDmg -= targetPlayer.shield;
      targetPlayer.shield = 0;
    }
  }

  targetPlayer.hp = Math.max(0, targetPlayer.hp - finalDmg);
  targetPlayer.lastHostileDamageTaken = finalDmg;

  return { finalDamage: finalDmg, nullified: false };
}

// ==========================================
// 7. CONTRATOS Y MINIJUEGOS ORIGINALES
// ==========================================

// --- CONTRATO 1: GUERRA DE BANDAS ---
function executeGuerraBandasAction(actionKey, activeUid) {
  const attacker = gameState.players[activeUid];
  const targetUid = getOpponentUid(activeUid);
  const target = targetUid ? gameState.players[targetUid] : null;
  const pos = getCenterCoords();

  let log = "";
  let rolledVal = 1;

  switch (actionKey) {
    case "tommy": {
      rolledVal = attacker.hasLoadedDice ? 6 : Math.floor(Math.random() * 6) + 1;
      if (attacker.passives.includes("armero_experto")) rolledVal = Math.min(6, rolledVal + 1);
      attacker.hasLoadedDice = false;
      attacker.diceValue = rolledVal;

      if (!target) return { log: "No hay rivales activos." };

      const baseDmg = rolledVal * 4;
      const res = applyTacticalDamage(target, baseDmg, attacker);

      AudioFX.play("tommy");
      Juice.screenShake(8);
      Juice.showFloatingText(`-${res.finalDamage} HP`, pos.x, pos.y, "#ff4400");
      Juice.spawnParticles(pos.x, pos.y, 16, "#ff6600");

      log = `${attacker.name} disparó Tommy Gun (sacó ${rolledVal}) causando ${res.finalDamage} de daño.`;
      break;
    }

    case "sniper": {
      const d20 = attacker.hasLoadedDice ? 20 : Math.floor(Math.random() * 20) + 1;
      attacker.hasLoadedDice = false;
      attacker.diceValue = d20;

      if (!target) return { log: "No hay rivales activos." };

      if (d20 >= 11) {
        let d12 = Math.floor(Math.random() * 12) + 1;
        if (d20 === 20) d12 += 2;
        if (attacker.passives.includes("ojo_halcon")) d12 += 4;

        const totalDmg = d12 * 3;
        const res = applyTacticalDamage(target, totalDmg, attacker);

        AudioFX.play("sniper");
        Juice.screenShake(16);
        Juice.showFloatingText(`🎯 ¡IMPACTO CERTERO! -${res.finalDamage} HP`, pos.x, pos.y, "#ff0033");
        Juice.spawnParticles(pos.x, pos.y, 25, "#ff0033");

        log = `${attacker.name} acertó con Francotirador (d20: ${d20}, daño: ${res.finalDamage}).`;
      } else {
        AudioFX.play("hit");
        Juice.showFloatingText(`FALLO (d20: ${d20})`, pos.x, pos.y, "#888888");

        if (target.passives.includes("informante_sueldo")) {
          target.cash += 10;
          target.hp = Math.min(target.maxHp, target.hp + 1);
          showNotification(`Informante de ${target.name} cobró: +$10 y +1 HP por tiro fallido rival.`, "info");
        }

        log = `${attacker.name} erró el tiro de francotirador (d20: ${d20}, requería 11+).`;
      }
      break;
    }

    case "medico": {
      const d8 = attacker.hasLoadedDice ? 8 : Math.floor(Math.random() * 8) + 1;
      attacker.hasLoadedDice = false;
      attacker.diceValue = d8;

      let healAmount = d8 * 3;
      if (attacker.passives.includes("red_proteccion")) healAmount = Math.round(healAmount * 1.1);

      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);

      AudioFX.play("heal");
      Juice.showFloatingText(`+${healAmount} HP`, pos.x, pos.y, "#00ff88");
      Juice.spawnParticles(pos.x, pos.y, 14, "#00ff88");

      log = `${attacker.name} llamó al médico (d8: ${d8}) y recuperó ${healAmount} de salud.`;
      break;
    }

    case "soplon": {
      if (!target) return { log: "No hay rivales activos." };

      if (target.passives.includes("red_proteccion") && !target.redProteccionUsed) {
        target.redProteccionUsed = true;
        AudioFX.play("heal");
        Juice.showFloatingText("🛡️ RED BLOQUEÓ SOPLÓN", pos.x, pos.y, "#00ffff");
        return { log: `¡La Red de Protección de ${target.name} bloqueó al soplón!` };
      }

      let poisonDuration = 3;
      let poisonDmg = 6;
      if (attacker.passives.includes("quimico_letal")) {
        poisonDuration += 1;
        poisonDmg += 2;
      }

      target.poison = { turns: poisonDuration, dmg: poisonDmg };

      AudioFX.play("poison");
      Juice.screenShake(6);
      Juice.showFloatingText("🧪 ENVENENADO", pos.x, pos.y, "#9900ee");

      log = `${attacker.name} soltó al soplón: ${target.name} sufrirá ${poisonDmg} de veneno por ${poisonDuration} turnos.`;
      break;
    }
  }

  return { log, targetUid, targetHp: target?.hp };
}

// --- CONTRATO 2: EL GRAN ATRACO ---
function executeGranAtracoAction(actionType, activeUid) {
  const player = gameState.players[activeUid];
  const pos = getCenterCoords();

  if (actionType === "bank") {
    let secured = player.tempLoot || 0;
    if (player.passives.includes("falsificador_bonos")) secured = Math.round(secured * 1.2);

    player.vault = (player.vault || 0) + secured;
    player.tempLoot = 0;

    AudioFX.play("coins");
    Juice.showFloatingText(`💰 ASEGURADO +$${secured}`, pos.x, pos.y, "#00ff88");
    Juice.spawnParticles(pos.x, pos.y, 18, "#00ff88");

    return { log: `${player.name} aseguró $${secured} en la bóveda.` };
  }

  const rolledVal = player.hasLoadedDice ? 6 : Math.floor(Math.random() * 6) + 1;
  player.hasLoadedDice = false;
  player.diceValue = rolledVal;

  if (rolledVal <= 2) {
    if (player.passives.includes("infiltrado_policia") && Math.random() < 0.25) {
      showNotification("El infiltrado policial apagó la sirena a tiempo.", "info");
      return { log: `${player.name} activó una alarma (sacó ${rolledVal}), pero el infiltrado policial lo encubrió.` };
    }

    const lost = player.tempLoot || 0;
    player.tempLoot = 0;
    gameState.heistState.alarmLevel = Math.min(3, (gameState.heistState.alarmLevel || 0) + 1);

    AudioFX.play("alarm");
    Juice.screenShake(12);
    Juice.showFloatingText(`🚨 ALARMA! -$${lost}`, pos.x, pos.y, "#ff1111");

    return { log: `¡Alarma disparada! ${player.name} sacó un ${rolledVal} y perdió los $${lost} acumulados.` };
  } else {
    let gain = rolledVal * 150;
    if (player.passives.includes("hacker_clandestino")) gain = Math.round(gain * 1.2);

    player.tempLoot = (player.tempLoot || 0) + gain;

    AudioFX.play("coins");
    Juice.showFloatingText(`+$${gain}`, pos.x, pos.y, "#ffcc00");
    Juice.spawnParticles(pos.x, pos.y, 10, "#ffcc00");

    return { log: `${player.name} forzó la caja (sacó ${rolledVal}) sumando +$${gain}. Acumulado: $${player.tempLoot}.` };
  }
}

// --- CONTRATO 3: IMPERIO CRIMINAL Y SABOTAJE ---
function executeImperioAction(districtId, activeUid) {
  const player = gameState.players[activeUid];
  const district = CONFIG.DISTRICTS.find((d) => d.id === districtId) || CONFIG.DISTRICTS[0];
  const distState = gameState.empireState.districts[district.id] || { ownerUid: null, level: 1 };
  const pos = getCenterCoords();

  const rolledVal = player.hasLoadedDice ? 6 : Math.floor(Math.random() * 6) + 1;
  player.hasLoadedDice = false;
  player.diceValue = rolledVal;

  if (rolledVal >= district.defValue) {
    distState.ownerUid = activeUid;
    distState.level = Math.min(3, (distState.level || 1) + 1);
    gameState.empireState.districts[district.id] = distState;

    let income = district.income;
    if (player.passives.includes("red_proteccion")) income = Math.round(income * 1.1);

    player.cash = (player.cash || 0) + income;

    AudioFX.play("win");
    Juice.screenShake(8);
    Juice.showFloatingText(`🏆 CONQUISTADO +$${income}`, pos.x, pos.y, "#00ccff");
    Juice.spawnParticles(pos.x, pos.y, 20, "#00ccff");

    return { log: `${player.name} tomó ${district.name} con un ${rolledVal} y cobró $${income}.` };
  } else {
    AudioFX.play("hit");
    Juice.showFloatingText(`FALLO (${rolledVal}/${district.defValue})`, pos.x, pos.y, "#888888");
    return { log: `${player.name} no pudo tomar ${district.name} (sacó ${rolledVal}, requería ${district.defValue}+).` };
  }
}

// CORRECCIÓN 3: openSabotageModal verifica red_proteccion en lugar de contact_arquitecto
function openSabotageModal(districtId) {
  const district = CONFIG.DISTRICTS.find((d) => d.id === districtId);
  const distState = gameState.empireState.districts[districtId];
  if (!district || !distState || !distState.ownerUid) return;

  const targetPlayer = gameState.players[distState.ownerUid];
  const attackerUid = localAuth.uid || gameState.currentTurnUid;
  const attacker = gameState.players[attackerUid];

  if (!targetPlayer || targetPlayer.uid === attackerUid) return;

  // Comprobar bloqueo con Red de Protección
  if (targetPlayer.passives.includes("red_proteccion") && !targetPlayer.redProteccionUsed) {
    targetPlayer.redProteccionUsed = true;
    AudioFX.play("heal");
    const pos = getCenterCoords();
    Juice.showFloatingText("🛡️ RED DE PROTECCIÓN ACTIVA", pos.x, pos.y, "#00ffff");
    showNotification(`¡La Red de Protección de ${targetPlayer.name} bloqueó tu intento de Sabotaje/Redada!`, "warning");

    if (gameState.mode === "online" && gameState.roomRef) {
      gameState.roomRef.update({
        [`players/${targetPlayer.uid}/redProteccionUsed`]: true
      }).catch(console.error);
    }
    return;
  }

  // Ejecución del sabotaje si no está protegido
  distState.ownerUid = null;
  distState.level = 1;
  AudioFX.play("explosion");
  Juice.screenShake(10);
  Juice.showFloatingText("💣 DISTRITO SABOTEADO", pos.x, pos.y, "#ff2200");
  showNotification(`${attacker.name} saboteó y desestabilizó el control de ${district.name}.`, "success");

  if (gameState.mode === "online" && gameState.roomRef) {
    gameState.roomRef.update({
      empireState: gameState.empireState
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
}

// --- CONTRATO 4: APUESTAS CLANDESTINAS ---
function executeApuestasAction(activeUid) {
  const player = gameState.players[activeUid];
  const rolledVal = player.hasLoadedDice ? 6 : Math.floor(Math.random() * 6) + 1;
  player.hasLoadedDice = false;
  player.diceValue = rolledVal;

  const isPar = rolledVal % 2 === 0;
  const isAlto = rolledVal >= 4;
  const pos = getCenterCoords();

  let localWon = false;
  let totalReward = 0;

  Object.keys(gameState.players).forEach((uid) => {
    const p = gameState.players[uid];
    const bet = gameState.gamblingState.bets[uid];
    if (!bet || bet.amount <= 0) return;

    let hit = false;
    if (bet.choice === "par" && isPar) hit = true;
    if (bet.choice === "impar" && !isPar) hit = true;
    if (bet.choice === "alto" && isAlto) hit = true;
    if (bet.choice === "bajo" && !isAlto) hit = true;

    if (hit) {
      const rew = bet.amount * 2;
      p.cash = (p.cash || 0) + rew;
      p.lastGamblingLoss = 0;
      if (uid === localAuth.uid) {
        localWon = true;
        totalReward = rew;
      }
    } else {
      // Registro de fichas perdidas para 'Llamada Falsa Alarma'
      p.lastGamblingLoss = (p.lastGamblingLoss || 0) + bet.amount;
    }
  });

  gameState.gamblingState.bets = {};
  gameState.gamblingState.tablePot = 0;

  if (localWon) {
    AudioFX.play("win");
    Juice.showFloatingText(`🎲 ¡GANASTE! +$${totalReward}`, pos.x, pos.y, "#00ffcc");
    Juice.spawnParticles(pos.x, pos.y, 22, "#00ffcc");
  } else {
    AudioFX.play("hit");
    Juice.showFloatingText("CASA GANA", pos.x, pos.y, "#ff3333");
  }

  return { log: `Mesa Clandestina: el dado cayó en ${rolledVal} (${isPar ? "PAR" : "IMPAR"} / ${isAlto ? "ALTO" : "BAJO"}).` };
}

// ==========================================
// 8. RESOLUCIÓN DE TURNOS Y SINCRONIZACIÓN
// ==========================================
function triggerTurnAction(actionKey, actionParam = null) {
  if (gameState.party.isWaiting || gameState.party.actionInProgress) {
    console.warn("[CrimenDev] Acción bloqueada.");
    return;
  }

  if (gameState.mode === "online") {
    if (gameState.currentTurnUid !== localAuth.uid) {
      showNotification("No es tu turno de actuar.", "warning");
      return;
    }
    executeOnlineAction(actionKey, actionParam);
  } else {
    executeLocalAction(actionKey, actionParam);
  }
}

function processTurnStartPassives(uid) {
  const p = gameState.players[uid];
  if (!p) return;

  if (p.poison && p.poison.turns > 0) {
    p.hp = Math.max(0, p.hp - p.poison.dmg);
    p.poison.turns--;
    AudioFX.play("poison");
    const pos = getCenterCoords();
    Juice.showFloatingText(`VENENO -${p.poison.dmg} HP`, pos.x, pos.y, "#aa00ff");
    showNotification(`${p.name} recibe ${p.poison.dmg} de daño por veneno. Quedan ${p.poison.turns} turnos.`, "warning");
  }

  if (p.passives.includes("medico_callejero") && p.hp < (p.maxHp * 0.5)) {
    p.hp = Math.min(p.maxHp, p.hp + 2);
    showNotification("Médico Callejero te estabiliza: +2 HP.", "info");
  }

  if (p.passives.includes("usurero_barrio") && p.cash > 0) {
    const interest = Math.round(p.cash * 0.05);
    p.cash += interest;
    showNotification(`Usurero del Barrio: cobraste +$${interest} de intereses.`, "info");
  }
}

function executeLocalAction(actionKey, actionParam) {
  gameState.party.actionInProgress = true;
  AudioFX.play("roll");

  const diceElement = document.getElementById("diceContainer");
  if (diceElement) diceElement.classList.add("rolling");

  setTimeout(() => {
    if (diceElement) diceElement.classList.remove("rolling");

    const activeUid = gameState.turnOrder[gameState.currentTurnIndex];
    processTurnStartPassives(activeUid);

    let result = { log: "" };

    switch (gameState.activeContract) {
      case "guerra_bandas":
        result = executeGuerraBandasAction(actionKey, activeUid);
        break;
      case "gran_atraco":
        result = executeGranAtracoAction(actionKey, activeUid);
        break;
      case "imperio_criminal":
        result = executeImperioAction(actionParam || CONFIG.DISTRICTS[0].id, activeUid);
        break;
      case "apuestas_clandestinas":
        result = executeApuestasAction(activeUid);
        break;
    }

    renderPlayers();
    renderContractUI();
    showNotification(result.log, "info");

    gameState.party.actionInProgress = false;
    checkWinConditionOrAdvance();
  }, 600);
}

function executeOnlineAction(actionKey, actionParam) {
  if (!gameState.roomRef) return;

  gameState.networkActionChain = gameState.networkActionChain
    .then(() => {
      gameState.party.actionInProgress = true;
      AudioFX.play("roll");
      return gameState.roomRef.child("gameState").update({ actionInProgress: true });
    })
    .then(() => new Promise((resolve) => setTimeout(resolve, 550)))
    .then(() => {
      const activeUid = localAuth.uid;
      processTurnStartPassives(activeUid);

      let result = { log: "" };
      switch (gameState.activeContract) {
        case "guerra_bandas":
          result = executeGuerraBandasAction(actionKey, activeUid);
          break;
        case "gran_atraco":
          result = executeGranAtracoAction(actionKey, activeUid);
          break;
        case "imperio_criminal":
          result = executeImperioAction(actionParam || CONFIG.DISTRICTS[0].id, activeUid);
          break;
        case "apuestas_clandestinas":
          result = executeApuestasAction(activeUid);
          break;
      }

      const nextIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
      const updates = {
        players: gameState.players,
        heistState: gameState.heistState,
        empireState: gameState.empireState,
        gamblingState: gameState.gamblingState,
        currentTurnIndex: nextIndex,
        currentTurnUid: gameState.turnOrder[nextIndex],
        "gameState/actionInProgress": false,
        "gameState/lastAction": result.log
      };

      return gameState.roomRef.update(updates);
    })
    .catch((err) => {
      console.error("[CrimenDev] Error online:", err);
      if (gameState.roomRef) gameState.roomRef.child("gameState/actionInProgress").set(false);
    })
    .finally(() => {
      gameState.party.actionInProgress = false;
    });
}

function checkWinConditionOrAdvance() {
  const living = gameState.turnOrder.filter((uid) => gameState.players[uid]?.hp > 0);

  if (gameState.activeContract === "guerra_bandas" && living.length <= 1) {
    const winnerUid = living[0] || gameState.turnOrder[0];
    AudioFX.play("win");
    showNotification(`¡EL CARTEL TIENE DUEÑO! Victoria de ${gameState.players[winnerUid].name}`, "success");
    return;
  }

  gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
  gameState.currentTurnUid = gameState.turnOrder[gameState.currentTurnIndex];

  if (gameState.currentTurnIndex === 0) {
    cycleCityEvent();
  }

  renderTurnStatus();

  if (gameState.mode === "ai" && gameState.currentTurnUid === "AI_BOT") {
    executeAITurn();
  }
}

function executeAITurn() {
  gameState.party.isWaiting = true;
  setTimeout(() => {
    gameState.party.isWaiting = false;

    if (gameState.activeContract === "guerra_bandas") {
      const aiActions = ["tommy", "tommy", "sniper", "medico"];
      const chosen = aiActions[Math.floor(Math.random() * aiActions.length)];
      executeLocalAction(chosen);
    } else if (gameState.activeContract === "gran_atraco") {
      const ai = gameState.players["AI_BOT"];
      executeLocalAction(ai && ai.tempLoot > 450 ? "bank" : "roll");
    } else if (gameState.activeContract === "apuestas_clandestinas") {
      placeBet("AI_BOT", Math.random() > 0.5 ? "par" : "impar", 100);
      executeLocalAction("roll");
    } else {
      executeLocalAction("claim", CONFIG.DISTRICTS[0].id);
    }
  }, 1000);
}

function cycleCityEvent() {
  const randomEvent = CONFIG.CITY_EVENTS[Math.floor(Math.random() * CONFIG.CITY_EVENTS.length)];
  gameState.currentCityEvent = randomEvent;
  renderCityEvent();
  showNotification(`EVENTO URBANO: ${randomEvent.name} - ${randomEvent.desc}`, "info");

  if (randomEvent.bonusCash) {
    Object.keys(gameState.players).forEach((uid) => {
      gameState.players[uid].cash = (gameState.players[uid].cash || 0) + randomEvent.bonusCash;
    });
    renderPlayers();
  }
}

// CORRECCIÓN 1: Aplicación controlada de Prestamista Siniestro (+150$ y -4 HP Máx)
function initContractEffects() {
  Object.keys(gameState.players).forEach((uid) => {
    const p = gameState.players[uid];
    if (p && p.passives && p.passives.includes("prestamista_siniestro")) {
      p.cash += 150;
      p.maxHp = Math.max(10, p.maxHp - 4);
      p.hp = Math.min(p.hp, p.maxHp);
      showNotification(`Prestamista Siniestro en ${p.name}: +$150 ingresados y -4 HP Máximo.`, "info");
    }
    // Reiniciar flag de Red de Protección para cada nuevo contrato
    if (p) p.redProteccionUsed = false;
  });
}

function setContract(contractKey) {
  gameState.activeContract = contractKey;
  gameState.party.isWaiting = false;
  gameState.party.actionInProgress = false;

  initContractEffects();

  if (gameState.mode === "online" && gameState.isHost && gameState.roomRef) {
    gameState.roomRef.update({
      activeContract: contractKey,
      players: gameState.players,
      "gameState/actionInProgress": false,
      "gameState/lastAction": `Contrato cambiado a: ${contractKey.toUpperCase()}`
    }).catch(console.error);
  }

  renderPlayers();
  renderContractUI();
  renderTurnStatus();
  showNotification(`Contrato: ${contractKey.replace("_", " ").toUpperCase()}`, "info");
}

function startNextMiniGame(gameKey = null) {
  const target = gameKey || gameState.activeContract;
  setContract(target);
}

// ==========================================
// 9. RENDERIZADO Y CONTROL DE UI
// ==========================================
function renderContractUI() {
  const contractTitle = document.getElementById("contractTitle");
  const contractPanel = document.getElementById("contractPanel");
  if (contractTitle) {
    contractTitle.textContent = gameState.activeContract.replace("_", " ").toUpperCase();
  }

  if (!contractPanel) return;
  contractPanel.innerHTML = "";

  const actionWrapper = document.createElement("div");
  actionWrapper.className = "contract-actions-wrapper";

  switch (gameState.activeContract) {
    case "guerra_bandas":
      actionWrapper.innerHTML = `
        <div class="gang-actions-grid">
          <button class="btn-action btn-weapon" data-action="tommy">
            💥 Ráfaga Tommy Gun <small>(1d6 x 4)</small>
          </button>
          <button class="btn-action btn-weapon" data-action="sniper">
            🎯 Francotirador <small>(d20 ≥ 11 / d12)</small>
          </button>
          <button class="btn-action btn-weapon btn-heal" data-action="medico">
            💉 Médico <small>(1d8 cura)</small>
          </button>
          <button class="btn-action btn-weapon btn-poison" data-action="soplon">
            🐀 El Soplón <small>(DoT Veneno)</small>
          </button>
        </div>
      `;
      break;

    case "gran_atraco":
      actionWrapper.innerHTML = `
        <div class="heist-actions-grid">
          <p class="heist-alarm-tag">Nivel de Alarma Policial: <strong>${gameState.heistState.alarmLevel || 0}/3</strong></p>
          <div class="actions-row">
            <button class="btn-action" data-action="roll">🚨 Forzar Caja Fuerte (1-2 Alarma)</button>
            <button class="btn-action btn-secondary" data-action="bank">💰 Asegurar Botín en Bóveda</button>
          </div>
        </div>
      `;
      break;

    case "imperio_criminal": {
      let districtsHtml = `<div class="district-grid">`;
      CONFIG.DISTRICTS.forEach((d) => {
        const owner = gameState.empireState.districts[d.id]?.ownerUid;
        const ownerName = owner ? (gameState.players[owner]?.name || "Tomado") : "Libre";
        const isRival = owner && owner !== (localAuth.uid || gameState.currentTurnUid);

        districtsHtml += `
          <div class="district-card">
            <h4>${d.name}</h4>
            <p>Control: <strong>${escapeHTML(ownerName)}</strong></p>
            <p>Renta: +$${d.income} | Umbral: ${d.defValue}+</p>
            <div class="district-btn-group">
              <button class="btn-action btn-sm btn-claim" data-district="${d.id}">Conquistar</button>
              ${isRival ? `<button class="btn-action btn-sm btn-danger btn-sabotage" data-district="${d.id}">Sabotear</button>` : ""}
            </div>
          </div>
        `;
      });
      districtsHtml += `</div>`;
      actionWrapper.innerHTML = districtsHtml;
      break;
    }

    case "apuestas_clandestinas":
      actionWrapper.innerHTML = `
        <div class="gambling-actions-grid">
          <p class="pot-tag">Pozo de la Mesa: <strong>$${gameState.gamblingState.tablePot || 0}</strong></p>
          <div class="bet-grid">
            <button class="btn-action btn-sm btn-bet-opt" data-choice="par">PAR ($100)</button>
            <button class="btn-action btn-sm btn-bet-opt" data-choice="impar">IMPAR ($100)</button>
            <button class="btn-action btn-sm btn-bet-opt" data-choice="alto">ALTO [4-6] ($100)</button>
            <button class="btn-action btn-sm btn-bet-opt" data-choice="bajo">BAJO [1-3] ($100)</button>
          </div>
          <button class="btn-action btn-roll-table" data-action="roll_table" style="margin-top: 10px;">🎲 Tirar Dado</button>
        </div>
      `;
      break;
  }

  const activeUid = localAuth.uid || gameState.currentTurnUid;
  const activePlayer = gameState.players[activeUid] || {};

  const marketWrapper = document.createElement("div");
  marketWrapper.className = "black-market-section";
  marketWrapper.innerHTML = `
    <div class="market-header">
      <h4 class="market-title">🛒 MERCADO NEGRO OFICIAL</h4>
      <button id="btnRerollMarket" class="btn-action btn-sm btn-secondary">🔄 Actualizar Oferta ($50)</button>
    </div>
    
    <div class="market-grid">
      ${gameState.marketOffer.map((itemId) => {
        const item = MARKET_CATALOG.find((i) => i.id === itemId);
        if (!item) return "";
        const hasIt = activePlayer.passives?.includes(item.id);
        return `
          <div class="market-item-card ${hasIt ? "owned" : ""}">
            <div class="item-info">
              <span class="item-name">${item.name}</span>
              <span class="item-type-badge">${item.type.toUpperCase()}</span>
            </div>
            <p class="item-desc">${item.desc}</p>
            <div class="item-actions">
              <button class="btn-buy-item" data-item="${item.id}" ${hasIt ? "disabled" : ""}>
                ${hasIt ? "Adquirido" : `Comprar ($${item.cost})`}
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="player-inventory-panel">
      <h5>TUS CONSUMIBLES & ACTIVABLES:</h5>
      <div class="consumables-row">
        ${(activePlayer.consumables || []).map((itemId) => {
          const item = MARKET_CATALOG.find((i) => i.id === itemId);
          if (!item) return "";
          return `
            <div class="consumable-pill">
              <span>${item.name}</span>
              <button class="btn-use-item btn-sm" data-item="${item.id}">Usar</button>
              <button class="btn-sell-item btn-sm btn-danger" data-item="${item.id}">Vender</button>
            </div>
          `;
        }).join("") || '<span class="empty-inventory">Sin consumibles en mano.</span>'}

        ${activePlayer.passives?.includes("llamada_falsa_alarma") ? `
          <div class="consumable-pill special-pill">
            <span>Llamada Falsa Alarma</span>
            <button id="btnTriggerFalsaAlarma" class="btn-sm btn-warning">Revertir Daño & Redada</button>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  contractPanel.appendChild(actionWrapper);
  contractPanel.appendChild(marketWrapper);

  bindDynamicActionEvents();
}

function bindDynamicActionEvents() {
  document.querySelectorAll(".btn-weapon").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      triggerTurnAction(e.currentTarget.getAttribute("data-action"));
    });
  });

  document.querySelector(".heist-actions-grid [data-action='roll']")?.addEventListener("click", () => triggerTurnAction("roll"));
  document.querySelector(".heist-actions-grid [data-action='bank']")?.addEventListener("click", () => triggerTurnAction("bank"));

  document.querySelectorAll(".btn-claim").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      triggerTurnAction("claim", e.currentTarget.getAttribute("data-district"));
    });
  });

  document.querySelectorAll(".btn-sabotage").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      openSabotageModal(e.currentTarget.getAttribute("data-district"));
    });
  });

  document.querySelectorAll(".btn-bet-opt").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      placeBet(localAuth.uid || gameState.currentTurnUid, e.currentTarget.getAttribute("data-choice"), 100);
    });
  });
  document.querySelector(".btn-roll-table")?.addEventListener("click", () => triggerTurnAction("roll_table"));

  document.getElementById("btnRerollMarket")?.addEventListener("click", rerollMarket);

  document.querySelectorAll(".btn-buy-item").forEach((btn) => {
    btn.addEventListener("click", (e) => buyBlackMarketItem(e.currentTarget.getAttribute("data-item")));
  });

  document.querySelectorAll(".btn-sell-item").forEach((btn) => {
    btn.addEventListener("click", (e) => sellMarketItem(e.currentTarget.getAttribute("data-item")));
  });

  document.querySelectorAll(".btn-use-item").forEach((btn) => {
    btn.addEventListener("click", (e) => useConsumable(e.currentTarget.getAttribute("data-item")));
  });

  document.getElementById("btnTriggerFalsaAlarma")?.addEventListener("click", activateFalsaAlarma);
}

function renderPlayers() {
  const container = document.getElementById("playersContainer");
  if (!container) return;
  container.innerHTML = "";

  gameState.turnOrder.forEach((uid) => {
    const p = gameState.players[uid];
    if (!p) return;

    const isCurrent = gameState.currentTurnUid === uid;
    const card = document.createElement("div");
    card.className = `player-card ${isCurrent ? "active-turn" : ""} ${p.hp <= 0 ? "defeated" : ""}`;
    card.id = `card-${uid}`;

    const hpPercent = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));

    card.innerHTML = `
      <div class="player-header">
        <span class="player-name">${escapeHTML(p.name)}</span>
        ${p.isHost ? '<span class="badge-host">CAPO</span>' : ""}
      </div>
      <div class="hp-bar-bg">
        <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
      </div>
      <div class="player-stats">
        <span>HP: ${p.hp}/${p.maxHp} ${p.shield > 0 ? `(+${p.shield}🛡️)` : ""}</span>
        <span>Efectivo: $${p.cash || 0}</span>
      </div>
      <div class="player-status-icons">
        ${p.poison?.turns > 0 ? `<span class="badge-poison">🧪 Veneno (${p.poison.turns})</span>` : ""}
        ${p.hasSmokeScreen ? `<span class="badge-smoke">💨 Humo Activo</span>` : ""}
        ${p.hasLoadedDice ? `<span class="badge-dice-buff">🎲 Dados Trucados</span>` : ""}
      </div>
      <div class="player-passives-list">
        <small>Pasivas: ${(p.passives || []).map((pid) => MARKET_CATALOG.find((m) => m.id === pid)?.name || pid).join(", ") || "Ninguna"}</small>
      </div>
    `;

    container.appendChild(card);
  });
}

function renderCityEvent() {
  let eventEl = document.getElementById("cityEventBanner");
  if (!eventEl) {
    eventEl = document.createElement("div");
    eventEl.id = "cityEventBanner";
    eventEl.className = "city-event-banner";
    const header = document.querySelector(".battle-header-bar");
    if (header) header.parentNode.insertBefore(eventEl, header);
  }

  if (gameState.currentCityEvent) {
    eventEl.innerHTML = `
      <span class="event-tag">NOTICIA URBANA:</span>
      <strong>${gameState.currentCityEvent.name}</strong> - ${gameState.currentCityEvent.desc}
    `;
  }
}

function renderTurnStatus() {
  const statusEl = document.getElementById("turnStatusLabel");
  const mainRollBtn = document.getElementById("btnRollDice");
  if (!statusEl) return;

  const active = gameState.players[gameState.currentTurnUid];
  if (!active) return;

  const isMyTurn = (gameState.mode !== "online" && gameState.currentTurnUid !== "AI_BOT") ||
                   (gameState.mode === "online" && gameState.currentTurnUid === localAuth.uid);

  statusEl.textContent = isMyTurn ? "¡Es tu turno de dar la orden!" : `Planificando: ${active.name}`;

  if (mainRollBtn) {
    mainRollBtn.disabled = !isMyTurn || gameState.party.actionInProgress;
  }
}

function placeBet(uid, choice, amount) {
  const p = gameState.players[uid];
  if (!p || (p.cash || 0) < amount) {
    showNotification("Fondos insuficientes para apostar.", "warning");
    return;
  }

  p.cash -= amount;
  gameState.gamblingState.bets[uid] = { choice, amount };
  gameState.gamblingState.tablePot = (gameState.gamblingState.tablePot || 0) + amount;

  AudioFX.play("coins");
  renderPlayers();
  renderContractUI();
}

function hideLobbyShowBattle() {
  const lobby = document.getElementById("lobbySection");
  const battle = document.getElementById("battleSection");
  if (lobby) lobby.style.display = "none";
  if (battle) battle.style.display = "block";
}

function resetToMainMenu() {
  cleanupRoomListeners();
  gameState.mode = "local";
  gameState.roomId = null;
  const lobby = document.getElementById("lobbySection");
  const battle = document.getElementById("battleSection");
  if (lobby) lobby.style.display = "block";
  if (battle) battle.style.display = "none";
}

function showNotification(msg, type = "info") {
  const el = document.getElementById("gameNotification");
  if (!el) {
    console.log(`[Notif][${type}] ${msg}`);
    return;
  }
  el.textContent = msg;
  el.className = `notification-toast show toast-${type}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.className = "notification-toast";
  }, 3400);
}

function getCenterCoords() {
  const board = document.getElementById("gameBoard");
  if (board) {
    const rect = board.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function escapeHTML(str) {
  return String(str || "").replace(/[&<>'"]/g, (tag) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag
  ));
}

// ==========================================
// 10. MULTIPLAYER ONLINE (FIREBASE RTDB & AUTH)
// ==========================================
function initFirebaseAuth() {
  if (typeof firebase === "undefined" || !firebase.auth) return;

  const auth = firebase.auth();
  auth.onAuthStateChanged((user) => {
    if (user) {
      localAuth.uid = user.uid;
      localAuth.isReady = true;
      updateAuthUI(true);
    } else {
      localAuth.isReady = false;
      auth.signInAnonymously().catch(console.error);
    }
  });
}

function updateAuthUI(ready) {
  const onlineButtons = document.querySelectorAll(".btn-online-action");
  onlineButtons.forEach((btn) => {
    btn.disabled = !ready;
  });

  const uidBadge = document.getElementById("playerUidBadge");
  if (uidBadge) {
    uidBadge.textContent = ready ? `UID: ${localAuth.uid.substring(0, 6)}...` : "Conectando...";
    uidBadge.title = localAuth.uid || "";
  }
}

function createOnlineRoom() {
  if (!localAuth.isReady || !localAuth.uid) {
    showNotification("Esperando autorización de Firebase...", "warning");
    return;
  }

  const db = firebase.database();
  const roomId = "CD-" + Math.floor(1000 + Math.random() * 9000);
  const roomRef = db.ref(`rooms/${roomId}`);

  cleanupRoomListeners();

  const initialRoomData = {
    roomId: roomId,
    hostUid: localAuth.uid,
    status: "lobby",
    activeContract: gameState.activeContract,
    currentCityEvent: gameState.currentCityEvent,
    marketOffer: generateMarketOffer(),
    maxPlayers: CONFIG.MAX_PLAYERS_DEFAULT,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    currentTurnIndex: 0,
    currentTurnUid: localAuth.uid,
    turnOrder: [localAuth.uid],
    players: {
      [localAuth.uid]: createPlayerData(localAuth.uid, localAuth.username, true)
    },
    heistState: { vaultPot: 3000, alarmLevel: 0, roundLoot: 0 },
    empireState: { districts: initDistrictsState() },
    gamblingState: { tablePot: 0, bets: {} },
    gameState: {
      round: 1,
      lastAction: "Sala creada por el líder.",
      actionInProgress: false
    }
  };

  roomRef.set(initialRoomData)
    .then(() => {
      gameState.mode = "online";
      gameState.roomId = roomId;
      gameState.isHost = true;
      gameState.roomRef = roomRef;

      roomRef.child(`players/${localAuth.uid}/connected`).onDisconnect().set(false);
      setupRoomListener(roomRef);
      showNotification(`Sala ${roomId} creada. Esperando oponente...`, "success");
      updateLobbyUI();
    })
    .catch((err) => {
      showNotification("Error creando sala: " + err.message, "danger");
    });
}

function joinOnlineRoom(targetRoomId) {
  if (!localAuth.isReady || !localAuth.uid) {
    showNotification("Esperando autorización de Firebase...", "warning");
    return;
  }

  const cleanRoomId = (targetRoomId || "").trim().toUpperCase();
  if (!cleanRoomId) {
    showNotification("Código de sala inválido.", "warning");
    return;
  }

  const db = firebase.database();
  const roomRef = db.ref(`rooms/${cleanRoomId}`);

  cleanupRoomListeners();

  roomRef.once("value")
    .then((snapshot) => {
      if (!snapshot.exists()) throw new Error("La sala no existe.");

      const data = snapshot.val();
      if (data.status !== "lobby") throw new Error("La partida ya comenzó o finalizó.");

      const currentUids = Object.keys(data.players || {});
      if (currentUids.length >= (data.maxPlayers || CONFIG.MAX_PLAYERS_DEFAULT) && !data.players[localAuth.uid]) {
        throw new Error("La sala está llena.");
      }

      const updates = {};
      updates[`players/${localAuth.uid}`] = createPlayerData(localAuth.uid, localAuth.username, false);

      if (!data.turnOrder || !data.turnOrder.includes(localAuth.uid)) {
        updates["turnOrder"] = data.turnOrder ? [...data.turnOrder, localAuth.uid] : [data.hostUid, localAuth.uid];
      }

      return roomRef.update(updates);
    })
    .then(() => {
      gameState.mode = "online";
      gameState.roomId = cleanRoomId;
      gameState.isHost = false;
      gameState.roomRef = roomRef;

      roomRef.child(`players/${localAuth.uid}/connected`).onDisconnect().set(false);
      setupRoomListener(roomRef);
      showNotification(`Conectado a ${cleanRoomId}`, "success");
      updateLobbyUI();
    })
    .catch((err) => {
      showNotification(err.message, "danger");
    });
}

function cleanupRoomListeners() {
  if (gameState.roomRef) {
    gameState.roomRef.off();
    gameState.roomRef = null;
  }
}

function setupRoomListener(roomRef) {
  roomRef.on("value", (snapshot) => {
    if (!snapshot.exists()) {
      showNotification("La sala ha sido cerrada.", "danger");
      resetToMainMenu();
      return;
    }
    syncOnlineState(snapshot.val());
  });
}

function syncOnlineState(data) {
  gameState.players = data.players || {};
  gameState.turnOrder = data.turnOrder || Object.keys(gameState.players);
  gameState.currentTurnIndex = data.currentTurnIndex || 0;
  gameState.currentTurnUid = data.currentTurnUid || gameState.turnOrder[gameState.currentTurnIndex];
  gameState.activeContract = data.activeContract || "guerra_bandas";
  gameState.currentCityEvent = data.currentCityEvent || CONFIG.CITY_EVENTS[3];
  gameState.marketOffer = data.marketOffer || generateMarketOffer();

  if (data.heistState) gameState.heistState = data.heistState;
  if (data.empireState) gameState.empireState = data.empireState;
  if (data.gamblingState) gameState.gamblingState = data.gamblingState;

  if (data.gameState) {
    gameState.party.actionInProgress = !!data.gameState.actionInProgress;
  }

  renderPlayers();
  renderContractUI();
  renderCityEvent();
  renderTurnStatus();

  if (data.status === "lobby") {
    const pCount = Object.keys(gameState.players).length;
    const startBtn = document.getElementById("btnStartOnlineMatch");
    if (startBtn) {
      startBtn.style.display = gameState.isHost ? "inline-block" : "none";
      startBtn.disabled = pCount < 2;
    }
  } else if (data.status === "playing") {
    hideLobbyShowBattle();
  }
}

function updateLobbyUI() {
  const label = document.getElementById("currentRoomCode");
  if (label && gameState.roomId) {
    label.textContent = `SALA: ${gameState.roomId}`;
  }
}

// ==========================================
// 11. INICIALIZACIÓN DE MODOS LOCAL Y SOLITARIO
// ==========================================
function startLocalMatch() {
  cleanupRoomListeners();
  gameState.mode = "local";
  gameState.roomId = null;
  gameState.isHost = true;
  gameState.currentTurnIndex = 0;
  gameState.marketOffer = generateMarketOffer();

  const p1Uid = localAuth.uid || "LOCAL_P1";
  const p2Uid = "LOCAL_P2";

  gameState.players = {
    [p1Uid]: createPlayerData(p1Uid, localAuth.username, true),
    [p2Uid]: createPlayerData(p2Uid, "Matón Callejero", false)
  };

  gameState.turnOrder = [p1Uid, p2Uid];
  gameState.currentTurnUid = p1Uid;
  gameState.empireState.districts = initDistrictsState();

  hideLobbyShowBattle();
  setContract("guerra_bandas");
  renderPlayers();
  renderCityEvent();
}

function startAIMatch() {
  cleanupRoomListeners();
  gameState.mode = "ai";
  gameState.roomId = null;
  gameState.isHost = true;
  gameState.currentTurnIndex = 0;
  gameState.marketOffer = generateMarketOffer();

  const p1Uid = localAuth.uid || "LOCAL_PLAYER";
  const aiUid = "AI_BOT";

  gameState.players = {
    [p1Uid]: createPlayerData(p1Uid, localAuth.username, true),
    [aiUid]: createPlayerData(aiUid, "Don Salieri (IA)", false)
  };

  gameState.turnOrder = [p1Uid, aiUid];
  gameState.currentTurnUid = p1Uid;
  gameState.empireState.districts = initDistrictsState();

  hideLobbyShowBattle();
  setContract("guerra_bandas");
  renderPlayers();
  renderCityEvent();
}

// ==========================================
// 12. DOM LOAD & BINDINGS INICIALES
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  console.log("[CrimenDev] Criminal Dice - Engine Táctico 1v1 Inicializado.");

  initFirebaseAuth();

  document.querySelectorAll(".btn-select-contract").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const contract = e.currentTarget.getAttribute("data-contract");
      if (contract) setContract(contract);
    });
  });

  document.getElementById("btnModeLocal")?.addEventListener("click", startLocalMatch);
  document.getElementById("btnModeAI")?.addEventListener("click", startAIMatch);
  document.getElementById("btnCreateOnlineRoom")?.addEventListener("click", createOnlineRoom);

  document.getElementById("btnJoinOnlineRoom")?.addEventListener("click", () => {
    const input = document.getElementById("inputRoomCode");
    joinOnlineRoom(input ? input.value : "");
  });

  document.getElementById("btnRollDice")?.addEventListener("click", () => {
    if (gameState.activeContract === "guerra_bandas") {
      triggerTurnAction("tommy");
    } else {
      triggerTurnAction("roll");
    }
  });
});
