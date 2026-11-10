// ===== Mercado Negro, objetos y Eventos de Ciudad =====
// Catálogo y reglas portados de la versión anterior (17 contactos pasivos + 5 consumibles + 5 eventos).
// TODOS los precios y cantidades de la economía están en ECON / ITEMS: ajústalos aquí sin tocar el resto.
const ECON = {
  START_PARTY: 100,                  // dinero inicial en Modo Party (el mercado se abre después de cada contrato)
  START_SINGLE: 350,                 // dinero inicial en un único contrato (el mercado se abre antes de empezar)
  REWARDS: [110, 85, 65, 50],        // recompensa al terminar un contrato de Party, según el puesto (1.º, 2.º, 3.º, 4.º)
  EXP_LOOT_RATE: 10,                 // 💲 por cada bolsa de botín asegurada en un atraco (mercados intermedios del Gran Atraco)
  REROLL_BASE: 50, REROLL_STEP: 25,  // renovar la tienda: precio inicial y aumento por uso (se reinicia en cada mercado)
  STOCK: 4, MAX_PASSIVES: 3,         // objetos a la venta y límite de contactos pasivos (el consumible es 1 aparte)
  SELL: 0.50, SELL_DESGUACE: 0.75,   // % que se recupera al vender
  USURERO: 0.15, USURERO_MAX: 200, PRESTAMISTA_MONEY: 150, PRESTAMISTA_HP: 4,
  EXTORSIONADOR: 4, MATEMATICO: 15, COBRADOR: 50,    // 💲 por turno sin daño · 💲 al sacar el máximo en un dado · 💲 al sacar 1 en d6
  EVENT_CHANCE: 0.65,                // probabilidad de que haya un Evento de Ciudad en cada contrato (si están activados)
  TAX: n => Math.floor(n * 0.9)      // Comisionado: lo que te queda tras el 10% (igual que la versión anterior: redondea hacia abajo)
};
const ITEMS = [
  { id:'contact_armero', icon:'🔫', name:'Armero Clandestino', cost:320, kind:'p', desc:'+2 a tiradas d20 (máximo 20).', incompatible:[] },
  { id:'contact_tahur', icon:'🃏', name:'El Cobrador de la Mesa', cost:140, kind:'p', desc:'Si sacas 1 en d6, ganas +50💲 para tu dinero del Mercado Negro. No se combina con el Tallador de Dados.', incompatible:[], econ:true, excludes:['contact_tallador'] },
  { id:'contact_crupier', icon:'🎲', name:'Crupier de Esquina', cost:130, kind:'p', desc:'Un resultado par de d6 recibe +1, sin superar 6.', incompatible:[] },
  { id:'contact_tallador', icon:'🎯', name:'Tallador de Dados', cost:150, kind:'p', desc:'En Atraco y Apuestas, transforma un 1 en d6 en un valor seguro (Atraco: 3; Apuestas: 2). No se combina con El Cobrador de la Mesa.', incompatible:['maf', 'rpg'], excludes:['contact_tahur'] },
  { id:'contact_matematico', icon:'🧮', name:'Matemático del Sindicato', cost:200, kind:'p', desc:'Sacar el máximo en cualquier dado otorga +15💲.', incompatible:[], econ:true },
  { id:'contact_matasanos', icon:'🩺', name:'Médico Matasanos', cost:380, kind:'p', desc:'+50% a toda curación recibida.', incompatible:['maf', 'pok'] },
  { id:'contact_desguace', icon:'🔧', name:'Dueño del Desguace', cost:90, kind:'p', desc:'Vender artículos te devuelve el 75% de su valor.', incompatible:[], econ:true },
  { id:'contact_policia', icon:'🚓', name:'Protección Policial', cost:180, kind:'p', desc:'80% de probabilidad de bloquear una Redada o un Infiltrar Soplón.', incompatible:['exp', 'pok'] },
  { id:'contact_dinamita', icon:'🧨', name:'Tramposo de la Casa', cost:160, kind:'p', desc:'En Atraco, sacar 1 en el d20 de Forzar Bóveda te quita 2 de daño de la alarma. En Apuestas, sacar 1 en el d20 del Golpe a la Mesa hace que solo pierdas 1 ficha.', incompatible:['rpg', 'maf'] },
  { id:'contact_contador', icon:'📒', name:'Contador de la Mafia', cost:160, kind:'p', desc:'Multiplica x1.5 la recompensa final de Guerra si conservas más del 50% de tu salud.', incompatible:['maf', 'pok', 'exp'], econ:true },
  { id:'contact_usurero', icon:'💰', name:'Inversionista Usurero', cost:150, kind:'p', desc:'Al salir de la tienda, +15% de interés sobre tu dinero (máx. 200).', incompatible:[], econ:true },
  { id:'contact_prestamista', icon:'🩸', name:'Prestamista Siniestro', cost:250, kind:'p', desc:'+150💲 al inicio de minijuego, pero -4 HP/COB máxima.', incompatible:['maf', 'pok'], econ:true },
  { id:'contact_extorsionador', icon:'💼', name:'Extorsionador de Barrio', cost:170, kind:'p', desc:'Ganas +4💲 por cada turno finalizado sin recibir daño.', incompatible:[], econ:true },
  { id:'contact_maton', icon:'🥊', name:'Matón a Sueldo', cost:150, kind:'p', desc:'+2 al resultado del d4 de tu primera Lanzar Granada de CADA atraco (Atraco) y de tu primera Trampa de Tahúr (Apuestas).', incompatible:['rpg', 'maf'] },
  { id:'contact_chofer', icon:'🚗', name:'Chófer de Huida', cost:200, kind:'p', desc:'Si tu HP/COB está por debajo del 25%, recibes -2 daño.', incompatible:['maf', 'pok'] },
  { id:'contact_quimico', icon:'🧪', name:'Químico Corruptor', cost:190, kind:'p', desc:'En Guerra, un Francotirador que acierta con 20 en el d20 envenena 3 rondas. En Imperio, un 20 en Sobornar Político permite una Redada extra.', incompatible:['exp', 'pok'] },
  { id:'contact_arquitecto', icon:'🏛️', name:'Red de Protección', cost:260, kind:'p', desc:'+10% a ingresos y curaciones. Bloquea la primera Redada o Infiltrar Soplón que recibas.', incompatible:['exp', 'pok'] },
  { id:'item_puro', icon:'🚬', name:'Puro del Capo', cost:80, kind:'c', desc:'Repite la última tirada de dado (te lo ofrece tras cada tirada de tu turno).', incompatible:[] },
  { id:'item_whisky', icon:'🥃', name:'Whisky Clandestino', cost:70, kind:'c', desc:'Duplica el daño/botín de tu próxima acción, pero resta 2 HP/Cobertura.', incompatible:['maf', 'pok'] },
  { id:'item_soborno', icon:'🤝', name:'Soborno Relámpago', cost:90, kind:'c', desc:'Fuerza un 6 en tu próximo d6.', incompatible:[] },
  { id:'item_adrenalina', icon:'💉', name:'Inyección Adrenalina', cost:90, kind:'c', desc:'Cura +4 HP/Cobertura al instante (hasta tu máximo inicial).', incompatible:['maf', 'pok'] },
  { id:'item_falsa_alarma', icon:'📞', name:'Llamada Falsa Alarma', cost:110, kind:'c', desc:'Cancela lo que te hicieron los rivales desde tu último turno (daño, Soplón, Redadas o fichas robadas). Puedes usarla en cuanto te afecten o en tu turno.', incompatible:[] }
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const EVENTS = {
  purga:       { title:'📰 NOCHE DE PURGA', desc:'Guerra: Tommy/Francotirador +2 daño · Atraco: Trampa/Granada +2 daño', games:['rpg', 'exp'] },
  ley_seca:    { title:'📰 LEY SECA CLANDESTINA', desc:'-50% a curaciones · -1 a las tiradas de d6', games:['rpg', 'exp', 'maf', 'pok'] },
  inspectores: { title:'📰 GUERRA DE INSPECTORES', desc:'Recaudación x2 · 50% de riesgo de inspección en la Recaudación Segura', games:['maf'] },
  carnicero:   { title:'💀 JEFE: EL CARNICERO', desc:'El jefe tiene +10 HP/COB, +1 daño y recibe +1 daño. Vencerlo otorga x2 de recompensa; si gana el jefe, se lleva x1.5.', games:['rpg', 'exp'] },
  comisionado: { title:'💀 JEFE: COMISIONADO CORRUPTO', desc:'-10% de Efectivo/Fichas/Botín al terminar tu turno', games:['exp', 'maf', 'pok'] }
};
// Utilidad (0-1) de cada objeto por contrato: la usa la IA para comprar. Si falta un dato, vale 0.5.
const ITEM_VALUE = {
  contact_armero:{ rpg:.55, exp:.6, maf:1, pok:.9 }, contact_tahur:{ rpg:.8, exp:.15, maf:.3, pok:.1 }, contact_crupier:{ rpg:.45, exp:.1, maf:.1, pok:.1 },
  contact_tallador:{ exp:.3, pok:.1 }, contact_matematico:{ rpg:.55, exp:.45, maf:.6, pok:.2 }, contact_matasanos:{ rpg:1, exp:.35 },
  contact_desguace:{ rpg:.2, exp:.2, maf:.2, pok:.2 }, contact_policia:{ rpg:.3, maf:.35 }, contact_dinamita:{ exp:.2, pok:.2 }, contact_contador:{ rpg:.3 },
  contact_usurero:{ rpg:.35, exp:.35, maf:.35, pok:.35 }, contact_prestamista:{ rpg:.2, exp:.1 }, contact_extorsionador:{ rpg:.5, exp:.45, maf:.9, pok:.3 },
  contact_maton:{ exp:.15, pok:.35 }, contact_chofer:{ rpg:.45, exp:.15 }, contact_quimico:{ rpg:.3, maf:.1 }, contact_arquitecto:{ rpg:.1, maf:.8 },
  item_puro:{ rpg:.35, exp:.1, maf:.1, pok:.35 }, item_whisky:{ rpg:.3, exp:.3 }, item_soborno:{ rpg:.15, exp:.05, maf:.05, pok:.35 },
  item_adrenalina:{ rpg:.4, exp:.35 }, item_falsa_alarma:{ rpg:.4, exp:.1, maf:.2, pok:.5 }
};
const MAF_RAID_TARGETS = (G, me) => MAF.raidTargets(G, me);
const SHORT_NAMES = { rpg:'Guerra', exp:'Atraco', maf:'Imperio', pok:'Apuestas' };     // nombres cortos que se muestran en "Funciona en"
const CONTRACT_NAMES = { rpg:'Guerra de Bandas', exp:'El Gran Atraco', maf:'Imperio Criminal', pok:'Apuestas Clandestinas' };

const MK = {
  pct(n, p) { const x = n * (1 + p), f = Math.floor(x); return f + (Math.random() < x - f ? 1 : 0); },   // +p% sin sesgo de redondeo
  on: () => !!(CD.cfg && CD.cfg.market),
  eventsOn: () => !!(CD.cfg && CD.cfg.events),
  compatible: (id, contract) => !ITEM_BY_ID[id].incompatible.includes(contract),
  has(p, id) { return MK.on() && !!p && Array.isArray(p.contacts) && p.contacts.includes(id) && MK.compatible(id, CD.contract); },
  ev: () => (CD.G && CD.G.event && CD.G.event.code) || null,
  boss: () => (CD.G && CD.G.event && CD.G.event.code === 'carnicero') ? CD.G.event.boss : null,
  party: () => CD.cfg.mode === 'party',

  // ---------- economía por jugador ----------
  initEcon(G) {
    G.players.forEach(p => Object.assign(p, { money:this.party() ? ECON.START_PARTY : ECON.START_SINGLE, contacts:[], consumable:null, stock:[], rerollCost:ECON.REROLL_BASE }));
  },
  newStock(p) {                                 // 4 objetos al azar; en un único contrato solo los que funcionan en él y sirven para esa partida
    const single = !this.party();
    return ITEMS.filter(i => (!single || (this.compatible(i.id, CD.contract) && !(i.econ && CD.contract !== 'exp'))) && !this.clash(p, i.id))
      .sort(() => Math.random() - .5).slice(0, ECON.STOCK).map(i => i.id);
  },
  clash(p, id) {                                // objetos que no se combinan (Tallador ↔ Cobrador): si tienes uno, no te ofrecen el otro
    return !!p && (ITEM_BY_ID[id].excludes || []).some(x => (p.contacts || []).includes(x));
  },
  // ---------- lo que te hacen los rivales (para la Llamada Falsa Alarma) ----------
  // Cada jugador guarda lo que le hicieron los rivales desde que terminó su último turno: { n:daño o fichas, from:quién, poison, raid, tick }.
  hurt(G, q, info) {
    const cur = G.players[G.turn]; if (!q || (cur && cur.slot === q.slot)) return;      // lo que te pasa en tu propio turno no cuenta
    q.hurt = (q.hurt || []).concat(info);
  },
  falsaUseful(G, p) {
    const h = p.hurt || [];
    if (CD.contract === 'rpg') return p.poison > 0 || h.some(x => x.n > 0);
    if (CD.contract === 'maf') return Object.keys(p.raids || {}).some(d => p.raids[d] > 0);
    if (CD.contract === 'pok') return h.some(x => x.n > 0 && x.from != null);
    return h.some(x => x.n > 0);
  },
  gain(p, n, text) { p.money = (p.money || 0) + n; CD.float(p.slot, '+' + n + '💲' + (text ? ' ' + text : ''), 'loot'); },
  contractStart(G) {                            // reinicio de banderas por contrato y efectos de inicio
    G.players.forEach(p => {
      Object.assign(p, { bunkerUsed:false, matonUsed:false, tookDmg:false, force6:false, mult:1, hurt:[] });
      if (this.has(p, 'contact_prestamista')) {
        this.gain(p, ECON.PRESTAMISTA_MONEY, 'PRESTAMISTA');
        CD.log(`🩸 ${p.name} usa al Prestamista Siniestro: +${ECON.PRESTAMISTA_MONEY}💲 y -${ECON.PRESTAMISTA_HP} de HP/COB máxima.`);
        if (CD.contract === 'rpg' && p.max > 2) { p.max -= ECON.PRESTAMISTA_HP; p.hp = Math.min(p.hp, p.max); }   // en el Atraco se aplica en cada atraco
      }
    });
  },

  // ---------- modificadores de dados ----------
  modRoll(p, sides, val, forced) {
    const fl = (t, k) => CD.float(p.slot, t, k || 'status');
    if (this.eventsOn() && this.ev() === 'ley_seca' && sides === 6 && !forced && val > 1) { val -= 1; fl('-1 LEY SECA'); CD.log(`🍷 Ley Seca: el d6 de ${p.name} baja a ${val}.`); }
    if (!this.on()) return val;
    if (sides === 20 && this.has(p, 'contact_armero') && val < 20) { val = Math.min(20, val + 2); fl('+2 ARMERO', 'crit'); }
    if (sides === 6 && this.has(p, 'contact_tallador') && val === 1) { val = CD.contract === 'exp' ? 3 : 2; fl('TALLADOR (' + val + ')', 'crit'); }
    if (sides === 6 && this.has(p, 'contact_crupier') && val % 2 === 0 && val < 6) { val += 1; fl('+1 CRUPIER', 'crit'); }
    if (this.has(p, 'contact_matematico') && val === sides) { this.gain(p, ECON.MATEMATICO, 'MATEMÁTICO'); }
    if (sides === 6 && this.has(p, 'contact_tahur') && val === 1) { this.gain(p, ECON.COBRADOR, 'COBRADOR'); CD.log(`🃏 El Cobrador de la Mesa suma +${ECON.COBRADOR}💲 a ${p.name}.`); }
    return val;
  },

  // ---------- defensa, curación y daño ----------
  heal(p, h) {                                  // Ley Seca → Red de Protección → Matasanos
    if (this.eventsOn() && this.ev() === 'ley_seca') h = Math.max(1, Math.floor(h * 0.5));
    if (this.has(p, 'contact_arquitecto')) h = this.pct(h, 0.10);
    if (this.has(p, 'contact_matasanos')) h = Math.floor(h * 1.5);
    return Math.max(h, h > 0 ? 1 : 0);
  },
  block(def, what) {                            // Redada / Soplón entrante: Red de Protección (1 vez) o Protección Policial (80%)
    if (this.has(def, 'contact_arquitecto') && !def.bunkerUsed) { def.bunkerUsed = true; CD.float(def.slot, '🏛️ BLOQUEADO', 'status'); return { kind:'bunker', text:'🏛️ ¡RED DE PROTECCIÓN de ' + def.name + '! ' + what + ' fue bloqueado.' }; }
    if (this.has(def, 'contact_policia') && Math.random() < 0.8) { CD.float(def.slot, '🚓 INTERCEPTADO', 'status'); return { kind:'police', text:'🚓 ¡PROTECCIÓN POLICIAL de ' + def.name + '! ' + what + ' fue interceptado (80%).' }; }
    return null;
  },
  chofer(def, dmg) {                            // -2 de daño si estás por debajo del 25%
    if (this.has(def, 'contact_chofer') && def.max > 0 && def.hp / def.max < 0.25) { CD.float(def.slot, '-2 CHÓFER', 'status'); return Math.max(1, dmg - 2); }
    return dmg;
  },

  // ---------- fin de turno: Comisionado y Extorsionador ----------
  turnEnd(G, p) {
    if (this.eventsOn() && this.ev() === 'comisionado') {
      const f = { maf:'coins', pok:'tokens', exp:'temp' }[CD.contract];
      if (f && p[f] > 0) {
        const left = ECON.TAX(p[f]); CD.log(`🕵️‍♂️ EL COMISIONADO confisca ${p[f] - left} a ${p.name}.`); CD.float(p.slot, '-' + (p[f] - left) + ' COMISIONADO', 'dmg'); p[f] = left;
        if (CD.contract === 'pok' && p.tokens <= 0) { p.tokens = 0; p.alive = false; p.elimN = G.elimCount = (G.elimCount || 0) + 1; CD.log('💀 ' + p.name + ' queda sin fichas por el Comisionado.'); if (CD.alive().length <= 1) POK.finishGame(G, 'Último en pie'); }
      }
    }
    if (this.has(p, 'contact_extorsionador') && !p.tookDmg && !(CD.contract === 'exp' && !p.alive)) { this.gain(p, ECON.EXTORSIONADOR, 'EXTORSIONADOR'); }
    p.tookDmg = false; p.mult = 1; p.hurt = [];
  },

  // ---------- eventos de ciudad ----------
  async rollEvent(G) {
    G.event = null;
    if (!this.eventsOn() || Math.random() >= ECON.EVENT_CHANCE) return;
    const valid = Object.keys(EVENTS).filter(k => EVENTS[k].games.includes(CD.contract));
    const code = valid[Math.floor(Math.random() * valid.length)];
    G.event = { code, boss:code === 'carnicero' ? G.players[Math.floor(Math.random() * G.players.length)].slot : null };
    const e = EVENTS[code], boss = G.event.boss != null ? G.players[G.event.boss].name : '';
    const title = code === 'carnicero' ? `${e.title} (${boss.toUpperCase()})` : e.title;
    CD.log(`📰 EVENTO DE CIUDAD: ${title} — ${e.desc}`);
    await CD.banner(title, e.desc);
  },

  // ---------- recompensa de fin de contrato (Party) ----------
  settle(G, rank, winnerSlot) {
    const out = {};
    (rank || G.players.map(p => ({ slot:p.slot, place:1 }))).forEach(e => {
      const p = G.players[e.slot]; let r = ECON.REWARDS[Math.min(e.place, ECON.REWARDS.length) - 1], note = '';
      const pct = (CD.contract === 'rpg' || CD.contract === 'exp') && p.max > 0 ? p.hp / p.max : 1;
      if (this.has(p, 'contact_contador') && pct > 0.5) { r = Math.floor(r * 1.5); note += ' (Contador x1.5)'; }
      if (this.boss() != null && winnerSlot === p.slot && p.slot !== this.boss()) { r *= 2; note += ' (¡venció al Carnicero! x2)'; }
      else if (this.boss() != null && winnerSlot === p.slot) { r = Math.floor(r * 1.5); note += ' (el Carnicero gana: x1.5)'; }
      p.money = (p.money || 0) + r; out[p.slot] = { amount:r, note };
    });
    return out;
  },
  expDiveReward(G, gainedBySlot) {              // mercados intermedios del Gran Atraco (contrato único): proporcional al botín asegurado
    return G.players.map(p => { const n = Math.round((gainedBySlot[p.slot] || 0) * ECON.EXP_LOOT_RATE); p.money = (p.money || 0) + n; return { slot:p.slot, amount:n }; });
  },

  // ---------- tienda ----------
  buy(p, id) {
    const it = ITEM_BY_ID[id]; if (!it || !(p.stock || []).includes(id) || p.money < it.cost) return false;
    if (it.kind === 'p' ? (p.contacts.length >= ECON.MAX_PASSIVES || p.contacts.includes(id)) : !!p.consumable) return false;
    if (this.clash(p, id)) return false;
    p.money -= it.cost; p.stock = p.stock.filter(x => x !== id);
    if (it.kind === 'p') p.contacts.push(id); else p.consumable = id;
    p.stock = p.stock.filter(x => !this.clash(p, x));                                   // lo que ya no se combina con lo comprado sale de tu tienda
    CD.log(`🛒 ${p.name} compra ${it.icon} ${it.name}.`); return true;
  },
  sell(p, id) {
    const it = ITEM_BY_ID[id]; if (!it) return false;
    const rate = p.contacts.includes('contact_desguace') ? ECON.SELL_DESGUACE : ECON.SELL;     // el Desguace funcione o no en el contrato, vende mejor
    if (it.kind === 'p' && p.contacts.includes(id)) p.contacts = p.contacts.filter(x => x !== id); else if (p.consumable === id) p.consumable = null; else return false;
    const back = Math.floor(it.cost * rate); p.money += back; CD.log(`💱 ${p.name} vende ${it.icon} ${it.name} por ${back}💲.`); return true;
  },
  reroll(p) { if (p.money < p.rerollCost) return false; p.money -= p.rerollCost; p.rerollCost += ECON.REROLL_STEP; p.stock = this.newStock(p); return true; },
  leave(p) {                                    // al salir de la tienda: interés del Usurero
    if (p.contacts.includes('contact_usurero')) { const n = Math.min(ECON.USURERO_MAX, Math.floor(p.money * ECON.USURERO)); if (n > 0) { p.money += n; CD.log(`💰 El Usurero le paga a ${p.name} ${n}💲 de interés.`); } }
  },

  // ---------- consumibles ----------
  async use(G, p) {
    const id = p.consumable; if (!id || !this.on() || !this.compatible(id, CD.contract)) return false;
    const it = ITEM_BY_ID[id]; p.consumable = null; CD.log(`${it.icon} ${p.name} usa ${it.name}.`);
    if (id === 'item_adrenalina') {
      const before = p.hp; p.hp = Math.max(p.hp, Math.min(p.max, p.hp + 4)); CD.float(p.slot, '+' + (p.hp - before) + (CD.contract === 'exp' ? ' COB' : ' HP'), 'heal');
    } else if (id === 'item_whisky') {
      p.hp = Math.max(0, p.hp - 2); p.mult = (p.mult || 1) * 2; CD.float(p.slot, '-2 · x2 🥃', 'crit');
      if (p.hp <= 0) { if (CD.contract === 'rpg') { p.alive = false; p.poison = 0; p.outRound = G.round; p.elimN = G.elimCount = (G.elimCount || 0) + 1; CD.log('💀 ' + p.name + ' cae por el Whisky.'); RPG.check(G); }
        else if (p.alive) { EXP.arrest(p, `🚨 ¡${p.name} colapsa por el Whisky! Cobertura destruida.`); if (!G.players.some(q => q.alive)) EXP.endDive(G); } }
    } else if (id === 'item_soborno') { p.force6 = true; }
    else if (id === 'item_falsa_alarma') this.falsa(G, p);
    return true;
  },
  falsa(G, p) {                                 // cancela lo que te hicieron los rivales desde tu último turno
    const h = p.hurt || [], sum = h.reduce((s, x) => s + (x.n || 0), 0);
    if (CD.contract === 'rpg') { p.poison = 0; if (sum) { p.hp += sum; CD.float(p.slot, '+' + sum + ' 📞', 'heal'); } CD.log(`📞 Soplón cancelado${sum ? ' y ' + sum + ' de salud recuperada' : ''}.`); }
    else if (CD.contract === 'exp') { if (sum) { p.hp = Math.min(p.max, p.hp + sum); CD.float(p.slot, '+' + sum + ' COB 📞', 'heal'); CD.log(`📞 Recupera ${sum} de Cobertura dañada por granadas.`); } }
    else if (CD.contract === 'maf') { p.raids = {}; CD.float(p.slot, '📞 REDADAS CANCELADAS', 'status'); CD.log('📞 Redadas sobre tus distritos canceladas.'); }
    else if (CD.contract === 'pok') {
      let got = 0;
      h.filter(x => x.n > 0 && x.from != null).forEach(x => { const t = G.players[x.from], amt = Math.min(t.tokens, x.n); t.tokens -= amt; p.tokens += amt; got += amt;
        if (t.alive && t.tokens <= 0) POK.bust(G, t); });
      if (got) CD.float(p.slot, '+' + got + ' 🎰 📞', 'heal'); CD.log(`📞 Recobradas ${got} fichas.`);
      if (CD.alive().length <= 1) POK.finishGame(G, 'Último en pie');
    }
    p.hurt = [];
  },
  async offerFalsa(G, att, before) {            // tras la acción de un rival: quien tenga la Falsa Alarma y haya sido afectado puede usarla al momento
    if (!this.on()) return;
    for (const q of G.players) {
      if (G.over || G.between) return;
      const fresh = (q.hurt || []).slice(before[q.slot] || 0).filter(x => !x.tick);
      if (q === att || !fresh.length || q.consumable !== 'item_falsa_alarma' || !this.compatible('item_falsa_alarma', CD.contract) || !q.alive || !this.falsaUseful(G, q)) continue;
      const use = q.bot ? AI.falsaNow(G, q, CD.contract)
        : await CD.askPlayer(q.slot, { title:'📞 LLAMADA FALSA ALARMA', text:`${att.name} acaba de afectarte. ¿Usas la Falsa Alarma ahora para cancelarlo? (cancela todo lo que te hicieron desde tu último turno)`,
          options:[{ label:'📞 Usar ahora', value:true }, { label:'✋ Guardarla', value:false }] }) === true;
      if (!use || q.consumable !== 'item_falsa_alarma') continue;
      q.consumable = null; CD.log(`📞 ${q.name} usa la Llamada Falsa Alarma.`); this.falsa(G, q); CD.publish(); render();
    }
  },
  async offerPuro(p, sides, val) {              // tras una tirada del propio turno
    if (p.bot) return AI.puro ? AI.puro(sides, val) : false;
    const r = await CD.askPlayer(p.slot, { title:'🚬 PURO DEL CAPO', text:`Sacaste ${val} en un d${sides}. ¿Quieres repetir la tirada?`, options:[{ label:'🔁 Repetir', value:true }, { label:'✋ Mantener', value:false }] });
    return r === true;
  },

  useBtn(p) {                                   // botón "usar consumible" durante tu turno
    if (!this.on() || !p.consumable || p.consumable === 'item_puro') return null;
    const it = ITEM_BY_ID[p.consumable], ok = this.compatible(it.id, CD.contract), idle = ok && it.id === 'item_falsa_alarma' && !this.falsaUseful(CD.G, p);
    return { type:'use', label:it.icon + ' Usar ' + it.name, sub:!ok ? 'No funciona en este contrato' : idle ? 'Nada que cancelar todavía' : it.desc, disabled:!ok || idle, wide:true };
  },
  // ---------- interfaz de la tienda ----------
  hud(p) {
    if (!this.on() || p.money == null) return '';
    const chip = (id, cons) => { const it = ITEM_BY_ID[id]; return `<span class="mi ${this.compatible(id, CD.contract) ? '' : 'off'} ${cons ? 'cons' : ''}" title="${esc(it.name + ' [' + (it.kind === 'p' ? 'pasivo' : 'activo') + ']: ' + it.desc)}">${it.icon}</span>`; };
    return `<div class="mhud">💲 ${p.money}${(p.contacts || []).map(id => chip(id)).join('')}${p.consumable ? chip(p.consumable, true) : ''}</div>`;
  },
  act(op, id) {                                 // clic del jugador en la tienda
    const G = CD.G, m = G.market; if (!m || CD.cfg.tutorial) return;     // en el tutorial la tienda es solo de muestra
    const slot = CD.cfg.online ? CD.me : m.order[m.cur];
    if (CD.auth) CD.marketAct(slot, op, id); else CD.send({ type:'mk', slot, op, id: id || null });
  },
  render() {
    const G = CD.G, m = G && G.market, box = $$('modal-market'); if (!box) return;
    box.classList.toggle('hidden', !m); if (!m) return;
    const done = m.done || {}, who = CD.cfg.online ? G.players[CD.me] : G.players[m.order[m.cur]];
    const head = `<h2>🛒 ${esc(m.title)}</h2><p class="mk-lines">${(m.lines || []).map(esc).join('<br>')}</p>`;
    if (!who || who.bot || (CD.cfg.online && done[who.slot])) {
      const st = m.order.map(s => `${esc(G.players[s].name)}: ${done[s] ? '✅ listo' : '⏳ comprando…'}`).join('<br>');
      box.querySelector('.mk-body').innerHTML = head + `<p class="mk-wait">Esperando a los demás jugadores…<br>${st}</p>`; return;
    }
    const full = who.contacts.length >= ECON.MAX_PASSIVES, rate = who.contacts.includes('contact_desguace') ? ECON.SELL_DESGUACE : ECON.SELL;
    const works = it => ['rpg', 'exp', 'maf', 'pok'].filter(c => this.compatible(it.id, c)).map(c => SHORT_NAMES[c]).join(' · ');
    const card = (it, mode) => `<div class="mk-item ${mode !== 'sell' && !this.compatible(it.id, CD.contract) && !this.party() ? 'off' : ''}"><div class="mk-ic">${it.icon}</div><div class="mk-tx"><b>${esc(it.name)}</b> <span class="mk-tag ${it.kind === 'p' ? 'pas' : 'act'}">${it.kind === 'p' ? 'PASIVO' : 'ACTIVO · 1 USO'}</span> <span class="mk-cost">${mode === 'sell' ? '+' + Math.floor(it.cost * rate) : it.cost}💲</span>
      <small>${esc(it.desc)}</small><small class="mk-works">Funciona en: ${works(it)}</small></div>
      <button class="opt" onclick="MK.act('${mode}','${it.id}')" ${mode === 'buy' && (who.money < it.cost || (it.kind === 'p' ? full : !!who.consumable)) ? 'disabled' : ''}>${mode === 'buy' ? (it.kind === 'p' && full ? 'LLENO' : it.kind === 'c' && who.consumable ? 'SLOT OCUPADO' : 'COMPRAR') : 'VENDER'}</button></div>`;
    const inv = who.contacts.map(id => card(ITEM_BY_ID[id], 'sell')).join('') + (who.consumable ? card(ITEM_BY_ID[who.consumable], 'sell') : '') || '<p class="mk-empty">Sin objetos todavía.</p>';
    const stock = who.stock.map(id => card(ITEM_BY_ID[id], 'buy')).join('') || '<p class="mk-empty">Tienda vacía: renueva la tienda.</p>';
    box.querySelector('.mk-body').innerHTML = head + `<div class="mk-wallet"><b>${esc(who.name)}</b> · 💲 ${who.money} · Pasivos ${who.contacts.length}/${ECON.MAX_PASSIVES} · Activo ${who.consumable ? '1/1' : '0/1'}</div>
      <p class="mk-legend"><span class="mk-tag pas">PASIVO</span> contacto que funciona solo, mientras lo tengas (máx. ${ECON.MAX_PASSIVES}) · <span class="mk-tag act">ACTIVO</span> consumible de un solo uso: lo activas tú en tu turno y se gasta (máx. 1)</p>
      <h3>EN VENTA</h3>${stock}<button class="opt mk-reroll" onclick="MK.act('reroll')" ${who.money < who.rerollCost ? 'disabled' : ''}>🔄 Renovar tienda (${who.rerollCost}💲)</button>
      <h3>TUS OBJETOS (PASIVOS Y ACTIVOS)</h3>${inv}<button class="start" onclick="MK.act('done')">${CD.cfg.online ? 'LISTO' : 'TERMINAR COMPRA'}</button>`;
  }
};
