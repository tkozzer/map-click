// js/image/baseImage.js

import { config, getScaledValue } from './imageConfig.js';
import { g } from '../mapSetup.js';
import { defaultCountyColor, defaultStateColor } from '../colorPicker.js';
import { getCountyMapKeyEntries, calculateCountyMapKeyWidth, addCountyMapKeyEntries, getCountyMapKeyVisibility } from '../mapKey/countyMapKey.js';
import { getStateMapKeyEntries, calculateStateMapKeyWidth, addStateMapKeyEntries, getStateMapKeyVisibility } from '../mapKey/stateMapKey.js';
import { getIsCountyMode } from '../main.js';

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

    const isCountyMode = getIsCountyMode();
    const mapKeyEntries = isCountyMode ? getCountyMapKeyEntries() : getStateMapKeyEntries();
    const hasMapKey = Object.keys(mapKeyEntries).length > 0 && (isCountyMode ? getCountyMapKeyVisibility() : getStateMapKeyVisibility());
    console.debug('Has Map Key:', hasMapKey);
    console.debug('Map Key Entries:', mapKeyEntries);

    let mapKeyWidth = 0;
    if (hasMapKey) {
        mapKeyWidth = isCountyMode ? calculateCountyMapKeyWidth(scale) : calculateStateMapKeyWidth(scale);
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

        if (isCountyMode) {
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
        } else {
            offscreenG.selectAll("path")
                .data(stateFeatures)
                .join("path")
                .attr("class", "state")
                .attr("d", offscreenPath)
                .style("fill", d => {
                    const state = g.selectAll(".states path")
                        .filter(function (data) { return data.id === d.id; });
                    return !state.empty() ? state.style("fill") : defaultStateColor;
                })
                .style("stroke", "#000000")
                .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * 2, scale)}px`);
        }

        // Always draw state borders
        offscreenG.append("g")
            .selectAll("path")
            .data(stateFeatures)
            .join("path")
            .attr("class", "state-border")
            .attr("d", offscreenPath)
            .style("fill", "none")
            .style("stroke", "#000000")
            .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * (isCountyMode ? 1 : 2), scale)}px`);

        if (hasMapKey) {
            const mapKeyStartX = leftBuffer + mapWidth;
            console.debug('Map Key Start X:', mapKeyStartX);
            console.debug('Adding map key with parameters:', {
                startX: mapKeyStartX,
                height,
                mapKeyWidth,
                scale
            });
            if (isCountyMode) {
                addCountyMapKeyEntries(offscreenSvg, mapKeyStartX, height, mapKeyWidth, scale);
            } else {
                addStateMapKeyEntries(offscreenSvg, mapKeyStartX, height, mapKeyWidth, scale);
            }
        }

        console.debug('Base image generation completed successfully');
        return { svg: offscreenSvg, width: totalWidth, height };
    } catch (error) {
        console.error('Error generating base image:', error);
        throw error;
    }
}