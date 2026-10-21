export default function Principle() {
  return (
    <section className="statement" id="principle" aria-label="Принцип работы">
      <canvas className="statement-energy" aria-hidden="true"></canvas>
      <div className="wrap statement-inner">
        <span className="statement-label" data-reveal="">
          {"Мой принцип"}
        </span>
        <p>
          <span data-reveal="">{"Хорошая работа"}</span>
          <span data-reveal="">{"начинается с умения"}</span>
          <span className="mint-text" data-reveal="">
            {"слушать."}
          </span>
        </p>
        <span className="statement-sign" data-reveal="">
          {"София Серкова"}
        </span>
      </div>
    </section>
  );
}
