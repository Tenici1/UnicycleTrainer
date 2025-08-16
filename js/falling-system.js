// ===== File: js/falling-system.js =====
import { FallingObject } from './falling-object.js';
import { U } from './utils.js';
import { playRandomSfx } from './audio.js';

export class FallingObjectSystem {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1000;
        this.minSpawnInterval = 300;
        this.difficultyRamp = 0.995;
        this.gameTime = 0;
        this.goodObjectProbability = 0.5;
    }

    update(dt) {
        this.gameTime += dt * 1000;
        this.spawnTimer += dt * 1000;

        // Update existing objects
        this.objects = this.objects.filter(obj => obj.update(dt, this.scene));

        // Spawn new objects
        if (this.spawnTimer >= this.getCurrentSpawnInterval()) {
            this.spawnObject();
            this.spawnTimer = 0;
        }

        // Check collisions
        this.checkPlayerCollision();
    }

    getCurrentSpawnInterval() {
        const current = this.spawnInterval * Math.pow(this.difficultyRamp, this.objects.length);
        return Math.max(current, this.minSpawnInterval);
    }

    spawnObject() {
        const player = this.scene.player;

        // Spawn position above player with some randomness
        const offsetX = (Math.random() - 0.5) * 15;
        const offsetY = (Math.random() - 0.5) * 15;

        // Aim near player with some spread
        const targetX = player.pos.x + (Math.random() - 0.5) * 8;
        const targetY = player.pos.y + (Math.random() - 0.5) * 8;

        // Calculate velocity to reach target
        const dx = targetX - (player.pos.x + offsetX);
        const dy = targetY - (player.pos.y + offsetY);
        const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
        const timeToFall = 1.5; // seconds

        // Randomly determine if good or bad
        const isGood = Math.random() < this.goodObjectProbability;
        const objectType = isGood ?
            (Math.random() > 0.5 ? 3 : 4) : // Good objects: star or heart
            Math.floor(Math.random() * 3);   // Bad objects: 0-2

        const obj = new FallingObject(
            player.pos.x + offsetX,
            player.pos.y + offsetY,
            objectType
        );

        obj.vel.x = dx / (timeToFall * dist);
        obj.vel.y = dy / (timeToFall * dist);

        this.objects.push(obj);
        this.scene.entities.push(obj);
    }

    checkPlayerCollision() {
        const player = this.scene.player;

        for (const obj of this.objects) {
            if (obj.pos.z > 0.5 || obj.pos.z < -0.5) continue; // Only check when near ground

            const dx = obj.pos.x - player.pos.x;
            const dy = obj.pos.y - player.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 1.0) { // Collision distance
                if (obj.isGood) {
                    // Good object: add points
                    this.scene.addScore(10);
                    // Play good sound
                    playRandomSfx(['assets/exalt.wav'], 0.9, 1.1, 2.0);
                } else {
                    // Bad object: make player fall
                    player.fall('hit_by_object');
                }

                // Remove the object
                obj.pos.z = -10; // Force removal
                break; // Only one collision per frame
            }
        }
    }

    reset() {
        // Remove all falling objects from scene
        this.objects.forEach(obj => {
            const index = this.scene.entities.indexOf(obj);
            if (index !== -1) this.scene.entities.splice(index, 1);
        });

        this.objects = [];
        this.spawnTimer = 0;
        this.gameTime = 0;
    }
}