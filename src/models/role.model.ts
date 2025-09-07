import { BaseModel } from './base.model';

export interface Role extends BaseModel {
  name: string;          // Ej: 'admin', 'teacher', 'student'
  description?: string;  // Opcional
}
