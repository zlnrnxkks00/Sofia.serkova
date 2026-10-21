export default function Footer() {
  return (
    <footer className="footer">
      <canvas className="footer-energy" aria-hidden="true"></canvas>
      <div className="wrap footer-inner">
        <a className="wordmark" href="#home">
          {"София Серкова"}
          <span>{"Массаж и реабилитация"}</span>
        </a>
        <span>{"С вниманием к вам."}</span>
        <a href="tel:+79788088492">{"+7 978 808 84 92"}</a>
      </div>
    </footer>
  );
}
