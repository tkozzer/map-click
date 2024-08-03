// colorPicker.js
export let currentColor = "#ff0000";
export const defaultCountyColor = "#f0f0f0";

export function initializeColorPicker() {
    d3.selectAll(".color-btn").on("click", function() {
        currentColor = this.style.backgroundColor;
        d3.select("#color-picker").property("value", d3.rgb(currentColor).formatHex());
    });

    d3.select("#color-picker").on("input", function() {
        currentColor = this.value;
    });
}
