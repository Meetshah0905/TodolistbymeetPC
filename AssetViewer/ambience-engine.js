// Ambience sound engine shared by ambience.html and the focus timer on index.html.
//
// - Recorded loops (cottage, fire) play through Web Audio so the volume slider also
//   works on iPhone/iPad (iOS ignores HTMLAudioElement.volume).
// - "Heavy Rain" and "Thunder & Rain" are generated live from filtered noise:
//   no download, never ends, and nothing to buffer on slow connections.
// - Volumes are remembered in localStorage ('fl_ambience'), so they sync with the account.
(function () {
  const PREFS_KEY = 'fl_ambience';

  const SOUNDS = [
    { id: 'cottage', title: 'Cottage Light', icon: '🏡', kind: 'Recorded loop', src: 'assets/optimized/cottage-light.mp3' },
    { id: 'fire', title: 'Wooden Fire', icon: '🔥', kind: 'Recorded loop', src: 'assets/optimized/wooden-fire.mp3' },
    { id: 'rain', title: 'Heavy Rain', icon: '🌧️', kind: 'Live generated' },
    { id: 'storm', title: 'Thunder & Rain', icon: '⛈️', kind: 'Live generated' }
  ];

  let ctx = null;
  let master = null;
  const channels = {}; // id -> { gain, playing, stop(), ... }
  const listeners = new Set();
  let noiseCache = null;

  function readPrefs() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      return prefs && typeof prefs === 'object' ? prefs : {};
    } catch (e) {
      return {};
    }
  }

  function writePrefs(prefs) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) { }
  }

  function getVolume(id) {
    const v = readPrefs().volumes?.[id];
    return typeof v === 'number' && v >= 0 && v <= 1 ? v : 0.7;
  }

  function setVolume(id, value) {
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    const prefs = readPrefs();
    prefs.volumes = Object.assign({}, prefs.volumes, { [id]: Math.round(v * 100) / 100 });
    writePrefs(prefs);
    const ch = channels[id];
    if (ch && ctx) {
      ch.gain.gain.setTargetAtTime(curve(v), ctx.currentTime, 0.05);
    }
    emit();
  }

  // Perceptual volume curve: the slider feels linear to the ear
  function curve(v) {
    return v * v;
  }

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => { });
      return ctx;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    return ctx;
  }

  // ---------- Noise generation ----------
  function makeNoiseBuffers() {
    if (noiseCache) return noiseCache;
    const seconds = 6;
    const length = ctx.sampleRate * seconds;
    const pink = ctx.createBuffer(2, length, ctx.sampleRate);
    const brown = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const p = pink.getChannelData(channel);
      const b = brown.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        // Paul Kellet's pink noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
        // Brown noise: integrated white noise
        last = (last + 0.02 * white) / 1.02;
        b[i] = last * 3.5;
      }
      // Crossfade the loop point so the repeat is seamless
      const fade = Math.floor(ctx.sampleRate * 0.25);
      for (let i = 0; i < fade; i++) {
        const t = i / fade;
        p[i] = p[i] * t + p[length - fade + i] * (1 - t);
        b[i] = b[i] * t + b[length - fade + i] * (1 - t);
      }
    }
    noiseCache = { pink, brown };
    return noiseCache;
  }

  function loopSource(buffer, offset) {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopEnd = buffer.duration - 0.25;
    src.start(0, offset || 0);
    return src;
  }

  // Rain = bright pink-noise "hiss" + darker brown-noise "body", slowly breathing
  function buildRain(out, intensity) {
    const { pink, brown } = makeNoiseBuffers();
    const nodes = [];

    const hiss = loopSource(pink, Math.random() * 3);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7000;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.55 * intensity;
    hiss.connect(hp).connect(lp).connect(hissGain).connect(out);

    const body = loopSource(brown, Math.random() * 3);
    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = 900;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.5 * intensity;
    body.connect(bodyLp).connect(bodyGain).connect(out);

    // Slow swell so it doesn't sound like static
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.12 * intensity;
    lfo.connect(lfoDepth).connect(hissGain.gain);
    lfo.start();

    nodes.push(hiss, body, lfo);
    return () => nodes.forEach(n => { try { n.stop(); } catch (e) { } });
  }

  function thunderClap(out) {
    const { brown, pink } = makeNoiseBuffers();
    const now = ctx.currentTime;
    const strength = 0.6 + Math.random() * 0.6;
    const length = 3 + Math.random() * 4;

    // Low rumble
    const rumble = ctx.createBufferSource();
    rumble.buffer = brown;
    const rumbleLp = ctx.createBiquadFilter();
    rumbleLp.type = 'lowpass';
    rumbleLp.frequency.setValueAtTime(140 + Math.random() * 120, now);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.exponentialRampToValueAtTime(1.6 * strength, now + 0.15 + Math.random() * 0.4);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    rumble.connect(rumbleLp).connect(rumbleGain).connect(out);
    rumble.start(now, Math.random() * 2);
    rumble.stop(now + length + 0.1);

    // Occasional sharp crack at the start
    if (Math.random() < 0.5) {
      const crack = ctx.createBufferSource();
      crack.buffer = pink;
      const crackBp = ctx.createBiquadFilter();
      crackBp.type = 'bandpass';
      crackBp.frequency.value = 900;
      crackBp.Q.value = 0.6;
      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.0001, now);
      crackGain.gain.exponentialRampToValueAtTime(0.5 * strength, now + 0.03);
      crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      crack.connect(crackBp).connect(crackGain).connect(out);
      crack.start(now, Math.random() * 2);
      crack.stop(now + 1);
    }
  }

  function buildStorm(out) {
    const stopRain = buildRain(out, 0.75);
    let timer = null;
    const schedule = (delay) => {
      timer = setTimeout(() => {
        thunderClap(out);
        schedule(9000 + Math.random() * 18000);
      }, delay);
    };
    schedule(2500 + Math.random() * 4000);
    return () => {
      clearTimeout(timer);
      stopRain();
    };
  }

  // ---------- Channels ----------
  function getChannel(id) {
    if (channels[id]) return channels[id];
    const sound = SOUNDS.find(s => s.id === id);
    if (!sound || !ensureContext()) return null;

    const gain = ctx.createGain();
    gain.gain.value = curve(getVolume(id));
    gain.connect(master);
    const ch = { id, sound, gain, playing: false, stopFn: null, audio: null };

    if (sound.src) {
      const audio = new Audio();
      audio.src = sound.src;
      audio.loop = true;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      ctx.createMediaElementSource(audio).connect(gain);
      audio.addEventListener('pause', () => {
        if (ch.playing && !audio.ended) {
          // Paused by the OS (e.g. lock screen controls or another app took audio focus)
          ch.playing = false;
          emit();
        }
      });
      ch.audio = audio;
    }

    channels[id] = ch;
    return ch;
  }

  function play(id) {
    const ch = getChannel(id);
    if (!ch || ch.playing) return;
    ensureContext();
    ch.playing = true;
    if (ch.audio) {
      ch.audio.play().catch(() => {
        ch.playing = false;
        emit();
      });
    } else if (id === 'rain') {
      ch.stopFn = buildRain(ch.gain, 1);
    } else if (id === 'storm') {
      ch.stopFn = buildStorm(ch.gain);
    }
    updateMediaSession();
    emit();
  }

  function pause(id) {
    const ch = channels[id];
    if (!ch || !ch.playing) return;
    ch.playing = false;
    if (ch.audio) ch.audio.pause();
    if (ch.stopFn) {
      ch.stopFn();
      ch.stopFn = null;
    }
    updateMediaSession();
    emit();
  }

  function toggle(id) {
    if (isPlaying(id)) pause(id);
    else play(id);
  }

  function isPlaying(id) {
    return !!(channels[id] && channels[id].playing);
  }

  function playingIds() {
    return SOUNDS.filter(s => isPlaying(s.id)).map(s => s.id);
  }

  function stopAll() {
    SOUNDS.forEach(s => pause(s.id));
  }

  let lastPlaying = [];
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const ids = playingIds();
    if (ids.length) lastPlaying = ids;
    try {
      navigator.mediaSession.metadata = ids.length ? new MediaMetadata({
        title: ids.map(id => SOUNDS.find(s => s.id === id).title).join(' + '),
        artist: 'Focus List Ambience',
        artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
      }) : null;
      navigator.mediaSession.playbackState = ids.length ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('pause', stopAll);
      navigator.mediaSession.setActionHandler('stop', stopAll);
      navigator.mediaSession.setActionHandler('play', () => lastPlaying.forEach(play));
    } catch (e) { }
  }

  function emit() {
    listeners.forEach(fn => {
      try { fn(); } catch (e) { console.warn(e); }
    });
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.FLAmbience = { SOUNDS, play, pause, toggle, isPlaying, playingIds, stopAll, getVolume, setVolume, onChange };
})();
