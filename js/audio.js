// ===== File: js/audio.js =====
import { getAudioSettings, updateAudioSettings } from './settings.js';

let bgm;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function emitMuted() {
    if (!bgm) return;
    window.dispatchEvent(new CustomEvent('audio:muted-changed', { detail: bgm.muted }));
}
function emitVolume() {
    if (!bgm) return;
    window.dispatchEvent(new CustomEvent('audio:volume-changed', { detail: bgm.volume }));
}

/**
 * Initialize background music with an <audio> element.
 */
export function initMusic(selector = "#bgm") {
    bgm = document.querySelector(selector);
    if (!bgm) throw new Error("Music element not found: " + selector);

    const saved = getAudioSettings();
    bgm.volume = clamp01(saved.volume);
    bgm.muted = !!saved.muted;
    bgm.loop = true;

    // Persist when the element changes (e.g., via slider)
    bgm.addEventListener('volumechange', () => {
        updateAudioSettings({ volume: bgm.volume, muted: bgm.muted });
        emitMuted();
        emitVolume();
    });

    // Ensure playback starts once the user interacts (due to browser policies)
    window.addEventListener(
        "keydown",
        () => {
            if (bgm.paused) startMusic();
        },
        { once: true }
    );

    // Allow mute toggle with 'm'
    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "m") {
            toggleMute();
        }
    });

    // Emit initial state for any UI already mounted
    queueMicrotask(() => { emitMuted(); emitVolume(); });
}

/** Start playback (called internally on first user interaction). */
export function startMusic() {
    if (!bgm) return;
    bgm.play().catch((err) => {
        console.warn("Music playback blocked until user interacts:", err);
    });
}

/** Pause playback */
export function pauseMusic() { if (bgm) bgm.pause(); }

/** Resume playback */
export function resumeMusic() { if (bgm && bgm.paused) startMusic(); }

/** Toggle mute on/off (persists) */
export function toggleMute() {
    if (!bgm) return;
    bgm.muted = !bgm.muted;
    updateAudioSettings({ muted: bgm.muted });
    emitMuted();
}

/** Explicitly set muted (persists) */
export function setMuted(flag) {
    if (!bgm) return;
    bgm.muted = !!flag;
    updateAudioSettings({ muted: bgm.muted });
    emitMuted();
}

/** Explicitly set volume 0..1 (persists) */
export function setVolume(v) {
    if (!bgm) return;
    bgm.volume = clamp01(v);
    updateAudioSettings({ volume: bgm.volume });
    emitVolume();
}

export function getMuted() { return !!(bgm && bgm.muted); }
export function getVolume() { return bgm ? bgm.volume : getAudioSettings().volume; }


/**
 * Play a random sound effect from a list with random pitch
 * @param {string[]} srcs Array of sound file paths
 * @param {number} [minPitch=0.9] Minimum pitch multiplier
 * @param {number} [maxPitch=1.1] Maximum pitch multiplier
 */
export function playRandomSfx(srcs, minPitch = 0.9, maxPitch = 1.1) {
    const settings = getAudioSettings();
    if (settings.muted || !srcs.length) return;

    try {
        const randomSrc = srcs[Math.floor(Math.random() * srcs.length)];
        const sfx = new Audio(randomSrc);

        // Calculate random pitch between min and max
        const pitch = Math.random() * (maxPitch - minPitch) + minPitch;
        sfx.playbackRate = pitch;

        // Adjust volume to compensate for pitch change
        const volumeCompensation = 1.0 - Math.abs(1.0 - pitch) * 0.3;
        sfx.volume = settings.volume * volumeCompensation;

        sfx.play().catch(e => console.warn("SFX play failed:", e));
    } catch (e) {
        console.error("Error playing SFX:", e);
    }
}