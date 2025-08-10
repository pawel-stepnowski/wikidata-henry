
/**
 * @param {any} claims 
 * @returns {boolean}
 */
export function isPlace(claims)
{
    if (claims?.P625) return true;
    return false;
    // const types = claims?.P31?.map((/** @type {any} */ entry) => entry.mainsnak?.datavalue?.value?.id).filter(Boolean);
    // if (!types) return false;
    // return types.some((/** @type {any} */ id) => PLACE_TYPE.has(id));
}

/**
 * @param {any} claims 
 * @returns {boolean}
 */
export function isHuman(claims)
{
    return claims?.P31?.some((/** @type {any} */ entry) => entry.mainsnak?.datavalue?.value?.id === 'Q5');
}

export const PLACE_TYPE = new Set(
[
    'Q6256',      // country
    'Q515',       // city
    'Q3957',      // village
    'Q486972',    // human settlement
    'Q618123',    // geographical object
    'Q82794',     // geographic region
    'Q56061',     // administrative unit
    'Q15916867',  // neighborhood
    'Q123705',    // capital
    'Q15700806'   // populated place
]);
