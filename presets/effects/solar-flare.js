/**
 * Solar Flare Effect
 * Intense solar flare with explosive energy and plasma streams
 */

export function renderSolarFlare(canvas, ctx, audioData, time) {
    // Safety checks
    if (!canvas || !ctx) {
        console.warn('Solar Flare: Missing canvas or context');
        return;
    }
    
    if (!ctx.createRadialGradient) {
        console.warn('Solar Flare: Context does not support createRadialGradient');
        return;
    }
    
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Audio reactivity with fallbacks
    const bass = (audioData && audioData.bass) || 0;
    const treble = (audioData && audioData.treble) || 0;
    const overall = (audioData && audioData.overall) || 0;
    
    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
    gradient.addColorStop(0, 'rgba(20, 0, 0, 0.1)');
    gradient.addColorStop(0.5, 'rgba(40, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(60, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create solar flare
    const flare = createSolarFlare(centerX, centerY, time, overall);
    
    // Update flare based on audio
    updateSolarFlare(flare, audioData, time);
    
    // Draw the solar flare
    drawSolarFlare(ctx, flare, time);
    
    // Add plasma streams
    drawPlasmaStreams(ctx, width, height, time, treble);
    
    // Add energy particles
    drawEnergyParticles(ctx, width, height, time, overall);
}

function createSolarFlare(centerX, centerY, time, overall) {
    const baseSize = 100 + overall * 100;
    const intensity = 0.5 + Math.sin(time * 0.2) * 0.5;
    
    return {
        x: centerX,
        y: centerY,
        baseSize: baseSize,
        currentSize: baseSize * (1 + intensity),
        intensity: intensity,
        rotation: time * 0.1,
        plasmaStreams: [],
        energyRings: []
    };
}

function updateSolarFlare(flare, audioData, time) {
    const { bass, treble, overall } = audioData;
    
    // Update flare size based on bass
    flare.currentSize = flare.baseSize * (1 + bass * 0.5);
    
    // Update intensity based on overall audio
    flare.intensity = 0.5 + (overall * 0.5) + Math.sin(time * 0.2) * 0.3;
    
    // Create plasma streams
    if (Math.random() < 0.1 + treble * 0.2) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const length = 50 + Math.random() * 100;
        
        flare.plasmaStreams.push({
            x: flare.x,
            y: flare.y,
            angle: angle,
            speed: speed,
            length: length,
            age: 0,
            maxAge: 100 + Math.random() * 100
        });
    }
    
    // Update plasma streams
    flare.plasmaStreams = flare.plasmaStreams.filter(stream => {
        stream.age++;
        stream.x += Math.cos(stream.angle) * stream.speed;
        stream.y += Math.sin(stream.angle) * stream.speed;
        return stream.age < stream.maxAge;
    });
    
    // Create energy rings
    if (Math.random() < 0.05 + overall * 0.1) {
        flare.energyRings.push({
            radius: 0,
            maxRadius: 200 + Math.random() * 200,
            speed: 3 + Math.random() * 2,
            alpha: 1,
            color: getEnergyRingColor(Math.random())
        });
    }
    
    // Update energy rings
    flare.energyRings = flare.energyRings.filter(ring => {
        ring.radius += ring.speed;
        ring.alpha = 1 - (ring.radius / ring.maxRadius);
        return ring.alpha > 0;
    });
}

function drawSolarFlare(ctx, flare, time) {
    const { x, y, currentSize, intensity, rotation } = flare;
    
    // Draw core
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 0.3);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.8)');
    coreGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.6)');
    coreGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, currentSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw main flare
    const flareGradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    flareGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    flareGradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.6)');
    flareGradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
    flareGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = flareGradient;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw plasma streams
    flare.plasmaStreams.forEach(stream => {
        drawPlasmaStream(ctx, stream, time);
    });
    
    // Draw energy rings
    flare.energyRings.forEach(ring => {
        drawEnergyRing(ctx, x, y, ring);
    });
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
    ctx.shadowBlur = currentSize * 0.5;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPlasmaStream(ctx, stream, time) {
    const alpha = 1 - (stream.age / stream.maxAge);
    const width = 3 + Math.sin(time * 0.1 + stream.age * 0.1) * 2;
    
    ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    // Draw plasma trail
    ctx.beginPath();
    ctx.moveTo(stream.x, stream.y);
    
    for (let i = 1; i <= 10; i++) {
        const progress = i / 10;
        const trailX = stream.x - Math.cos(stream.angle) * stream.length * progress;
        const trailY = stream.y - Math.sin(stream.angle) * stream.length * progress;
        const trailAlpha = alpha * (1 - progress);
        
        ctx.strokeStyle = `rgba(255, 100, 0, ${trailAlpha})`;
        ctx.lineTo(trailX, trailY);
    }
    
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
    ctx.shadowBlur = width * 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawEnergyRing(ctx, centerX, centerY, ring) {
    ctx.strokeStyle = ring.color.replace(')', `, ${ring.alpha})`);
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawPlasmaStreams(ctx, width, height, time, treble) {
    const numStreams = 5 + Math.floor(treble * 10);
    
    for (let i = 0; i < numStreams; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const angle = Math.random() * Math.PI * 2;
        const length = 30 + Math.random() * 70;
        const alpha = 0.3 + Math.sin(time * 0.2 + i) * 0.2;
        
        ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
        );
        ctx.stroke();
    }
}

function drawEnergyParticles(ctx, width, height, time, overall) {
    const numParticles = 20 + Math.floor(overall * 50);
    
    for (let i = 0; i < numParticles; i++) {
        const x = (Math.sin(time * 0.01 + i * 0.1) + 1) * width * 0.5;
        const y = (Math.cos(time * 0.015 + i * 0.15) + 1) * height * 0.5;
        const size = 1 + Math.sin(time * 0.1 + i) * 2;
        const alpha = 0.4 + Math.sin(time * 0.2 + i * 0.5) * 0.3;
        
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
        ctx.shadowBlur = size * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function getEnergyRingColor(random) {
    const colors = [
        'rgba(255, 255, 0', // Yellow
        'rgba(255, 100, 0', // Orange
        'rgba(255, 0, 0',   // Red
        'rgba(255, 200, 0'  // Gold
    ];
    
    return colors[Math.floor(random * colors.length)];
}
