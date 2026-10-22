// ===== IA de los bots (una sola dificultad) =====
// Evalúa cada combinación acción × objetivo con su valor esperado y elige la mejor.
// Punto de extensión para el paso de objetos/eventos: AI.modifiers.
const AI = {
  modifiers: [],                              // funciones (ctx, valor) => valor, se añadirán con Mercado Negro y Eventos
  decide(G, me, contract) { return contract === 'rpg' ? this.rpg(G, me) : contract === 'exp' ? this.exp(G, me) : contract === 'maf' ? this.maf(G, me) : contract === 'pok' ? this.pok(G, me) : null; },

  rpg(G, me) {
    const foes = G.players.filter(p => p.alive && p.slot !== me.slot);
    if (!foes.length) return null;
    const sumTo = n => n * (n + 1) / 2;
    // Con la regla de sobredaño, un disparo mayor que la salud del objetivo se pierde.
    const quick = h => sumTo(Math.min(h, 6)) / 6;                              // valor esperado de la Ráfaga
    const strong = h => 0.5 * sumTo(Math.min(h, 12)) / 12;                     // d20≥11 (50%) y luego d12
    const kill = (h, p, sides) => h <= sides ? p / sides : 0;
    const opts = [];
    for (const f of foes) {
      const h = f.hp, lowBonus = h <= 8 ? 2 : 0;                               // remata a los débiles
      opts.push({ type:'quick', target:f.slot, v:quick(h) + 6 * kill(h, 1, 6) + lowBonus });
      opts.push({ type:'strong', target:f.slot, v:strong(h) + 6 * kill(h, .5, 12) + lowBonus });
      if (f.poison === 0 && h > 3) opts.push({ type:'poison', target:f.slot, v:2.5 + (h <= 8 ? 1 : 0) });   // daño garantizado, sin sobredaño
      // Si hay varios rivales, castiga más al que está más débil o al que va ganando.
      const lead = Math.max(...foes.map(x => x.hp));
      if (foes.length > 1 && h === lead) opts.forEach(o => { if (o.target === f.slot) o.v += .7; });
    }
    const frac = me.hp / me.max;
    if (!me.blocked) opts.push({ type:'heal', target:null, v: frac < .3 ? 5.5 + (1 - frac) * 3 : frac < .5 ? 2.4 : 0.3 });
    opts.forEach(o => { this.modifiers.forEach(m => { o.v = m({ G, me, foes, o }, o.v); }); o.v += Math.random() * .6; });
    opts.sort((a, b) => b.v - a.v);
    return opts[0];
  },

  // El Gran Atraco: decide entre sabotear, reforzar, forzar la bóveda, huir o saquear.
  exp(G, me) {
    const foes = G.players.filter(p => p.alive && p !== me);                 // rivales aún dentro del banco
    const mx = EXP.maxGrenades(), grenades = me.torpedoUses < mx;
    const repairOk = (EXP.party() ? me.repairCooldown <= 0 : me.repairUses < 1) && me.hp < me.max;
    const best = Math.max(0, ...G.players.filter(p => p !== me).map(p => p.secured + p.temp));   // el rival más fuerte
    const behind = me.secured + me.temp <= best;
    // 1. Sabotaje: contra el rival que más botín arriesga; si está casi arrestado, el golpe es letal para su botín.
    if (grenades && foes.length) {
      const t = foes.slice().sort((x, y) => (y.temp + (y.hp <= 4 ? 3 : 0)) - (x.temp + (x.hp <= 4 ? 3 : 0)))[0];
      const killable = t.hp <= 4;
      if (t.temp >= 2 && (killable && t.temp >= 3 || Math.random() < .75)) return { type:'sabotage', target:t.slot };
    }
    // 2. Cobertura crítica: refuerza si está baja y puede.
    if (me.hp <= 6 && repairOk) return { type:'repair' };
    // 3. Con poca Cobertura y botín en las manos, asegura antes de arriesgarse a que la arresten.
    if (me.hp <= 3 && me.temp > 0) return { type:'surface' };
    // 4. Si algún rival aún puede lanzar granadas, llevar mucho botín encima es peligroso: huye si va ganando.
    const threatened = foes.some(f => f.torpedoUses < mx);
    if (me.temp >= (threatened ? 4 : 5) && !behind) return { type:'surface' };
    // 5. Si va perdiendo, arriesga la bóveda (nunca huye); si no, saquea.
    if (behind && me.hp > 4) return { type:'deep' };
    return { type:'explore' };
  },

  // Imperio Criminal: cobra (casi siempre d12, que rinde más), expande, soborna y ataca al líder con redadas.
  maf(G, me) {
    const foes = G.players.filter(p => p !== me);
    if (G.phase === 'roll') {
      const rivalAvg = foes.reduce((s, f) => s + f.parcels.length, 0) / (foes.length || 1);
      // "Lavar dinero" cuesta 1💵: solo compensa si yo tengo muchos distritos y no quiero regalar cobros a rivales fuertes.
      const egoist = me.coins >= 3 && (me.parcels.length >= 4 || rivalAvg > me.parcels.length + 1) && Math.random() < .5;
      const sides = Math.random() < .85 ? 12 : 6;
      return { type: sides === 12 ? 'harvest12' : 'harvest6', extra:{ egoist } };
    }
    const cost = me.parcels.length + 1, canBuy = me.parcels.length < 6 && me.coins >= cost;
    const leader = foes.slice().sort((x, y) => (y.prestige - x.prestige) || (y.parcels.length - x.parcels.length));
    if (me.coins >= 5 && me.prestige + 2 >= G.winScore) return { type:'brew' };                       // remata la partida
    // Con 4+ distritos el efectivo rinde más en influencia que en expandirse: soborna antes de comprar el 5.º/6.º.
    if (me.coins >= 5 && me.parcels.length >= 4) return { type:'brew' };
    if (canBuy) { const free = [1, 2, 3, 4, 5, 6].filter(i => !me.parcels.includes(i)); return { type:'buy', extra:free[Math.floor(Math.random() * free.length)] }; }
    if (me.coins >= 5 && Math.random() < .6) return { type:'brew' };
    if (me.coins >= 3) {                                                                               // redada contra el rival más peligroso
      const t = leader.find(f => MAF.raidTargets(G, me).includes(f.slot));
      if (t) { const d = t.parcels.filter(i => !(t.raids[i] > 0)); return { type:'raid', target:t.slot, extra:d[Math.floor(Math.random() * d.length)] }; }
    }
    return { type:'pass' };
  },

  // Apuestas Clandestinas: calcula el valor esperado de cada acción contra cada rival.
  pok(G, me) {
    const rivals = G.players.filter(p => p.alive && p !== me && p.tokens >= 1);
    const rank = 1 + G.players.filter(p => p.alive && p !== me && p.tokens > me.tokens).length;           // 1 = voy primero
    const lastRounds = G.round >= POK.MAX_ROUNDS - 1;
    const opts = [];
    for (const t of rivals) {
      const T = t.tokens, kill = T <= 1 ? .4 : 0;                                                        // dejar a un rival sin fichas lo elimina
      if (POK.validTargets(G, me, 'cheat').includes(t.slot)) {                                          // sin riesgo: siempre que pueda
        let e = 0; for (let d = 1; d <= 4; d++) e += Math.min(d, T) / 4;
        opts.push({ type:'cheat', target:t.slot, v:e + 1 + (T >= 5 ? .4 : 0) });
      }
      if (POK.validTargets(G, me, 'bet').includes(t.slot)) {
        const risk = me.tokens <= 2 ? -1.2 : 0;                                                          // con 1-2 fichas, perder la apuesta es peligroso
        opts.push({ type:'bet', target:t.slot, v:0 + kill + risk + (T >= me.tokens + 2 ? .3 : 0) });
      }
      if (POK.validTargets(G, me, 'slam').includes(t.slot)) {
        let win = 0; for (let d = 1; d <= Math.min(12, T); d++) win += d / 12;                            // los robos mayores que sus fichas se anulan
        let v = .5 * win - .5 * Math.min(3, me.tokens) + kill;
        if (me.tokens <= 4) v -= 1.2;                                                                    // no jugarse la bancarrota
        if (lastRounds) v += rank > 1 ? .8 : -1.2;                                                       // al final: arriesga quien va detrás, asegura quien va delante
        opts.push({ type:'slam', target:t.slot, v });
      }
    }
    if (!opts.length) return null;
    opts.forEach(o => { this.modifiers.forEach(m => { o.v = m({ G, me, rivals, o }, o.v); }); o.v += Math.random() * .5; });
    opts.sort((x, y) => y.v - x.v);
    // Apunta al rival con más fichas cuando el valor es parecido (es de quien más se puede robar).
    return opts[0];
  }
};
