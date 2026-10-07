import { config as loadEnv } from 'dotenv';
import { runTick } from '@oso-ahia/jobs';

loadEnv({ path: '../../.env' });
loadEnv({ path: '../../apps/web/.env' });

const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 30_000);

async function loop() {
	try {
		const result = await runTick();
		if (result.approvals || result.tasks || result.advanced || result.reminders) {
			console.log('tick', result);
		}
	} catch (error) {
		console.error('tick failed', error);
	}
}

console.log(`Oso-Ahia worker ticking every ${intervalMs}ms`);
void loop();
setInterval(() => {
	void loop();
}, intervalMs);
