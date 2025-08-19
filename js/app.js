// /js/app.js
function ensureShell() {
  if (!document.querySelector(".header")) {
    const h = document.createElement("header");
    h.className = "header";
    document.body.prepend(h);
  }
  if (!document.querySelector(".footer")) {
    const f = document.createElement("footer");
    f.className = "footer";
    document.body.appendChild(f);
  }
}

async function boot() {
  ensureShell();

  // Load db.js optionally (initDB may not exist in remote-DB version)
  try {
    const dbMod = await import("./db.js?v=1");
    if (typeof dbMod.initDB === "function") {
      await dbMod.initDB();
    }
  } catch (e) {
    console.warn("db.js optional load:", e?.message || e);
  }

  // Load header/footer and render them
  try {
    const { renderHeader, renderFooter } = await import("./render.js?v=6");
    renderHeader(document.title || "");
    renderFooter();
  } catch (err) {
    console.error("Failed to load header:", err);
    const h = document.querySelector(".header");
    if (h) h.innerHTML = `<div class="notice">Header failed to load. ${err.message}</div>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
