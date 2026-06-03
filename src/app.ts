import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import sequelize from './config/database';
import routes from './routes';
import { User } from './models';
import './models';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ─── JWT kontrolü ─────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_change_this') {
  console.error('❌ HATA: JWT_SECRET .env dosyasında tanımlanmamış!');
  process.exit(1);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'İstenen kaynak bulunamadı.' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Beklenmeyen bir sunucu hatası oluştu.' });
});

// ─── Seed: Sadece users tablosu tamamen boşsa çalışır ─────────────────────────
const ensureSeedData = async (): Promise<void> => {
  const count = await User.count();

  if (count > 0) {
    // Veri var — hiçbir şey yapma, sessizce geç
    return;
  }

  console.log('⚠️  Veritabanı boş — ilk kullanıcılar oluşturuluyor...');

  const [adminHash, demoHash] = await Promise.all([
    bcrypt.hash('admin123', 12),
    bcrypt.hash('user123', 12),
  ]);

  await User.bulkCreate([
    {
      username: 'admin',
      name: 'Sistem Yöneticisi',
      email: 'admin@taskflow.com',
      password_hash: adminHash,
      isAdmin: true,
      isActive: true,
    },
    {
      username: 'demo',
      name: 'Demo Kullanıcı',
      email: 'demo@taskflow.com',
      password_hash: demoHash,
      isAdmin: false,
      isActive: true,
    },
  ]);

  console.log('✅ Kullanıcılar oluşturuldu:');
  console.log('   admin / admin123  (Admin)');
  console.log('   demo  / user123   (Standart Kullanıcı)');
};

// ─── Başlatma ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı.');

    await sequelize.sync();
    console.log('✅ Modeller senkronize edildi.');

    await ensureSeedData();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT as number, "0.0.0.0", () => {
    console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor!`);
    });

  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

start();

export default app;


// Render sunucusu port denemesi