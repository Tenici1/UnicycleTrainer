import { Player } from './player.js';
import { CFG } from './config.js';
import { HazardSystem } from './hazards.js';
import { FallingObjectSystem } from './falling-system.js';
import { playRandomSfx } from './audio.js';
import { NPC } from './npc.js';

// Scene management with hazard system
export class Scene {
    constructor(w, h) {
        this.worldBounds = { w, h };
        this.entities = [];
        this.player = new Player(w / 2, h / 2);
        this.entities.push(this.player);
        this.debug = { grid: true, hitboxes: true };
        this.score = 0;

        this.npcs = [];
        this.npcSpawnTimer = 0;
        this.npcSpawnInterval = 4000; // Spawn every 4 seconds

        this.hazardSystem = new HazardSystem(this);
        this.fallingSystem = new FallingObjectSystem(this);
    }


    addScore(points) {
        this.score += points;

        if (this.score === 30) {
            playRandomSfx(['assets/triple.mp3'], 0.9, 1.1, 2.0);
        }

        // You can also dispatch an event to update UI if needed
        window.dispatchEvent(new CustomEvent('score:update', { detail: this.score }));
    }

    update(dt) {
        for (const e of this.entities) e.update(dt, this);
        this.hazardSystem.update(dt);

        // Update falling objects system
        this.fallingSystem.update(dt);

        this.entities.sort((a, b) => {
            // Sort by Y position first
            if (a.pos.y !== b.pos.y) return a.pos.y - b.pos.y;
            // Then by Z position (higher Z = further back)
            return b.pos.z - a.pos.z;
        });

        // Update NPCs
        this.npcs = this.npcs.filter(npc => npc.update(dt, this));
        this.checkNPCCollisions();

        // Spawn new NPCs
        this.npcSpawnTimer += dt * 1000;
        if (this.npcSpawnTimer >= this.npcSpawnInterval) {
            this.spawnNPC();
            this.npcSpawnTimer = 0;
        }
    }

    reset() {
        this.player.reset(this.worldBounds.w / 2, this.worldBounds.h / 2);
        this.hazardSystem.reset();
        this.fallingSystem.reset();
        this.score = 0; // Reset score
        this.npcs = [];
        this.npcSpawnTimer = 0;
    }

    draw(g, cam, canvas) {
        // Floor grid
        if (!this.debug.grid) this.drawGrid(g, cam, canvas);

        // Draw hazards on top of grid
        this.hazardSystem.drawHazards(g, cam, canvas);

        // Draw the far walls (behind the player)
        this.drawWallSegments(g, cam, canvas, 'far');

        // Entities (depth-sort by y then x, simple heuristic)
        this.entities.sort((a, b) => (a.pos.y - b.pos.y) || (a.pos.x - b.pos.x));
        for (const e of this.entities) e.draw(g, cam, canvas);

        // Draw the near walls (in front of the player)
        this.drawWallSegments(g, cam, canvas, 'near');

        if (!this.debug.hitboxes) this.drawHitboxes(g, cam, canvas);
    }

    spawnNPC() {
        const bounds = this.worldBounds;
        const player = this.player;

        // Choose random edge (0=top, 1=right, 2=bottom, 3=left)
        const edge = Math.floor(Math.random() * 4);
        let startX, startY, targetX, targetY;

        switch (edge) {
            case 0: // Top edge
                startX = Math.random() * bounds.w;
                startY = -1;
                targetX = Math.random() * bounds.w;
                targetY = bounds.h + 1;
                break;
            case 1: // Right edge
                startX = bounds.w + 1;
                startY = Math.random() * bounds.h;
                targetX = -1;
                targetY = Math.random() * bounds.h;
                break;
            case 2: // Bottom edge
                startX = Math.random() * bounds.w;
                startY = bounds.h + 1;
                targetX = Math.random() * bounds.w;
                targetY = -1;
                break;
            case 3: // Left edge
                startX = -1;
                startY = Math.random() * bounds.h;
                targetX = bounds.w + 1;
                targetY = Math.random() * bounds.h;
                break;
        }

        // Create NPC aimed towards player (with some randomness)
        const npc = new NPC(
            startX,
            startY,
            player.pos.x + (Math.random() - 0.5) * 5,
            player.pos.y + (Math.random() - 0.5) * 5
        );

        this.npcs.push(npc);
        this.entities.push(npc);
    }

