// js/image/imageConfig.js

export const config = {
    baseWidth: 1400,  // Increased from 1200
    baseHeight: 900,  // Increased from 800
    baseMapWidth: 1200, // Increased from 1000
    baseLeftBuffer: 100, // Left buffer space
    baseRightBuffer: 0, // Right buffer space
    baseFontSize: 20, // Base font size for text elements
    baseStrokeWidth: 0.5, // Base stroke width for paths

    previewScale: 1, // Scale factor for preview (adjust as needed)

    keyMapMaxWidth: 200, // Maximum width for the key map
};

// Helper function to get scaled value
export function getScaledValue(baseValue, scale) {
    return baseValue * scale;
}