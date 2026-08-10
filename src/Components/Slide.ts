interface SlideConfig {
	wrapper: string;
	rail: string;
	options?: SlideOptions;
}

interface SlideOptions {
	loop?: boolean;
}

interface Distance {
	initial: number;
	moving: number;
	current: number;
}

interface Position {
	slide: HTMLElement;
	distLeft: number;
	index: number;
}

export default class Slide {
	wrapper: HTMLElement;
	rail: HTMLElement;

	private distance: Distance = {
		initial: 0,
		moving: 0,
		current: 0,
	};

	private slideIndex = 0;
	private slideElements: HTMLElement[];
	private slidePosition: Position[] = [];
	private options: SlideOptions;
	private animationFrame: number | null = null;
	private currentX = 0;

	constructor({ wrapper, rail, options = { loop: false } }: SlideConfig) {
		const wrapperElement = document.querySelector<HTMLElement>(wrapper);
		const railElement = document.querySelector<HTMLElement>(rail);

		if (!wrapperElement || !railElement)
			throw new Error(`wrapper or rail not found.`);

		this.slideElements = Array.from(
			railElement.querySelectorAll<HTMLElement>('[data-slide="slide"]'),
		);

		this.wrapper = wrapperElement;
		this.rail = railElement;
		this.options = {
			loop: false,
			...options,
		};
		this.calcPosition();
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
		this.distance.moving = 0;

		this.wrapper.setPointerCapture(e.pointerId);

		this.wrapper.addEventListener('pointermove', this.dragMove);
		window.addEventListener('pointerup', this.dragEnd);
	}

	dragMove({ clientX }: PointerEvent) {
		this.currentX = clientX;

		if (this.animationFrame !== null) return;

		this.animationFrame = requestAnimationFrame(() => {
			const trackedDist = this.trackOnMoving(this.currentX);
			this.moveItem(trackedDist, false);
			this.distance.moving = Math.round(trackedDist - this.distance.current);
			this.animationFrame = null;
		});
	}

	dragEnd(e: PointerEvent) {
		e.preventDefault();

		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}

		const trackedDist = this.trackOnMoving(this.currentX);
		this.moveItem(trackedDist);

		this.distance.moving = Math.round(trackedDist - this.distance.current);

		this.distance.current = trackedDist;

		this.direction();

		this.wrapper.releasePointerCapture(e.pointerId);
		this.wrapper.removeEventListener('pointermove', this.dragMove);
		window.removeEventListener('pointerup', this.dragEnd);

		this.distance.moving = 0;
	}

	prevSlide() {
		this.slideIndex--;

		this.moveTo(this.slideIndex);
	}
	nextSlide() {
		this.slideIndex++;

		this.moveTo(this.slideIndex);
	}

	direction() {
		const threshold = this.wrapper.offsetWidth * 0.1;
		const { moving } = this.distance;
		console.log(this.slideIndex);

		if (Math.abs(moving) <= threshold) {
			this.moveTo(this.slideIndex);
			return;
		}

		if (moving < 0) {
			if (this.slideIndex < this.slideElements.length - 1) this.nextSlide();
			else this.moveTo(this.slideIndex);
			return;
		}

		if (this.slideIndex > 0) this.prevSlide();
		else this.moveTo(this.slideIndex);
	}

	calcPosition() {
		return (this.slidePosition = this.slideElements.map((slide, index) => {
			const distLeft = slide.offsetLeft;
			return {
				slide,
				distLeft,
				index,
			};
		}));
	}

	moveTo(index: number, distX?: number) {
		const item = this.slidePosition[index].distLeft;

		this.moveItem(-item);
		this.distance.current = -item;
	}

	moveItem(distX: number, transition = true) {
		this.rail.style.transition = transition ? `transform .3s ease` : 'none';
		this.rail.style.transform = `translateX(${distX}px)`;
	}

	trackOnMoving(clientX: number) {
		const calcDist = Math.round((clientX - this.distance.initial) * 1.1);
		return this.distance.current + calcDist;
	}

	mainListener() {
		this.wrapper.addEventListener('pointerdown', this.dragStart);
	}
}
