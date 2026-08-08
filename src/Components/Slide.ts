interface SlideOptions {}

interface SlideConfig {
	wrapper: string;
	rail: string;
	options?: SlideOptions;
}

interface Distance {
	initial: number;
	moving: number;
	final: number;
}

export default class Slide {
	wrapper: HTMLElement;
	rail: HTMLElement;

	private distance: Distance = {
		initial: 0,
		moving: 0,
		final: 0,
	};

	constructor({ wrapper, rail, options = {} }: SlideConfig) {
		const wrapperElement = document.querySelector<HTMLElement>(wrapper);
		const railElement = document.querySelector<HTMLElement>(rail);

		if (!wrapperElement || !railElement)
			throw new Error(`wrapper or rail not found.`);

		this.wrapper = wrapperElement;
		this.rail = railElement;

		this.binder();
	}

	init() {
		this.mainListener();
		return this;
	}

	binder() {
		this.dragStart = this.dragStart.bind(this);
		this.dragMove = this.dragMove.bind(this);
		this.dragEnd = this.dragEnd.bind(this);
	}

	dragStart(e: PointerEvent) {
		e.preventDefault();
		this.distance.initial = Math.round(e.clientX);
		this.wrapper.addEventListener('pointermove', this.dragMove);
		window.addEventListener('pointerup', this.dragEnd);
	}

	dragMove({ clientX }: PointerEvent) {
		const trackedDist = this.trackOnMoving(clientX);
		this.moveItem(trackedDist, false);
		console.log(this.distance);
	}

	dragEnd(e: PointerEvent) {
		e.preventDefault();
		this.distance.final = this.distance.moving;

		this.wrapper.removeEventListener('pointermove', this.dragMove);
		window.removeEventListener('pointerup', this.dragEnd);
	}

	moveItem(distX: number, transition = true) {
		this.rail.style.transition = transition ? `transform .3s ease` : 'none';
		this.rail.style.transform = `translateX(${distX}px)`;
	}

	trackOnMoving(clientX: number) {
		const calcDist = Math.round((clientX - this.distance.initial) * 1.1);
		this.distance.moving = this.distance.final + calcDist;
		return this.distance.moving;
	}

	mainListener() {
		this.wrapper.addEventListener('pointerdown', this.dragStart);
	}
}
