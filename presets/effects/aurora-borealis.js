/**
 * Aurora Borealis Effect
 * Beautiful flowing aurora ribbons with audio reactivity
 */

export function renderAuroraBorealis(canvas, ctx, audioData, time) {
    // Safety checks
    if (!canvas || !ctx) {
        console.warn('Aurora Borealis: Missing canvas or context');
        return;
    }
    
    if (!ctx.createRadialGradient) {
        console.warn('Aurora Borealis: Context does not support createRadialGradient');
        return;
    }
    
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Audio reactivity with fallbacks
    const bass = (audioData && audioData.bass) || 0;
    const treble = (audioData && audioData.treble) || 0;
    const overall = (audioData && audioData.overall) || 0;
    
    // Clear canvas with gradient background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
    gradient.addColorStop(0, 'rgba(0, 20, 40, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 10, 20, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create multiple aurora ribbons
    const numRibbons = 5 + Math.floor(overall * 3);
    
    for (let i = 0; i < numRibbons; i++) {
        const ribbon = createAuroraRibbon(width, height, i, time, bass, treble);
        drawAuroraRibbon(ctx, ribbon);
    }
    
    // Add floating particles
    drawAuroraParticles(ctx, width, height, time, overall);
}

function createAuroraRibbon(width, height, index, time, bass, treble) {
    const speed = 0.5 + bass * 0.5;
    const amplitude = 50 + treble * 100;
    const frequency = 0.02 + index * 0.01;
    const phase = time * speed + index * Math.PI * 0.4;
    
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
        const x = (i / numPoints) * width;
        const baseY = height * 0.3 + Math.sin(phase + i * frequency) * amplitude;
        const waveY = Math.sin(phase * 0.5 + i * 0.1) * 30;
        const y = baseY + waveY;
        
        points.push({ x, y });
    }
    
    return {
        points,
        color: getAuroraColor(index, time),
        width: 8 + bass * 4,
        alpha: 0.6 + treble * 0.4
    };
}

function drawAuroraRibbon(ctx, ribbon) {
    const { points, color, width, alpha } = ribbon;
    
    // Create gradient for the ribbon
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.3, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.7, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw the main ribbon
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        ctx.lineTo(point.x, point.y);
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = ribbon.color;
    ctx.shadowBlur = width * 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function getAuroraColor(index, time) {
    const colors = [
        '#00ff88', // Green
        '#00ffff', // Cyan
        '#0088ff', // Blue
        '#8800ff', // Purple
        '#ff0088', // Pink
        '#ff8800', // Orange
        '#ffff00'  // Yellow
    ];
    
    const baseColor = colors[index % colors.length];
    const hueShift = Math.sin(time * 0.1 + index) * 30;
    
    // Simple hue shifting (in real implementation, you'd use HSL)
    return baseColor;
}

function drawAuroraParticles(ctx, width, height, time, overall) {
    const numParticles = 20 + Math.floor(overall * 30);
    
    for (let i = 0; i < numParticles; i++) {
        const x = (Math.sin(time * 0.1 + i) + 1) * width * 0.5;
        const y = (Math.cos(time * 0.15 + i * 0.5) + 1) * height * 0.5;
        const size = 2 + Math.sin(time * 0.2 + i) * 2;
        const alpha = 0.3 + Math.sin(time * 0.3 + i) * 0.3;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}
