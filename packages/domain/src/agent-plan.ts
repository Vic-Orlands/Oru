export type AgentToolName = 'findLeads' | 'draftEmail' | 'createTask' | 'campaignSummary';

export type AgentPlan = {
	preface: string;
	tool?: AgentToolName;
};

export function planAgentTurn(text: string): AgentPlan {
	const value = text.toLowerCase();
	if (/(find|search|source|prospect|lead)/.test(value)) {
		return {
			preface: 'I’ll look through the market index and keep only people who clear your ICP.',
			tool: 'findLeads'
		};
	}
	if (/(email|draft|write|outreach|reply)/.test(value)) {
		return {
			preface: 'Drafting a note for the approval queue. Nothing sends until you approve it.',
			tool: 'draftEmail'
		};
	}
	if (/(task|remind|follow)/.test(value)) {
		return {
			preface: 'Adding that to the desk so it doesn’t live only in the thread.',
			tool: 'createTask'
		};
	}
	if (/(campaign|sequence)/.test(value)) {
		return {
			preface: 'Here’s where the live sequences stand.',
			tool: 'campaignSummary'
		};
	}
	return {
		preface:
			'I can find leads, draft outreach for approval, create tasks, or summarise a campaign. Tell me which desk you want moved.'
	};
}
