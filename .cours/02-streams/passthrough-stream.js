import fs, { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises' 

const readableStream = fs.createReadStream('path/to/file.txt', { encoding: 'utf8', highWaterMark: 65_536 })
const writableStream = fs.createWriteStream('path/to/file-exit.txt')
const writableStreamBis = fs.createWriteStream('path/to/file-exit_bis.txt')

const tee = new PassThrough();

/*
  J'ai du texte
  Ceci est mon texte
  Et je ne sais pas quoi écrire...
*/


// await pipeline(
  //   readableStream, 
  //   writableStream,
  //   writableStreamBis)
  
  await Promise.all([
    pipeline(readableStream, writableStream), // [A, C, E]
    pipeline(readableStream, writableStreamBis) // [B, D, F]
  ])

  
tee.pipe(writableStream)
tee.pipe(writableStreamBis)

await pipeline(
  readableStream, 
  tee) // [A, B, C, D, E, F] pour les deux sorties