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

    // Define margins and key dimensions
    const margins = {
        left: 100,    // Left margin
        right: 0,     // No right margin since key will be flush with map
        vertical: 100 // Top and bottom margins
    };

    // Calculate map key dimensions
    const hasMapKey = document.querySelector('.map-key') !== null;
    const mapKey = {
        width: hasMapKey ? 180 : 0,  // Width of map key if present
        spacing: 0                    // No space between map and key
    };

    // Calculate the available space for the map
    // The map should extend right up to where the key begins
    const mapSpace = {
        width: hasMapKey ?
            mapWidth - (margins.left + mapKey.width) :  // If key exists, extend map right up to it
            mapWidth - (margins.left + margins.right),  // If no key, use full width minus margins
        height: height - (margins.vertical * 2)
    };

    // Create a new projection
    const projection = d3.geoAlbersUsa();

    // Fit the map to the available space
    projection.fitSize([mapSpace.width, mapSpace.height], visibleFeatures);

    // Get the calculated values
    const scale = projection.scale();
    const [tx, ty] = projection.translate();

    // Create the final projection with adjusted translation
    const newProjection = d3.geoAlbersUsa()
        .scale(scale)
        .translate([tx + margins.left, ty + margins.vertical]);

    debug('Isolation preview adjustments:', {
        mapSpace,
        margins,
        mapKey,
        scale,
        translate: newProjection.translate(),
        visibleStates: visibleStates.length
    });

    // Return a new path generator with the adjusted projection
    return d3.geoPath().projection(newProjection);
} 