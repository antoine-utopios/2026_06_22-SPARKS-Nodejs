import fs from 'node:fs';

const ws = fs.createWriteStream('users.csv');
ws.write('id,name,country,active\n');

const countries = ['france', 'usa', 'japan', 'germany', 'brasil', 'australia'];
let i = 0;

(function write() {
  let flag = true;

  while(i < 1_000_000 && flag) {
    i++;
    const currentCountry = countries[i % countries.length];
    const active = i % 4 === 0 ? 'false' : 'true';

    flag = ws.write(`${i},user${i},${currentCountry},${active}\n`);
  }

  if (i < 1_000_000) ws.once('drain', write);
  else ws.end();
})();


// function write() {

// }

// write();