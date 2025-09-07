import express from 'express';
import cors from 'cors';

// Importa las rutas de la API
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import appRoutes from './routes/app.routes';

// Importa los middlewares
import { errorHandler } from './middlewares/error.middleware';

/**
 * @file app.ts
 * @description Inicializa y configura la aplicación Express.
 */

const app = express();

// Middleware central
app.use(cors()); // Habilita CORS para permitir peticiones desde el frontend
app.use(express.json()); // Habilita el parsing de JSON en el cuerpo de las peticiones

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/apps', appRoutes);

// Middleware de manejo de errores. Debe ser el último middleware
app.use(errorHandler);

export default app;