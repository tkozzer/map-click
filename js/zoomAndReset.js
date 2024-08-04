import { svg, g, path } from './mapSetup.js';
import { clearSelectedCounties } from './countySelection.js';
import { clearKeyMap } from './keyMap.js';  // Import the new clearKeyMap function

export const zoom = d3.zoom()
    .scaleExtent([0.5, 8])  // Set minimum and maximum zoom levels
    .on("zoom", zoomed);

let initialTransform;
let nationData;

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
    clearSelectedCounties();
    clearKeyMap();  // Clear the key map when resetting the map
}

export function clearMap() {
    clearSelectedCounties();
    clearKeyMap();  // Clear the key map when clearing the map
}

export function recenterMap() {
    const { width, height } = getSvgSize();
    const [[x0, y0], [x1, y1]] = path.bounds(nationData);
    const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
    const translate = [width / 2 - scale * (x0 + x1) / 2, height / 2 - scale * (y0 + y1) / 2];

    svg.transition()
       .duration(750)  // Smooth transition over 750ms
       .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

export function zoomIn() {
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
}

export function zoomOut() {
    svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5);
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