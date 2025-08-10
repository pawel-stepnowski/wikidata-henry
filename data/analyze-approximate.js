import path from 'path';
import { fileURLToPath } from 'url';
import { NameMatcher } from './utilities/NameMatcher.js';
import { readLines } from './utilities/stream.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const matcher = new NameMatcher();
const lines = readLines(path.join(__dirname, 'people_approximate.jsonl'));

for await (const line of lines)
{
    try
    {
        const person = JSON.parse(line);
        if (!person.label) continue;
        const match = matcher.match(person.label);

        if (match === 'exact')
        {
            // console.log(`[Exact Match] ${person.label}`);
        }
        else if (match === 'approximate')
        {
            console.log(`[Approximate Match] ${person.label}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    catch (error)
    {
        console.error(line);
        break;
    }
}
