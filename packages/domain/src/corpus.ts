import type { Prospect } from './types.js';

function person(
	firstName: string,
	lastName: string,
	title: string,
	company: string,
	domain: string,
	location: string,
	industry: string,
	employeeCount: number,
	phone: string
): Prospect {
	const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '');
	return {
		firstName,
		lastName,
		email: `${slug}@${domain}`,
		title,
		company,
		domain,
		linkedinUrl: `https://www.linkedin.com/in/${slug.replace('.', '-')}`,
		location,
		industry,
		employeeCount,
		phone
	};
}

/** Prospects already living in the seeded workspace. */
export const SEEDED_PROSPECTS: Prospect[] = [
	person('Amara', 'Diallo', 'VP Sales', 'Kolaform', 'kolaform.com', 'Lagos', 'fintech', 140, '+234 803 441 2201'),
	person('Chinedu', 'Okeke', 'Head of Growth', 'Bramble Pay', 'bramblepay.com', 'Lagos', 'fintech', 86, '+234 809 112 8844'),
	person('Zainab', 'Bello', 'RevOps Lead', 'Harborline', 'harborline.co', 'Accra', 'logistics', 210, '+233 24 555 0192'),
	person('Kwame', 'Mensah', 'CRO', 'Silt & Cedar', 'siltcedar.com', 'Accra', 'climate', 54, '+233 20 441 7781'),
	person('Amina', 'Yusuf', 'Head of Sales', 'Nuru Health', 'nuruhealth.io', 'Nairobi', 'healthtech', 320, '+254 711 220 334'),
	person('Ifeanyi', 'Eze', 'Founder', 'Marketday', 'marketday.app', 'Lagos', 'retail tech', 18, '+234 802 900 1144'),
	person('Lena', 'Vogt', 'VP Sales', 'Northglass', 'northglass.dev', 'Berlin', 'developer tools', 190, '+49 30 4401 228'),
	person('Jonah', 'Pike', 'Head of Growth', 'Fieldnote', 'fieldnote.io', 'London', 'saas', 75, '+44 20 7946 0991'),
	person('Priya', 'Raman', 'RevOps Lead', 'Ledger & Co', 'ledgerandco.com', 'New York', 'fintech', 410, '+1 212 555 0144'),
	person('Mateo', 'Alvarez', 'AE Manager', 'Mesa Route', 'mesaroute.com', 'Austin', 'logistics', 130, '+1 512 555 0177'),
	person('Hannah', 'Berg', 'CRO', 'Paperlane', 'paperlane.so', 'Berlin', 'saas', 60, '+49 30 1209 441'),
	person('Samuel', 'Adeyemi', 'Head of Sales', 'Orange Circuit', 'orangecircuit.dev', 'Lagos', 'developer tools', 95, '+234 701 332 9088'),
	person('Fatima', 'Hassan', 'VP Sales', 'Sahel Cloud', 'sahelcloud.com', 'Nairobi', 'saas', 250, '+254 722 100 228'),
	person('Eliot', 'Marsh', 'Head of Growth', 'Kindling HR', 'kindlinghr.com', 'London', 'saas', 180, '+44 20 3984 2210'),
	person('Nora', 'Lind', 'RevOps Lead', 'Fjord Metrics', 'fjordmetrics.io', 'Berlin', 'developer tools', 70, '+49 30 8891 220'),
	person('Tunde', 'Bakare', 'SDR Manager', 'Payloom', 'payloom.com', 'Lagos', 'fintech', 44, '+234 805 221 0091'),
	person('Grace', 'Mwangi', 'Head of Sales', 'Twiga Freight', 'twigafreight.com', 'Nairobi', 'logistics', 500, '+254 733 441 902'),
	person('Owen', 'Clarke', 'VP Sales', 'Bracken Studio', 'bracken.studio', 'London', 'saas', 88, '+44 20 4520 1184'),
	person('Chioma', 'Umeh', 'Founder', 'Stall & Stem', 'stallandstem.com', 'Lagos', 'saas', 22, '+234 803 770 2219'),
	person('Daniel', 'Cho', 'Head of Growth', 'Relayboard', 'relayboard.com', 'New York', 'saas', 260, '+1 646 555 0190'),
	person('Sofia', 'Martins', 'CRO', 'Atelier Grid', 'ateliergrid.com', 'Berlin', 'retail tech', 110, '+49 30 2210 884'),
	person('Malik', 'Johnson', 'VP Sales', 'Copperline', 'copperline.io', 'Austin', 'fintech', 340, '+1 512 555 0133'),
	person('Yaa', 'Asante', 'Head of Sales', 'Cocoa Stack', 'cocoastack.com', 'Accra', 'logistics', 67, '+233 24 880 2214'),
	person('Helen', 'Okoro', 'RevOps Lead', 'Clinicnote', 'clinicnote.health', 'Lagos', 'healthtech', 150, '+234 809 441 7720'),
	person('Felix', 'Berger', 'Head of Growth', 'Kant Works', 'kantworks.dev', 'Berlin', 'developer tools', 40, '+49 30 6671 209'),
	person('Ruth', 'Adebanjo', 'VP Sales', 'Lantern Bank', 'lanternbank.com', 'London', 'fintech', 780, '+44 20 3318 4402'),
	person('Ibrahim', 'Sule', 'Head of Sales', 'Sahel Routes', 'sahelroutes.com', 'Accra', 'logistics', 190, '+233 20 119 3348'),
	person('Maya', 'Chen', 'CRO', 'Northwind Desk', 'northwinddesk.com', 'New York', 'saas', 120, '+1 917 555 0166'),
	person('Peter', 'Lang', 'Head of Growth', 'Quilt Analytics', 'quiltanalytics.com', 'Austin', 'saas', 95, '+1 512 555 0188'),
	person('Ngozi', 'Ekwueme', 'VP Sales', 'Palm Registry', 'palmregistry.com', 'Lagos', 'fintech', 210, '+234 802 118 6640'),
	person('Jonas', 'Keller', 'RevOps Lead', 'Stackharbor', 'stackharbor.dev', 'Berlin', 'developer tools', 160, '+49 30 4412 778'),
	person('Aisha', 'Bello', 'Head of Sales', 'Kite Market', 'kitemarket.co', 'Nairobi', 'retail tech', 80, '+254 701 228 441'),
	person('Ben', 'Carter', 'VP Sales', 'Harbor & Hume', 'harborhume.com', 'London', 'saas', 300, '+44 20 7940 2281'),
	person('Chiara', 'Rossi', 'Head of Growth', 'Vela Pay', 'velapay.com', 'Berlin', 'fintech', 140, '+49 30 2281 009'),
	person('Emeka', 'Nwankwo', 'Founder', 'Stallbook', 'stallbook.app', 'Lagos', 'retail tech', 16, '+234 701 009 2281'),
	person('Laura', 'Kim', 'Head of Sales', 'Kindred Ops', 'kindredops.com', 'New York', 'saas', 220, '+1 212 555 0119'),
	person('Kofi', 'Boateng', 'RevOps Lead', 'Goldline', 'goldline.africa', 'Accra', 'fintech', 90, '+233 24 220 1187'),
	person('Sarah', 'Quinn', 'CRO', 'Maple Queue', 'maplequeue.com', 'Austin', 'saas', 55, '+1 512 555 0104'),
	person('Tobi', 'Adebayo', 'Head of Growth', 'Orbit SMS', 'orbitsms.com', 'Lagos', 'saas', 64, '+234 809 220 4411'),
	person('Ingrid', 'Solberg', 'VP Sales', 'Fjordline Data', 'fjordline.dev', 'Berlin', 'developer tools', 275, '+49 30 9001 224'),
	person('James', 'Okello', 'Head of Sales', 'Rift Supply', 'riftsupply.com', 'Nairobi', 'logistics', 430, '+254 722 880 114'),
	person('Claire', 'Dupont', 'RevOps Lead', 'Atelier North', 'ateliernorth.com', 'London', 'retail tech', 100, '+44 20 3890 4412'),
	person('Hassan', 'Ali', 'VP Sales', 'Crescent Ledger', 'crescentledger.com', 'New York', 'fintech', 360, '+1 646 555 0172'),
	person('Adaobi', 'Ike', 'Head of Growth', 'Nsukka Cloud', 'nsukkacloud.dev', 'Lagos', 'developer tools', 48, '+234 803 551 2290'),
	person('Mark', 'Ellison', 'Head of Sales', 'Bramble HR', 'bramblehr.com', 'Austin', 'saas', 210, '+1 737 555 0140'),
	person('Leila', 'Haddad', 'CRO', 'Cedar Clinic', 'cedarclinic.health', 'London', 'healthtech', 190, '+44 20 4521 7780'),
	person('Obi', 'Nnamdi', 'VP Sales', 'River Market', 'rivermarket.co', 'Accra', 'retail tech', 72, '+233 20 448 2291'),
	person('Freya', 'Nielsen', 'Head of Growth', 'Paperkite', 'paperkite.so', 'Berlin', 'saas', 130, '+49 30 2218 663')
];

