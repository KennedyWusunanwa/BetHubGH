import { currentUser, resolveDispute } from "../db.js";
import { $, $$ } from "../utils.js";
import { getBet } from "../db.js";

const list = $("#dispute-list");
const db = JSON.parse(localStorage.getItem("betHubGH_db_v1"));
const disputes = db.disputes.sort((a,b)=>b.createdAt-a.createdAt);
const user = currentUser();

if (!disputes.length) list.innerHTML = `<div class="empty">No disputes currently.</div>`;
else {
  list.innerHTML = disputes.map(d=>{
    const bet = getBet(d.betId);
    return `<article class="card">
      <div class="row" style="justify-content:space-between">
        <div><strong>Dispute #${d.id.slice(-5)}</strong> • Bet ${bet?.id.slice(-5) || "?"}</div>
        <span class="badge">${d.status}</span>
      </div>
      <p style="color:var(--muted)">${d.reason}</p>
      ${user?.isAdmin && d.status==='OPEN' ? `
        <div class="row">
          <button class="btn" data-win="A" data-id="${d.id}">Resolve A</button>
          <button class="btn secondary" data-win="B" data-id="${d.id}">Resolve B</button>
          <button class="btn warn" data-win="YES" data-id="${d.id}">Resolve YES</button>
          <button class="btn warn" data-win="NO" data-id="${d.id}">Resolve NO</button>
        </div>`:""}
    </article>`;
  }).join("");

  if (user?.isAdmin){
    list.addEventListener("click",(e)=>{
      const btn = e.target.closest("button[data-id]"); if(!btn) return;
      try{
        resolveDispute(btn.dataset.id, btn.dataset.win);
        location.reload();
      }catch(err){ alert(err.message); }
    });
  }
}
