/**
 * Holographic Display Effect
 * Futuristic 3D holographic projections with audio reactivity
 */

export function renderHolographicDisplay(canvas, ctx, audioData, time) {
    // Safety checks
    if (!canvas || !ctx) {
        console.warn('Holographic Display: Missing canvas or context');
        return;
    }
    
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Audio reactivity with fallbacks
    const bass = (audioData && audioData.bass) || 0;
    const treble = (audioData && audioData.treble) || 0;
    const overall = (audioData && audioData.overall) || 0;
    
    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Create holographic elements
    const holograms = createHolographicElements(width, height, time, overall);
    
    // Update holograms based on audio
    updateHolograms(holograms, audioData, time);
    
    // Draw holographic grid
    drawHolographicGrid(ctx, width, height, time, treble);
    
    // Draw holographic elements
    drawHolographicElements(ctx, holograms, time);
    
    // Add scan lines and glitch effects
    drawScanLines(ctx, width, height, time, bass);
    drawGlitchEffects(ctx, width, height, time, overall);
}

function createHolographicElements(width, height, time, overall) {
    const elements = [];
    const numElements = 3 + Math.floor(overall * 3);
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = 0; i < numElements; i++) {
        const element = {
            x: centerX + Math.sin(time * 0.1 + i) * 100,
            y: centerY + Math.cos(time * 0.15 + i) * 80,
            size: 30 + Math.sin(time * 0.2 + i) * 20,
            rotation: time * 0.05 + i * Math.PI * 0.3,
            type: i % 3, // 0: cube, 1: sphere, 2: pyramid
            pulse: 0,
            glitch: 0,
            color: getHolographicColor(i, time)
        };
        elements.push(element);
    }
    
    return elements;
}

function updateHolograms(holograms, audioData, time) {
    const { bass, treble, overall } = audioData;
    
    holograms.forEach((element, index) => {
        // Update pulse based on audio
        element.pulse = Math.sin(time * 0.3 + index) * 0.5 + 0.5;
        element.size *= (1 + (bass + treble) * 0.1);
        
        // Add glitch effect based on overall audio
        if (Math.random() < overall * 0.1) {
            element.glitch = Math.random() * 0.3;
        } else {
            element.glitch *= 0.9;
        }
        
        // Reset size to prevent infinite growth
        element.size = Math.max(20, Math.min(80, element.size));
    });
}

function drawHolographicGrid(ctx, width, height, time, treble) {
    const gridSize = 40 + Math.floor(treble * 20);
    const alpha = 0.1 + treble * 0.2;
    
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Animated grid overlay
    const offset = (time * 0.5) % gridSize;
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
    
    for (let x = -offset; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + gridSize * 0.3, height);
        ctx.stroke();
    }
}

function drawHolographicElements(ctx, holograms, time) {
    holograms.forEach(element => {
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);
        
        // Apply glitch effect
        if (element.glitch > 0) {
            ctx.translate(
                (Math.random() - 0.5) * element.glitch * 10,
                (Math.random() - 0.5) * element.glitch * 10
            );
        }
        
        // Draw element based on type
        switch (element.type) {
            case 0:
                drawHolographicCube(ctx, element);
                break;
            case 1:
                drawHolographicSphere(ctx, element);
                break;
            case 2:
                drawHolographicPyramid(ctx, element);
                break;
        }
        
        ctx.restore();
    });
}

