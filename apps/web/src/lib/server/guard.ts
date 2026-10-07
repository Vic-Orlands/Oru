import { redirect } from '@sveltejs/kit';
import type { user, workspaces } from '@oso-ahia/db';

type Workspace = typeof workspaces.$inferSelect;
type AuthUser = typeof user.$inferSelect;

export function requireDesk(locals: App.Locals): { workspace: Workspace; user: AuthUser } {
	if (!locals.workspace || !locals.user) redirect(303, '/');
	return { workspace: locals.workspace, user: locals.user as AuthUser };
}
