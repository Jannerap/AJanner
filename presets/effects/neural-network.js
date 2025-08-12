/**
 * Neural Network Effect
 * Animated neural network with audio-reactive connections and nodes
 */

export function renderNeuralNetwork(canvas, ctx, audioData, time) {
    // Safety checks
    if (!canvas || !ctx) {
        console.warn('Neural Network: Missing canvas or context');
        return;
    }
    
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Audio reactivity with fallbacks
    const bass = (audioData && audioData.bass) || 0;
    const treble = (audioData && audioData.treble) || 0;
    const overall = (audioData && audioData.overall) || 0;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Create neural network
    const network = createNeuralNetwork(width, height, time, overall);
    
    // Update network based on audio
    updateNeuralNetwork(network, audioData, time);
    
    // Draw the network
    drawNeuralNetwork(ctx, network, time);
    
    // Add data flow effects
    drawDataFlow(ctx, network, time, treble);
}

function createNeuralNetwork(width, height, time, overall) {
    const numLayers = 4 + Math.floor(overall * 2);
    const nodesPerLayer = 6 + Math.floor(overall * 4);
    const network = {
        layers: [],
        connections: [],
        dataPackets: []
    };
    
    // Create layers
    for (let layer = 0; layer < numLayers; layer++) {
        const layerNodes = [];
        const layerX = (layer / (numLayers - 1)) * width;
        
        for (let node = 0; node < nodesPerLayer; node++) {
            const nodeY = (node / (nodesPerLayer - 1)) * height;
            const offsetX = Math.sin(time * 0.1 + layer + node) * 20;
            const offsetY = Math.cos(time * 0.15 + layer + node) * 20;
            
            layerNodes.push({
                x: layerX + offsetX,
                y: nodeY + offsetY,
                radius: 3 + Math.sin(time * 0.2 + layer + node) * 2,
                activation: 0,
                layer: layer,
                index: node
            });
        }
        
        network.layers.push(layerNodes);
    }
    
    // Create connections between layers
    for (let layer = 0; layer < network.layers.length - 1; layer++) {
        const currentLayer = network.layers[layer];
        const nextLayer = network.layers[layer + 1];
        
        for (let fromNode = 0; fromNode < currentLayer.length; fromNode++) {
            for (let toNode = 0; toNode < nextLayer.length; toNode++) {
                network.connections.push({
                    from: currentLayer[fromNode],
                    to: nextLayer[toNode],
                    strength: Math.random() * 0.5 + 0.5,
                    pulse: 0
                });
            }
        }
    }
    
    return network;
}

function updateNeuralNetwork(network, audioData, time) {
    const { bass, treble, overall } = audioData;
    
    // Update node activations
    network.layers.forEach((layer, layerIndex) => {
        layer.forEach((node, nodeIndex) => {
            const baseActivation = Math.sin(time * 0.5 + layerIndex + nodeIndex) * 0.5 + 0.5;
            const audioActivation = (bass + treble) * 0.5;
            node.activation = Math.min(1, baseActivation + audioActivation);
        });
    });
    
    // Update connection strengths
    network.connections.forEach((connection, index) => {
        const pulse = Math.sin(time * 0.3 + index) * 0.5 + 0.5;
        connection.pulse = pulse;
        connection.strength = Math.max(0.1, connection.strength + (overall - 0.5) * 0.1);
    });
    
    // Create data packets
    if (Math.random() < 0.1 + overall * 0.2) {
        const startLayer = 0;
        const startNode = Math.floor(Math.random() * network.layers[startLayer].length);
        const endLayer = network.layers.length - 1;
        const endNode = Math.floor(Math.random() * network.layers[endLayer].length);
        
        network.dataPackets.push({
            x: network.layers[startLayer][startNode].x,
            y: network.layers[startLayer][startNode].y,
            targetX: network.layers[endLayer][endNode].x,
            targetY: network.layers[endLayer][endNode].y,
            progress: 0,
            speed: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 3
        });
    }
    
    // Update data packets
    network.dataPackets = network.dataPackets.filter(packet => {
        packet.progress += packet.speed;
        return packet.progress < 1;
    });
}

function drawNeuralNetwork(ctx, network, time) {
    // Draw connections
    network.connections.forEach(connection => {
        const alpha = connection.strength * (0.3 + connection.pulse * 0.4);
        const width = connection.strength * 2;
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
        ctx.shadowBlur = width * 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
    
    // Draw nodes
    network.layers.forEach(layer => {
        layer.forEach(node => {
            const alpha = 0.5 + node.activation * 0.5;
            const radius = node.radius * (1 + node.activation);
            
            // Node glow
            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
            ctx.shadowBlur = radius * 2;
            
            // Node fill
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Node border
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        });
    });
}

function drawDataFlow(ctx, network, time, treble) {
    network.dataPackets.forEach(packet => {
        const x = packet.x + (packet.targetX - packet.x) * packet.progress;
        const y = packet.y + (packet.targetY - packet.y) * packet.progress;
        const alpha = (1 - packet.progress) * (0.5 + treble * 0.5);
        const size = packet.size * (1 + Math.sin(time * 0.5) * 0.3);
        
        // Data packet glow
        ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
        ctx.shadowBlur = size * 3;
        
        // Data packet
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    });
}
