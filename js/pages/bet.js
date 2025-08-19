import { getBet, joinBet, currentUser, raiseDispute, settleBet, isExpired, userById } from "../db.js";
import { $, on, qs, formatDuration, timeLeft } from "../utils.js";

const id = qs.get("id");
const mount = $("#bet-mount");
const actions = $("#bet-actions");
const msg = $("#bet-msg");

function render(){
  const b=getBet(id);
  if(!b){ mount.innerHTML=`<div class="empty">Bet not found.</div>`; actions.innerHTML=""; return; }
  const sides = b.participants.map(p=>p.side).join(" vs ");
  const creator = userById(b.creatorUserId)?.username || "—";
  const players = b.participants.map(p=> userById(p.userId)?.username + ` (${p.side})`).join(", ");
  const expired = isExpired(b);
  mount.innerHTML = `
    <div class="kpi"><div><div class="label">Bet</div><div class="value">#${b.id.slice(-5)} • ${b.type}</div></div>
    <div><div class="label">Stake</div><div class="value">${b.stake}</div></div>
    <div><div class="label">Status</div><div class="value">${b.status}</div></div></div>
    <h2 style="margin:14px 0">${b.outcome}</h2>
    <div class="row">
      <span class="badge">Creator: ${creator}</span>
      <span class="badge">Sides: ${sides || '—'}</span>
      <span class="badge countdown" id="cd">${expired?'Expired':'Ends in …'}</span>
    </div>
    <p style="color:var(--muted)">Players: ${players||"—"}</p>
    ${b.status==='SETTLED' ? `<div class="notice">Winner side: <strong>${b.winnerSide}</strong></div>`:""}
  `;

  // Actions
  const user=currentUser();
  if(!user){ actions.innerHTML=`<a class="btn" href="connect.html">Connect to participate</a>`; return; }

  if (b.status==='OPEN' && b.participants.length===1){
    if (b.type==='YESNO'){
      actions.innerHTML = `
        <div class="row">
          <button class="btn" id="join-yes">Join YES</button>
          <button class="btn secondary" id="join-no">Join NO</button>
        </div>`;
      on($("#join-yes"),"click",()=> tryJoin('YES'));
      on($("#join-no"),"click",()=> tryJoin('NO'));
    } else {
      actions.innerHTML = `
        <div class="row">
          <button class="btn" id="join-a">Join Side A</button>
          <button class="btn secondary" id="join-b">Join Side B</button>
        </div>`;
      on($("#join-a"),"click",()=> tryJoin('A'));
      on($("#join-b"),"click",()=> tryJoin('B'));
    }
  } else if (b.status==='MATCHED' || b.status==='DISPUTED'){
    actions.innerHTML = `
      <div class="row">
        <button class="btn warn" id="dispute">Raise Dispute</button>
        <button class="btn" id="settle">Settle (Auto)</button>
      </div>`;
    on($("#dispute"),"click",()=> tryDispute());
    on($("#settle"),"click",()=> trySettle());
  } else {
    actions.innerHTML = `<div class="notice">No actions available.</div>`;
  }

  // countdown
  const cd = $("#cd");
  if (cd) {
    const t = setInterval(()=>{
      const b2=getBet(id);
      if (!b2) return clearInterval(t);
      if (isExpired(b2)){ cd.textContent = "Expired"; return; }
      cd.textContent = "Ends in " + formatDuration(timeLeft(b2.expiresAt));
    }, 1000);
  }
}

function tryJoin(side){
  try{ joinBet(id, side); msg.textContent="Joined!"; render(); }catch(e){ msg.textContent=e.message; }
}
function tryDispute(){
  const reason = prompt("Reason for dispute?");
  if(!reason) return;
  try{ raiseDispute(id, reason); msg.textContent="Dispute raised."; render(); }catch(e){ msg.textContent=e.message; }
}
function trySettle(){
  try{ const res = settleBet(id, null); msg.textContent=`Settled. Winner: ${res.winnerSide}`; render(); }catch(e){ msg.textContent=e.message; }
}

render();
