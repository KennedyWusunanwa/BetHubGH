import { createUser, currentUser } from "../db.js";
import { $, on, uid } from "../utils.js";

const form = $("#connect-form");
const addrEl = $("#addr");

$("#gen").addEventListener("click", ()=>{
  addrEl.value = "0x" + uid("").slice(0,10) + uid("").slice(-6);
});

on(form,"submit",(e)=>{
  e.preventDefault();
  try{
    const username = form.username.value.trim();
    const addr = form.addr.value.trim();
    const isAdmin = form.isAdmin.checked;
    if(!username || !addr) throw new Error("Enter username and address (simulated).");
    createUser({username, addr, isAdmin});
    location.href="index.html";
  }catch(err){
    $("#msg").textContent = err.message;
  }
});

// If already logged in, prefill
const user = currentUser();
if (user){ $("#prefill").textContent = `Signed in as ${user.username}. You can create a new local profile here.`; }
