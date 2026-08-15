import Slide from './Components/Slide';
import './style.css';

const slide = new Slide({
	wrapper: `[data-slide="wrapper"]`,
	rail: `[data-slide="rail"]`,
	options: {
		loop: true,
		itemsPerView: 3,
		slideBy: 'item', // page | item
		controls: {
			arrows: true,
			dots: true,
			pagination: true,
		},
		autoplay: {
			enabled: true,
			pauseOnHover: true,
			delay: 3000,
			controls: true,
		},
	},
});
slide.init();
