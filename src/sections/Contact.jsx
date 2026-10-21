import { Icon } from "../components/Icon.jsx";

export default function Contact() {
  return (
    <section
      className="contact section viewport-section"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="contact-map">
        <iframe
          title="Карта: Симферополь, проспект Кирова, 65"
          src="https://yandex.ru/map-widget/v1/?ll=34.105591%2C44.956396&pt=34.105591%2C44.956396%2Cpm2dgl&z=16"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex="-1"
        ></iframe>
      </div>
      <div
        className="wrap contact-content"
        role="region"
        aria-label="Контакты и время приёма"
      >
        <div className="contact-grid" data-reveal="">
          <div>
            <h2 id="contact-title">
              {"Давайте начнём"}
              <br />
              {"с разговора."}
            </h2>
            <p className="contact-lead">
              {"Расскажите, с чем хотите прийти."}
              <br />
              {"Подберём время для записи."}
            </p>
            <a className="phone-number" href="tel:+79788088492">
              {"+7 978 808 84 92"}
              <Icon name="arrow-up-right" aria-hidden="true" />
            </a>
            <div className="social-links">
              <a
                href="https://t.me/SerkovaSofia24"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Telegram"
                title="Telegram"
              >
                <img
                  src="assets/telegram.svg"
                  alt=""
                  width="35"
                  height="35"
                  aria-hidden="true"
                />
                <span className="social-tooltip" aria-hidden="true">
                  {"Telegram"}
                </span>
              </a>
              <a
                href="https://wa.me/79788088492"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <img
                  src="assets/whatsapp.svg"
                  alt=""
                  width="35"
                  height="35"
                  aria-hidden="true"
                />
                <span className="social-tooltip" aria-hidden="true">
                  {"WhatsApp"}
                </span>
              </a>
              <a
                href="https://vk.ru/id12796762"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="ВКонтакте"
                title="ВКонтакте"
              >
                <img
                  src="assets/vk.svg"
                  alt=""
                  width="35"
                  height="35"
                  aria-hidden="true"
                />
                <span className="social-tooltip" aria-hidden="true">
                  {"ВКонтакте"}
                </span>
              </a>
            </div>
          </div>
          <div className="visit-info">
            <div className="visit-row">
              <Icon name="map-pin" aria-hidden="true" />
              <div>
                <span className="visit-label">{"Адрес"}</span>
                <p>
                  {"Симферополь"}
                  <br />
                  {"Проспект Кирова, 65"}
                </p>
                <a
                  className="text-link"
                  href="https://yandex.ru/maps/?text=%D0%A1%D0%B8%D0%BC%D1%84%D0%B5%D1%80%D0%BE%D0%BF%D0%BE%D0%BB%D1%8C%2C%20%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82%20%D0%9A%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%2C%2065"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {"Открыть карту"}
                  <Icon name="arrow-up-right" aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className="visit-row">
              <Icon name="clock-3" aria-hidden="true" />
              <div>
                <span className="visit-label">{"Время приёма"}</span>
                <p>
                  {"Понедельник — суббота"}
                  <br />
                  {"07:00–21:00"}
                </p>
                <span className="closed-note">{"Воскресенье — выходной"}</span>
              </div>
            </div>
            <p className="appointment-note">
              {"Приём по предварительной записи."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
