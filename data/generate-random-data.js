import fs from 'fs';
import path from 'path';
import { exit } from 'process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const output_path = path.join(__dirname, 'frontend', 'public', 'random.jsonl');
const count = 100_000;

if (fs.existsSync(output_path)) exit();

/**
 * @param {number} min
 * @param {number} max
 */
function randomBetween(min, max)
{
    return Math.random() * (max - min) + min;
}

function randomBirthDate()
{
    const year = Math.floor(randomBetween(1200, 2021));
    const month = String(Math.floor(randomBetween(1, 13))).padStart(2, '0');
    const day = String(Math.floor(randomBetween(1, 29))).padStart(2, '0');
    return `+${year}-${month}-${day}T00:00:00Z`;
}

function randomCoordinates()
{
    return { longitude: randomBetween(-25, 45), latitude: randomBetween(35, 72) };
}

const stream = fs.createWriteStream(output_path);

for (let i = 1; i <= count; i++)
{
    const person = { id: `P${i}`, label: `Person #${i}`, birthDate: randomBirthDate(), coordinates: randomCoordinates() };
    stream.write(JSON.stringify(person) + '\n');
}

stream.end(() => console.log(`✅ Generated`));
