import { Worker } from 'node:worker_threads';

function traiterDonnees() {
  const donnees = recupererDonnees();

  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker-thread-worker.js', {
      workerData: donnees
    });

    worker.on('message', resolve);
    worker.on('error', reject)

    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error('Le worker a eu un problème, avec le code: ' + code))
    })

  })
}

// Dans un contrôlleur...

function recuperationDonnes(req, res) {
  const resultats = await traiterDonnees();
  res.json(resultats)
}