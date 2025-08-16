import { U } from './utils.js';
import { Iso } from './isometric.js';

// Camera system
export class Camera {
    constructor(x = 0, y = 0, z = 0) {
        this.pos = { x, y, z };
        this.zoom = 1.8;
        this.smooth = 0.12; // follow smoothing

        this.shakeAmount = 0;
        window.addEventListener('screen:shake', (e) => {
            this.shakeAmount = e.detail;
        });
    }

    projectToScreen(world, canvas) {
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (this.shakeAmount > 0) {
            shakeOffsetX = (Math.random() - 0.5) * this.shakeAmount;
            shakeOffsetY = (Math.random() - 0.5) * this.shakeAmount;
            this.shakeAmount *= 0.8; // Dampen shake
        }
        // Project world to iso, then offset by camera center and zoom to screen center
        const p = Iso.worldToIso(world.x, world.y, world.z || 0);
        const c = Iso.worldToIso(this.pos.x, this.pos.y, this.pos.z || 0);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        return { x: (p.x - c.x) * this.zoom + cx + shakeOffsetX, y: (p.y - c.y) * this.zoom + cy + shakeOffsetY };
    }

    screenToWorld(sx, sy, canvas, z = 0) {
        // Inverse of projectToScreen
        const c = Iso.worldToIso(this.pos.x, this.pos.y, this.pos.z || 0);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const ix = (sx - cx) / this.zoom + c.x;
        const iy = (sy - cy) / this.zoom + c.y;
        return Iso.isoToWorld(ix, iy, z);
    }

    follow(target) {
        // Smooth follow on x/y; z remains 0 for ground camera
        this.pos.x = U.lerp(this.pos.x, target.pos.x, this.smooth);
        this.pos.y = U.lerp(this.pos.y, target.pos.y, this.smooth);
    }
}