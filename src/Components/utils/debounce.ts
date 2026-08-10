export function debounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number,
) {
	let timer: number | null = null;

	return (...args: Parameters<T>) => {
		if (timer !== null) clearTimeout(timer);

		timer = window.setTimeout(() => {
			callback(...args);
			timer = null;
		}, delay);
	};
}
