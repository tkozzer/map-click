// js/stateSelection.js

import { g, path } from './mapSetup.js';
import { currentColor, defaultStateColor } from './colorPicker.js';
import { showTooltip, hideTooltip, showContextMenu } from './tooltipAndContextMenu.js';
import { updateStateMapKey, removeFromStateMapKey } from './mapKey/stateMapKey.js';
import { isCountyMode } from './main.js';
import {
    handleStateColor,
    createMultiColorPattern,
    clearStateColors,
    isMultiColorMode,
    resetState,
    getStateColors
} from './multiColorState.js';

export let selectedStates = [];
export let stateSelection;

let cmdPressed = false;

document.addEventListener("keydown", function (event) {
    if (event.key === "Meta") {
        cmdPressed = true;
    }
});

document.addEventListener("keyup", function (event) {
    if (event.key === "Meta") {
        cmdPressed = false;
    }
});

function resetStateToDefault(element, d) {
    console.log('Double-click reset:', {
        stateId: d.id,
        stateName: d.properties.name,
        currentColors: getStateColors(d.id)
    });

    // First reset the state colors in our data structure
    resetState(d.id);

    // Find and reset the original state path
    const originalState = d3.select(`path[data-id="${d.id}"]`);
    originalState.style("fill", defaultStateColor)
        .style('opacity', 1)
        .style('pointer-events', 'all');

    // Remove any existing cloned paths
    d3.selectAll(`path[data-clone-for="${d.id}"]`).remove();
    d3.selectAll(`g[data-clone-for="${d.id}"]`).remove();

    // Remove from selected states and map key
    const stateIndex = selectedStates.findIndex(state => state.id === d.id);
    if (stateIndex !== -1) {
        const state = selectedStates[stateIndex];
        if (state.colors) {
            state.colors.forEach(color => removeFromStateMapKey(d, color));
        } else if (state.color) {
            removeFromStateMapKey(d, state.color);
        }
        selectedStates.splice(stateIndex, 1);
    }
}

