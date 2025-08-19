import { listOpenBets, allBets } from "../db.js";
import { $, $$ } from "../utils.js";
import { betCard } from "../render.js";

const mount = $("#home-list");
const feed = $("#feed-filter");

function render(list){
  mount.innerHTML = list.length ? list.map(betCard).join("") : `<div class="empty">No bets yet. Be the first to <a href="create.html">create one</a>.</div>`;
}

render(listOpenBets());

feed.addEventListener("change", ()=>{
  const v = feed.value;
  if (v==="open") render(listOpenBets());
  else render(allBets());
});
