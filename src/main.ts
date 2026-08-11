import Slide from './Components/Slide';
import './style.css';

const slide = new Slide({
	wrapper: `[data-slide="wrapper"]`,
	rail: `[data-slide="rail"]`,
	options: {
		loop: true,
		itemsPerView: 3,
		slideBy: 'page', // page | item
	},
});
slide.init();
