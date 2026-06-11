import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

document.documentElement.setAttribute("data-boot", "entry");

// Router basename must match Vite's base so deep links work under the GitHub
// Pages subpath (e.g. /focus/). import.meta.env.BASE_URL is "/focus/" in prod.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
document.documentElement.setAttribute("data-boot", "basename:" + basename);

try {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
} catch (e) {
  document.body.innerHTML =
    "<pre style='padding:16px;white-space:pre-wrap'>BOOT ERROR: " +
    String((e as Error)?.stack || e) +
    "</pre>";
}
