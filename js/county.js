// js/county.js

import {
    getPropertyValueBatch,
    getLabel,
    getWikipediaLink,
    cleanAmount,
    formatArea,
    searchWikidata
} from './data/wikiData.js';
import { alaskaData } from './data/alaska.js';
import { debug, error } from './config.js';

let errorLog = [];

function getRegionType(stateName) {
    if (stateName.toLowerCase() === 'louisiana') {
        return 'Parish';
    } else if (stateName.toLowerCase() === 'alaska') {
        return 'Borough/Census Area/Municipality';
    }
    return 'County';
}

async function searchWikidataForCounty(countyName, stateName, regionType) {
    let searchQueries = [
        `${countyName} ${regionType}, ${stateName}`,
        `${countyName}, ${stateName}`,
        countyName
    ];

    for (let query of searchQueries) {
        let searchResults = await searchWikidata(query);
        if (searchResults && searchResults.length > 0) {
            debug(`Found results for query: ${query}`);
            return searchResults;
        }
    }

    debug(`No results found for ${countyName}`);
    return null;
}

export async function getCountyData(countyName, stateName) {
    try {
        const regionType = getRegionType(stateName);
        debug(`Fetching data for ${countyName} ${regionType}, ${stateName}`);

        let wikidataId;
        let wikipediaLink;

        if (stateName.toLowerCase() === 'alaska') {
            const alaskaCounty = alaskaData.find(county =>
                county.name.toLowerCase().includes(countyName.toLowerCase()) ||
                countyName.toLowerCase().includes(county.name.toLowerCase())
            );
            if (alaskaCounty) {
                wikidataId = alaskaCounty.entity_id;
                wikipediaLink = alaskaCounty.wikipedia_link;
                countyName = alaskaCounty.name; // Use the full name from the data
            } else {
                throw new Error(`No data found for ${countyName} in Alaska`);
            }
        } else {
            const searchResults = await searchWikidataForCounty(countyName, stateName, regionType);
            if (!searchResults) {
                throw new Error(`No results found for ${countyName}`);
            }
            wikidataId = searchResults[0].id;
            wikipediaLink = await getWikipediaLink(wikidataId);
        }

        debug(`Found Wikidata ID for ${countyName}: ${wikidataId}`);

        const propertyIds = ['P1082', 'P625', 'P2046', 'P17', 'P856', 'P36', 'P402'];
        const propertyValues = await getPropertyValueBatch(wikidataId, propertyIds);

        const data = {
            name: countyName,
            population: propertyValues.P1082 ? cleanAmount(propertyValues.P1082.amount) : 'N/A',
            coordinates: propertyValues.P625 ? { latitude: propertyValues.P625.latitude, longitude: propertyValues.P625.longitude } : { latitude: 'N/A', longitude: 'N/A' },
            area: await formatArea(propertyValues.P2046) || 'N/A',
            country: propertyValues.P17 ? await getLabel(propertyValues.P17) : 'N/A',
            officialWebsite: propertyValues.P856 || 'N/A',
            capital: propertyValues.P36 ? await getLabel(propertyValues.P36) : 'N/A',
            osmRelationId: propertyValues.P402 || 'N/A',
            osmRelationUrl: propertyValues.P402 ? `https://www.openstreetmap.org/relation/${propertyValues.P402}` : 'N/A',
            wikipediaLink: wikipediaLink || 'N/A'
        };

        debug(`Formatted data for ${countyName}:`, data);
        return data;
    } catch (err) {
        error('Error in getCountyData:', err);
        errorLog.push({
            countyName: countyName,
            stateName: stateName,
            error: err.message,
            wikidataUrl: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(countyName + ' ' + stateName)}&go=Go`
        });
        return null;
    }
}

function displayCountyData(data) {
    const dataContainer = document.getElementById('geoEntityData');
    if (data) {
        dataContainer.innerHTML = `
            <h3>County Information</h3>
            <p><strong>Population:</strong> ${data.population}</p>
            <p><strong>Coordinates:</strong> ${data.coordinates.latitude}, ${data.coordinates.longitude}</p>
            <p><strong>Area:</strong> ${data.area.value} ${data.area.unit}</p>
            <p><strong>Country:</strong> ${data.country}</p>
            <p><strong>Official Website:</strong> ${data.officialWebsite !== 'N/A' ? `<a href="${data.officialWebsite}" target="_blank">${data.officialWebsite}</a>` : 'N/A'}</p>
            <p><strong>Capital:</strong> ${data.capital}</p>
            <p><strong>OSM Relation:</strong> ${data.osmRelationUrl !== 'N/A' ? `<a href="${data.osmRelationUrl}" target="_blank">${data.osmRelationUrl}</a>` : 'N/A'}</p>
            <p><strong>Wikipedia:</strong> ${data.wikipediaLink !== 'N/A' ? `<a href="${data.wikipediaLink}" target="_blank">${data.wikipediaLink}</a>` : 'N/A'}</p>
        `;
    } else {
        dataContainer.innerHTML = '<p>No data available for this county.</p>';
    }
}

export async function fetchAndDisplayCountyData(countyName, stateName) {
    const spinner = document.getElementById('geoEntityDataSpinner');
    const dataContainer = document.getElementById('geoEntityData');

    try {
        spinner.style.display = 'flex';
        dataContainer.innerHTML = '';

        const data = await getCountyData(countyName, stateName);
        displayCountyData(data);
    } catch (err) {
        error('Error fetching county data:', err);
        dataContainer.innerHTML = '<p>Error fetching county data.</p>';
    } finally {
        spinner.style.display = 'none';
    }
}

export function getErrorLog() {
    return errorLog;
}

export function clearErrorLog() {
    errorLog = [];
}