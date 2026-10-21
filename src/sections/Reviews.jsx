import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { reviews } from "../data/reviews.js";

export default function Reviews() {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const viewer = useRef(null);
  const opener = useRef(null);
  const image = reviews[current];
  const move = (direction) =>
    setCurrent(
      (index) => (index + direction + reviews.length) % reviews.length,
    );
  useEffect(() => {
    if (open && !viewer.current.open) viewer.current.showModal();
    else if (!open && viewer.current.open) viewer.current.close();
  }, [open]);
  return (
    <section
      className="reviews section viewport-section"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="wrap">
        <div className="section-kicker">
          <span>05 / Отзывы</span>
          <span>Спасибо за ваше доверие</span>
        </div>
        <h2 id="reviews-title">Слова благодарности</h2>
        <div className="review-stage">
          <div className="review-device">
            <div className="review-screen">
              <div
                className="reviews-gallery"
                tabIndex="0"
                role="region"
                aria-label="Скриншоты отзывов"
              >
                <div className="reviews-grid">
                  {reviews.map((review, index) => (
                    <button
                      className="review-item"
                      type="button"
                      key={review.src}
                      title={`Открыть отзыв ${index + 1}`}
                      onClick={(event) => {
                        opener.current = event.currentTarget;
                        setCurrent(index);
                        setOpen(true);
                      }}
                    >
                      <img
                        src={review.src}
                        alt={`Скриншот отзыва ${index + 1}`}
                        width={review.width}
                        height={review.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="review-stand" aria-hidden="true" />
            <div className="review-device-base" aria-hidden="true" />
          </div>
        </div>
      </div>
      <dialog
        className="review-viewer"
        aria-label="Просмотр отзывов"
        ref={viewer}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        onClose={() => {
          setOpen(false);
          opener.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div className="review-toolbar">
          <span className="review-counter" aria-live="polite">
            {current + 1} / {reviews.length}
          </span>
          <button
            className="icon-button"
            type="button"
            data-review-prev=""
            aria-label="Предыдущий отзыв"
            title="Предыдущий отзыв"
            onClick={() => move(-1)}
          >
            <Icon name="chevron-left" aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            data-review-next=""
            aria-label="Следующий отзыв"
            title="Следующий отзыв"
            onClick={() => move(1)}
          >
            <Icon name="chevron-right" aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            data-review-close=""
            aria-label="Закрыть отзыв"
            title="Закрыть отзыв"
            onClick={() => setOpen(false)}
          >
            <Icon name="x" aria-hidden="true" />
          </button>
        </div>
        <img
          className="review-full-image"
          src={image.src}
          width={image.width}
          height={image.height}
          loading="lazy"
          alt={`Отзыв ${current + 1}`}
        />
      </dialog>
    </section>
  );
}
