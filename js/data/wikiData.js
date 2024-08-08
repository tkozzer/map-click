// wikiData.js

export async function getPropertyValue(entityId, propertyId) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=${propertyId}&format=json&origin=*`;
    console.debug(`Fetching property ${propertyId} for entity ${entityId}: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.debug(`Response for property ${propertyId} of entity ${entityId}:`, data);
    if (data.claims?.[propertyId]) {
        return data.claims[propertyId][0].mainsnak.datavalue.value;
    }
    return null;
}

export async function getLabel(entityId) {
    if (typeof entityId === 'object' && entityId.id) {
        entityId = entityId.id;
    }
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels&languages=en&format=json&origin=*`;
    console.debug(`Fetching label for entity ${entityId}: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.debug(`Response for label of entity ${entityId}:`, data);
    if (data.entities?.[entityId]) {
        return data.entities[entityId].labels.en.value;
    }
    return null;
}

export async function getWikipediaLink(entityId) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks/urls&sitefilter=enwiki&format=json&origin=*`;
    console.debug(`Fetching Wikipedia link for entity ${entityId}: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.debug(`Response for Wikipedia link of entity ${entityId}:`, data);
    if (data.entities?.[entityId]) {
        const sitelinks = data.entities[entityId].sitelinks;
        if (sitelinks?.enwiki) {
            return sitelinks.enwiki.url;
        }
    }
    return null;
}

export function cleanAmount(amount) {
    return amount ? amount.replace(/^\+/, '') : null;
}

export async function formatArea(area) {
    if (area?.amount && area?.unit) {
        const amount = cleanAmount(area.amount);
        const unitEntity = area.unit.split('/').pop();
        const unitLabel = await getLabel(unitEntity);
        return { value: amount, unit: unitLabel };
    }
    return null;
}

export async function searchWikidata(query) {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
    console.debug(`Searching Wikidata with query: ${searchUrl}`);
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    console.debug(`Search results for query "${query}":`, searchData);
    return searchData.search;
}