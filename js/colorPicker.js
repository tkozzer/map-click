// js/colorPicker.js

export let currentColor = '#ff0000';
export let defaultCountyColor = '#f0f0f0';
export let defaultStateColor = '#f0f0f0'; // Add this line

export function initializeColorPicker() {
    d3.selectAll(".color-btn").on("click", function () {
        currentColor = this.style.backgroundColor;
        d3.select("#color-picker").property("value", d3.rgb(currentColor).formatHex());
        d3.select("#hex-color-input").property("value", d3.rgb(currentColor).formatHex().slice(1));
    });

    d3.select("#color-picker").on("input", function () {
        currentColor = this.value;
        d3.select("#hex-color-input").property("value", this.value.slice(1));
    });

    // Add event listener for the random color button
    d3.select("#random-color-btn").on("click", function () {
        const randomColor = generateRandomColor();
        currentColor = randomColor;
        d3.select("#color-picker").property("value", randomColor);
        d3.select("#hex-color-input").property("value", randomColor.slice(1));
    });

    // Add event listener for hex color input
    d3.select("#hex-color-input").on("input", function () {
        let value = this.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
        this.value = value; // Keep the input clean

        // Only update if it's a valid hex color (6 characters)
        if (value.length === 6) {
            currentColor = '#' + value;
            d3.select("#color-picker").property("value", '#' + value);
        }
    });
}

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}