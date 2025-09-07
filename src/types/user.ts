export interface User {
  id: string;
  nombre: string;
  email: string;
  password_hash?: string;
  proveedor_identidad_id?: number;
  fecha_creacion?: Date;
}
