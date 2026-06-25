/* Pour la terminologie du protocole AMQP, on a:
  
 - Exchange = Une sous-section du serveur RabbitMQ (Bureau de poste)
 - Queue = Un tampon qui va contenir les messages du temps qu'ils n'ont pas été déclarés comme traités (Boite aux lettres)
 - RootingKey = Un identifiant qui permet de diriger et de lier les Exchanges et les Queues (l'adresse sur la lettre)
*/ 

import amqp from 'amqplib'

const connection = await amqp.connect('amqp://localhost:5672');

const channel = await connection.createChannel();

await channel.assertExchange('logs', 'direct', { durable: true })
await channel.assertQueue('error', { durable: true })
await channel.bindQueue('error', 'logs', 'logs.error');

channel.publish(
  'logs',
  'logs.error',
  Buffer.from(JSON.stringify(object)),
  { persistent: true }
)