function drawHolographicCube(ctx, element) {
    const size = element.size * (1 + element.pulse * 0.3);
    const alpha = 0.4 + element.pulse * 0.3;
    
    // Cube wireframe
    ctx.strokeStyle = element.color.replace(')', `, ${alpha})`);
    ctx.lineWidth = 2;
    
    const halfSize = size / 2;
    
    // Front face
    ctx.beginPath();
    ctx.rect(-halfSize, -halfSize, size, size);
    ctx.stroke();
    
    // Back face (offset)
    ctx.beginPath();
    ctx.rect(-halfSize + 10, -halfSize + 10, size, size);
    ctx.stroke();
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(-halfSize, -halfSize);
    ctx.lineTo(-halfSize + 10, -halfSize + 10);
    ctx.moveTo(halfSize, -halfSize);
    ctx.lineTo(halfSize + 10, -halfSize + 10);
    ctx.moveTo(halfSize, halfSize);
    ctx.lineTo(halfSize + 10, halfSize + 10);
    ctx.moveTo(-halfSize, halfSize);
    ctx.lineTo(-halfSize + 10, halfSize + 10);
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = element.color;
    ctx.shadowBlur = size * 0.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawHolographicSphere(ctx, element) {
    const size = element.size * (1 + element.pulse * 0.3);
    const alpha = 0.4 + element.pulse * 0.3;
    
    // Sphere outline
    ctx.strokeStyle = element.color.replace(')', `, ${alpha})`);
    ctx.lineWidth = 2;
    
    // Main circle
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Latitude lines
    for (let i = 1; i < 3; i++) {
        const y = (i - 1.5) * size / 3;
        const radius = Math.sqrt((size / 2) ** 2 - y ** 2);
        
        ctx.beginPath();
        ctx.arc(0, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(angle) * size / 2,
            Math.sin(angle) * size / 2
        );
        ctx.lineTo(
            -Math.cos(angle) * size / 2,
            -Math.sin(angle) * size / 2
        );
        ctx.stroke();
    }
    
    // Add glow effect
    ctx.shadowColor = element.color;
    ctx.shadowBlur = size * 0.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawHolographicPyramid(ctx, element) {
    const size = element.size * (1 + element.pulse * 0.3);
    const alpha = 0.4 + element.pulse * 0.3;
    
    ctx.strokeStyle = element.color.replace(')', `, ${alpha})`);
    ctx.lineWidth = 2;
    
    const halfSize = size / 2;
    const height = size * 0.8;
    
    // Base
    ctx.beginPath();
    ctx.moveTo(-halfSize, halfSize);
    ctx.lineTo(halfSize, halfSize);
    ctx.lineTo(halfSize, halfSize);
    ctx.lineTo(-halfSize, halfSize);
    ctx.stroke();
    
    // Sides
    ctx.beginPath();
    ctx.moveTo(0, -height);
    ctx.lineTo(-halfSize, halfSize);
    ctx.moveTo(0, -height);
    ctx.lineTo(halfSize, halfSize);
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowColor = element.color;
    ctx.shadowBlur = size * 0.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawScanLines(ctx, width, height, time, bass) {
    const lineHeight = 2;
    const speed = 1 + bass * 2;
    const offset = (time * speed) % (lineHeight * 2);
    
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    
    for (let y = offset; y < height; y += lineHeight * 2) {
        ctx.fillRect(0, y, width, lineHeight);
    }
}

function drawGlitchEffects(ctx, width, height, time, overall) {
    if (Math.random() < overall * 0.05) {
        const glitchHeight = 10 + Math.random() * 50;
        const glitchY = Math.random() * height;
        const glitchWidth = 50 + Math.random() * 100;
        const glitchX = Math.random() * (width - glitchWidth);
        
        // Random glitch rectangle
        ctx.fillStyle = `rgba(255, 0, 255, ${0.3 + Math.random() * 0.4})`;
        ctx.fillRect(glitchX, glitchY, glitchWidth, glitchHeight);
        
        // Glitch text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText('GLITCH', glitchX + 5, glitchY + 15);
    }
}

function getHolographicColor(index, time) {
    const colors = [
        'rgba(0, 255, 255', // Cyan
        'rgba(255, 0, 255', // Magenta
        'rgba(0, 255, 0',   // Green
        'rgba(255, 255, 0', // Yellow
        'rgba(255, 0, 0'    // Red
    ];
    
    const baseColor = colors[index % colors.length];
    const pulse = Math.sin(time * 0.2 + index) * 0.3 + 0.7;
    
    return baseColor;
}
