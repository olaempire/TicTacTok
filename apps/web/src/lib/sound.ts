let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playClickSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
}

export function playWinSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'triangle';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, index) => {
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);
  });

  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.6);
}
