import { TILE_SIZE, MAP } from './map.js';

export class Ghost {
    constructor(x, y, color, type) {
        this.startX = x;
        this.startY = y;
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.gridX = x;
        this.gridY = y;
        this.color = color;
        this.type = type; // 'chase', 'ambush', 'random'
        this.speed = 2;
        this.dir = 'UP';
        this.frightened = false;
        this.radius = TILE_SIZE / 2 - 2;
    }

    update(player) {
        if (this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0) {
            this.gridX = this.x / TILE_SIZE;
            this.gridY = this.y / TILE_SIZE;

            const nextDir = this.calculateNextDir(player);
            this.dir = nextDir;
        }

        if (this.dir === 'LEFT') this.x -= this.speed;
        if (this.dir === 'RIGHT') this.x += this.speed;
        if (this.dir === 'UP') this.y -= this.speed;
        if (this.dir === 'DOWN') this.y += this.speed;

        this.handleWraparound();
    }

    calculateNextDir(player) {
        const possibleDirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => {
            // Prevent 180 turn unless forced
            if (this.isOpposite(d, this.dir)) return false;
            return this.canMove(d);
        });

        if (possibleDirs.length === 0) return this.oppositeDir(this.dir);

        let targetX = player.gridX;
        let targetY = player.gridY;

        if (this.frightened) {
            // Run to corners or random
            return possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }

        if (this.type === 'ambush') {
            // Target 4 tiles ahead of player
            if (player.dir === 'UP') targetY -= 4;
            if (player.dir === 'DOWN') targetY += 4;
            if (player.dir === 'LEFT') targetX -= 4;
            if (player.dir === 'RIGHT') targetX += 4;
        } else if (this.type === 'random') {
            return possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }

        // Default 'chase' behavior: choose dir that minimizes distance to target
        return possibleDirs.reduce((best, current) => {
            const distBest = this.getDist(this.getNextPos(best), { x: targetX, y: targetY });
            const distCurr = this.getDist(this.getNextPos(current), { x: targetX, y: targetY });
            return distCurr < distBest ? current : best;
        });
    }

    canMove(dir) {
        let nx = this.gridX;
        let ny = this.gridY;
        if (dir === 'LEFT') nx--;
        if (dir === 'RIGHT') nx++;
        if (dir === 'UP') ny--;
        if (dir === 'DOWN') ny++;

        if (nx < 0 || nx >= MAP[0].length) return true;
        if (ny < 0 || ny >= MAP.length) return true;

        const tile = MAP[ny][nx];
        return tile !== 1 && tile !== 4; // 4 is ghost house door or area? I'll treat 4 as accessible for now
    }

    isOpposite(d1, d2) {
        return (d1 === 'LEFT' && d2 === 'RIGHT') ||
               (d1 === 'RIGHT' && d2 === 'LEFT') ||
               (d1 === 'UP' && d2 === 'DOWN') ||
               (d1 === 'DOWN' && d2 === 'UP');
    }

    oppositeDir(d) {
        if (d === 'LEFT') return 'RIGHT';
        if (d === 'RIGHT') return 'LEFT';
        if (d === 'UP') return 'DOWN';
        return 'UP';
    }

    getDist(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    getNextPos(dir) {
        let nx = this.gridX;
        let ny = this.gridY;
        if (dir === 'LEFT') nx--;
        if (dir === 'RIGHT') nx++;
        if (dir === 'UP') ny--;
        if (dir === 'DOWN') ny++;
        return { x: nx, y: ny };
    }

    handleWraparound() {
        const width = MAP[0].length * TILE_SIZE;
        if (this.x < 0) this.x = width - TILE_SIZE;
        if (this.x >= width) this.x = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.frightened ? '#0000ff' : this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;

        const cx = this.x + TILE_SIZE / 2;
        const cy = this.y + TILE_SIZE / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, Math.PI, 0);
        ctx.lineTo(cx + this.radius, cy + this.radius);
        // Bottom wavy line
        for (let i = 0; i < 3; i++) {
            ctx.lineTo(cx + this.radius - (i * 2 + 1) * (this.radius * 2 / 6), cy + this.radius - (i % 2 ? 0 : 5));
        }
        ctx.lineTo(cx - this.radius, cy + this.radius);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + 4, cy - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    reset() {
        this.x = this.startX * TILE_SIZE;
        this.y = this.startY * TILE_SIZE;
        this.gridX = this.startX;
        this.gridY = this.startY;
        this.frightened = false;
        this.dir = 'UP';
    }
}
