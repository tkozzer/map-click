// js/zoomAndReset.js

import { svg, g, path } from './mapSetup.js';
import {
    isIsolationMode,
    selectedRegions,
    customSelectedStates,
    isCustomMode
} from './stateIsolation.js';
import { regions } from './data/regions.js';

let initialTransform;
let nationData;

export const zoom = d3.zoom()
    .scaleExtent([0.3, 8])  // Lowered minimum zoom level from 0.5 to 0.3
    .on("zoom", zoomed)
    .filter(event => {
        // Disable double-click zoom
        if (event.type === 'dblclick') {
            return false;
        }
        // Allow all other zoom events (wheel, pinch, etc.)
        return !event.ctrlKey && !event.button;
    });

function zoomed(event) {
    g.attr("transform", event.transform);
}

export function initializeZoom(nation) {
    nationData = nation;
    const { width, height } = getSvgSize();
    const [[x0, y0], [x1, y1]] = path.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
    const translate = [width / 2 - scale * (x0 + x1) / 2, height / 2 - scale * (y0 + y1) / 2];

    initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.call(zoom)
        .call(zoom.transform, initialTransform);

    // Add window resize event listener
    window.addEventListener('resize', handleWindowResize);
}

export function resetMap() {
    recenterMap();
}

export function recenterMap() {
    if (!isIsolationMode) {
        // Standard mode - center on entire US
        const { width, height } = getSvgSize();
        const [[x0, y0], [x1, y1]] = path.bounds(nationData);
        const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
        const translate = [width / 2 - scale * (x0 + x1) / 2, height / 2 - scale * (y0 + y1) / 2];

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    } else {
        // Isolation mode - center on selected region(s)
        const { width, height } = getSvgSize();

        // Calculate bounds of selected states
        let bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
        const selectedStates = new Set();

        if (isCustomMode) {
            customSelectedStates.forEach(state => selectedStates.add(state));
        } else {
            selectedRegions.forEach(regionName => {
                const region = regions.find(r => r.name === regionName);
                if (region) {
                    region.states.forEach(state => selectedStates.add(state));
                }
            });
        }

        // Get bounds of selected states
        d3.selectAll('.states path')
            .filter(d => selectedStates.has(d.properties.name))
            .each(function (d) {
                const b = path.bounds(d);
                bounds[0][0] = Math.min(bounds[0][0], b[0][0]);
                bounds[0][1] = Math.min(bounds[0][1], b[0][1]);
                bounds[1][0] = Math.max(bounds[1][0], b[1][0]);
                bounds[1][1] = Math.max(bounds[1][1], b[1][1]);
            });

        const [[x0, y0], [x1, y1]] = bounds;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;

        // Add padding (20% on each side)
        const scale = 0.8 * Math.min(width / dx, height / dy);
        const translate = [width / 2 - scale * x, height / 2 - scale * y + 30]; // Added 30px vertical offset for toolbar

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
}

export function zoomIn() {
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
}

export function zoomOut() {
    svg.transition().duration(300).call(zoom.scaleBy, 0.5);  // Changed from 1/1.5 to 0.5 for more aggressive zoom out
}

function handleWindowResize() {
    const { width, height } = getSvgSize();
    svg.attr("width", width).attr("height", height);

    const [[x0, y0], [x1, y1]] = path.bounds(nationData);
    const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
    const translate = [width / 2 - scale * (x0 + x1) / 2, height / 2 - scale * (y0 + y1) / 2];

    // Get the current zoom state
    const currentTransform = d3.zoomTransform(svg.node());

    // Calculate the new transform
    const newTransform = d3.zoomIdentity
        .translate(translate[0], translate[1])
        .scale(scale)
        .scale(currentTransform.k / scale)
        .translate(
            (currentTransform.x - translate[0]) / (currentTransform.k / scale),
            (currentTransform.y - translate[1]) / (currentTransform.k / scale)
        );

    // Apply the new transform with a smooth transition
    svg.transition()
        .duration(300)
        .call(zoom.transform, newTransform);
}

function getSvgSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

export function cleanupZoom() {
    window.removeEventListener('resize', handleWindowResize);
}