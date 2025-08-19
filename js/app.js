import { renderHeader, renderFooter } from "./render.js";
import { initDB } from "./db.js";

initDB();
renderHeader(document.title || "");
renderFooter();
