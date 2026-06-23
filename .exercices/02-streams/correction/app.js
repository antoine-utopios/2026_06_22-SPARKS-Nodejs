import { error } from 'node:console';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { CsvCleaner } from './csv-cleaner-bonus';

async function main() {
  const csvCleaner = new CsvCleaner();


  await pipeline(
    fs.createReadStream('users.csv', { encoding: 'utf-8' }),
    csvCleaner,
    fs.createWriteStream('users-clean.csv')
  )

  console.log("Traitement terminé !");
  console.log("Lignes lues: " + csvCleaner.readLine);
  console.log("Lignes filtrées: " + csvCleaner.filteredLine);
  console.log("Lignes écrites: " + csvCleaner.writtenLine);
}

main().catch(err => {
  console.error(error);
  process.exit(1);
})