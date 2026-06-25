import { emetteur } from './redis'

export async function sendNotification (req, res) {
  const message = req.body.message;

  const nbRecus = await emetteur.publish('notif.message', JSON.stringify(message));

  if (nbRecus) {
    res.status(200).json({
      message: "C'est envoyé!"
    })
  } else {
    res.status(500).json({
      message: "Personne n'a reàu la notification..."
    })
  }

}