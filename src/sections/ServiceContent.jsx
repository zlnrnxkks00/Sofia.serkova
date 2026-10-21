import { Icon } from "../components/Icon.jsx";

export function ServiceIntro() {
  return (
    <div className="services-intro" data-reveal="">
      <h2 id="services-title">
        {"Нужное вам."}
        <br />
        {"В нужном объёме."}
      </h2>
      <div className="services-copy">
        <p>
          {
            "Можно выбрать массаж всего тела или уделить внимание отдельным зонам."
          }
        </p>
        <p>
          {
            "Если пока не знаете, с чего начать, расскажите мне о своём запросе. Формат обсудим до сеанса."
          }
        </p>
        <a className="text-link rose-link" href="tel:+79788088492">
          {"Обсудить по телефону"}
          <Icon name="arrow-up-right" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function PriceNote() {
  return (
    <p className="price-note">
      <Icon name="info" aria-hidden="true" />
      <span>
        {
          "Банки и хиджама проводятся с учётом состояния и противопоказаний. После инфаркта, инсульта, травм и операций возможность массажа и допустимые нагрузки нужно согласовать с лечащим врачом. Массаж не заменяет назначенное лечение."
        }
      </span>
    </p>
  );
}
