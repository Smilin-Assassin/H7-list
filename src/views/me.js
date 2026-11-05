// Pattern 5 — Settings. One job: manage your own profile & notifications.
import { subscribeMembers, subscribeHousehold, setFinanceLead, deleteMember } from "../data.js";
import { memberTagColor, escapeHtml, showToast } from "../util.js";
import { bottomNavHtml } from "./nav.js";
import { enableNotifications } from "../push.js";

export function renderMe(currentUser) {
  const app = document.getElementById("app");
  let members = null; // null = still loading, distinct from a genuinely empty household
  let household = null;

  const unsubMembers = subscribeMembers((m) => { members = m; paint(); });
  const unsubHousehold = subscribeHousehold((h) => { household = h; paint(); });

  function memberRow(uid) {
    const m = members[uid];
    if (!m) return "";
    const isLead = household?.financeLeadId === uid;
    return `
      <div class="item-row">
        <span class="tag" style="--tag-color:${memberTagColor(uid)}" aria-hidden="true">${escapeHtml(m.initial)}</span>
        <span style="flex:1">
          <span class="item-name" style="display:block">${escapeHtml(m.displayName)}${uid === currentUser.uid ? " (you)" : ""}</span>
          <span class="item-sub">${isLead ? "Handles finances" : ""}</span>
        </span>
        ${!isLead ? `<button type="button" class="btn-text" data-make-lead="${uid}" style="font-size:12px">Make finance lead</button>` : ""}
        <button type="button" class="btn-text" data-remove-member="${uid}" style="font-size:12px;color:var(--danger)">Remove</button>
      </div>
    `;
  }

  function membersHtml() {
    if (members === null) return `<div class="skeleton"></div><div class="skeleton"></div>`;
    const ids = Object.keys(members);
    if (ids.length === 0) return '<p style="font-size:13px;color:var(--ink-faint)">No one has joined yet.</p>';
    return ids.map(memberRow).join("");
  }

  function paint() {
    app.innerHTML = `
      <div class="screen">
        <div class="topbar" style="display:block">
          <p class="mark">H7</p>
          <h1>Me &amp; household</h1>
        </div>
        <div class="content">
          <div class="cat-group">
            <p class="list-label">Household members</p>
            ${membersHtml()}
          </div>

          <div class="cat-group" style="gap:12px">
            <p class="list-label">Notifications</p>
            <button type="button" id="enable-push" class="btn btn-secondary">Turn on push notifications</button>
            <p style="margin:0;font-size:12px;color:var(--ink-faint)">On iPhone, add this app to your home screen first (Share &rarr; Add to Home Screen) — otherwise push won't arrive.</p>
          </div>
        </div>
        ${bottomNavHtml("me")}
      </div>
    `;
    attachHandlers();
  }

  function attachHandlers() {
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
    app.querySelectorAll("[data-remove-member]").forEach((el) => {
      el.addEventListener("click", async () => {
        const uid = el.dataset.removeMember;
        const name = members?.[uid]?.displayName || "this member";
        if (!window.confirm(`Remove ${name} from H7? This can't be undone.`)) return;
        el.disabled = true;
        try {
          await deleteMember(uid);
          showToast(`${name} removed.`);
        } catch (err) {
          el.disabled = false;
          showToast("Couldn't remove that — check your connection and try again.");
        }
      });
    });
  }

  paint();
  return () => { unsubMembers(); unsubHousehold(); };
}
