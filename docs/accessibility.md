# KnowFlow AI — WCAG 2.2 AA Accessibility Specification

## 1. Accessibility Philosophy

Accessibility is a first-class requirement in KnowFlow AI, not an afterthought. The interface is engineered to adhere to **WCAG 2.2 Level AA** standards.

---

## 2. Implemented Accessibility Features

### A. Semantic DOM & Landmarks

- Standard HTML5 semantic landmarks used throughout: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<article>`, and `<section>`.
- Strict heading hierarchy: exactly one `<h1>` per view, followed logically by `<h2>` and `<h3>`.
- No interactive `<div>` or `<span>` elements without appropriate `role`, `tabIndex`, and keyboard event handlers. Semantic `<button>` and `<a>` elements are used exclusively for user actions.

### B. Keyboard Navigation & Focus Management

- Visible focus rings with high-contrast outlines (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
- Logical Tab ordering matching visual flow.
- Modals, drawers, and popups use Radix UI primitives that implement proper keyboard focus trapping, Escape-to-close, and return-focus behavior.
- Skip to main content link (`<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>`).

### C. Color Contrast & Multi-Modal State Communication

- All body text meets or exceeds the 4.5:1 contrast ratio against its background.
- Large headers and prominent UI controls meet or exceed 3:1 contrast.
- Status is **never communicated by color alone**:
  - Ready documents: Emerald badge + Check icon + explicit text "Ready".
  - Processing documents: Cyan badge + animated pulse icon + explicit text "Processing".
  - Failed documents: Red badge + Alert triangle icon + explicit text "Failed".

### D. Streaming & Screen Reader Live Regions

- Streaming LLM output introduces challenges for screen readers if every incoming token triggers an alert.
- **Solution**:
  - Live token streaming is marked with `aria-live="polite"` only on state transition boundaries (generation started, generation completed, generation stopped, error occurred).
  - The live text container itself avoids spamming the speech synthesizer on every single character delta.
  - A hidden status region announces: _"AI response generation started..."_ and upon completion: _"AI response finished with 2 citations."_

### E. Touch Targets & Zoom

- Minimum touch target size of 44x44 CSS pixels for all interactive controls on mobile and tablet displays.
- Responsive layout fluidly supports 400% browser zoom without horizontal scroll or content clipping.
