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

	private originalSlides: HTMLElement[] = [];
	private physicalSlides: HTMLElement[] = [];
	private hasClones = false;
	private loopDirection: 'next' | 'prev' | null = null;
	private isLoopTransitioning = false;

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
			slideBy: 'page', // page | item
			...options,
		};

		this.originalSlides = Array.from(
			railElement.querySelectorAll<HTMLElement>('[data-slide="slide"]'),
		);

		this.slideElements = [...this.originalSlides];

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
		this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
	}

	private mainListener() {
		this.wrapper.addEventListener('pointerdown', this.dragStart);
		window.addEventListener('resize', this.onResize);
		this.rail.addEventListener('transitionend', this.handleTransitionEnd);
	}

	private onResize() {
		this.updatePosition(this.slideIndex);
	}

	// DRAG

	private dragStart(e: PointerEvent) {
		if (this.isLoopTransitioning) return;

		e.preventDefault();

		this.distance.initial = Math.round(e.clientX);
		this.distance.moving = 0;

		this.currentX = e.clientX;

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

		this.moveItem(trackedDist, false);

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

	private getClosesNavigationIndex(currentIndex: number, indexes: number[]) {
		if (!indexes.length) return 0;

		return indexes.reduce((closest, index) => {
			const currentDistance = Math.abs(index - currentIndex);
			const closestDistance = Math.abs(closest - currentIndex);

			return currentDistance < closestDistance ? index : closest;
		});
	}

	private getNavigationIndexes() {
		const total = this.originalSlides.length;
		const itemsPerView = Math.min(this.options.itemsPerView ?? 1, total);
		const { slideBy = 'page', loop = false } = this.options;

		if (!total) return [0];
		if (loop && slideBy === 'item')
			return Array.from({ length: total }, (_, index) => index);

		const maxIndex = Math.max(total - itemsPerView, 0);

		if (slideBy === 'item') {
			return Array.from({ length: maxIndex + 1 }, (_, index) => index);
		}

		const indexes: number[] = [];

		for (let index = 0; index <= maxIndex; index += itemsPerView)
			indexes.push(index);

		if (indexes[indexes.length - 1] !== maxIndex) indexes.push(maxIndex);

		return indexes;
	}

	prevSlide() {
		if (this.isLoopTransitioning) return;
		const { loop = false } = this.options;
		const indexes = this.getNavigationIndexes();

		const currentPosition = indexes.indexOf(this.slideIndex);

		if (currentPosition === -1) return;

		const isFirst = currentPosition === 0;

		if (loop && isFirst) {
			this.moveToLoopClone('prev');
			return;
		}

		const prevPosition = Math.max(currentPosition - 1, 0);

		this.moveTo(indexes[prevPosition]);
	}

	nextSlide() {
		if (this.isLoopTransitioning) return;
		const { loop = false } = this.options;
		const indexes = this.getNavigationIndexes();

		const currentPosition = indexes.indexOf(this.slideIndex);

		if (currentPosition === -1) return;

		const isLast = currentPosition === indexes.length - 1;

		if (loop && isLast) {
			this.moveToLoopClone('next');
			return;
		}

		const nextPosition = Math.min(currentPosition + 1, indexes.length - 1);

		this.moveTo(indexes[nextPosition]);
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

	// CLONE

	private createClones() {
		if (this.hasClones) return;

		const { itemsPerView = 1 } = this.options;

		const before = this.originalSlides
			.slice(-itemsPerView)
			.map((slide) => slide.cloneNode(true) as HTMLElement);

		const after = this.originalSlides
			.slice(0, itemsPerView)
			.map((slide) => slide.cloneNode(true) as HTMLElement);

		const beforeFragment = document.createDocumentFragment();
		const afterFragment = document.createDocumentFragment();

		before.reverse().forEach((slide) => {
			beforeFragment.prepend(slide);
		});

		after.forEach((slide) => {
			afterFragment.append(slide);
		});

		this.rail.prepend(beforeFragment);
		this.rail.append(afterFragment);

		this.physicalSlides = Array.from(
			this.rail.querySelectorAll<HTMLElement>('[data-slide="slide"]'),
		);

		this.hasClones = true;
	}

	private getPhysicalIndex(index: number) {
		if (!this.options.loop) return index;

		const { itemsPerView = 1 } = this.options;

		return index + itemsPerView;
	}

	private moveToLoopClone(direction: 'next' | 'prev') {
		if (this.isLoopTransitioning) return;

		this.isLoopTransitioning = true;
		this.loopDirection = direction;

		const { itemsPerView = 1, slideBy = 'page' } = this.options;

		const step = slideBy === 'page' ? itemsPerView : 1;
		const currentPhysicalIndex = this.getPhysicalIndex(this.slideIndex);

		const targetPhysicalIndex =
			direction === 'next'
				? currentPhysicalIndex + step
				: currentPhysicalIndex - step;

		const targetX = -this.slidePosition[targetPhysicalIndex].distLeft;

		if (Math.round(this.distance.current) === Math.round(targetX)) {
			this.finishLoopTransition();
			return;
		}

		this.moveToPhysical(targetPhysicalIndex, true);
	}

	private moveToPhysical(index: number, transition = true) {
		const item = this.slidePosition[index].distLeft;

		this.moveItem(-item, transition);
		this.distance.current = -item;
	}

	private finishLoopTransition() {
		if (!this.loopDirection) return;

		const direction = this.loopDirection;

		if (!direction) {
			this.isLoopTransitioning = false;
			return;
		}
		const indexes = this.getNavigationIndexes();
		const targetIndex =
			direction === 'next' ? indexes[0] : indexes[indexes.length - 1];

		this.loopDirection = null;

		this.setPosition(targetIndex, false);

		this.isLoopTransitioning = false;
	}

	private handleTransitionEnd(e: TransitionEvent) {
		if (e.target !== this.rail) return;
		if (e.propertyName !== 'transform') return;
		if (!this.loopDirection) return;
		this.finishLoopTransition();
	}

	// LAYOUT / POSITIONS

	private setItemsPerView() {
		const { itemsPerView = 1 } = this.options;

		const gap = parseFloat(getComputedStyle(this.rail).gap) || 0;
		const slideWidth =
			(this.wrapper.offsetWidth - gap * (itemsPerView - 1)) / itemsPerView;

		this.physicalSlides.forEach((slide) => {
			slide.style.flex = `0 0 ${slideWidth}px`;
		});
	}

	private calcPosition() {
		this.slidePosition = this.physicalSlides.map((slide, index) => ({
			slide,
			distLeft: slide.offsetLeft,
			index,
		}));
	}

	private updatePosition(preferredIndex = this.slideIndex) {
		if (this.options.loop) this.createClones();
		else this.physicalSlides = this.originalSlides;

		this.setItemsPerView();
		this.calcPosition();

		const indexes = this.getNavigationIndexes();

		const nextIndex = indexes.includes(preferredIndex)
			? preferredIndex
			: this.getClosesNavigationIndex(preferredIndex, indexes);

		this.setPosition(nextIndex, false);
	}

	// MOVEMENT

	private setPosition(index: number, transition = true) {
		const physicalIndex = this.getPhysicalIndex(index);

		this.moveToPhysical(physicalIndex, transition);
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
