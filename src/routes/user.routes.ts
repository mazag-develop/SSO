import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

const router = Router();

// Ejemplo CRUD para usuarios
router.get('/', authenticateToken, userController.getUsers);
router.get('/:id', authenticateToken, userController.findUserByEmail);
router.post('/', userController.createUser); // registro abierto
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

export default router;
