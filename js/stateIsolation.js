import { getIsCountyMode } from './main.js';
import { log } from './config.js';
import { svg, g, path, projection } from './mapSetup.js';
import { zoom, recenterMap } from './zoomAndReset.js';

let stateIsolationModal;
let miniMapSvg;
let regions;
export let selectedRegions = new Set();
export let isCustomMode = false;
export let customSelectedStates = new Set();
export let isIsolationMode = false;

// Add variables to store temporary state
let tempSelectedRegions = new Set();
let tempCustomSelectedStates = new Set();
let tempIsCustomMode = false;

let isolationModeLabel = null;

async function loadRegions() {
    try {
        const response = await fetch('resources/regions.json');
        const data = await response.json();
        regions = data.regions;
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

// Helper function to get region from state name
function getRegionForState(stateName) {
    return regions.find(region => region.states.includes(stateName));
}

function initializeMiniMap() {
    const container = document.getElementById('isolationMapContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear any existing content
    container.innerHTML = '';

    // Create SVG with adjusted viewBox for better centering
    miniMapSvg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 975 610')
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Load and render US map
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        .then(us => {
            const states = topojson.feature(us, us.objects.states);
            const projection = d3.geoAlbersUsa()
                .scale(1300)
                .translate([487, 305]);
            const path = d3.geoPath(projection);

            // Create state paths grouped by region
            regions.forEach(region => {
                const regionGroup = miniMapSvg.append('g')
                    .attr('class', 'region-group')
                    .attr('data-region', region.name);

                regionGroup.selectAll('path')
                    .data(states.features.filter(d => region.states.includes(d.properties.name)))
                    .enter()
                    .append('path')
                    .attr('class', 'mini-map-state')
                    .attr('d', path)
                    .attr('data-state', d => d.properties.name);
            });

            // Add region interaction handlers
            updateMapInteractions();

            // If in isolation mode, restore the current selections
            if (isIsolationMode) {
                selectedRegions.forEach(regionName => {
                    // Update the button state
                    const button = document.querySelector(`.region-buttons .btn[data-region="${regionName}"]`);
                    if (button) {
                        button.classList.add('active');
                    }

                    // Update the mini-map state
                    miniMapSvg.selectAll(`.region-group[data-region="${regionName}"]`)
                        .selectAll('.mini-map-state')
                        .classed('selected', true);
                });
            }
        });
}

function updateMapInteractions() {
    if (isCustomMode) {
        // Disable region selection and enable state selection
        miniMapSvg.selectAll('.region-group')
            .style('pointer-events', 'none')
            .on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);

        miniMapSvg.selectAll('.mini-map-state')
            .style('pointer-events', 'auto')
            .on('mouseover', handleStateHover)
            .on('mouseout', handleStateHoverEnd)
            .on('click', handleStateClick);
    } else {
        // Enable region selection and disable state selection
        miniMapSvg.selectAll('.mini-map-state')
            .style('pointer-events', 'none')
            .on('mouseover', null)
            .on('mouseout', null)
            .on('click', null);

        miniMapSvg.selectAll('.region-group')
            .style('pointer-events', 'auto')
            .on('mouseover', handleRegionHover)
            .on('mouseout', handleRegionHoverEnd)
            .on('click', handleRegionClick);
    }

    updateVisualState();
}

function updateVisualState() {
    // Only update mini-map if it exists
    if (miniMapSvg) {
        // Clear all selections first
        miniMapSvg.selectAll('.mini-map-state')
            .classed('selected', false);

        if (isCustomMode) {
            // In custom mode, show individual state selections
            customSelectedStates.forEach(stateName => {
                miniMapSvg.selectAll('.mini-map-state')
                    .filter(d => d.properties.name === stateName)
                    .classed('selected', true);
            });
            updateSmallStatesButtons();
        } else {
            // In region mode, show region selections
            selectedRegions.forEach(regionName => {
                miniMapSvg.selectAll('.region-group')
                    .filter(function () {
                        return this.getAttribute('data-region') === regionName;
                    })
                    .selectAll('.mini-map-state')
                    .classed('selected', true);
            });
        }
    }

    // Update region buttons to reflect current state
    document.querySelectorAll('.region-buttons .btn[data-region]').forEach(button => {
        const regionName = button.getAttribute('data-region');
        if (selectedRegions.has(regionName)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update apply button state
    updateApplyButtonState();
}

function handleStateClick(event, d) {
    if (!isCustomMode) return;

    const stateName = d.properties.name;
    if (customSelectedStates.has(stateName)) {
        customSelectedStates.delete(stateName);
    } else {
        customSelectedStates.add(stateName);
    }
    updateVisualState();
}

function handleStateHover(event, d) {
    if (!isCustomMode) return;
    d3.select(event.target).classed('highlighted', true);
}

function handleStateHoverEnd(event) {
    if (!isCustomMode) return;
    d3.select(event.target).classed('highlighted', false);
}

function handleRegionHover(event) {
    if (isCustomMode) return;
    const regionGroup = d3.select(event.currentTarget);
    regionGroup.selectAll('.mini-map-state').classed('highlighted', true);
}

function handleRegionHoverEnd(event) {
    if (isCustomMode) return;
    const regionGroup = d3.select(event.currentTarget);
    regionGroup.selectAll('.mini-map-state').classed('highlighted', false);
}

function handleRegionClick(event) {
    if (isCustomMode) return;
    const regionName = event.currentTarget.getAttribute('data-region');
    toggleRegion(regionName);

    // Update the button state
    const button = document.querySelector(`.region-buttons .btn[data-region="${regionName}"]`);
    if (button) {
        button.classList.toggle('active');
    }
}

function toggleRegion(regionName) {
    if (selectedRegions.has(regionName)) {
        selectedRegions.delete(regionName);
        log(`Region Mode: Deselected ${regionName} region`);
    } else {
        selectedRegions.add(regionName);
        log(`Region Mode: Selected ${regionName} region`);
    }
    updateVisualState();
}

function toggleState(stateName) {
    if (customSelectedStates.has(stateName)) {
        customSelectedStates.delete(stateName);
        log(`Custom Mode: Deselected state ${stateName}`);
    } else {
        customSelectedStates.add(stateName);
        log(`Custom Mode: Selected state ${stateName}`);
    }

    // Update small state button appearance
    const stateButton = document.querySelector(`.small-states-buttons .btn[data-state="${stateName}"]`);
    if (stateButton) {
        if (customSelectedStates.has(stateName)) {
            stateButton.classList.add('btn-primary');
            stateButton.classList.remove('btn-outline-primary');
        } else {
            stateButton.classList.remove('btn-primary');
            stateButton.classList.add('btn-outline-primary');
        }
    }

    updateVisualState();
    updateApplyButtonState();
}

function toggleCustomMode() {
    if (isCustomMode) {
        exitCustomMode();
    } else {
        enterCustomMode();
    }
    updateVisualState();
}

export function clearAllSelections() {
    // Clear all selections
    selectedRegions.clear();
    customSelectedStates.clear();
    isCustomMode = false;

    // Reset all UI elements
    // Reset region buttons
    document.querySelectorAll('.region-buttons .btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
        btn.classList.remove('active');
    });

    // Reset custom button
    const customButton = document.getElementById('custom-region-button');
    if (customButton) {
        customButton.classList.remove('btn-primary');
        customButton.classList.add('btn-outline-primary');
        customButton.classList.remove('active');
    }

    // Reset small states list
    const smallStatesList = document.getElementById('small-states-list');
    if (smallStatesList) {
        smallStatesList.style.display = 'none';
        document.querySelectorAll('.small-states-buttons .btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
            btn.classList.remove('active');
        });
    }

    // Reset mini-map if it exists
    if (miniMapSvg) {
        // Clear all state selections
        miniMapSvg.selectAll('.mini-map-state')
            .classed('selected', false);

        // Clear all region selections
        miniMapSvg.selectAll('.region-group')
            .selectAll('.mini-map-state')
            .classed('selected', false);

        // Clear any highlighted states
        miniMapSvg.selectAll('.mini-map-state')
            .classed('highlighted', false);
    }

    // Update visual state and apply button
    updateVisualState();
    updateApplyButtonState();

    log('Cleared all selections');
}

function createIsolationLabel() {
    // Remove any existing label first
    if (isolationModeLabel) {
        isolationModeLabel.remove();
    }

    // Create new label
    const label = document.createElement('div');
    label.className = 'isolation-mode-label';

    const labelText = document.createElement('span');
    labelText.textContent = 'ISOLATION MODE';
    label.appendChild(labelText);

    const closeButton = document.createElement('button');
    closeButton.className = 'isolation-mode-close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Exit isolation mode');
    closeButton.setAttribute('type', 'button');

    // Direct click handler
    const handleClick = () => {
        exitIsolation();
        closeButton.removeEventListener('click', handleClick);
    };

    closeButton.addEventListener('click', handleClick);
    label.appendChild(closeButton);

    // Store the reference
    isolationModeLabel = label;

    document.body.appendChild(label);
    return label;
}

function removeIsolationLabel() {
    if (isolationModeLabel) {
        isolationModeLabel.remove();
        isolationModeLabel = null;
    }
}

function applyIsolation() {
    // Get all selected states (from regions or custom selection)
    const selectedStates = new Set();

    if (isCustomMode) {
        // Use custom selected states
        customSelectedStates.forEach(state => selectedStates.add(state));
        log('Applying Isolation Mode with Custom Selection:');
        log('- Selected States:', Array.from(selectedStates).join(', '));
    } else {
        // Use states from selected regions
        selectedRegions.forEach(regionName => {
            const region = regions.find(r => r.name === regionName);
            if (region) {
                region.states.forEach(state => selectedStates.add(state));
            }
        });
        log('Applying Isolation Mode with Region Selection:');
        log('- Selected Regions:', Array.from(selectedRegions).join(', '));
        log('- Included States:', Array.from(selectedStates).join(', '));
    }

    // Hide state borders for non-selected states
    d3.selectAll('.state-border')
        .style('display', function (d) {
            return selectedStates.has(d.properties.name) ? null : 'none';
        });

    // Handle main state paths
    d3.selectAll('.states path')
        .style('display', function (d) {
            return selectedStates.has(d.properties.name) ? null : 'none';
        });

    // Handle split states if they exist
    d3.selectAll('path[data-clone-for]')
        .style('display', function () {
            const stateId = this.getAttribute('data-clone-for');
            const statePath = d3.select(`path[data-id="${stateId}"]`);
            const stateName = statePath.datum().properties.name;
            return selectedStates.has(stateName) ? null : 'none';
        });

    // Calculate bounds of selected states
    let bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
    d3.selectAll('.states path')
        .filter(d => selectedStates.has(d.properties.name))
        .each(function (d) {
            const b = path.bounds(d);
            bounds[0][0] = Math.min(bounds[0][0], b[0][0]);
            bounds[0][1] = Math.min(bounds[0][1], b[0][1]);
            bounds[1][0] = Math.max(bounds[1][0], b[1][0]);
            bounds[1][1] = Math.max(bounds[1][1], b[1][1]);
        });

    // Calculate the scale and translate to center the region
    const [[x0, y0], [x1, y1]] = bounds;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    // Get the viewport dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Add padding (20% on each side)
    const scale = 0.8 * Math.min(width / dx, height / dy);
    const translate = [width / 2 - scale * x, height / 2 - scale * y + 30];

    // Close the modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById('stateIsolationModal'));
    if (modal) {
        modal.hide();
    }

    // Apply the zoom transform with transition
    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale));

    // Set isolation mode flag
    isIsolationMode = true;
    log('Isolation Mode Enabled');

    // Create and show isolation mode label
    createIsolationLabel();
}

