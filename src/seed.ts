import bcrypt from 'bcryptjs';
import sequelize from './config/database'; // Veritabanı bağlantısı
import User from './models/User'; // Kullanıcı modeli

const seedAdmin = async () => {
  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    console.log('⏳ Veritabanına bağlanıldı, Admin oluşturuluyor...');
    
    // Şifreyi şifrele (12 salt rounds, yapay zekanın notuna uygun)
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Kullanıcıyı veritabanına ekle
    await User.create({
      username: 'admin',
      name: 'Sistem Yöneticisi',
      email: 'admin@task.com',
      password_hash: hashedPassword,
      isAdmin: true,
      isActive: true
    }); 

    console.log('✅ Süper! İlk Admin kullanıcısı başarıyla oluşturuldu.');
    console.log('👉 Kullanıcı Adı: admin');
    console.log('👉 Şifre: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin oluşturulurken hata:', error);
    process.exit(1);
  }
};

seedAdmin();