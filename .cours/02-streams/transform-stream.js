import fs, { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises' 

const readableStream = fs.createReadStream('path/to/file.txt', { encoding: 'utf8', highWaterMark: 65_536 })
const writableStream = fs.createWriteStream('path/to/file-exit.txt')

/*
  J'ai du texte
  Ceci est mon texte
  Et je ne sais pas quoi écrire...
*/

class AllInUpperCaseTransform extends Transform {
  constructor(options) {
    super(options);
    this.tail = '';
  }

  _transform(chunk, encoding, callback) {
    const lines = (this.tail + chunk.toString('utf8')).split('\n');
    this.tail = lines.pop();
    for (const line of lines) {
      this.push(line.toUpperCase() + '\n')
    }
    callback()
  } 
  
  _flush(callback) {
    if (this.tail) this.push(this.tail.toUpperCase());
    callback();
  }
}

await pipeline(
  readableStream, 
  new AllInUpperCaseTransform(),
  writableStream)