import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { createReadStream } from 'fs';
import { LineSplitter } from './utilities/LineSplitter.js';
import { Transform } from 'stream';
import { stat } from 'fs/promises';
import { writeLines } from './utilities/stream.js';
import { NameMatcher } from './utilities/NameMatcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data_path = path.join(__dirname, 'people.jsonl');
const data_length = (await stat(data_path)).size;
const matcher = new NameMatcher();
let bytes_read = 0;

const matches =
{
    /** @type {string[]} */
    exact: [],
    /** @type {string[]} */
    approximate: []
};

const progress_interval = setInterval(() =>
{
    const percent = data_length ? (100 * bytes_read / data_length).toFixed(2) : '?';
    const mb = (bytes_read / (1024 * 1024)).toFixed(1);
    console.log(`[Progress] ${mb} MB read (${percent}%) — Exact: ${matches.exact.length}, Approximate: ${matches.approximate.length}`);
},
5000);

/**
 * @param {AsyncIterable<string>} source 
 */
async function process(source)
{
    for await (const line of source)
    {
        const person = JSON.parse(line);
        if (!person.label)
        {
            continue;
        }
        const match = matcher.match(person.label);
        if (match === 'exact')
        {
            matches.exact.push(line);
        }
        else if (match === 'approximate')
        {
            matches.approximate.push(line);
        }
    }
}

await pipeline
(
    createReadStream(data_path, { encoding: 'utf8' }),
    new Transform({ transform(chunk, _, callback) { bytes_read += chunk.length; callback(null, chunk); }}),
    new LineSplitter(),
    process
);

clearInterval(progress_interval);

await writeLines(path.join(__dirname, 'people_exact.jsonl'), matches.exact);
await writeLines(path.join(__dirname, 'people_approximate.jsonl'), matches.approximate);