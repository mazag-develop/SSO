import { ENV } from './config/env';
import app from './app';

app.listen(ENV.PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${ENV.PORT}`);
});
