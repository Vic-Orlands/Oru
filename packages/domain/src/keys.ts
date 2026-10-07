import { createHash, randomBytes } from 'node:crypto';

export function hashApiKey(raw: string): string {
	return createHash('sha256').update(raw).digest('hex');
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
	const raw = `oso_live_${randomBytes(18).toString('base64url')}`;
	return { raw, prefix: raw.slice(0, 16), hash: hashApiKey(raw) };
}
