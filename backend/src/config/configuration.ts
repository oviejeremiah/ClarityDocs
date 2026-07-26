import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  GEMINI_API_KEY: Joi.string().optional().allow(''),
  GEMINI_MODEL: Joi.string().default('gemini-2.0-flash'),

  OPENROUTER_API_KEY: Joi.string().optional().allow(''),
  OPENROUTER_BASE_URL: Joi.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL_PRIMARY: Joi.string().default('google/gemma-4-31b-it:free'),
  OPENROUTER_MODEL_FALLBACK: Joi.string().default(
    'google/gemma-4-26b-a4b-it:free',
  ),
  OPENROUTER_MODEL_TERTIARY: Joi.string().default(
    'nvidia/nemotron-3-ultra-550b-a55b:free',
  ),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  MAX_FILE_SIZE_MB: Joi.number().default(20),
  CONFIDENCE_REVIEW_THRESHOLD: Joi.number().min(0).max(1).default(0.75),
  UPLOAD_DIR: Joi.string().default('./uploads'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(30),

  SWAGGER_TITLE: Joi.string().default('ClarityDocs API'),
  SWAGGER_DESCRIPTION: Joi.string().default(
    'AI-powered document intelligence platform',
  ),
  SWAGGER_VERSION: Joi.string().default('1.0'),
});

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? '',
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    modelPrimary:
      process.env.OPENROUTER_MODEL_PRIMARY ?? 'google/gemma-4-31b-it:free',
    modelFallback:
      process.env.OPENROUTER_MODEL_FALLBACK ?? 'google/gemma-4-26b-a4b-it:free',
    modelTertiary:
      process.env.OPENROUTER_MODEL_TERTIARY ??
      'nvidia/nemotron-3-ultra-550b-a55b:free',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20', 10),
    uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '30', 10),
  },
  swagger: {
    title: process.env.SWAGGER_TITLE ?? 'ClarityDocs API',
    description:
      process.env.SWAGGER_DESCRIPTION ??
      'AI-powered document intelligence platform',
    version: process.env.SWAGGER_VERSION ?? '1.0',
  },
});
