import 'dotenv/config' // Must be at the very top to load your local .env file
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Use process.env (not prisma's env() helper, which THROWS when the var is
    // unset). `prisma generate` runs at build/install time without DATABASE_URL,
    // and must not crash; the helper's throw was failing the whole deploy.
    // CLI commands (migrate, etc.) still get the real value from .env locally,
    // and runtime queries use the Neon adapter's own connectionString.
    url: process.env.DATABASE_URL ?? '',
  },
})