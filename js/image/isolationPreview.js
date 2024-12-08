import { isIsolationMode, selectedRegions, customSelectedStates, isCustomMode } from '../stateIsolation.js';
import { getScaledValue } from './imageConfig.js';
import { debug, error } from '../config.js';

let regions = [];

// Load regions data
async function loadRegions() {
    try {
        const response = await fetch('resources/regions.json');
        const data = await response.json();
        regions = data.regions;
    } catch (err) {
        error('Error loading regions:', err);
        regions = [];
    }
}

export async function adjustProjectionForIsolation(stateFeatures, offscreenPath, mapWidth, height, baseScale) {
    if (!isIsolationMode) return offscreenPath;

    // Load regions if not already loaded
    if (regions.length === 0) {
        await loadRegions();
    }

    // Get visible states based on current isolation mode
    const visibleStates = stateFeatures.filter(d => {
        if (!isIsolationMode) return true;
        const state = stateFeatures.find(s => s.id === d.id);
        if (!state) return false;

        if (isCustomMode) {
            return customSelectedStates.has(state.properties.name);
        } else {
            // Check if the state's region is selected
            const stateRegion = regions.find(r => r.states.includes(state.properties.name));
            return stateRegion && selectedRegions.has(stateRegion.name);
        }
    });

    if (visibleStates.length === 0) return offscreenPath;

    // Create a GeoJSON feature collection of visible states
    const visibleFeatures = {
        type: "FeatureCollection",
        features: visibleStates
    };

    // Calculate the effective dimensions with padding
    const padding = 100; // 100px padding on all sides
    const effectiveWidth = mapWidth - (padding * 2);
    const effectiveHeight = height - (padding * 2);

    // Create a new projection
    const projection = d3.geoAlbersUsa();

    // Use fitSize to automatically calculate the appropriate scale and translation
    projection.fitSize([effectiveWidth, effectiveHeight], visibleFeatures);

    // Get the calculated values
    const scale = projection.scale();
    const [tx, ty] = projection.translate();

    // Create the final projection with adjusted translation to account for padding
    const newProjection = d3.geoAlbersUsa()
        .scale(scale)
        .translate([tx + padding, ty + padding]);

    debug('Isolation preview adjustments:', {
        effectiveWidth,
        effectiveHeight,
        scale,
        translate: newProjection.translate(),
        visibleStates: visibleStates.length
    });

    // Return a new path generator with the adjusted projection
    return d3.geoPath().projection(newProjection);
} 