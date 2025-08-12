/**
 * My Cool Effect - Custom Visualization
 * This is an example of how to create custom visualizations
 */

export function renderMyCoolEffect(ctx, time, audioData, width, height) {
  // Get center point
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Get audio-reactive values
  const bass = audioData.bass || 0;
  const mid = audioData.mid || 0;
  const treble = audioData.treble || 0;
  
  // Create gradient background
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
  gradient.addColorStop(0, `hsl(${time * 0.1 % 360}, 70%, 50%)`);
  gradient.addColorStop(0.5, `hsl(${(time * 0.1 + 120) % 360}, 70%, 40%)`);
  gradient.addColorStop(1, `hsl(${(time * 0.1 + 240) % 360}, 70%, 30%)`);
  
  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw audio-reactive circles
  const circleCount = 8;
  for (let i = 0; i < circleCount; i++) {
    const angle = (i / circleCount) * Math.PI * 2 + time * 0.001;
    const radius = 50 + (bass * 0.5) + Math.sin(time * 0.01 + i) * 20;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = 10 + (mid * 0.3) + Math.sin(time * 0.02 + i) * 5;
    
    // Circle color based on audio
    ctx.fillStyle = `hsl(${(time * 0.1 + i * 45) % 360}, 80%, 60%)`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // Draw connecting lines
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + treble * 0.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < circleCount; i++) {
    const angle = (i / circleCount) * Math.PI * 2 + time * 0.001;
    const radius = 50 + (bass * 0.5) + Math.sin(time * 0.01 + i) * 20;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();
}
