// ===== Audio · Web Audio (sonidos sintetizados, sin archivos) + tus mp3 de assets/audios =====
// Si falta un mp3, el sonido sintetizado suena igual. Para añadir un sonido nuevo con archivo:
// copia el .mp3 a assets/audios/ y agrégalo a MP3 (nombre, ruta y duración en segundos).
const MP3 = {
  tommy:         { url:'assets/audios/tommygun.mp3',    dur:0.44 },
  sniper_reload: { url:'assets/audios/sniperreload.mp3', dur:0.22 },
  sniper_shot:   { url:'assets/audios/snipershoot.mp3', dur:0.50 },
  fuse:          { url:'assets/audios/tnttss.mp3',      dur:0.65 },
  dynamite:      { url:'assets/audios/tntboom.mp3',     dur:0.70 },
  heartbeat:     { url:'assets/audios/heartbeat.mp3',   dur:1.10 },
  car:           { url:'assets/audios/car.mp3',         dur:1.20 }
};
const SND = { ctx:null, buf:{}, muted:false };

function audioCtx() {
  if (!SND.ctx) {
    try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    Object.keys(MP3).forEach(k => fetch(MP3[k].url).then(r => r.arrayBuffer()).then(b => SND.ctx.decodeAudioData(b)).then(d => { SND.buf[k] = d; }).catch(() => {}));
  }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
// Los navegadores bloquean el audio hasta que el usuario toca la pantalla: se activa con el primer toque.
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => audioCtx(), { once:true, passive:true }));

// Una nota: tipo de onda, frecuencias [inicio, ..., fin], duración y volumen.
function tone(ctx, type, freqs, dur, vol, delay = 0) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freqs[0], t);
  if (freqs.length === 2) o.frequency.exponentialRampToValueAtTime(freqs[1], t + dur);
  else freqs.forEach((f, i) => o.frequency.setValueAtTime(f, t + i * dur / freqs.length));
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
}

function playSound(name) {
  if (SND.muted) return;
  const ctx = audioCtx(); if (!ctx) return;
  try {
    if (SND.buf[name]) {                                   // mp3 cargado
      const s = ctx.createBufferSource(), g = ctx.createGain(), d = MP3[name].dur, t = ctx.currentTime;
      s.buffer = SND.buf[name]; s.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(1, t); g.gain.setValueAtTime(1, t + Math.max(0, d - .05)); g.gain.linearRampToValueAtTime(0, t + d);
      s.start(t); s.stop(t + d); return;
    }
    switch (name) {                                         // sintetizados
      case 'roll':          tone(ctx, 'triangle', [180 + Math.random() * 80, 120], .05, .08); break;
      case 'diceLanding':   tone(ctx, 'square', [520, 880], .15, .15); break;
      case 'hit':           tone(ctx, 'sawtooth', [150, 40], .2, .3); break;
      case 'crit':          tone(ctx, 'square', [300, 60], .35, .4); break;
      case 'heal':          tone(ctx, 'sine', [330, 660], .25, .2); break;
      case 'coin':          tone(ctx, 'sine', [987.77, 1318.51], .25, .15); break;
      case 'win':           tone(ctx, 'triangle', [523.25, 659.25, 783.99, 1046.5], .6, .2); break;
      case 'tommy':         for (let i = 0; i < 6; i++) tone(ctx, 'sawtooth', [75 + Math.random() * 25, 60], .05, .3, i * .065); break;
      case 'sniper_reload': tone(ctx, 'sine', [1200, 400], .08, .2); break;
      case 'sniper_shot':   tone(ctx, 'square', [900, 60], .3, .35); break;
    }
  } catch (e) {}
}
