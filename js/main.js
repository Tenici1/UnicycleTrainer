// ===== Updated js/main.js =====

import { CFG } from './config.js';
import { U } from './utils.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Scene } from './scene.js';
import { initMusic, toggleMute, pauseMusic, resumeMusic } from './audio.js';
import { initMenu } from './ui.js';

// Main game initialization and loop
class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.g = this.canvas.getContext('2d');
        this.hud = document.getElementById('hud');
        this.scene = new Scene(CFG.mapW, CFG.mapH);
        this.camera = new Camera(CFG.mapW / 2, CFG.mapH / 2, 0);
        this.fps = 60;
        this.last = U.now();

        this.paused = false;
        this.gameOver = false;
        this.init();
    }

    init() {
        Input.init();
        this.resize();
        this.setupEventListeners();
        this.start();
        initMusic("#bgm");
        this.menu = initMenu(this);
    }

    resize() {
        const dpr = Math.max(1, Math.min(2.5, devicePixelRatio || 1));
        const w = Math.floor(innerWidth);
        const h = Math.floor(innerHeight);
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.g.setTransform(dpr, 0, 0, dpr, 0, 0); // crisp rendering with DPR scaling
    }

    setupEventListeners() {
        addEventListener('resize', () => this.resize());

        // Debug toggles & zoom
        addEventListener('keydown', (e) => {
            if (this.paused) return;
            const k = e.key.toLowerCase();
            if (k === 'g') this.scene.debug.grid = !this.scene.debug.grid;
            if (k === 'h') this.scene.debug.hitboxes = !this.scene.debug.hitboxes;
            if (k === 'q') this.camera.zoom = U.clamp(this.camera.zoom * 0.9, 0.5, 2.5);
            if (k === 'e') this.camera.zoom = U.clamp(this.camera.zoom * 1.1, 0.5, 2.5);

            // Reset game when fallen
            if (k === 'r' && this.scene.player.fallen) {
                this.resetGame();
            }
        });
    }

    resetGame() {
        this.scene.reset();
        this.gameOver = false;
    }

    drawHUD() {
        const hazardStats = this.scene.getHazardStats();
        const playerFallen = this.scene.player.fallen;

        this.hud.innerHTML = `
      <div><strong>Controls</strong></div>
      <div><kbd>WASD</kbd>/<kbd>↑↓←→</kbd> move · <kbd>Q</kbd>/<kbd>E</kbd> zoom</div>
      ${playerFallen ? '<div style="color:#ff6b6b;font-weight:bold;">💥 CRASHED! Press <kbd>R</kbd> to restart</div>' : ''}
      <div style="opacity:.8;margin-top:6px">
        Score: ${this.scene.score} · Time: ${hazardStats.gameTime}s · Active Hazards: ${hazardStats.activeHazards} · Spawn Rate: ${(hazardStats.spawnInterval / 1000).toFixed(1)}s
      </div>
      <div style="opacity:.8;">
        FPS ${this.fps.toFixed(0)} · Zoom ${this.camera.zoom.toFixed(2)} · Player (${this.scene.player.pos.x.toFixed(2)}, ${this.scene.player.pos.y.toFixed(2)})
      </div>
    `;
    }

    update(dt) {
        if (!this.paused && !this.scene.player.fallen) {
            this.scene.update(dt);
            this.camera.follow(this.scene.player);
        }
    }

    render() {
        // Clear
        this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Paint background (solid)
        this.g.save();
        this.g.resetTransform();
        this.g.fillStyle = CFG.bg1;
        this.g.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.g.restore();

        // Draw scene
        this.scene.draw(this.g, this.camera, this.canvas);

        // Update HUD
        this.drawHUD();
    }

    frame() {
        const t = U.now();
        let dt = Math.min(0.033, (t - this.last) / 1000); // cap dt to 33ms
        this.last = t;

        this.update(dt);
        this.render();

        // Update FPS
        this.fps = U.lerp(this.fps, 1 / dt, CFG.fpsSmoothing);

        requestAnimationFrame(() => this.frame());
    }

    start() {
        requestAnimationFrame(() => this.frame());
    }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});