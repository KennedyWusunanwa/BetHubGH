import { currentUser, myNotifications, markAllRead } from "../db.js";
import { allBets } from "../db.js";
import { $ } from "../utils.js";
import { betCard } from "../render.js";

const nameEl = $("#user-name");
const blocks = {
  open: $("#list-open"),
  matched: $("#list-matched"),
  settled: $("#list-settled"),
  disputed: $("#list-disputed"),
  activity: $("#activity-list") || document.querySelector("section#activity") || $("#activity") // fallback if HTML not patched yet
};

function fill(el, items) {
  if (!el) return;
  el.innerHTML = items && items.length
    ? items.map(betCard).join("")
    : `<div class="empty">None</div>`;
}

async function loadDashboard() {
  const user = currentUser();
  if (!user) { location.href = "connect.html"; return; }
  nameEl.textContent = user.username;

  try {
    // allBets() can be sync (local) or async (Supabase); await handles both.
    const bets = await allBets();

    // Only this user's bets
    const mine = (bets || []).filter(b =>
      Array.isArray(b.participants) &&
      b.participants.some(p => (p.user || p.username) === user.username)
    );

    const grouped = {
      open: mine.filter(b => b.status === "OPEN"),
      matched: mine.filter(b => b.status === "MATCHED"),
      settled: mine.filter(b => b.status === "SETTLED"),
      disputed: mine.filter(b => b.status === "DISPUTED")
    };

    fill(blocks.open, grouped.open);
    fill(blocks.matched, grouped.matched);
    fill(blocks.settled, grouped.settled);
    fill(blocks.disputed, grouped.disputed);
  } catch (err) {
    console.error(err);
    ["open","matched","settled","disputed"].forEach(k => {
      const el = blocks[k];
      if (el) el.innerHTML = `<div class="notice">Could not load: ${err.message || "Network error"}</div>`;
    });
  }

  // Notifications (localStorage version shows items; Supabase stub returns [])
  try {
    const notes = (typeof myNotifications === "function" ? myNotifications() : []) || [];
    if (blocks.activity) {
      blocks.activity.innerHTML = notes.length ? notes.map(n => `
        <div class="kpi">
          <div>${n.text || "—"}</div>
          <div class="label">${n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
        </div>`).join("") : `<div class="empty">No notifications yet.</div>`;
    }
    if (typeof markAllRead === "function") markAllRead();
  } catch (e) {
    console.warn("Activity not available:", e);
  }
}

loadDashboard();
// Refresh periodically so actions from other sessions show up
setInterval(loadDashboard, 5000);
