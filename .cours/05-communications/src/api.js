import express from 'express'
import { auditeur } from './redis';
import { sendNotification } from './controllers/notifications.controller';

const app = express()

const port = process.env.PORT || 3000;

auditeur.subscribe('logs')

auditeur.on('message', (canal, message) => {
  if (canal === 'logs') {
    console.log(`Nouveau log: ${message}`);
  }
})

app.use(express.json())

app.post('/send-notification', sendNotification)

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`);
})

auditeur.unsubscribe('logs')