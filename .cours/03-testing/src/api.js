import express from 'express';
import { DiceRoller } from './randomDice';

export function createApp(diceRoller = new DiceRoller()) {
  const app = express();

  app.use(express.json())

  app.get('/', (req, res) => {
    return res.status(200).json({
      message: 'Hello World!'
    })
  })

  app.get('/roll-dice', (req, res) => {
    const diceResult = diceRoller.rollD20();

    return res.status(200).json({
      message: `Le dé à donné comme valeur ${diceResult}`,
      value: diceResult
    })
  })

  return app;
}
