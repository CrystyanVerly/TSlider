import Slide from './Components/Slide';
import './style.css';

const slide = new Slide({
	wrapper: `[data-slide="wrapper"]`,
	rail: `[data-slide="rail"]`,
});
slide.init();
