import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });
      return;
    }

    // Kullanıcıyı bul (aktif olanlar)
    const user = await User.findOne({
      where: { username, isActive: true },
    });

    if (!user) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
      return;
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
      return;
    }

    // JWT oluştur
    const secret = process.env.JWT_SECRET as string;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    res.status(200).json({
      message: 'Giriş başarılı.',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Oturum açan kullanıcının kendi bilgilerini görmesi
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({
      where: { id: req.user!.id, isActive: true },
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
