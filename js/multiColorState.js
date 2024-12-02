export let isMultiColorMode = false;
export let stateColors = new Map(); // Map<stateId, string[]>

export function initializeMultiColorToggle() {
    const toggle = document.getElementById('multi-color-toggle');
    const checkbox = document.getElementById('multi-color-checkbox');

    // Show/hide toggle based on state mode
    window.addEventListener('statemode', (event) => {
        toggle.classList.toggle('visible', !event.detail.isCountyMode);
    });

    // Handle toggle changes
    checkbox.addEventListener('change', (event) => {
        isMultiColorMode = event.target.checked;
        console.log('Multi-color mode:', isMultiColorMode);
    });
}

export function cleanupMultiColorState(stateId) {
    // Remove any existing cloned paths for this state
    d3.selectAll(`path[data-clone-for="${stateId}"]`).remove();
    d3.selectAll(`g[data-clone-for="${stateId}"]`).remove();

    // Show the original state path
    const originalState = d3.select(`path[data-id="${stateId}"]`);
    originalState.style('opacity', 1)
        .style('pointer-events', 'all');
}

export function handleStateColor(stateId, newColor) {
    console.log('=== handleStateColor START ===');
    console.log('Input:', { stateId, newColor, isMultiColorMode });
    console.log('Current state colors:', stateColors);

    if (!isMultiColorMode) {
        // In single color mode, toggle between new color and default
        const currentColors = stateColors.get(stateId) || [];
        console.log('Single color mode - current colors:', currentColors);

        // Clean up any multi-color state elements
        cleanupMultiColorState(stateId);

        // If the state has the same single color, reset to default
        if (currentColors.length === 1 && currentColors[0] === newColor) {
            stateColors.delete(stateId);
            console.log('Single color mode - resetting to default');
            return null; // Reset to default
        }

        // Always set new color in single color mode, regardless of previous state
        stateColors.set(stateId, [newColor]);
        console.log('Single color mode - setting new color:', newColor);
        return newColor;
    }

    // Multi-color mode
    let colors = stateColors.get(stateId) || [];
    console.log('Multi-color mode - existing colors:', colors);

    // Always set the new color if the state has no colors
    if (colors.length === 0) {
        console.log('Multi-color mode - first color:', newColor);
        stateColors.set(stateId, [newColor]);
        return newColor;
    }

    // If trying to use the same color again, prevent it
    if (colors.includes(newColor)) {
        console.log('Multi-color mode - color already used:', newColor);
        return colors.length > 1 ? colors : colors[0];
    }

    // Add second color if we only have one color
    if (colors.length === 1) {
        colors = [colors[0], newColor];
        console.log('Multi-color mode - adding second color:', colors);
        stateColors.set(stateId, colors);
        return colors;
    }

    // If we have two colors and get a third color:
    // - New color goes on top
    // - Top color moves to bottom
    // - Bottom color gets pushed out
    if (colors.length === 2) {
        const oldColors = [...colors];
        const newColors = [newColor, oldColors[0]];  // New color on top, previous top color moves down

        console.log('Multi-color mode - color shift operation:', {
            oldColors,
            newColors,
            operation: {
                newTopColor: newColor,
                movedToBottom: oldColors[0],
                removedColor: oldColors[1]
            }
        });

        stateColors.set(stateId, newColors);
        const result = {
            type: 'shift',
            colors: newColors,
            oldColors,
            shiftDetails: {
                removedColor: oldColors[1],
                movedColor: oldColors[0],
                newColor: newColor
            }
        };
        console.log('Multi-color mode - shift result:', result);
        return result;
    }

    console.log('=== handleStateColor END ===');
    return colors;
}

export function getStateColors(stateId) {
    return stateColors.get(stateId) || [];
}

export function clearStateColors() {
    stateColors.clear();
}

// Create a pattern for two colors
export function createMultiColorPattern(colors) {
    if (!Array.isArray(colors) || colors.length < 2) {
        console.error('Invalid colors array:', colors);
        return colors[0] || '#f0f0f0'; // Return single color or default
    }

    const clipPathId = `split-${colors[0].replace(/[^a-zA-Z0-9]/g, '')}-${colors[1].replace(/[^a-zA-Z0-9]/g, '')}`;
    console.log('Creating split:', clipPathId);

    // Check if elements already exist
    if (document.getElementById(`${clipPathId}-top`) && document.getElementById(`${clipPathId}-bottom`)) {
        return {
            topId: `${clipPathId}-top`,
            bottomId: `${clipPathId}-bottom`,
            colors: colors
        };
    }

    const svg = d3.select('svg');
    const defs = svg.select('defs').node() ? svg.select('defs') : svg.append('defs');

    // Create clip paths for top and bottom halves
    const clipPathTop = defs.append('clipPath')
        .attr('id', `${clipPathId}-top`)
        .attr('clipPathUnits', 'objectBoundingBox');

    clipPathTop.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 1)
        .attr('height', 0.5);

    const clipPathBottom = defs.append('clipPath')
        .attr('id', `${clipPathId}-bottom`)
        .attr('clipPathUnits', 'objectBoundingBox');

    clipPathBottom.append('rect')
        .attr('x', 0)
        .attr('y', 0.5)
        .attr('width', 1)
        .attr('height', 0.5);

    return {
        topId: `${clipPathId}-top`,
        bottomId: `${clipPathId}-bottom`,
        colors: colors
    };
}

// Add this new function to handle state reset
export function resetState(stateId) {
    stateColors.delete(stateId);
} 