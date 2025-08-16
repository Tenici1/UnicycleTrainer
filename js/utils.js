// Utility functions
export const U = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    mag: (x, y) => Math.hypot(x, y),
    norm: (x, y) => {
        const m = Math.hypot(x, y) || 1;
        return { x: x / m, y: y / m };
    },
    now: () => performance.now(),
};