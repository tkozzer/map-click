// js/image/imagePreview.js

import { generateBaseImage } from './baseImage.js';
import { config } from './imageConfig.js';
import { debug, error } from '../config.js';

let currentPreviewSvg = null;

export async function generatePreview(format) {
    debug(`Generating preview for ${format}`);

    try {
        // Remove any existing preview SVG
        if (currentPreviewSvg) {
            currentPreviewSvg.remove();
            currentPreviewSvg = null;
        }

        const { svg, width, height } = await generateBaseImage(config.previewScale);
        currentPreviewSvg = svg;

        const svgNode = svg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        const image = new Image();
        image.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");

            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);

            const dataUrl = canvas.toDataURL(`image/${format}`);
            document.getElementById('imagePreviewContainer').innerHTML = `<img src="${dataUrl}" alt="Map Preview">`;
        };
        image.onerror = function (err) {
            error("Image loading error", err);
            document.getElementById('imagePreviewContainer').innerHTML = 'Error generating preview';
            if (currentPreviewSvg) {
                currentPreviewSvg.remove();
                currentPreviewSvg = null;
            }
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    } catch (err) {
        error("Error generating preview", err);
        document.getElementById('imagePreviewContainer').innerHTML = 'Error generating preview';
        if (currentPreviewSvg) {
            currentPreviewSvg.remove();
            currentPreviewSvg = null;
        }
    }
}

export function cleanupPreview() {
    if (currentPreviewSvg) {
        currentPreviewSvg.remove();
        currentPreviewSvg = null;
    }
}
