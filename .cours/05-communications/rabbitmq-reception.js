/* Pour la terminologie du protocole AMQP, on a:
  
 - Exchange = Une sous-section du serveur RabbitMQ (Bureau de poste)
 - Queue = Un tampon qui va contenir les messages du temps qu'ils n'ont pas été déclarés comme traités (Boite aux lettres)
 - RootingKey = Un identifiant qui permet de diriger et de lier les Exchanges et les Queues (l'adresse sur la lettre)
*/ 

import amqp from 'amqplib'

const connection = await amqp.connect('amqp://localhost:5672');

const channel = await connection.createChannel();

await channel.prefetch(5)

channel.consume('error', async (message) => {
  try {
    const data = JSON.parse(message.content.toString('utf8'))

    if (data.signature !== 'admin') channel.nack(message, false, false);
    const result = traitement(data);
    channel.ack(message)    
  } catch (error) {
    channel.nack(message, false, true)
  }
})