function exitIsolation() {
    // Remove the isolation mode label
    removeIsolationLabel();

    // Show all state paths
    d3.selectAll('.states path')
        .style('display', null);

    // Show all state borders
    d3.selectAll('.state-border')
        .style('display', null);

    // Show all split states
    d3.selectAll('path[data-clone-for]')
        .style('display', null);

    // Reset isolation mode flag first
    isIsolationMode = false;
    log('Isolation Mode Disabled');

    // Reset all state
    selectedRegions.clear();
    customSelectedStates.clear();
    isCustomMode = false;

    // Reset all UI elements
    // Reset region buttons
    document.querySelectorAll('.region-buttons .btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
        btn.classList.remove('active');  // Remove any active state
    });

    // Reset custom button
    const customButton = document.getElementById('custom-region-button');
    if (customButton) {
        customButton.classList.remove('btn-primary');
        customButton.classList.add('btn-outline-primary');
        customButton.classList.remove('active');  // Remove any active state
    }

    // Reset small states list
    const smallStatesList = document.getElementById('small-states-list');
    if (smallStatesList) {
        smallStatesList.style.display = 'none';
        document.querySelectorAll('.small-states-buttons .btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
            btn.classList.remove('active');  // Remove any active state
        });
    }

    // Reset mini-map if it exists
    if (miniMapSvg) {
        miniMapSvg.selectAll('.mini-map-state')
            .classed('selected', false);
        miniMapSvg.selectAll('.region-group')
            .selectAll('.mini-map-state')
            .classed('selected', false);
    }

    // Update visual state and apply button
    updateVisualState();
    updateApplyButtonState();

    // Recenter the map to show entire US
    recenterMap();
}

