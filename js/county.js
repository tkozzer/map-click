// county.js

import {
    getPropertyValueBatch,
    getLabel,
    getWikipediaLink,
    cleanAmount,
    formatArea,
    searchWikidata
} from './data/wikiData.js';

async function searchWikidataForCounty(countyName, stateName, regionType) {
    let searchResults = await searchWikidata(`${countyName} ${regionType}, ${stateName}`);

    if (!searchResults || searchResults.length === 0) {
        console.debug(`No results for ${countyName} ${regionType}, ${stateName}. Trying without ${regionType}.`);
        searchResults = await searchWikidata(`${countyName}, ${stateName}`);
    }

    if (!searchResults || searchResults.length === 0) {
        console.debug(`No results for ${countyName}, ${stateName}. Trying with just the county name.`);
        searchResults = await searchWikidata(countyName);
    }

    return searchResults;
}

export async function getCountyData(countyName, stateName) {
    try {
        const isLouisiana = stateName.toLowerCase() === 'louisiana';
        const regionType = isLouisiana ? 'Parish' : 'County';
        console.debug(`Fetching data for ${countyName} ${regionType}, ${stateName}`);

        const searchResults = await searchWikidataForCounty(countyName, stateName, regionType);

        if (!searchResults || searchResults.length === 0) {
            console.debug(`No results found for ${countyName}.`);
            return null;
        }

        const wikidataId = searchResults[0].id;
        console.debug(`Found Wikidata ID for ${countyName}: ${wikidataId}`);

        const propertyIds = ['P1082', 'P625', 'P2046', 'P17', 'P856', 'P36', 'P402'];
        const propertyValues = await getPropertyValueBatch(wikidataId, propertyIds);

        const latitude = propertyValues.P625 ? propertyValues.P625.latitude : null;
        const longitude = propertyValues.P625 ? propertyValues.P625.longitude : null;

        const [countryLabel, capitalLabel, areaFormatted, wikipediaLink] = await Promise.all([
            getLabel(propertyValues.P17),
            getLabel(propertyValues.P36),
            formatArea(propertyValues.P2046),
            getWikipediaLink(wikidataId)
        ]);

        const osmRelationUrl = propertyValues.P402 ? `https://www.openstreetmap.org/relation/${propertyValues.P402}` : 'N/A';

        const data = {
            population: propertyValues.P1082 ? cleanAmount(propertyValues.P1082.amount) : 'N/A',
            coordinates: { latitude, longitude },
            area: areaFormatted || 'N/A',
            country: countryLabel || 'N/A',
            officialWebsite: propertyValues.P856 || 'N/A',
            capital: capitalLabel || 'N/A',
            osmRelationId: propertyValues.P402 || 'N/A',
            osmRelationUrl: osmRelationUrl,
            wikipediaLink: wikipediaLink || 'N/A'
        };
        console.debug(`Formatted data for ${countyName}:`, data);
        return data;
    } catch (error) {
        console.error('Error in getCountyData:', error);
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
    } catch (error) {
        console.error('Error fetching county data:', error);
        dataContainer.innerHTML = '<p>Error fetching county data.</p>';
    } finally {
        spinner.style.display = 'none';
    }
}