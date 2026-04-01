// 1. GLOBAL VARIABLES
const totalSquares = 121;
let players = [];
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
    setupGame(); // Initialize the dynamic players once the image loads
};

// 2. PORTALS (Ladders and Snakes)
const portals = {
    16: 28, 19: 39, 30: 50, 41: 61, 52: 72, 63: 83, 74: 94, 65: 105, 79: 117,
    111: [110, 89], 113: [108, 90], 119: [103, 95],
    106: [92, 86, 68, 67, 66, 45, 44, 23, 22, 1],
    97: [81, 73], 75: [57, 54, 35, 32, 13, 10],
    59: [53, 36, 31, 14, 8], 47: [42, 25], 43: [24, 21],
    26: [19, 3], 17: 6
};

// 3. DYNAMIC SETUP FUNCTION
function setupGame() {
    // Ensure this element exists in your updated play.html
    const selectElement = document.getElementById('player-count');
    const numPlayers = selectElement ? parseInt(selectElement.value) : 2; 
    
    const tokenContainer = document.getElementById('token-container');
    const loggedInUser = localStorage.getItem('gameUser') || "Player 1";
    
    // Clear existing tokens and arrays
    if (tokenContainer) {
        tokenContainer.innerHTML = '';
    }
    players = [];
    currentPlayerTurn = 0;
    
    // Configurations for up to 4 players
    const configs = [
        { class: 'player1', name: loggedInUser, color: '#8B0000', offsetX: -8, offsetY: -8 }, // Top-Left
        { class: 'player2', name: 'Player 2', color: '#00008B', offsetX: 8, offsetY: -8 },   // Top-Right
        { class: 'player3', name: 'Player 3', color: '#B8860B', offsetX: -8, offsetY: 8 },   // Bottom-Left
        { class: 'player4', name: 'Player 4', color: '#006400', offsetX: 8, offsetY: 8 }     // Bottom-Right
    ];

    // Generate tokens dynamically
    for (let i = 0; i < numPlayers; i++) {
        const c = configs[i];
        
        // 1. Create HTML Div
        if (tokenContainer) {
            const tokenDiv = document.createElement('div');
            tokenDiv.id = `player-token-${i}`;
            tokenDiv.className = `token ${c.class}`;
            tokenContainer.appendChild(tokenDiv);
        }

        // 2. Push to State Array
        players.push({
            id: i,
            element: `player-token-${i}`,
            square: 1,
            lastX: null,
            lastY: null,
            color: c.color,
            name: c.name,
            offsetX: c.offsetX,
            offsetY: c.offsetY
        });
    }

    // Clear canvas lines and place tokens on Square 1
    ctx.drawImage(boardImg, 0, 0, 500, 500);
    initializePositions();
    updateTurnUI();
    
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) rollBtn.disabled = false;
    
    const messageDisplay = document.getElementById('game-message');
    if (messageDisplay) messageDisplay.innerText = "Game started. Roll the die.";
}

function initializePositions() {
    const tileSize = canvas.width / 11;
    players.forEach(p => {
        // Square 1 is row 0, col 0
        p.lastX = (tileSize / 2) + p.offsetX;
        p.lastY = canvas.height - (tileSize / 2) + p.offsetY;
        
        const token = document.getElementById(p.element);
        if (token) {
            token.style.left = p.lastX + "px";
            token.style.top = p.lastY + "px";
        }
    });
}

// 4. CORE GAME FUNCTIONS
async function rollDie() {
    const rollBtn = document.getElementById('roll-btn');
    if (rollBtn) rollBtn.disabled = true;

    let p = players[currentPlayerTurn];
    const roll = Math.floor(Math.random() * 6) + 1;
    document.getElementById('game-message').innerText = `${p.name} rolled a ${roll}!`;

    p.square += roll;
    if (p.square >= totalSquares) p.square = totalSquares;

    moveToken(p);
    await new Promise(resolve => setTimeout(resolve, 600));

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

    if (p.square === totalSquares) {
        document.getElementById('game-message').innerText = `${p.name} has Attained Moksha!`;
        document.getElementById('turn-indicator').innerText = "Game Over";
        return; // Stop the game loop
    } 

    // Next Player
    currentPlayerTurn = (currentPlayerTurn + 1) % players.length;
    updateTurnUI();
    if (rollBtn) rollBtn.disabled = false;
}

// 5. MOVEMENT & DRAWING
function moveToken(playerObj) {
    const token = document.getElementById(playerObj.element);
    const tileSize = canvas.width / 11;

    let row = Math.floor((playerObj.square - 1) / 11);
    let col = (playerObj.square - 1) % 11;
    if (row % 2 !== 0) col = 10 - col;

    const currentX = (col * tileSize) + (tileSize / 2) + playerObj.offsetX;
    const currentY = canvas.height - ((row * tileSize) + (tileSize / 2)) + playerObj.offsetY;

    if (playerObj.lastX !== null && playerObj.lastY !== null) {
        drawPath(playerObj.lastX, playerObj.lastY, currentX, currentY, playerObj.color);
    }

    if (token) {
        token.style.left = currentX + "px";
        token.style.top = currentY + "px";
    }

    playerObj.lastX = currentX;
    playerObj.lastY = currentY;

    triggerFade();
}

function drawPath(startX, startY, endX, endY, color) {
    ctx.strokeStyle = color; 
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
    const currentSquareLabel = document.getElementById('current-square');
    const p = players[currentPlayerTurn];
    
    if (indicator) {
        indicator.innerText = `${p.name}'s Turn`;
        indicator.style.color = p.color; 
    }
    if (currentSquareLabel) {
        currentSquareLabel.innerText = `Square: ${p.square}`;
    }
}

// 6. AUDIO CONTROLS
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