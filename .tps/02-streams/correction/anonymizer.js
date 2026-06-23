import { Transform } from 'node:stream';

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Transform d'anonymisation, ligne par ligne :
 *  - remplace toute adresse e-mail par "***@***" ;
 *  - passe la ligne en majuscules.
 * Gere le decoupage en lignes via `this.tail` (un chunk peut couper une ligne).
 */
export class Anonymizer extends Transform {
  constructor(options) {
    super(options);
    this.tail = '';
  }

  _transform(chunk, encoding, callback) {
    const data = this.tail + chunk.toString('utf8');
    const lines = data.split('\n');
    this.tail = lines.pop(); // ligne incomplete conservee
    for (const line of lines) {
      this.push(this.clean(line) + '\n');
    }
    callback();
  }

  _flush(callback) {
    if (this.tail.length > 0) {
      this.push(this.clean(this.tail));
    }
    callback();
  }

  clean(line) {
    return line.replace(EMAIL, '***@***').toUpperCase();
  }
}
