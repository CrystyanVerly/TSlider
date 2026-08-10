import { debounce } from './utils/debounce';

interface SlideConfig {
	wrapper: string;
	rail: string;
	options?: SlideOptions;
}

interface SlideOptions {
	loop?: boolean;
	itemsPerView?: number;
	slideBy?: 'item' | 'page';
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

	// LIFECYCLE

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
			itemsPerView: 1,
			slideBy: 'item',
			...options,
		};

		this.binder();
	}

	init() {
		this.mainListener();
		this.updatePosition();

		return this;
	}

	// EVENTS

	private binder() {
		this.dragStart = this.dragStart.bind(this);
		this.dragMove = this.dragMove.bind(this);
		this.dragEnd = this.dragEnd.bind(this);
		this.onResize = debounce(this.onResize.bind(this), 200);
		this.updatePosition = this.updatePosition.bind(this);
	}

	private mainListener() {
		this.wrapper.addEventListener('pointerdown', this.dragStart);
		window.addEventListener('resize', this.onResize);
	}

	private onResize() {
		const currentIndex = this.slideIndex;

		this.updatePosition();

		const itemsPerView = this.options.itemsPerView ?? 1;
		const maxIndex = Math.max(this.slideElements.length - itemsPerView, 0);

		this.slideIndex = Math.min(currentIndex, maxIndex);

		this.setPosition(this.slideIndex, false);
	}

	// DRAG

	private dragStart(e: PointerEvent) {
		e.preventDefault();

		this.distance.initial = Math.round(e.clientX);
		this.distance.moving = 0;

		this.wrapper.setPointerCapture(e.pointerId);
		this.wrapper.addEventListener('pointermove', this.dragMove);

		window.addEventListener('pointerup', this.dragEnd);
	}

	private dragMove({ clientX }: PointerEvent) {
		this.currentX = clientX;

		if (this.animationFrame !== null) return;

		this.animationFrame = requestAnimationFrame(() => {
			const trackedDist = this.trackOnMoving(this.currentX);
			this.moveItem(trackedDist, false);
			this.distance.moving = Math.round(trackedDist - this.distance.current);
			this.animationFrame = null;
		});
	}

	private dragEnd(e: PointerEvent) {
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

	private direction() {
		const threshold = this.wrapper.offsetWidth * 0.1;

		const { moving } = this.distance;

		if (Math.abs(moving) <= threshold) {
			this.moveTo(this.slideIndex);
			return;
		}

		if (moving < 0) {
			this.nextSlide();
			return;
		}

		this.prevSlide();
	}

	// NAVIGATION

	prevSlide() {
		const { itemsPerView = 1, slideBy = 'page' } = this.options;

		const step = slideBy === 'page' ? itemsPerView : 1;
		const prevIndex = Math.max(this.slideIndex - step, 0);

		this.moveTo(prevIndex);
	}

	nextSlide() {
		const { itemsPerView = 1, slideBy = 'page' } = this.options;

		const step = slideBy === 'page' ? itemsPerView : 1;
		const maxIndex = Math.max(this.slideElements.length - itemsPerView, 0);
		const nextIndex = Math.min(this.slideIndex + step, maxIndex);

		this.moveTo(nextIndex);
	}

	moveTo(index: number) {
		this.setPosition(index);
	}

	// VISUAL STATE

	private setActive() {
		const { itemsPerView = 1 } = this.options;

		this.slideElements.forEach((slide, index) => {
			const active =
				index >= this.slideIndex && index < this.slideIndex + itemsPerView;

			slide.classList.toggle('active', active);
		});
	}

	// LAYOUT / POSITIONS

	private setItemsPerView() {
		const { itemsPerView = 1 } = this.options;

		const gap = parseFloat(getComputedStyle(this.rail).gap) || 0;
		const slideWidth =
			(this.wrapper.offsetWidth - gap * (itemsPerView - 1)) / itemsPerView;

		this.slideElements.forEach((slide) => {
			slide.style.flex = `0 0 ${slideWidth}px`;
		});
	}

	private calcPosition() {
		this.slidePosition = this.slideElements.map((slide, index) => {
			const distLeft = slide.offsetLeft;

			return {
				slide,
				distLeft,
				index,
			};
		});
	}

	private updatePosition() {
		this.setItemsPerView();
		this.calcPosition();

		const itemsPerView = this.options.itemsPerView ?? 1;
		const maxIndex = Math.max(this.slideElements.length - itemsPerView, 0);

		this.slideIndex = Math.min(this.slideIndex, maxIndex);

		this.setPosition(this.slideIndex, false);
	}

	// MOVEMENT

	private setPosition(index: number, transition = true) {
		const item = this.slidePosition[index].distLeft;

		this.moveItem(-item, transition);

		this.distance.current = -item;
		this.slideIndex = index;

		this.setActive();
	}

	private moveItem(distX: number, transition = true) {
		this.rail.style.transition = transition ? `transform .3s ease` : 'none';
		this.rail.style.transform = `translateX(${distX}px)`;
	}

	// CALCULATIONS

	private trackOnMoving(clientX: number) {
		const calcDist = Math.round((clientX - this.distance.initial) * 1.1);

		return this.distance.current + calcDist;
	}
}
