// Pattern 5 — Settings. One job: manage your own profile & notifications.
import { subscribeMembers, subscribeHousehold, setFinanceLead } from "../data.js";
import { logOut } from "../auth.js";
import { escapeHtml, showToast } from "../util.js";
import { bottomNavHtml } from "./nav.js";
import { enableNotifications } from "../push.js";

export function renderMe(currentUser) {
  const app = document.getElementById("app");
  let members = {};
  let household = null;

  const unsubMembers = subscribeMembers((m) => { members = m; paint(); });
  const unsubHousehold = subscribeHousehold((h) => { household = h; paint(); });

  function memberRow(uid) {
    const m = members[uid];
    if (!m) return "";
    const isLead = household?.financeLeadId === uid;
    return `
      <div class="item-row" style="cursor:default">
        <span class="avatar" aria-hidden="true">${escapeHtml(m.initial)}</span>
        <span style="flex:1">
          <span class="item-name" style="display:block">${escapeHtml(m.displayName)}${uid === currentUser.uid ? " (you)" : ""}</span>
          <span class="item-sub">${isLead ? "Handles finances" : ""}</span>
        </span>
        ${!isLead ? `<button type="button" class="btn-text" data-make-lead="${uid}" style="font-size:12px">Make finance lead</button>` : ""}
      </div>
    `;
  }

  function paint() {
    const ids = Object.keys(members);
    app.innerHTML = `
      <div class="screen">
        <div class="topbar" style="display:block">
          <h1>Me &amp; household</h1>
        </div>
        <div class="content">
          <div style="display:flex;flex-direction:column;gap:8px">
            <p class="section-label">Household members</p>
            ${ids.length ? ids.map(memberRow).join("") : '<p style="font-size:13px;color:var(--ink-faint)">No one has joined yet.</p>'}
          </div>

          <div style="display:flex;flex-direction:column;gap:12px">
            <p class="section-label">Notifications</p>
            <button type="button" id="enable-push" class="btn btn-secondary">Turn on push notifications</button>
            <p style="margin:0;font-size:12px;color:var(--ink-faint)">On iPhone, add this app to your home screen first (Share &rarr; Add to Home Screen) — otherwise push won't arrive.</p>
          </div>

          <button type="button" id="sign-out" class="btn btn-secondary">Sign out</button>
        </div>
        ${bottomNavHtml("me")}
      </div>
    `;
    attachHandlers();
  }

  function attachHandlers() {
    document.getElementById("sign-out").addEventListener("click", () => logOut());
    document.getElementById("enable-push").addEventListener("click", async () => {
      try {
        await enableNotifications(currentUser.uid);
        showToast("Notifications turned on for this device.");
      } catch (err) {
        showToast(err.message || "Couldn't turn on notifications.");
      }
    });
    app.querySelectorAll("[data-make-lead]").forEach((el) => {
      el.addEventListener("click", async () => {
        await setFinanceLead(el.dataset.makeLead);
      });
    });
  }

  paint();
  return () => { unsubMembers(); unsubHousehold(); };
}
