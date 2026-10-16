// Procedural Web Audio API Synthesizer for Referee Pea-Whistle, VAR Klaxon, and Card SFX

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Authentic dual-tone modulated pea-whistle blast (~2850Hz + ~3120Hz with 48Hz pea trill)
   */
  public playWhistle(duration = 0.45) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const masterGain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2840, now);
    osc2.frequency.setValueAtTime(3110, now);

    // Pea modulation trill
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(52, now);
    lfoGain.gain.setValueAtTime(140, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.22, now + 0.025);
    masterGain.gain.setValueAtTime(0.22, now + Math.max(0.05, duration - 0.06));
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(masterGain);
    osc2.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    lfo.stop(now + duration);
  }

  /**
   * VAR On-Field Review Two-Tone Broadcast Chime
   */
  public playVarAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [587.33, 880, 587.33, 1174.66]; // D5 - A5 - D5 - D6
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.11);

      g.gain.setValueAtTime(0.001, now + idx * 0.11);
      g.gain.linearRampToValueAtTime(0.12, now + idx * 0.11 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.1);

      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.1);
    });
  }

  /**
   * Crisp Card Brandish Sound
   */
  public playCardBrandish(isRed = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = isRed ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isRed ? 320 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(isRed ? 980 : 1240, now + 0.16);

    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }
}

export const soundEngine = new SoundEngine();
