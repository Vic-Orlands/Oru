import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export function createDb(url: string) {
	if (!url) {
		throw new Error('DATABASE_URL is not set. Copy .env.example and start Postgres.');
	}
	const client = postgres(url, { max: 10 });
	return drizzle(client, { schema });
}

let singleton: ReturnType<typeof createDb> | undefined;

export function getDb() {
	if (!singleton) {
		singleton = createDb(process.env.DATABASE_URL ?? '');
	}
	return singleton;
}

export type Database = ReturnType<typeof createDb>;