/** Not seeded. The finder can add these on a fresh workspace. */
export const DISCOVERY_POOL: Prospect[] = [
	person('Seyi', 'Balogun', 'VP Sales', 'Lagoon Ledger', 'lagoonledger.com', 'Lagos', 'fintech', 160, '+234 802 441 9088'),
	person('Ayo', 'Lawal', 'Head of Growth', 'Kiln Analytics', 'kilnanalytics.dev', 'London', 'developer tools', 84, '+44 20 3988 2201'),
	person('Nia', 'Owusu', 'Head of Sales', 'Cargo Mint', 'cargomint.com', 'Accra', 'logistics', 240, '+233 24 118 2290'),
	person('Erik', 'Holm', 'CRO', 'Brightwharf', 'brightwharf.so', 'Berlin', 'saas', 150, '+49 30 4418 220'),
	person('Nadia', 'Farouk', 'RevOps Lead', 'Quarterlamp', 'quarterlamp.com', 'New York', 'fintech', 280, '+1 347 555 0181'),
	person('Jide', 'Ogunleye', 'VP Sales', 'Palmwire', 'palmwire.io', 'Lagos', 'saas', 110, '+234 809 330 2214'),
	person('Anika', 'Desai', 'Head of Growth', 'Southbank Grid', 'southbankgrid.com', 'London', 'saas', 200, '+44 20 4510 2288'),
	person('Theo', 'Brandt', 'Head of Sales', 'Kitline', 'kitline.dev', 'Berlin', 'developer tools', 92, '+49 30 7781 204'),
	person('Wanjiku', 'Kamau', 'VP Sales', 'Highland Freight', 'highlandfreight.co', 'Nairobi', 'logistics', 310, '+254 711 880 229'),
	person('Chris', 'Dalton', 'Head of Growth', 'Mesa Mint', 'mesamint.com', 'Austin', 'fintech', 175, '+1 512 555 0199'),
	person('Bisi', 'Adewale', 'RevOps Lead', 'Court & Current', 'courtcurrent.com', 'Lagos', 'fintech', 70, '+234 803 220 1184'),
	person('Marta', 'Silva', 'CRO', 'Linen Ops', 'linenops.com', 'Berlin', 'saas', 125, '+49 30 2201 448')
];