function enterCustomMode() {
    isCustomMode = true;
    log('Entered Custom Mode');

    // Show small states list
    document.getElementById('small-states-list').style.display = 'block';

    // Update custom button state
    const customButton = document.getElementById('custom-region-button');
    customButton.classList.add('btn-primary');
    customButton.classList.remove('btn-outline-primary');

    // Convert all selected regions to individual state selections
    selectedRegions.forEach(regionName => {
        const region = regions.find(r => r.name === regionName);
        if (region) {
            region.states.forEach(stateName => {
                customSelectedStates.add(stateName);
            });
        }
    });

    // Update map interactions
    updateMapInteractions();
    updateVisualState();
}

function exitCustomMode() {
    isCustomMode = false;
    log('Exited Custom Mode');

    // Hide small states list
    document.getElementById('small-states-list').style.display = 'none';

    // Update custom button state
    const customButton = document.getElementById('custom-region-button');
    customButton.classList.remove('btn-primary');
    customButton.classList.add('btn-outline-primary');

    // Clear custom selections
    customSelectedStates.clear();

    // Update map interactions
    updateMapInteractions();
    updateVisualState();
}

function updateSmallStatesButtons() {
    document.querySelectorAll('.small-states-buttons .btn').forEach(button => {
        const stateName = button.dataset.state;
        if (customSelectedStates.has(stateName)) {
            button.classList.add('btn-primary');
            button.classList.remove('btn-outline-primary');
        } else {
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        }
    });
}

