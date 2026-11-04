// Pattern 1 — List / Index, filtered to completed batches, plus a
// computed reimbursement summary (equal-split assumption — see README).
import { subscribeBatches, subscribeMembers } from "../data.js";
import { escapeHtml, formatCurrency, formatDate } from "../util.js";
import { bottomNavHtml } from "./nav.js";

export function renderArchive() {
  const app = document.getElementById("app");
  let batches = null;
  let members = {};

  const unsubBatches = subscribeBatches((b) => { batches = b; paint(); });
  const unsubMembers = subscribeMembers((m) => { members = m; paint(); });

  function memberName(uid) {
    return members[uid]?.displayName || "Someone";
  }

  function summaryHtml(batch) {
    const owing = batch.settlement.filter((s) => s.balance > 0.01);
    const owed = batch.settlement.filter((s) => s.balance < -0.01);
    if (owing.length === 0 && owed.length === 0) return "";
    const creditor = owed[0];
    return `
      <div class="summary-card">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.04em;color:var(--accent-dark);text-transform:uppercase">Reimbursement — this batch</p>
        <div class="row"><span>Total spent</span><span style="font-weight:700">${formatCurrency(batch.total)}</span></div>
        <hr>
        ${owing.map((s) => `
          <div class="row" style="color:#3A4A44">
            <span>${escapeHtml(memberName(s.memberId))} owes${creditor ? ` ${escapeHtml(memberName(creditor.memberId))}` : ""}</span>
            <span style="font-weight:700">${formatCurrency(s.balance)}</span>
          </div>`).join("")}
        <p style="margin:4px 0 0;font-size:11px;color:#5B6E67">Split evenly across everyone who's joined — settle up in person.</p>
      </div>
    `;
  }

  function batchHtml(batch) {
    return `
      <div style="display:flex;flex-direction:column;gap:8px">
        <p class="section-label">Cleared — ${formatDate(batch.clearedAt)}</p>
        ${summaryHtml(batch)}
        ${batch.items.map((i) => `
          <div class="item-row">
            <span style="flex:1">
              <span class="item-name is-done" style="display:block;font-size:14px">${escapeHtml(i.name)}</span>
              <span class="item-sub">${i.doneBy ? `Bought by ${escapeHtml(memberName(i.doneBy))}` : "Marked done"}</span>
            </span>
            ${i.costEstimate != null ? `<span style="font-size:13px;font-weight:700;color:#55503F">${formatCurrency(i.costEstimate)}</span>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  function contentHtml() {
    if (batches === null) {
      return `<div class="skeleton"></div><div class="skeleton"></div>`;
    }
    if (batches.length === 0) {
      return `
        <div class="empty-state">
          <p style="font-size:15px;font-weight:600;color:var(--ink)">No cleared lists yet</p>
          <p>Once everything on the current list is checked off, it lands here with a cost summary.</p>
        </div>`;
    }
    return batches.map(batchHtml).join("");
  }

  function paint() {
    app.innerHTML = `
      <div class="screen">
        <div class="topbar" style="display:block">
          <h1>Archive</h1>
          <p class="subtitle">Completed lists &amp; reimbursements</p>
        </div>
        <div class="content">${contentHtml()}</div>
        ${bottomNavHtml("archive")}
      </div>
    `;
  }

  paint();
  return () => { unsubBatches(); unsubMembers(); };
}
