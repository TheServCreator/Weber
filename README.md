# Premium Carousels

A production-ready carousel component built with React, TypeScript, Vite, and Embla Carousel.

## Features

✨ **Smooth Autoplay** - Automatic slide progression with configurable delays  
⏱️ **Progress Bar** - Visual indicator of time until next slide  
⬅️➡️ **Navigation Arrows** - Previous/Next button controls  
🔵 **Dot Pagination** - Click to jump to specific slides  
📱 **Swipe & Drag** - Full touch and drag support  
⌨️ **Keyboard Navigation** - Arrow keys to navigate  
⏸️ **Pause on Hover** - Autoplay pauses when hovering  
👁️ **Tab Hidden Pause** - Autoplay pauses when tab is not visible  
♿ **Reduced Motion Support** - Respects user's motion preferences  
🔗 **Clickable Carousels** - Optional link wrapper for carousel blocks  

## Quick Start

### Installation

Clone the repo and install dependencies:

``bash
npm install
``

### Development

Start the development server:

``bash
npm run dev
``

Visit `http://localhost:5173` in your browser.

### Production Build

Build for production:

``bash
npm run build
``

Preview the production build locally:

``bash
npm run preview
``

## Netlify Deployment

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Use these settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** (default is fine)
6. Click "Deploy site"

That's it! Your site will be live in minutes.

## Component Usage

``tsx
import Carousel, { Slide } from "./components/Carousel";

const slides: Slide[] = [
  { id: "1", title: "Slide 1", subtitle: "Description here" },
  { id: "2", title: "Slide 2", subtitle: "Description here" },
];

<Carousel 
  slides={slides}
  height={520}
  seconds={4}
  showDots={true}
  showArrows={true}
  showProgress={true}
  ariaLabel="Main carousel"
/>
``

### Props

- **slides** (required): Array of Slide objects
- **height** (required): Height in pixels
- **rounded**: Border radius (default: 18)
- **seconds**: Autoplay delay in seconds (default: 4)
- **clickableHref**: Make entire carousel a link
- **showDots**: Show dot pagination (default: true)
- **showArrows**: Show prev/next buttons (default: true)
- **showProgress**: Show progress bar (default: true)
- **ariaLabel**: Accessibility label

## Architecture

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Blazing fast build tool
- **Embla Carousel** - Headless carousel library
- **Embla Autoplay** - Autoplay plugin
- **CSS Custom Properties** - Easy theming

## Customization

All colors and styles are defined in `src/styles.css`. Edit the `:root` variables to change the theme globally.

## License

MIT