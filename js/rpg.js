// ===== Contrato 1 · Guerra de Bandas (4 jugadores) =====
// Reglas de la versión anterior: salud 3d6+10, Ráfaga d6, Francotirador d20≥11 + d12 (20 = +2 crítico),
// Médico d8 (3 curaciones seguidas bloquean el médico: hay que usar otra habilidad para desbloquearlo),
// Soplón d4 rondas (1 de daño al final de cada turno) y un disparo que supera la salud restante se anula.
const RPG = {
  HP_CAP: 35,                                 // tope de salud que se puede alcanzar curándose (ajustable)
  ui(G, me) {
    return [
      { type:'quick', label:'⚡ Ráfaga Tommy Gun', sub:'d6 de daño' },
      { type:'strong', label:'🔫 Francotirador', sub:'d20 ≥ 11, luego d12' },
      { type:'heal', label:'🩺 Médico de calle', sub: me.hp >= this.HP_CAP ? 'Salud al tope (' + this.HP_CAP + ')' : me.blocked ? '🚫 Bloqueado: usa otra habilidad' : 'd8 de salud · ' + me.heals + '/3 seguidas', disabled:me.blocked || me.hp >= this.HP_CAP },
      { type:'poison', label:'🕵️ Infiltrar Soplón', sub: this.validTargets(G, me, 'poison').length ? '1 de daño por turno' : 'Todos ya tienen soplón', disabled:!this.validTargets(G, me, 'poison').length }
    ];
  },
  validTargets(G, me, type) {                 // el soplón no se puede aplicar a quien ya lo tiene activo
    return type === 'heal' ? null : G.players.filter(p => p.alive && p !== me && (type !== 'poison' || !(p.poison > 0))).map(p => p.slot);
  },
  card(p) {
    const max = p.max || 0, hp = p.hp || 0, scale = Math.max(max, hp) || 1, over = Math.max(0, hp - max);
    const segs = [{ pct:Math.min(hp, max) / scale * 100, color:p.poison > 0 ? '#9b59b6' : 'var(--theme-accent)' }];
    if (over > 0) segs.push({ pct:over / scale * 100, color:'#f1c40f' });                    // la salud por encima de la inicial se ve en dorado
    return { segs, pct:0, color:'',
      label:p.alive ? (max ? hp + '/' + max + ' SALUD' + (over > 0 ? ' · +' + Math.round(over / max * 100) + '% extra' : '') : '— SALUD') + (p.poison > 0 ? ' · 🕵️ soplón ' + p.poison : '') + (p.blocked ? ' · 🚫 médico' : '') : '💀 ELIMINADO',
      state:p.alive ? '' : 'dead', img:p.alive ? 'idle' : 'lose' };
  },
  ranking(G) {                                // 1.º el último en pie; después, quien cayó más tarde
    return CD.rank(G.players, p => p.alive ? [1, p.hp] : [0, p.elimN || 0], p => p.alive ? p.hp + ' de salud restante' : 'Eliminado en la ronda ' + (p.outRound || '?'));
  },
  async init(G) {
    CD.log('🔫 Generando la salud inicial de los Capos…');
    for (const p of G.players) {
      let s = 10; for (let i = 0; i < 3; i++) s += await CD.roll(6, p, 'Salud inicial', 'idle');
      Object.assign(p, { hp:s, max:s, poison:0, heals:0, blocked:false, alive:true }); CD.publish(); render();
    }
    const B = MK.boss();                                                       // Evento: el Carnicero tiene +10 de salud
    if (B != null) { const b = G.players[B]; b.hp += 10; b.max = b.hp; CD.log(`💀 ${b.name} asume el rol de Jefe: +10 de salud (${b.hp}).`); }
    G.turn = Math.floor(Math.random() * G.players.length); G.start = G.turn;                 // sorteo del primer turno
    CD.log('🎲 Sorteo: empieza ' + G.players[G.turn].name + '. ¡Empieza el tiroteo!');
  },

  async act(G, att, type, tSlot) {
    const def = tSlot == null ? null : G.players[tSlot];
    if (type !== 'heal' && (!def || !def.alive || def === att)) return;
    G.focus = { att:att.slot, target:def ? def.slot : att.slot }; CD.publish(); render();   // se marca a quién eligió
    if (type === 'heal') {
      if (att.blocked || att.hp >= this.HP_CAP) return;
      att.heals++;
      const h = MK.heal(att, await CD.roll(8, att, 'Médico de calle', 'rpg_doctor'));      // Ley Seca, Red de Protección y Matasanos
      const gained = Math.min(h, this.HP_CAP - att.hp); att.hp += gained; CD.float(att.slot, '+' + gained, 'heal');
      CD.log(`💚 ${att.name} recupera +${gained} de salud (queda con ${att.hp}).` + (gained < h ? ` Tope de salud: ${this.HP_CAP}.` : ''));
      if (att.heals >= 3) { att.blocked = true; att.heals = 0; CD.log('🚫 Médico bloqueado: ' + att.name + ' debe usar otra habilidad en su próximo turno.'); }
    } else {
      att.blocked = false; att.heals = 0;                                // usar otra habilidad desbloquea al médico
      if (type === 'quick') this.hit(att, def, await CD.roll(6, att, 'Ráfaga Tommy Gun → ' + def.name, 'rpg_tommy', 'tommy'), 0, false);
      else if (type === 'strong') {
        const acc = await CD.roll(20, att, 'Francotirador (req. 11+) → ' + def.name, 'rpg_sniper', 'sniper_reload');
        if (acc >= 11) {
          const base = await CD.roll(12, att, 'Daño del Francotirador', 'rpg_sniper', 'sniper_shot');
          let crit = 0;
          if (acc === 20) { if (base + 2 <= def.hp) { crit = 2; CD.log('🎯 ¡Tiro perfecto! +2 de daño crítico.'); } else CD.log('🎯 ¡Tiro perfecto! Daño calibrado para el remate.'); }
          this.hit(att, def, base, crit, true);
        } else { att.mult = 1; CD.float(def.slot, 'FALLÓ', 'miss'); CD.log(`💨 El francotirador de ${att.name} falló contra ${def.name} (sacó ${acc}).`); }
      } else if (type === 'poison') {
        if (def.poison > 0) return;
        const blk = MK.block(def, 'el Soplón de ' + att.name); if (blk) { CD.log(blk.text); return; }     // Red de Protección / Protección Policial
        const t = await CD.roll(4, att, 'Infiltrar Soplón → ' + def.name, 'rpg_rat');
        def.poison = t; CD.float(def.slot, '🕵️ SOPLÓN', 'status'); CD.log(`🕵️ ${att.name} infiltra un soplón en ${def.name} por ${t} rondas.`);
      }
    }
    if (this.check(G)) return;
    const died = [];
    for (const p of G.players) if (p.alive && p.poison > 0) {            // el soplón filtra al final de cada turno
      p.hp -= 1; p.poison--; CD.float(p.slot, '-1', 'status');
      CD.log(`🧪 El soplón de ${p.name} filtra información (-1 salud, le quedan ${Math.max(0, p.hp)}). Quedan ${p.poison} rondas.`);
      if (p.hp <= 0) { p.hp = 0; p.alive = false; p.poison = 0; p.outRound = G.round; died.push(p); CD.log('💀 ' + p.name + ' cae por el soplón.'); }
    }
    if (died.length) { G.elimCount = (G.elimCount || 0) + 1; died.forEach(p => { p.elimN = G.elimCount; }); }     // las caídas simultáneas empatan
    this.check(G);
  },

  hit(att, def, base, crit, strong) {
    const G = CD.G;
    let dmg = base + (MK.eventsOn() && MK.ev() === 'purga' ? 2 : 0) + crit;               // Noche de Purga: +2 de daño
    dmg = Math.round(dmg * (att.mult || 1)); att.mult = 1;                                // Whisky: x2 a la próxima acción
    if (MK.boss() === def.slot && att.slot !== def.slot) dmg += 1;                       // el Carnicero recibe +1 de daño
    dmg = MK.chofer(def, dmg);                                                            // Chófer de Huida: -2 con HP < 25%
    if (dmg > def.hp) { CD.float(def.slot, '🛡️ ANULADO', 'miss'); CD.log(`🛡️ Disparo de ${att.name} anulado por sobredaño (${dmg} > ${def.hp}); ${def.name} conserva ${def.hp} de salud.`); return; }
    def.hp -= dmg; def.tookDmg = true; G.lastNeg = { target:def.slot, amount:dmg, thief:att.slot };
    CD.float(def.slot, '-' + dmg, strong || dmg >= 8 ? 'crit' : 'dmg');
    CD.log(`💥 ${att.name} acierta e inflige ${dmg} de daño a ${def.name} (le quedan ${def.hp} de salud).`);
    if (def.hp === 0) { def.alive = false; def.poison = 0; def.outRound = G.round; def.elimN = G.elimCount = (G.elimCount || 0) + 1; CD.log('💀 ' + def.name + ' ha sido eliminado.'); }
    else if (MK.has(att, 'contact_quimico') && (crit > 0 || strong) && !(def.poison > 0)) { def.poison = 3; CD.float(def.slot, 'VENENO 🧪', 'status'); CD.log(`🧪 ¡El Químico Corruptor de ${att.name} envenena a ${def.name} por 3 rondas!`); }
  },

  check(G) {                                  // gana el último en pie
    const a = CD.alive();
    if (a.length > 1) return false;
    CD.finish(a.length ? a[0].slot : null); return true;
  }
};
