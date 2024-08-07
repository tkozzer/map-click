// js/mapKey/mapKeyConfig.js

export const mapKeyConfig = {
    maxEntries: 20,
    fontFamily: 'Arial, sans-serif',
    baseFontSize: 16,
    baseColorBoxSize: 20,
    baseLabelPadding: 10,
    baseEntryHeight: 23,
    baseRightPadding: 40,
    maxWidth: 200,
};

export function getScaledMapKeyValue(baseValue, scale) {
    return baseValue * scale;
}