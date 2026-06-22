import express from 'express';
import basicRoutes from './routes/base-routes'
import securedRoutes from './routes/secured-routes'
import { authGuard } from './middlewares/guard'

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json())
app.use('/hello', basicRoutes)
app.use('/private', authGuard, securedRoutes)


app.listen(port, () => {
  console.log(`API lancée sur le port ${port}...`);
})