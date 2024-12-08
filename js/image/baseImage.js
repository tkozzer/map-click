// js/image/baseImage.js

import { config, getScaledValue } from './imageConfig.js';
import { g } from '../mapSetup.js';
import { defaultCountyColor, defaultStateColor } from '../colorPicker.js';
import { getCountyMapKeyEntries, calculateCountyMapKeyWidth, addCountyMapKeyEntries, getCountyMapKeyVisibility } from '../mapKey/countyMapKey.js';
import { getStateMapKeyEntries, calculateStateMapKeyWidth, addStateMapKeyEntries, getStateMapKeyVisibility } from '../mapKey/stateMapKey.js';
import { getIsCountyMode } from '../main.js';
import { debug, error } from '../config.js';
import { isIsolationMode, selectedRegions, customSelectedStates, isCustomMode } from '../stateIsolation.js';
import { adjustProjectionForIsolation } from './isolationPreview.js';
import { regions } from '../data/regions.js';

export async function generateBaseImage(scale) {

    // Check if regions are loaded
    if (regions.length === 0) {
        error('Regions not loaded');
    }

    debug(`Generating base image with scale ${scale}`);

    const height = getScaledValue(config.baseHeight, scale);
    const mapWidth = getScaledValue(config.baseMapWidth, scale);
    const leftBuffer = getScaledValue(config.baseLeftBuffer, scale);
    let rightBuffer = getScaledValue(config.baseRightBuffer, scale);

    debug('Height:', height);
    debug('Map Width:', mapWidth);
    debug('Left Buffer:', leftBuffer);
    debug('Initial Right Buffer:', rightBuffer);

    if (isNaN(height) || isNaN(mapWidth) || isNaN(leftBuffer) || isNaN(rightBuffer)) {
        error('Invalid dimensions:', { height, mapWidth, leftBuffer, rightBuffer });
        throw new Error('Invalid dimensions');
    }

    const isCountyMode = getIsCountyMode();
    const mapKeyEntries = isCountyMode ? getCountyMapKeyEntries() : getStateMapKeyEntries();
    const hasMapKey = Object.keys(mapKeyEntries).length > 0 && (isCountyMode ? getCountyMapKeyVisibility() : getStateMapKeyVisibility());
    debug('Has Map Key:', hasMapKey);
    debug('Map Key Entries:', mapKeyEntries);

    let mapKeyWidth = 0;
    if (hasMapKey) {
        mapKeyWidth = isCountyMode ? calculateCountyMapKeyWidth(scale) : calculateStateMapKeyWidth(scale);
        debug('Calculated Map Key Width:', mapKeyWidth);

        if (isNaN(mapKeyWidth)) {
            error('Invalid map key width:', mapKeyWidth);
            mapKeyWidth = 0;
        }

        // Adjust right buffer to accommodate the map key
        // In isolation mode, we don't want extra padding between map and key
        const keyPadding = isIsolationMode ? 0 : getScaledValue(30, scale);
        rightBuffer = Math.max(rightBuffer, mapKeyWidth + keyPadding);
        debug('Adjusted Right Buffer:', rightBuffer);

        if (isNaN(rightBuffer)) {
            error('Invalid right buffer:', rightBuffer);
            throw new Error('Invalid right buffer');
        }
    }

    const totalWidth = leftBuffer + mapWidth + rightBuffer;
    debug('Total Width:', totalWidth);

    if (isNaN(totalWidth)) {
        error('Invalid total width:', totalWidth);
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

        // Helper function to check if a state should be visible in isolation mode
        const isStateVisible = (stateId) => {
            if (!isIsolationMode) return true;
            const state = stateFeatures.find(s => s.id === stateId);
            if (!state) return false;

            if (isCustomMode) {
                return customSelectedStates.has(state.properties.name);
            } else {
                // Check if the state's region is selected
                const stateRegion = regions.find(r => r.states.includes(state.properties.name));
                return stateRegion && selectedRegions.has(stateRegion.name);
            }
        };

        const offscreenProjection = d3.geoAlbersUsa()
            .scale(getScaledValue(1500, scale))
            .translate([mapWidth / 2, height / 2]);

        const offscreenPath = d3.geoPath().projection(offscreenProjection);

        // If in isolation mode, adjust the projection
        const adjustedPath = await adjustProjectionForIsolation(
            stateFeatures,
            offscreenPath,
            mapWidth,
            height,
            scale
        );

        if (isCountyMode) {
            offscreenG.selectAll("path")
                .data(countyFeatures)
                .join("path")
                .attr("class", "county")
                .attr("d", adjustedPath)
                .style("fill", d => {
                    const county = g.selectAll("path.county")
                        .filter(function (data) { return data.id === d.id; });
                    return !county.empty() ? county.style("fill") : defaultCountyColor;
                })
                .style("stroke", "#7d7d7d")
                .style("stroke-width", `${getScaledValue(config.baseStrokeWidth, scale)}px`);
        } else {
            // First create the defs section for patterns
            const defs = offscreenSvg.append("defs");

            // Draw base states first
            offscreenG.selectAll("path.state-base")
                .data(stateFeatures)
                .join("path")
                .attr("class", "state-base")
                .attr("d", adjustedPath)
                .style("display", d => isStateVisible(d.id) ? null : "none")
                .style("fill", d => {
                    const clonedPaths = d3.selectAll(`path[data-clone-for="${d.id}"]`);
                    if (!clonedPaths.empty()) {
                        return "none"; // Will be handled by the split paths
                    }
                    const state = g.selectAll(".states path")
                        .filter(function (data) { return data.id === d.id; });
                    return !state.empty() ? state.style("fill") : defaultStateColor;
                })
                .style("stroke", "#000000")
                .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * 2, scale)}px`);

            // Handle multi-colored states
            stateFeatures.forEach(d => {
                // Skip if state should not be visible in isolation mode
                if (!isStateVisible(d.id)) return;

                const clonedPaths = d3.selectAll(`path[data-clone-for="${d.id}"]`);
                if (!clonedPaths.empty()) {
                    const topPath = clonedPaths.filter('[data-clone-type="top"]');
                    const bottomPath = clonedPaths.filter('[data-clone-type="bottom"]');

                    if (!topPath.empty() && !bottomPath.empty()) {
                        const topColor = topPath.style("fill");
                        const bottomColor = bottomPath.style("fill");

                        // Create clip paths for this state
                        const clipPathTop = defs.append("clipPath")
                            .attr("id", `export-clip-top-${d.id}`)
                            .attr("clipPathUnits", "objectBoundingBox");

                        clipPathTop.append("rect")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", 1)
                            .attr("height", 0.5);

                        const clipPathBottom = defs.append("clipPath")
                            .attr("id", `export-clip-bottom-${d.id}`)
                            .attr("clipPathUnits", "objectBoundingBox");

                        clipPathBottom.append("rect")
                            .attr("x", 0)
                            .attr("y", 0.5)
                            .attr("width", 1)
                            .attr("height", 0.5);

                        // Create the split paths
                        offscreenG.append("path")
                            .attr("d", adjustedPath(d))
                            .style("fill", topColor)
                            .attr("clip-path", `url(#export-clip-top-${d.id})`)
                            .style("stroke", "none");

                        offscreenG.append("path")
                            .attr("d", adjustedPath(d))
                            .style("fill", bottomColor)
                            .attr("clip-path", `url(#export-clip-bottom-${d.id})`)
                            .style("stroke", "none");

                        // Add stroke on top
                        offscreenG.append("path")
                            .attr("d", adjustedPath(d))
                            .style("fill", "none")
                            .style("stroke", "#000000")
                            .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * 2, scale)}px`);
                    }
                }
            });
        }

        // Always draw state borders, but respect isolation mode
        offscreenG.append("g")
            .selectAll("path")
            .data(stateFeatures)
            .join("path")
            .attr("class", "state-border")
            .attr("d", adjustedPath)
            .style("display", d => isStateVisible(d.id) ? null : "none")
            .style("fill", "none")
            .style("stroke", "#000000")
            .style("stroke-width", `${getScaledValue(config.baseStrokeWidth * (isCountyMode ? 1 : 2), scale)}px`);

        if (hasMapKey) {
            const mapKeyStartX = leftBuffer + mapWidth;
            debug('Map Key Start X:', mapKeyStartX);
            debug('Adding map key with parameters:', {
                mapKeyStartX,
                svgHeight: height,
                keyMapWidth: mapKeyWidth,
                scale
            });
            if (isCountyMode) {
                addCountyMapKeyEntries(offscreenSvg, mapKeyStartX, height, mapKeyWidth, scale);
            } else {
                addStateMapKeyEntries(offscreenSvg, mapKeyStartX, height, mapKeyWidth, scale);
            }
        }

        debug('Base image generation completed successfully');
        return { svg: offscreenSvg, width: totalWidth, height };
    } catch (err) {
        error('Error generating base image:', err);
        throw err;
    }
}