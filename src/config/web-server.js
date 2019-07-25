module.exports = {
    port: process.env.HTTP_PORT || 3000,
    baseUrl: process.env.APP_ENV==='local'?process.env.APP_URL_LOCAL:process.env.APP_URL_PROD,
    appEnv: process.env.APP_ENV,
  };