import fs from 'node:fs';

async function writeRead(content = 'content') {
  try {
    await fs.writeFile('fileA.txt', content);
    const data = await fs.readFile('fileA.txt', 'utf-8');
    await fs.writeFile('fileB.txt', data.toUpperCase())
    await fs.readFile('fileB.txt', 'utf-8')
    console.log("C'est bon, c'est écrit");
  } catch (error) {
    console.error(error);
  }
}