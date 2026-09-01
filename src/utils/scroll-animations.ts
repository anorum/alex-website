interface ScrollAnimationOptions {
  selector: string;
  animationClass?: string;
  threshold?: number;
  once?: boolean;
}

// Reveals elements as they scroll into view. Stagger between siblings is
// handled in CSS (.stagger-children) so nothing waits on a page-wide index.
export function initScrollAnimations(options: ScrollAnimationOptions): void {
  const { selector, animationClass = 'animate-reveal', threshold = 0.1, once = true } = options;

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass);
          if (once) observer.unobserve(entry.target);
        }
      });
    },
    { threshold }
  );

  elements.forEach((el) => observer.observe(el));
}
