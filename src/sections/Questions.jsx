import { Icon } from "../components/Icon.jsx";

export default function Questions() {
  return (
    <section
      className="questions section"
      id="questions"
      aria-labelledby="questions-title"
    >
      <div className="wrap questions-grid">
        <div>
          <div className="section-kicker">
            <span>{"06 / До встречи"}</span>
          </div>
          <h2 id="questions-title">{"Если есть вопросы."}</h2>
          <p className="questions-intro">{"Можно просто позвонить."}</p>
        </div>
        <div
          className="faq-list"
          data-reveal=""
          tabIndex="0"
          role="region"
          aria-label="Вопросы и ответы"
        >
          <details>
            <summary>
              {"Можно прийти, если не знаю, какой массаж нужен?"}
              <Icon name="plus" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              {
                "Да. При записи расскажите, что вас беспокоит и чего вы ожидаете от сеанса. Подходящий формат обсудим с учётом вашего состояния."
              }
            </div>
          </details>
          <details>
            <summary>
              {"Вы принимаете детей?"}
              <Icon name="plus" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              {
                "Да, я работаю со взрослыми и детьми. Возраст ребёнка и запрос можно обсудить по телефону до записи."
              }
            </div>
          </details>
          <details>
            <summary>
              {"Сколько длится сеанс?"}
              <Icon name="plus" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              {
                "Биоэнергомассаж аппаратом FOHOW длится от 30 минут до часа. Длительность ручного массажа уточним при записи: она зависит от выбранного формата."
              }
            </div>
          </details>
          <details>
            <summary>
              {"Как записаться на приём?"}
              <Icon name="plus" aria-hidden="true" />
            </summary>
            <div className="faq-answer">
              {"Позвоните по номеру "}
              <a href="tel:+79788088492">{"+7 978 808 84 92"}</a>
              {
                " или напишите в Telegram, WhatsApp либо ВК. Принимаю с понедельника по субботу, с 07:00 до 21:00. Воскресенье — выходной."
              }
            </div>
          </details>
          <p className="faq-caption">{"А можно сначала прочитать здесь."}</p>
        </div>
      </div>
    </section>
  );
}
