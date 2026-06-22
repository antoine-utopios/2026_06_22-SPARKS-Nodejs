import fs, { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises' 

const readableStream = fs.createReadStream('path/to/file.txt', { encoding: 'utf8', highWaterMark: 65_536 })
const writableStream = fs.createWriteStream('path/to/file-exit.txt')

readableStream.on('data', (chunk) => {
  console.log(chunk);
})

readableStream.on('readable', () => {
  console.log('Le stream est en pause');
  readableStream.read();
})

readableStream.on('end', () => {
  console.log('Fin de flux');
})

readableStream.on('error', (error) => {
  console.error(error);
})

readableStream.pause();
readableStream.resume();

writableStream.on('drain', (chunk) => {
  console.log(chunk);
})

writableStream.on('finish', () => {
  console.log('Le flux est arrivé à son terme');
})

readableStream.on('data', (chunk) => {
  writableStream.write(chunk);
})


writableStream.write('Contenu');
writableStream.write('Contenu');
writableStream.write('Contenu');

/*
  J'ai du texte
  Ceci est mon texte
  Et je ne sais pas quoi écrire...
*/

await pipeline(
  readableStream,
  writableStream)