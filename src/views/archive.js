// Pattern 1 — List / Index, filtered to completed batches, plus a
// computed reimbursement summary (equal-split assumption — see README).
import { subscribeBatches, subscribeMembers, deleteBatch, updateBatchItemCost } from "../data.js";
import { escapeHtml, formatCurrency, formatDate, showToast } from "../util.js";
import { bottomNavHtml } from "./nav.js";

export function renderArchive() {
  const app = document.getElementById("app");
  let batches = null;
  let members = {};
  // Which cleared item's price is currently open for editing, if any —
  // at most one at a time, since it's an inline field, not a modal.
  let editing = null; // { batchId, itemId }

  const unsubBatches = subscribeBatches((b) => { batches = b; paint(); });
  const unsubMembers = subscribeMembers((m) => { members = m; paint(); });

  function memberName(uid) {
    return members[uid]?.displayName || "Someone";
  }

  function summaryHtml(batch) {
    // Plain totals, no computed "X owes Y" split — read straight off
    // batch.items (doneBy + costEstimate per item) so it also works for
    // rounds cleared before this changed.
    const totalsByMember = {};
    let total = 0;
    (batch.items || []).forEach((i) => {
      if (i.costEstimate) {
        total += i.costEstimate;
        if (i.doneBy) totalsByMember[i.doneBy] = (totalsByMember[i.doneBy] || 0) + i.costEstimate;
      }
    });
    const paidRows = Object.entries(totalsByMember).sort((a, b) => b[1] - a[1]);
    if (total === 0) return "";
    return `
      <div class="ledger-block">
        <p class="ledger-title">This round</p>
        <div class="row"><span>Total spent</span><span class="amount">${formatCurrency(total)}</span></div>
        ${paidRows.map(([uid, paid]) => `
          <div class="row">
            <span>${escapeHtml(memberName(uid))} paid</span>
            <span class="amount">${formatCurrency(paid)}</span>
          </div>`).join("")}
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
        ${batch.items.map((i) => itemRowHtml(batch.id, i)).join("")}
      </div>
    `;
  }

  function itemRowHtml(batchId, i) {
    const isEditing = editing && editing.batchId === batchId && editing.itemId === i.id;
    return `
      <div class="item-row">
        <span style="flex:1">
          <span class="item-name is-done" style="display:block;font-size:14px">${escapeHtml(i.name)}</span>
          <span class="item-sub">${i.doneBy ? `Bought by ${escapeHtml(memberName(i.doneBy))}` : "Marked done"}</span>
        </span>
        ${isEditing ? `
          <span style="display:flex;align-items:center;gap:6px">
            <input type="text" inputmode="decimal" class="cost-edit-input" data-cost-input="${i.id}"
              value="${i.costEstimate != null ? i.costEstimate : ""}" placeholder="0.00"
              style="width:72px;font-family:'IBM Plex Mono',monospace;font-size:13px" autofocus>
            <button type="button" class="btn-text" data-save-cost="${batchId}:${i.id}" style="font-size:12px">Save</button>
          </span>
        ` : `
          <button type="button" class="btn-text" data-edit-cost="${batchId}:${i.id}"
            style="font-size:13px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:var(--ink)">
            ${i.costEstimate != null ? formatCurrency(i.costEstimate) : "Add price"}
          </button>
        `}
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
            <p>Once you mark bought items as paid on the board, they land here with a cost summary.</p>
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

    app.querySelectorAll("[data-edit-cost]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [batchId, itemId] = btn.dataset.editCost.split(":");
        editing = { batchId, itemId };
        paint();
        const input = app.querySelector(`[data-cost-input="${itemId}"]`);
        if (input) { input.focus(); input.select(); }
      });
    });

    app.querySelectorAll("[data-cost-input]").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveCostEdit(input.dataset.costInput);
        if (e.key === "Escape") { editing = null; paint(); }
      });
    });

    app.querySelectorAll("[data-save-cost]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [, itemId] = btn.dataset.saveCost.split(":");
        saveCostEdit(itemId);
      });
    });
  }

  async function saveCostEdit(itemId) {
    if (!editing || editing.itemId !== itemId) return;
    const { batchId } = editing;
    const input = app.querySelector(`[data-cost-input="${itemId}"]`);
    const raw = input ? input.value.trim() : "";
    const parsed = raw ? parseFloat(raw) : null;
    const costEstimate = Number.isFinite(parsed) ? parsed : null;
    editing = null;
    try {
      await updateBatchItemCost(batchId, itemId, costEstimate);
      showToast("Price updated.");
    } catch (err) {
      showToast("Couldn't update that price — check your connection and try again.");
    }
    paint();
  }

  paint();
  return () => { unsubBatches(); unsubMembers(); };
}
