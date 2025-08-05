import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('password'),
  DB_NAME: Joi.string().default('just_swim'),
  JWT_SECRET: Joi.string().required(),

  // Kakao OAuth
  KAKAO_CLIENT_ID: Joi.string().required(),
  KAKAO_CALLBACK_URL: Joi.string().required(),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().optional(),

  // Naver OAuth
  NAVER_CLIENT_ID: Joi.string().optional(),
  NAVER_CLIENT_SECRET: Joi.string().optional(),
  NAVER_CALLBACK_URL: Joi.string().optional(),

  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  BACKEND_URL: Joi.string().default('http://localhost:3001/api'),
});
