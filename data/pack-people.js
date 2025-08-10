import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packGzip } from './utilities/stream.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const source_path = path.join(__dirname, 'people.jsonl');
const destination_path = path.join(__dirname, 'people.jsonl.gz');

await packGzip(source_path, destination_path);
