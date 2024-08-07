import { config, getScaledValue } from './imageConfig.js';
import { g } from '../mapSetup.js';
import { defaultCountyColor } from '../colorPicker.js';
import { getMapKeyEntries, calculateMapKeyWidth, addMapKeyEntries, getMapKeyVisibility } from '../mapKey/mapKey.js';

export async function generateBaseImage(scale) {
    console.debug(`Generating base image with scale ${scale}`);

    const height = getScaledValue(config.baseHeight, scale);
    const mapWidth = getScaledValue(config.baseMapWidth, scale);
    const leftBuffer = getScaledValue(config.baseLeftBuffer, scale);
    let rightBuffer = getScaledValue(config.baseRightBuffer, scale);

    console.debug('Height:', height);
    console.debug('Map Width:', mapWidth);
    console.debug('Left Buffer:', leftBuffer);
    console.debug('Initial Right Buffer:', rightBuffer);

    if (isNaN(height) || isNaN(mapWidth) || isNaN(leftBuffer) || isNaN(rightBuffer)) {
        console.error('Invalid dimensions:', { height, mapWidth, leftBuffer, rightBuffer });
        throw new Error('Invalid dimensions');
    }

    const mapKeyEntries = getMapKeyEntries();
    const hasMapKey = Object.keys(mapKeyEntries).length > 0 && getMapKeyVisibility();
    console.debug('Has Map Key:', hasMapKey);
    console.debug('Map Key Entries:', mapKeyEntries);

    let mapKeyWidth = 0;
    if (hasMapKey) {
        mapKeyWidth = calculateMapKeyWidth(scale);
        console.debug('Calculated Map Key Width:', mapKeyWidth);

        if (isNaN(mapKeyWidth)) {
            console.error('Invalid map key width:', mapKeyWidth);
            mapKeyWidth = 0;
        }

        // Adjust right buffer to accommodate the map key
        rightBuffer = Math.max(rightBuffer, mapKeyWidth + getScaledValue(30, scale)); // 30 is an additional padding
        console.debug('Adjusted Right Buffer:', rightBuffer);

        if (isNaN(rightBuffer)) {
            console.error('Invalid right buffer:', rightBuffer);
            throw new Error('Invalid right buffer');
        }
    }

    const totalWidth = leftBuffer + mapWidth + rightBuffer;
    console.debug('Total Width:', totalWidth);

    if (isNaN(totalWidth)) {
        console.error('Invalid total width:', totalWidth);
        throw new Error('Invalid total width');
    }

    const offscreenSvg = d3.create("svg")
        .attr("width", totalWidth)
        .attr("height", height)
        .attr("xmlns", "http://www.w3.org/2000/svg");

    offscreenSvg.append("rect")
        .attr("width", totalWidth)
        .attr("height", height)
        .attr("fill", "white");

    const offscreenG = offscreenSvg.append("g")
        .attr("transform", `translate(${leftBuffer}, 0)`);

    try {
        const [us, states] = await Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),
            d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
        ]);

        const countyFeatures = topojson.feature(us, us.objects.counties).features;
        const stateFeatures = topojson.feature(states, states.objects.states).features;

        const offscreenProjection = d3.geoAlbersUsa()
            .scale(getScaledValue(1500, scale))
            .translate([mapWidth / 2, height / 2]);

        const offscreenPath = d3.geoPath().projection(offscreenProjection);

        offscreenG.selectAll("path")
            .data(countyFeatures)
            .join("path")
            .attr("class", "county")
            .attr("d", offscreenPath)
            .style("fill", d => {
                const county = g.selectAll("path.county")
                    .filter(function (data) { return data.id === d.id; });
                return !county.empty() ? county.style("fill") : defaultCountyColor;
            })
            .style("stroke", "#7d7d7d")
            .style("stroke-width", `${getScaledValue(config.baseStrokeWidth, scale)}px`);

        offscreenG.selectAll("path.state")
            .data(stateFeatures)
            .join("path")
            .attr("class", "state")
            .attr("d", offscreenPath)
            .style("fill", "none")
            .style("stroke", "#000000")
            .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * 2, scale)}px`);

        if (hasMapKey) {
            const mapKeyStartX = leftBuffer + mapWidth;
            console.debug('Map Key Start X:', mapKeyStartX);
            console.debug('Adding map key with parameters:', {
                startX: mapKeyStartX,
                height,
                mapKeyWidth,
                scale
            });
            addMapKeyEntries(offscreenSvg, mapKeyStartX, height, mapKeyWidth, scale);
        }

        console.debug('Base image generation completed successfully');
        return { svg: offscreenSvg, width: totalWidth, height };
    } catch (error) {
        console.error('Error generating base image:', error);
        throw error;
    }
}