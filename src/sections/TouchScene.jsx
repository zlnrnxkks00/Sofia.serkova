export default function TouchScene() {
  return (
    <section
      className="touch-scene viewport-section"
      id="touch"
      aria-labelledby="touch-title"
    >
      <img
        src="assets/touch-portrait-complete.webp"
        alt="Портрет женщины с кудрями"
        width="1536"
        height="1024"
        loading="lazy"
      />
      <div className="wrap touch-inner">
        <span className="story-label" data-reveal="">
          {"Ручной массаж"}
        </span>
        <h2 id="touch-title" data-reveal="">
          {"Точность."}
          <br />
          {"Внимание."}
          <br />
          <span className="rose-text">{"Восстановление."}</span>
        </h2>
        <p data-reveal="">
          {"Базовый формат для спины, шеи,"}
          <br />
          {"поясницы, ног, рук и лица."}
        </p>
      </div>
    </section>
  );
}
