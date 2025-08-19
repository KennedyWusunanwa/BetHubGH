import { $, $$, fmtMoney } from "./utils.js";
import { currentUser, logout, myNotifications, markAllRead } from "./db.js";

const Logo = () => `
<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Bet Hub GH">
  <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#g)"/>
  <path d="M8 20c6-1 8-9 16-8" stroke="#052e16" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M9 13h6v6H9z" fill="#052e16" opacity=".25" />
  <circle cx="24" cy="12" r="3" fill="#22c55e"/>
  <defs><linearGradient id="g" x1="2" y1="2" x2="30" y2="30">
    <stop stop-color="#4ade80"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs>
</svg>`;

const WalletIcon = () => `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M2 7h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2V7z" stroke="currentColor" stroke-width="1.6"/>
  <path d="M2 7V5a2 2 0 0 1 2-2h12" stroke="currentColor" stroke-width="1.6"/>
  <circle cx="18" cy="12" r="1.3" fill="currentColor"/>
</svg>`;

export function renderHeader(active=""){
  const user = currentUser();
  const navLinks = [
    ["index.html","Home"],["create.html","Create"],["dashboard.html","Dashboard"],
    ["disputes.html","Disputes"],["how-it-works.html","How it works"],["terms.html","Terms"]
  ];
  const nav = navLinks.map(([href,label]) =>
    `<a href="${href}" class="${active===label?'active':''}">${label}</a>`
  ).join("");

  const userUI = user ? `
    <div class="userbar">
      <span class="badge wallet truncate">${WalletIcon()} ${user.username} • ${fmtMoney(user.balance)}</span>
      <a class="btn ghost" href="connect.html" aria-label="Switch profile">Switch</a>
      <button class="btn secondary" id="btn-logout">Logout</button>
    </div>
  ` : `<a class="btn" href="connect.html">${WalletIcon()} Connect</a>`;

  const el = $(".header");
  if (!el) return; // safety if a page is missing the header tag

  el.innerHTML = `
    <div class="header-inner container">
      <button class="menu-toggle" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">
        <svg class="menu-icon" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="brand">
        ${Logo()}
        <div>Bet Hub GH <span class="tag">Prototype</span></div>
      </div>
      <nav class="nav primary">${nav}</nav>
      <div class="spacer"></div>
      <a href="dashboard.html#activity" title="Notifications" id="bell">🔔</a>
      ${userUI}
    </div>
    <nav id="mobileNav" class="mobile-nav">
      ${nav}
      <hr class="sep" style="margin:8px 0">
      <div>
        ${user ? `
          <div class="badge wallet" style="margin-bottom:8px">${user.username} • ${fmtMoney(user.balance)}</div>
          <a class="btn ghost" href="connect.html" style="margin-right:6px">Switch</a>
          <button class="btn secondary" id="btn-logout-m">Logout</button>
        ` : `<a class="btn" href="connect.html">${WalletIcon()} Connect</a>`}
      </div>
    </nav>
  `;

  // Logout (desktop + mobile)
  const logoutBtn = $("#btn-logout");
  const logoutBtnM = $("#btn-logout-m");
  [logoutBtn, logoutBtnM].forEach(b => b && b.addEventListener("click", ()=>{
    logout(); location.href="index.html";
  }));

  // Notification dot
  const bell = $("#bell");
  if (bell && user) {
    const unread = myNotifications().some(n=>!n.read);
    if (unread) bell.innerHTML = "🔔•";
    bell.addEventListener("click", ()=> markAllRead());
  }

  // Mobile menu toggle
  const menuBtn = $("#menuBtn");
  const mobileNav = $("#mobileNav");
  if (menuBtn && mobileNav){
    const closeMenu = () => {
      document.body.classList.remove("mobile-open");
      menuBtn.setAttribute("aria-expanded","false");
    };
    const openMenu = () => {
      document.body.classList.add("mobile-open");
      menuBtn.setAttribute("aria-expanded","true");
    };
    menuBtn.addEventListener("click", ()=>{
      const open = document.body.classList.contains("mobile-open");
      open ? closeMenu() : openMenu();
    });
    // Close when clicking a link
    mobileNav.addEventListener("click", (e)=>{
      if (e.target.tagName === "A") closeMenu();
    });
    // Close on resize to desktop
    window.addEventListener("resize", ()=>{
      if (window.innerWidth > 820) closeMenu();
    });
  }
}

export function renderFooter(){
  const f = $(".footer");
  if (!f) return;
  f.innerHTML = `
    <div class="footer-inner container">
      <div>© ${new Date().getFullYear()} Bet Hub GH. Demo only — not financial advice.</div>
      <div>Built for MVP prototyping. No real funds. Contact: hello@bethubgh.local</div>
    </div>`;
}

export function betCard(b){
  const sides = (b.participants||[]).map(p=>p.side).join(" vs ");
  const partCount = (b.participants||[]).length;
  const status = b.status || "OPEN";
  return `
    <article class="card">
      <div class="row" style="justify-content:space-between;align-items:center">
        <div class="row" style="align-items:center;gap:10px">
          <span class="badge">#${(b.id||"").toString().slice(-5)}</span>
          <strong>${b.type} • ${sides || '—'}</strong>
        </div>
        <span class="badge">${status}</span>
      </div>
      <p style="margin:10px 0;color:var(--muted)">${b.outcome}</p>
      <div class="row">
        <span class="badge">Stake: ${b.stake}</span>
        <span class="badge">Participants: ${partCount}</span>
      </div>
      <div style="margin-top:12px">
        <a class="btn secondary" href="bet.html?id=${b.id}">View</a>
      </div>
    </article>
  `;
}
