// js/data/wikiData.js

const cache = new Map();

function rateLimit(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getPropertyValueBatch(entityId, propertyIds) {
    const cacheKey = `${entityId}_${propertyIds.join('_')}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json&origin=*`;
    console.debug(`Fetching properties ${propertyIds.join(', ')} for entity ${entityId}: ${url}`);

    await rateLimit(1000);  // Ensure we don't exceed the rate limit

    const response = await fetch(url);
    const data = await response.json();
    console.debug(`Response for properties ${propertyIds.join(', ')} of entity ${entityId}:`, data);

    const results = {};
    if (data.entities?.[entityId]?.claims) {
        propertyIds.forEach(propertyId => {
            if (data.entities[entityId].claims[propertyId]) {
                results[propertyId] = data.entities[entityId].claims[propertyId][0].mainsnak.datavalue.value;
            } else {
                results[propertyId] = null;
            }
        });
    }
    cache.set(cacheKey, results);
    return results;
}

export async function getLabel(entityId) {
    if (!entityId) {
        console.warn('Attempted to get label for null entityId');
        return 'N/A';
    }

    if (typeof entityId === 'object' && entityId.id) {
        entityId = entityId.id;
    }
    if (cache.has(`label_${entityId}`)) {
        return cache.get(`label_${entityId}`);
    }

    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels&languages=en&format=json&origin=*`;
    console.debug(`Fetching label for entity ${entityId}: ${url}`);

    await rateLimit(1000);  // Ensure we don't exceed the rate limit

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.debug(`Response for label of entity ${entityId}:`, data);

        const label = data.entities?.[entityId]?.labels?.en?.value || null;
        cache.set(`label_${entityId}`, label);
        return label || 'N/A';
    } catch (error) {
        console.error(`Error fetching label for entity ${entityId}:`, error);
        return 'N/A';
    }
}

export async function getWikipediaLink(entityId) {
    if (cache.has(`wikipediaLink_${entityId}`)) {
        return cache.get(`wikipediaLink_${entityId}`);
    }

    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks/urls&sitefilter=enwiki&format=json&origin=*`;
    console.debug(`Fetching Wikipedia link for entity ${entityId}: ${url}`);

    await rateLimit(1000);  // Ensure we don't exceed the rate limit

    const response = await fetch(url);
    const data = await response.json();
    console.debug(`Response for Wikipedia link of entity ${entityId}:`, data);

    const link = data.entities?.[entityId]?.sitelinks?.enwiki?.url || null;
    cache.set(`wikipediaLink_${entityId}`, link);
    return link;
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
    const cacheKey = `search_${query}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
    console.debug(`Searching Wikidata with query: ${searchUrl}`);

    await rateLimit(1000);  // Ensure we don't exceed the rate limit

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    console.debug(`Search results for query "${query}":`, searchData);

    cache.set(cacheKey, searchData.search);
    return searchData.search;
}
