// Base Entity class
export class Entity {
    constructor(x, y) {
        this.pos = { x, y, z: 0 };
        this.vel = { x: 0, y: 0, z: 0 };
        // Hitbox (footprint on ground plane). Offset is relative to pos.
        this.hit = { offset: { x: -0.3, y: -0.2 }, size: { w: 1.0, h: 1.2 } };
    }

    getAABB() {
        return {
            x: this.pos.x + this.hit.offset.x,
            y: this.pos.y + this.hit.offset.y,
            w: this.hit.size.w,
            h: this.hit.size.h,
        };
    }

    update(dt, scene) {
        // Default passive physics: position += velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
    }

    draw(g, cam, canvas) {
        /* abstract - to be implemented by subclasses */
    }
}