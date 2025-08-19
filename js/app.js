import { renderHeader, renderFooter } from "./render.js?v=3";
import { initDB } from "./db.js";

initDB();
renderHeader(document.title || "");
renderFooter();
