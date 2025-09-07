import { Request, Response } from 'express';

export const getStatus = (req: Request, res: Response) => {
  res.json({ status: 'API is running 🚀' });
};