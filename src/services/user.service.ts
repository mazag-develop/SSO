// src/services/user.service.ts
import { User } from '../models/user.model';

export const getUsers = async () => {
  return await User.findAll();
};

export const getUserById = async (id: number) => {
  return await User.findByPk(id);
};

export const findUserByEmail = async (email: string) => {
  return await User.findOne({ where: { email } });
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  roleId: number;
}) => {
  return await User.create(data);
};

export const updateUser = async (id: number, data: Partial<{
  name: string;
  email: string;
  password: string;
  roleId: number;
}>) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.update(data);
  return user;
};

export const deleteUser = async (id: number) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return true;
};
