// ===== File: js\player.js =====
import { Entity } from './entity.js';
import { Input } from './input.js';
import { U } from './utils.js';
import { CFG } from './config.js';
import { playRandomSfx } from './audio.js';
import { clownImg } from './assets-loader.js';

// Player entity with physics, controls, and sprite rendering
export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.heading = Math.PI / 4;
        this.speed = 0;
        this.angVel = 0;
        this.accel = 18;
        this.drag = 2;
        this.roll = 0.8;
        this.turnAccel = 17.5;
        this.angDrag = 6;
        this.lean = 0;
        this.leanVel = 0;
        this.leanResponse = 18;
        this.leanDamp = 20;
        this.leanFromAccel = 0.85;
        this.leanFromTurn = 0;
        this.leanNoise = 0.03;
        this.leanMax = 0.8;
        this.maxSpeed = 12;
        this.maxStableSpeed = 11;
        this.height = 1.2;
        this.fallen = false;

        this.fallReason = "";
        // Sprite properties
        this.spriteWidth = 64;   // Adjust based on your sprite dimensions
        this.spriteHeight = 124;  // Adjust based on your sprite dimensions
        this.spriteLoaded = false;

        // Visual lean smoothing (separate from physics lean)
        this.visualLean = 0;
        this.visualLeanSmooth = 0.08; // Smoother visual transitions

        // Set up image load handler
        clownImg.onload = () => {
            this.spriteLoaded = true;
        };

        // Check if already loaded
        if (clownImg.complete) {
            this.spriteLoaded = true;
        }
    }

    // Add this method to the Player class in Player.js
    drawLeanMeter(g, cam, canvas, base) {
        const cfg = CFG.leanMeter;
        const zoom = cam.zoom;

        // Calculate meter position (above player)
        const meterX = base.x - (cfg.width * zoom) / 2;
        const meterY = base.y + cfg.offsetY * zoom;
        const meterWidth = cfg.width * zoom;
        const meterHeight = cfg.height * zoom;

        // Calculate normalized lean (-1 to 1)
        const normalizedLean = this.lean / this.leanMax;

        // Determine fill color based on lean danger
        let fillColor;
        if (Math.abs(normalizedLean) < 0.6) {
            fillColor = cfg.safeColor;
        } else if (Math.abs(normalizedLean) < 0.85) {
            fillColor = cfg.warningColor;
        } else {
            playRandomSfx(["assets/noo.wav"], 0.7, 3, 1.0, false);
            fillColor = cfg.dangerColor;
        }

        // Draw meter background
        g.save();
        g.fillStyle = 'rgba(0, 0, 0, 0.5)';
        g.fillRect(meterX, meterY, meterWidth, meterHeight);

        // Draw fill
        if (normalizedLean !== 0) {
            g.fillStyle = fillColor;
            if (normalizedLean > 0) {
                // Right side
                g.fillRect(
                    meterX + meterWidth / 2,
                    meterY,
                    (meterWidth / 2) * normalizedLean,
                    meterHeight
                );
            } else {
                // Left side
                g.fillRect(
                    meterX + (meterWidth / 2) * (1 + normalizedLean),
                    meterY,
                    (meterWidth / 2) * Math.abs(normalizedLean),
                    meterHeight
                );
            }
        }



        // Draw border
        g.strokeStyle = cfg.borderColor;
        g.lineWidth = cfg.borderWidth;
        g.strokeRect(meterX, meterY, meterWidth, meterHeight);

        g.restore();
    }

    reset(x, y) {
        this.pos.x = x;
        this.pos.y = y;
        this.speed = 0;
        this.angVel = 0;
        this.lean = 0;
        this.leanVel = 0;
        this.visualLean = 0; // Reset visual lean too
        this.spriteRotation = this.heading; // Reset sprite rotation
        this.heading = Math.PI / 4;
        this.fallen = false;
    }

    get input() {
        const thr = (Input.down('w', 'arrowup') ? 1 : 0) + (Input.down('s', 'arrowdown') ? -1 : 0);
        const ste = (Input.down('d', 'arrowright') ? 1 : 0) + (Input.down('a', 'arrowleft') ? -1 : 0);
        return { throttle: thr, steer: ste };
    }

    physics(dt, scene) {
        const { throttle, steer } = this.input;
        let a = this.accel * throttle - this.drag * this.speed - Math.sign(this.speed) * this.roll;
        if (Math.abs(this.speed) < 0.05 && throttle === 0) a = 0;
        this.speed = U.clamp(this.speed + a * dt, -this.maxSpeed, this.maxSpeed);

        this.angVel += this.turnAccel * steer * dt;
        this.angVel -= this.angVel * this.angDrag * dt;
        this.heading += this.angVel * dt;

        this.pos.x += Math.cos(this.heading) * this.speed * dt;
        this.pos.y += Math.sin(this.heading) * this.speed * dt;

        // Constrain to world bounds to prevent going off-screen
        const bounds = scene.worldBounds;
        this.pos.x = U.clamp(this.pos.x, 0, bounds.w);
        this.pos.y = U.clamp(this.pos.y, 0, bounds.h);

        const targetLean = this.leanFromAccel * throttle + this.leanFromTurn * Math.abs(this.angVel) * Math.abs(this.speed);
        const spring = (targetLean - this.lean) * this.leanResponse;
        const damp = -this.leanVel * this.leanDamp;
        const noise = (Math.random() - 0.5) * this.leanNoise;
        this.leanVel += (spring + damp + noise) * dt;
        this.lean += this.leanVel * dt;

        const speedRisk = Math.max(0, Math.abs(this.speed) - this.maxStableSpeed) / (this.maxSpeed - this.maxStableSpeed);
        if (Math.abs(this.lean) > this.leanMax || speedRisk > 0.05) {
            this.fall('leaned_too_much');
        }
    }

    fall(reason = "") {
        if (this.fallen) return;
        this.fallen = true;
        this.fallReason = reason;
        this.speed = 0;
        this.angVel = 0;
        this.leanVel = 0;

        window.dispatchEvent(new CustomEvent('screen:shake', { detail: 10 }));

        if (reason === 'hit_by_npc') {
            playRandomSfx([
                'assets/npc_crash1.wav',
                'assets/npc_crash2.wav'
            ], 0.8, 1.2, 1.0);
        }

        playRandomSfx([
            'assets/terr.mp3'
        ], 0.8, 2.0, 1.0)
        playRandomSfx([
            'assets/trying.wav',
            'assets/trying2.wav',
            'assets/ggg.wav',
            'assets/no.wav'
        ], 0.8, 2.0, 3.0)
    }

    update(dt, scene) {
        if (!this.fallen) this.physics(dt, scene);

        // Update smooth visual lean for sprite animation
        const { throttle } = this.input;
        const targetVisualLean = this.leanFromAccel * throttle * 1.5; // Increased multiplier for more dramatic tilt
        this.visualLean = U.lerp(this.visualLean, targetVisualLean, this.visualLeanSmooth);
    }

    draw(g, cam, canvas) {
        const base = cam.projectToScreen(this.pos, canvas);

        // Draw shadow first (underneath everything)
        this.drawShadow(g, cam, canvas, base);

        // Draw directional arrow
        this.drawDirectionalArrow(g, cam, canvas, base);

        // Draw the sprite with leaning effect
        this.drawSprite(g, cam, canvas, base);

        // Draw fallback if sprite isn't loaded
        if (!this.spriteLoaded) {
            this.drawFallback(g, cam, canvas, base);
        }
        if (!this.fallen) {
            this.drawLeanMeter(g, cam, canvas, base);
        }
    }

    drawShadow(g, cam, canvas, base) {
        g.save();
        g.globalAlpha = 0.4;
        g.beginPath();
        g.ellipse(base.x, base.y + 8 * cam.zoom, 16 * cam.zoom, 10 * cam.zoom, 0, 0, Math.PI * 2);
        g.fillStyle = CFG.shadow;
        g.fill();
        g.restore();
    }

    drawDirectionalArrow(g, cam, canvas, base) {
        // Convert heading to isometric screen space and rotate 90 degrees clockwise
        const isoHeading = this.heading - Math.PI / 4 + Math.PI / 2; // Added +90 degrees

        // Draw direction arrow extending from player
        const arrowLength = 35 * cam.zoom;
        const arrowEndX = base.x + Math.cos(isoHeading) * arrowLength;
        const arrowEndY = base.y + Math.sin(isoHeading) * arrowLength;

        // Arrow shaft
        g.save();
        g.beginPath();
        g.moveTo(base.x, base.y);
        g.lineTo(arrowEndX, arrowEndY);
        g.lineWidth = 3 * cam.zoom;
        g.strokeStyle = this.fallen ? '#ff6b6b' : '#4CAF50'; // Green when active
        g.lineCap = 'round';
        g.stroke();

        // Arrow head
        const arrowHeadSize = 8 * cam.zoom;
        const arrowAngle1 = isoHeading + Math.PI * 0.8;
        const arrowAngle2 = isoHeading - Math.PI * 0.8;

        g.beginPath();
        g.moveTo(arrowEndX, arrowEndY);
        g.lineTo(
            arrowEndX + Math.cos(arrowAngle1) * arrowHeadSize,
            arrowEndY + Math.sin(arrowAngle1) * arrowHeadSize
        );
        g.moveTo(arrowEndX, arrowEndY);
        g.lineTo(
            arrowEndX + Math.cos(arrowAngle2) * arrowHeadSize,
            arrowEndY + Math.sin(arrowAngle2) * arrowHeadSize
        );
        g.lineWidth = 3 * cam.zoom;
        g.strokeStyle = this.fallen ? '#ff6b6b' : '#00ff88';
        g.lineCap = 'round';
        g.stroke();
        g.restore();
    }

    drawSprite(g, cam, canvas, base) {
        if (!this.spriteLoaded) return;

        g.save();

        // Use smooth visual lean but adjust direction based on heading
        const baseLeanVisual = this.visualLean * 0.8;

        // Calculate lean direction adjustment based on heading
        // Normalize heading to 0-2π range
        const normalizedHeading = ((this.heading % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

        // Determine lean direction multiplier based on which quadrant we're facing
        // This flips the lean when moving in opposite directions to maintain visual consistency
        let leanDirectionMultiplier = 1;

        // If heading is in the "western" quadrants (roughly 90° to 270°), flip the lean
        if (normalizedHeading > Math.PI / 2 && normalizedHeading < (3 * Math.PI / 2)) {
            leanDirectionMultiplier = -1;
        }

        const leanVisual = baseLeanVisual * leanDirectionMultiplier;

        // More dramatic lean angle
        const leanAngle = leanVisual * 0.6;

        // Calculate sprite position with lean offset (perpendicular to movement)
        const spriteOffsetX = Math.cos(this.heading + Math.PI / 2) * leanVisual * 8 * cam.zoom;
        const spriteOffsetY = Math.sin(this.heading + Math.PI / 2) * leanVisual * 8 * cam.zoom;

        // Move to sprite center
        g.translate(base.x + spriteOffsetX, base.y + spriteOffsetY - 16 * cam.zoom);

        // Only apply lean tilt, keep sprite facing same direction
        g.rotate(leanAngle);

        // Determine if sprite should be horizontally flipped based on heading
        const shouldFlip = normalizedHeading > Math.PI / 2 && normalizedHeading < (3 * Math.PI / 2);

        // Scale sprite based on camera zoom and flip horizontally if needed
        const spriteScale = cam.zoom * 0.6;
        g.scale(shouldFlip ? -spriteScale : spriteScale, spriteScale);

        // Apply color tint if fallen
        if (this.fallen) {
            g.globalAlpha = 0.7;
            g.filter = 'hue-rotate(0deg) saturate(0.5) brightness(0.8)';
        }

        // Draw the sprite centered
        g.drawImage(
            clownImg,
            -this.spriteWidth / 2,
            -this.spriteHeight / 2,
            this.spriteWidth,
            this.spriteHeight
        );

        g.restore();
    }

    drawFallback(g, cam, canvas, base) {
        // Fallback rendering if sprite fails to load (original code)
        // Base circle
        g.save();
        g.beginPath();
        g.ellipse(base.x, base.y, 10 * cam.zoom, 5 * cam.zoom, 0, 0, Math.PI * 2);
        g.lineWidth = 2 * cam.zoom;
        g.strokeStyle = '#9ad1ff';
        g.stroke();
        g.restore();

        // Body with lean
        const leanVisual = this.lean * 0.6;
        const topWorld = {
            x: this.pos.x + Math.cos(this.heading) * leanVisual,
            y: this.pos.y + Math.sin(this.heading) * leanVisual,
            z: this.height
        };
        const top = cam.projectToScreen(topWorld, canvas);

        g.beginPath();
        g.moveTo(base.x, base.y);
        g.lineTo(top.x, top.y);
        g.lineWidth = 6 * cam.zoom;
        g.strokeStyle = this.fallen ? '#ff6b6b' : '#93b5ff';
        g.lineCap = 'round';
        g.stroke();

        // Head
        g.beginPath();
        g.arc(top.x, top.y - 4 * cam.zoom, 6 * cam.zoom, 0, Math.PI * 2);
        g.fillStyle = this.fallen ? '#ffb3b3' : '#cfe0ff';
        g.fill();
        g.strokeStyle = '#7aa2ff';
        g.stroke();
    }
}