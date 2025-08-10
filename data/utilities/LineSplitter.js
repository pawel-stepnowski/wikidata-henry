import { Transform } from 'stream';

export class LineSplitter extends Transform
{
    constructor()
    {
        super({ readableObjectMode: true });
        this._last = '';
    }

    /**
     * @param {any} chunk 
     * @param {BufferEncoding} _ 
     * @param {import('stream').TransformCallback} callback 
     */
    _transform(chunk, _, callback)
    {
        const data = this._last + chunk.toString('utf8');
        const lines = data.split(/\r?\n/);
        this._last = lines.pop() ?? '';
        for (const line of lines) this.push(line);
        callback();
    }

    /**
     * @param {import('stream').TransformCallback} callback 
     */
    _flush(callback)
    {
        if (this._last) this.push(this._last);
        callback();
    }
}