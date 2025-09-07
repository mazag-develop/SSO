import { Router } from 'express';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';

const router = Router();

// Rutas principales
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente 🚀' });
});

export default router;
