import { cluster } from 'node:cluster'
import { os } from 'node:os';

const MINIMUM_FREE = 4;

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism() - MINIMUM_FREE; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker) => cluster.fork())
} else {
  // Toute la logique applicative...

  const app = express();
  app.get('/ma-route', (req, res) => {
    res.json({
      message: 'Hello world!'
    });
  })

  app.listen(port, () => {
    console.log(`Application listening on http://localhost:${port}...`);
  })
}