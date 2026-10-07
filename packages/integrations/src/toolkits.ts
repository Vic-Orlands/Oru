export type Toolkit = {
	slug: string;
	name: string;
	description: string;
	auth: 'oauth' | 'api_key';
	managed: boolean;
};

/** Sales toolkits Composio actually ships. Slugs match their catalog. */
export const SALES_TOOLKITS: Toolkit[] = [
	{
		slug: 'GMAIL',
		name: 'Gmail',
		description: 'Send approved email from a connected inbox.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'OUTLOOK',
		name: 'Outlook',
		description: 'Send approved email through Microsoft 365.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'GOOGLECALENDAR',
		name: 'Google Calendar',
		description: 'Book a meeting once the invite is approved.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'HUBSPOT',
		name: 'HubSpot',
		description: 'Create or update contacts after approval.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'SALESFORCE',
		name: 'Salesforce',
		description: 'Log leads and activity on the opportunity.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'PIPEDRIVE',
		name: 'Pipedrive',
		description: 'Push approved contacts into a pipeline.',
		auth: 'oauth',
		managed: false
	},
	{
		slug: 'APOLLO',
		name: 'Apollo',
		description: 'Search and enrich people. Uses an API key.',
		auth: 'api_key',
		managed: false
	},
	{
		slug: 'LINKEDIN',
		name: 'LinkedIn',
		description: 'Research a profile before a draft is written.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'SLACK',
		name: 'Slack',
		description: 'Post an approval or a win to a channel.',
		auth: 'oauth',
		managed: true
	},
	{
		slug: 'GONG',
		name: 'Gong',
		description: 'Pull call context into a meeting brief.',
		auth: 'oauth',
		managed: true
	}
];
