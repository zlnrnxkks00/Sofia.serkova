export default function Audiences() {
  return (
    <section
      className="audience-section section"
      id="for-you"
      aria-labelledby="audience-title"
    >
      <div className="wrap">
        <div className="section-kicker" data-reveal="">
          <span>{"03 / Для вас"}</span>
        </div>
        <h2 id="audience-title" data-reveal="">
          {"У каждого тела"}
          <br />
          <span className="rose-text">{"своя история."}</span>
        </h2>
        <div className="audiences">
          <article data-reveal="">
            <span className="small-index">{"01"}</span>
            <h3>{"После нагрузок"}</h3>
            <p>{"Для спортсменов и тех, кто ведёт активный образ жизни."}</p>
          </article>
          <article data-reveal="">
            <span className="small-index">{"02"}</span>
            <h3>{"При сидячей работе"}</h3>
            <p>{"Когда спине и шее нужно внимание после рабочего дня."}</p>
          </article>
          <article data-reveal="">
            <span className="small-index">{"03"}</span>
            <h3>{"Для взрослых и детей"}</h3>
            <p>{"Индивидуальная работа, в том числе в сложных случаях."}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
