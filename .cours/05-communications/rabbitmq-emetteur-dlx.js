/* Pour la terminologie du protocole AMQP, on a:
  
 - Exchange = Une sous-section du serveur RabbitMQ (Bureau de poste)
 - Queue = Un tampon qui va contenir les messages du temps qu'ils n'ont pas été déclarés comme traités (Boite aux lettres)
 - RootingKey = Un identifiant qui permet de diriger et de lier les Exchanges et les Queues (l'adresse sur la lettre)
*/ 

import amqp from 'amqplib'

const connection = await amqp.connect('amqp://localhost:5672');

await channel.assertExchange('dlx', 'direct', { durable: true })

await channel.assertQueue('database', {
   durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx',
      'x-dead-letter-routing-key': 'dlx.database'
    }
  });

await channel.bindQueue('dlx', 'database', 'dlx.database');

channel.publish(
  'dlx',
  'dlx.database',
  Buffer.from(JSON.stringify(object)),
  { persistent: true }
)