import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  dialectOptions: process.env.DB_HOST?.includes('neon.tech') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined, // boş string yerine undefined — socket auth için önemli
  logging: process.env.NODE_ENV === 'development'
    ? (sql: string) => console.log(`[SQL] ${sql.slice(0, 120)}...`)
    : false,
  define: {
    timestamps: true,
    underscored: false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;