    checkNPCCollisions() {
        if (this.player.fallen) return;

        for (const npc of this.npcs) {
            const dx = npc.pos.x - this.player.pos.x;
            const dy = npc.pos.y - this.player.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.8) {
                this.player.fall('hit_by_npc');
                playRandomSfx(['assets/crash.wav'], 0.9, 1.1, 1.0);
                break;
            }
        }
    }

    drawWallSegments(g, cam, canvas, segment) {
        const { w, h } = this.worldBounds;
        const wallHeight = 2.5; // Height of the walls in world units
        const wallColor1 = CFG.floorA; // Cream
        const wallColor2 = CFG.floorB; // Red
        const wallStripeColor = 'rgba(100, 0, 0, 0.2)'; // Darker stroke for definition

        g.save();

        // Helper function to draw a single wall panel
        const drawWallPanel = (p1_3d, p2_3d, color) => {
            const p1_base = cam.projectToScreen(p1_3d, canvas);
            const p2_base = cam.projectToScreen(p2_3d, canvas);
            const p3_top = cam.projectToScreen({ ...p2_3d, z: wallHeight }, canvas);
            const p4_top = cam.projectToScreen({ ...p1_3d, z: wallHeight }, canvas);

            g.beginPath();
            g.moveTo(p1_base.x, p1_base.y);
            g.lineTo(p2_base.x, p2_base.y);
            g.lineTo(p3_top.x, p3_top.y);
            g.lineTo(p4_top.x, p4_top.y);
            g.closePath();

            g.fillStyle = color;
            g.fill();
            g.strokeStyle = wallStripeColor;
            g.lineWidth = 1.5;
            g.stroke();
        };

        if (segment === 'far') {
            // Far wall along x=0
            for (let y = 0; y < h; y++) {
                drawWallPanel({ x: 0, y, z: 0 }, { x: 0, y: y + 1, z: 0 }, ((y % 2) === 0) ? wallColor1 : wallColor2);
            }
            // Far wall along y=0
            for (let x = 0; x < w; x++) {
                drawWallPanel({ x, y: 0, z: 0 }, { x: x + 1, y: 0, z: 0 }, ((x % 2) === 0) ? wallColor1 : wallColor2);
            }
        } else if (segment === 'near') {
            // Near wall along x=w
            for (let y = 0; y < h; y++) {
                drawWallPanel({ x: w, y, z: 0 }, { x: w, y: y + 1, z: 0 }, ((y % 2) === 0) ? wallColor1 : wallColor2);
            }
            // Near wall along y=h
            for (let x = 0; x < w; x++) {
                drawWallPanel({ x, y: h, z: 0 }, { x: x + 1, y: h, z: 0 }, ((x % 2) === 0) ? wallColor1 : wallColor2);
            }
        }
        g.restore();
    }

    // In Scene class's drawGrid method:
    drawGrid(g, cam, canvas) {
        const step = 1; // tile step in world units
        const { w, h } = this.worldBounds;
        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const center = { x: x + 0.5, y: y + 0.5, z: 0 };
                const c = cam.projectToScreen(center, canvas);
                const n = cam.projectToScreen({ x: x + 0.5, y: y, z: 0 }, canvas);
                const e = cam.projectToScreen({ x: x + 1, y: y + 0.5, z: 0 }, canvas);
                const s = cam.projectToScreen({ x: x + 0.5, y: y + 1, z: 0 }, canvas);
                const w_point = cam.projectToScreen({ x: x, y: y + 0.5, z: 0 }, canvas);

                g.beginPath();
                g.moveTo(n.x, n.y);
                g.lineTo(e.x, e.y);
                g.lineTo(s.x, s.y);
                g.lineTo(w_point.x, w_point.y);
                g.closePath();

                // Updated color selection - uses only floor colors
                const floorColors = [CFG.floorA, CFG.floorB];
                const colorIndex = (x + y * 2) % 4; // More varied pattern
                g.fillStyle = floorColors[colorIndex];
                g.fill();

                g.lineWidth = 1;
                g.strokeStyle = (x + y) % 2 === 0 ? CFG.gridLight : CFG.gridDark;
                g.stroke();
            }
        }
    }

    drawHitboxes(g, cam, canvas) {
        g.save();
        g.globalAlpha = 0.8;

        for (const e of this.entities) {
            const hb = e.getAABB();
            const pts = [
                { x: hb.x + hb.w / 2, y: hb.y },
                { x: hb.x + hb.w, y: hb.y + hb.h / 2 },
                { x: hb.x + hb.w / 2, y: hb.y + hb.h },
                { x: hb.x, y: hb.y + hb.h / 2 },
            ].map(p => cam.projectToScreen({ x: p.x, y: p.y, z: 0 }, canvas));

            g.beginPath();
            g.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
            g.closePath();

            g.strokeStyle = '#ffb86c';
            g.lineWidth = 1.5;
            g.stroke();
        }

        g.restore();
    }

    getHazardStats() {
        return this.hazardSystem.getStats();
    }
}