import { Transform } from "node:stream";

export class CsvCleaner extends Transform {
  constructor(options) {
    super(options)
    this.tail = '';
    
    this.upperName = 'country';
    this.activeName = 'active';

    this.upperIndex = -1;
    this.activeIndex = -1;

    this.heaaderSent = false;
  }

  _transform(chunk, encoding, callback) {
    const data = this.tail + chunk.toString('utf8');
    const lines = data.split('\n');
    this.tail = lines.pop();

    for (const line of lines) {
      this.handleLine(line);
    }

    callback();
  }

  _flush(callback) {
    if (this.tail.length > 0) {
      this.handleLine(this.tail);
      this.tail = '';
    }

    callback();
  }

  handleLine(line) {
    if (line === '') return;

    if (!this.heaaderSent) {
      const cols = line.split(',');

      this.upperIndex = cols.indexOf(this.upperName);
      this.activeIndex = cols.indexOf(this.activeName);

      this.push(line + '\n');
      this.heaaderSent = true;
      return;
    }

    const fields = line.split(',');

    if (fields[this.activeIndex] !== 'true') {
      return;
    }

    if (this.upperIndex >= 0 && fields[this.upperIndex] !== undefined) {
      fields[this.upperIndex] = fields[this.upperIndex].toUpperCase();
    }

    const finalLine = fields.join(',') + '\n';
    this.push(finalLine);
  }
}