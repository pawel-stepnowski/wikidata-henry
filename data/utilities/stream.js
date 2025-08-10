import { createWriteStream, createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { pipeline } from 'stream/promises';
import { createGzip, constants } from 'zlib';

/**
 * @param {string} source_path
 * @param {string} destination_path
 */
export async function packGzip(source_path, destination_path)
{
    const gzip = createGzip({ level: constants.Z_BEST_COMPRESSION });
    await pipeline(createReadStream(source_path), gzip, createWriteStream(destination_path));
}

/**
 * @param {string} path
 * @example
 * for await (const line of readLines('./file.txt')) {}
 */
export function readLines(path)
{
    const input = createReadStream(path, { encoding: 'utf8' });
    return createInterface({ input, crlfDelay: Infinity });
}

/**
 * @param {string} path 
 * @param {string[]} array
 */
export function writeLines(path, array)
{
    return new Promise((resolve, reject) =>
    {
        const ws = createWriteStream(path, { encoding: 'utf8' });
        for (const line of array)
        {
            if (!ws.write(line + '\n'))
            {
                ws.once('drain', () => {});
            }
        }
        ws.end();
        ws.on('finish', () => resolve(null));
        ws.on('error', reject);
    });
}