import { currentUser, listUserBets, myNotifications, markAllRead } from "../db.js";
import { $, $$ } from "../utils.js";
import { betCard } from "../render.js";

const user = currentUser();
const elName = $("#user-name");
const blocks = {
  open: $("#list-open"),
  matched: $("#list-matched"),
  settled: $("#list-settled"),
  disputed: $("#list-disputed"),
  activity: $("#activity")
};
if(!user){ location.href="connect.html"; }

elName.textContent = user.username;

function fill(id, items){ blocks[id].innerHTML = items.length ? items.map(betCard).join("") : `<div class="empty">None</div>`; }

const lists = listUserBets(user.id);
fill("open", lists.open); fill("matched", lists.matched); fill("settled", lists.settled); fill("disputed", lists.disputed);

const notes = myNotifications();
blocks.activity.innerHTML = notes.length ? notes.map(n=>`
  <div class="kpi">
    <div>${n.text}</div><div class="label">${new Date(n.createdAt).toLocaleString()}</div>
  </div>`).join("") : `<div class="empty">No notifications yet.</div>`;
markAllRead();
