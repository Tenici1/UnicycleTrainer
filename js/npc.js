// ===== File: js\npc.js =====
import { Entity } from './entity.js';
import { U } from './utils.js';
import { CFG } from './config.js';
import { playRandomSfx } from './audio.js';
import { gmImg } from './assets-loader.js';

export class NPC extends Entity {
    constructor(x, y, targetX, targetY) {
        super(x, y);
        this.target = { x: targetX, y: targetY };
        this.speed = 8; // Units per second
        this.size = 2;
        this.hit = { offset: { x: -0.4, y: -0.4 }, size: { w: 2, h: 2 } };
        this.direction = U.norm(this.target.x - this.pos.x, this.target.y - this.pos.y);

        // Remove rotation properties
        // this.rotation = Math.atan2(this.direction.y, this.direction.x);
        // this.rotSpeed = (Math.random() - 0.5) * 5;

        // Sprite properties
        this.spriteLoaded = false;

        // Set up image load handler
        if (gmImg.complete) {
            this.spriteLoaded = true;
        } else {
            gmImg.onload = () => {
                this.spriteLoaded = true;
            };
        }
    }

    update(dt, scene) {
        // Move towards target
        this.pos.x += this.direction.x * this.speed * dt;
        this.pos.y += this.direction.y * this.speed * dt;

        // Remove only when far out of bounds (5 units beyond edge)
        const bounds = scene.worldBounds;
        if (this.pos.x < -5 || this.pos.x > bounds.w + 5 ||
            this.pos.y < -5 || this.pos.y > bounds.h + 5) {
            return false; // Remove NPC
        }

        return true; // Keep NPC
    }

    draw(g, cam, canvas) {
        // Draw shadow
        this.drawShadow(g, cam, canvas);

        const base = cam.projectToScreen(this.pos, canvas);
        const size = this.size * CFG.tileH * cam.zoom;

        g.save();
        g.translate(base.x, base.y);
        // Remove rotation: g.rotate(this.rotation);
        g.globalAlpha = 1;

        // Draw NPC sprite if loaded
        if (this.spriteLoaded) {
            const imgSize = size * 1.2; // Adjust size as needed
            const aspectRatio = gmImg.width / gmImg.height;
            const width = imgSize;
            const height = imgSize / aspectRatio;

            g.drawImage(
                gmImg,
                -width / 2,
                -height / 2,
                width,
                height
            );
        }
        // Fallback if sprite not loaded
        else {
            g.beginPath();
            g.moveTo(0, -size / 2);
            g.lineTo(size / 2, size / 2);
            g.lineTo(-size / 2, size / 2);
            g.closePath();
            g.fillStyle = '#ff0000';
            g.fill();
            g.strokeStyle = '#990000';
            g.lineWidth = 2;
            g.stroke();
        }

        g.restore();
    }

    drawShadow(g, cam, canvas) {
        const shadowPos = { ...this.pos, z: 0 };
        const base = cam.projectToScreen(shadowPos, canvas);
        const size = this.size * CFG.tileH * cam.zoom * 0.8;

        g.save();
        g.beginPath();
        g.ellipse(base.x, base.y, size / 2, size / 4, 0, 0, Math.PI * 2);
        g.fillStyle = 'rgba(0, 0, 0, 0.4)';
        g.fill();
        g.restore();
    }
}