function toggleStateSelection(element, d) {
    console.log('=== toggleStateSelection START ===');
    console.log('State clicked:', {
        id: d.id,
        name: d.properties.name,
        currentElement: element
    });

    // Get the original state path for consistent color checking
    const originalState = d3.select(`path[data-id="${d.id}"]`);
    const currentFill = originalState.style("fill");
    const defaultColorHex = d3.rgb(defaultStateColor).toString();
    const currentColorHex = d3.rgb(currentColor).toString();

    console.log('Colors:', {
        currentFill,
        defaultColorHex,
        selectedColor: currentColorHex
    });

    const stateIndex = selectedStates.findIndex(state => state.id === d.id);
    console.log('State index in selectedStates:', stateIndex);

    const result = handleStateColor(d.id, currentColorHex);
    console.log('handleStateColor result:', result);

    if (result === null) {
        console.log('Resetting state to default');
        resetStateToDefault(element, d);
    } else if (result && result.type === 'shift') {
        console.log('Processing color shift:', result);
        console.log('Processing color shift for state:', {
            stateName: d.properties.name,
            oldColors: result.oldColors,
            newColors: result.colors,
            details: result.shiftDetails
        });

        // Remove any existing cloned paths
        d3.selectAll(`path[data-clone-for="${d.id}"]`).remove();
        d3.selectAll(`g[data-clone-for="${d.id}"]`).remove();

        const state = d3.select(element);
        const originalPath = state.attr('d');

        // Create container group for the split state
        const container = g.append('g')
            .attr('class', 'split-state')
            .attr('data-clone-for', d.id)
            .on("dblclick", function (event) {
                event.preventDefault();
                event.stopPropagation();
                resetStateToDefault(element, d);
            });

        // Create new pattern for shifted colors
        const splitInfo = createMultiColorPattern(result.colors);
        console.log('New pattern created for shifted colors:', splitInfo);

        // Create two copies of the state path for each color
        const topHalf = container.append('path')
            .attr('d', originalPath)
            .attr('data-clone-type', 'top')
            .attr('data-clone-for', d.id)
            .style('fill', splitInfo.colors[0])
            .style('stroke', '#000000')
            .style('stroke-width', '1px')
            .attr('clip-path', `url(#${splitInfo.topId})`)
            .on("mouseover", function (event) { showTooltip(event, d); })
            .on("mouseout", hideTooltip)
            .on("click", function (event) {
                if (!cmdPressed && !isCountyMode) {
                    toggleStateSelection(this, d);
                }
            })
            .on("contextmenu", function (event) { showContextMenu(event, d); });

        const bottomHalf = container.append('path')
            .attr('d', originalPath)
            .attr('data-clone-type', 'bottom')
            .attr('data-clone-for', d.id)
            .style('fill', splitInfo.colors[1])
            .style('stroke', '#000000')
            .style('stroke-width', '1px')
            .attr('clip-path', `url(#${splitInfo.bottomId})`)
            .on("mouseover", function (event) { showTooltip(event, d); })
            .on("mouseout", hideTooltip)
            .on("click", function (event) {
                if (!cmdPressed && !isCountyMode) {
                    toggleStateSelection(this, d);
                }
            })
            .on("contextmenu", function (event) { showContextMenu(event, d); });

        // Hide the original path but keep it for hit detection
        state.style('opacity', 0)
            .style('pointer-events', 'none');

        // Update selected states and map key
        if (stateIndex !== -1) {
            // Remove old colors from map key
            result.oldColors.forEach(color => removeFromStateMapKey(d, color));
            selectedStates[stateIndex] = { ...d, colors: result.colors };
        }

        // Update map key for current colors
        result.colors.forEach(color => updateStateMapKey(d, color));

        console.log('Color shift completed:', {
            state: d.properties.name,
            finalColors: result.colors
        });
    } else if (Array.isArray(result)) {
        console.log('Processing multi-color state:', result);
        // Multi-color state (first two colors)
        const splitInfo = createMultiColorPattern(result);
        console.log('Split info:', splitInfo);

        // Remove any existing cloned paths
        d3.selectAll(`path[data-clone-for="${d.id}"]`).remove();
        d3.selectAll(`g[data-clone-for="${d.id}"]`).remove();

        const state = d3.select(element);
        const bbox = element.getBBox();
        const originalPath = state.attr('d');

        // Create container group for the split state
        const container = g.append('g')
            .attr('class', 'split-state')
            .attr('data-clone-for', d.id)
            .on("dblclick", function (event) {
                console.log('Double-click detected on cloned state container:', {
                    stateId: d.id,
                    stateName: d.properties.name,
                    event: event.type
                });
                event.preventDefault();
                event.stopPropagation();
                resetStateToDefault(element, d);
            });

        // Create two copies of the state path for each color
        const topHalf = container.append('path')
            .attr('d', originalPath)
            .attr('data-clone-type', 'top')
            .attr('data-clone-for', d.id)
            .style('fill', splitInfo.colors[0])
            .style('stroke', '#000000')
            .style('stroke-width', '1px')
            .attr('clip-path', `url(#${splitInfo.topId})`)
            .on("mouseover", function (event) { showTooltip(event, d); })
            .on("mouseout", hideTooltip)
            .on("click", function (event) {
                if (!cmdPressed && !isCountyMode) {
                    toggleStateSelection(this, d);
                }
            })
            .on("contextmenu", function (event) { showContextMenu(event, d); });

        const bottomHalf = container.append('path')
            .attr('d', originalPath)
            .attr('data-clone-type', 'bottom')
            .attr('data-clone-for', d.id)
            .style('fill', splitInfo.colors[1])
            .style('stroke', '#000000')
            .style('stroke-width', '1px')
            .attr('clip-path', `url(#${splitInfo.bottomId})`)
            .on("mouseover", function (event) { showTooltip(event, d); })
            .on("mouseout", hideTooltip)
            .on("click", function (event) {
                if (!cmdPressed && !isCountyMode) {
                    toggleStateSelection(this, d);
                }
            })
            .on("contextmenu", function (event) { showContextMenu(event, d); });

        // Hide the original path but keep it for hit detection
        state.style('opacity', 0)
            .style('pointer-events', 'all')
            .on("click", function (event) {
                if (!cmdPressed && !isCountyMode) {
                    toggleStateSelection(this, d);
                }
            })
            .on("dblclick", function (event) {
                console.log('Double-click detected on original state:', {
                    stateId: d.id,
                    stateName: d.properties.name,
                    event: event.type
                });
                event.preventDefault();
                event.stopPropagation();
                resetStateToDefault(this, d);
            });

        if (stateIndex === -1) {
            selectedStates.push({ ...d, colors: result });
        } else {
            selectedStates[stateIndex] = { ...d, colors: result };
        }

        // Update map key for both colors
        result.forEach(color => updateStateMapKey(d, color));
    } else {
        console.log('Processing single color state:', result);
        // Single color state
        const originalState = d3.select(`path[data-id="${d.id}"]`);
        originalState.style("fill", result)
            .style('opacity', 1)
            .style('pointer-events', 'all');

        // Also update the clicked element if it's different from the original state
        const clickedElement = d3.select(element);
        if (element !== originalState.node()) {
            clickedElement.style("fill", result)
                .style('opacity', 1)
                .style('pointer-events', 'all');
        }

        // Remove any existing cloned paths
        d3.selectAll(`path[data-clone-for="${d.id}"]`).remove();
        d3.selectAll(`g[data-clone-for="${d.id}"]`).remove();

        if (stateIndex === -1) {
            selectedStates.push({ ...d, color: result });
        } else {
            selectedStates[stateIndex] = { ...d, color: result };
        }
        updateStateMapKey(d, result);
    }

    console.log('=== toggleStateSelection END ===');
}

