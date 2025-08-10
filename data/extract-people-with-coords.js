import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { once } from 'events';
import { readLines } from './utilities/stream.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const people_path = path.join(__dirname, 'people_exact.jsonl');
const places_path = path.join(__dirname, 'places.jsonl');
const output_path = path.join(__dirname, 'people_with_coords.jsonl');

/**
 * @param {string} people_path
 * @returns {Promise<Set<string>>}
 */
async function collectPlaceIds(people_path)
{
    const ids = new Set();
    for await (const line of readLines(people_path))
    {
        if (!line) continue;
        let obj;
        try { obj = JSON.parse(line); } catch { continue; }
        const birth_place = obj?.birthPlace;
        if (typeof birth_place === 'string' && birth_place) ids.add(birth_place);
    }
    return ids;
}

/**
 * @param {string} places_path
 * @param {Set<string>} ids
 * @returns {Promise<Map<string, any>>}
 */
async function buildPlacesMap(places_path, ids)
{
    const map = new Map();
    if (!ids || ids.size === 0) return map;
    for await (const line of readLines(places_path))
    {
        if (map.size === ids.size) break;
        if (!line) continue;
        let place;
        try { place = JSON.parse(line); } catch { continue; }
        const id = place?.id;
        if (id && ids.has(id)) map.set(id, place);
    }
    return map;
}

/**
 * @param {string} people_path
 * @param {string} output_path
 * @param {Map<string, any>} placesMap
 * @returns {Promise<void>}
 */
async function writeEnrichedPeople(people_path, output_path, placesMap)
{
    const ws = createWriteStream(output_path, { encoding: 'utf8' });

    for await (const line of readLines(people_path))
    {
        if (!line) { ws.write('\n'); continue; }
        let person;
        try { person = JSON.parse(line); } catch { continue; }
        const bp = person?.birthPlace;
        if (typeof bp === 'string' && placesMap.has(bp))
        {
            person.birthPlace = placesMap.get(bp);
        }
        ws.write(JSON.stringify(person) + '\n');
    }

    ws.end();
    await once(ws, 'finish');
}

async function main()
{
    const wanted = await collectPlaceIds(people_path);
    const placesMap = await buildPlacesMap(places_path, wanted);
    await writeEnrichedPeople(people_path, output_path, placesMap);
}

await main();
