// Input System
export class Input {
    static keys = new Set();

    static init() {
        const set = Input.keys;
        addEventListener('keydown', (e) => {
            set.add(e.key.toLowerCase());
        });
        addEventListener('keyup', (e) => {
            set.delete(e.key.toLowerCase());
        });
    }

    static down(...names) {
        return names.some(n => Input.keys.has(n));
    }
}