const QUERY_STOPWORDS = new Set([
	'a',
	'an',
	'and',
	'are',
	'find',
	'for',
	'in',
	'lead',
	'leads',
	'me',
	'of',
	'our',
	'people',
	'please',
	'prospect',
	'prospects',
	'search',
	'some',
	'source',
	'the',
	'to',
	'who',
	'with'
]);

function stem(token: string) {
	if (token.length > 2 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
	return token;
}

export function queryTokens(text: string): string[] {
	return text
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.map(stem)
		.filter((part) => part.length > 1 && !QUERY_STOPWORDS.has(part));
}

export function searchProspects(
	pool: Prospect[],
	query: { text?: string; industry?: string; location?: string },
	limit = 8
): Prospect[] {
	const tokens = queryTokens(query.text ?? '');
	const industry = query.industry?.trim().toLowerCase() ?? '';
	const location = query.location?.trim().toLowerCase() ?? '';
	return pool
		.filter((prospect) => {
			const blob =
				`${prospect.title} ${prospect.company} ${prospect.industry} ${prospect.location} ${prospect.firstName} ${prospect.lastName}`.toLowerCase();
			if (tokens.length > 0 && !tokens.every((token) => blob.includes(token))) return false;
			if (industry && !prospect.industry.toLowerCase().includes(industry)) return false;
			if (location && !prospect.location.toLowerCase().includes(location)) return false;
			return true;
		})
		.slice(0, limit);
}
