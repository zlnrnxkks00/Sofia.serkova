export default function Expertise() {
  return (
    <section
      className="expertise section"
      id="expertise"
      aria-labelledby="expertise-title"
    >
      <div className="wrap">
        <div className="section-kicker">
          <span>{"01 / Опыт"}</span>
          <span>{"Мудрость, которой можно доверять"}</span>
        </div>
        <h2 className="center-heading" id="expertise-title" data-reveal="">
          {"Опыт — в руках."}
          <br />
          {"Забота — "}
          <span className="rose-text">{"о вас."}</span>
        </h2>
        <div className="facts-inner">
          <div data-reveal="">
            <span className="fact-number">
              <span data-counter="28">{"28"}</span>
              <span className="fact-plus">{"+"}</span>
            </span>
            <p>
              {"лет практики в массаже"}
              <br />
              {"и реабилитации"}
            </p>
          </div>
          <div className="fact-training" data-reveal="">
            <span className="fact-number">
              <span data-counter="10">{"10"}</span>
              <span className="fact-plus">{"+"}</span>
            </span>
            <p>
              {"лет повышения"}
              <br />
              {"квалификации"}
            </p>
          </div>
          <div className="fact-certificates" data-reveal="">
            <span className="fact-number">
              <span data-counter="20">{"20"}</span>
              <span className="fact-plus">{"+"}</span>
            </span>
            <p>
              {"сертификатов"}
              <br />
              {"по направлениям массажа"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
