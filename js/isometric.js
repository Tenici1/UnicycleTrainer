import { CFG } from './config.js';

// Isometric Math
export class Iso {
    static worldToIso(x, y, z = 0) {
        // 2:1 diamond projection
        const sx = (x - y) * (CFG.tileW / 2);
        const sy = (x + y) * (CFG.tileH / 2) - z * CFG.tileH;
        return { x: sx, y: sy };
    }

    static isoToWorld(sx, sy, z = 0) {
        // Inverse of worldToIso
        const a = CFG.tileW / 2;
        const b = CFG.tileH / 2;
        const wy = ((sy + z * CFG.tileH) / b - sx / a) / 2;
        const wx = (sx / a + (sy + z * CFG.tileH) / b) / 2;
        return { x: wx, y: wy };
    }
}