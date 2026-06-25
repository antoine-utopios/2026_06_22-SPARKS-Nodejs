import Redis from 'ioredis'

const emetteur = new Redis();

// Partie EMISSION
const nbPersonnesQuiOntRecus = await emetteur.publish(
  'notifications.chat',
  JSON.stringify({
    username: 'JohnDoe',
    message: 'Hello, je suis John DOE'
  })
)