import { TILE_SIZE, MAP } from './map.js';

export class Player {
    constructor(x, y) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.gridX = x;
        this.gridY = y;
        this.nextDir = null;
        this.dir = null;
        this.speed = 2;
        this.radius = TILE_SIZE / 2 - 2;
        this.mouthOpen = 0;
        this.mouthSpeed = 0.1;
        this.score = 0;
        this.combo = 0;
        this.lastComboTime = 0;
        this.lives = 3;
    }

    update() {
        // Try to change direction only at grid centers
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            this.gridX = this.x / TILE_SIZE;
            this.gridY = this.y / TILE_SIZE;

            if (this.nextDir) {
                if (this.canMove(this.nextDir)) {
                    this.dir = this.nextDir;
                    this.nextDir = null;
                }
            }

            if (this.dir && !this.canMove(this.dir)) {
                this.dir = null;
            }

            this.collectItem();
        }

        if (this.dir) {
            if (this.dir === 'LEFT') this.x -= this.speed;
            if (this.dir === 'RIGHT') this.x += this.speed;
            if (this.dir === 'UP') this.y -= this.speed;
            if (this.dir === 'DOWN') this.y += this.speed;
        }

        this.handleWraparound();
        
        // Animation
        this.mouthOpen += this.mouthSpeed;
        if (this.mouthOpen > 0.2 || this.mouthOpen < 0) this.mouthSpeed *= -1;
    }

    canMove(dir) {
        let nx = this.gridX;
        let ny = this.gridY;
        if (dir === 'LEFT') nx--;
        if (dir === 'RIGHT') nx++;
        if (dir === 'UP') ny--;
        if (dir === 'DOWN') ny++;

        // Out of bounds check (for tunnels)
        if (nx < 0 || nx >= MAP[0].length) return true;
        if (ny < 0 || ny >= MAP.length) return true;

        return MAP[ny][nx] !== 1;
    }

    handleWraparound() {
        const width = MAP[0].length * TILE_SIZE;
        if (this.x < 0) this.x = width - TILE_SIZE;
        if (this.x >= width) this.x = 0;
    }

    collectItem() {
        const tile = MAP[this.gridY][this.gridX];
        if (tile === 0 || tile === 2) {
            MAP[this.gridY][this.gridX] = 5; // Replace with empty
            
            const now = Date.now();
            if (now - this.lastComboTime < 500) {
                this.combo++;
            } else {
                this.combo = 1;
            }
            this.lastComboTime = now;

            const basePoints = (tile === 0) ? 10 : 50;
            this.score += basePoints * Math.min(this.combo, 10);

            if (tile === 2) {
                window.dispatchEvent(new CustomEvent('powerup'));
            }
            
            window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: { score: this.score, combo: this.combo } }));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00'; // Classic Pac yellow but could be neon
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        
        ctx.beginPath();
        let rotation = 0;
        if (this.dir === 'LEFT') rotation = Math.PI;
        if (this.dir === 'DOWN') rotation = Math.PI * 0.5;
        if (this.dir === 'UP') rotation = Math.PI * 1.5;

        ctx.arc(
            this.x + TILE_SIZE / 2,
            this.y + TILE_SIZE / 2,
            this.radius,
            rotation + Math.PI * this.mouthOpen,
            rotation + Math.PI * (2 - this.mouthOpen)
        );
        ctx.lineTo(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    reset(x, y) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.gridX = x;
        this.gridY = y;
        this.dir = null;
        this.nextDir = null;
    }
}
