export let currentColor = '#ff0000';
export let defaultCountyColor = '#f0f0f0';
export let defaultStateColor = '#f0f0f0'; // Add this line

export function initializeColorPicker() {
    d3.selectAll(".color-btn").on("click", function () {
        currentColor = this.style.backgroundColor;
        d3.select("#color-picker").property("value", d3.rgb(currentColor).formatHex());
    });

    d3.select("#color-picker").on("input", function () {
        currentColor = this.value;
    });

    // Add event listener for the random color button
    d3.select("#random-color-btn").on("click", function () {
        const randomColor = generateRandomColor();
        currentColor = randomColor;
        d3.select("#color-picker").property("value", randomColor);
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