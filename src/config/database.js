module.exports = {
    hrPool: {
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_HOST,
        poolMin: 10,
        poolMax: 10,
        poolIncrement: 0
    }
  };