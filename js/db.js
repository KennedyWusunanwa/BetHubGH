import { uid, now } from "./utils.js";

const DB_KEY = "betHubGH_db_v1";
const defaultDB = {
  treasury: 0,
  users: [],       // {id, username, addr, balance, isAdmin}
  bets: [],        // see schema below
  disputes: [],    // {id, betId, userId, reason, createdAt, status:'OPEN'|'RESOLVED', resolution?:{winnerSide}}
  notifications:[],// {id, userId, text, createdAt, read}
  session: { userId: null }
};
/*
 Bet:
 {
   id, type:'YESNO'|'H2H', outcome, stake, resolver:'AUTO'|'ADMIN',
   creatorUserId, createdAt, expiresAt,
   participants:[{userId, side:'YES'|'NO'|'A'|'B', stake}],
   status:'OPEN'|'MATCHED'|'SETTLED'|'DISPUTED',
   winnerSide:null|'YES'|'NO'|'A'|'B'
 }
*/

const read = () => JSON.parse(localStorage.getItem(DB_KEY) || "null");
const write = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

export function initDB() {
  if (!read()) {
    const db = structuredClone(defaultDB);
    write(db);
  }
}
const db = () => read();

export function currentUser(){
  const d = db(); return d.users.find(u=>u.id===d.session.userId) || null;
}
export function setSession(userId){
  const d=db(); d.session.userId=userId; write(d);
}
export function logout(){
  const d=db(); d.session.userId=null; write(d);
}
export function createUser({username, addr, isAdmin=false}){
  const d=db();
  if (d.users.some(u=>u.username.toLowerCase()===username.toLowerCase())) throw new Error("Username already exists");
  const user = {id:uid("u_"), username, addr, isAdmin, balance:5000};
  d.users.push(user);
  d.session.userId = user.id;
  write(d);
  notify(user.id, `Welcome ${username}! You’ve been credited with ${user.balance} demo GHC`);
  return user;
}
export function allBets(){ return db().bets.sort((a,b)=>b.createdAt-a.createdAt); }
export function getBet(id){ return db().bets.find(b=>b.id===id)||null; }
export function userById(id){ return db().users.find(u=>u.id===id)||null; }
export function listOpenBets(){ return allBets().filter(b=>b.status==='OPEN'); }
export function listUserBets(uid){
  const bets = allBets().filter(b=>b.participants.some(p=>p.userId===uid));
  return {
    open: bets.filter(b=>b.status==='OPEN'),
    matched: bets.filter(b=>b.status==='MATCHED'),
    settled: bets.filter(b=>b.status==='SETTLED'),
    disputed: bets.filter(b=>b.status==='DISPUTED')
  };
}
export function createBet({type,outcome,stake,expiresIn,resolver,sideForCreator}){
  const d=db(), user=currentUser();
  if(!user) throw new Error("Please connect your wallet first");
  stake=Number(stake||0);
  if (stake<=0) throw new Error("Stake must be > 0");
  if (user.balance<stake) throw new Error("Insufficient balance");
  const bet = {
    id:uid("b_"), type, outcome, stake, resolver,
    creatorUserId:user.id, createdAt:now(), expiresAt: now()+expiresIn*60*1000,
    participants:[{userId:user.id, side: sideForCreator, stake}],
    status:'OPEN', winnerSide:null
  };
  user.balance -= stake;
  d.bets.push(bet);
  write(d);
  notify(user.id, `Bet created with stake ${stake}`);
  return bet;
}
export function joinBet(betId, side){
  const d=db(), user=currentUser();
  if(!user) throw new Error("Connect wallet");
  const bet=getBet(betId);
  if(!bet || bet.status!=='OPEN') throw new Error("Bet not open");
  if (bet.participants.some(p=>p.userId===user.id)) throw new Error("Already in this bet");
  if (user.balance<bet.stake) throw new Error("Insufficient balance");
  user.balance -= bet.stake;
  bet.participants.push({userId:user.id, side, stake:bet.stake});
  bet.status='MATCHED';
  write(d);
  notify(user.id, `You joined a bet for ${bet.stake}`);
  notify(bet.creatorUserId, `Your bet was matched!`);
  return bet;
}
export function settleBet(betId, winnerSide=null){
  const d=db(), bet=getBet(betId);
  if(!bet) throw new Error("Bet not found");
  if(!['MATCHED','DISPUTED'].includes(bet.status)) throw new Error("Cannot settle now");
  // choose winner side if not given (AUTO)
  if(!winnerSide){
    const sides=bet.participants.map(p=>p.side);
    winnerSide = sides[Math.floor(Math.random()*sides.length)];
  }
  const pot = bet.participants.reduce((s,p)=>s+p.stake,0);
  const fee = Math.round(pot*0.01*100)/100;
  const payout = pot - fee;
  const winners = bet.participants.filter(p=>p.side===winnerSide);
  winners.forEach(w=>{
    const u = userById(w.userId);
    if (u) u.balance += payout / winners.length;
    notify(w.userId, `You won ${payout / winners.length} on bet ${bet.id}`);
  });
  d.treasury += fee;
  bet.status='SETTLED'; bet.winnerSide=winnerSide;
  write(d);
  return {payout, fee, winnerSide};
}
export function raiseDispute(betId, reason){
  const d=db(), user=currentUser(), bet=getBet(betId);
  if(!user) throw new Error("Connect wallet");
  if(!bet) throw new Error("Bet not found");
  const disp = {id:uid("d_"), betId, userId:user.id, reason, createdAt:now(), status:'OPEN'};
  d.disputes.push(disp);
  bet.status='DISPUTED';
  write(d);
  notify(bet.creatorUserId, "Your bet was disputed");
  return disp;
}
export function resolveDispute(disputeId, winnerSide){
  const d=db();
  const disp = d.disputes.find(x=>x.id===disputeId);
  if(!disp) throw new Error("Dispute not found");
  const bet=getBet(disp.betId);
  settleBet(bet.id, winnerSide);
  disp.status='RESOLVED';
  write(d);
}
export function myNotifications(){
  const d=db(), user=currentUser();
  return d.notifications.filter(n=>n.userId===user?.id).sort((a,b)=>b.createdAt-a.createdAt);
}
export function notify(userId, text){
  const d=db(); d.notifications.push({id:uid("n_"), userId, text, createdAt:now(), read:false}); write(d);
}
export function markAllRead(){
  const d=db(), user=currentUser(); d.notifications.forEach(n=>{if(n.userId===user?.id) n.read=true}); write(d);
}
export function isExpired(b){ return now() >= b.expiresAt; }
export function resetAll(){ write(structuredClone(defaultDB)); }
