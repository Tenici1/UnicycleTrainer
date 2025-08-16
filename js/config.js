// ===== File: js\config.js =====
// Configuration & Constants
export const CFG = {
    tileW: 64,         // world 1x1 projects to 64x32 diamond
    tileH: 32,
    mapW: 30,          // tiles in X
    mapH: 30,          // tiles in Y
    bg1: "#faf3f5ff",    // Dark navy blue (sky/night circus)
    gridLight: "#4a4a4a", // Grid line color (dark gray)
    gridDark: "#333333",  // Grid line alternate color
    floorA: "#ffffffff", // Cream (primary floor)
    floorB: "#fd4d4dff", // Light brown (alternate floor)
    shadow: "rgba(0,0,0,.35)",
    fpsSmoothing: 0.85,

    leanMeter: {
        width: 80,        // Base width of the meter
        height: 8,        // Base height of the meter
        offsetY: -75,     // Vertical offset from player
        safeColor: "#4CAF50",    // Green for safe zone
        warningColor: "#FFC107", // Yellow for warning zone
        dangerColor: "#F44336",  // Red for danger zone
        borderColor: "#FFFFFF",  // White border
        borderWidth: 1
    }
};