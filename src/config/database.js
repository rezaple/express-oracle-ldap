module.exports = {
    hrPool: {
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_HOST,
        poolMin: 32,
        poolMax: 32,
        poolIncrement: 0
    }
  };