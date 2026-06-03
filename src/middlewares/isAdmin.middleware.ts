import { Request, Response, NextFunction } from 'express';

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Erişim reddedildi: Bu işlem için admin yetkisi gereklidir.' });
    return;
  }
  next();
};
