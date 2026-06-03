import bcrypt from 'bcryptjs';
import sequelize from './config/database'; 
import User from './models/User'; 

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('⏳ Veritabanına bağlanıldı, Admin kontrol ediliyor...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // .findOrCreate veya .upsert kullanıyoruz
    const [user, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        name: 'Sistem Yöneticisi',
        email: 'admin@task.com',
        password_hash: hashedPassword,
        isAdmin: true,
        isActive: true
      }
    });

    // Eğer zaten varsa şifresini güncelliyoruz (Giriş yapabilmen için)
    if (!created) {
      await user.update({ password_hash: hashedPassword });
      console.log('✅ Admin zaten vardı, şifresi admin123 olarak güncellendi.');
    } else {
      console.log('✅ Süper! İlk Admin kullanıcısı başarıyla oluşturuldu.');
    }

    console.log('👉 Kullanıcı Adı: admin');
    console.log('👉 Şifre: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin oluşturulurken hata:', error);
    process.exit(1);
  }
};

seedAdmin();