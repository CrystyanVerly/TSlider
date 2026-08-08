interface SlideOptions {}

interface SlideConfig {
	wrapper: string;
	rail: string;
	options?: SlideOptions;
}

export default class Slide {
	wrapper: HTMLElement | null;
	rail: HTMLElement | null;
	constructor({ wrapper, rail, options = {} }: SlideConfig) {
		this.wrapper = document.querySelector<HTMLElement>(wrapper);
		this.rail = document.querySelector<HTMLElement>(rail);

		if (!this.wrapper || !this.rail)
			throw new Error(`Wraper or rail not found.`);
	}
}
