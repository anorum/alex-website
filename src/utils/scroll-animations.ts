interface ScrollAnimationOptions {
  selector: string;
  animationClass?: string;
  staggerDelay?: number;
  threshold?: number;
  once?: boolean;
}

export function initScrollAnimations(options: ScrollAnimationOptions): void {
  const {
    selector,
    animationClass = 'animate-reveal',
    staggerDelay = 100,
    threshold = 0.1,
    once = true,
  } = options;

  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add(animationClass);
          if (once) observer.unobserve(el);
        }
      });
    },
    { threshold }
  );

  elements.forEach((el, i) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.setProperty('--reveal-delay', `${i * staggerDelay}ms`);
    observer.observe(el);
  });
}
