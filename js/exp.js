// ===== Contrato 2 · El Gran Atraco (hasta 4 jugadores) =====
// Reglas de la versión anterior: Cobertura 20; Saquear (d6: 1-2 trampa -3 COB, 3-5 +1 botín, 6 +3);
// Forzar Bóveda (d20 ≥ 11, luego d12 de botín; 20 = +2; fallo = -6 COB); Reforzar (d4, 1 vez por atraco,
// o cada 5 rondas en Party); Granada (d4 contra un rival elegido, máx. 3 por atraco, 1 en Party);
// Coche de Escape asegura el botín. Si la Cobertura llega a 0 te arrestan y pierdes el botín no asegurado.
// Un único contrato = 3 atracos (gana quien asegure más en total); en Party = 1 atraco.
const EXP = {
  MAX_COB: 20, TRAP: 3, HEAVY: 6,
  party: () => CD.cfg.mode === 'party',
  maxGrenades() { return this.party() ? 1 : 3; },
  head: G => G.maxDives === 1 ? 'ATRACO ÚNICO' : 'ATRACO ' + G.dive + '/' + G.maxDives,

  async init(G) {
    G.dive = 1; G.maxDives = this.party() ? 1 : 3;
    G.players.forEach(p => { p.secured = 0; });
    this.startDive(G);
  },
  startDive(G) {
    G.turn = Math.floor(Math.random() * G.players.length); G.round = 1; G.focus = null;   // sorteo del primer turno en cada atraco
    G.players.forEach(p => Object.assign(p, { max:this.MAX_COB, hp:this.MAX_COB, temp:0, alive:true, arrested:false, repairUses:0, repairCooldown:0, torpedoUses:0 }));
    CD.log('💰 ¡Inicia ' + (G.maxDives === 1 ? 'el Atraco Único' : 'el Atraco ' + G.dive + ' de ' + G.maxDives) + ' a la bóveda!');
    CD.log('🎲 Sorteo: empieza ' + G.players[G.turn].name + '.');
  },
  async nextStage(G) { G.dive++; this.startDive(G); },
  onRound(G) { if (this.party()) G.players.forEach(p => { if (p.repairCooldown > 0) p.repairCooldown--; }); },

  // ---- interfaz hacia el núcleo ----
  validTargets(G, me, type) { return type === 'sabotage' ? G.players.filter(p => p.alive && p !== me).map(p => p.slot) : null; },
  ui(G, me) {
    const mx = this.maxGrenades(), foes = this.validTargets(G, me, 'sabotage');
    const repairOk = this.party() ? me.repairCooldown <= 0 : me.repairUses < 1;
    return [
      { type:'explore', label:'📦 Saquear Cajas', sub:'d6: 1-2 trampa · 3-5 +1 · 6 +3' },
      { type:'deep', label:'🏦 Forzar Bóveda', sub:'d20 ≥ 11 → d12 de botín' },
      { type:'repair', label:'🔧 Reforzar Cobertura', sub: this.party() ? (me.repairCooldown > 0 ? 'Espera ' + me.repairCooldown + ' rondas' : 'd4 · cada 5 rondas') : (me.repairUses >= 1 ? 'Agotado' : 'd4 · 1 por atraco'), disabled:!repairOk || me.hp >= me.max },
      { type:'sabotage', label:'💣 Lanzar Granada', sub:me.torpedoUses + '/' + mx + ' · d4 a un rival', disabled:me.torpedoUses >= mx || !foes.length },
      { type:'surface', label:'🚗 Coche de Escape', sub:'Asegura 💰 ' + me.temp }
    ];
  },
  card(p) {
    const state = p.alive ? (p.hp < 5 ? 'danger' : '') : (p.arrested ? 'dead' : 'done');
    const status = p.alive ? '🏦 Dentro' : p.arrested ? '🚨 Arrestado' : '✅ A salvo';
    return { pct:p.max ? p.hp / p.max * 100 : 0, color:p.hp <= 5 ? 'var(--accent-red)' : 'var(--accent-cyan)',
      label:`${p.hp}/${p.max} COB · 💰 ${p.temp} · 🔒 ${p.secured}<br>${status}`, state, img:p.alive ? 'idle' : p.arrested ? 'lose' : 'win' };
  },

  // ---- acciones ----
  async act(G, att, type, tSlot) {
    const def = tSlot == null ? null : G.players[tSlot];
    if (type === 'sabotage' && (!def || !def.alive || def === att || att.torpedoUses >= this.maxGrenades())) return;
    G.focus = { att:att.slot, target:def ? def.slot : att.slot }; CD.publish(); render();

    if (type === 'explore') {
      const r = await CD.roll(6, att, 'Saquear Cajas Fuertes', 'exp_boxes');
      if (r <= 2) this.damage(att, this.TRAP, 'Trampa de seguridad', false);
      else { const n = r === 6 ? 3 : 1; att.temp += n; CD.float(att.slot, '+' + n + ' 💰', 'loot'); CD.log(`💵 ${att.name} saca ${n} fajo(s) de billetes (lleva ${att.temp}).`); }
    } else if (type === 'deep') {
      const acc = await CD.roll(20, att, 'Destreza (11+)', 'exp_vault', 'fuse');
      if (acc >= 11) {
        const base = await CD.roll(12, att, 'Forzar Bóveda', 'exp_vault', 'dynamite');
        const crit = acc === 20 ? 2 : 0; if (crit) CD.log('🌟 ¡DESTREZA PERFECTA (d20 = 20)! +2 bolsas de botín extra.');
        att.temp += base + crit; CD.float(att.slot, '+' + (base + crit) + ' 💰', crit ? 'crit' : 'loot');
        CD.log(`💎 ¡La puerta cede! ${att.name} embolsa ${base + crit} bolsas (lleva ${att.temp}).`);
      } else this.damage(att, this.HEAVY, 'Alarma pesada', true);
    } else if (type === 'repair') {
      if (this.party()) att.repairCooldown = 5; else att.repairUses++;
      const h = await CD.roll(4, att, 'Reforzar Cobertura', 'exp_cover');
      att.hp = Math.min(att.max, att.hp + h); CD.float(att.slot, '+' + h + ' COB', 'heal');
      CD.log(`🔧 ${att.name} se atrinchera y recupera ${h} de Cobertura (queda con ${att.hp}).`);
    } else if (type === 'sabotage') {
      att.torpedoUses++;
      const d = await CD.roll(4, att, 'Lanzar Granada → ' + def.name, 'exp_grenade');
      def.hp = Math.max(0, def.hp - d); CD.float(def.slot, '-' + d + ' COB', 'crit');
      CD.log(`💣 ¡SABOTAJE! ${att.name} lanza una granada a ${def.name}: -${d} COB (le quedan ${def.hp}).`);
      if (def.hp <= 0) this.arrest(def, '🚨 ¡Emboscada policial! ' + def.name + ' queda atrapado y pierde su botín.');
    } else if (type === 'surface') {
      att.secured += att.temp; CD.float(att.slot, '¡A SALVO!', 'loot');
      CD.log(`🚗💨 ${att.name} arranca el Coche de Escape y asegura ${att.temp} de botín (total asegurado: ${att.secured}).`);
      att.temp = 0; att.alive = false;
    }
    if (att.alive && att.hp <= 0) this.arrest(att, '🚨 ¡LA POLICÍA ATRAPÓ A ' + att.name.toUpperCase() + '! Pierde todo el botín no asegurado.');
    if (!G.players.some(p => p.alive)) this.endDive(G);
  },
  damage(p, n, why, heavy) {
    p.hp = Math.max(0, p.hp - n); CD.float(p.slot, '-' + n + ' COB', heavy ? 'crit' : 'dmg');
    CD.log(`🚨 ${why}: ${p.name} pierde ${n} de Cobertura (le quedan ${p.hp}).`);
  },
  arrest(p, msg) { p.hp = 0; p.temp = 0; p.alive = false; p.arrested = true; CD.log(msg); },

  endDive(G) {
    const totals = G.players.map(p => p.name + ': ' + p.secured);
    if (G.dive >= G.maxDives) {
      const max = Math.max(...G.players.map(p => p.secured)), top = G.players.filter(p => p.secured === max);
      CD.finish(top.length === 1 ? top[0].slot : null, 'Botín asegurado — ' + totals.join(' · ') + (top.length > 1 ? ' (empate entre ' + top.map(p => p.name).join(', ') + ')' : ''));
    } else {
      CD.log('🏁 Atraco ' + G.dive + ' completado. ' + totals.join(' · '));
      G.between = { title:'ATRACO ' + G.dive + ' COMPLETADO', lines:['Botín asegurado hasta ahora:'].concat(totals), button:'SIGUIENTE ATRACO' };
    }
  }
};
