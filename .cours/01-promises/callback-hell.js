import fs from 'node:fs';

fs.writeFile('fileA.txt', 'content', (error) => {
  if (error) return console.error(error);
  fs.readFile('fileA.txt', 'utf-8', (error, data) => {
    if (error) return console.error(error);
    fs.writeFile('fileB.txt', data.toUpperCase(), (error) => {
      if (error) return console.error(error);
      fs.readFile('fileB.txt', 'utf-8', (error, data) => {
        if (error) return console.error(error);
        console.log("C'est bon, c'est écrit !");
      })
    })
  })
})