function showIsolationModal() {
    // Initialize or get the modal
    if (!stateIsolationModal) {
        stateIsolationModal = new bootstrap.Modal(document.getElementById('stateIsolationModal'));
    }

    // Store current state when opening modal
    tempSelectedRegions = new Set(selectedRegions);
    tempCustomSelectedStates = new Set(customSelectedStates);
    tempIsCustomMode = isCustomMode;

    // If we're in isolation mode, ensure the current mode and selections are reflected
    if (isIsolationMode) {
        if (isCustomMode) {
            enterCustomMode();
        } else {
            exitCustomMode();
        }
        updateVisualState();
    }

    // Show the modal
    stateIsolationModal.show();
}

// Export the showIsolationModal function
export { showIsolationModal };

function handleRegionButtonClick(event) {
    const regionName = event.target.getAttribute('data-region');
    if (!regionName) return;

    if (selectedRegions.has(regionName)) {
        selectedRegions.delete(regionName);
        event.target.classList.remove('active');
        log(`Region Mode: Deselected ${regionName} region`);
    } else {
        selectedRegions.add(regionName);
        event.target.classList.add('active');
        log(`Region Mode: Selected ${regionName} region`);
    }

    // Update the mini-map to reflect the selection
    miniMapSvg.selectAll('.region-group')
        .filter(function () {
            return this.getAttribute('data-region') === regionName;
        })
        .selectAll('.mini-map-state')
        .classed('selected', selectedRegions.has(regionName));

    // Update apply button state
    updateApplyButtonState();
}

