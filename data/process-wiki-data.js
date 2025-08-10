import https from 'https';
import bz2 from 'unbzip2-stream';
import json from 'stream-json';
import fs from 'fs';
import pick from 'stream-json/filters/Pick.js';
import stream_values from 'stream-json/streamers/StreamValues.js';
import stream_array from 'stream-json/streamers/StreamArray.js';
import { Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { isHuman, isPlace } from './utilities/wiki-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const people_path = path.join(__dirname, 'people.jsonl');
const places_path = path.join(__dirname, 'places.jsonl');

if (fs.existsSync(people_path)) throw new Error(`File already exists: ${people_path}`);
if (fs.existsSync(places_path)) throw new Error(`File already exists: ${places_path}`);

const peoples_stream = fs.createWriteStream(people_path);
const places_stream = fs.createWriteStream(places_path);

/** @type {Object<string, fs.WriteStream>} */
const streams = 
{
    "person": peoples_stream,
    "place": places_stream
}

/**
 * @param {any} entity 
 */
function extractPersonData(entity)
{
    const claims = entity.claims;
    const label = entity.labels?.en?.value || entity.labels?.pl?.value;
    const birthDate = claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time ?? null;
    const birthPlace = claims?.P19?.[0]?.mainsnak?.datavalue?.value?.id ?? null;
    return { id: entity.id, label, birthDate, birthPlace };
};

/**
 * @param {any} entity 
 */
function extractPlaceData(entity)
{
    const id = entity.id;
    const label = entity.labels?.en?.value || entity.labels?.pl?.value;
    const coords = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value ?? null;
    const latitude = coords?.latitude ?? null;
    const longitude = coords?.longitude ?? null;
    const place = { id, label, latitude, longitude };
    return place;
}

/**
 * @param {import('http').IncomingMessage} response 
 */
async function handleResponse(response)
{
    const content_length = parseInt(response.headers['content-length'] ?? '0');
    let bytes_read = 0;
    let people_count = 0;
    let place_count = 0;

    const progress_interval = setInterval(() =>
    {
        const percent = content_length ? (100 * bytes_read / content_length).toFixed(2) : '?';
        const mb = (bytes_read / (1024 * 1024)).toFixed(1);
        console.log(`[Progress] ${mb} MB read (${percent}%) — People: ${people_count}, Places: ${place_count}`);
    },
    5000);

    try
    {
        // const debug_before_parse = new Transform({ transform(chunk, _, callback)
        // {
        //     console.log(chunk.toString());
        //     callback(null, chunk);
        // }});
        // const debug_before_pick = new Transform({ objectMode: true, transform(chunk, _, callback)
        // {
        //     console.log('Chunk:', chunk);
        //     callback(null, chunk);
        // }});
        // const debug_before_transform = new Writable({ objectMode: true, write(chunk, encoding, callback)
        // {
        //     console.log(chunk);
        //     callback();
        // }});
        
        const count_bytes = new Transform({ transform(chunk, _, callback)
        {
            bytes_read += chunk.length;
            callback(null, chunk);
        }});
        const classify_entities = new Transform({ objectMode: true, transform({ value: entity }, _, callback) 
        {
            if (entity.type === 'item' && entity.claims?.P31)
            {
                if (isHuman(entity.claims))
                {
                    const person = extractPersonData(entity);
                    people_count++;
                    callback(null, { type: 'person', data: person });
                    return;
                }
                else if (isPlace(entity.claims))
                {
                    const place = extractPlaceData(entity);
                    place_count++;
                    callback(null, { type: 'place', data: place });
                    return;
                }
            }
            callback();
        }});
        const output_writer = new Writable({ objectMode: true, write(entry, _, callback) 
        {
            const stream = streams[entry.type];
            if (stream)
            {
                if (!stream.write(JSON.stringify(entry.data) + '\n'))
                {
                    stream.once('drain', callback);
                    return;
                }
            }
            callback();
        }});
        const chain =
        [
            response,
            count_bytes,
            bz2(),
            // debug_before_parse,
            json.parser(),
            // debug_before_pick,
            // debug_before_transform,
            stream_array.streamArray(),
            classify_entities,
            output_writer
        ];
        await pipeline(chain);
        clearInterval(progress_interval);
        console.log('Finished.');
    }
    catch (error)
    {
        console.error(error);
    }
}

const url = 'https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2';
https.get(url, handleResponse);