import 'dotenv/config' // Must be at the very top to load your local .env file
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // This looks for DATABASE_URL inside your local .env file
    url: env('DATABASE_URL'),
  },
})