function updateApplyButtonState() {
    const applyButton = document.getElementById('applyIsolationButton');
    const hasSelections = isCustomMode ? customSelectedStates.size > 0 : selectedRegions.size > 0;

    if (hasSelections) {
        applyButton.classList.remove('disabled');
        applyButton.removeAttribute('disabled');
    } else {
        applyButton.classList.add('disabled');
        applyButton.setAttribute('disabled', '');
    }
}

export function initializeStateIsolation() {
    const isolateButton = document.getElementById('isolate-button');
    const modalElement = document.getElementById('stateIsolationModal');
    const customButton = document.getElementById('custom-region-button');
    const clearAllButton = document.getElementById('clearAllSelectionsButton');

    // Initialize Bootstrap modal
    stateIsolationModal = new bootstrap.Modal(modalElement, {
        keyboard: true,
        backdrop: true
    });

    // Handle isolate button click
    isolateButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (getIsCountyMode() || isolateButton.classList.contains('disabled')) {
            return;
        }

        const gearDropdown = document.querySelector('.gear-dropdown');
        if (gearDropdown) {
            gearDropdown.style.display = 'none';
        }

        // Store current state when opening modal
        tempSelectedRegions = new Set(selectedRegions);
        tempCustomSelectedStates = new Set(customSelectedStates);
        tempIsCustomMode = isCustomMode;

        stateIsolationModal.show();
    });

    // Initialize mini map when modal is shown
    modalElement.addEventListener('shown.bs.modal', () => {
        initializeMiniMap();
    });

    // Handle modal close without applying
    modalElement.addEventListener('hidden.bs.modal', () => {
        // Always restore the previous state when closing without applying
        selectedRegions = new Set(tempSelectedRegions);
        customSelectedStates = new Set(tempCustomSelectedStates);
        isCustomMode = tempIsCustomMode;

        updateVisualState();
        updateApplyButtonState();
    });

    // Handle region button clicks
    document.querySelectorAll('.region-buttons .btn[data-region]').forEach(button => {
        button.addEventListener('click', handleRegionButtonClick);
    });

    // Handle small states button clicks
    document.querySelectorAll('.small-states-buttons .btn').forEach(button => {
        button.addEventListener('click', () => {
            if (isCustomMode) {
                const stateName = button.dataset.state;
                toggleState(stateName);
            }
        });
    });

    // Handle custom button click
    customButton.addEventListener('click', toggleCustomMode);

    // Handle clear all button click
    clearAllButton.addEventListener('click', clearAllSelections);

    // Handle apply button click
    document.getElementById('applyIsolationButton').addEventListener('click', () => {
        const hasSelections = isCustomMode ? customSelectedStates.size > 0 : selectedRegions.size > 0;
        if (hasSelections) {
            // Update the temporary state with current selections
            tempSelectedRegions = new Set(selectedRegions);
            tempCustomSelectedStates = new Set(customSelectedStates);
            tempIsCustomMode = isCustomMode;

            applyIsolation();
        }
    });

    // Load regions data
    loadRegions();
} 