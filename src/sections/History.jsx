import { useEffect, useRef, useState } from "react";
import { historyEntries, historyImages } from "../data/history.js";

export default function History() {
  const [selected, setSelected] = useState("portrait");
  const [shown, setShown] = useState("portrait");
  const [ready, setReady] = useState(false);
  const images = useRef(new Map());
  const version = useRef(0);
  useEffect(() => {
    setReady(true);
    return () => {
      version.current++;
    };
  }, []);
  function select(entry) {
    setSelected(entry.key);
    const current = ++version.current;
    const image = images.current.get(entry.key);
    const show = () => {
      if (version.current === current) setShown(entry.key);
    };
    if (image?.complete && image.naturalWidth) show();
    else
      image
        ?.decode()
        .then(show)
        .catch(() => {});
  }
  return (
    <section
      className="personal-history section viewport-section"
      id="my-history"
      aria-labelledby="history-title"
    >
      <canvas className="history-energy" aria-hidden="true" />
      <div className="wrap history-screen">
        <div className="section-kicker">
          <span>Мой путь</span>
          <span>София Серкова</span>
        </div>
        <div className="history-layout">
          <figure className="history-figure">
            <div className="history-media">
              {historyImages.map((image) => (
                <img
                  key={image.key}
                  ref={(node) => {
                    if (node) images.current.set(image.key, node);
                    else images.current.delete(image.key);
                  }}
                  className={shown === image.key ? "is-active" : undefined}
                  data-history-media={image.key}
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  aria-hidden={shown !== image.key ? true : undefined}
                />
              ))}
            </div>
            <figcaption className="history-caption">
              {historyEntries.find((entry) => entry.key === shown).caption}
            </figcaption>
          </figure>
          <div className="history-copy">
            <h2 id="history-title">Моя история.</h2>
            <div
              className="history-narrative"
              tabIndex="0"
              role="region"
              aria-label="Рассказ Софии"
            >
              {historyEntries.map((entry) => (
                <p key={entry.key}>
                  <button
                    className={`history-entry${selected === entry.key ? " is-active" : ""}`}
                    type="button"
                    data-history-image={entry.key}
                    data-history-caption={entry.caption}
                    aria-pressed={selected === entry.key}
                    disabled={!ready}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") select(entry);
                    }}
                    onFocus={() => select(entry)}
                    onClick={() => select(entry)}
                  >
                    <span>{entry.text}</span>
                  </button>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
