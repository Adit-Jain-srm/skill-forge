---
name: web-perf
description: >-
  Optimize web application performance for Core Web Vitals (LCP, INP, CLS).
  Diagnose slow pages, fix render-blocking resources, optimize images, implement
  code splitting, and configure caching. Use when the user mentions performance,
  page speed, slow loading, LCP, INP, CLS, bundle size, lighthouse score,
  web vitals, or asks to make their site faster.
---

# Web Performance Optimization

Systematic approach to diagnosing and fixing web performance issues, targeting Core Web Vitals.

## Quick Diagnosis Checklist

Before optimizing, measure. Run these in order:

```bash
# Lighthouse CI (if available)
npx lighthouse https://your-site.com --output json --output-path ./lh-report.json

# Bundle analysis (Next.js / Vite / Webpack)
npx next build --analyze  # Next.js
npx vite-bundle-visualizer  # Vite
npx webpack-bundle-analyzer stats.json  # Webpack
```

## Core Web Vitals Targets

| Metric | Good | Needs Work | Poor | What It Measures |
|--------|------|-----------|------|-----------------|
| **LCP** | < 2.5s | 2.5-4.0s | > 4.0s | Largest visible element render time |
| **INP** | < 200ms | 200-500ms | > 500ms | Responsiveness to user input |
| **CLS** | < 0.1 | 0.1-0.25 | > 0.25 | Visual stability (layout shifts) |

## Fix by Metric

### LCP (Largest Contentful Paint)

**Most common causes and fixes:**

1. **Render-blocking resources**
```html
<!-- BAD: blocks render -->
<link rel="stylesheet" href="styles.css">
<script src="app.js"></script>

<!-- GOOD: non-blocking -->
<link rel="stylesheet" href="critical.css">
<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">
<script src="app.js" defer></script>
```

2. **Unoptimized hero image**
```html
<!-- BAD -->
<img src="hero.png" width="1920" height="1080">

<!-- GOOD: responsive, modern format, preloaded, sized -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">
<img src="hero.webp" width="1920" height="1080" 
     srcset="hero-480.webp 480w, hero-960.webp 960w, hero-1920.webp 1920w"
     sizes="100vw" alt="Hero" fetchpriority="high" decoding="async">
```

3. **Slow server response (TTFB)**
```
Fixes:
- Enable CDN (Cloudflare, Vercel Edge, AWS CloudFront)
- Server-side caching (Redis, in-memory)
- Database query optimization (indexes, connection pooling)
- Reduce redirect chains
- Use HTTP/2 or HTTP/3
```

4. **Client-side rendering bottleneck**
```
Fixes:
- SSR/SSG for above-fold content (Next.js, Nuxt, Astro)
- Stream HTML with React Suspense
- Inline critical CSS (< 14KB)
- Preconnect to required origins
```

### INP (Interaction to Next Paint)

**Most common causes and fixes:**

1. **Long tasks blocking main thread**
```javascript
// BAD: 200ms synchronous work
function handleClick() {
  processLargeDataset(data); // blocks for 200ms
  updateUI();
}

// GOOD: yield to browser between chunks
async function handleClick() {
  for (const chunk of chunks(data, 100)) {
    processChunk(chunk);
    await scheduler.yield(); // let browser paint
  }
  updateUI();
}
```

2. **Heavy event handlers**
```javascript
// BAD: re-render entire list on each keystroke
input.addEventListener('input', () => renderList(filter(items)));

// GOOD: debounce + startTransition
input.addEventListener('input', debounce(() => {
  startTransition(() => renderList(filter(items)));
}, 150));
```

3. **JavaScript bundle too large**
```
Fixes:
- Code split by route (dynamic import)
- Tree-shake unused code
- Replace heavy libraries (moment→dayjs, lodash→lodash-es)
- Defer non-critical JS
- Use web workers for computation
```

### CLS (Cumulative Layout Shift)

**Most common causes and fixes:**

1. **Images without dimensions**
```html
<!-- BAD: causes shift when image loads -->
<img src="photo.jpg">

<!-- GOOD: aspect ratio reserved -->
<img src="photo.jpg" width="800" height="600">
<!-- Or with CSS aspect-ratio -->
<img src="photo.jpg" style="aspect-ratio: 4/3; width: 100%">
```

2. **Dynamic content insertion**
```css
/* Reserve space for dynamic content (ads, embeds) */
.ad-slot { min-height: 250px; }
.embed-container { aspect-ratio: 16/9; }
```

3. **Web fonts causing FOUT**
```css
/* Prevent layout shift from font swap */
@font-face {
  font-family: 'Custom';
  src: url('font.woff2') format('woff2');
  font-display: swap;
  size-adjust: 100.5%; /* match fallback metrics */
  ascent-override: 95%;
  descent-override: 22%;
}
```

## Optimization Checklist

### Critical Path
- [ ] Inline critical CSS (< 14KB)
- [ ] Preload LCP image with `fetchpriority="high"`
- [ ] Preconnect to third-party origins
- [ ] Defer non-critical JavaScript
- [ ] Remove unused CSS (PurgeCSS / Tailwind purge)

### Images
- [ ] Use WebP/AVIF format
- [ ] Responsive srcset with proper sizes
- [ ] Lazy-load below-fold images (`loading="lazy"`)
- [ ] Set explicit width/height on all images
- [ ] Use CDN for image delivery

### JavaScript
- [ ] Code-split by route
- [ ] Tree-shake (ESM imports only)
- [ ] Dynamic import for heavy components
- [ ] Web worker for CPU-intensive work
- [ ] Remove unused polyfills

### Caching
- [ ] Immutable assets: `Cache-Control: max-age=31536000, immutable`
- [ ] HTML: `Cache-Control: no-cache` (revalidate)
- [ ] Service Worker for offline + cache-first static assets
- [ ] CDN cache with proper purge strategy

### Fonts
- [ ] Self-host fonts (avoid Google Fonts render-blocking)
- [ ] Preload critical font files
- [ ] Use `font-display: swap` with size-adjust
- [ ] Subset fonts to required characters only

## Framework-Specific

### Next.js
```javascript
// next.config.js optimizations
module.exports = {
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: { optimizeCss: true },
  compiler: { removeConsole: { exclude: ['error'] } }
};
```

### Vite
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: { output: { manualChunks: { vendor: ['react', 'react-dom'] } } },
    cssCodeSplit: true,
    minify: 'terser'
  }
};
```

## Common Mistakes

- Optimizing without measuring first (you might fix the wrong thing)
- Adding `loading="lazy"` to above-fold images (hurts LCP)
- Excessive preloading (everything preloaded = nothing prioritized)
- Client-side rendering when SSR would eliminate the LCP problem entirely
- Focusing on bundle size when the real bottleneck is TTFB
- Using `will-change` on everything (wastes GPU memory)
