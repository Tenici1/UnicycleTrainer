// ===== File: js/hazards.js =====

import { CFG } from './config.js';
import { U } from './utils.js';

export class FloorHazard {
    constructor(pattern, x, y, activationTime = 2000) {
        this.pattern = pattern; // Array of {x, y} offsets from center
        this.centerX = x;
        this.centerY = y;
        this.activationTime = activationTime;
        this.timeAlive = 0;
        this.state = 'warning'; // 'warning' -> 'active' -> 'fading'
        this.fadeDuration = 500;
        this.warningIntensity = 0;
        this.activeIntensity = 1;
        this.id = Math.random(); // Unique identifier
    }

    update(dt) {
        this.timeAlive += dt * 1000;

        if (this.state === 'warning') {
            // Pulsing warning effect
            this.warningIntensity = 0.3 + 0.4 * Math.sin(this.timeAlive * 0.008);

            if (this.timeAlive >= this.activationTime) {
                this.state = 'active';
                this.timeAlive = 0; // Reset for fade timing
            }
        } else if (this.state === 'active') {
            // Brief bright flash, then fade
            if (this.timeAlive < 100) {
                this.activeIntensity = 1.5;
            } else if (this.timeAlive < this.fadeDuration) {
                this.activeIntensity = U.lerp(1, 0, this.timeAlive / this.fadeDuration);
            } else {
                return false; // Mark for removal
            }
        }

        return true; // Continue existing
    }

    getTiles() {
        return this.pattern.map(offset => ({
            x: Math.floor(this.centerX + offset.x),
            y: Math.floor(this.centerY + offset.y)
        }));
    }

    isActive() {
        return this.state === 'active' && this.timeAlive >= 100; // After the flash
    }

    getIntensity() {
        return this.state === 'warning' ? this.warningIntensity : this.activeIntensity;
    }

    getColor() {
        if (this.state === 'warning') {
            return `rgba(255, 213, 79, ${this.warningIntensity})`; // Amber warning
        } else {
            return `rgba(239, 83, 80, ${this.activeIntensity})`; // Red danger
        }
    }
}

export class HazardSystem {
    constructor(scene) {
        this.scene = scene;
        this.hazards = [];
        this.spawnTimer = 0;
        this.baseSpawnInterval = 3000; // Start with 3 seconds between spawns
        this.minSpawnInterval = 800;   // Minimum spawn interval
        this.difficultyRamp = 0.98;    // Multiply spawn interval by this each spawn
        this.gameTime = 0;

        // Pattern definitions - much larger, map-spanning patterns
        this.patterns = {
            // Giant cross spanning most of the map
            megaCross: this.generateMegaCross(),

            // Horizontal and vertical strips
            horizontalStrip: this.generateHorizontalStrip(),
            verticalStrip: this.generateVerticalStrip(),

            // Large diagonal lines
            diagonalSlash: this.generateDiagonalSlash(),
            diagonalBackslash: this.generateDiagonalBackslash(),

            // Large corner patterns
            cornerQuadrant: this.generateCornerQuadrant(),

            // Checkerboard patterns
            checkerboard: this.generateCheckerboard(),

            // Ring patterns
            outerRing: this.generateOuterRing(),
            innerRing: this.generateInnerRing(),

            // X pattern
            giantX: this.generateGiantX(),

            // Plus pattern
            giantPlus: this.generateGiantPlus(),

            // Border patterns
            topBorder: this.generateTopBorder(),
            bottomBorder: this.generateBottomBorder(),
            leftBorder: this.generateLeftBorder(),
            rightBorder: this.generateRightBorder(),

            // Spiral pattern
            spiral: this.generateSpiral()
        }
    };

    generateMegaCross() {
        const pattern = [];
        const size = 15; // Half-width of the cross
        // Horizontal line
        for (let x = -size; x <= size; x++) {
            pattern.push({ x, y: 0 });
        }
        // Vertical line
        for (let y = -size; y <= size; y++) {
            if (y !== 0) pattern.push({ x: 0, y }); // Avoid duplicate center
        }
        return pattern;
    }

