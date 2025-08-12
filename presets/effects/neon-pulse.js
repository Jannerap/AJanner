/**
 * Neon Pulse - Custom Preset Example
 * Pulsing neon effects with audio reactivity
 */

export function renderNeonPulse(ctx, time, audioData, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create pulsing neon circles
  for (let ring = 0; ring < 5; ring++) {
    const pulse = Math.sin(time * 3 + ring * 0.5) * 0.5 + 0.5;
    const radius = 60 + ring * 40 + pulse * 20;
    const opacity = 0.3 + pulse * 0.4;
    
    // Neon glow effect
    ctx.shadowColor = `hsl(${(ring * 60 + time * 30) % 360}, 100%, 70%)`;
    ctx.shadowBlur = 20 + pulse * 10;
    
    // Outer glow
    ctx.strokeStyle = `hsla(${(ring * 60 + time * 30) % 360}, 100%, 70%, ${opacity * 0.5})`;
    ctx.lineWidth = 3 + pulse * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner fill
    ctx.fillStyle = `hsla(${(ring * 60 + time * 30) % 360}, 100%, 70%, ${opacity * 0.2})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Add audio-reactive center pulse
  const centerPulse = Math.sin(time * 4) * 0.5 + 0.5;
  const centerSize = 20 + centerPulse * 15 + (audioData.volume * 0.1);
  
  ctx.fillStyle = `hsl(${(time * 100) % 360}, 100%, 70%)`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centerSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Add neon lines radiating from center
  for (let line = 0; line < 8; line++) {
    const angle = (line / 8) * Math.PI * 2 + time;
    const lineLength = 120 + Math.sin(time * 2 + line * 0.3) * 30;
    const endX = centerX + Math.cos(angle) * lineLength;
    const endY = centerY + Math.sin(angle) * lineLength;
    
    ctx.strokeStyle = `hsl(${(line * 45 + time * 60) % 360}, 100%, 70%)`;
    ctx.lineWidth = 2 + Math.sin(time * 3 + line * 0.2) * 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}
