import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';

// GET /api/users — Tüm aktif kullanıcıları listele
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { id, isActive: true },
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// POST /api/users — Yeni kullanıcı oluştur (Admin only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, name, email, password, isAdmin } = req.body;

    if (!username || !name || !email || !password) {
      res.status(400).json({ message: 'username, name, email ve password zorunludur.' });
      return;
    }

    // Duplicate kontrol
    const existingUser = await User.findOne({
      where: { username },
    });
    if (existingUser) {
      res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
      return;
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      name,
      email,
      password_hash,
      isAdmin: isAdmin ?? false,
    });

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu.',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      const msg = field === 'email'
        ? 'Bu e-posta adresi zaten kullanılıyor.'
        : 'Bu kullanıcı adı zaten kullanılıyor.';
      res.status(409).json({ message: msg });
      return;
    }
    console.error('CreateUser error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
}

// PUT /api/users/:id — Kullanıcı güncelle (Admin only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, name, email, password, isAdmin } = req.body;

    const user = await User.findOne({ where: { id, isActive: true } });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      return;
    }

    // Unique kontroller
    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
        return;
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        return;
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (password) {
      user.password_hash = await bcrypt.hash(password, 12);
    }

    await user.save();

    res.status(200).json({
      message: 'Kullanıcı başarıyla güncellendi.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path;
      const msg = field === 'email'
        ? 'Bu e-posta adresi zaten kullanılıyor.'
        : 'Bu kullanıcı adı zaten kullanılıyor.';
      res.status(409).json({ message: msg });
      return;
    }
    console.error('UpdateUser error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/users/:id — Soft delete (Admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Admin kendi hesabını silemez
    if (Number(id) === req.user!.id) {
      res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz.' });
      return;
    }

    const user = await User.findOne({ where: { id, isActive: true } });
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      return;
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({ message: 'Kullanıcı başarıyla silindi.' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
