import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.scss";

const container = document.getElementById("root");
const app = <App />;
const prerendered = Boolean(container.querySelector("main"));
const root = prerendered ? hydrateRoot(container, app) : createRoot(container);
if (!prerendered) root.render(app);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
