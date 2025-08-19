import { listOpenBets, allBets } from "../db.js";
import { $ } from "../utils.js";
import { betCard } from "../render.js";

const mount = $("#home-list");
const feed = $("#feed-filter");

function paint(list){
  mount.innerHTML = list?.length
    ? list.map(betCard).join("")
    : `<div class="empty">No bets yet. Be the first to <a href="create.html">create one</a>.</div>`;
}

async function refresh(){
  try{
    const v = feed.value;
    const data = v === "open" ? await listOpenBets() : await allBets();
    paint(data || []);
  }catch(err){
    console.error(err);
    mount.innerHTML = `<div class="notice">Could not load bets. ${err.message || "Network error"}</div>`;
  }
}

feed.addEventListener("change", refresh);
refresh();
setInterval(refresh, 5000);
