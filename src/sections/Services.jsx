import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { services } from "../data/services.jsx";
import { ServiceIntro, PriceNote } from "./ServiceContent.jsx";

const filters = [
  ["all", "Все услуги"],
  ["manual", "Ручной массаж"],
  ["special", "Другие методы"],
];

export default function Services() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [ready, setReady] = useState(false);
  const buttons = useRef(new Map());
  useEffect(() => {
    document.documentElement.classList.add("has-service-disclosures");
    setReady(true);
    const outside = (event) => {
      if (!event.target.closest(".price-row")) setExpanded(null);
    };
    document.addEventListener("click", outside);
    return () => {
      document.removeEventListener("click", outside);
      document.documentElement.classList.remove("has-service-disclosures");
    };
  }, []);
  return (
    <section
      className="services section"
      id="services"
      aria-labelledby="services-title"
    >
      <div className="wrap">
        <div className="section-kicker">
          <span>04 / Услуги</span>
          <span>Прозрачно и по делу</span>
        </div>
        <div className="services-grid">
          <ServiceIntro />
          <div className="price-list" data-reveal="">
            <div className="pricing-heading">
              <h3>Услуги и стоимость</h3>
              <div
                className="filters"
                role="group"
                aria-label="Категории услуг"
              >
                {filters.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    data-filter={id}
                    aria-pressed={filter === id}
                    onClick={() => {
                      setExpanded(null);
                      setFilter(id);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="price-grid">
              {services.map((service) => {
                const open = !ready || expanded === service.id;
                return (
                  <div
                    key={service.id}
                    className={`price-row${ready && open ? " is-expanded" : ""}`}
                    data-category={service.category}
                    hidden={filter !== "all" && filter !== service.category}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        buttons.current.get(service.id)?.focus();
                        setExpanded(null);
                      }
                    }}
                  >
                    <h3>
                      <button
                        ref={(node) => {
                          if (node) buttons.current.set(service.id, node);
                          else buttons.current.delete(service.id);
                        }}
                        className="service-toggle"
                        id={`toggle-${service.id}`}
                        type="button"
                        aria-expanded={open}
                        aria-controls={`description-${service.id}`}
                        title={
                          ready && open ? "Скрыть описание" : "Описание услуги"
                        }
                        disabled={!ready}
                        onClick={() => setExpanded(open ? null : service.id)}
                      >
                        <span>{service.title}</span>
                        <Icon name="chevron-down" aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      className="service-description"
                      id={`description-${service.id}`}
                      role="region"
                      aria-labelledby={`toggle-${service.id}`}
                      tabIndex="0"
                      hidden={!open}
                    >
                      {service.description}
                    </div>
                    {service.price ? (
                      <span className="price">{service.price}</span>
                    ) : (
                      <dl className="price-options">
                        {service.options.map(([duration, price]) => (
                          <div key={duration}>
                            <dt>{duration}</dt>
                            <dd>{price}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>
            <PriceNote />
          </div>
        </div>
      </div>
    </section>
  );
}