export function initializeStates(stateFeatures) {
    stateSelection = g.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(stateFeatures)
        .enter().append("path")
        .attr("d", path)
        .attr("data-id", d => d.id)
        .style("fill", defaultStateColor)
        .style("stroke", "#000000")
        .style("stroke-width", "1px")
        .style("display", "none")
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
            if (cmdPressed && !isCountyMode) {
                toggleStateSelection(this, d);
            }
        })
        .on("mouseout", hideTooltip)
        .on("click", function (event, d) {
            if (!cmdPressed && !isCountyMode) {
                toggleStateSelection(this, d);
            }
        })
        .on("dblclick", function (event, d) {
            if (!isCountyMode) {
                console.log('Double-click detected on state:', {
                    stateId: d.id,
                    stateName: d.properties.name,
                    event: event.type
                });
                event.preventDefault();
                event.stopPropagation();
                resetStateToDefault(this, d);
            }
        })
        .on("contextmenu", showContextMenu);
}

export function clearSelectedStates() {
    selectedStates = [];
    clearStateColors();
    // Remove all cloned paths
    d3.selectAll('path[data-clone-for]').remove();
    g.selectAll(".states path")
        .transition()
        .duration(750)
        .style("fill", defaultStateColor)
        .style('opacity', 1);
}

export function selectAllStates() {
    g.selectAll(".states path")
        .each(function (d) {
            const element = this;
            const currentFill = d3.select(element).style("fill");
            const defaultColorHex = d3.rgb(defaultStateColor).toString();
            const currentColorHex = d3.rgb(currentColor).toString();

            if (currentFill === defaultColorHex) {
                d3.select(element).style("fill", currentColorHex);
                selectedStates.push({ ...d, color: currentColorHex });
                updateStateMapKey(d, currentColorHex);
            }
        });
}

export function getSelectedStates() {
    return selectedStates;
}