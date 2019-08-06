module.exports = {
    port: process.env.HTTP_PORT || 3000,
    baseUrl: process.env.APP_ENV==='local'?process.env.APP_URL_LOCAL:process.env.APP_URL_PROD,
    baseUrlImage: process.env.BASE_URL_IMAGE,
    baseUrlImageAmc: process.env.BASE_URL_IMAGE_AMC,
    appEnv: process.env.APP_ENV,
  };