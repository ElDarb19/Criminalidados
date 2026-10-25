// ===== Contrato 4 · Apuestas Clandestinas (hasta 4 jugadores, todos contra todos) =====
// Reglas de la versión anterior, ahora con varios rivales: en tu turno eliges UNA acción y A QUÉ RIVAL va dirigida.
//  · Apuesta Básica: arriesgas 1 ficha; d6 ≥ 4 le robas 1, si no, se la das.
//  · Golpe a la Mesa: arriesgas 3 fichas; d20 ≥ 11 y luego d12 de robo (20 = +2). Si el robo supera las fichas del rival, se anula.
//    Si falla, le das 3 fichas (o las que te queden).
//  · Trampa de Tahúr: d4 de robo sin riesgo; luego espera 3 rondas (en Party: 1 uso por partida).
// Quien se queda sin fichas queda en bancarrota. Gana el último en pie o, tras la última ronda, quien tenga más fichas.
const POK = {
  START_TOKENS: 8,        // ← fichas iniciales de cada jugador (ajustable)
  MAX_ROUNDS: 8,          // ← rondas de la partida (ajustable)
  SLAM_COST: 3,           // fichas que arriesga el Golpe a la Mesa
  TAHUR_COOLDOWN: 3,      // rondas de espera de la Trampa de Tahúr (fuera de Party)
  party: () => CD.cfg.mode === 'party',
  rounds() { return this.MAX_ROUNDS; },
  head: () => '',

  async init(G) {
    G.players.forEach(p => Object.assign(p, { tokens:this.START_TOKENS, tahurCD:0, tahurUses:0, alive:true }));
    G.turn = Math.floor(Math.random() * G.players.length); G.start = G.turn;                 // sorteo del primer turno
    CD.log(`🎲 ¡Se abren las mesas clandestinas! Todos inician con ${this.START_TOKENS} fichas.`);
    CD.log(`⚠️ Objetivo: desplumar a los rivales durante ${this.MAX_ROUNDS} rondas. Empieza ${G.players[G.turn].name}.`);
  },
  bust(G, q) {                                // bancarrota: sin fichas queda fuera
    q.tokens = 0; q.alive = false; q.elimN = G.elimCount = (G.elimCount || 0) + 1; CD.log('💀 ' + q.name + ' se queda sin fichas y cae en bancarrota.');
  },
  onTurnStart(G, p) { if (p.tahurCD > 0) p.tahurCD--; if (p.alive && p.tokens <= 0) { this.bust(G, p); if (CD.alive().length <= 1) this.finishGame(G, 'Último en pie'); } },                    // la espera de la Trampa baja en cada turno propio
  onRound(G) { if (G.round > this.MAX_ROUNDS) this.endByRounds(G); },

  // ---- interfaz hacia el núcleo ----
  canCheat(p) { return this.party() ? p.tahurUses < 1 : p.tahurCD <= 0; },
  need(type) { return type === 'slam' ? this.SLAM_COST : 1; },
  validTargets(G, me, type) {
    if (me.tokens < this.need(type) || (type === 'cheat' && !this.canCheat(me))) return [];
    return G.players.filter(p => p.alive && p !== me && p.tokens >= 1).map(p => p.slot);
  },
  ui(G, me) {
    const t = type => !this.validTargets(G, me, type).length;
    return [
      { type:'bet', label:'🎰 Apuesta Básica', sub:'Arriesgas 1🎰 · d6 gana con 4+', disabled:t('bet') },
      { type:'slam', label:'💥 Golpe a la Mesa', sub:'Arriesgas 3🎰 · d20 ≥ 11, luego d12', disabled:t('slam') },
      { type:'cheat', label:'🎭 Trampa de Tahúr', sub: this.party() ? (me.tahurUses >= 1 ? 'Agotado' : '1 por partida · d4 de robo') : (me.tahurCD > 0 ? 'Espera ' + me.tahurCD + ' rondas' : 'Sin riesgo · d4 de robo'), disabled:t('cheat'), wide:true }
    ];
  },
  card(p, G) {
    const pool = this.START_TOKENS * G.players.length;
    const tahur = this.party() ? (p.tahurUses >= 1 ? '🎭 agotada' : '🎭 lista') : (p.tahurCD > 0 ? '🎭 en ' + p.tahurCD : '🎭 lista');
    return { pct:(p.tokens || 0) / pool * 100, color:'var(--accent-loot)',
      label:p.alive ? `🎰 ${p.tokens} fichas · ${tahur}` : '💀 EN BANCARROTA', state:p.alive ? (p.tokens <= 2 ? 'danger' : '') : 'dead', img:p.alive ? 'idle' : 'lose' };
  },

  // ---- acciones ----
  move(from, to, n) {                          // pasa n fichas de un jugador a otro y lo muestra
    from.tokens -= n; to.tokens += n; CD.G.lastNeg = { target:from.slot, amount:n, thief:to.slot };
    CD.float(to.slot, '+' + n + ' 🎰', 'loot'); CD.float(from.slot, '-' + n + ' 🎰', 'dmg');
    if (from.tokens <= 0) { from.tokens = 0; from.alive = false; from.elimN = CD.G.elimCount = (CD.G.elimCount || 0) + 1; CD.log('💀 ' + from.name + ' se queda sin fichas y cae en bancarrota.'); }
  },
  async act(G, att, type, tSlot) {
    const def = G.players[tSlot];
    if (!def || def === att || !def.alive || !this.validTargets(G, att, type).includes(tSlot)) return;
    G.focus = { att:att.slot, target:def.slot }; CD.publish(); render();
    if (type === 'bet') {
      const r = await CD.roll(6, att, `Apuesta (gana con 4+) → ${def.name}`, 'pok_bet');
      CD.log(`🎰 ${att.name} arriesga 1 ficha contra ${def.name}…`);
      if (r >= 4) { this.move(def, att, Math.min(1, def.tokens)); CD.log(`✅ ¡Acierto! ${att.name} gana 1 ficha de ${def.name} (${att.name}: ${att.tokens} · ${def.name}: ${def.tokens}).`); }
      else if (MK.has(att, 'contact_dinamita')) {                       // Tramposo de la Casa: el fallo propio perjudica al rival
        const lost = Math.min(2, def.tokens); def.tokens -= lost; CD.float(def.slot, '-' + lost + ' 🎰', 'dmg'); CD.G.lastNeg = { target:def.slot, amount:lost, thief:null };
        CD.log(`❌ Falla. 🧨 ${att.name} activa al Tramposo de la Casa: ${def.name} pierde ${lost} fichas.`);
        if (def.tokens <= 0) { def.tokens = 0; def.alive = false; def.elimN = G.elimCount = (G.elimCount || 0) + 1; CD.log('💀 ' + def.name + ' se queda sin fichas y cae en bancarrota.'); }
      }
      else { this.move(att, def, Math.min(1, att.tokens)); CD.log(`❌ Falla. ${def.name} gana 1 ficha de ${att.name} (${att.name}: ${att.tokens} · ${def.name}: ${def.tokens}).`); }
    } else if (type === 'slam') {
      const acc = await CD.roll(20, att, `Golpe a la Mesa (req. 11+) → ${def.name}`, 'pok_slam');
      CD.log(`💥 ${att.name} arriesga 3 fichas en un golpe directo contra ${def.name}…`);
      if (acc >= 11) {
        const base = await CD.roll(12, att, 'Ganancias del Golpe', 'pok_slam'), crit = acc === 20 ? 2 : 0;
        if (crit) { CD.log('🎉 ¡GOLPE PERFECTO (d20 = 20)! +2 fichas extra.'); CD.float(att.slot, '🎉 +2 CRÍTICO', 'crit'); }
        const win = base + crit;
        if (win > def.tokens) { CD.float(def.slot, '🛡️ ANULADO', 'miss'); CD.log(`🛡️ Golpe anulado por exceso (${win} > ${def.tokens} fichas de ${def.name}).`); }
        else { this.move(def, att, win); CD.log(`🎉 ¡JACKPOT! ${att.name} arrasa la mesa y le roba ${win} fichas a ${def.name} (${att.name}: ${att.tokens} · ${def.name}: ${def.tokens}).`); }
      } else { const l = Math.min(3, att.tokens); this.move(att, def, l); CD.log(`💀 Sale mal. ${def.name} gana las ${l} fichas del riesgo (${att.name}: ${att.tokens} · ${def.name}: ${def.tokens}).`); }
    } else if (type === 'cheat') {
      let s = await CD.roll(4, att, `Trampa de Tahúr → ${def.name}`, 'pok_cheat');
      if (MK.has(att, 'contact_maton') && !att.matonUsed) { s += 2; att.matonUsed = true; CD.float(att.slot, '+2 MATÓN', 'crit'); CD.log(`🥊 ¡Matón a Sueldo! La primera Trampa de Tahúr de ${att.name} recibe +2.`); }
      att.tahurUses++; if (!this.party()) att.tahurCD = this.TAHUR_COOLDOWN;
      const n = Math.min(s, def.tokens); this.move(def, att, n);
      CD.log(`🎭 ¡TRAMPA! ${att.name} hace un juego de manos y roba ${n} fichas a ${def.name} (${att.name}: ${att.tokens} · ${def.name}: ${def.tokens}).`);
    } else return;
    const alive = CD.alive();
    if (alive.length <= 1) this.finishGame(G, 'Último en pie');
  },

  ranking(G) { return CD.rank(G.players, q => q.alive ? [1, q.tokens] : [0, q.elimN || 0], q => q.alive ? q.tokens + ' fichas' : 'En bancarrota'); },

  endByRounds(G) { this.finishGame(G, 'Límite de rondas'); },
  finishGame(G, why) {
    if (G.over || G.between) return;
    const alive = CD.alive(), max = Math.max(...alive.map(p => p.tokens)), top = alive.filter(p => p.tokens === max);
    CD.finish(top.length === 1 ? top[0].slot : null, why + ' — ' + G.players.map(p => p.name + ': ' + p.tokens).join(' · ') + (top.length > 1 ? ' (empate entre ' + top.map(p => p.name).join(', ') + ')' : ''));
  }
};
