/**
 * Supernova Burst2 - Custom Preset
 * Audio-reactive particle explosion with neon glow + radial shockwaves
 */

export function renderSupernovaBurst2(ctx, time, audioData, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;

  // ---- Audio features (robust to different audioData shapes) ----
  const volume = (audioData && typeof audioData.volume === "number") ? audioData.volume : 0;
  const spectrum = (audioData && Array.isArray(audioData.spectrum)) ? audioData.spectrum : [];

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const bassBins = spectrum.slice(0, Math.max(1, Math.floor(spectrum.length * 0.1)));
  const midBins  = spectrum.slice(Math.floor(spectrum.length * 0.1), Math.floor(spectrum.length * 0.5));
  const highBins = spectrum.slice(Math.floor(spectrum.length * 0.5));

  const bass   = avg(bassBins);
  const mids   = avg(midBins);
  const treble = avg(highBins);

  // Normalize a bit so it's lively even with quiet inputs
  const energy = Math.max(0.1, volume * 0.01 + bass * 0.6 + mids * 0.3 + treble * 0.1);

  // ---- Optional subtle fade for trails (comment out if your engine clears) ----
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // ---- Radial shockwave rings (audio + time) ----
  ctx.save();
  const ringCount = 3;
  for (let r = 0; r < ringCount; r++) {
    const pulse = (Math.sin(time * (3 + r) + r * 0.8) * 0.5 + 0.5);
    const baseRadius = Math.min(width, height) * (0.15 + r * 0.2);
    const radius = baseRadius + pulse * 20 + bass * 40;

    ctx.shadowColor = `hsla(${(time * 80 + r * 50) % 360}, 100%, 70%, 1)`;
    ctx.shadowBlur = 25 + pulse * 15;

    ctx.strokeStyle = `hsla(${(time * 80 + r * 50) % 360}, 100%, 70%, ${0.25 + pulse * 0.35})`;
    ctx.lineWidth = 2 + pulse * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ---- Particle explosion ----
  ctx.save();
  const particleCount = 180;
  const maxR = Math.min(width, height) * 0.5;
  // Use modulo wave for repeating outward bursts
  const burstPhase = (time * (0.35 + energy * 0.4)) % 1; // 0..1
  const explosionRadius = 40 + burstPhase * maxR;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.15;
    // jitter to make it more organic
    const jitter = (Math.sin(time * 2 + i * 12.9898) * 43758.5453) % 1;
    const r = explosionRadius * (0.9 + jitter * 0.2);

    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    // Size reacts more to treble for sparkly tips
    const size = 1.2 + treble * 6 + Math.sin(time * 5 + i) * 0.6;

    // Supernova warm core → hot rim hues
    const hue = (time * 90 + i * 2) % 360;
    const warmth = 0.6 + bass * 0.4; // bias toward warm colors when bass hits
    const mixHue = hue * (1 - warmth) + 45 * warmth; // skew toward ~45° (gold)

    ctx.shadowColor = `hsla(${mixHue}, 100%, 70%, 1)`;
    ctx.shadowBlur = 20 + energy * 30;

    ctx.fillStyle = `hsla(${mixHue}, 100%, ${60 + Math.sin(i + time) * 10}%, ${0.35 + energy * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ---- Radiating beams (audio-reactive) ----
  ctx.save();
  ctx.lineCap = 'round';
  const beams = 24;
  for (let b = 0; b < beams; b++) {
    const a = (b / beams) * Math.PI * 2 + time * 0.3;
    const len = 80 + Math.sin(time * 2 + b * 0.3) * 20 + energy * 120;

    const ex = centerX + Math.cos(a) * len;
    const ey = centerY + Math.sin(a) * len;

    ctx.strokeStyle = `hsla(${(time * 120 + b * 10) % 360}, 100%, 70%, ${0.2 + energy * 0.3})`;
    ctx.lineWidth = 1.5 + energy * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();

  // ---- Core flare ----
  ctx.save();
  const corePulse = Math.sin(time * 6) * 0.5 + 0.5;
  const coreSize = 10 + corePulse * 10 + energy * 18;

  ctx.shadowColor = `hsla(${(time * 150) % 360}, 100%, 70%, 1)`;
  ctx.shadowBlur = 40 + energy * 30;

  ctx.fillStyle = `hsla(${(time * 150) % 360}, 100%, 70%, ${0.6 + energy * 0.3})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}