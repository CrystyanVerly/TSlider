# 🎞️ Slide

A lightweight and customizable slider library built with **TypeScript**, focused on smooth interactions, accessibility, responsive behavior, and a clean separation between functionality and visual styling.

The library provides the core slider behavior without depending on a UI framework, making it easy to integrate into different projects and customize according to the application's design.

---

## 🌐 Live Demo

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://tslider.vercel.app)

--

## 🚀 Features

- ↔️ Drag and swipe navigation
- ⬅️ Previous / next navigation
- 🔘 Dot navigation
- 🔢 Pagination
- 🔁 Infinite loop
- ▶️ Autoplay
- ⏸️ Play / pause autoplay control
- 🖱️ Pause autoplay on hover
- 👀 Pause autoplay when the slider is not visible
- ⌨️ Keyboard navigation with arrow keys
- 📱 Responsive items per view
- 🎯 Navigate by item or page
- ♿ Support for `prefers-reduced-motion`
- 🧩 Fully customizable controls
- 📦 No UI framework required
- 💪 Written in TypeScript

---

## 🛠️ Tech Stack

- TypeScript
- JavaScript DOM API
- CSS
- Pointer Events
- `requestAnimationFrame`
- `IntersectionObserver`

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/CrystyanVerly/TSlider.git
```

Navigate into the project:

```bash
cd Slide
```

Install dependencies:

```bash
npm install
```

---

## 💻 Usage

The slider requires a wrapper element and a rail containing the slides.

```html
<div data-slide="wrapper">
	<div data-slide="rail">
		<div data-slide="slide">Slide 1</div>

		<div data-slide="slide">Slide 2</div>

		<div data-slide="slide">Slide 3</div>
	</div>
</div>
```

Initialize the slider:

```ts
import Slide from './Slide';

const slide = new Slide({
	wrapper: '[data-slide="wrapper"]',
	rail: '[data-slide="rail"]',
});

slide.init();
```

---

## ⚙️ Configuration

The slider can be customized through the `options` property.

```ts
const slide = new Slide({
	wrapper: '[data-slide="wrapper"]',
	rail: '[data-slide="rail"]',

	options: {
		loop: true,

		itemsPerView: 3,

		slideBy: 'page',

		controls: {
			arrows: true,
			dots: true,
			pagination: true,
		},

		autoplay: {
			enabled: true,
			delay: 3000,
			pauseOnHover: true,
			controls: true,
		},
	},
});

slide.init();
```

### Available options

| Option                  | Type               |  Default | Description                          |
| ----------------------- | ------------------ | -------: | ------------------------------------ |
| `loop`                  | `boolean`          |  `false` | Enables infinite navigation          |
| `itemsPerView`          | `number`           |      `1` | Number of slides displayed at once   |
| `slideBy`               | `'item' \| 'page'` | `'page'` | Defines the navigation step          |
| `controls.arrows`       | `boolean`          |  `false` | Displays previous / next buttons     |
| `controls.dots`         | `boolean`          |  `false` | Displays dot navigation              |
| `controls.pagination`   | `boolean`          |  `false` | Displays current / total pagination  |
| `autoplay.enabled`      | `boolean`          |  `false` | Enables autoplay                     |
| `autoplay.delay`        | `number`           |   `3000` | Delay between slides in milliseconds |
| `autoplay.pauseOnHover` | `boolean`          |   `true` | Pauses autoplay while hovering       |
| `autoplay.controls`     | `boolean`          |  `false` | Displays play / pause control        |

---

## 🎯 Navigation

The slider supports two navigation modes.

### Item

Moves one slide at a time:

```ts
slideBy: 'item';
```

### Page

Moves according to the number of visible items:

```ts
slideBy: 'page';
```

For example, with:

```ts
itemsPerView: 3,
slideBy: 'page'
```

each navigation action moves three slides.

---

## 🔁 Infinite Loop

When `loop` is enabled, the slider creates cloned slides at both ends of the rail.

```ts
loop: true;
```

This allows navigation to continue seamlessly from the last slide back to the first and vice versa.

The loop transition is handled internally, keeping the visual movement continuous while maintaining the correct logical slide index.

---

## ▶️ Autoplay

Autoplay can be enabled independently from the other controls.

```ts
autoplay: {
  enabled: true,
  delay: 3000,
}
```

It can also be paused automatically when the user interacts with the slider:

```ts
autoplay: {
  enabled: true,
  pauseOnHover: true,
  controls: true,
}
```

The slider also stops autoplay when it leaves the viewport and resumes when it becomes visible again.

---

## 🎨 Customization

The slider separates its **behavior** from its **visual appearance**.

The TypeScript class is responsible for the slider logic, while the CSS controls its appearance.

The stylesheet is divided into two main sections:

```css
/* SLIDE — STRUCTURAL STYLES */

/* SLIDE — CUSTOMIZABLE STYLES */
```

Structural styles should remain unchanged, while the customizable section can be modified to match the project's design.

For example:

```css
:root {
	--slide-control-color: rgb(255 255 255);
	--slide-control-background: rgb(255 255 255 / 0.12);
	--slide-control-border: rgb(255 255 255 / 0.18);
}
```

This allows the controls to be visually customized without modifying the slider logic.

---

## ♿ Accessibility

The slider includes several accessibility considerations:

- Keyboard navigation using `ArrowLeft` and `ArrowRight`
- Accessible labels for navigation controls
- `aria-current` for the active dot
- Focusable slider wrapper
- Support for `prefers-reduced-motion`
- Interactive controls using semantic `<button>` elements

Reduced motion is detected using:

```ts
window.matchMedia('(prefers-reduced-motion: reduce)');
```

When reduced motion is preferred, autoplay is disabled.

---

## 🧠 Highlights

Some of the main implementation details include:

- Type-safe configuration through TypeScript interfaces
- Pointer Events for mouse and touch interaction
- `requestAnimationFrame` for smoother drag updates
- Debounced resize handling
- Dynamic calculation of slide positions
- Clone-based infinite looping
- Automatic calculation of navigation indexes
- Separation between logical and physical slide positions
- `IntersectionObserver` for viewport visibility
- Automatic autoplay lifecycle management
- Proper cleanup through `destroy()`

The slider also prevents unnecessary interaction while animations are running, avoiding conflicting navigation states.

---

## 🧹 Destroy

The slider provides a `destroy()` method to remove event listeners, observers, controls, timers, and animation frames.

```ts
slide.destroy();
```

This makes the component safer to use in applications where the slider may be dynamically mounted or removed.

---

## 📁 Project Structure

```text
src/
├── assets/
│   └── controls/
│       ├── arrow-left.svg
│       ├── arrow-right.svg
│       ├── dots-navigation.svg
│       ├── play.svg
│       └── pause.svg
│
├── utils/
│   └── debounce.ts
│
├── Slide.ts
└── style.css
```

---

## 🎯 Why I Built It

This project was created to practice building a reusable UI component from scratch, focusing not only on the visual result but also on the underlying interaction logic.

Instead of relying on an existing slider library, the goal was to understand and implement the mechanics behind:

- Dragging
- Navigation
- Infinite scrolling
- Autoplay
- Responsive behavior
- Accessibility
- Animation control
- Component lifecycle

---

## 👨‍💻 Author

Developed by **Crystyan Verly** 😉

---

## 📄 License

This project is licensed under the MIT License.
