// Scaling de l'API en cluster : le primaire forke N workers qui partagent le
// port 3000 (ou PORT). Chaque worker sert l'app corrigee. cluster.on('exit')
// relance un worker mort (resilience), sauf pendant un arret propre.
// WORKERS/PORT surchargeables (tests).
import cluster from 'node:cluster';
import os from 'node:os';

const PORT = Number(process.env.PORT ?? 3000);

if (cluster.isPrimary) {
  const n = Number(process.env.WORKERS ?? os.availableParallelism());
  console.log(`Primary ${process.pid} demarre ${n} workers`);
  for (let i = 0; i < n; i++) cluster.fork();

  let enArret = false;
  cluster.on('exit', (worker) => {
    if (enArret) return; // arret propre : ne pas relancer
    console.log(`Worker ${worker.process.pid} mort, relance`);
    cluster.fork();
  });

  // Arret propre : on cesse de relancer et on coupe les workers.
  process.on('SIGTERM', () => {
    enArret = true;
    for (const w of Object.values(cluster.workers)) w.process.kill('SIGKILL');
    process.exit(0);
  });
} else {
  const { createApp } = await import('./app.js');
  const server = createApp().listen(PORT, () => console.log(`Worker ${process.pid} en ecoute sur ${PORT}`));
  // Si le primaire disparait pendant le handshake IPC du cluster, l'ecoute peut
  // echouer (EPIPE). On absorbe l'erreur du serveur ET celle du canal IPC
  // (emise sur process) plutot que de laisser le worker crasher.
  server.on('error', () => process.exit(0));
  process.on('error', () => process.exit(0));
}
