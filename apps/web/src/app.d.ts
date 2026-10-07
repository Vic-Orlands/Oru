import type { User, Session } from 'better-auth';
import type { workspaces } from '@oso-ahia/db';

type Workspace = typeof workspaces.$inferSelect;

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			workspace?: Workspace;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
