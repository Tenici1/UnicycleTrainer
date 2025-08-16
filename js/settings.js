// js/settings.js
const KEY = 'audioSettings';

export function getAudioSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
        return { muted: false, volume: 0.5, ...saved };
    } catch {
        return { muted: false, volume: 0.5 };
    }
}

export function setAudioSettings(s) {
    const next = {
        muted: !!s.muted,
        volume: Math.max(0, Math.min(1, Number(s.volume) || 0)),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
}

export function updateAudioSettings(partial) {
    return setAudioSettings({ ...getAudioSettings(), ...partial });
}
