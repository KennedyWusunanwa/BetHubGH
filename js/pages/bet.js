import { getBet, joinBet, currentUser, raiseDispute, settleBet } from "../db.js";
import { $, on, qs, formatDuration, timeLeft } from "../utils.js";

const id = qs.get("id");
const mount = $("#bet-mount");
const actions = $("#bet-actions");
const msg = $("#bet-msg");

async function loadBet(){
  try{
    const b = await getBet(id);
    render(b);
  }catch(err){
    console.error(err);
    mount.innerHTML = `<div class="empty">Failed to load bet.</div>`;
    actions.innerHTML = "";
  }
}

function render(b){
  if(!b){ mount.innerHTML=`<div class="empty">Bet not found.</div>`; actions.innerHTML=""; return; }
  const parts = Array.isArray(b.participants) ? b.participants : [];
  const sides = parts.map(p=>p.side).join(" vs ");
  const players = parts.map(p => `${p.user} (${p.side})`).join(", ");
  const expired = Date.now() >= new Date(b.expires_at || 0).getTime();

  mount.innerHTML = `
    <div class="kpi">
      <div><div class="label">Bet</div><div class="value">#${(b.id||"").toString().slice(-5)} • ${b.type}</div></div>
      <div><div class="label">Stake</div><div class="value">${b.stake}</div></div>
      <div><div class="label">Status</div><div class="value">${b.status}</div></div>
    </div>
    <h2 style="margin:14px 0">${b.outcome}</h2>
    <div class="row">
      <span class="badge">Creator: ${b.creator_username || "—"}</span>
      <span class="badge">Sides: ${sides || '—'}</span>
      <span class="badge countdown" id="cd">${expired?'Expired':'Ends in …'}</span>
    </div>
    <p style="color:var(--muted)">Players: ${players||"—"}</p>
    ${b.status==='SETTLED' ? `<div class="notice">Winner side: <strong>${b.winner_side}</strong></div>`:""}
  `;

  const user = currentUser();
  if(!user){ actions.innerHTML=`<a class="btn" href="connect.html">Connect to participate</a>`; return; }

  if (b.status==='OPEN' && parts.length===1){
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

  const cd = $("#cd");
  if (cd && b.expires_at) {
    const t = setInterval(async ()=>{
      try{
        const b2 = await getBet(id);
        if (!b2) { clearInterval(t); return; }
        const msLeft = Math.max(0, new Date(b2.expires_at).getTime() - Date.now());
        if (msLeft<=0){ cd.textContent = "Expired"; return; }
        const s = Math.ceil(msLeft/1000), m = Math.floor(s/60), sec = s%60, h = Math.floor(m/60), mm = m%60;
        cd.textContent = h>0 ? `${h}h ${mm}m` : `${mm}m ${sec}s`;
      }catch{}
    }, 1000);
  }
}

async function tryJoin(side){
  try{ await joinBet(id, side); msg.textContent="Joined!"; await loadBet(); }
  catch(e){ console.error(e); msg.textContent=e.message || "Join failed"; }
}
async function tryDispute(){
  const reason = prompt("Reason for dispute?"); if(!reason) return;
  try{ await raiseDispute(id, reason); msg.textContent="Dispute raised."; await loadBet(); }
  catch(e){ console.error(e); msg.textContent=e.message || "Dispute failed"; }
}
async function trySettle(){
  try{ const res = await settleBet(id, null); msg.textContent=`Settled. Winner: ${res.winnerSide}`; await loadBet(); }
  catch(e){ console.error(e); msg.textContent=e.message || "Settle failed"; }
}

loadBet();
