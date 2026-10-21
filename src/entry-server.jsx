import { renderToString } from "react-dom/server";
import App from "./App.jsx";

export { App };
export function render() {
  return renderToString(<App />);
}
