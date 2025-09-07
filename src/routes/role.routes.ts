import { Router } from 'express';
import * as roleController from '../controllers/role.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Ejemplo CRUD para roles
router.get('/', authenticateToken, roleController.getRoles);
router.get('/:id', authenticateToken, roleController.getRoleById);
router.post('/', authenticateToken, roleController.createRole);
router.put('/:id', authenticateToken, roleController.updateRole);
router.delete('/:id', authenticateToken, roleController.deleteRole);

export default router;
