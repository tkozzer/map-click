// state.js

import {
    getPropertyValue,
    getLabel,
    getWikipediaLink,
    cleanAmount,
    formatArea,
    searchWikidata
} from './data/wikiData.js';

async function searchWikidataForState(stateName) {
    let searchResults = await searchWikidata(`${stateName} state, United States`);

    if (!searchResults || searchResults.length === 0) {
        console.debug(`No results for ${stateName} state, United States. Trying without 'state'.`);
        searchResults = await searchWikidata(`${stateName}, United States`);
    }

    return searchResults;
}

export async function getStateData(stateName) {
    try {
        console.debug(`Fetching data for ${stateName}`);

        const searchResults = await searchWikidataForState(stateName);

        if (!searchResults || searchResults.length === 0) {
            console.debug(`No results found for ${stateName}.`);
            return null;
        }

        const wikidataId = searchResults[0].id;
        console.debug(`Found Wikidata ID for ${stateName}: ${wikidataId}`);

        const [population, coordinates, area, country, officialWebsite, capital, osmRelationId, wikipediaLink] = await Promise.all([
            getPropertyValue(wikidataId, 'P1082'), // population
            getPropertyValue(wikidataId, 'P625'), // coordinates
            getPropertyValue(wikidataId, 'P2046'), // area
            getPropertyValue(wikidataId, 'P17'), // country
            getPropertyValue(wikidataId, 'P856'), // official website
            getPropertyValue(wikidataId, 'P36'), // capital
            getPropertyValue(wikidataId, 'P402'), // OSM relation ID
            getWikipediaLink(wikidataId) // Wikipedia link
        ]);

        const latitude = coordinates ? coordinates.latitude : null;
        const longitude = coordinates ? coordinates.longitude : null;

        const [countryLabel, capitalLabel, areaFormatted] = await Promise.all([
            getLabel(country),
            getLabel(capital),
            formatArea(area)
        ]);

        const osmRelationUrl = osmRelationId ? `https://www.openstreetmap.org/relation/${osmRelationId}` : 'N/A';

        const data = {
            population: population ? cleanAmount(population.amount) : 'N/A',
            coordinates: { latitude, longitude },
            area: areaFormatted || 'N/A',
            country: countryLabel || 'N/A',
            officialWebsite: officialWebsite || 'N/A',
            capital: capitalLabel || 'N/A',
            osmRelationId: osmRelationId || 'N/A',
            osmRelationUrl: osmRelationUrl,
            wikipediaLink: wikipediaLink || 'N/A'
        };
        console.debug(`Formatted data for ${stateName}:`, data);
        return data;
    } catch (error) {
        console.error('Error in getStateData:', error);
        return null;
    }
}

function displayStateData(data) {
    const dataContainer = document.getElementById('geoEntityData');
    if (data) {
        dataContainer.innerHTML = `
            <h3>State Information</h3>
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
        dataContainer.innerHTML = '<p>No data available for this state.</p>';
    }
}

export async function fetchAndDisplayStateData(stateName) {
    const spinner = document.getElementById('geoEntityDataSpinner');
    const dataContainer = document.getElementById('geoEntityData');

    try {
        spinner.style.display = 'flex';
        dataContainer.innerHTML = '';

        const data = await getStateData(stateName);
        displayStateData(data);
    } catch (error) {
        console.error('Error fetching state data:', error);
        dataContainer.innerHTML = '<p>Error fetching state data.</p>';
    } finally {
        spinner.style.display = 'none';
    }
}