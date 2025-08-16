// ===== File: js/falling-object.js =====
import { Entity } from './entity.js';
import { U } from './utils.js';
import { playRandomSfx } from './audio.js';
import { CFG } from './config.js';
import { exaltImg, hicImg, kcdImg, eldenImg, nierImg } from './assets-loader.js';

// Falling hazard objects
export class FallingObject extends Entity {
    constructor(x, y, objectType) {
        super(x, y);
        this.pos.z = 25; // Start above the player
        this.vel = { x: 0, y: 0, z: -15 }; // Initial downward velocity
        this.objectType = objectType;
        this.size = 0.8;
        this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 5;
        this.hit = { offset: { x: -0.5, y: -0.5 }, size: { w: 1, h: 1 } };

        // Determine if good or bad based on type
        this.isGood = objectType === 3 || objectType === 4;
    }

    update(dt) {
        dt = dt * 0.2;
        // Apply gravity
        this.vel.z -= 1 * dt;
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
        this.pos.z += this.vel.z * dt;
        this.rotation += this.rotSpeed * dt;

        // Remove when below ground
        return this.pos.z > -5;
    }

    draw(g, cam, canvas) {
        // Draw shadow first (always visible)
        this.drawShadow(g, cam, canvas);

        if (this.pos.z <= 0) return; // Don't draw underground object

        const base = cam.projectToScreen(this.pos, canvas);
        const size = this.size * CFG.tileH * cam.zoom * (1 + this.pos.z * 0.1);
        const alpha = 1;

        g.save();
        g.translate(base.x, base.y);
        g.rotate(this.rotation);
        g.globalAlpha = alpha;

        // Draw different types of falling objects
        switch (this.objectType) {
            case 0:
                if (nierImg.complete && nierImg.naturalHeight !== 0) {
                    const imgSize = size * 1; // Make it slightly larger
                    const aspectRatio = nierImg.width / nierImg.height;
                    const width = imgSize;
                    const height = imgSize / aspectRatio;

                    g.drawImage(
                        nierImg,
                        -width / 2,
                        -height / 2,
                        width,
                        height
                    );
                }
                break;

            case 1:
                if (kcdImg.complete && kcdImg.naturalHeight !== 0) {
                    const imgSize = size * 1; // Make it slightly larger
                    const aspectRatio = kcdImg.width / kcdImg.height;
                    const width = imgSize;
                    const height = imgSize / aspectRatio;

                    g.drawImage(
                        kcdImg,
                        -width / 2,
                        -height / 2,
                        width,
                        height
                    );
                }
                break;

            case 2:
                if (eldenImg.complete && eldenImg.naturalHeight !== 0) {
                    const imgSize = size * 1; // Make it slightly larger
                    const aspectRatio = eldenImg.width / eldenImg.height;
                    const width = imgSize;
                    const height = imgSize / aspectRatio;

                    g.drawImage(
                        eldenImg,
                        -width / 2,
                        -height / 2,
                        width,
                        height
                    );
                }
                break;

            case 3:
                if (hicImg.complete && hicImg.naturalHeight !== 0) {
                    const imgSize = size * 1; // Make it slightly larger
                    const aspectRatio = hicImg.width / hicImg.height;
                    const width = imgSize;
                    const height = imgSize / aspectRatio;

                    g.drawImage(
                        hicImg,
                        -width / 2,
                        -height / 2,
                        width,
                        height
                    );
                }
                break;

            case 4:
                if (exaltImg.complete && exaltImg.naturalHeight !== 0) {
                    const imgSize = size * 1; // Make it slightly larger
                    const aspectRatio = exaltImg.width / exaltImg.height;
                    const width = imgSize;
                    const height = imgSize / aspectRatio;

                    g.drawImage(
                        exaltImg,
                        -width / 2,
                        -height / 2,
                        width,
                        height
                    );
                }
                break;
        }

        g.restore();
    }

    // Update the drawShadow method
    drawShadow(g, cam, canvas) {
        // Skip shadow if object is too low
        if (this.pos.z <= 0) return;

        // Calculate shadow position at ground level
        const shadowPos = {
            x: this.pos.x,
            y: this.pos.y,
            z: 0
        };
        const base = cam.projectToScreen(shadowPos, canvas);

        // Calculate size with clamping to prevent negative values
        let size = this.size * CFG.tileH * cam.zoom * (1 + this.pos.z * 0.1);
        size = Math.max(0.1, size); // Prevent negative or zero sizes

        const shadowSize = Math.max(0.1, size * 0.8); // Ensure minimum size
        const alpha = Math.min(0.4, Math.max(0, 0.4 - (this.pos.z / 100)));

        g.save();
        g.beginPath();

        // Ensure radii are positive
        const radiusX = Math.max(0.1, shadowSize / 2);
        const radiusY = Math.max(0.1, shadowSize / 4);

        g.ellipse(base.x, base.y, radiusX, radiusY, 0, 0, Math.PI * 2);
        g.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        g.fill();
        g.restore();
    }
}