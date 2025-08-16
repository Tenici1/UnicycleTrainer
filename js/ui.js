// js/ui.js
import { getAudioSettings, updateAudioSettings } from './settings.js';
import { setMuted, setVolume, pauseMusic, resumeMusic } from './audio.js';

export function initMenu(game) {
    const menu = document.getElementById('menu');
    const muteToggle = document.getElementById('muteToggle');
    const volume = document.getElementById('volume');
    const resumeBtn = document.getElementById('resumeBtn');

    // Seed controls from saved settings
    const a = getAudioSettings();
    muteToggle.checked = !!a.muted;
    volume.value = String(a.volume);

    let open = false;

    function show() {
        open = true;
        menu.classList.add('show');
        menu.setAttribute('aria-hidden', 'false');
        game.paused = true;
        pauseMusic();
    }

    function hide() {
        open = false;
        menu.classList.remove('show');
        menu.setAttribute('aria-hidden', 'true');
        game.paused = false;
        resumeMusic();
    }

    // ESC toggles the menu
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            open ? hide() : show();
        }
    });

    // Buttons & inputs
    resumeBtn.addEventListener('click', hide);
    muteToggle.addEventListener('change', () => {
        setMuted(muteToggle.checked);
        updateAudioSettings({ muted: muteToggle.checked });
    });
    volume.addEventListener('input', () => {
        const v = Number(volume.value);
        setVolume(v);
        updateAudioSettings({ volume: v });
    });

    // Keep UI in sync with changes from other shortcuts (like 'M')
    window.addEventListener('audio:muted-changed', (e) => { muteToggle.checked = !!e.detail; });
    window.addEventListener('audio:volume-changed', (e) => { volume.value = String(e.detail); });

    return { show, hide, get isOpen() { return open; } };
}
