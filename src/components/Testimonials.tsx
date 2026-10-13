import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { Star } from 'lucide-react';
import { testimonials } from '../data';
import type { Testimonial } from '../data';
import './Testimonials.css';

const reviews = testimonials.filter(review => review.category.trim() && review.comment.trim());

function ReviewRating({ review }: { review: Testimonial }) {
  const confirmedRating = review.kind === 'verified' && typeof review.rating === 'number'
    && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    ? review.rating : undefined;
  // Unconfirmed and demonstration rows use five decorative icons, never an asserted rating.
  return <div className="client-reviews-rating-area">
    <div
      className="client-reviews-rating"
      role={confirmedRating === undefined ? undefined : 'img'}
      aria-label={confirmedRating === undefined ? undefined : `${confirmedRating} de 5 estrelas`}
      aria-hidden={confirmedRating === undefined ? true : undefined}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = confirmedRating === undefined || index < confirmedRating;
        return <Star
          key={index}
          size={15}
          fill={filled ? 'currentColor' : 'none'}
          strokeWidth={1.4}
          className={filled ? 'is-rated' : 'is-unrated'}
          aria-hidden="true"
        />;
      })}
    </div>
  </div>;
}

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const autoScroll = useMemo(() => AutoScroll({
    speed: 0.45,
    startDelay: 0,
    playOnInit: false,
    stopOnInteraction: true,
    stopOnMouseEnter: false,
    stopOnFocusIn: false,
  }), []);
  const options = useMemo(() => ({
    loop: true,
    align: 'start' as const,
    dragFree: true,
    watchFocus: false,
    duration: 28,
  }), []);
  const [viewportRef, carousel] = useEmblaCarousel(options, [autoScroll]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!carousel || !container || !reviews.length) return;
    let visible = false;
    let hovering = container.matches(':hover');
    let focused = container.contains(document.activeElement);
    let interacting = false;
    let settling = false;
    let resumeTimer: number | undefined;
    let settleTimer: number | undefined;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');

    const clearResume = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = undefined;
    };
    const canPlay = () => visible && document.visibilityState === 'visible'
      && !preference.matches && !hovering && !focused && !interacting && !settling;
    const updatePlayback = (delay = 0) => {
      clearResume();
      if (!canPlay()) {
        autoScroll.stop();
        return;
      }
      if (autoScroll.isPlaying()) return;
      if (!delay) {
        autoScroll.play();
        return;
      }
      resumeTimer = window.setTimeout(() => {
        resumeTimer = undefined;
        if (canPlay()) autoScroll.play();
      }, delay);
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovering = true;
      updatePlayback();
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovering = false;
      updatePlayback(450);
    };
    const focusIn = () => {
      focused = true;
      updatePlayback();
    };
    const focusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return;
      focused = false;
      updatePlayback(450);
    };
    const pointerDown = () => {
      interacting = true;
      settling = false;
      window.clearTimeout(settleTimer);
      updatePlayback();
    };
    const settle = () => {
      if (!settling) return;
      settling = false;
      window.clearTimeout(settleTimer);
      updatePlayback(450);
    };
    const pointerUp = () => {
      interacting = false;
      if (preference.matches) {
        carousel.scrollTo(carousel.selectedScrollSnap(), true);
        updatePlayback();
        return;
      }
      settling = true;
      updatePlayback();
      // A tap without a drag may not emit settle. Manual momentum remains free to finish.
      settleTimer = window.setTimeout(settle, 1600);
    };
    const visibility = () => updatePlayback(450);
    const reInit = () => {
      interacting = false;
      settling = false;
      window.clearTimeout(settleTimer);
      updatePlayback();
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      updatePlayback(450);
    }, { threshold: 0.12 });

    observer.observe(container);
    container.addEventListener('pointerenter', enter);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('focusin', focusIn);
    container.addEventListener('focusout', focusOut);
    preference.addEventListener('change', visibility);
    document.addEventListener('visibilitychange', visibility);
    carousel.on('pointerDown', pointerDown).on('pointerUp', pointerUp).on('settle', settle).on('reInit', reInit);
    updatePlayback();

    return () => {
      clearResume();
      window.clearTimeout(settleTimer);
      observer.disconnect();
      container.removeEventListener('pointerenter', enter);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('focusin', focusIn);
      container.removeEventListener('focusout', focusOut);
      preference.removeEventListener('change', visibility);
      document.removeEventListener('visibilitychange', visibility);
      carousel.off('pointerDown', pointerDown).off('pointerUp', pointerUp).off('settle', settle).off('reInit', reInit);
      autoScroll.stop();
    };
  }, [carousel, autoScroll]);

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !carousel) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      carousel.scrollNext(reducedMotion);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      carousel.scrollPrev(reducedMotion);
    }
  }

  if (!reviews.length) return null;

  return <div className="client-reviews" ref={containerRef} data-reveal>
    <div
      className="client-reviews-viewport"
      ref={viewportRef}
      role="region"
      aria-label="Depoimentos fornecidos e conteúdos demonstrativos"
      aria-roledescription="carrossel"
      tabIndex={0}
      onKeyDown={navigate}
    >
      <div className="client-reviews-track" aria-live="off">
        {reviews.map(review => {
          const expandable = review.comment.length > 260;
          const expanded = expandedReviews.includes(review.id);
          return <article
            className="client-reviews-slide"
            key={review.id}
            data-review-id={review.id}
            data-review-kind={review.kind}
          >
            <div className="client-reviews-card">
              <ReviewRating review={review} />
              <h3 className="client-reviews-category">{review.category}</h3>
              <blockquote
                id={`review-comment-${review.id}`}
                className={expandable && !expanded ? 'is-collapsed' : undefined}
              >{review.comment}</blockquote>
              {expandable && <button
                type="button"
                className="client-reviews-expand fisheye-glass"
                aria-expanded={expanded}
                aria-controls={`review-comment-${review.id}`}
                onClick={() => setExpandedReviews(current => expanded
                  ? current.filter(id => id !== review.id)
                  : [...current, review.id])}
              >{expanded ? 'Mostrar menos' : 'Ler depoimento completo'}</button>}
            </div>
          </article>;
        })}
      </div>
    </div>
  </div>;
}
