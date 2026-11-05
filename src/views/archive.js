// Pattern 1 — List / Index, filtered to completed batches, plus a
// computed reimbursement summary (equal-split assumption — see README).
import { subscribeBatches, subscribeMembers, deleteBatch } from "../data.js";
import { escapeHtml, formatCurrency, formatDate, showToast } from "../util.js";
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
      <div class="ledger-block">
        <p class="ledger-title">Settlement — this round</p>
        <div class="row"><span>Total spent</span><span class="amount">${formatCurrency(batch.total)}</span></div>
        ${owing.map((s) => `
          <div class="row">
            <span>${escapeHtml(memberName(s.memberId))} owes${creditor ? ` ${escapeHtml(memberName(creditor.memberId))}` : ""}</span>
            <span class="amount">${formatCurrency(s.balance)}</span>
          </div>`).join("")}
        <p class="ledger-note">Split evenly across everyone who's joined — settle up in person.</p>
      </div>
    `;
  }

  function batchHtml(batch) {
    return `
      <div class="cat-group">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3)">
          <p class="list-label">Cleared — ${formatDate(batch.clearedAt)}</p>
          <button type="button" class="icon-btn" data-delete-batch="${batch.id}" aria-label="Delete this cleared round" style="width:32px;height:32px;min-width:32px;min-height:32px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7h12z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        ${summaryHtml(batch)}
        ${batch.items.map((i) => `
          <div class="item-row">
            <span style="flex:1">
              <span class="item-name is-done" style="display:block;font-size:14px">${escapeHtml(i.name)}</span>
              <span class="item-sub">${i.doneBy ? `Bought by ${escapeHtml(memberName(i.doneBy))}` : "Marked done"}</span>
            </span>
            ${i.costEstimate != null ? `<span class="amount" style="font-size:13px;font-weight:700;font-family:'IBM Plex Mono',monospace">${formatCurrency(i.costEstimate)}</span>` : ""}
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
        <div class="empty-wrap">
          <div class="empty-state">
            <p class="empty-title">Nothing cleared yet</p>
            <p>Once everything on the board is checked off, the round lands here with a cost summary.</p>
          </div>
        </div>`;
    }
    return batches.map(batchHtml).join("");
  }

  function paint() {
    app.innerHTML = `
      <div class="screen">
        <div class="topbar" style="display:block">
          <p class="mark">H7</p>
          <h1>Cleared rounds</h1>
          <p class="subtitle">Completed boards &amp; settlements</p>
        </div>
        <div class="content ruled-board">${contentHtml()}</div>
        ${bottomNavHtml("archive")}
      </div>
    `;
    attachHandlers();
  }

  function attachHandlers() {
    app.querySelectorAll("[data-delete-batch]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const batchId = btn.dataset.deleteBatch;
        const batch = (batches || []).find((b) => b.id === batchId);
        const label = batch ? `the round cleared ${formatDate(batch.clearedAt)}` : "this cleared round";
        if (!window.confirm(`Delete ${label}? This removes its items and settlement for good — it can't be undone.`)) return;
        btn.disabled = true;
        try {
          await deleteBatch(batchId);
          showToast("Cleared round deleted");
        } catch (err) {
          btn.disabled = false;
          showToast("Couldn't delete that — check your connection and try again.");
        }
      });
    });
  }

  paint();
  return () => { unsubBatches(); unsubMembers(); };
}
