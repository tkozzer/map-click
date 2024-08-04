async function getPropertyValue(entityId, propertyId) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=${propertyId}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.claims && data.claims[propertyId]) {
        return data.claims[propertyId][0].mainsnak.datavalue.value;
    }
    return null;
}

async function getLabel(entityId) {
    if (typeof entityId === 'object' && entityId.id) {
        entityId = entityId.id;
    }
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels&languages=en&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.entities && data.entities[entityId]) {
        return data.entities[entityId].labels.en.value;
    }
    return null;
}

async function getWikipediaLink(entityId) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks/urls&sitefilter=enwiki&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.entities && data.entities[entityId]) {
        const sitelinks = data.entities[entityId].sitelinks;
        if (sitelinks && sitelinks.enwiki) {
            return sitelinks.enwiki.url;
        }
    }
    return null;
}

function cleanAmount(amount) {
    return amount ? amount.replace(/^\+/, '') : null;
}

async function formatArea(area) {
    if (area && area.amount && area.unit) {
        const amount = cleanAmount(area.amount);
        const unitEntity = area.unit.split('/').pop();
        const unitLabel = await getLabel(unitEntity);
        return { value: amount, unit: unitLabel };
    }
    return null;
}

async function searchWikidata(query) {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    return searchData.search;
}

export async function getCountyData(countyName, stateName) {
    try {
        // Try searching with full "County, State" specification
        let searchResults = await searchWikidata(`${countyName} County, ${stateName}`);
        
        // If no results, try searching without "County"
        if (!searchResults || searchResults.length === 0) {
            searchResults = await searchWikidata(`${countyName}, ${stateName}`);
        }

        // If still no results, try searching just the county name
        if (!searchResults || searchResults.length === 0) {
            searchResults = await searchWikidata(countyName);
        }

        if (!searchResults || searchResults.length === 0) {
            return null;
        }

        const wikidataId = searchResults[0].id;

        // Fetch data from Wikidata using the ID
        const [population, coordinates, area, country, officialWebsite, capital, osmRelationId, wikipediaLink] = await Promise.all([
            getPropertyValue(wikidataId, 'P1082'),
            getPropertyValue(wikidataId, 'P625'),
            getPropertyValue(wikidataId, 'P2046'),
            getPropertyValue(wikidataId, 'P17'),
            getPropertyValue(wikidataId, 'P856'),
            getPropertyValue(wikidataId, 'P36'),
            getPropertyValue(wikidataId, 'P402'),
            getWikipediaLink(wikidataId)
        ]);

        // Extract and format the data
        const latitude = coordinates ? coordinates.latitude : null;
        const longitude = coordinates ? coordinates.longitude : null;

        const [countryLabel, capitalLabel, areaFormatted] = await Promise.all([
            getLabel(country),
            getLabel(capital),
            formatArea(area)
        ]);

        // Create and return the data object
        return {
            population: population ? cleanAmount(population.amount) : 'N/A',
            coordinates: { latitude, longitude },
            area: areaFormatted || 'N/A',
            country: countryLabel || 'N/A',
            officialWebsite: officialWebsite || 'N/A',
            capital: capitalLabel || 'N/A',
            osmRelationId: osmRelationId || 'N/A',
            wikipediaLink: wikipediaLink || 'N/A'
        };
    } catch (error) {
        console.error('Error in getCountyData:', error);
        return null;
    }
}


function displayCountyData(data) {
    const dataContainer = document.getElementById('countyData');
    if (data) {
        const osmRelationUrl = data.osmRelationId !== 'N/A' ? 
            `https://www.openstreetmap.org/relation/${data.osmRelationId}` : null;

        dataContainer.innerHTML = `
            <h3>County Information</h3>
            <p><strong>Population:</strong> ${data.population}</p>
            <p><strong>Coordinates:</strong> ${data.coordinates.latitude}, ${data.coordinates.longitude}</p>
            <p><strong>Area:</strong> ${data.area.value} ${data.area.unit}</p>
            <p><strong>Country:</strong> ${data.country}</p>
            <p><strong>Official Website:</strong> ${data.officialWebsite !== 'N/A' ? `<a href="${data.officialWebsite}" target="_blank">${data.officialWebsite}</a>` : 'N/A'}</p>
            <p><strong>Capital:</strong> ${data.capital}</p>
            <p><strong>OSM Relation:</strong> ${osmRelationUrl ? `<a href="${osmRelationUrl}" target="_blank">${data.osmRelationId}</a>` : 'N/A'}</p>
            <p><strong>Wikipedia:</strong> ${data.wikipediaLink !== 'N/A' ? `<a href="${data.wikipediaLink}" target="_blank">Link</a>` : 'N/A'}</p>
        `;
    } else {
        dataContainer.innerHTML = '<p>No data available for this county.</p>';
    }
}

export async function fetchAndDisplayCountyData(countyName, stateName) {
    const spinner = document.getElementById('countyDataSpinner');
    const dataContainer = document.getElementById('countyData');
    
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