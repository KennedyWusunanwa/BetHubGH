import { createBet } from "../db.js";
import { $, on } from "../utils.js";

const form = $("#create-form");
const out = $("#create-out");

on(form, "submit", async (e)=>{
  e.preventDefault();
  out.textContent = "";
  try{
    const type = form.type.value;
    const outcome = form.outcome.value.trim();
    const stake = Number(form.stake.value);
    const expiresIn = Number(form.expires.value);
    const resolver = form.resolver.value;
    const sideForCreator = type==="YESNO" ? form.sideYesNo.value : form.sideH2H.value;

    const bet = await createBet({type,outcome,stake,expiresIn,resolver,sideForCreator});
    out.innerHTML = `<div class="notice">Bet created! <a href="bet.html?id=${bet.id}">Open it</a>.</div>`;
    form.reset();
  }catch(err){
    console.error(err);
    out.innerHTML = `<div class="notice">Create failed: ${err.message || "error"}</div>`;
  }
});
