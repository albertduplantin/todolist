import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Allow build without DATABASE_URL (will fail at runtime if not provided)
const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dbname';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

