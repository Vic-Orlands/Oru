import { CRON_SECRET } from '$app/env/private';
import { json } from '@sveltejs/kit';
import { runTick } from '@oso-ahia/jobs';

export const POST = async ({ request }) => {
	const secret = request.headers.get('x-cron-secret');
	if (!secret || secret !== CRON_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const result = await runTick();
	return json(result);
};
