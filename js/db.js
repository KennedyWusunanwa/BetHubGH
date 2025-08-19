import { supabase } from "./supabaseClient.js";
import { uid, now } from "./utils.js";

// Keep a local "session" (who is the current user name)
const SESSION_KEY = "betHubGH_user";
function readSession(){ return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
function writeSession(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }

export function currentUser(){
  return readSession(); // {username, addr, isAdmin, balance}
}
export function setSessionUser(u){ writeSession(u); }
export function logout(){ localStorage.removeItem(SESSION_KEY); }

export function createUser({username, addr, isAdmin=false}){
  // demo credits are client-only for now
  const user = { id: uid("u_"), username, addr, isAdmin, balance: 5000 };
  writeSession(user);
  return user;
}

export async function allBets(){
  const { data, error } = await supabase
    .from("bets").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function listOpenBets(){
  const { data, error } = await supabase
    .from("bets").select("*").eq("status","OPEN").order("created_at",{ascending:false});
  if (error) throw error;
  return data;
}
export async function getBet(id){
  const { data, error } = await supabase.from("bets").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createBet({type,outcome,stake,expiresIn,resolver,sideForCreator}){
  const user=currentUser(); if(!user) throw new Error("Please connect your wallet first");
  const payload = {
    type,
    outcome,
    stake: Number(stake),
    resolver,
    creator_username: user.username,
    expires_at: new Date(Date.now() + expiresIn*60*1000).toISOString(),
    status: "OPEN",
    participants: [{ user: user.username, side: sideForCreator, stake: Number(stake) }]
  };
  const { data, error } = await supabase.from("bets").insert(payload).select().single();
  if (error) throw error;
  // reduce local demo balance
  user.balance -= Number(stake); writeSession(user);
  return data;
}

export async function joinBet(betId, side){
  const user=currentUser(); if(!user) throw new Error("Connect wallet");
  const bet = await getBet(betId);
  if (bet.status !== "OPEN" || bet.participants.length !== 1) throw new Error("Bet not open");
  const already = bet.participants.some(p=>p.user === user.username);
  if (already) throw new Error("Already in this bet");
  // update participants + status
  const updated = {
    participants: [...bet.participants, { user:user.username, side, stake: bet.stake }],
    status: "MATCHED"
  };
  const { error } = await supabase.from("bets").update(updated).eq("id", betId);
  if (error) throw error;
  user.balance -= Number(bet.stake); writeSession(user);
  return { ok:true };
}

export async function settleBet(betId, winnerSide=null){
  const bet = await getBet(betId);
  if (!["MATCHED","DISPUTED"].includes(bet.status)) throw new Error("Cannot settle now");
  if (!winnerSide) {
    const sides = bet.participants.map(p=>p.side);
    winnerSide = sides[Math.floor(Math.random()*sides.length)];
  }
  const { error } = await supabase.from("bets").update({
    status:"SETTLED",
    winner_side: winnerSide
  }).eq("id", betId);
  if (error) throw error;
  return { winnerSide };
}

export async function raiseDispute(betId, reason){
  const user=currentUser(); if(!user) throw new Error("Connect wallet");
  const { error: e1 } = await supabase.from("disputes").insert({
    bet_id: betId, user_name: user.username, reason, status:"OPEN"
  });
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("bets").update({ status:"DISPUTED" }).eq("id", betId);
  if (e2) throw e2;
  return { ok:true };
}

export async function resolveDispute(disputeId, winnerSide){
  // fetch dispute to get bet_id
  const { data: disp, error: e0 } = await supabase.from("disputes").select("*").eq("id", disputeId).single();
  if (e0) throw e0;
  await settleBet(disp.bet_id, winnerSide);
  const { error } = await supabase.from("disputes").update({ status:"RESOLVED" }).eq("id", disputeId);
  if (error) throw error;
  return { ok:true };
}

/* Stubs kept for header notifications (no-op for now) */
export function myNotifications(){ return []; }
export function markAllRead(){}

/* Helpers kept for other code paths */
export function userById(_id){ return null; } // not needed with usernames
export function isExpired(b){ return Date.now() >= new Date(b.expires_at).getTime(); }
export function resetAll(){ /* no-op for remote mode */ }
