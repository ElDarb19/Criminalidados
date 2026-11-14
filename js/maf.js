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
    G.turn = CD.firstTurn(G); G.start = G.turn;                 // sorteo del primer turno
    CD.log('🎲 Sorteo: empieza ' + G.players[G.turn].name + '.');
  },
  normalize(p) { p.parcels = p.parcels || []; p.raids = p.raids || {}; },     // Firebase elimina arreglos y objetos vacíos
  ranking(G) { return CD.rank(G.players, p => [p.prestige || 0, p.coins || 0], p => (p.prestige || 0) + '/' + G.winScore + ' de influencia · ' + (p.coins || 0) + '💵'); },
  keepTurn: G => G.phase === 'action' && !G.over,          // tras recaudar, el mismo jugador hace su acción

  // ---- interfaz hacia el núcleo ----
  cost: p => p.parcels.length + 1,
  raidTargets(G, me) { return G.players.filter(p => p !== me && p.parcels.some(d => !(p.raids[d] > 0)) && this.active(p) < 3).map(p => p.slot); },
  validTargets(G, me, type) { return type === 'raid' ? this.raidTargets(G, me) : null; },
  BARRIOS: ['Muelles', 'Estación', 'Teatros', 'Mercado', 'Fábricas', 'Casino'],      // nombre de cada distrito en el mapa del barrio
  ico: f => `<img class="ico" src="assets/characters/None/${f}.png" alt="">`,
  ui(G, me) {
    if (G.phase === 'roll') {
      const eg = !!CD.opts.egoist && me.coins >= 1;
      const mine = me.parcels.filter(d => !(me.raids[d] > 0)).length;            // tus distritos que pueden cobrar
      return [
        { type:'harvest6', label:'Recaudación Segura', sub:'d6 · cobras 1💵', odds:Math.round(mine / 6 * 100) + '% cobras', cls:'b-map', pre:this.ico('maf_safe') },
        { type:'harvest12', label:'Recaudación Arriesgada', sub:'d12 · cobras 3💵 (7-12: nadie cobra)', odds:Math.round(mine / 12 * 100) + '% cobras', cls:'b-map', pre:this.ico('maf_risk') },
        // Lavar dinero: interruptor de carretera (el billete se desliza a SÍ)
        { type:'opt:egoist', label:'Lavar dinero', sub:me.coins < 1 ? 'Necesitas 1💵 (tienes 0)' : 'Paga 1💵 para cobrar solo tú', disabled:me.coins < 1, wide:true, cls:'map-sw' + (eg ? ' on' : ''),
          pre:`<span class="road" aria-hidden="true"><i>💵</i></span><b class="sw-t">${eg ? 'SÍ' : 'NO'}</b>` }
      ];
    }
    const cost = this.cost(me), full = me.parcels.length >= 6, foes = this.raidTargets(G, me).length;
    const raidImg = `<img class="ico" src="assets/characters/${me.bot ? 'Bot' : me.char || 'Mafioso'}/${me.color}/maf_raid.png" alt="" onerror="this.src='assets/characters/Bot/${me.color}/maf_raid.png'">`;
    return [
      { type:'buy', label:'Controlar Distrito', sub:'Costo: ' + cost + '💵', disabled:full || me.coins < cost, cls:'b-map', pre:this.ico('maf_buy'), post:this.money(me.coins, cost, full && 'Ya tienes los 6') },
      { type:'brew', label:'Sobornar Político', sub:'d20 de Influencia', odds:me.coins >= 5 ? '+1: 45% · +2: 50% · +4: 5%' : '', disabled:me.coins < 5, cls:'b-map', pre:this.ico('maf_bribe'), post:this.money(me.coins, 5) },
      { type:'raid', label:'Redada Policial', sub:'Clausura un distrito rival', disabled:me.coins < 3 || !foes, cls:'b-map', pre:raidImg, post:this.money(me.coins, 3, !foes && 'Sin distritos que clausurar') },
      { type:'pass', label:'⏳ Pasar turno', sub:'Guardas tu efectivo', wide:true, cls:'b-map' }
    ];
  },
  // barra de dinero del botón: lo que tienes contra lo que cuesta (verde si alcanza, roja con lo que falta); why = otro motivo para no poder
  money(have, cost, why) {
    const ok = have >= cost && !why, pct = Math.min(100, have / cost * 100);
    return `<span class="mbar ${ok ? 'ok' : 'no'}"><i style="width:${why ? 100 : pct}%"></i></span><span class="mcnt">${why || have + '/' + cost + '💵' + (ok ? ' ✓' : ' · faltan ' + (cost - have))}</span>`;
  },
  // edificio de cada barrio (cuerpo, ventanas y detalle; el detalle y las luces toman el color del dueño)
  BLD: {
    1:'<rect class="acc" x="26" y="4" width="3" height="26"/><rect class="acc" x="12" y="4" width="22" height="3"/><rect class="acc" x="12" y="7" width="1.5" height="9"/><rect class="body" x="4" y="22" width="20" height="14"/><rect class="win" x="7" y="26" width="4" height="4"/><rect class="win" x="14" y="26" width="4" height="4"/><path d="M0 37h40v3H0z" fill="#2a4a6a"/>',
    2:'<rect class="body" x="6" y="12" width="28" height="26"/><path class="acc" d="M4 12h32l-16-8z"/><circle cx="20" cy="18" r="4" fill="#f3efe6"/><path d="M20 15.5v2.5h2" stroke="#20180f" stroke-width="1" fill="none"/><rect class="win" x="10" y="26" width="5" height="12"/><rect class="win" x="25" y="26" width="5" height="12"/><rect class="win" x="17.5" y="26" width="5" height="8"/>',
    3:'<rect class="body" x="5" y="10" width="30" height="28"/><rect class="acc" x="3" y="20" width="34" height="5"/><path d="M20 12l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3z" fill="#f3dfa6"/><rect class="win" x="9" y="28" width="6" height="10"/><rect class="win" x="25" y="28" width="6" height="10"/><rect class="win" x="17" y="29" width="6" height="9"/>',
    4:'<rect class="body" x="5" y="16" width="30" height="22"/><path class="acc" d="M3 16h34l-3 6H6z"/><path d="M6 22h4v-6h-4zM14 22h4v-6h-4zM22 22h4v-6h-4zM30 22h4v-6h-4z" fill="#f3efe6" opacity=".5"/><rect class="win" x="9" y="26" width="22" height="8"/>',
    5:'<path class="body" d="M3 38V20l8 5v-5l8 5v-5l8 5V12h6v26z"/><rect class="acc" x="27" y="4" width="6" height="8"/><circle cx="31" cy="2" r="2" fill="#777" opacity=".6"/><rect class="win" x="6" y="28" width="4" height="4"/><rect class="win" x="14" y="28" width="4" height="4"/><rect class="win" x="22" y="28" width="4" height="4"/>',
    6:'<rect class="body" x="6" y="14" width="28" height="24"/><rect class="acc" x="8" y="6" width="24" height="9" rx="2"/><path d="M20 7.5c-2 2-4 3.2-4 5 0 1.2 1 2 2 2 .6 0 1.2-.3 1.5-.8l-.6 1.8h2.2l-.6-1.8c.3.5.9.8 1.5.8 1 0 2-.8 2-2 0-1.8-2-3-4-5z" fill="#f3efe6"/><rect class="win" x="10" y="20" width="5" height="5"/><rect class="win" x="17.5" y="20" width="5" height="5"/><rect class="win" x="25" y="20" width="5" height="5"/><rect class="win" x="16" y="29" width="8" height="9"/>'
  },
  // ventana del mapa: "Distrito N" grande y el nombre del barrio debajo; el sello dice por qué no se puede elegir
  lot(i, stamp, own) { return { label:`<b>Distrito ${i}</b><small>${this.BARRIOS[i - 1]}</small>${stamp ? `<span class="stamp">${stamp}</span>` : ''}`, cls:'m-lot' + (own ? ' own' : '') }; },
  extra(G, me, type, target) {
    if (type === 'harvest6' || type === 'harvest12') return { value:{ egoist:!!CD.opts.egoist && me.coins >= 1 } };
    if (type === 'buy') return { title:'CONTROLAR DISTRITO', text:'Costo: ' + this.cost(me) + '💵. Elige el distrito a tomar.',
      options:[1, 2, 3, 4, 5, 6].map(i => Object.assign(this.lot(i, me.parcels.includes(i) ? 'CONTROLADO' : '', me.parcels.includes(i)), { value:i, disabled:me.parcels.includes(i) })) };
    if (type === 'raid') { const t = G.players[target];
      return { title:'REDADA POLICIAL', text:'Elige el distrito de ' + t.name + ' que quieres clausurar.',
        options:[1, 2, 3, 4, 5, 6].map(i => Object.assign(this.lot(i, !t.parcels.includes(i) ? 'NO LO POSEE' : t.raids[i] > 0 ? 'YA EN REDADA' : '', t.parcels.includes(i)), { value:i, disabled:!t.parcels.includes(i) || t.raids[i] > 0 })) }; }
    return null;
  },
  card(p, G) {
    const par = p.parcels || [], rd = p.raids || {}, win = G.winScore || 15;
    // skyline de noche: los edificios que controlas se encienden con tu color; en redada, cinta policial y sirena con los turnos que quedan
    const lots = [1, 2, 3, 4, 5, 6].map(i => { const own = par.includes(i), raid = own && rd[i] > 0;
      return `<div class="lot${own ? ' own' : ''}${raid ? ' raid' : ''}">${raid ? `<span class="siren">🚓 ${rd[i]}</span>` : ''}<svg class="bld" viewBox="0 0 40 40" aria-hidden="true">${this.BLD[i]}</svg><span class="tag"><b>${i}</b>${this.BARRIOS[i - 1]}</span></div>`; }).join('');
    return { pct:(p.prestige || 0) / win * 100, color:'var(--accent-loot)', label:`🏆 ${p.prestige || 0}/${win} INFLUENCIA · 💵 ${p.coins || 0}`, html:'<div class="sky">' + lots + '</div>', state:'', img:'idle' };
  },

  // ---- acciones ----
  async act(G, att, type, tSlot, extra) {
    G.focus = { att:att.slot, target:tSlot == null ? att.slot : tSlot }; CD.publish(); render();
    if (G.phase === 'roll') {
      if (type !== 'harvest6' && type !== 'harvest12') return;
      const sides = type === 'harvest6' ? 6 : 12, egoist = !!(extra && extra.egoist) && att.coins >= 1;
      const mine = await CD.roll(sides, att, 'Recaudación ' + (sides === 6 ? 'Segura (d6)' : 'Arriesgada (d12)'), sides === 6 ? 'maf_safe' : 'maf_risk');
      const shared = CD.shared != null ? CD.shared : mine;                   // tus objetos (Crupier) solo cambian TU cobro; los rivales cobran con la tirada original
      if (shared !== mine) CD.log(`🎲 ${att.name} cobra en el distrito [${mine}] gracias a sus contactos; los demás cobran en el [${shared}].`);
      if (egoist) { att.coins -= 1; CD.log(`🔥 ${att.name} paga 1💵 y LAVA DINERO (solo él cobra).`); }
      const insp = MK.eventsOn() && MK.ev() === 'inspectores';
      if (insp && sides === 6 && Math.random() < 0.5) { CD.float(att.slot, '🕵️ INSPECCIÓN', 'miss'); CD.log('🕵️ ¡GUERRA DE INSPECTORES! Inspección sorpresa: nadie cobra en esta recaudación.'); G.phase = 'action'; return; }
      const paid = [], resOf = p => p === att ? mine : shared, res = mine;
      if (sides === 12 && mine > 6 && shared > 6) CD.log(`🚓 Cobro en el distrito [${res}]: demasiada vigilancia policial, nadie cobra.`);
      else {
        for (const p of egoist ? [att] : G.players) {
          const res = resOf(p);
          if (res > 6 || !p.parcels.includes(res)) continue;
          if (p.raids[res] > 0) { CD.log(`❌ ${p.name} falla en el distrito [${res}] (en redada).`); continue; }
          let gain = (sides === 12 ? 3 : 1) * (insp ? 2 : 1);                                             // Inspectores: recaudación x2
          if (MK.has(p, 'contact_arquitecto')) gain = MK.pct(gain, 0.10);                              // Red de Protección: +10% (redondeo sin sesgo)
          p.coins += gain; paid.push(p.name + ' +' + gain + '💵'); CD.float(p.slot, '+' + gain + ' 💵', 'loot');
        }
        CD.log(`🎲 Cobro en el distrito [${shared === mine ? res : mine + '/' + shared}]: ` + (paid.length ? paid.join(', ') : 'nadie cobra') + '.');
      }
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
      if (r === 20 && MK.has(att, 'contact_quimico') && await this.extraRaid(G, att)) skipTick = true;   // la redada extra empieza a contar desde el turno siguiente
    } else if (type === 'raid') {
      const t = G.players[tSlot];
      if (!t || t === att || att.coins < 3 || this.active(t) >= 3 || !t.parcels.includes(extra) || t.raids[extra] > 0) return;
      const blk = MK.block(t, 'la Redada de ' + att.name);
      if (blk) { if (blk.kind === 'bunker') att.coins = Math.max(0, att.coins - 3); CD.log(blk.text); skipTick = true; }     // el búnker cuesta la redada; la policía la intercepta gratis
      else {
        const turns = await CD.roll(4, att, 'Duración de la Redada → ' + t.name, 'maf_raid');
        att.coins -= 3; t.raids[extra] = turns; skipTick = true; MK.hurt(G, t, { raid:extra, from:att.slot });
        CD.float(t.slot, 'REDADA [' + extra + ']', 'crit');
        CD.log(`🚨 ¡SOPLO! ${att.name} envía una redada al Distrito [${extra}] de ${t.name} por ${turns} turnos.`);
      }
    } else if (type === 'pass') CD.log(`⏳ ${att.name} no hace movimientos y guarda su Efectivo (${att.coins}💵).`);
    else return;
    this.endTurn(G, skipTick);
  },
  async extraRaid(G, att) {                    // Químico Corruptor: un 20 al sobornar permite una redada gratis
    const ts = this.raidTargets(G, att); if (!ts.length) return;
    let tSlot, d;
    if (att.bot) { const pick = AI.mafRaid(G, att); if (!pick) return; tSlot = pick.target; d = pick.extra; }
    else {
      tSlot = ts.length === 1 ? ts[0] : await CD.askPlayer(att.slot, { title:'🧪 REDADA EXTRA', text:'¡Sacaste 20! Elige a quién enviar una redada gratis.', options:ts.map(s => ({ label:G.players[s].name, value:s })) });
      if (tSlot == null) return;
      d = await CD.askPlayer(att.slot, this.extra(G, att, 'raid', tSlot)); if (d == null) return;
    }
    const t = G.players[tSlot]; if (!t || !t.parcels.includes(d) || t.raids[d] > 0) return;
    const blk = MK.block(t, 'la Redada Extra de ' + att.name);
    if (blk) { CD.log(blk.text); return; }
    const turns = await CD.roll(4, att, 'Redada del Químico → ' + t.name, 'maf_raid');
    t.raids[d] = turns; MK.hurt(G, t, { raid:d, from:att.slot }); CD.float(t.slot, 'REDADA [' + d + ']', 'crit');
    CD.log(`🧪 ¡El Químico Corruptor de ${att.name} lanza una redada extra al Distrito [${d}] de ${t.name} por ${turns} turnos!`);
    return true;
  },
  endTurn(G, skipTick) {                       // las redadas pierden 1 al acabar cualquier turno (salvo el de su lanzamiento)
    if (!skipTick) G.players.forEach(p => { Object.keys(p.raids).forEach(d => { if (p.raids[d] > 0 && --p.raids[d] === 0) { delete p.raids[d]; CD.log(`🏢 El Distrito [${d}] de ${p.name} reabre sus puertas.`); } }); });
    G.phase = 'roll';
  }
};
