export const theme = $state({ dark: false });

export function syncTheme() {
	theme.dark = document.documentElement.classList.contains('dark');
}

export function toggleTheme() {
	theme.dark = !theme.dark;
	document.documentElement.classList.toggle('dark', theme.dark);
	localStorage.setItem('oso-theme', theme.dark ? 'dark' : 'light');
}
