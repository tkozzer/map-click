// zoomAndReset.js
import { svg, g, path } from './mapSetup.js';
import { clearSelectedCounties } from './countySelection.js';

export const zoom = d3.zoom()
    .on("zoom", zoomed);

let initialTransform;

function zoomed(event) {
    const transform = event.transform;
    if (transform.k < initialTransform.k / 2) {
        transform.k = initialTransform.k / 2;
        transform.x = (window.innerWidth / 2) - (window.innerWidth * transform.k / 2);
        transform.y = (window.innerHeight / 2) - (window.innerHeight * transform.k / 2);
    }
    g.attr("transform", transform);
}

export function initializeZoom(nation) {
    const [[x0, y0], [x1, y1]] = path.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / window.innerWidth, (y1 - y0) / window.innerHeight);
    const translate = [(window.innerWidth - scale * (x0 + x1)) / 2, (window.innerHeight - scale * (y0 + y1)) / 2];

    initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.call(zoom.transform, initialTransform);
    zoom.scaleExtent([scale / 2, scale * 8]);
    svg.call(zoom);
}

export function resetMap(nation) {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    const newProjection = d3.geoAlbersUsa()
        .scale(3000)
        .translate([newWidth / 2, newHeight / 2]);

    const newPath = d3.geoPath().projection(newProjection);
    const [[x0, y0], [x1, y1]] = newPath.bounds(nation);
    const scale = 0.95 / Math.max((x1 - x0) / newWidth, (y1 - y0) / newHeight);
    const translate = [(newWidth - scale * (x0 + x1)) / 2, (newHeight - scale * (y0 + y1)) / 2];

    initialTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.call(zoom.transform, initialTransform);
    zoom.scaleExtent([scale / 2, scale * 8]);
    svg.call(zoom);

    clearSelectedCounties();
}