    generateHorizontalStrip() {
        const pattern = [];
        const width = 15;
        const height = 3;
        for (let x = -width; x <= width; x++) {
            for (let y = -height; y <= height; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateVerticalStrip() {
        const pattern = [];
        const width = 3;
        const height = 15;
        for (let x = -width; x <= width; x++) {
            for (let y = -height; y <= height; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateDiagonalSlash() {
        const pattern = [];
        const size = 15;
        for (let i = -size; i <= size; i++) {
            pattern.push({ x: i, y: i });
            // Make it thicker
            if (i < size) {
                pattern.push({ x: i + 1, y: i });
                pattern.push({ x: i, y: i + 1 });
            }
        }
        return pattern;
    }

    generateDiagonalBackslash() {
        const pattern = [];
        const size = 15;
        for (let i = -size; i <= size; i++) {
            pattern.push({ x: i, y: -i });
            // Make it thicker
            if (i < size) {
                pattern.push({ x: i + 1, y: -i });
                pattern.push({ x: i, y: -i - 1 });
            }
        }
        return pattern;
    }

    generateCornerQuadrant() {
        const pattern = [];
        const size = 10;
        for (let x = 0; x <= size; x++) {
            for (let y = 0; y <= size; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateCheckerboard() {
        const pattern = [];
        const size = 8;
        for (let x = -size; x <= size; x += 2) {
            for (let y = -size; y <= size; y += 2) {
                // Create 2x2 squares in checkerboard pattern
                if ((x + y) % 4 === 0) {
                    pattern.push({ x, y });
                    pattern.push({ x: x + 1, y: y });
                    pattern.push({ x: x, y: y + 1 });
                    pattern.push({ x: x + 1, y: y + 1 });
                }
            }
        }
        return pattern;
    }

    generateOuterRing() {
        const pattern = [];
        const outer = 12;
        const inner = 8;
        for (let x = -outer; x <= outer; x++) {
            for (let y = -outer; y <= outer; y++) {
                const dist = Math.max(Math.abs(x), Math.abs(y));
                if (dist >= inner && dist <= outer) {
                    pattern.push({ x, y });
                }
            }
        }
        return pattern;
    }

    generateInnerRing() {
        const pattern = [];
        const outer = 8;
        const inner = 4;
        for (let x = -outer; x <= outer; x++) {
            for (let y = -outer; y <= outer; y++) {
                const dist = Math.max(Math.abs(x), Math.abs(y));
                if (dist >= inner && dist <= outer) {
                    pattern.push({ x, y });
                }
            }
        }
        return pattern;
    }

    generateGiantX() {
        const pattern = [];
        const size = 12;
        for (let i = -size; i <= size; i++) {
            // Main diagonals
            pattern.push({ x: i, y: i });
            pattern.push({ x: i, y: -i });
            // Make thicker
            pattern.push({ x: i + 1, y: i });
            pattern.push({ x: i - 1, y: i });
            pattern.push({ x: i + 1, y: -i });
            pattern.push({ x: i - 1, y: -i });
        }
        return pattern;
    }

    generateGiantPlus() {
        const pattern = [];
        const size = 12;
        const thickness = 2;
        // Horizontal line
        for (let x = -size; x <= size; x++) {
            for (let y = -thickness; y <= thickness; y++) {
                pattern.push({ x, y });
            }
        }
        // Vertical line
        for (let y = -size; y <= size; y++) {
            for (let x = -thickness; x <= thickness; x++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateTopBorder() {
        const pattern = [];
        const width = 15;
        const height = 4;
        for (let x = -width; x <= width; x++) {
            for (let y = -height - 8; y <= -4; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateBottomBorder() {
        const pattern = [];
        const width = 15;
        const height = 4;
        for (let x = -width; x <= width; x++) {
            for (let y = 4; y <= height + 8; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateLeftBorder() {
        const pattern = [];
        const width = 4;
        const height = 15;
        for (let x = -width - 8; x <= -4; x++) {
            for (let y = -height; y <= height; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateRightBorder() {
        const pattern = [];
        const width = 4;
        const height = 15;
        for (let x = 4; x <= width + 8; x++) {
            for (let y = -height; y <= height; y++) {
                pattern.push({ x, y });
            }
        }
        return pattern;
    }

    generateSpiral() {
        const pattern = [];
        const center = { x: 0, y: 0 };
        let x = 0, y = 0;
        let dx = 0, dy = -1;
        const maxSteps = 200;

        for (let i = 0; i < maxSteps; i++) {
            pattern.push({ x, y });

            // Change direction in spiral
            if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
                [dx, dy] = [-dy, dx];
            }
            x += dx;
            y += dy;

            // Break if we get too far from center
            if (Math.abs(x) > 12 || Math.abs(y) > 12) break;
        }
        return pattern;
    }


    update(dt) {
        this.gameTime += dt * 1000;
        this.spawnTimer += dt * 1000;

        // Update existing hazards
        this.hazards = this.hazards.filter(hazard => hazard.update(dt));

        // Check for player collision with active hazards
        this.checkPlayerCollision();

        // Spawn new hazards
        if (this.spawnTimer >= this.getCurrentSpawnInterval()) {
            this.spawnHazard();
            this.spawnTimer = 0;
        }
    }

    getCurrentSpawnInterval() {
        // Get progressively faster over time, but cap at minimum
        const currentInterval = this.baseSpawnInterval * Math.pow(this.difficultyRamp, this.hazards.length);
        return Math.max(currentInterval, this.minSpawnInterval);
    }

    spawnHazard() {
        const player = this.scene.player;
        let worldBounds = this.scene.worldBounds;

        let availablePatterns = ['horizontalStrip', 'verticalStrip', 'megaCross', 'giantPlus', 'giantX', 'diagonalSlash', 'diagonalBackslash', 'outerRing', 'innerRing', 'cornerQuadrant'];

        const patternName = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        const pattern = this.patterns[patternName];

        // Spawn location: now spawn at center of map since patterns are large
        // Large patterns work better when centered rather than following player
        worldBounds = this.scene.worldBounds;
        let spawnX = worldBounds.w / 2;
        let spawnY = worldBounds.h / 2;

        // Add some variation for certain patterns
        if (['cornerQuadrant', 'topBorder', 'bottomBorder', 'leftBorder', 'rightBorder'].includes(patternName)) {
            // These patterns can be offset slightly for variety
            spawnX += (Math.random() - 0.5) * 4;
            spawnY += (Math.random() - 0.5) * 4;
        }

        // Create hazard with shorter activation time as difficulty increases
        const baseActivationTime = 2000;
        const minActivationTime = 1200;
        const activationTime = Math.max(
            baseActivationTime - (this.gameTime * 0.02),
            minActivationTime
        );

        const hazard = new FloorHazard(pattern, spawnX, spawnY, activationTime);
        this.hazards.push(hazard);
    }

    checkPlayerCollision() {
        const player = this.scene.player;
        const playerTileX = Math.floor(player.pos.x);
        const playerTileY = Math.floor(player.pos.y);

        for (const hazard of this.hazards) {
            if (hazard.isActive()) {
                const tiles = hazard.getTiles();
                for (const tile of tiles) {
                    if (tile.x === playerTileX && tile.y === playerTileY) {
                        // Player hit an active hazard!
                        player.fall('stepped_on_hazard');
                        return;
                    }
                }
            }
        }
    }

    drawHazards(g, cam, canvas) {
        for (const hazard of this.hazards) {
            const tiles = hazard.getTiles();
            const intensity = hazard.getIntensity();
            const color = hazard.getColor();

            for (const tile of tiles) {
                if (tile.x >= 0 && tile.x < this.scene.worldBounds.w &&
                    tile.y >= 0 && tile.y < this.scene.worldBounds.h) {

                    const center = { x: tile.x + 0.5, y: tile.y + 0.5, z: 0 };
                    const n = cam.projectToScreen({ x: tile.x + 0.5, y: tile.y, z: 0 }, canvas);
                    const e = cam.projectToScreen({ x: tile.x + 1, y: tile.y + 0.5, z: 0 }, canvas);
                    const s = cam.projectToScreen({ x: tile.x + 0.5, y: tile.y + 1, z: 0 }, canvas);
                    const w = cam.projectToScreen({ x: tile.x, y: tile.y + 0.5, z: 0 }, canvas);

                    g.save();

                    // Draw the hazard tile overlay
                    g.beginPath();
                    g.moveTo(n.x, n.y);
                    g.lineTo(e.x, e.y);
                    g.lineTo(s.x, s.y);
                    g.lineTo(w.x, w.y);
                    g.closePath();

                    if (hazard.state === 'warning') {
                        g.fillStyle = color;
                        g.fill();

                        // Add pulsing border
                        g.strokeStyle = `rgba(255, 165, 0, ${intensity * 0.8})`;
                        g.lineWidth = 2;
                        g.stroke();
                    } else {
                        // Active state - bright flash then fade
                        g.fillStyle = color;
                        g.fill();

                        if (intensity > 0.5) {
                            // Add bright outline during flash
                            g.strokeStyle = `rgba(255, 255, 255, ${(intensity - 0.5) * 2})`;
                            g.lineWidth = 3;
                            g.stroke();
                        }
                    }

                    g.restore();
                }
            }
        }
    }

    reset() {
        this.hazards = [];
        this.spawnTimer = 0;
        this.gameTime = 0;
        this.baseSpawnInterval = 3000;
    }

    getStats() {
        return {
            activeHazards: this.hazards.length,
            gameTime: Math.floor(this.gameTime / 1000),
            spawnInterval: Math.floor(this.getCurrentSpawnInterval())
        };
    }
}