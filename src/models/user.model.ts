import { BaseModel } from './base.model';
import { Role } from './role.model';

export interface User extends BaseModel {
  email: string;
  passwordHash: string;
  fullName: string;
  isActive: boolean;
  role: Role;
  roleId: number;
}
