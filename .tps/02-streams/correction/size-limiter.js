const { Transform } = require('node:stream');

export class SizeLimiter extends Transform {
  constructor({ maxBytes = 10 * 1024 * 1024, ...options } = {}) {
    super(options);
    this.maxBytes = maxBytes;
    this.bytesSeen = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesSeen += chunk.length;
    if (this.bytesSeen > this.maxBytes) {
      const err = new Error('Payload too large');
      err.code = 'LIMIT_EXCEEDED';
      err.statusCode = 413;
      return callback(err);
    }
    callback(null, chunk);
  }
}