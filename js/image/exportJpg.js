// js/image/exportJpg.js

import { generateBaseImage } from './baseImage.js';
import { showSuccessAlert, showErrorAlert } from '../customAlerts.js';
import { debug, error } from '../config.js';

export async function exportJpg() {
    debug("Exporting as JPG");

    const scale = 2; // Adjust the scale as needed for the export
    try {
        const { svg, width, height } = await generateBaseImage(scale);

        const svgNode = svg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);

        debug("Serialized SVG", svgString);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.onload = function () {
            context.drawImage(image, 0, 0);
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filename = `us-county-map-${timestamp}.jpg`;

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL("image/jpeg", 0.9); // Use JPEG format with 90% quality

            debug("Image ready for download");

            link.click();
            svg.remove();

            // Add success alert
            showSuccessAlert(`Successfully exported as JPG: ${filename}`);
        };
        image.onerror = function (err) {
            error("Image loading error", err);
            showErrorAlert("Error exporting as JPG. See console for details.");
        };
        image.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgString)));
        debug("Image source set", image.src);
    } catch (err) {
        error("Error generating base image", err);
        showErrorAlert("Error exporting as JPG. See console for details.");
    }
}
