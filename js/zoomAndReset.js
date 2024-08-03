import { svg, g, width, height, projection, path } from './mapSetup.js';
import { clearSelectedCounties } from './countySelection.js';

export const zoom = d3.zoom()
    .scaleExtent([0.5, 8])  // Set minimum and maximum zoom levels
    .on("zoom", zoomed);

let initialTransform;

function zoomed(event) {
    g.attr("transform", event.transform);
}

export function initializeZoom(nation) {
    const [[x0, y0], [x1, y1]] = path.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / width, (y1 - y0) / height);
    const translate = [width / 2 - scale * (x0 + x1) / 2, height / 2 - scale * (y0 + y1) / 2];

    initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.call(zoom)
       .call(zoom.transform, initialTransform);
}

export function resetMap(nation) {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    const [[x0, y0], [x1, y1]] = path.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / newWidth, (y1 - y0) / newHeight);
    const translate = [newWidth / 2 - scale * (x0 + x1) / 2, newHeight / 2 - scale * (y0 + y1) / 2];

    svg.transition()
       .duration(750)  // Smooth transition over 750ms
       .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));

    clearSelectedCounties();
}