//export a self-calling method as the config

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  app: {
    name: process.env.APP_NAME,
    email: process.env.APP_EMAIL,
  },
  secrets: {
    jwtSecret: process.env.JWT_CONSTANT,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
