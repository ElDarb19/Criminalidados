// ===== IA de los bots (una sola dificultad) =====
// Evalúa cada combinación acción × objetivo con su valor esperado y elige la mejor.
// Punto de extensión para el paso de objetos/eventos: AI.modifiers.
const AI = {
  modifiers: [],                              // funciones (ctx, valor) => valor, se añadirán con Mercado Negro y Eventos
  decide(G, me, contract) { return contract === 'rpg' ? this.rpg(G, me) : null; },

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
  }
};
