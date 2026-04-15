import { TILE_SIZE, MAP, COLORS } from './map.js';
import { Player } from './player.js';
import { Ghost } from './ghosts.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const comboEl = document.getElementById('combo');
const levelEl = document.getElementById('level');

let player;
let ghosts = [];
let animationId;
let isPaused = false;
let level = 1;
let powerUpTimer = 0;
let powerUpDuration = 8000; // ms
let gameStarted = false;

function init() {
    canvas.width = MAP[0].length * TILE_SIZE;
    canvas.height = MAP.length * TILE_SIZE;

    // Find spawns
    let pSpawn, gSpawns = [];
    for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[y].length; x++) {
            if (MAP[y][x] === 3) pSpawn = { x, y };
            if (MAP[y][x] === 4) gSpawns.push({ x, y });
        }
    }

    player = new Player(pSpawn.x, pSpawn.y);
    
    const ghostConfigs = [
        { color: '#ff0000', type: 'chase' },
        { color: '#ffb8ff', type: 'ambush' },
        { color: '#00ffff', type: 'random' },
        { color: '#ffb852', type: 'random' }
    ];

    ghosts = gSpawns.map((spawn, i) => {
        const config = ghostConfigs[i % ghostConfigs.length];
        return new Ghost(spawn.x, spawn.y, config.color, config.type);
    });

    setupControls();
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (!gameStarted) gameStarted = true;
        if (e.key === 'ArrowLeft') player.nextDir = 'LEFT';
        if (e.key === 'ArrowRight') player.nextDir = 'RIGHT';
        if (e.key === 'ArrowUp') player.nextDir = 'UP';
        if (e.key === 'ArrowDown') player.nextDir = 'DOWN';
    });
    
    // Support for touch/click to start
    canvas.addEventListener('mousedown', () => {
        if (!gameStarted) gameStarted = true;
    });

    window.addEventListener('powerup', () => {
        powerUpTimer = powerUpDuration;
        ghosts.forEach(g => g.frightened = true);
    });

    window.addEventListener('scoreUpdate', (e) => {
        scoreEl.textContent = e.detail.score;
        comboEl.textContent = `x${e.detail.combo}`;
        comboEl.classList.add('pulse');
        setTimeout(() => comboEl.classList.remove('pulse'), 200);
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        const dx = player.x - ghost.x;
        const dy = player.y - ghost.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < TILE_SIZE * 0.8) {
            if (ghost.frightened) {
                ghost.die();
                player.score += 200;
                window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: { score: player.score, combo: player.combo } }));
            } else {
                handleDeath();
            }
        }
    });
}

function handleDeath() {
    player.lives--;
    livesEl.textContent = player.lives;
    if (player.lives <= 0) {
        alert('GAME OVER! Score: ' + player.score);
        location.reload();
    } else {
        resetPositions();
    }
}

function resetPositions() {
    // Find spawns again or use stored
    let pSpawn;
    for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[y].length; x++) {
            if (MAP[y][x] === 3) pSpawn = { x, y };
        }
    }
    player.reset(pSpawn.x, pSpawn.y);
    ghosts.forEach(g => g.reset());
    gameStarted = false;
}

function checkWin() {
    let dots = 0;
    for (let row of MAP) {
        for (let cell of row) {
            if (cell === 0 || cell === 2) dots++;
        }
    }
    if (dots === 0) {
        nextLevel();
    }
}

function nextLevel() {
    level++;
    levelEl.textContent = level;
    // Reload map
    location.reload(); // Simple way for now, or reset MAP matrix
}

function update(deltaTime) {
    if (isPaused || !gameStarted) return;

    player.update();
    ghosts.forEach(g => g.update(player));

    if (powerUpTimer > 0) {
        powerUpTimer -= deltaTime;
        if (powerUpTimer <= 0) {
            ghosts.forEach(g => g.frightened = false);
        }
    }

    checkCollisions();
    checkWin();
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[y].length; x++) {
            const tile = MAP[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile === 1) {
                ctx.fillStyle = COLORS.wall;
                ctx.shadowBlur = 5;
                ctx.shadowColor = COLORS.wall;
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.shadowBlur = 0;
            } else if (tile === 0) {
                ctx.fillStyle = COLORS.dot;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 2) {
                ctx.fillStyle = COLORS.power;
                ctx.shadowBlur = 10;
                ctx.shadowColor = COLORS.power;
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    player.draw(ctx);
    ghosts.forEach(g => g.draw(ctx, powerUpTimer));

    if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillText('PRESS ANY KEY TO START', canvas.width / 2, canvas.height / 2 - 80);
        
        ctx.font = '14px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f2ff';
        const mechanics = [
            '1. Grid-Based Movement',
            '2. AI-Driven Enemies',
            '3. Wraparound Tunnels',
            '4. Power-Up Mechanics',
            '5. Combo Multipliers',
            '6. Lives & Respawn',
            '7. Difficulty Progression'
        ];
        mechanics.forEach((m, i) => {
            ctx.fillText(m, canvas.width / 2, canvas.height / 2 - 30 + (i * 25));
        });
        ctx.shadowBlur = 0;
    }
}

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

init();
requestAnimationFrame(gameLoop);
