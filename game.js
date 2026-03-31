
const totalSquares = 121; // 11x11 grid

const players = [
    { id: 1, element: 'player1-token', square: 1, lastX: null, lastY: null, color: '#8B0000', name: 'Player 1 (Gold)' },
    { id: 2, element: 'player2-token', square: 1, lastX: null, lastY: null, color: '#00008B', name: 'Player 2 (Silver)' }
];

let currentPlayerTurn = 0;
let fadeDelay = null;
let fadeInterval = null;

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardImg = new Image();
boardImg.src = "Sample_board1.jpeg"; 

boardImg.onload = () => {
    ctx.drawImage(boardImg, 0, 0, 500, 500);
    initializePlayers(); 
};

const portals = {
    16: 28, 19: 39, 30: 50, 41: 61, 52: 72, 63: 83, 74: 94, 65: 105, 79: 117,
    111: [110, 89], 113: [108, 90], 119: [103, 95],
    106: [92, 86, 68, 67, 66, 45, 44, 23, 22, 1],
    97: [81, 73], 75: [57, 54, 35, 32, 13, 10],
    59: [53, 36, 31, 14, 8], 47: [42, 25], 43: [24, 21],
    26: [19, 3], 17: 6
};

async function rollDie() {
    const rollBtn = document.getElementById('roll-btn');
    rollBtn.disabled = true;

    let p = players[currentPlayerTurn];

    const roll = Math.floor(Math.random() * 6) + 1;
    document.getElementById('game-message').innerText = `${p.name} rolled a ${roll}!`;

    p.square += roll;
    if (p.square >= totalSquares) p.square = totalSquares;

    moveToken(p);
    
    await new Promise(resolve => setTimeout(resolve, 600));

    // Handle Snakes & Ladders
    if (portals[p.square]) {
        const target = portals[p.square];
        if (Array.isArray(target)) {
            document.getElementById('game-message').innerText = "A snake pulls you through the cycles...";
            for (let step of target) {
                p.square = step;
                moveToken(p);
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        } else {
            document.getElementById('game-message').innerText = target > p.square ? "A Virtue elevates you!" : "A Vice pulls you back!";
            p.square = target;
            moveToken(p);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }

    document.getElementById('current-square').innerText = `Square: ${p.square}`;

    // Check for Win or Pass Turn
    if (p.square === totalSquares) {
        document.getElementById('game-message').innerText = `${p.name} has Attained Moksha!`;
        document.getElementById('turn-indicator').innerText = "Game Over";
    } else {
        currentPlayerTurn = (currentPlayerTurn + 1) % players.length;
        updateTurnUI();
        rollBtn.disabled = false;
    }
}

function moveToken(playerObj) {
    const token = document.getElementById(playerObj.element);
    const tileSize = canvas.width / 11;

    let row = Math.floor((playerObj.square - 1) / 11);
    let col = (playerObj.square - 1) % 11;
    if (row % 2 !== 0) col = 10 - col;

    const offset = playerObj.id === 1 ? -8 : 8; 
    const currentX = (col * tileSize) + (tileSize / 2) + offset;
    const currentY = canvas.height - ((row * tileSize) + (tileSize / 2));

    
    if (playerObj.lastX !== null && playerObj.lastY !== null) {
        drawPath(playerObj.lastX, playerObj.lastY, currentX, currentY, playerObj.color);
    }

    // Move Visual Token 
    token.style.left = currentX + "px";
    token.style.top = currentY + "px";

   
    playerObj.lastX = currentX;
    playerObj.lastY = currentY;

    triggerFade();
}

function initializePlayers() {
    players.forEach(p => {
        const tileSize = canvas.width / 11;
        let row = 0; let col = 0; // Square 1 logic
        const offset = p.id === 1 ? -8 : 8; 
        
        p.lastX = (col * tileSize) + (tileSize / 2) + offset;
        p.lastY = canvas.height - ((row * tileSize) + (tileSize / 2));
        
        const token = document.getElementById(p.element);
        token.style.left = p.lastX + "px";
        token.style.top = p.lastY + "px";
    });
}

function drawPath(startX, startY, endX, endY, color) {
    ctx.strokeStyle = color; // Uses Red for P1, Blue for P2
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

function triggerFade() {
    if (fadeDelay) clearTimeout(fadeDelay);
    if (fadeInterval) clearInterval(fadeInterval);
    ctx.globalAlpha = 1.0; 

    fadeDelay = setTimeout(() => {
        let fadeFrames = 10; 
        fadeInterval = setInterval(() => {
            ctx.globalAlpha = 0.15;
            ctx.drawImage(boardImg, 0, 0, 500, 500);
            fadeFrames--;
            if (fadeFrames <= 0) {
                clearInterval(fadeInterval);
                ctx.globalAlpha = 1.0; 
                ctx.drawImage(boardImg, 0, 0, 500, 500); 
            }
        }, 50); 
    }, 1500); 
}

function updateTurnUI() {
    const indicator = document.getElementById('turn-indicator');
    const p = players[currentPlayerTurn];
    indicator.innerText = `${p.name}'s Turn`;
    indicator.style.color = p.color; 
    
    
    document.getElementById('current-square').innerText = `Square: ${p.square}`;
}

// Audio 
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');

function toggleMusic() {
    if (music.paused) {
        music.play();
        music.volume = 0.3;
        musicBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Mute Ambient';
    } else {
        music.pause();
        musicBtn.innerHTML = '<i class="fa-solid fa-music"></i> Play Sacred Ambient';
    }
}