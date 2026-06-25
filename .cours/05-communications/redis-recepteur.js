import Redis from 'ioredis'

const auditeur = new Redis();

// Partie RECEPTION
auditeur.subscribe('notifications', (error, count) => {
  console.log(count); // Pour connaitre le nombre d'élements dans ce topic
})

auditeur.psubscribe('notifications.*')

auditeur.on('message', (canal, message) => {
  console.log(`Depuis le canal ${canal}: ${message}`);
})

auditeur.on('pmessage', (pattern, canal, message) => {
  if (pattern === 'notifications.*') {

    switch (canal) {
      case 'notifications.urgent':
        // Logique si on a reçu un message sur 'notifications.urgent'
        break;
        case 'notifications.annexe':
          // Logique si on a reçu un message sur 'notifications.annexe'
          break;
          case 'notifications.warning':
            // Logique si on a reçu un message sur 'notifications.warning'
            break;
            default: 
            // Traitement pour toutes les autres notifications
            break;
        }
    } else {
      // Traitement pour tous les autres messages (pas du style 'notifications.*')
    }
})

auditeur.unsubscribe('notifications')
auditeur.punsubscribe('notifications.*')