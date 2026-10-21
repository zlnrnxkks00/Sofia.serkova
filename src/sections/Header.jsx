import { Icon } from "../components/Icon.jsx";
import { useMobileMenu } from "../hooks/useMobileMenu.js";

const links = [
  ["approach", "Мой подход"],
  ["services", "Услуги и цены"],
  ["questions", "Вопросы"],
  ["contact", "Контакты"],
];
const socials = [
  ["https://t.me/SerkovaSofia24", "Telegram"],
  ["https://wa.me/79788088492", "WhatsApp"],
  ["https://vk.ru/id12796762", "ВКонтакте"],
];

export default function Header() {
  const menu = useMobileMenu();
  const visible = menu.phase !== "hidden";
  const open = menu.phase === "open";
  return (
    <header
      className="header"
      ref={menu.headerRef}
      role={visible ? "dialog" : undefined}
      aria-modal={visible ? true : undefined}
      aria-label={visible ? "Меню сайта" : undefined}
    >
      <div className="header-inner wrap">
        <a
          className="wordmark"
          href="#home"
          aria-label="София Серкова — начало страницы"
          onClick={menu.onLink}
        >
          <span className="brand-lockup">
            serkova
            <small className="brand-tagline">Массаж и реабилитация</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a href="#approach">Мой подход</a>
          <a href="#services">Услуги и цены</a>
          <a href="#contact">Контакты</a>
        </nav>
        <a
          className="header-call"
          href="tel:+79788088492"
          aria-label="Позвонить Софии и записаться"
          title="Позвонить Софии"
        >
          <Icon name="phone" aria-hidden="true" />
        </a>
        <button
          ref={menu.buttonRef}
          className="menu-toggle icon-button"
          type="button"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          title={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={menu.toggle}
        >
          <Icon name="menu" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={menu.navRef}
        id="mobile-nav"
        className="mobile-nav"
        hidden={!visible}
        inert={!open}
        onTransitionEnd={menu.onTransitionEnd}
      >
        <div className="mobile-nav-inner">
          <nav className="mobile-nav-links" aria-label="Мобильная навигация">
            {links.map(([id, label], index) => (
              <a key={id} href={`#${id}`} onClick={menu.onLink}>
                <span className="menu-index" aria-hidden="true">
                  0{index + 1}
                </span>
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="mobile-nav-footer">
            <a
              className="mobile-nav-phone"
              href="tel:+79788088492"
              onClick={menu.onLink}
            >
              +7 978 808 84 92
            </a>
            <div className="mobile-nav-socials">
              {socials.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={menu.onLink}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
