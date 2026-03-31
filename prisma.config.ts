/**
 * Prisma CLI configuration (PostgreSQL).
 * `datasource.url` must match `env("DATABASE_URL")` in prisma/schema.prisma.
 * Use a Neon/Vercel Postgres URL, e.g.
 * postgresql://USER:PASSWORD@HOST.region.aws.neon.tech/neondb?sslmode=require
 */
export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
