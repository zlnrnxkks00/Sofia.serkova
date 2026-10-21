export default function Approach() {
  return (
    <section
      className="story"
      id="approach"
      aria-label="Мой подход — три принципа"
    >
      <div className="story-stage">
        <picture>
          <source
            media="(max-width: 1100px)"
            srcSet="assets/story-olive-tree-portrait.webp"
            type="image/webp"
            width="724"
            height="2172"
          />
          <img
            className="story-image is-active"
            data-story-image="0"
            src="assets/hero.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width="1536"
            height="1024"
          />
        </picture>
        <img
          className="story-image"
          data-story-image="1"
          src="assets/story-hijama.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          width="1536"
          height="1024"
        />
        <img
          className="story-image"
          data-story-image="2"
          src="assets/story-fohow.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          width="1536"
          height="1024"
        />
        <div className="wrap story-inner">
          <div className="section-kicker">
            <span>{"02 / Мой подход"}</span>
            <span>{"София Серкова"}</span>
          </div>
          <div className="story-panels">
            <article className="story-panel is-active" data-story-panel="0">
              <span className="story-label">{"01 / Понимание"}</span>
              <h2>
                {"Сначала"}
                <br />
                <span className="rose-text">{"человек."}</span>
              </h2>
              <p>
                {
                  "Каждый приём начинаю с вашего запроса. Важно понять, с чем вы пришли, как чувствуете себя и чего ждёте от встречи."
                }
              </p>
              <p className="story-detail">
                {"Работаю со взрослыми и детьми, спортсменами и айтишниками."}
              </p>
            </article>
            <article className="story-panel" data-story-panel="1">
              <span className="story-label">{"02 / Практика"}</span>
              <h2 className="single-line-title">
                {"За каждым движением — "}
                <span className="rose-text">{"опыт."}</span>
              </h2>
              <p>
                {
                  "28 лет практики и 10 лет повышения квалификации. Работаю в том числе со сложными случаями."
                }
              </p>
              <p className="story-detail">
                {
                  "Продолжаю учиться: остеопатический подход, тайский массаж, массаж камнями и другие направления."
                }
              </p>
            </article>
            <article className="story-panel" data-story-panel="2">
              <span className="story-label">{"03 / Выбор"}</span>
              <h2>
                {"Не всё сразу."}
                <br />
                <span className="rose-text">{"Только нужное."}</span>
              </h2>
              <p>
                {
                  "Методику выбираю под вас. Подходящий формат обсуждаем до сеанса."
                }
              </p>
              <p className="story-detail">
                {
                  "Ручной массаж — всего тела или отдельных зон. Хиджама и аппаратный массаж — с учётом состояния и противопоказаний. Внимание к вам. Уважение к вашему запросу."
                }
              </p>
            </article>
          </div>
          <div
            className="story-controls"
            role="group"
            aria-label="Принципы работы"
          >
            <button type="button" data-story-step="0" aria-pressed="true">
              <span>{"01"}</span>
              {"Человек"}
            </button>
            <button type="button" data-story-step="1" aria-pressed="false">
              <span>{"02"}</span>
              {"Опыт"}
            </button>
            <button type="button" data-story-step="2" aria-pressed="false">
              <span>{"03"}</span>
              {"Подход"}
            </button>
            <div className="story-progress" aria-hidden="true">
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
