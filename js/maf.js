// ===== Contrato 3 · Imperio Criminal (hasta 4 jugadores) =====
// Reglas de la versión anterior: cada jefe tiene su propio mapa de 6 distritos y empieza con 2 (d6 hasta tener 2 distintos).
// Cada turno: 1) Recaudación (d6 segura: cobra 1💵 · d12 arriesgada: cobra 3💵, 7-12 nadie cobra); la tirada cobra para TODOS
// los que tengan ese distrito, salvo que el jefe pague 1💵 para "lavar dinero" y cobre solo él. Un distrito en redada no cobra.
// 2) Acción: Controlar distrito (cuesta nº de distritos + 1), Sobornar político (5💵, d20: 1-9 +1, 10-19 +2, 20 +4 influencia),
// Redada policial (3💵: eliges rival y uno de sus distritos; d4 turnos; máx. 3 redadas a la vez sobre un rival) o Pasar.
// Gana quien llegue primero a 15 de Influencia (10 en Party). Las redadas pierden 1 al terminar cualquier turno,
// salvo el turno en que se lanzan.
const MAF = {
  win: () => CD.cfg.mode === 'party' ? 10 : 15,
  head: () => '',
  active: p => Object.keys(p.raids || {}).filter(d => p.raids[d] > 0).length,

  async init(G) {
    G.winScore = this.win(); G.phase = 'roll';
    G.players.forEach(p => Object.assign(p, { parcels:[], coins:0, prestige:0, raids:{}, alive:true }));
    CD.log('🌆 La ciudad despierta. Repartiendo territorios…');
    for (const p of G.players) {
      while (p.parcels.length < 2) {
        const r = await CD.roll(6, p, 'Asignando zona inicial', 'maf_buy');
        if (!p.parcels.includes(r)) { p.parcels.push(r); p.parcels.sort((a, b) => a - b); CD.float(p.slot, 'DISTRITO [' + r + ']', 'loot'); CD.log(`🎲 Destino: ${p.name} controla el Distrito [${r}].`); CD.publish(); render(); }
        else CD.log(`🔄 ${p.name} ya controla el Distrito [${r}]. Se relanza el dado…`);
      }
    }
    G.turn = Math.floor(Math.random() * G.players.length); G.start = G.turn;                 // sorteo del primer turno
    CD.log('🎲 Sorteo: empieza ' + G.players[G.turn].name + '.');
  },
  normalize(p) { p.parcels = p.parcels || []; p.raids = p.raids || {}; },     // Firebase elimina arreglos y objetos vacíos
  keepTurn: G => G.phase === 'action' && !G.over,          // tras recaudar, el mismo jugador hace su acción

  // ---- interfaz hacia el núcleo ----
  cost: p => p.parcels.length + 1,
  raidTargets(G, me) { return G.players.filter(p => p !== me && p.parcels.some(d => !(p.raids[d] > 0)) && this.active(p) < 3).map(p => p.slot); },
  validTargets(G, me, type) { return type === 'raid' ? this.raidTargets(G, me) : null; },
  ui(G, me) {
    if (G.phase === 'roll') {
      const eg = !!CD.opts.egoist && me.coins >= 1;
      return [
        { type:'harvest6', label:'🎲 Recaudación Segura', sub:'d6 · cobras 1💵' },
        { type:'harvest12', label:'🎰 Recaudación Arriesgada', sub:'d12 · cobras 3💵 (7-12: nadie cobra)' },
        { type:'opt:egoist', label:'🔥 Lavar dinero: ' + (eg ? 'SÍ' : 'NO'), sub:'Paga 1💵 para cobrar solo tú', disabled:me.coins < 1, wide:true }
      ];
    }
    const cost = this.cost(me), full = me.parcels.length >= 6;
    return [
      { type:'buy', label:'🏢 Controlar Distrito', sub: full ? 'Límite alcanzado' : 'Costo: ' + cost + '💵', disabled:full || me.coins < cost },
      { type:'brew', label:'🎩 Sobornar Político', sub:'5💵 · d20 de Influencia', disabled:me.coins < 5 },
      { type:'raid', label:'🚨 Redada Policial', sub:'3💵 · clausura un distrito rival', disabled:me.coins < 3 || !this.raidTargets(G, me).length },
      { type:'pass', label:'⏳ Pasar turno', sub:'Guardas tu efectivo', wide:true }
    ];
  },
  extra(G, me, type, target) {
    if (type === 'harvest6' || type === 'harvest12') return { value:{ egoist:!!CD.opts.egoist && me.coins >= 1 } };
    if (type === 'buy') return { title:'CONTROLAR DISTRITO', text:'Costo: ' + this.cost(me) + '💵. Elige el distrito a tomar.',
      options:[1, 2, 3, 4, 5, 6].map(i => ({ label:me.parcels.includes(i) ? '✅ Distrito ' + i + '<br><small>CONTROLADO</small>' : 'Distrito ' + i, value:i, disabled:me.parcels.includes(i) })) };
    if (type === 'raid') { const t = G.players[target];
      return { title:'REDADA POLICIAL', text:'Elige el distrito de ' + t.name + ' que quieres clausurar.',
        options:[1, 2, 3, 4, 5, 6].map(i => ({ label:'Distrito ' + i + (!t.parcels.includes(i) ? '<br><small>NO LO POSEE</small>' : t.raids[i] > 0 ? '<br><small>YA EN REDADA</small>' : ''), value:i, disabled:!t.parcels.includes(i) || t.raids[i] > 0 })) }; }
    return null;
  },
  card(p, G) {
    const par = p.parcels || [], rd = p.raids || {}, win = G.winScore || 15;
    const chips = [1, 2, 3, 4, 5, 6].map(i => par.includes(i) ? (rd[i] > 0 ? `<i class="dist raid">${i}🚨${rd[i]}</i>` : `<i class="dist own">${i}</i>`) : `<i class="dist">${i}</i>`).join('');
    return { pct:(p.prestige || 0) / win * 100, color:'var(--accent-loot)', label:`🏆 ${p.prestige || 0}/${win} INFLUENCIA · 💵 ${p.coins || 0}`, html:'<div class="dists">' + chips + '</div>', state:'', img:'idle' };
  },

  // ---- acciones ----
  async act(G, att, type, tSlot, extra) {
    G.focus = { att:att.slot, target:tSlot == null ? att.slot : tSlot }; CD.publish(); render();
    if (G.phase === 'roll') {
      if (type !== 'harvest6' && type !== 'harvest12') return;
      const sides = type === 'harvest6' ? 6 : 12, egoist = !!(extra && extra.egoist) && att.coins >= 1;
      const res = await CD.roll(sides, att, 'Recaudación ' + (sides === 6 ? 'Segura (d6)' : 'Arriesgada (d12)'), sides === 6 ? 'maf_safe' : 'maf_risk');
      if (egoist) { att.coins -= 1; CD.log(`🔥 ${att.name} paga 1💵 y LAVA DINERO (solo él cobra).`); }
      const gain = sides === 12 ? 3 : 1; let paid = [];
      if (sides === 12 && res > 6) CD.log(`🚓 Cobro en el distrito [${res}]: demasiada vigilancia policial, nadie cobra.`);
      else for (const p of egoist ? [att] : G.players) {
        if (!p.parcels.includes(res)) continue;
        if (p.raids[res] > 0) { CD.log(`❌ ${p.name} falla en el distrito [${res}] (en redada).`); continue; }
        p.coins += gain; paid.push(p.name); CD.float(p.slot, '+' + gain + ' 💵', 'loot');
      }
      if (!(sides === 12 && res > 6)) CD.log(`🎲 Cobro en el distrito [${res}]: ` + (paid.length ? paid.map(n => n + ' +' + gain + '💵').join(', ') : 'nadie cobra') + '.');
      G.phase = 'action'; return;
    }
    // --- fase de acción ---
    let skipTick = false;
    if (type === 'buy') {
      const cost = this.cost(att);
      if (att.parcels.length >= 6 || att.coins < cost || !(extra >= 1 && extra <= 6) || att.parcels.includes(extra)) return;
      att.coins -= cost; att.parcels.push(extra); att.parcels.sort((a, b) => a - b);
      CD.float(att.slot, '+DISTRITO [' + extra + ']', 'loot'); CD.log(`🏢 ${att.name} toma el control del Distrito [${extra}] (costó ${cost}💵).`);
    } else if (type === 'brew') {
      if (att.coins < 5) return;
      const r = await CD.roll(20, att, 'Sobornar Político (d20)', 'maf_bribe');
      att.coins -= 5; const pts = r <= 9 ? 1 : r <= 19 ? 2 : 4;
      att.prestige = Math.min(G.winScore, att.prestige + pts); CD.float(att.slot, '+' + pts + ' INFLUENCIA', 'heal');
      CD.log(`🎩 ${r === 20 ? '¡CONTROL POLÍTICO TOTAL!' : r <= 9 ? 'Soborno menor' : 'Trato jugoso'} (sacó ${r}). ${att.name} gana +${pts} Influencia (${att.prestige}/${G.winScore}).`);
      if (att.prestige >= G.winScore) { CD.finish(att.slot, 'Dominio Total — ' + G.players.map(p => p.name + ': ' + p.prestige).join(' · ')); return; }
    } else if (type === 'raid') {
      const t = G.players[tSlot];
      if (!t || t === att || att.coins < 3 || this.active(t) >= 3 || !t.parcels.includes(extra) || t.raids[extra] > 0) return;
      const turns = await CD.roll(4, att, 'Duración de la Redada → ' + t.name, 'maf_raid');
      att.coins -= 3; t.raids[extra] = turns; skipTick = true;
      CD.float(t.slot, 'REDADA [' + extra + ']', 'crit');
      CD.log(`🚨 ¡SOPLO! ${att.name} envía una redada al Distrito [${extra}] de ${t.name} por ${turns} turnos.`);
    } else if (type === 'pass') CD.log(`⏳ ${att.name} no hace movimientos y guarda su Efectivo (${att.coins}💵).`);
    else return;
    this.endTurn(G, skipTick);
  },
  endTurn(G, skipTick) {                       // las redadas pierden 1 al acabar cualquier turno (salvo el de su lanzamiento)
    if (!skipTick) G.players.forEach(p => { Object.keys(p.raids).forEach(d => { if (p.raids[d] > 0 && --p.raids[d] === 0) { delete p.raids[d]; CD.log(`🏢 El Distrito [${d}] de ${p.name} reabre sus puertas.`); } }); });
    G.phase = 'roll';
  }
};
