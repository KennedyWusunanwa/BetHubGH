import { initDB } from "./db.js";
// bump the query param any time you update render.js to bust GH Pages cache
import { renderHeader, renderFooter } from "./render.js?v=4";

initDB();
renderHeader(document.title || "");
renderFooter();
