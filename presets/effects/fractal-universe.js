/**
 * Fractal Universe Effect
 * Infinite fractal patterns with audio-reactive zoom and colors
 */

export function renderFractalUniverse(canvas, ctx, audioData, time) {
    // Safety checks
    if (!canvas || !ctx) {
        console.warn('Fractal Universe: Missing canvas or context');
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
    gradient.addColorStop(0, 'rgba(0, 0, 20, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 40, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 60, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Fractal parameters
    const zoom = 1 + Math.sin(time * 0.1) * 0.5 + overall * 0.5;
    const rotation = time * 0.05 + bass * Math.PI;
    const complexity = 3 + Math.floor(treble * 5);
    
    // Draw multiple fractal layers
    for (let layer = 0; layer < 3; layer++) {
        const layerZoom = zoom * (1 + layer * 0.3);
        const layerRotation = rotation + layer * Math.PI * 0.3;
        const layerComplexity = complexity + layer;
        
        drawFractalLayer(ctx, width, height, centerX, centerY, layerZoom, layerRotation, layerComplexity, time, layer);
    }
    
    // Add cosmic particles
    drawCosmicParticles(ctx, width, height, time, overall);
}

function drawFractalLayer(ctx, width, height, centerX, centerY, zoom, rotation, complexity, time, layer) {
    const maxIterations = 100;
    const escapeRadius = 4;
    
    // Color palette for this layer
    const colors = getFractalColors(layer, time);
    
    // Fractal calculation
    for (let x = 0; x < width; x += 2) {
        for (let y = 0; y < height; y += 2) {
            // Transform coordinates
            const realX = (x - centerX) / (width * zoom * 0.5);
            const realY = (y - centerY) / (height * zoom * 0.5);
            
            // Apply rotation
            const rotatedX = realX * Math.cos(rotation) - realY * Math.sin(rotation);
            const rotatedY = realX * Math.sin(rotation) + realY * Math.cos(rotation);
            
            // Fractal iteration
            let zx = rotatedX;
            let zy = rotatedY;
            let iteration = 0;
            
            while (zx * zx + zy * zy < escapeRadius && iteration < maxIterations) {
                const temp = zx * zx - zy * zy + rotatedX;
                zy = 2 * zx * zy + rotatedY;
                zx = temp;
                iteration++;
            }
            
            // Color based on iteration count
            if (iteration < maxIterations) {
                const colorIndex = (iteration * complexity) % colors.length;
                const color = colors[colorIndex];
                const alpha = 0.3 + Math.sin(time * 0.2 + iteration * 0.1) * 0.2;
                
                ctx.fillStyle = color.replace(')', `, ${alpha})`);
                ctx.fillRect(x, y, 2, 2);
            }
        }
    }
}

function getFractalColors(layer, time) {
    const baseColors = [
        ['rgba(255, 0, 100', 'rgba(100, 0, 255', 'rgba(0, 100, 255', 'rgba(0, 255, 100'],
        ['rgba(255, 255, 0', 'rgba(255, 0, 255', 'rgba(0, 255, 255', 'rgba(255, 100, 0'],
        ['rgba(100, 255, 0', 'rgba(0, 100, 255', 'rgba(255, 0, 100', 'rgba(0, 255, 100']
    ];
    
    const colors = baseColors[layer % baseColors.length];
    const timeShift = Math.floor(time * 0.1) % colors.length;
    
    // Rotate colors based on time
    const rotatedColors = [];
    for (let i = 0; i < colors.length; i++) {
        const index = (i + timeShift) % colors.length;
        rotatedColors.push(colors[index]);
    }
    
    return rotatedColors;
}

function drawCosmicParticles(ctx, width, height, time, overall) {
    const numParticles = 50 + Math.floor(overall * 100);
    
    for (let i = 0; i < numParticles; i++) {
        const x = (Math.sin(time * 0.01 + i * 0.1) + 1) * width * 0.5;
        const y = (Math.cos(time * 0.015 + i * 0.15) + 1) * height * 0.5;
        const size = Math.max(0.5, 1 + Math.sin(time * 0.1 + i) * 2); // Ensure positive size
        const alpha = Math.max(0.1, Math.min(1, 0.3 + Math.sin(time * 0.2 + i * 0.5) * 0.3)); // Clamp alpha
        const color = getParticleColor(i, time);
        
        // Particle glow
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(0, size * 2);
        
        // Particle
        ctx.fillStyle = color.replace(')', `, ${alpha})`);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}

function getParticleColor(index, time) {
    const colors = [
        'rgba(255, 255, 255',
        'rgba(255, 200, 100',
        'rgba(100, 200, 255',
        'rgba(255, 100, 200',
        'rgba(200, 255, 100'
    ];
    
    const baseColor = colors[index % colors.length];
    const hueShift = Math.sin(time * 0.1 + index) * 0.3;
    
    return baseColor;
}
