import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

/** True zodra een Neon/Postgres-connectiestring beschikbaar is. */
export const isDatabaseConfigured = Boolean(connectionString);

export const sql = connectionString ? neon(connectionString) : null;
