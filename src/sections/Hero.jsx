export default function Hero() {
  return (
    <section
      className="hero viewport-section"
      id="home"
      aria-labelledby="hero-title"
    >
      <canvas className="hero-energy" aria-hidden="true"></canvas>
      <img
        className="hero-image"
        src="assets/hero-chair.webp"
        alt="София в чёрном платье в кресле"
        fetchPriority="high"
        width="1158"
        height="932"
      />
      <div className="wrap hero-inner">
        <h1 id="hero-title">
          <span className="hero-line">{"София"}</span>
          <span className="hero-line">{"Серкова"}</span>
        </h1>
        <div className="hero-copy hero-enter">
          <p className="hero-message">
            {"Уважение к человеку."}
            <br />
            {"Внимание к телу."}
          </p>
          <div className="hero-actions">
            <a className="button button-rose" href="#contact">
              {"Записаться на приём"}
            </a>
          </div>
        </div>
      </div>
      <div className="wrap hero-foot">
        <span>{"Проспект Кирова, 65"}</span>
        <span>{"Пн–сб · 07:00–21:00"}</span>
      </div>
    </section>
  );
}
