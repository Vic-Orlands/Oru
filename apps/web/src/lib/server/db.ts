import { DATABASE_URL } from '$app/env/private';
import { createDb } from '@oso-ahia/db';

export const db = createDb(DATABASE_URL);
